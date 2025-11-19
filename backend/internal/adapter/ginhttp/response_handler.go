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

// ResponseHandler handles response-related routes
type ResponseHandler struct {
	ResponseService port.ResponseService
}

func NewResponseHandler(responseService port.ResponseService) *ResponseHandler {
	return &ResponseHandler{ResponseService: responseService}
}

func (h *ResponseHandler) RegisterRoutes(r *gin.RouterGroup) {
	// Register routes under the passed router group.
	// If you call RegisterRoutes(apiGroup) where apiGroup is router.Group("/api"),
	// the final paths will be: /api/questions/:question_id/responses etc.
	r.POST("/questions/:question_id/responses", h.CreateResponse)
	r.GET("/questions/:question_id/responses", h.GetResponsesByQuestionID)
	r.PUT("/questions/:question_id/responses/:response_id", h.EditResponse)
	r.DELETE("/questions/:question_id/responses/:response_id", h.DeleteResponse)
}

// CreateResponse creates a new response for a question
func (h *ResponseHandler) CreateResponse(c *gin.Context) {
	userID := getAuthUserID(c)

	qidStr := c.Param("question_id")
	qid, err := uuid.Parse(qidStr)
	if err != nil {
		c.Error(BadRequest(c, "could not parse question id", fmt.Errorf("%s: %w", "ResponseHandler::CreateResponse", err)))
		return
	}

	var req dto.CreateResponseReq
	if err := unmarshalAndValidateReq(c, &req); err != nil {
		c.Error(BadRequestJSON(c, err, fmt.Errorf("%s: %w", "ResponseHandler::CreateResponse", err)))
		return
	}

	resp, err := h.ResponseService.CreateResponse(c.Request.Context(), userID, model.CreateResponseParams{
		QuestionID: qid,
		Body:       req.Body,
		ImageURLs:  req.ImageURLs,
	})
	if err != nil {
		HandleErr(c, fmt.Errorf("%s: %w", "ResponseHandler::CreateResponse", err))
		return
	}

	c.JSON(http.StatusCreated, dto.CreateResponseRes{Response: resp})
}

// GetResponsesByQuestionID returns responses for a question (no pagination for now)
func (h *ResponseHandler) GetResponsesByQuestionID(c *gin.Context) {
	userID := getAuthUserID(c)

	qidStr := c.Param("question_id")
	qid, err := uuid.Parse(qidStr)
	if err != nil {
		c.Error(BadRequest(c, "could not parse question id", fmt.Errorf("%s: %w", "ResponseHandler::GetResponsesByQuestionID", err)))
		return
	}

	// TODO: For now we pass empty PageParams (no paging)
	resps, err := h.ResponseService.GetResponsesByQuestionID(c.Request.Context(), userID, qid, model.PageParams{})
	if err != nil {
		HandleErr(c, fmt.Errorf("%s: %w", "ResponseHandler::GetResponsesByQuestionID", err))
		return
	}

	c.JSON(http.StatusOK, gin.H{"responses": resps})
}

// EditResponse edits an existing response (only author allowed)
func (h *ResponseHandler) EditResponse(c *gin.Context) {
	userID := getAuthUserID(c)

	ridStr := c.Param("response_id")
	rid, err := uuid.Parse(ridStr)
	if err != nil {
		c.Error(BadRequest(c, "could not parse response id", fmt.Errorf("%s: %w", "ResponseHandler::EditResponse", err)))
		return
	}

	var req dto.EditResponseReq
	if err := unmarshalAndValidateReq(c, &req); err != nil {
		c.Error(BadRequestJSON(c, err, fmt.Errorf("%s: %w", "ResponseHandler::EditResponse", err)))
		return
	}

	resp, err := h.ResponseService.EditResponse(c.Request.Context(), userID, model.EditResponseParams{
		ResponseID: rid,
		Body:       req.Body,
	})
	if err != nil {
		HandleErr(c, fmt.Errorf("%s: %w", "ResponseHandler::EditResponse", err))
		return
	}

	c.JSON(http.StatusOK, dto.EditResponseRes{Response: resp})
}

func (h *ResponseHandler) DeleteResponse(c *gin.Context) {
	userID := getAuthUserID(c)

	qid, err := uuid.Parse(c.Param("question_id"))
	if err != nil {
		c.Error(BadRequest(c, "could not parse question_id id", fmt.Errorf("%s: %w", "ResponseHandler::DeleteResponse", err)))
		return
	}

	rid, err := uuid.Parse(c.Param("response_id"))
	if err != nil {
		c.Error(BadRequest(c, "could not parse response id", fmt.Errorf("%s: %w", "ResponseHandler::DeleteResponse", err)))
		return
	}

	err = h.ResponseService.DeleteResponse(c.Request.Context(), userID, qid, rid)
	if err != nil {
		HandleErr(c, fmt.Errorf("%s: %w", "ResponseHandler::DeleteResponse", err))
		return
	}

	c.Status(http.StatusOK)
}
