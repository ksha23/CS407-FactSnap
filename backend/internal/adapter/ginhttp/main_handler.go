package ginhttp

import (
	"github.com/gin-gonic/gin"
	"github.com/ksha23/CS407-FactSnap/internal/adapter/ginhttp/dto"
	"net/http"
)

type MainHandler struct{}

func NewMainHandler() *MainHandler {
	return &MainHandler{}
}

func (h *MainHandler) RegisterRoutes(r *gin.RouterGroup) {
	// healthcheck
	r.GET("/health", h.Healthcheck)
}

func (h *MainHandler) Healthcheck(c *gin.Context) {
	// TODO: replace with Git commit hash and Build date
	res := dto.MessageRes{Message: "Server is healthy"}
	c.JSON(http.StatusOK, res)
}

func (h *MainHandler) NoRoute(c *gin.Context) {
	res := dto.MessageRes{Message: "Route not found"}
	c.Error(ApiError{StatusCode: http.StatusNotFound, Message: res})
}
