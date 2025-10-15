package middleware

import (
	"context"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ksha23/CS407-FactSnap/internal/adapter/ginhttp"
	"log/slog"
	"time"
)

func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		// attach request id to context
		requestID := uuid.New()
		c.Request = c.Request.WithContext(context.WithValue(c.Request.Context(),
			ginhttp.RequestIDKey, requestID,
		))

		start := time.Now()
		path := c.Request.URL.Path
		raw := c.Request.URL.RawQuery

		// Process request
		c.Next()

		level := getLogLevel(c)

		// Fill the params
		param := gin.LogFormatterParams{}
		param.TimeStamp = time.Now() // Stop timer
		param.Latency = param.TimeStamp.Sub(start)
		if param.Latency > time.Minute {
			param.Latency = param.Latency.Truncate(time.Second)
		}
		param.ClientIP = c.ClientIP()
		param.Method = c.Request.Method
		param.StatusCode = c.Writer.Status()
		if raw != "" {
			path = path + "?" + raw
		}
		param.Path = path

		// Extra info
		host := c.Request.Host
		route := c.FullPath()
		referer := c.Request.Referer()

		requestAttrs := []slog.Attr{
			slog.String("method", param.Method),
			slog.String("host", host),
			slog.String("path", param.Path),
			slog.String("query", raw),
			slog.String("route", route),
			slog.String("client_ip", param.ClientIP),
			slog.String("referer", referer),
		}

		responseAttrs := []slog.Attr{
			slog.Int("status_code", param.StatusCode),
			slog.String("latency", param.Latency.String()),
		}

		slog.Log(c.Request.Context(), level, "incoming request", "request", requestAttrs, "response", responseAttrs)
	}
}

func getLogLevel(c *gin.Context) slog.Level {
	if len(c.Errors.Errors()) > 0 || c.Writer.Status() >= 500 {
		return slog.LevelError
	}

	return slog.LevelInfo
}
