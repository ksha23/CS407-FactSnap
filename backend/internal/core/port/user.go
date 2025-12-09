package port

import (
	"context"

	"github.com/ksha23/CS407-FactSnap/internal/core/model"
)

type UserService interface {
	GetUserStatistics(ctx context.Context, userID string) (questionCount int, responseCount int, err error)
	UpdateProfile(ctx context.Context, userID string, displayName string) (model.AuthUser, error)
	//EditUser(ctx context.Context, params model.EditUserParams) (model.AuthUser, error)
	UpdateLocation(ctx context.Context, userID string, lat, long float64) error
	UpdatePushToken(ctx context.Context, userID, token string) error
	DeletePushToken(ctx context.Context, userID string) error
}

type UserRepository interface {
	CreateUser(ctx context.Context, params model.CreateUserParams) (model.AuthUser, error)
	GetAuthUserByID(ctx context.Context, clerkID string) (model.AuthUser, error)
	GetUserQuestionCount(ctx context.Context, userID string) (int, error)
	GetUserResponseCount(ctx context.Context, userID string) (int, error)
    UpdateDisplayName(ctx context.Context, userID string, displayName string) (model.AuthUser, error)
	//EditUser(ctx context.Context, params model.EditUserParams) (model.AuthUser, error)
	UpdateLocation(ctx context.Context, userID string, lat, long float64) error
	UpdatePushToken(ctx context.Context, userID, token string) error
	DeletePushToken(ctx context.Context, userID string) error
	GetUsersInRadius(ctx context.Context, lat, long, radius float64) ([]model.User, error)
}
