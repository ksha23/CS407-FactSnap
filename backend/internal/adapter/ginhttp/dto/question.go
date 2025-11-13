package dto

import (
	"fmt"
	"github.com/google/uuid"
	"github.com/ksha23/CS407-FactSnap/internal/core/model"
	"github.com/ksha23/CS407-FactSnap/internal/validate"
	"time"
)

// CREATE QUESTION

type CreateQuestionReq struct {
	Title     string         `json:"title" binding:"required"`
	Body      *string        `json:"body" binding:"omitempty"`
	Category  model.Category `json:"category" binding:"required"`
	Location  model.Location `json:"location" binding:"required"`
	ImageURLs []string       `json:"image_urls" binding:"omitempty"`
	Duration  string         `json:"duration" binding:"required"`

	// This is set post-validation here, not sent by frontend
	ExpiresAt time.Time
}

func (r *CreateQuestionReq) Validate() error {
	errsMap := make(ValidationErrs)

	// validate title
	if err := validate.Title(r.Title); err != nil {
		errsMap["title"] = err
	}

	// validate body
	if r.Body != nil {
		if err := validate.Body(*r.Body); err != nil {
			errsMap["body"] = err
		}
	}

	// validate category
	category, err := model.ParseCategory(string(r.Category))
	if err != nil {
		errsMap["category"] = err
	}
	r.Category = category

	// validate location
	if err := validate.Location(r.Location.Latitude, r.Location.Longitude); err != nil {
		errsMap["location"] = err
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

	// validate duration
	// must be between 1-24 hours (inclusive)
	duration, err := time.ParseDuration(r.Duration)
	if err != nil {
		errsMap["duration"] = fmt.Errorf("duration is in bad format")
	} else {
		if duration.Hours() < 1 || duration.Hours() > 24 {
			errsMap["duration"] = fmt.Errorf("duration must be between 1-24 hours (inclusive)")
		} else {
			expiresAt := time.Now().Add(duration)
			if err := validate.ExpiresAt(expiresAt); err != nil {
				errsMap["duration"] = err
			}
			r.ExpiresAt = expiresAt
		}
	}

	if len(errsMap) > 0 {
		return errsMap
	}
	return nil
}

type CreateQuestionRes struct {
	QuestionID uuid.UUID `json:"question_id"`
}

// CREATE POLL

type CreatePollReq struct {
	QuestionID   uuid.UUID `json:"question_id" binding:"required"`
	OptionLabels []string  `json:"option_labels" binding:"required"`
}

func (r *CreatePollReq) Validate() error {
	errsMap := make(ValidationErrs)

	// validate option labels
	if err := validate.PollOptionLabels(r.OptionLabels); err != nil {
		errsMap["option_labels"] = err
	}

	if len(errsMap) > 0 {
		return errsMap
	}
	return nil
}

type CreatePollRes struct {
	PollID uuid.UUID `json:"poll_id"`
}

// GET QUESTION BY ID

type GetQuestionByIDRes struct {
	Question model.Question `json:"question"`
}

// VOTE POLL

type VotePollReq struct {
	PollID   uuid.UUID  `json:"poll_id" binding:"required"`
	OptionID *uuid.UUID `json:"option_id"`
}

func (r *VotePollReq) Validate() error {
	// binding already checks if the fields are passed or not
	return nil
}

// GET QUESTIONS IN RADIUS FEED

type GetQuestionsInRadiusFeedReq struct {
	Location        model.Location       `json:"location" binding:"required"`
	RadiusMiles     float64              `json:"radius_miles" binding:"required"`
	Limit           int                  `json:"limit" binding:"omitempty"`
	Offset          int                  `json:"offset" binding:"omitempty"`
	PageFilterType  model.PageFilterType `json:"page_filter_type" binding:"omitempty"`
	PageFilterValue string               `json:"page_filter_value" binding:"omitempty"`
}

func (r *GetQuestionsInRadiusFeedReq) Validate() error {
	errsMap := make(ValidationErrs)

	// validate location
	if err := validate.Location(r.Location.Latitude, r.Location.Longitude); err != nil {
		errsMap["location"] = err
	}

	// validate limit
	if err := validate.PageLimit(r.Limit); err != nil {
		errsMap["limit"] = err
	}

	// validate offset
	if err := validate.PageOffset(r.Offset); err != nil {
		errsMap["offset"] = err
	}

	// validate page filter type
	pageFilterType, err := model.ParsePageFilterType(string(r.PageFilterType))
	if err != nil {
		errsMap["page_filter_type"] = err
	}
	r.PageFilterType = pageFilterType

	if len(errsMap) > 0 {
		return errsMap
	}
	return nil
}

type GetQuestionsInRadiusFeedRes struct {
	// Questions will not have the content data populated.
	Questions []model.Question `json:"questions"`
}
