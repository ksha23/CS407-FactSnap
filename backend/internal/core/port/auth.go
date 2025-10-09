package port

import (
	"context"
	"github.com/ksha23/CS407-FactSnap/internal/core/model"
)

type AuthService interface {
	VerifyClerkToken(ctx context.Context, token string) (string, error)
	SyncClerkUser(ctx context.Context, userID string) (model.AuthUser, error)
	GetAuthUser(ctx context.Context, userID string) (model.AuthUser, error)
}
