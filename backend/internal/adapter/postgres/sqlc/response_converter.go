package sqlc

import (
	"github.com/ksha23/CS407-FactSnap/internal/core/model"
)

func (row CreateResponseRow) ToDomainModel() model.Response {
	return model.Response{
		ID:         row.ID,
		QuestionID: row.QuestionID,
		Author:     toDomainUser(row.User),
		Body:       row.Body,
		IsOwned:    row.IsOwned,
		ImageURLs:  row.ImageUrls,
		CreatedAt:  row.CreatedAt,
		EditedAt:   row.EditedAt,
	}
}

func (row GetAllResponsesByQuestionIDRow) ToDomainModel() model.Response {
	return model.Response{
		ID:         row.Response.ID,
		QuestionID: row.Response.QuestionID,
		Author:     toDomainUser(row.User),
		Body:       row.Response.Body,
		IsOwned:    row.IsOwned,
		ImageURLs:  row.Response.ImageUrls,
		CreatedAt:  row.Response.CreatedAt,
		EditedAt:   row.Response.EditedAt,
	}
}

func (row EditResponseRow) ToDomainModel() model.Response {
	return model.Response{
		ID:         row.ID,
		QuestionID: row.QuestionID,
		Author:     toDomainUser(row.User),
		Body:       row.Body,
		IsOwned:    row.IsOwned,
		ImageURLs:  row.ImageUrls,
		CreatedAt:  row.CreatedAt,
		EditedAt:   row.EditedAt,
	}
}

func (row GetResponseByIDRow) ToDomainModel() model.Response {
	return model.Response{
		ID:         row.Response.ID,
		QuestionID: row.Response.QuestionID,
		Author:     toDomainUser(row.User),
		Body:       row.Response.Body,
		IsOwned:    row.IsOwned,
		ImageURLs:  row.Response.ImageUrls,
		CreatedAt:  row.Response.CreatedAt,
		EditedAt:   row.Response.EditedAt,
	}
}
