package model

import (
	"github.com/google/uuid"
	"time"
)

// AuthUser represents a logged-in user
type AuthUser struct {
	User
	ClerkID string `json:"clerk_id"`
	Email   string `json:"email"`
}

// User represents public-facing users
type User struct {
	ID          uuid.UUID `json:"id"`
	Username    string    `json:"username"`
	AvatarURL   *string   `json:"avatar_url"`
	AboutMe     *string   `json:"about_me"`
	DisplayName string    `json:"display_name"`
	Role        Role      `json:"role"`
	CreatedAt   time.Time `json:"created_at"`
}
