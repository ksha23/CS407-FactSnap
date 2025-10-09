package config

import (
	"errors"
	"fmt"
	"github.com/spf13/viper"
)

type Config struct {
	Name     string   `mapstructure:"name"`
	Env      Env      `mapstructure:"environment"`
	Server   Server   `mapstructure:"server"`
	Postgres Postgres `mapstructure:"postgres"`
	Clerk    Clerk    `mapstructure:"clerk"`
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

func Load(path string) (*Config, error) {
	viper.AddConfigPath(path)
	viper.SetConfigName(".env")
	viper.SetConfigType("env")
	if err := viper.ReadInConfig(); err != nil {
		return nil, fmt.Errorf("could not read .env file: %w", err)
	}
	configFile := viper.GetString("CONFIG_FILE")
	viper.Reset()
	if configFile == "" {
		return nil, errors.New("CONFIG_FILE is not set in .env file")
	}
	viper.SetConfigFile(fmt.Sprintf("%s%s", path, configFile))

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

	return config, nil
}

func IsLocal(env Env) bool {
	return env == EnvLocal
}

func IsProd(env Env) bool {
	return env == EnvProd
}
