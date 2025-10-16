package postgres

import (
	"context"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ksha23/CS407-FactSnap/internal/adapter/postgres/sqlc"
	"github.com/ksha23/CS407-FactSnap/internal/core/model"
)

type responseRepo struct {
	query *sqlc.Queries
	db    *pgxpool.Pool
}

func NewResponseRepo(db *pgxpool.Pool) *responseRepo {
	return &responseRepo{
		query: sqlc.New(db),
		db:    db,
	}
}

func (r *responseRepo) CreateResponse(ctx context.Context, userID string, params model.CreateResponseParams) (model.Response, error) {
	//TODO implement me
	panic("implement me")
}

func (r *responseRepo) EditResponse(ctx context.Context, userID string, params model.EditResponseParams) (model.Response, error) {
	//TODO implement me
	panic("implement me")
}

func (r *responseRepo) DeleteResponse(ctx context.Context, userID string, responseID uuid.UUID) (model.Response, error) {
	//TODO implement me
	panic("implement me")
}

func (r *responseRepo) GetResponsesByQuestionID(ctx context.Context, userID string, questionID uuid.UUID, page model.PageParams) ([]model.Response, error) {
	//TODO implement me
	panic("implement me")
}

func (r *responseRepo) GetResponsesByUserID(ctx context.Context, userID string, page model.PageParams) ([]model.Response, error) {
	//TODO implement me
	panic("implement me")
}
