package config

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/ksha23/CS407-FactSnap/internal/uploadthing"
	"github.com/spf13/viper"
)

type Config struct {
	Name     string   `mapstructure:"name"`
	Env      Env      `mapstructure:"environment"`
	Server   Server   `mapstructure:"server"`
	Postgres Postgres `mapstructure:"postgres"`
	Clerk    Clerk    `mapstructure:"clerk"`
	Upload   Upload   `mapstructure:"uploadthing"`
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

type Upload struct {
	SecretKey  string `mapstructure:"secretKey"`
	AppID      string `mapstructure:"appId"`
	BaseURL    string `mapstructure:"baseUrl"`
	CDNBaseURL string `mapstructure:"cdnBaseUrl"`
}

func Load(path string) (*Config, error) {
	viper.AddConfigPath(path)
	viper.SetConfigName(".env")
	viper.SetConfigType("env")
	if err := viper.ReadInConfig(); err != nil {
		return nil, fmt.Errorf("could not read .env file: %w", err)
	}
	clerkSecret := cleanConfigValue(viper.GetString("CLERK_SECRET_KEY"))
	uploadSecret := cleanConfigValue(viper.GetString("UPLOADTHING_SECRET_KEY"))
	uploadAppID := cleanConfigValue(viper.GetString("UPLOADTHING_APP_ID"))
	uploadBaseURL := cleanConfigValue(viper.GetString("UPLOADTHING_BASE_URL"))
	uploadCDNBaseURL := cleanConfigValue(viper.GetString("UPLOADTHING_CDN_BASE_URL"))
	configFile := cleanConfigValue(viper.GetString("CONFIG_FILE"))
	if clerkSecret != "" {
		_ = os.Setenv("CLERK_SECRET_KEY", clerkSecret)
	}
	if uploadSecret != "" {
		_ = os.Setenv("UPLOADTHING_SECRET_KEY", uploadSecret)
	}
	if uploadAppID != "" {
		_ = os.Setenv("UPLOADTHING_APP_ID", uploadAppID)
	}
	if uploadBaseURL != "" {
		_ = os.Setenv("UPLOADTHING_BASE_URL", uploadBaseURL)
	}
	if uploadCDNBaseURL != "" {
		_ = os.Setenv("UPLOADTHING_CDN_BASE_URL", uploadCDNBaseURL)
	}
	viper.Reset()
	if configFile == "" {
		return nil, errors.New("CONFIG_FILE is not set in .env file")
	}
	configPath := configFile
	if !filepath.IsAbs(configFile) {
		configPath = filepath.Join(path, configFile)
	}
	viper.SetConfigFile(configPath)

	if err := viper.ReadInConfig(); err != nil {
		return nil, fmt.Errorf("could not read config file: %w", err)
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

	config.Clerk.SecretKey = firstNonEmpty(cleanAndExpand(config.Clerk.SecretKey), clerkSecret, os.Getenv("CLERK_SECRET_KEY"))

	config.Upload.SecretKey = firstNonEmpty(cleanAndExpand(config.Upload.SecretKey), uploadSecret, os.Getenv("UPLOADTHING_SECRET_KEY"))
	config.Upload.AppID = firstNonEmpty(cleanAndExpand(config.Upload.AppID), uploadAppID, os.Getenv("UPLOADTHING_APP_ID"))
	config.Upload.BaseURL = firstNonEmpty(cleanAndExpand(config.Upload.BaseURL), uploadBaseURL, os.Getenv("UPLOADTHING_BASE_URL"))
	config.Upload.CDNBaseURL = firstNonEmpty(cleanAndExpand(config.Upload.CDNBaseURL), uploadCDNBaseURL, os.Getenv("UPLOADTHING_CDN_BASE_URL"))

	if config.Upload.BaseURL == "" {
		config.Upload.BaseURL = uploadthing.DefaultAPIBaseURL
	}

	if config.Upload.CDNBaseURL == "" {
		config.Upload.CDNBaseURL = uploadthing.DefaultCDNBaseURL
	}

	return config, nil
}

func IsLocal(env Env) bool {
	return env == EnvLocal
}

func IsProd(env Env) bool {
	return env == EnvProd
}

func cleanConfigValue(value string) string {
	return strings.Trim(strings.TrimSpace(value), "\"'")
}

func cleanAndExpand(value string) string {
	clean := cleanConfigValue(value)
	if clean == "" {
		return ""
	}
	return os.ExpandEnv(clean)
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if strings.TrimSpace(v) != "" {
			return strings.TrimSpace(v)
		}
	}
	return ""
}
