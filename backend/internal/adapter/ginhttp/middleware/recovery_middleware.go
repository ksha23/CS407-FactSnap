package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/ksha23/CS407-FactSnap/internal/adapter/ginhttp"
	"log/slog"
)

func Recovery() gin.HandlerFunc {
	return gin.CustomRecovery(func(c *gin.Context, err any) {
		attrs := append([]slog.Attr{
			{
				Key: "internal",
				Value: slog.GroupValue([]slog.Attr{
					slog.Any("msg", err),
				}...),
			},
		})
		slog.LogAttrs(c.Request.Context(), slog.LevelError, "a panic has occurred", attrs...)

		apiError := ginhttp.InternalServerError(c, "", nil)
		c.JSON(apiError.StatusCode, gin.H{"error": apiError})
	})
}
