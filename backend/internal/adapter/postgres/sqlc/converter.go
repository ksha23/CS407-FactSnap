package sqlc

import (
	"github.com/ksha23/CS407-FactSnap/internal/core/model"
)

// DomainConverter is a generic interface that contains a method to convert the database row to the domain model of type T
type DomainConverter[T any] interface {
	ToDomainModel() T
}

func toDomainUser(user User) model.User {
	var loc *model.GeoPoint
	if user.LastKnownLocation != nil {
		loc = &model.GeoPoint{
			Latitude:  user.LastKnownLocation.Y,
			Longitude: user.LastKnownLocation.X,
		}
	}

	return model.User{
		ID:                user.ID,
		Username:          user.Username,
		AvatarURL:         user.AvatarUrl,
		AboutMe:           user.AboutMe,
		DisplayName:       user.DisplayName,
		Role:              model.Role(user.Role),
		CreatedAt:         user.CreatedAt,
		ExpoPushToken:     user.ExpoPushToken,
		LastKnownLocation: loc,
	}
}

func toDomainAuthUser(user User) model.AuthUser {
	return model.AuthUser{
		User:  toDomainUser(user),
		Email: user.Email,
	}
}

func toDomainLocation(location Location) model.Location {
	return model.Location{
		ID:        location.ID,
		Latitude:  location.Location.Y,
		Longitude: location.Location.X,
		Name:      location.Name,
		Address:   location.Address,
	}
}

// NEW: row -> domain Question
func (row GetQuestionsByUserIDRow) ToDomainModel() model.Question {
    return model.Question{
        ID:     row.Question.ID,
        Author: toDomainUser(row.User),

        Title: row.Question.Title,
        Body:  row.Question.Body,

        Category: model.Category(row.Question.Category),
        Content: model.QuestionContent{
            Type: model.ContentType(row.Question.ContentType),
            Data: nil, // 内容（Poll 等）由仓库层单独补充
        },

        Location:        toDomainLocation(row.Location),
        ImageURLs:       row.Question.ImageUrls,
        IsOwned:         row.IsOwned,
        ResponsesAmount: row.Question.NumResponses,
        CreatedAt:       row.Question.CreatedAt,
        EditedAt:        row.Question.EditedAt,
        ExpiredAt:       row.Question.ExpiredAt,
    }
}


func (row GetQuestionsRespondedByUserIDRow) ToDomainModel() model.Question {
	return model.Question{
		ID:    row.Question.ID,
		Author: toDomainUser(row.User),

		Title: row.Question.Title,
		Body:  row.Question.Body,

		Category: model.Category(row.Question.Category),
		Content: model.QuestionContent{
			Type: model.ContentType(row.Question.ContentType),
			Data: nil,
		},

		Location: toDomainLocation(row.Location),

		ResponsesAmount: row.Question.NumResponses,
		ImageURLs:       row.Question.ImageUrls,
		IsOwned:         row.IsOwned,

		CreatedAt: row.Question.CreatedAt,
		EditedAt:  row.Question.EditedAt,
		ExpiredAt: row.Question.ExpiredAt,
	}
}