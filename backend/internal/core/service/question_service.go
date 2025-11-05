package service

import (
	"context"
	"fmt"
	"github.com/google/uuid"
	"github.com/ksha23/CS407-FactSnap/internal/core/model"
	"github.com/ksha23/CS407-FactSnap/internal/core/port"
)

type questionService struct {
	questionRepo port.QuestionRepo
}

func NewQuestionService(questionRepo port.QuestionRepo) *questionService {
	return &questionService{questionRepo: questionRepo}
}

func (s *questionService) CreateQuestion(ctx context.Context, userID string, params model.CreateQuestionParams) (model.Question, error) {
	newQuestion, err := s.questionRepo.CreateQuestion(ctx, userID, params)
	if err != nil {
		return model.Question{}, fmt.Errorf("QuestionService::CreateQuestion: %w", err)
	}
	return newQuestion, nil
}

func (s *questionService) GetQuestionByID(ctx context.Context, userID string, questionID uuid.UUID) (model.Question, error) {
	question, err := s.questionRepo.GetQuestionByID(ctx, userID, questionID)
	if err != nil {
		return model.Question{}, fmt.Errorf("QuestionService::GetQuestionByID: %w", err)
	}
	return question, err
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
//func (s *questionService) EditQuestion(ctx context.Context, userID string, params model.EditQuestionParams) (model.Question, error) {
//	//TODO implement me
//	panic("implement me")
//}
//
//
//func (s *questionService) GetQuestionsByUserID(ctx context.Context, userID string, page model.PageParams) ([]model.Question, error) {
//	//TODO implement me
//	panic("implement me")
//}
