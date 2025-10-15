package config

import (
	"fmt"
	"strings"
)

type Env string

const (
	EnvUnknown Env = "Unknown"
	EnvLocal   Env = "Local"
	EnvProd    Env = "Prod"
)

var envValues = map[string]Env{
	"local": EnvLocal,
	"prod":  EnvProd,
}

func ParseEnv(name string) (Env, error) {
	if env, ok := envValues[strings.ToLower(name)]; ok {
		return env, nil
	}
	return EnvUnknown, fmt.Errorf("%s is not a valid environment", name)
}
