package ginhttp

import (
	"github.com/gin-gonic/gin"
	"github.com/ksha23/CS407-FactSnap/internal/core/port"
)

type QuestionHandler struct {
	QuestionService port.QuestionService
}

func NewQuestionHandler(questionService port.QuestionService) *QuestionHandler {
	return &QuestionHandler{QuestionService: questionService}
}

func (h *QuestionHandler) RegisterRoutes(r *gin.RouterGroup) {
	// TODO: add API routes for questions
	//questionRoutes := r.Group("/questions")
}
