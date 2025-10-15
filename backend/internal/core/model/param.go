package model

import "github.com/google/uuid"

type CreateUserParams struct {
	ID          string
	Username    string
	Email       string
	DisplayName string
	AvatarURL   *string
	Role        Role
}

type CreateQuestionParams struct {
	QuestionType QuestionType
	Category     Category
	Title        string
	Body         *string
	Location     Location
	ImageURLs    []string
}

type GetQuestionsParams struct {
	Latitude      string
	Longitude     string
	Radius        int
	QuestionTitle *string
}

type EditQuestionParams struct {
	QuestionID uuid.UUID
	Title      string
	Body       *string
	Location   Location
	Type       QuestionType
	Category   Category
	ImageURLs  []string
}

type PageParams struct {
	Limit  int
	Offset int
}

type CreateResponseParams struct {
	QuestionID uuid.UUID
	Body       *string
	ImageURLs  []string
	Data       any
}

type EditResponseParams struct {
	ResponseID uuid.UUID
	Body       *string
	Data       any
	ImageURLs  []string
}

type EditUserParams struct {
	UserID    string
	Username  string
	AvatarURL *string
}
