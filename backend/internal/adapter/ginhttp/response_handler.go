package ginhttp

import (
	"github.com/gin-gonic/gin"
	"github.com/ksha23/CS407-FactSnap/internal/core/port"
)

type ResponseHandler struct {
	ResponseService port.ResponseService
}

func NewResponseHandler(responseService port.ResponseService) *ResponseHandler {
	return &ResponseHandler{ResponseService: responseService}
}

func (h *ResponseHandler) RegisterRoutes(r *gin.RouterGroup) {
	// TODO: add API routes for responses
	//questionRoutes := r.Group("/questions")
}
