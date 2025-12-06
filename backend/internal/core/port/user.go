package port

import (
	"context"

	"github.com/ksha23/CS407-FactSnap/internal/core/model"
)

type UserService interface {
	//EditUser(ctx context.Context, params model.EditUserParams) (model.AuthUser, error)
	UpdateLocation(ctx context.Context, userID string, lat, long float64) error
	UpdatePushToken(ctx context.Context, userID, token string) error
}

type UserRepository interface {
	CreateUser(ctx context.Context, params model.CreateUserParams) (model.AuthUser, error)
	GetAuthUserByID(ctx context.Context, clerkID string) (model.AuthUser, error)
	//EditUser(ctx context.Context, params model.EditUserParams) (model.AuthUser, error)
	UpdateLocation(ctx context.Context, userID string, lat, long float64) error
	UpdatePushToken(ctx context.Context, userID, token string) error
	GetUsersInRadius(ctx context.Context, lat, long, radius float64) ([]model.User, error)
}
