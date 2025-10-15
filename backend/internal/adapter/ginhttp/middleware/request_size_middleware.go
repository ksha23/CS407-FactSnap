package middleware

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

func MaxRequestSize(maxBytesSize int64) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxBytesSize)
		c.Next()
	}
}
