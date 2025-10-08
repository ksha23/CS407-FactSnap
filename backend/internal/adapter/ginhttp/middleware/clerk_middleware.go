package middleware

import (
	"github.com/gin-gonic/gin"
	"github.com/ksha23/CS407-FactSnap/internal/core/port"
)

func ClerkAuth(authService port.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// TODO: finish impl
	}
}
