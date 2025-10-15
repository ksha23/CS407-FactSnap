package middleware

import (
	"context"
	"errors"
	"github.com/gin-gonic/gin"
	"github.com/ksha23/CS407-FactSnap/internal/adapter/ginhttp"
	"net/http"
	"time"
)

// Timeout is a middleware that sets the request timeout duration through context.WithTimeout.
// If the request timed out, then it will write the timed out error response (if not written already).
// NOTE: If the given duration is 0, then it will not set the request timeout.
func Timeout(timeoutDuration time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		// only set timeout if the duration is not 0
		if timeoutDuration > 0 {
			timeoutCtx, cancel := context.WithTimeoutCause(c.Request.Context(), timeoutDuration, http.ErrHandlerTimeout)
			defer func() {
				cancel()
				if errors.Is(context.Cause(timeoutCtx), http.ErrHandlerTimeout) {
					// If context timed out, then write the timed out error response (if the response hasn't been written already).
					// Note: if the response is already written, then we assume that the handler eventually completed its work,
					// likely because it wasn't respecting the timeout context.
					if !c.Writer.Written() {
						apiError := ginhttp.RequestTimedOut(c, nil)
						c.JSON(apiError.StatusCode, gin.H{"error": apiError})
					}
				}
			}()

			c.Request = c.Request.WithContext(timeoutCtx)
		}

		c.Next()
	}
}
