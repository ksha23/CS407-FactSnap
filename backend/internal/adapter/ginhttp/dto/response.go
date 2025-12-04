package dto

import (
	"github.com/google/uuid"
	"github.com/ksha23/CS407-FactSnap/internal/core/model"
	"github.com/ksha23/CS407-FactSnap/internal/validate"
)

// CREATE RESPONSE

type CreateResponseReq struct {
	QuestionID uuid.UUID `json:"question_id" binding:"required"`
	Body       string    `json:"body" binding:"required"`
	ImageURLs  []string  `json:"image_urls" binding:"omitempty"`
}

func (r *CreateResponseReq) Validate() error {
	errsMap := make(ValidationErrs)

	// validate body
	if err := validate.Body(r.Body); err != nil {
		errsMap["body"] = err
	}

	// validate image urls
	if len(r.ImageURLs) > 0 {
		for _, url := range r.ImageURLs {
			if err := validate.URL(url); err != nil {
				errsMap["image_urls"] = err
				break
			}
		}
	}

	if len(errsMap) > 0 {
		return errsMap
	}
	return nil
}

type CreateResponseRes struct {
	Response model.Response `json:"response"`
}

// GET RESPONSE BY ID

type GetResponseByIDRes struct {
	Response model.Response `json:"response"`
}

// EDIT RESPONSE

type EditResponseReq struct {
	ResponseID uuid.UUID `json:"response_id" binding:"required"`
	Body       string    `json:"body" binding:"required"`
}

func (r *EditResponseReq) Validate() error {
	errsMap := make(ValidationErrs)

	// validate body
	if err := validate.Body(r.Body); err != nil {
		errsMap["body"] = err
	}

	if len(errsMap) > 0 {
		return errsMap
	}
	return nil
}

type EditResponseRes struct {
	Response model.Response `json:"response"`
}

// GET RESPONSES BY QUESTION ID

type GetResponsesByQuestionIDRes struct {
	Responses []model.Response `json:"responses"`
}
