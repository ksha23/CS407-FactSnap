package model

import (
	"github.com/google/uuid"
	"time"
)

// Jerry create for create&edit responses
type CreateResponseParams struct {
	QuestionID uuid.UUID
	Body       string
	ImageURLs  []string
}

type EditResponseParams struct {
	ResponseID uuid.UUID
	Body       string
}

// Response model
type Response struct {
	ID         uuid.UUID `json:"ID"`
	QuestionID uuid.UUID `json:"question_id"`
	Author     User      `json:"author"`
	Body       string    `json:"body"`
	IsOwned    bool      `json:"is_owned"`
	ImageURLs  []string  `json:"image_urls"`
	CreatedAt  time.Time `json:"created_at"`
	EditedAt   time.Time `json:"edited_at"`
}
