package ginhttp

import (
	"context"
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/validator/v10"
	"log/slog"
	"net/http"
	"time"
)

type Server struct {
	httpServer *http.Server
	// BaseURL is the v1 base url
	BaseURL string
	Port    string
	Router  *gin.Engine
}

func NewServer(baseURL string, port string, isLocal bool, router *gin.Engine) (*Server, error) {
	server := &Server{
		BaseURL: baseURL,
		Port:    port,
		Router:  router,
	}

	// set mode based on env
	if isLocal {
		gin.SetMode(gin.DebugMode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

	// register custom field validations
	v, ok := binding.Validator.Engine().(*validator.Validate)
	if !ok {
		return nil, errors.New("could not get validator engine")
	}
	registerValidations(v)

	// init underlying http server
	server.httpServer = &http.Server{
		Addr:           fmt.Sprintf(":%s", server.Port),
		Handler:        server.Router,
		ReadTimeout:    20 * time.Second,
		WriteTimeout:   20 * time.Second,
		MaxHeaderBytes: 1 << 20,
	}

	return server, nil
}

func (server *Server) Run(ctx context.Context) error {
	errChan := make(chan error)

	// start the server in a goroutine so that it won't block graceful shutdown handling below
	go func() {
		slog.Info("Started Gin HTTP server", "port", server.Port)
		err := server.httpServer.ListenAndServe()
		if err != nil {
			if !errors.Is(err, http.ErrServerClosed) {
				//if there is an error unrelated to server shutdown
				errChan <- err
				return
			}
		}
	}()

	select {
	case err := <-errChan:
		return err
	case <-ctx.Done():
		// Listen for interrupt signal
		if err := server.Shutdown(); err != nil {
			return err
		}
	}

	return nil
}

func (server *Server) Shutdown() error {
	slog.Info("Gin HTTP Server shutting down gracefully.. press Ctrl+C again to force exit")

	// allow up to 10 seconds for graceful shutdown
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.httpServer.Shutdown(ctx); err != nil {
		return fmt.Errorf("error shutting down Gin HTTP server: %w", err)
	}

	slog.Info("Gin HTTP Server exiting...")
	return nil
}
