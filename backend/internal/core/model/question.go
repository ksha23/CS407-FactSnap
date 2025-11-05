package model

import (
	"github.com/google/uuid"
	"time"
)

type Question struct {
	ID   uuid.UUID     `json:"id"`
	Type *QuestionType `json:"type"`
	// Poll is only set if Type is QuestionTypePoll
	Poll      *Poll     `json:"poll"`
	Category  Category  `json:"category"`
	Author    User      `json:"author"`
	Title     string    `json:"title"`
	Body      *string   `json:"body"`
	Location  Location  `json:"location"`
	ImageURLs []string  `json:"image_urls"`
	Summary   *string   `json:"summary"`
	CreatedAt time.Time `json:"created_at"`
	EditedAt  time.Time `json:"edited_at"`
}

type Poll struct {
	Options       []PollOption `json:"options"`
	NumTotalVotes int          `json:"num_total_votes"`
	CreatedAt     time.Time    `json:"created_at"`
	ExpiresAt     time.Time    `json:"expires_at"`
}

type PollOption struct {
	Label    string `json:"label"`
	NumVotes int    `json:"num_votes"`
}
