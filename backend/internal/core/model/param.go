package model

import (
	"github.com/google/uuid"
	"time"
)

type CreateUserParams struct {
	ID          string
	Username    string
	Email       string
	DisplayName string
	AvatarURL   *string
	Role        Role
}

type CreateQuestionParams struct {
	Title     string
	Body      *string
	Category  Category
	Location  Location
	ImageURLs []string
	ExpiresAt time.Time
}

type CreatePollParams struct {
	QuestionID   uuid.UUID
	OptionLabels []string
}

type GetQuestionsInRadiusFeedParams struct {
	Lat         float64
	Lon         float64
	RadiusMiles float64
}

type EditQuestionParams struct {
	QuestionID uuid.UUID
	Title      string
	Body       *string
	Category   Category
	Location   Location
}

//
//type CreateResponseParams struct {
//	QuestionID uuid.UUID
//	Body       *string
//	ImageURLs  []string
//	Data       any
//}
//
//type EditResponseParams struct {
//	ResponseID uuid.UUID
//	Body       *string
//	Data       any
//	ImageURLs  []string
//}
//
//type EditUserParams struct {
//	UserID    string
//	Username  string
//	AvatarURL *string
//}
