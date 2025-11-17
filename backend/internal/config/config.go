package config

import (
	"errors"
	"fmt"
	"os"
	"regexp"
	"strings"

	"github.com/spf13/viper"
)

type Config struct {
	Name     string   `mapstructure:"name"`
	Env      Env      `mapstructure:"environment"`
	Server   Server   `mapstructure:"server"`
	Postgres Postgres `mapstructure:"postgres"`
	Clerk    Clerk    `mapstructure:"clerk"`
	S3       S3       `mapstructure:"s3"`
}

type Server struct {
	Port    string `mapstructure:"port"`
	BaseURL string `mapstructure:"baseUrl"`
}

type Postgres struct {
	Host     string `mapstructure:"host"`
	Port     string `mapstructure:"port"`
	User     string `mapstructure:"user"`
	Password string `mapstructure:"password"`
	Name     string `mapstructure:"name"`
	SSLMode  string `mapstructure:"sslmode"`
}

type Clerk struct {
	SecretKey string `mapstructure:"secretKey"`
}

type S3 struct {
	Bucket          string `mapstructure:"bucket"`
	Region          string `mapstructure:"region"`
	Endpoint        string `mapstructure:"endpoint"`
	AccessKeyID     string `mapstructure:"accessKeyId"`
	SecretAccessKey string `mapstructure:"secretAccessKey"`
	SessionToken    string `mapstructure:"sessionToken"`
	UsePathStyle    bool   `mapstructure:"usePathStyle"`
	CDNBaseURL      string `mapstructure:"cdnBaseUrl"`
	PresignDuration string `mapstructure:"presignDuration"`
}

const (
	defaultS3PresignDuration = "15m"
)

func Load(path string) (*Config, error) {
	// Read .env file first and store values
	envViper := viper.New()
	envViper.AddConfigPath(path)
	envViper.SetConfigName(".env")
	envViper.SetConfigType("env")
	if err := envViper.ReadInConfig(); err != nil {
		return nil, fmt.Errorf("could not read .env file: %w", err)
	}
	configFile := envViper.GetString("CONFIG_FILE")
	if configFile == "" {
		return nil, errors.New("CONFIG_FILE is not set in .env file")
	}

	// Now read YAML config file
	viper.Reset()
	viper.SetConfigFile(fmt.Sprintf("%s%s", path, configFile))

	// Bind environment variables
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.AutomaticEnv()

	if err := viper.ReadInConfig(); err != nil {
		return nil, fmt.Errorf("could not read config file: %w", err)
	}

	// Store .env values in main viper for later use
	envVars := []string{
		"CLERK_SECRET_KEY",
		"S3_BUCKET",
		"S3_REGION",
		"S3_ACCESS_KEY_ID",
		"S3_SECRET_ACCESS_KEY",
		"S3_SESSION_TOKEN",
		"S3_ENDPOINT",
		"S3_USE_PATH_STYLE",
		"S3_CDN_BASE_URL",
		"S3_PRESIGN_DURATION",
	}
	for _, key := range envVars {
		if envViper.IsSet(key) {
			viper.Set(key, envViper.GetString(key))
		}
	}

	config := new(Config)
	if err := viper.Unmarshal(config); err != nil {
		return nil, fmt.Errorf("could not unmarshal config file into struct: %w", err)
	}

	env, err := ParseEnv(viper.GetString("environment"))
	if err != nil {
		return nil, fmt.Errorf("unsupported environment: %w", err)
	}
	config.Env = env

	// Replace environment variable placeholders in string fields using viper
	config.Clerk.SecretKey = replaceEnvVarsFromViper(config.Clerk.SecretKey, "clerk.secretKey", "CLERK_SECRET_KEY")
	config.S3.Bucket = replaceEnvVarsFromViper(config.S3.Bucket, "s3.bucket", "S3_BUCKET")
	config.S3.Region = replaceEnvVarsFromViper(config.S3.Region, "s3.region", "S3_REGION")
	config.S3.AccessKeyID = replaceEnvVarsFromViper(config.S3.AccessKeyID, "s3.accessKeyId", "S3_ACCESS_KEY_ID")
	config.S3.SecretAccessKey = replaceEnvVarsFromViper(config.S3.SecretAccessKey, "s3.secretAccessKey", "S3_SECRET_ACCESS_KEY")
	config.S3.SessionToken = replaceEnvVarsFromViper(config.S3.SessionToken, "s3.sessionToken", "S3_SESSION_TOKEN")
	config.S3.Endpoint = replaceEnvVarsFromViper(config.S3.Endpoint, "s3.endpoint", "S3_ENDPOINT")
	config.S3.CDNBaseURL = replaceEnvVarsFromViper(config.S3.CDNBaseURL, "s3.cdnBaseUrl", "S3_CDN_BASE_URL")
	config.S3.PresignDuration = replaceEnvVarsFromViper(config.S3.PresignDuration, "s3.presignDuration", "S3_PRESIGN_DURATION")

	if config.S3.CDNBaseURL != "" {
		config.S3.CDNBaseURL = strings.TrimRight(config.S3.CDNBaseURL, "/")
	}
	if config.S3.PresignDuration == "" {
		config.S3.PresignDuration = defaultS3PresignDuration
	}

	// Handle usePathStyle from environment variable
	if viper.IsSet("s3.usePathStyle") {
		config.S3.UsePathStyle = viper.GetBool("s3.usePathStyle")
	} else if viper.IsSet("S3_USE_PATH_STYLE") {
		config.S3.UsePathStyle = viper.GetBool("S3_USE_PATH_STYLE")
	}

	return config, nil
}

