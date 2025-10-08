package ginhttp

import (
	"github.com/gin-gonic/gin"
	"github.com/ksha23/CS407-FactSnap/internal/core/port"
)

type AuthHandler struct {
	AuthService port.AuthService
}

func NewAuthHandler(authService port.AuthService) *AuthHandler {
	return &AuthHandler{AuthService: authService}
}

func (h *AuthHandler) RegisterRoutes(r *gin.RouterGroup, requiredClerkAuth gin.HandlerFunc) {
	authRoutes := r.Group("/auth")
	authRoutes.GET("/sync-clerk", requiredClerkAuth, h.SyncClerkUser)
}

func (h *AuthHandler) SyncClerkUser(c *gin.Context) {

}
