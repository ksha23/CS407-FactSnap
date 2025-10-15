package middleware

import (
	"errors"
	"github.com/gin-gonic/gin"
	"github.com/ksha23/CS407-FactSnap/internal/adapter/ginhttp"
	"github.com/ksha23/CS407-FactSnap/internal/obj"
	"log/slog"
)

func Error() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		// attempt to extract api error
		apiError := getApiError(c)

		// if there's no api error, then return
		if obj.IsZero(apiError) {
			return
		}

		internalErrAttrs := []slog.Attr{
			slog.Any("msg", apiError.Internal),
		}
		externalErrAttrs := []slog.Attr{
			slog.Int("status_code", apiError.StatusCode),
			slog.Any("msg", apiError.Message),
		}

		attrs := append([]slog.Attr{
			{
				Key:   "internal",
				Value: slog.GroupValue(internalErrAttrs...),
			},
			{
				Key:   "external",
				Value: slog.GroupValue(externalErrAttrs...),
			},
		})

		slog.LogAttrs(c.Request.Context(), slog.LevelError, "an error has occurred", attrs...)

		// only write the error response if request not already written to
		if !c.Writer.Written() {
			c.JSON(apiError.StatusCode, gin.H{"error": apiError})
		}

		return
	}
}

func getApiError(c *gin.Context) ginhttp.ApiError {
	var apiError ginhttp.ApiError

	// extract api error if it was set in c.Errors
	if len(c.Errors) > 0 {
		// if there was an error and the request timed out, then override its status code and message
		if errors.As(c.Errors[0], &apiError) && ginhttp.IsRequestTimedOut(c) {
			apiError = ginhttp.RequestTimedOut(c, apiError.Internal)
		}
	}

	return apiError
}
