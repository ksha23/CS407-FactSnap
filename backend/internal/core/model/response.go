package model

import (
	"github.com/google/uuid"
	"time"
)

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
	ID         uuid.UUID `json:"id"`
	QuestionID uuid.UUID `json:"question_id"`
	Author     User      `json:"author"`
	Body       string    `json:"body"`
	IsOwned    bool      `json:"is_owned"`
	ImageURLs  []string  `json:"image_urls"`
	CreatedAt  time.Time `json:"created_at"`
	EditedAt   time.Time `json:"edited_at"`
}
