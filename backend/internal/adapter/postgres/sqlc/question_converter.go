package sqlc

import (
	"github.com/ksha23/CS407-FactSnap/internal/core/model"
)

func (row CreateQuestionRow) ToDomainModel() model.Question {
	return model.Question{
		ID: row.ID,
		Content: model.QuestionContent{
			Type: model.ContentTypeNone,
		},
		Category:  model.Category(row.Category),
		Author:    toDomainUser(row.User),
		Title:     row.Title,
		Body:      row.Body,
		Location:  toDomainLocation(row.Location),
		ImageURLs: row.ImageUrls,
		IsOwned:   row.IsOwned,
		CreatedAt: row.CreatedAt,
		EditedAt:  row.EditedAt,
		ExpiredAt: row.ExpiredAt,
	}
}

func (row GetQuestionByIDRow) ToDomainModel() model.Question {
	return model.Question{
		ID:       row.Question.ID,
		Author:   toDomainUser(row.User),
		Title:    row.Question.Title,
		Body:     row.Question.Body,
		Category: model.Category(row.Question.Category),
		Content: model.QuestionContent{
			Type: model.ContentType(row.Question.ContentType),
			// NOTE: Content data will need to be populated elsewhere
		},
		Location:  toDomainLocation(row.Location),
		ImageURLs: row.Question.ImageUrls,
		IsOwned:   row.IsOwned,
		CreatedAt: row.Question.CreatedAt,
		EditedAt:  row.Question.EditedAt,
		ExpiredAt: row.Question.ExpiredAt,
	}
}
