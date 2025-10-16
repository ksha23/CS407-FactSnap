package service

import "github.com/ksha23/CS407-FactSnap/internal/core/port"

type questionService struct {
	questionRepo port.QuestionRepo
}

func NewQuestionService(questionRepo port.QuestionRepo) *questionService {
	return &questionService{questionRepo: questionRepo}
}

// TODO: implement QuestionService interface methods
