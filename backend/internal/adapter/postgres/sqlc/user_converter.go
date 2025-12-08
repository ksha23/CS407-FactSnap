package sqlc

import (
	"github.com/ksha23/CS407-FactSnap/internal/core/model"
)

func (row User) ToDomainModel() model.AuthUser {
	return toDomainAuthUser(row)
}

func (row UpdateUserDisplayNameRow) ToDomainModel() model.AuthUser {
	var loc *model.GeoPoint
	if row.LastKnownLocation != nil {
		loc = &model.GeoPoint{
			Latitude:  row.LastKnownLocation.Y,
			Longitude: row.LastKnownLocation.X,
		}
	}

	return model.AuthUser{
		User: model.User{
			ID:                row.ID,
			Username:          row.Username,
			AvatarURL:         row.AvatarUrl,
			AboutMe:           row.AboutMe,
			DisplayName:       row.DisplayName,
			Role:              model.Role(row.Role),
			CreatedAt:         row.CreatedAt,
			ExpoPushToken:     row.ExpoPushToken,
			LastKnownLocation: loc,
		},
		Email: row.Email,
	}
}
