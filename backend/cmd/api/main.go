package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/ksha23/CS407-FactSnap/internal/application"
	"github.com/ksha23/CS407-FactSnap/internal/config"
)

func main() {
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()

	cfg, err := config.Load("/Users/haeseungpyun/Desktop/CS407-FactSnap/backend")
	if err != nil {
		slog.Error("Error loading config file", "error", err)
		os.Exit(1)
	}
	if config.IsLocal(cfg.Env) {
		slog.Info(fmt.Sprintf("Parsed config: %+v", cfg))
	}

	app, err := application.New(*cfg)
	if err != nil {
		slog.Error("Error instantiating a new application", "error", err)
		os.Exit(1)
	}

	if err := app.Run(ctx); err != nil {
		slog.Error("Error while running application", "error", err)
		os.Exit(1)
	}

	os.Exit(0)
}
