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

type questionService struct {
	questionRepo port.QuestionRepo
}

func NewQuestionService(questionRepo port.QuestionRepo) *questionService {
	return &questionService{questionRepo: questionRepo}
}

func (s *questionService) CreateQuestion(ctx context.Context, userID string, params model.CreateQuestionParams) (uuid.UUID, error) {
	questionID, err := s.questionRepo.CreateQuestion(ctx, userID, params)
	if err != nil {
		return uuid.UUID{}, fmt.Errorf("QuestionService::CreateQuestion: %w", err)
	}
	return questionID, nil
}

func (s *questionService) CreatePoll(ctx context.Context, userID string, params model.CreatePollParams) (uuid.UUID, error) {
	// check if user is authorized to create a poll for this question
	if err := s.authorizeUser(ctx, userID, params.QuestionID); err != nil {
		return uuid.UUID{}, fmt.Errorf("QuestionService::CreatePoll: %w", err)
	}

	// finally, create the poll for the question
	pollID, err := s.questionRepo.CreatePoll(ctx, userID, params)
	if err != nil {
		return uuid.UUID{}, fmt.Errorf("QuestionService::CreatePoll: %w", err)
	}

	return pollID, nil
}

func (s *questionService) VotePoll(ctx context.Context, userID string, pollID uuid.UUID, optionID *uuid.UUID) error {
	// first ensure that the poll hasn't expired yet
	isExpired, err := s.questionRepo.IsPollExpired(ctx, pollID)
	if err != nil {
		return fmt.Errorf("QuestionService::VotePoll: %w", err)
	}
	if isExpired {
		err := errs.UnauthorizedError("This poll has expired", fmt.Errorf("poll id %s has expired", pollID))
		return fmt.Errorf("QuestionService::VotePoll: %w", err)
	}

	// place new poll vote
	err = s.questionRepo.VotePoll(ctx, userID, pollID, optionID)
	if err != nil {
		return fmt.Errorf("QuestionService::VotePoll: %w", err)
	}

	return nil
}

func (s *questionService) GetQuestionByID(ctx context.Context, userID string, questionID uuid.UUID) (model.Question, error) {
	question, err := s.questionRepo.GetQuestionByID(ctx, userID, questionID)
	if err != nil {
		return model.Question{}, fmt.Errorf("QuestionService::GetQuestionByID: %w", err)
	}
	return question, err
}

func (s *questionService) GetQuestionsInRadiusFeed(
	ctx context.Context,
	userID string,
	params model.GetQuestionsInRadiusFeedParams,
	page model.PageParams,
) ([]model.Question, error) {
	questions, err := s.questionRepo.GetQuestionsInRadiusFeed(ctx, userID, params, page)
	if err != nil {
		return nil, fmt.Errorf("QuestionService::GetQuestionsInRadiusFeed: %w", err)
	}
	return questions, nil
}

func (s *questionService) EditQuestion(ctx context.Context, userID string, params model.EditQuestionParams) (model.Question, error) {
	// check if user is authorized to edit this question
	if err := s.authorizeUser(ctx, userID, params.QuestionID); err != nil {
		return model.Question{}, fmt.Errorf("QuestionService::EditQuestion: %w", err)
	}

	editedQuestion, err := s.questionRepo.EditQuestion(ctx, userID, params)
	if err != nil {
		return model.Question{}, fmt.Errorf("QuestionService::EditQuestion: %w", err)
	}

	return editedQuestion, nil
}

//func (s *questionService) GetQuestions(ctx context.Context, userID string, params model.GetQuestionsParams, page model.PageParams) ([]model.Question, error) {
//	//TODO implement me
//	panic("implement me")
//}
//
//func (s *questionService) DeleteQuestion(ctx context.Context, userID string, questionID uuid.UUID) (model.Question, error) {
//	//TODO implement me
//	panic("implement me")
//}
//
//
//
//func (s *questionService) GetQuestionsByUserID(ctx context.Context, userID string, page model.PageParams) ([]model.Question, error) {
//	//TODO implement me
//	panic("implement me")
//}

// authorizeUser checks if the user is authorized to modify the question.
// It checks if the user owns the question AND the question hasn't expired yet.
// If user is not authorized, it returns an error. Otherwise it returns no error.
func (s *questionService) authorizeUser(ctx context.Context, userID string, questionID uuid.UUID) error {
	// fetch the question
	question, err := s.GetQuestionByID(ctx, userID, questionID)
	if err != nil {
		return fmt.Errorf("authorizeUser: %w", err)
	}

	// we need to ensure that the user owns the question
	if !question.IsOwned {
		err := fmt.Errorf("user id %s does not own question id %s", userID, questionID)
		return fmt.Errorf("authorizeUser: %w", errs.UnauthorizedError("You must own this question", err))
	}

	// also, we need to ensure that the question hasn't expired yet
	if time.Now().After(question.ExpiredAt) {
		err := fmt.Errorf("question id %s has expired", questionID)
		return fmt.Errorf("authorizeUser: %w", errs.UnauthorizedError("This question has expired", err))
	}

	return nil
}
