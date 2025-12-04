package postgres

import (
	"context"
	"fmt"
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
	var responseRow sqlc.CreateResponseRow
	err := execTx(ctx, r.db, func(query *sqlc.Queries) error {
		// create response
		row, err := r.query.CreateResponse(ctx, params.QuestionID, userID, params.Body, params.ImageURLs)
		if err != nil {
			return fmt.Errorf("CreateResponse: %w", wrapError(err))
		}

		// increment response amount for the question
		err = r.query.IncrementResponseAmount(ctx, params.QuestionID)
		if err != nil {
			return fmt.Errorf("IncrementResponseAmount: %w", wrapError(err))
		}

		responseRow = row
		return nil
	})
	if err != nil {
		return model.Response{}, fmt.Errorf("ResponseRepo::CreateResponse: %w", err)
	}

	return responseRow.ToDomainModel(), nil
}

func (r *responseRepo) GetResponsesByQuestionID(ctx context.Context, userID string, questionID uuid.UUID, page model.PageParams) ([]model.Response, error) {
	responses, err := r.query.GetResponsesByQuestionID(ctx, userID, questionID, int32(page.Offset), int32(page.Limit))
	if err != nil {
		return nil, fmt.Errorf("ResponseRepo::GetResponsesByQuestionID: %w", wrapError(err))
	}

	return convertRowsToDomain(responses), nil
}

func (r *responseRepo) EditResponse(ctx context.Context, userID string, params model.EditResponseParams) (model.Response, error) {
	row, err := r.query.EditResponse(ctx, params.Body, params.ResponseID)
	if err != nil {
		return model.Response{}, fmt.Errorf("ResponseRepo::EditResponse: %w", wrapError(err))
	}

	return row.ToDomainModel(), nil
}

func (r *responseRepo) DeleteResponse(ctx context.Context, userID string, questionID uuid.UUID, responseID uuid.UUID) error {
	err := execTx(ctx, r.db, func(query *sqlc.Queries) error {
		// delete response
		err := query.DeleteResponse(ctx, responseID)
		if err != nil {
			return fmt.Errorf("DeleteResponse: %w", wrapError(err))
		}

		// decrement response amount by one for question
		err = query.DecrementResponseAmount(ctx, questionID, 1)
		if err != nil {
			return fmt.Errorf("DecrementResponseAmount: %w", wrapError(err))
		}

		return nil
	})
	if err != nil {
		return fmt.Errorf("ResponseRepo::DeleteResponse: %w", err)
	}

	return nil
}

func (r *responseRepo) GetResponseByID(ctx context.Context, userID string, responseID uuid.UUID) (model.Response, error) {
	row, err := r.query.GetResponseByID(ctx, userID, responseID)
	if err != nil {
		return model.Response{}, fmt.Errorf("ResponseRepo::GetResponseByID: %w", wrapError(err))
	}

	return row.ToDomainModel(), nil
}

//func (r *responseRepo) GetResponsesByUserID(ctx context.Context, userID string, page model.PageParams) ([]model.Response, error) {
//	//TODO implement me
//	panic("implement me")
//}
