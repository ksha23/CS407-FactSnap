package port

import (
	"context"
	"github.com/google/uuid"
	"github.com/ksha23/CS407-FactSnap/internal/core/model"
)

type QuestionService interface {
	CreateQuestion(ctx context.Context, userID string, params model.CreateQuestionParams) (uuid.UUID, error)
	CreatePoll(ctx context.Context, userID string, params model.CreatePollParams) (uuid.UUID, error)
	VotePoll(ctx context.Context, userID string, pollID uuid.UUID, optionID *uuid.UUID) error
	//GetQuestions(ctx context.Context, userID string, params model.GetQuestionsParams, page model.PageParams) ([]model.Question, error)
	//DeleteQuestion(ctx context.Context, userID string, questionID uuid.UUID) (model.Question, error)
	//EditQuestion(ctx context.Context, userID string, params model.EditQuestionParams) (model.Question, error)
	GetQuestionByID(ctx context.Context, userID string, questionID uuid.UUID) (model.Question, error)
	GetQuestionsInRadiusFeed(ctx context.Context, userID string, params model.GetQuestionsInRadiusFeedParams, page model.PageParams) ([]model.Question, error)

	//GetQuestionsByUserID(ctx context.Context, userID string, page model.PageParams) ([]model.Question, error)
}

type QuestionRepo interface {
	CreateQuestion(ctx context.Context, userID string, params model.CreateQuestionParams) (uuid.UUID, error)
	CreatePoll(ctx context.Context, userID string, params model.CreatePollParams) (uuid.UUID, error)
	IsPollExpired(ctx context.Context, pollID uuid.UUID) (bool, error)
	VotePoll(ctx context.Context, userID string, pollID uuid.UUID, optionID *uuid.UUID) error
	//GetQuestions(ctx context.Context, userID string, params model.GetQuestionsParams, page model.PageParams) ([]model.Question, error)
	//DeleteQuestion(ctx context.Context, userID string, questionID uuid.UUID) (model.Question, error)
	//EditQuestion(ctx context.Context, userID string, params model.EditQuestionParams) (model.Question, error)
	GetQuestionByID(ctx context.Context, userID string, questionID uuid.UUID) (model.Question, error)
	GetQuestionsInRadiusFeed(ctx context.Context, userID string, params model.GetQuestionsInRadiusFeedParams, page model.PageParams) ([]model.Question, error)
	//GetQuestionsByUserID(ctx context.Context, userID string, page model.PageParams) ([]model.Question, error)
}
