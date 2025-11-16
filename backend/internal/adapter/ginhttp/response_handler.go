package ginhttp

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
    "errors"
    "strings"
    "github.com/jackc/pgx/v5"
	"github.com/ksha23/CS407-FactSnap/internal/adapter/ginhttp/dto"
	"github.com/ksha23/CS407-FactSnap/internal/core/model"
	"github.com/ksha23/CS407-FactSnap/internal/core/port"
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid question_id"})
		return
	}

	var req dto.CreateResponseReq
	if err := unmarshalAndValidateReq(c, &req); err != nil {
		c.Error(BadRequestJSON(c, err, err))
		return
	}

	resp, err := h.ResponseService.CreateResponse(c.Request.Context(), userID, model.CreateResponseParams{
		QuestionID: qid,
		Body:       req.Body,
		ImageURLs:  req.ImageURLs,
	})
	if err != nil {
		HandleErr(c, err)
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid question_id"})
		return
	}

	// For now we pass empty PageParams (no paging)
	resps, err := h.ResponseService.GetResponsesByQuestionID(c.Request.Context(), userID, qid, model.PageParams{})
	if err != nil {
		HandleErr(c, err)
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
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid response_id"})
        return
    }

    var req dto.EditResponseReq
    if err := unmarshalAndValidateReq(c, &req); err != nil {
        c.Error(BadRequestJSON(c, err, err))
        return
    }

    resp, err := h.ResponseService.EditResponse(c.Request.Context(), userID, model.EditResponseParams{
        ResponseID: rid,
        Body:       req.Body,
        ImageURLs:  req.ImageURLs,
    })
    if err != nil {
        // 区分错误类型
        if errors.Is(err, pgx.ErrNoRows) {
            c.JSON(http.StatusNotFound, gin.H{"error": "response not found"})
            return
        }
        if strings.Contains(err.Error(), "forbidden") {
            c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
            return
        }
        HandleErr(c, err)
        return
    }

    c.JSON(http.StatusOK, dto.EditResponseRes{Response: resp})
}

// DeleteResponse deletes a response (only author allowed)
// returns {"success": true, "question_id": "<qid>"} on success
func (h *ResponseHandler) DeleteResponse(c *gin.Context) {
    userID := getAuthUserID(c)

    ridStr := c.Param("response_id")
    rid, err := uuid.Parse(ridStr)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid response_id"})
        return
    }

    qid, err := h.ResponseService.DeleteResponse(c.Request.Context(), userID, rid)
    if err != nil {
        if errors.Is(err, pgx.ErrNoRows) {
            c.JSON(http.StatusNotFound, gin.H{"error": "response not found"})
            return
        }
        if strings.Contains(err.Error(), "forbidden") {
            c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
            return
        }
        HandleErr(c, err)
        return
    }

    c.JSON(http.StatusOK, gin.H{"success": true, "question_id": qid})
}