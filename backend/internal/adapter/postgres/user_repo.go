package postgres

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ksha23/CS407-FactSnap/internal/adapter/postgres/sqlc"
	"github.com/ksha23/CS407-FactSnap/internal/core/model"
)

type userRepo struct {
	query *sqlc.Queries
	db    *pgxpool.Pool
}

func NewUserRepo(db *pgxpool.Pool) *userRepo {
	return &userRepo{
		query: sqlc.New(db),
		db:    db,
	}
}

func (r *userRepo) CreateUser(ctx context.Context, params model.CreateUserParams) (model.AuthUser, error) {
	createdAuthUser, err := r.query.CreateUser(ctx, sqlc.CreateUserParams{
		ID:          params.ID,
		Username:    params.Username,
		Email:       params.Email,
		DisplayName: params.DisplayName,
		AvatarUrl:   params.AvatarURL,
		Role:        string(params.Role),
	})
	if err != nil {
		return model.AuthUser{}, fmt.Errorf("UserRepo::CreateUser: %w", wrapError(err))
	}

	return createdAuthUser.ToDomainModel(), nil
}

func (r *userRepo) GetAuthUserByID(ctx context.Context, clerkID string) (model.AuthUser, error) {
	authUser, err := r.query.GetUserByID(ctx, clerkID)
	if err != nil {
		return model.AuthUser{}, fmt.Errorf("UserRepo::GetAuthUserByClerkID: %w", wrapError(err))
	}

	return authUser.ToDomainModel(), nil
}

func (r *userRepo) GetUserQuestionCount(ctx context.Context, userID string) (int, error) {
	count, err := r.query.GetUserQuestionCount(ctx, userID)
	if err != nil {
		return 0, fmt.Errorf("UserRepo::GetUserQuestionCount: %w", wrapError(err))
	}
	return count, nil
}

func (r *userRepo) GetUserResponseCount(ctx context.Context, userID string) (int, error) {
	count, err := r.query.GetUserResponseCount(ctx, userID)
	if err != nil {
		return 0, fmt.Errorf("UserRepo::GetUserResponseCount: %w", wrapError(err))
	}
	return count, nil
}
func (r *userRepo) UpdateLocation(ctx context.Context, userID string, lat, long float64) error {
	err := r.query.UpdateUserLocation(ctx, userID, lat, long)
	if err != nil {
		return fmt.Errorf("UserRepo::UpdateLocation: %w", wrapError(err))
	}
	return nil
}

func (r *userRepo) UpdatePushToken(ctx context.Context, userID, token string) error {
	err := r.query.UpdateUserPushToken(ctx, userID, &token)
	if err != nil {
		return fmt.Errorf("UserRepo::UpdatePushToken: %w", wrapError(err))
	}
	return nil
}

func (r *userRepo) DeletePushToken(ctx context.Context, userID string) error {
	err := r.query.DeleteUserPushToken(ctx, userID)
	if err != nil {
		return fmt.Errorf("UserRepo::DeletePushToken: %w", wrapError(err))
	}
	return nil
}

func (r *userRepo) GetUsersInRadius(ctx context.Context, lat, long, radius float64) ([]model.User, error) {
	users, err := r.query.GetUsersInRadius(ctx, lat, long, radius)
	if err != nil {
		return nil, fmt.Errorf("UserRepo::GetUsersInRadius: %w", wrapError(err))
	}

	var domainUsers []model.User
	for _, u := range users {
		domainUsers = append(domainUsers, model.User{
			ID:            u.ID,
			ExpoPushToken: u.ExpoPushToken,
		})
	}
	return domainUsers, nil
}


func (r *userRepo) UpdateDisplayName(ctx context.Context, userID string, displayName string) (model.AuthUser, error) {
    row, err := r.query.UpdateUserDisplayName(ctx, displayName, userID)
    if err != nil {
        return model.AuthUser{}, fmt.Errorf("UserRepo::UpdateDisplayName: %w", wrapError(err))
    }
    return row.ToDomainModel(), nil
}