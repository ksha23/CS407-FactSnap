package ginhttp

import (
	"log/slog"
	"net/http"

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
	users := r.Group("/users")
	users.POST("/location", h.UpdateLocation)
	users.POST("/push-token", h.UpdatePushToken)
	users.DELETE("/push-token", h.DeletePushToken)
}

type UpdateLocationRequest struct {
	Latitude  float64 `json:"latitude" binding:"required"`
	Longitude float64 `json:"longitude" binding:"required"`
}

type UpdatePushTokenRequest struct {
	Token string `json:"token" binding:"required"`
}

func (h *UserHandler) UpdateLocation(c *gin.Context) {
	userID := getAuthUserID(c)
	var req UpdateLocationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.UserService.UpdateLocation(c.Request.Context(), userID, req.Latitude, req.Longitude); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusOK)
}

func (h *UserHandler) UpdatePushToken(c *gin.Context) {
	userID := getAuthUserID(c)
	var req UpdatePushTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.UserService.UpdatePushToken(c.Request.Context(), userID, req.Token); err != nil {
		slog.Error("UpdatePushToken failed", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	slog.Info("UpdatePushToken success", "user_id", userID)
	c.Status(http.StatusOK)
}

func (h *UserHandler) DeletePushToken(c *gin.Context) {
	userID := getAuthUserID(c)

	if err := h.UserService.DeletePushToken(c.Request.Context(), userID); err != nil {
		slog.Error("DeletePushToken failed", "error", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	slog.Info("DeletePushToken success", "user_id", userID)
	c.Status(http.StatusOK)
}
