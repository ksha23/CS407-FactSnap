package ginhttp

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ksha23/CS407-FactSnap/internal/adapter/ginhttp/dto"
	"github.com/ksha23/CS407-FactSnap/internal/core/model"
	"github.com/ksha23/CS407-FactSnap/internal/core/port"
	"net/http"
)

type QuestionHandler struct {
	QuestionService port.QuestionService
}

func NewQuestionHandler(questionService port.QuestionService) *QuestionHandler {
	return &QuestionHandler{QuestionService: questionService}
}

func (h *QuestionHandler) RegisterRoutes(r *gin.RouterGroup) {
	// TODO: add API routes for questions
	questionRoutes := r.Group("/questions")
	questionRoutes.POST("", h.CreateQuestion)
	questionRoutes.GET("/:question_id", h.GetQuestionByID)
	questionRoutes.POST("/feed", h.GetQuestionsInRadiusFeed)

	pollRoutes := questionRoutes.Group("/poll")
	pollRoutes.POST("", h.CreatePoll)
	pollRoutes.POST("/vote", h.VotePoll)
}

func (h *QuestionHandler) CreateQuestion(c *gin.Context) {
	userID := getAuthUserID(c)

	var req dto.CreateQuestionReq
	if err := unmarshalAndValidateReq(c, &req); err != nil {
		c.Error(BadRequestJSON(c, err, fmt.Errorf("%s: %w", "QuestionHandler::CreateQuestion", err)))
		return
	}

	questionID, err := h.QuestionService.CreateQuestion(c.Request.Context(), userID, model.CreateQuestionParams{
		Title:     req.Title,
		Body:      req.Body,
		Category:  req.Category,
		Location:  req.Location,
		ImageURLs: req.ImageURLs,
		ExpiresAt: req.ExpiresAt,
	})
	if err != nil {
		HandleErr(c, fmt.Errorf("%s: %w", "QuestionHandler::CreateQuestion", err))
		return
	}

	c.JSON(http.StatusCreated, dto.CreateQuestionRes{QuestionID: questionID})
}

func (h *QuestionHandler) CreatePoll(c *gin.Context) {
	userID := getAuthUserID(c)

	var req dto.CreatePollReq
	if err := unmarshalAndValidateReq(c, &req); err != nil {
		c.Error(BadRequestJSON(c, err, fmt.Errorf("%s: %w", "QuestionHandler::CreatePoll", err)))
		return
	}

	pollID, err := h.QuestionService.CreatePoll(c.Request.Context(), userID, model.CreatePollParams{
		QuestionID:   req.QuestionID,
		OptionLabels: req.OptionLabels,
	})
	if err != nil {
		HandleErr(c, fmt.Errorf("%s: %w", "QuestionHandler::CreatePoll", err))
		return
	}

	c.JSON(http.StatusCreated, dto.CreatePollRes{PollID: pollID})
}

func (h *QuestionHandler) VotePoll(c *gin.Context) {
	userID := getAuthUserID(c)

	var req dto.VotePollReq
	if err := unmarshalAndValidateReq(c, &req); err != nil {
		c.Error(BadRequestJSON(c, err, fmt.Errorf("%s: %w", "QuestionHandler::VotePoll", err)))
		return
	}

	err := h.QuestionService.VotePoll(c.Request.Context(), userID, req.PollID, req.OptionID)
	if err != nil {
		HandleErr(c, fmt.Errorf("%s: %w", "QuestionHandler::VotePoll", err))
		return
	}

	c.Status(http.StatusOK)
}

func (h *QuestionHandler) GetQuestionByID(c *gin.Context) {
	userID := getAuthUserID(c)

	questionID, err := uuid.Parse(c.Param("question_id"))
	if err != nil {
		c.Error(BadRequest(c, "could not parse question id", fmt.Errorf("%s: %w", "QuestionHandler::GetQuestionByID", err)))
		return
	}

	question, err := h.QuestionService.GetQuestionByID(c.Request.Context(), userID, questionID)
	if err != nil {
		HandleErr(c, fmt.Errorf("%s: %w", "QuestionHandler::GetQuestionByID", err))
		return
	}

	c.JSON(http.StatusOK, dto.GetQuestionByIDRes{Question: question})
}

func (h *QuestionHandler) GetQuestionsInRadiusFeed(c *gin.Context) {
	userID := getAuthUserID(c)

	var req dto.GetQuestionsInRadiusFeedReq
	if err := unmarshalAndValidateReq(c, &req); err != nil {
		c.Error(BadRequestJSON(c, err, fmt.Errorf("%s: %w", "QuestionHandler::GetQuestionsInRadiusFeed", err)))
		return
	}

	params := model.GetQuestionsInRadiusFeedParams{
		Lat:         req.Location.Latitude,
		Lon:         req.Location.Longitude,
		RadiusMiles: req.RadiusMiles,
	}

	page := model.PageParams{
		Limit:  req.Limit,
		Offset: req.Offset,
		Filter: model.PageFilter{
			Type:  req.PageFilterType,
			Value: req.PageFilterValue,
		},
	}

	questions, err := h.QuestionService.GetQuestionsInRadiusFeed(c.Request.Context(), userID, params, page)
	if err != nil {
		HandleErr(c, fmt.Errorf("%s: %w", "QuestionHandler::GetQuestionsInRadiusFeed", err))
		return
	}

	c.JSON(http.StatusOK, dto.GetQuestionsInRadiusFeedRes{Questions: questions})
}
