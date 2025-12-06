package ginhttp

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ksha23/CS407-FactSnap/internal/adapter/ginhttp/dto"
	"github.com/ksha23/CS407-FactSnap/internal/core/port"
)

type UserHandler struct {
	UserService port.UserService
}

func NewUserHandler(userService port.UserService) *UserHandler {
	return &UserHandler{UserService: userService}
}

func (h *UserHandler) RegisterRoutes(r *gin.RouterGroup) {
	userRoutes := r.Group("/users")
	userRoutes.GET("/stats", h.GetUserStatistics)
}

func (h *UserHandler) GetUserStatistics(c *gin.Context) {
	userID := getAuthUserID(c)

	questionCount, responseCount, err := h.UserService.GetUserStatistics(c.Request.Context(), userID)
	if err != nil {
		HandleErr(c, fmt.Errorf("%s: %w", "UserHandler::GetUserStatistics", err))
		return
	}

	res := dto.GetUserStatisticsRes{
		QuestionCount: questionCount,
		ResponseCount: responseCount,
	}
	c.JSON(http.StatusOK, res)
}
