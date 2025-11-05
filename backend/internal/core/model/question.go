package model

import (
	"fmt"
	"github.com/google/uuid"
	"strings"
	"time"
)

type Question struct {
	ID        uuid.UUID       `json:"id"`
	Author    User            `json:"author"`
	Title     string          `json:"title"`
	Body      *string         `json:"body"`
	Category  Category        `json:"category"`
	Content   QuestionContent `json:"content"`
	Location  Location        `json:"location"`
	ImageURLs []string        `json:"image_urls"`
	IsOwned   bool            `json:"is_owned"`
	CreatedAt time.Time       `json:"created_at"`
	EditedAt  time.Time       `json:"edited_at"`
	ExpiredAt time.Time       `json:"expired_at"`
}

type ContentType string

const (
	ContentTypeUnknown ContentType = "Unknown"
	ContentTypeNone    ContentType = "None"
	ContentTypePoll    ContentType = "Poll"
)

var contentTypeEnumValues = map[string]ContentType{
	"poll": ContentTypePoll,
	"none": ContentTypeNone,
}

func ParseContentType(str string) (ContentType, error) {
	if enum, ok := contentTypeEnumValues[strings.ToLower(str)]; ok {
		return enum, nil
	}
	return ContentTypeUnknown, fmt.Errorf("%s is not a valid content type", str)
}

type QuestionContent struct {
	Type ContentType `json:"type"`
	Data any         `json:"data"`
}

type Poll struct {
	ID            uuid.UUID    `json:"id"`
	QuestionID    uuid.UUID    `json:"question_id"`
	Options       []PollOption `json:"options"`
	NumTotalVotes int          `json:"num_total_votes"`
	CreatedAt     time.Time    `json:"created_at"`
	ExpiredAt     time.Time    `json:"expired_at"`
}

type PollOption struct {
	ID         uuid.UUID `json:"id"`
	IsSelected bool      `json:"is_selected"`
	Label      string    `json:"label"`
	NumVotes   int       `json:"num_votes"`
}
