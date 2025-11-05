package ginhttp

import (
	"context"
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ksha23/CS407-FactSnap/internal/adapter/ginhttp/dto"
	"net/http"
)

const (
	RequestUserIDKey = "request_user_id"
	RequestIDKey     = "request_id"
)

// getRequestID returns the request id attached in the given Gin context, or empty uuid if it's not there.
func getRequestID(c *gin.Context) uuid.UUID {
	return c.Request.Context().Value(RequestIDKey).(uuid.UUID)
}

// IsRequestTimedOut returns true if the request timed out. False otherwise.
func IsRequestTimedOut(c *gin.Context) bool {
	if c.Writer.Status() == http.StatusServiceUnavailable || errors.Is(context.Cause(c.Request.Context()), http.ErrHandlerTimeout) {
		return true
	}
	return false
}

// getAuthUserID returns the request user id attached in the given Gin context, or empty string if it's not there.
func getAuthUserID(c *gin.Context) string {
	return c.Request.Context().Value(RequestUserIDKey).(string)
}

func unmarshalAndValidateReq(c *gin.Context, req dto.Request) error {
	// unmarshal
	if err := c.ShouldBindJSON(req); err != nil {
		return fmt.Errorf("unmarshalAndValidateReq: could not bind JSON: %w", err)
	}

	// validate
	if err := req.Validate(); err != nil {
		return fmt.Errorf("unmarshalAndValidateReq: invalid request: %w", err)
	}

	return nil
}
