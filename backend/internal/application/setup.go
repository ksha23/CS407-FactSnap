package application

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/ksha23/CS407-FactSnap/internal/adapter/ginhttp"
	"github.com/ksha23/CS407-FactSnap/internal/adapter/ginhttp/middleware"
	"github.com/ksha23/CS407-FactSnap/internal/adapter/postgres"
	"github.com/ksha23/CS407-FactSnap/internal/clerk"
	"github.com/ksha23/CS407-FactSnap/internal/config"
	"github.com/ksha23/CS407-FactSnap/internal/core/service"
	"github.com/ksha23/CS407-FactSnap/internal/logger"
	"github.com/lmittmann/tint"
	"log/slog"
	"os"
	"time"
)

func (app *App) initLogger() error {
	globalAttrs := []slog.Attr{
		slog.String("environment", string(app.Config.Env)),
	}

	var handler slog.Handler
	if !config.IsProd(app.Config.Env) {
		handler = tint.NewHandler(os.Stdout, &tint.Options{
			Level:      slog.LevelDebug,
			TimeFormat: time.DateTime,
		}).WithAttrs(globalAttrs)
	} else {
		handler = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
			Level: slog.LevelError,
		}).WithAttrs(globalAttrs)
	}

	l := slog.New(logger.NewCtxHandler(handler))
	slog.SetDefault(l)
	app.Logger = l
	return nil
}

func (app *App) initPostgres() error {
	db, err := postgres.Connect(app.Config.Postgres)
	if err != nil {
		return err
	}
	app.PostgresDB = db

	closer := func() error {
		slog.Info("Shutting down Postgres...")
		app.PostgresDB.Close()
		return nil
	}
	app.Closers = append(app.Closers, closer)

	return nil
}

func (app *App) initDependencies() error {
	// register clients
	app.ClerkClient = clerk.NewClient(app.Config.Clerk.SecretKey)

	// register repos
	app.UserRepo = postgres.NewUserRepo(app.PostgresDB)

	// register services
	app.AuthService = service.NewAuthService(app.ClerkClient, app.UserRepo)

	return nil
}

func (app *App) initGinServer() error {
	const (
		// maxRequestSize is the max bytes size on request payloads
		maxRequestSize = 2 * 1024 * 1024 // 2 MB
	)

	baseUrl := fmt.Sprintf("/%s", app.Config.Server.BaseURL)
	port := app.Config.Server.Port

	// register logger context keys
	logger.AddContextKey(
		ginhttp.RequestIDKey,
		ginhttp.RequestUserIDKey,
	)

	// register handlers
	mainHandler := ginhttp.NewMainHandler()
	authHandler := ginhttp.NewAuthHandler(app.AuthService)

	// register router
	router := gin.New()

	// register middlewares
	router.Use(middleware.MaxRequestSize(maxRequestSize))
	router.Use(middleware.Logger())
	router.Use(middleware.Recovery())
	router.Use(middleware.Error())
	router.Use(middleware.Timeout(app.Config.Server.RequestTimeoutDuration))

	// setup no router handler
	router.NoRoute(mainHandler.NoRoute)

	// setup health routes
	router.GET("/", mainHandler.Healthcheck)
	router.GET("/health", mainHandler.Healthcheck)

	baseRouter := router.Group(baseUrl)

	// register routes
	clerkAuthMiddleware := middleware.ClerkAuth(app.AuthService)

	mainHandler.RegisterRoutes(baseRouter)
	authHandler.RegisterRoutes(baseRouter, clerkAuthMiddleware)

	// init gin server
	server, err := ginhttp.NewServer(baseUrl, port, config.IsLocal(app.Config.Env), router)
	if err != nil {
		return fmt.Errorf("error instantiating Gin HTTP server: %w", err)
	}
	app.GinServer = server

	return nil
}
