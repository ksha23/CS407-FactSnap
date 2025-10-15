package model

import (
	"github.com/google/uuid"
	"time"
)

type Response struct {
	ID         uuid.UUID
	QuestionID uuid.UUID
	Author     User
	Body       *string
	Data       any
	CreatedAt  time.Time
	EditedAt   time.Time
}
