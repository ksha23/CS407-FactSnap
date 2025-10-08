package port

import (
	"context"
	"github.com/ksha23/CS407-FactSnap/internal/core/model"
)

type UserRepository interface {
	CreateUser(ctx context.Context, params model.CreateUserParams) (model.AuthUser, error)
	GetAuthUserByClerkID(ctx context.Context, clerkID string) (model.AuthUser, error)
}
