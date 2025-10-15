package middleware

import (
	"context"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/ksha23/CS407-FactSnap/internal/adapter/ginhttp"
	"github.com/ksha23/CS407-FactSnap/internal/core/port"
	"strings"
)

func ClerkAuth(authService port.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// check if bearer header exists or not
		token, err := getBearerToken(c)
		if err != nil {
			c.Error(ginhttp.Unauthenticated(c, "Invalid Authorization header", fmt.Errorf("ClerkAuth: %w", err)))
			c.Abort()
			return
		}

		// validate Clerk token
		clerkID, err := authService.VerifyClerkToken(c.Request.Context(), token)
		if err != nil {
			c.Error(ginhttp.Unauthenticated(c, "Error validating Clerk token", fmt.Errorf("ClerkAuth: %w", err)))
			c.Abort()
			return
		}

		// attach user id to context
		c.Request = c.Request.WithContext(context.WithValue(c.Request.Context(),
			ginhttp.RequestUserIDKey, clerkID),
		)

		c.Next()
	}
}

func getBearerToken(c *gin.Context) (string, error) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		return "", fmt.Errorf("missing Authorization header")
	}

	// Expected format: Bearer XX
	bearer := strings.Split(authHeader, " ")
	if len(bearer) != 2 || bearer[0] != "Bearer" {
		return "", fmt.Errorf("authorization header is incorrectly formatted")
	}

	return bearer[1], nil
}
