package model

import (
	"github.com/google/uuid"
	"time"
)

type Question struct {
	ID        uuid.UUID    `json:"id,omitempty"`
	Type      QuestionType `json:"type,omitempty"`
	Author    User         `json:"author"`
	Title     string       `json:"title,omitempty"`
	Body      *string      `json:"body,omitempty"`
	Location  Location     `json:"location"`
	ImageURLs []string     `json:"image_ur_ls,omitempty"`
	Category  Category     `json:"category,omitempty"`
	Summary   *string      `json:"summary,omitempty"`
	CreatedAt time.Time    `json:"created_at"`
	EditedAt  time.Time    `json:"edited_at"`
}