func IsLocal(env Env) bool {
	return env == EnvLocal
}

func IsProd(env Env) bool {
	return env == EnvProd
}

// replaceEnvVarsFromViper replaces ${VAR} patterns with values from viper (which reads .env file) or environment variables
func replaceEnvVarsFromViper(value string, viperKey string, envKey string) string {
	if value == "" {
		return value
	}

	// Pattern to match ${VAR} or ${VAR:default}
	re := regexp.MustCompile(`\$\{([^}:]+)(?::([^}]*))?\}`)

	// If the value is exactly ${VAR}, try to get from viper or environment
	if re.MatchString(value) {
		// Try viper first (reads from .env file)
		if viper.IsSet(viperKey) {
			viperValue := viper.GetString(viperKey)
			if viperValue != "" && !strings.HasPrefix(viperValue, "${") {
				return strings.Trim(viperValue, "'\"")
			}
		}

		// Try environment variable
		envValue := os.Getenv(envKey)
		if envValue != "" {
			// Remove quotes if present
			envValue = strings.Trim(envValue, "'\"")
			return envValue
		}

		// Try viper with env key
		if viper.IsSet(envKey) {
			viperValue := viper.GetString(envKey)
			if viperValue != "" {
				viperValue = strings.Trim(viperValue, "'\"")
				return viperValue
			}
		}

		// Extract default value if present
		matches := re.FindStringSubmatch(value)
		if len(matches) > 2 && matches[2] != "" {
			return matches[2]
		}

		return ""
	}

	// If value contains ${VAR} pattern, replace it
	return re.ReplaceAllStringFunc(value, func(match string) string {
		matches := re.FindStringSubmatch(match)
		if len(matches) < 2 {
			return match
		}

		varName := matches[1]
		defaultValue := ""
		if len(matches) > 2 {
			defaultValue = matches[2]
		}

		// Try environment variable first
		envValue := os.Getenv(varName)
		if envValue != "" {
			envValue = strings.Trim(envValue, "'\"")
			return envValue
		}

		// Try viper
		if viper.IsSet(varName) {
			viperValue := viper.GetString(varName)
			if viperValue != "" {
				viperValue = strings.Trim(viperValue, "'\"")
				return viperValue
			}
		}

		return defaultValue
	})
}
