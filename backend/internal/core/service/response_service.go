package service

import (
	"context"
	"fmt"
	"github.com/google/uuid"
	"github.com/ksha23/CS407-FactSnap/internal/core/model"
	"github.com/ksha23/CS407-FactSnap/internal/core/port"
	"github.com/ksha23/CS407-FactSnap/internal/errs"
	"time"
)

type responseService struct {
	questionService port.QuestionService
	responseRepo    port.ResponseRepo
}

func NewResponseService(
	questionService port.QuestionService,
	responseRepo port.ResponseRepo,
) *responseService {
	return &responseService{
		questionService: questionService,
		responseRepo:    responseRepo,
	}
}

func (s *responseService) CreateResponse(ctx context.Context, userID string, params model.CreateResponseParams) (model.Response, error) {
	// ensure question hasn't expired yet
	err := s.isQuestionExpired(ctx, userID, params.QuestionID)
	if err != nil {
		return model.Response{}, fmt.Errorf("ResponseService::CreateResponse: %w", err)
	}

	response, err := s.responseRepo.CreateResponse(ctx, userID, params)
	if err != nil {
		return model.Response{}, fmt.Errorf("ResponseService::CreateResponse: %w", err)
	}

	return response, nil
}

func (s *responseService) GetResponsesByQuestionID(ctx context.Context, userID string, questionID uuid.UUID, page model.PageParams) ([]model.Response, error) {
	responses, err := s.responseRepo.GetResponsesByQuestionID(ctx, userID, questionID, page)
	if err != nil {
		return nil, fmt.Errorf("ResponseService::GetResponsesByQuestionID: %w", err)

	}
	return responses, nil
}

func (s *responseService) EditResponse(ctx context.Context, userID string, params model.EditResponseParams) (model.Response, error) {
	// check if user is authorized to edit this response
	if err := s.authorizeUser(ctx, userID, params.ResponseID, false); err != nil {
		return model.Response{}, fmt.Errorf("ResponseService::EditResponse: %w", err)
	}

	resp, err := s.responseRepo.EditResponse(ctx, userID, params)
	if err != nil {
		return model.Response{}, fmt.Errorf("ResponseService::EditResponse: %w", err)
	}

	return resp, nil
}

func (s *responseService) DeleteResponse(ctx context.Context, userID string, responseID uuid.UUID) error {
	// check if user is authorized to delete this question
	if err := s.authorizeUser(ctx, userID, responseID, true); err != nil {
		return fmt.Errorf("ResponseService::DeleteResponse: %w", err)
	}

	err := s.responseRepo.DeleteResponse(ctx, userID, responseID)
	if err != nil {
		return fmt.Errorf("ResponseService::DeleteResponse: %w", err)

	}
	return nil
}

//func (s *responseService) GetResponsesByUserID(ctx context.Context, userID string, page model.PageParams) ([]model.Response, error) {
//	//TODO implement me
//	panic("implement me")
//}

func (s *responseService) authorizeUser(ctx context.Context, userID string, responseID uuid.UUID, bypassExpiration bool) error {
	// fetch the response
	response, err := s.responseRepo.GetResponseByID(ctx, userID, responseID)
	if err != nil {
		return fmt.Errorf("authorizeUser: %w", err)
	}

	// ensure that the user owns the response
	if !response.IsOwned {
		err := fmt.Errorf("user id %s does not own response id %s", userID, responseID)
		return fmt.Errorf("authorizeUser: %w", errs.UnauthorizedError("You must own this response", err))
	}

	// also, we need to ensure that the question hasn't expired yet
	if !bypassExpiration {
		err = s.isQuestionExpired(ctx, userID, response.QuestionID)
		if err != nil {
			return fmt.Errorf("authorizeUser: %w", err)
		}
	}

	return nil

}

// isQuestionExpired checks if the question is expired or not. An error is returned if question is expired or
// some other error occurred. Otherwise no error is returned.
func (s *responseService) isQuestionExpired(ctx context.Context, userID string, questionID uuid.UUID) error {
	// fetch the question
	question, err := s.questionService.GetQuestionByID(ctx, userID, questionID)
	if err != nil {
		return fmt.Errorf("isQuestionExpired: GetQuestionByID: %w", err)
	}

	// check if question has expired
	if time.Now().After(question.ExpiredAt) {
		err := fmt.Errorf("question id %s has expired", questionID)
		return fmt.Errorf("isQuestionExpired: %w", errs.UnauthorizedError("This question has expired", err))
	}

	return nil
}
