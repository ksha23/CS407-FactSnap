package postgres

import (
	"context"
	"fmt"
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
	var row sqlc.CreateQuestionRow
	err := execTx(ctx, r.db, func(query *sqlc.Queries) error {
		// in a single transaction:
		// - insert location first
		location, err := query.CreateLocation(ctx,
			params.Location.Latitude,
			params.Location.Longitude,
			params.Location.Name,
			params.Location.Address,
		)
		if err != nil {
			return fmt.Errorf("CreateLocation: %w", wrapError(err))
		}

		// - then insert question
		row, err = query.CreateQuestion(ctx, sqlc.CreateQuestionParams{
			AuthorID:    userID,
			ContentType: string(model.ContentTypeNone),
			Title:       params.Title,
			Body:        params.Body,
			Category:    string(params.Category),
			LocationID:  location.ID,
			ImageUrls:   params.ImageURLs,
			ExpiredAt:   params.ExpiresAt,
		})
		if err != nil {
			return fmt.Errorf("CreateQuestion: %w", wrapError(err))
		}

		return nil
	})
	if err != nil {
		return model.Question{}, fmt.Errorf("QuestionRepo::CreateQuestion: %w", err)
	}

	// NOTE: The newly-created question will not have its content populated yet.
	// We are assuming the user will add the content after, if they intend to
	return row.ToDomainModel(), nil
}

func (r *questionRepo) GetQuestionByID(ctx context.Context, userID string, questionID uuid.UUID) (model.Question, error) {
	// get question
	questionRow, err := r.query.GetQuestionByID(ctx, questionID, userID)
	if err != nil {
		return model.Question{}, fmt.Errorf("QuestionRepo::GetQuestionByID: %w", wrapError(err))
	}

	question := questionRow.ToDomainModel()

	// set question content (if applicable)
	questionContent, err := r.getQuestionContent(ctx, question)
	if err != nil {
		return model.Question{}, fmt.Errorf("QuestionRepo::GetQuestionByID: %w", err)
	}
	question.Content = questionContent

	return question, nil
}

func (r *questionRepo) getQuestionContent(ctx context.Context, question model.Question) (model.QuestionContent, error) {
	content := model.QuestionContent{
		Type: question.Content.Type,
	}

	switch question.Content.Type {
	case model.ContentTypePoll:
		poll, err := r.getPoll(ctx, question.ID)
		if err != nil {
			return content, fmt.Errorf("getQuestionContent: %w", err)
		}
		content.Data = poll
	default:
		content.Data = nil
	}

	return content, nil
}

func (r *questionRepo) getPoll(ctx context.Context, questionID uuid.UUID) (model.Poll, error) {
	// TODO: implement me
	// make sure to wrapError
	return model.Poll{}, nil
}

//func (r *questionRepo) GetQuestions(ctx context.Context, userID string, params model.GetQuestionsParams, page model.PageParams) ([]model.Question, error) {
//	//TODO implement me
//	panic("implement me")
//}
//
//func (r *questionRepo) DeleteQuestion(ctx context.Context, userID string, questionID uuid.UUID) (model.Question, error) {
//	//TODO implement me
//	panic("implement me")
//}
//
//func (r *questionRepo) EditQuestion(ctx context.Context, userID string, params model.EditQuestionParams) (model.Question, error) {
//	//TODO implement me
//	panic("implement me")
//}
//
//
//func (r *questionRepo) GetQuestionsByUserID(ctx context.Context, userID string, page model.PageParams) ([]model.Question, error) {
//	//TODO implement me
//	panic("implement me")
//}
