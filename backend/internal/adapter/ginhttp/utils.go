package ginhttp

import (
	"context"
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ksha23/CS407-FactSnap/internal/adapter/ginhttp/dto"
	"github.com/ksha23/CS407-FactSnap/internal/core/model"
	"github.com/ksha23/CS407-FactSnap/internal/validate"
	"net/http"
	"strconv"
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

func validateLimitQueryParam(limitQuery string) (int, error) {
	limit, err := strconv.ParseInt(limitQuery, 10, 32)
	if err != nil {
		return 0, errors.New("limit must be an integer")
	}

	if err := validate.PageLimit(int(limit)); err != nil {
		return 0, err
	}

	return int(limit), nil
}

func validateOffsetQueryParam(offsetQuery string) (int, error) {
	offset, err := strconv.ParseInt(offsetQuery, 10, 32)
	if err != nil {
		return 0, errors.New("offset must be an integer")
	}

	if err := validate.PageOffset(int(offset)); err != nil {
		return 0, err
	}

	return int(offset), nil
}

func validatePageFilterQueryParam(filterTypeQuery string, filterValQuery string) (model.PageFilter, error) {
	filter, err := model.ParsePageFilterType(filterTypeQuery)
	if err != nil {
		return model.PageFilter{}, err
	}
	return model.PageFilter{
		Type:  filter,
		Value: filterValQuery,
	}, nil
}
