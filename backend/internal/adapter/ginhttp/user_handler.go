package ginhttp

import (
	"github.com/gin-gonic/gin"
	"github.com/ksha23/CS407-FactSnap/internal/core/port"
)

type UserHandler struct {
	UserService port.UserService
}

func NewUserHandler(userService port.UserService) *UserHandler {
	return &UserHandler{UserService: userService}
}

func (h *UserHandler) RegisterRoutes(r *gin.RouterGroup) {
	// TODO: add API routes for users
	//questionRoutes := r.Group("/users")
}
