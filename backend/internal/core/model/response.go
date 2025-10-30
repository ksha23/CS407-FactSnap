package model

import (
	"github.com/google/uuid"
	"time"
)

type Response struct {
	ID         uuid.UUID `json:"ID"`
	QuestionID uuid.UUID `json:"question_id"`
	Author     User      `json:"author"`
	Body       *string   `json:"body"`
	Data       any       `json:"data"`
	ImageURLs  []string  `json:"image_urls"`
	CreatedAt  time.Time `json:"created_at"`
	EditedAt   time.Time `json:"edited_at"`
}
