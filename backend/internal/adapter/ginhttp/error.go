package ginhttp

import (
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/ksha23/CS407-FactSnap/internal/errs"
	"net/http"
)

// ApiError represents an API error that contains both user-facing error message and internal error
type ApiError struct {
	StatusCode int       `json:"status_code"`
	RequestID  uuid.UUID `json:"request_id,omitzero"`
	Message    any       `json:"message"`
	Internal   error     `json:"-"`
}

const (
	RequestTimedOutStatusCode = http.StatusServiceUnavailable
)

func (e ApiError) Error() string {
	return fmt.Sprintf("status_code=%d message=%s", e.StatusCode, e.Message)
}

// InternalServerError creates a new API error response representing an internal server error (HTTP 500)
func InternalServerError(c *gin.Context, msg string, internalErr error) ApiError {
	if msg == "" {
		msg = "We encountered an error while processing your request"
	}

	return ApiError{
		StatusCode: http.StatusInternalServerError,
		RequestID:  getRequestID(c),
		Message:    msg,
		Internal:   internalErr,
	}
}

// NotFound creates a new API error response representing a resource-not-found error (HTTP 404)
func NotFound(c *gin.Context, msg string, internalErr error) ApiError {
	if msg == "" {
		msg = "The requested resource was not found"
	}

	return ApiError{
		StatusCode: http.StatusNotFound,
		RequestID:  getRequestID(c),
		Message:    msg,
		Internal:   internalErr,
	}
}

// Unauthenticated creates a new API error response representing an authenticated failure (HTTP 401)
func Unauthenticated(c *gin.Context, msg string, internalErr error) ApiError {
	if msg == "" {
		msg = "You are not authenticated to perform the requested action"
	}

	return ApiError{
		StatusCode: http.StatusUnauthorized,
		RequestID:  getRequestID(c),
		Message:    msg,
		Internal:   internalErr,
	}
}

// Unauthorized creates a new API error response representing an authorization failure (HTTP 403)
func Unauthorized(c *gin.Context, msg string, internalErr error) ApiError {
	if msg == "" {
		msg = "You are not authorized to perform the requested action"
	}

	return ApiError{
		StatusCode: http.StatusForbidden,
		RequestID:  getRequestID(c),
		Message:    msg,
		Internal:   internalErr,
	}
}

// Forbidden creates a new error response representing an forbidden error (HTTP 403)
func Forbidden(c *gin.Context, msg string, internalErr error) ApiError {
	if msg == "" {
		msg = "You are not authorized to perform the requested action"
	}
	return ApiError{
		StatusCode: http.StatusForbidden,
		RequestID:  getRequestID(c),
		Message:    msg,
		Internal:   internalErr,
	}
}

// BadRequest creates a new API error response representing a bad request (HTTP 400).
// This is intended for invalid url params.
func BadRequest(c *gin.Context, msg string, internalErr error) ApiError {
	if msg == "" {
		msg = "Your request is in a bad format"
	}
	return ApiError{
		StatusCode: http.StatusBadRequest,
		RequestID:  getRequestID(c),
		Message:    msg,
		Internal:   internalErr,
	}
}

// BadRequestJSON creates a new API error response representing a bad request (HTTP 400).
// This is intended for invalid request payload.
func BadRequestJSON(c *gin.Context, err error, internalErr error) ApiError {
	// check if validator error
	var ve validator.ValidationErrors
	if errors.As(err, &ve) {
		return ApiError{
			StatusCode: http.StatusBadRequest,
			RequestID:  getRequestID(c),
			Message:    ve.Error(),
			Internal:   internalErr,
		}
	}

	// check if req payload was too large
	var mbe *http.MaxBytesError
	if errors.As(err, &mbe) {
		return ApiError{
			StatusCode: http.StatusRequestEntityTooLarge,
			RequestID:  getRequestID(c),
			Message:    fmt.Sprintf("Your request payload size exceeds the limit (%d bytes)", mbe.Limit),
			Internal:   internalErr,
		}
	}

	return BadRequest(c, "", internalErr)
}

func RequestTimedOut(c *gin.Context, internalErr error) ApiError {
	if internalErr == nil {
		internalErr = http.ErrHandlerTimeout
	}
	return ApiError{
		StatusCode: RequestTimedOutStatusCode,
		RequestID:  getRequestID(c),
		Message:    "Request timed out",
		Internal:   internalErr,
	}
}

func HandleErr(c *gin.Context, err error) {
	var errsError errs.Error
	if errors.As(err, &errsError) {
		switch errsError.Type {
		case errs.TypeUnauthorized:
			c.Error(Unauthorized(c, errsError.Message, err))
			return
		case errs.TypeUnauthenticated:
			c.Error(Unauthenticated(c, errsError.Message, err))
			return
		case errs.TypeForbidden:
			c.Error(Forbidden(c, errsError.Message, err))
			return
		case errs.TypeNotFound:
			c.Error(NotFound(c, errsError.Message, err))
			return
		case errs.TypeBadRequest:
			c.Error(BadRequest(c, errsError.Message, err))
			return
		default:
			c.Error(InternalServerError(c, "", err))
			return
		}
	}
	c.Error(InternalServerError(c, "", err))
}
