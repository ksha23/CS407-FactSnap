package port

import (
	"context"
	"github.com/google/uuid"
	"github.com/ksha23/CS407-FactSnap/internal/core/model"
)

type ResponseService interface {
	CreateResponse(ctx context.Context, userID string, params model.CreateResponseParams) (model.Response, error)
	EditResponse(ctx context.Context, userID string, params model.EditResponseParams) (model.Response, error)
	DeleteResponse(ctx context.Context, userID string, responseID uuid.UUID) (model.Response, error)
	GetResponsesByQuestionID(ctx context.Context, userID string, questionID uuid.UUID, page model.PageParams) ([]model.Response, error)
	GetResponsesByUserID(ctx context.Context, userID string, page model.PageParams) ([]model.Response, error)
}

type ResponseRepo interface {
}
