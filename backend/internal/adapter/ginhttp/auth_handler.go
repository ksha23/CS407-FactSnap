package ginhttp

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/ksha23/CS407-FactSnap/internal/adapter/ginhttp/dto"
	"github.com/ksha23/CS407-FactSnap/internal/core/port"
	"net/http"
)

type AuthHandler struct {
	AuthService port.AuthService
}

func NewAuthHandler(authService port.AuthService) *AuthHandler {
	return &AuthHandler{AuthService: authService}
}

func (h *AuthHandler) RegisterRoutes(r *gin.RouterGroup, clerkAuth gin.HandlerFunc) {
	authRoutes := r.Group("/auth", clerkAuth)
	authRoutes.POST("/sync-clerk", h.SyncClerkUser)
	authRoutes.GET("/me", h.GetAuthUser)
}

func (h *AuthHandler) SyncClerkUser(c *gin.Context) {
	userID := getAuthUserID(c)

	authUser, err := h.AuthService.SyncClerkUser(c.Request.Context(), userID)
	if err != nil {
		HandleErr(c, fmt.Errorf("%s: %w", "AuthHandler::SyncClerkUser", err))
		return
	}

	res := dto.SyncClerkUserRes{AuthUser: authUser}
	c.JSON(http.StatusOK, res)
}

func (h *AuthHandler) GetAuthUser(c *gin.Context) {
	userID := getAuthUserID(c)

	authUser, err := h.AuthService.GetAuthUser(c.Request.Context(), userID)
	if err != nil {
		HandleErr(c, fmt.Errorf("%s: %w", "AuthHandler::GetAuthUser", err))
		return
	}

	res := dto.GetAuthUserRes{AuthUser: authUser}
	c.JSON(http.StatusOK, res)
}
