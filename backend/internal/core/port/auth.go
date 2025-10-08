package port

import (
	"context"
	"github.com/google/uuid"
	"github.com/ksha23/CS407-FactSnap/internal/core/model"
)

type AuthService interface {
	VerifyClerkToken(ctx context.Context, token string) (uuid.UUID, error)
	SyncClerkUser(ctx context.Context, clerkUserID string) (model.AuthUser, error)
}
