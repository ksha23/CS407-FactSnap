package ginhttp

import (
	"context"
	"errors"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"net/http"
)

const (
	RequestUserIDKey = "request_user_id"
	RequestIDKey     = "request_id"
	AuthUserIDKey    = "auth_user_id"
)

func registerValidations(v *validator.Validate) {
	// TODO: add custom field validations here
}

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
