package ginhttp

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ksha23/CS407-FactSnap/internal/adapter/ginhttp/dto"
	"github.com/ksha23/CS407-FactSnap/internal/core/model"
	"github.com/ksha23/CS407-FactSnap/internal/core/port"
	"net/http"

	"bytes"
    "encoding/json"
    "io"
    "os"
    "time"
)

type QuestionHandler struct {
	QuestionService port.QuestionService
}

func NewQuestionHandler(questionService port.QuestionService) *QuestionHandler {
	return &QuestionHandler{QuestionService: questionService}
}

func (h *QuestionHandler) RegisterRoutes(r *gin.RouterGroup) {
	questionRoutes := r.Group("/questions")
	questionRoutes.POST("", h.CreateQuestion)
	questionRoutes.GET("/:question_id", h.GetQuestionByID)
	questionRoutes.POST("/feed", h.GetQuestionsInRadiusFeed)
	questionRoutes.PUT("", h.UpdateQuestion)
	questionRoutes.DELETE("/:question_id", h.DeleteQuestion)
	questionRoutes.POST("/:question_id/summary", h.GenerateSummaryTest)

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

func (h *QuestionHandler) UpdateQuestion(c *gin.Context) {
	userID := getAuthUserID(c)

	var req dto.UpdateQuestionReq
	if err := unmarshalAndValidateReq(c, &req); err != nil {
		c.Error(BadRequestJSON(c, err, fmt.Errorf("%s: %w", "QuestionHandler::UpdateQuestion", err)))
		return
	}

	updatedQuestion, err := h.QuestionService.EditQuestion(c.Request.Context(), userID, model.EditQuestionParams{
		QuestionID: req.QuestionID,
		Title:      req.Title,
		Body:       req.Body,
		Category:   req.Category,
		Location:   req.Location,
	})
	if err != nil {
		HandleErr(c, fmt.Errorf("%s: %w", "QuestionHandler::UpdateQuestion", err))
		return
	}

	c.JSON(http.StatusOK, dto.UpdateQuestionRes{Question: updatedQuestion})
}

func (h *QuestionHandler) DeleteQuestion(c *gin.Context) {
	userID := getAuthUserID(c)

	questionID, err := uuid.Parse(c.Param("question_id"))
	if err != nil {
		c.Error(BadRequest(c, "could not parse question id", fmt.Errorf("QuestionHandler::DeleteQuestion: %w", err)))
		return
	}

	if err := h.QuestionService.DeleteQuestion(c.Request.Context(), userID, questionID); err != nil {
		HandleErr(c, fmt.Errorf("%s: %w", "QuestionHandler::DeleteQuestion", err))
		return
	}

	c.Status(http.StatusOK)
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




// Jerry: To do the summary
func (h *QuestionHandler) GenerateSummaryTest(c *gin.Context) {
    // 1) validate question_id param (we don't actually use it for the test)
    qidStr := c.Param("question_id")
    if qidStr == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "missing question_id param"})
        return
    }
    if _, err := uuid.Parse(qidStr); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid question_id"})
        return
    }

    // 2) optional JSON body: { "prompt": "..." }
    var bodyIn struct {
        Prompt string `json:"prompt"`
    }
    _ = c.BindJSON(&bodyIn) // ignore bind error, use default prompt if needed

    prompt := bodyIn.Prompt
    if prompt == "" {
        prompt = "Could you please tell me what is the zipcode of UWmadison (Just answer me in one brief sentence)"
    }

    // 3) OpenAI API key + model
    apiKey := os.Getenv("OPENAI_API_KEY")
    if apiKey == "" {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "OPENAI_API_KEY not set on server"})
        return
    }
    modelName := os.Getenv("OPENAI_MODEL")
    if modelName == "" {
        modelName = "gpt-3.5-turbo" // safe default for chat completions
    }

    // 4) build request object -- minimal to avoid model-specific unsupported-param errors
    reqObj := map[string]interface{}{
        "model": modelName,
        "messages": []map[string]string{
            {"role": "user", "content": prompt},
        },
        // OMIT model-specific params like max_tokens/temperature that some new models reject.
        // If you want to set them for a known-compatible model, add them here carefully.
    }

    b, err := json.Marshal(reqObj)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to marshal openai request"})
        return
    }

    // 5) send request
    httpReq, err := http.NewRequestWithContext(c.Request.Context(), "POST", "https://api.openai.com/v1/chat/completions", bytes.NewReader(b))
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create openai request"})
        return
    }
    httpReq.Header.Set("Authorization", "Bearer "+apiKey)
    httpReq.Header.Set("Content-Type", "application/json")

    client := &http.Client{Timeout: 25 * time.Second}
    resp, err := client.Do(httpReq)
    if err != nil {
        c.JSON(http.StatusBadGateway, gin.H{"error": "openai request failed", "detail": err.Error()})
        return
    }
    defer resp.Body.Close()

    respBytes, _ := io.ReadAll(resp.Body)
    respText := string(respBytes)

    // if non-2xx, forward body as error for easier debugging
    if resp.StatusCode < 200 || resp.StatusCode >= 300 {
        c.JSON(http.StatusBadGateway, gin.H{"error": "openai returned non-2xx", "status": resp.StatusCode, "body": respText})
        return
    }

    // 6) Try robust parsing of common response shapes
    // We'll try multiple possible JSON shapes so we can handle model differences.
    var parsedAny map[string]any
    _ = json.Unmarshal(respBytes, &parsedAny)

    // candidate summary (try several fallbacks)
    var candidate string

    // a) common chat completion: choices[].message.content (string)
    if choices, ok := parsedAny["choices"].([]any); ok && len(choices) > 0 {
        if ch0, ok := choices[0].(map[string]any); ok {
            // choice.message.content (string)
            if msg, ok := ch0["message"].(map[string]any); ok {
                if content, ok := msg["content"].(string); ok && content != "" {
                    candidate = content
                } else {
                    // sometimes content is an object { "type":"text","text": "..." }
                    if contentObj, ok := msg["content"].(map[string]any); ok {
                        if t, ok := contentObj["text"].(string); ok && t != "" {
                            candidate = t
                        }
                    }
                }
            }
            // fallback: choices[].text (older completions format)
            if candidate == "" {
                if txt, ok := ch0["text"].(string); ok && txt != "" {
                    candidate = txt
                }
            }
        }
    }

    // b) if still empty, try to extract simple assistant reply in alternative shapes
    if candidate == "" {
        // try to find any "content" string anywhere (best-effort)
        var walk func(any)
        walk = func(n any) {
            if candidate != "" {
                return
            }
            switch v := n.(type) {
            case map[string]any:
                for k, val := range v {
                    if k == "content" {
                        if s, ok := val.(string); ok && s != "" {
                            candidate = s
                            return
                        }
                        // nested object
                        if inner, ok := val.(map[string]any); ok {
                            if s2, ok := inner["text"].(string); ok && s2 != "" {
                                candidate = s2
                                return
                            }
                        }
                    }
                    walk(val)
                    if candidate != "" {
                        return
                    }
                }
            case []any:
                for _, el := range v {
                    walk(el)
                    if candidate != "" {
                        return
                    }
                }
            }
        }
        walk(parsedAny)
    }

    // 7) return both parsed candidate and raw body so frontend can see what's happening
    c.JSON(http.StatusOK, gin.H{
        "summary": candidate,     // may be empty string if we couldn't find it
        "raw":     respText,      // raw OpenAI response for debugging on the client
    })
}
