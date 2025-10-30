package model

import (
	"github.com/google/uuid"
	"time"
)

type Question struct {
	ID        uuid.UUID    `json:"id"`
	Type      QuestionType `json:"type"`
	Category  Category     `json:"category"`
	Author    User         `json:"author"`
	Title     string       `json:"title"`
	Body      *string      `json:"body"`
	Location  Location     `json:"location"`
	ImageURLs []string     `json:"image_urls"`
	Summary   *string      `json:"summary"`
	CreatedAt time.Time    `json:"created_at"`
	EditedAt  time.Time    `json:"edited_at"`
}
