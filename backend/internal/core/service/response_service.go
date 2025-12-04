package service

import (
	"bytes"
	"context"
	"fmt"
	"github.com/google/uuid"
	"github.com/ksha23/CS407-FactSnap/internal/core/model"
	"github.com/ksha23/CS407-FactSnap/internal/core/port"
	"github.com/ksha23/CS407-FactSnap/internal/errs"
	"html/template"
	"log/slog"
	"time"
)

const summaryPrompt = `
Summarize all the responses in the following using the third person and three points.

Responses:
{{.Responses}}

Constraints:
- Provide exactly three concise bullet points.
- Use third-person phrasing (e.g., "Users report..." or "Respondents mention...").
- Each bullet point should be one short sentence (no sub-clauses).
- Keep language neutral and factual.
- Do not include extra commentary or prefatory text.
`

var summaryTemplate = template.Must(template.New("summary").Parse(summaryPrompt))

type responseService struct {
	questionService port.QuestionService
	mediaService    port.MediaService
	responseRepo    port.ResponseRepo
	aiClient        port.AIClient
}

func NewResponseService(
	questionService port.QuestionService,
	mediaService port.MediaService,
	responseRepo port.ResponseRepo,
	aiClient port.AIClient,
) *responseService {
	return &responseService{
		questionService: questionService,
		mediaService:    mediaService,
		responseRepo:    responseRepo,
		aiClient:        aiClient,
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

func (s *responseService) GetResponseByID(ctx context.Context, userID string, responseID uuid.UUID) (model.Response, error) {
	response, err := s.responseRepo.GetResponseByID(ctx, userID, responseID)
	if err != nil {
		return model.Response{}, fmt.Errorf("ResponseService::GetResponseByID: %w", err)
	}
	return response, err
}

func (s *responseService) EditResponse(ctx context.Context, userID string, params model.EditResponseParams) (model.Response, error) {
	// check if user is authorized to edit this response
	if _, err := s.authorizeUser(ctx, userID, params.ResponseID, false); err != nil {
		return model.Response{}, fmt.Errorf("ResponseService::EditResponse: %w", err)
	}

	resp, err := s.responseRepo.EditResponse(ctx, userID, params)
	if err != nil {
		return model.Response{}, fmt.Errorf("ResponseService::EditResponse: %w", err)
	}

	return resp, nil
}

func (s *responseService) DeleteResponse(ctx context.Context, userID string, responseID uuid.UUID) error {
	// check if user is authorized to delete this response
	response, err := s.authorizeUser(ctx, userID, responseID, true)
	if err != nil {
		return fmt.Errorf("ResponseService::DeleteResponse: %w", err)
	}

	err = s.responseRepo.DeleteResponse(ctx, userID, response.QuestionID, responseID)
	if err != nil {
		return fmt.Errorf("ResponseService::DeleteResponse: %w", err)

	}

	// delete response images in the background (async)
	if len(response.ImageURLs) > 0 {
		go func() {
			ctx, cancel := context.WithTimeout(context.WithoutCancel(ctx), 10*time.Second)
			defer cancel()
			if err := s.mediaService.DeleteMedia(ctx, response.ImageURLs); err != nil {
				slog.ErrorContext(ctx, "ResponseService::DeleteResponse: error while deleting images", "error", err, "image_urls", response.ImageURLs)
			}
		}()
	}

	return nil
}

func (s *responseService) SummarizeResponsesByQuestionID(ctx context.Context, userID string, questionID uuid.UUID) (string, error) {
	// fetch responses to summarize (for now we do first 20)
	responses, err := s.responseRepo.GetResponsesByQuestionID(ctx, userID, questionID, model.PageParams{
		Limit:  20,
		Offset: 0,
	})
	if err != nil {
		return "", fmt.Errorf("ResponseService::SummarizeResponsesByQuestionID: %w", err)
	}

	// build prompt
	prompt, err := s.buildSummaryPrompt(responses)
	if err != nil {
		return "", fmt.Errorf("ResponseService::SummarizeResponsesByQuestionID: %w", err)
	}

	// send to ai client
	// TODO: maybe can cache the output for a brief period of time...?
	output, err := s.aiClient.Prompt(ctx, prompt)
	if err != nil {
		return "", fmt.Errorf("ResponseService::SummarizeResponsesByQuestionID: prompt error: %w", err)
	}

	return output, nil
}

func (s *responseService) buildSummaryPrompt(responses []model.Response) (string, error) {
	// gather the responses' body delimited by new-line
	responseBodies := bytes.NewBufferString("")
	for _, response := range responses {
		responseBodies.WriteString(response.Body)
		responseBodies.WriteString("\n")
	}

	var buf bytes.Buffer
	err := summaryTemplate.Execute(&buf, struct {
		Responses string
	}{
		Responses: responseBodies.String(),
	})
	if err != nil {
		return "", fmt.Errorf("buildSummaryPrompt: could not execute template: %w", err)
	}

	return buf.String(), nil
}

//func (s *responseService) GetResponsesByUserID(ctx context.Context, userID string, page model.PageParams) ([]model.Response, error) {
//	//TODO implement me
//	panic("implement me")
//}

func (s *responseService) authorizeUser(ctx context.Context, userID string, responseID uuid.UUID, bypassExpiration bool) (model.Response, error) {
	// fetch the response
	response, err := s.responseRepo.GetResponseByID(ctx, userID, responseID)
	if err != nil {
		return model.Response{}, fmt.Errorf("authorizeUser: %w", err)
	}

	// ensure that the user owns the response
	if !response.IsOwned {
		err := fmt.Errorf("user id %s does not own response id %s", userID, responseID)
		return model.Response{}, fmt.Errorf("authorizeUser: %w", errs.UnauthorizedError("You must own this response", err))
	}

	// also, we need to ensure that the question hasn't expired yet
	if !bypassExpiration {
		err = s.isQuestionExpired(ctx, userID, response.QuestionID)
		if err != nil {
			return model.Response{}, fmt.Errorf("authorizeUser: %w", err)
		}
	}

	return response, nil
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
