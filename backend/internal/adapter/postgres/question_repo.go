package postgres

import (
	"context"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ksha23/CS407-FactSnap/internal/adapter/postgres/sqlc"
	"github.com/ksha23/CS407-FactSnap/internal/core/model"
)

type questionRepo struct {
	query *sqlc.Queries
	db    *pgxpool.Pool
}

func NewQuestionRepo(db *pgxpool.Pool) *questionRepo {
	return &questionRepo{
		query: sqlc.New(db),
		db:    db,
	}
}

func (r *questionRepo) CreateQuestion(ctx context.Context, userID string, params model.CreateQuestionParams) (model.Question, error) {
	//TODO implement me
	panic("implement me")
}

func (r *questionRepo) GetQuestions(ctx context.Context, userID string, params model.GetQuestionsParams, page model.PageParams) ([]model.Question, error) {
	//TODO implement me
	panic("implement me")
}

func (r *questionRepo) DeleteQuestion(ctx context.Context, userID string, questionID uuid.UUID) (model.Question, error) {
	//TODO implement me
	panic("implement me")
}

func (r *questionRepo) EditQuestion(ctx context.Context, userID string, params model.EditQuestionParams) (model.Question, error) {
	//TODO implement me
	panic("implement me")
}

func (r *questionRepo) GetQuestionByID(ctx context.Context, userID string, questionID uuid.UUID) (model.Question, error) {
	//TODO implement me
	panic("implement me")
}

func (r *questionRepo) GetQuestionsByUserID(ctx context.Context, userID string, page model.PageParams) ([]model.Question, error) {
	//TODO implement me
	panic("implement me")
}
