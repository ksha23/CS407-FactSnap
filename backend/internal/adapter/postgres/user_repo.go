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
