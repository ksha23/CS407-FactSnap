package application

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/ksha23/CS407-FactSnap/internal/adapter/ginhttp"
	"github.com/ksha23/CS407-FactSnap/internal/adapter/ginhttp/middleware"
	"github.com/ksha23/CS407-FactSnap/internal/adapter/openai"
	"github.com/ksha23/CS407-FactSnap/internal/adapter/postgres"
	"github.com/ksha23/CS407-FactSnap/internal/adapter/s3"
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
	s3Client, err := s3.NewClient(app.Config.S3)
	if err != nil {
		return fmt.Errorf("error initializing S3 media client: %w", err)
	}
	app.MediaClient = s3Client
	app.AIClient = openai.NewClient(app.Config.OpenAI)

	// register repos
	app.UserRepo = postgres.NewUserRepo(app.PostgresDB)
	app.QuestionRepo = postgres.NewQuestionRepo(app.PostgresDB)
	app.ResponseRepo = postgres.NewResponseRepo(app.PostgresDB)

	// register services
	app.AuthService = service.NewAuthService(app.ClerkClient, app.UserRepo)
	app.UserService = service.NewUserService(app.UserRepo)
	app.MediaService = service.NewMediaService(app.MediaClient)
	app.QuestionService = service.NewQuestionService(app.QuestionRepo, app.MediaService)
	app.ResponseService = service.NewResponseService(app.QuestionService, app.MediaService, app.ResponseRepo, app.AIClient)

	return nil
}

func (app *App) initGinServer() error {
	const (
		maxRequestSize         = 25 * 1024 * 1024 // 25 MB
		requestTimeoutDuration = 20 * time.Second
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
	userHandler := ginhttp.NewUserHandler(app.UserService)
	questionHandler := ginhttp.NewQuestionHandler(app.QuestionService)
	responseHandler := ginhttp.NewResponseHandler(app.ResponseService)
	mediaHandler := ginhttp.NewMediaHandler(app.MediaService)

	// register router
	router := gin.New()

	// register middlewares
	router.Use(middleware.MaxRequestSize(maxRequestSize))
	router.Use(middleware.Logger())
	router.Use(middleware.Recovery())
	router.Use(middleware.Error())
	router.Use(middleware.Timeout(requestTimeoutDuration))
	router.Use(middleware.ClerkAuth(app.AuthService)) // all routes will be protected

	// setup no router handler
	router.NoRoute(mainHandler.NoRoute)

	// setup health routes
	router.GET("/", mainHandler.Healthcheck)
	router.GET("/health", mainHandler.Healthcheck)

	baseRouter := router.Group(baseUrl)

	// register routes
	mainHandler.RegisterRoutes(baseRouter)
	authHandler.RegisterRoutes(baseRouter)
	userHandler.RegisterRoutes(baseRouter)
	questionHandler.RegisterRoutes(baseRouter)
	responseHandler.RegisterRoutes(baseRouter)
	mediaHandler.RegisterRoutes(baseRouter)

	// init gin server
	server, err := ginhttp.NewServer(baseUrl, port, config.IsLocal(app.Config.Env), router)
	if err != nil {
		return fmt.Errorf("error instantiating Gin HTTP server: %w", err)
	}
	app.GinServer = server

	return nil
}
