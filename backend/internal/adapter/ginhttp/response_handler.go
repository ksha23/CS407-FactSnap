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
	responseRoutes := r.Group("/responses")
	responseRoutes.GET("/:response_id", h.GetResponseByID)
	responseRoutes.POST("", h.CreateResponse)
	responseRoutes.PUT("", h.EditResponse)
	responseRoutes.DELETE("/:response_id", h.DeleteResponse)

	questionRoutes := responseRoutes.Group("/questions/:question_id")
	questionRoutes.GET("", h.GetResponsesByQuestionID) // query params: limit, offset
	questionRoutes.GET("/summary", h.GetQuestionSummary)
}

func (h *ResponseHandler) CreateResponse(c *gin.Context) {
	userID := getAuthUserID(c)

	var req dto.CreateResponseReq
	if err := unmarshalAndValidateReq(c, &req); err != nil {
		c.Error(BadRequestJSON(c, err, fmt.Errorf("%s: %w", "ResponseHandler::CreateResponse", err)))
		return
	}

	resp, err := h.ResponseService.CreateResponse(c.Request.Context(), userID, model.CreateResponseParams{
		QuestionID: req.QuestionID,
		Body:       req.Body,
		ImageURLs:  req.ImageURLs,
	})
	if err != nil {
		HandleErr(c, fmt.Errorf("%s: %w", "ResponseHandler::CreateResponse", err))
		return
	}

	c.JSON(http.StatusCreated, dto.CreateResponseRes{Response: resp})
}

func (h *ResponseHandler) GetResponseByID(c *gin.Context) {
	userID := getAuthUserID(c)

	responseID, err := uuid.Parse(c.Param("response_id"))
	if err != nil {
		c.Error(BadRequest(c, "could not parse response id", fmt.Errorf("%s: %w", "ResponseHandler::GetResponseByID", err)))
		return
	}

	response, err := h.ResponseService.GetResponseByID(c.Request.Context(), userID, responseID)
	if err != nil {
		HandleErr(c, fmt.Errorf("%s: %w", "ResponseHandler::GetResponseByID", err))
		return
	}

	c.JSON(http.StatusOK, dto.GetResponseByIDRes{Response: response})
}

func (h *ResponseHandler) EditResponse(c *gin.Context) {
	userID := getAuthUserID(c)

	var req dto.EditResponseReq
	if err := unmarshalAndValidateReq(c, &req); err != nil {
		c.Error(BadRequestJSON(c, err, fmt.Errorf("%s: %w", "ResponseHandler::EditResponse", err)))
		return
	}

	resp, err := h.ResponseService.EditResponse(c.Request.Context(), userID, model.EditResponseParams{
		ResponseID: req.ResponseID,
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

	rid, err := uuid.Parse(c.Param("response_id"))
	if err != nil {
		c.Error(BadRequest(c, "could not parse response id", fmt.Errorf("%s: %w", "ResponseHandler::DeleteResponse", err)))
		return
	}

	err = h.ResponseService.DeleteResponse(c.Request.Context(), userID, rid)
	if err != nil {
		HandleErr(c, fmt.Errorf("%s: %w", "ResponseHandler::DeleteResponse", err))
		return
	}

	c.Status(http.StatusOK)
}

func (h *ResponseHandler) GetResponsesByQuestionID(c *gin.Context) {
	userID := getAuthUserID(c)

	qid, err := uuid.Parse(c.Param("question_id"))
	if err != nil {
		c.Error(BadRequest(c, "could not parse question id", fmt.Errorf("%s: %w", "ResponseHandler::GetResponsesByQuestionID", err)))
		return
	}

	limit, err := validateLimitQueryParam(c.DefaultQuery("limit", "5"))
	if err != nil {
		c.Error(BadRequest(c, err.Error(), fmt.Errorf("%s: %w", "ResponseHandler::GetResponsesByQuestionID", err)))
		return
	}

	offset, err := validateOffsetQueryParam(c.DefaultQuery("offset", "0"))
	if err != nil {
		c.Error(BadRequest(c, err.Error(), fmt.Errorf("%s: %w", "ResponseHandler::GetResponsesByQuestionID", err)))
		return
	}

	page := model.PageParams{
		Limit:  limit,
		Offset: offset,
	}

	resps, err := h.ResponseService.GetResponsesByQuestionID(c.Request.Context(), userID, qid, page)
	if err != nil {
		HandleErr(c, fmt.Errorf("%s: %w", "ResponseHandler::GetResponsesByQuestionID", err))
		return
	}

	c.JSON(http.StatusOK, dto.GetResponsesByQuestionIDRes{Responses: resps})
}

func (h *ResponseHandler) GetQuestionSummary(c *gin.Context) {
	userID := getAuthUserID(c)

	qid, err := uuid.Parse(c.Param("question_id"))
	if err != nil {
		c.Error(BadRequest(c, "could not parse question id", fmt.Errorf("%s: %w", "ResponseHandler::GetResponsesByQuestionID", err)))
		return
	}

	summary, err := h.ResponseService.SummarizeResponsesByQuestionID(c.Request.Context(), userID, qid)
	if err != nil {
		HandleErr(c, fmt.Errorf("%s: %w", "ResponseHandler::SummarizeResponsesByQuestionID", err))
		return
	}

	c.JSON(http.StatusOK, dto.GetQuestionSummaryRes{Summary: summary})
}
