package application

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ksha23/CS407-FactSnap/internal/adapter/ginhttp"
	"github.com/ksha23/CS407-FactSnap/internal/adapter/postgres"
	"github.com/ksha23/CS407-FactSnap/internal/clerk"
	"github.com/ksha23/CS407-FactSnap/internal/config"
	"github.com/ksha23/CS407-FactSnap/internal/core/port"
	"golang.org/x/sync/errgroup"
)

type App struct {
	Config config.Config
	Logger *slog.Logger

	// primary adapters
	GinServer *ginhttp.Server

	// secondary adapters
	PostgresDB *pgxpool.Pool

	// services
	AuthService         port.AuthService
	UserService         port.UserService
	QuestionService     port.QuestionService
	ResponseService     port.ResponseService
	MediaService        port.MediaService
	NotificationService port.NotificationService

	// repos
	UserRepo     port.UserRepository
	QuestionRepo port.QuestionRepo
	ResponseRepo port.ResponseRepo

	// clients
	MediaClient port.MediaClient
	AIClient    port.AIClient

	// third-party integrations
	ClerkClient clerk.Client

	Closers []func() error
}

func New(config config.Config) (*App, error) {
	app := &App{Config: config}

	// init logger
	if err := app.initLogger(); err != nil {
		return nil, fmt.Errorf("error initializing logger: %w", err)
	}

	// init postgres
	if err := app.initPostgres(); err != nil {
		return nil, fmt.Errorf("error initializing Postgres: %w", err)
	}

	// run postgres migrations
	if err := postgres.RunMigrations(app.PostgresDB); err != nil {
		return nil, fmt.Errorf("error running migrations on Postgres: %w", err)
	}

	// init dependencies (secondary adapters + core services)
	if err := app.initDependencies(); err != nil {
		return nil, fmt.Errorf("error initializing deps: %w", err)
	}

	// init primary adapters
	// gin server
	if err := app.initGinServer(); err != nil {
		return nil, fmt.Errorf("error initializing Gin HTTP server: %w", err)
	}

	return app, nil
}

func (app *App) Run(ctx context.Context) error {
	// always shutdown the application on function exit
	defer app.Shutdown()

	// Note: gCtx will be canceled the moment a function returns a non-nil error OR the parent context is canceled.
	// So this assumes that all functions below will respect the context. If they don't, then the grouper may wait indefinitely.
	// Additionally, if more than one function returns an error, the grouper will only return the first error.
	grouper, gCtx := errgroup.WithContext(ctx)

	// start gin  server
	grouper.Go(func() error {
		if err := app.GinServer.Run(gCtx); err != nil {
			return fmt.Errorf("error has occurred while running Gin HTTP server: %w", err)
		}
		return nil
	})

	if err := grouper.Wait(); err != nil {
		return err
	}

	return nil
}

func (app *App) Shutdown() {
	for _, closer := range app.Closers {
		if closer == nil {
			continue
		}
		if err := closer(); err != nil {
			slog.Error("An error has occurred during application shutdown", "error", err)
		}
	}
}
