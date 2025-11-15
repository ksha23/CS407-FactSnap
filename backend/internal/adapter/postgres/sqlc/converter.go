package sqlc

import (
	"github.com/ksha23/CS407-FactSnap/internal/core/model"
)

// DomainConverter is a generic interface that contains a method to convert the database row to the domain model of type T
type DomainConverter[T any] interface {
	ToDomainModel() T
}

func toDomainUser(user User) model.User {
	return model.User{
		ID:          user.ID,
		Username:    user.Username,
		AvatarURL:   user.AvatarUrl,
		AboutMe:     user.AboutMe,
		DisplayName: user.DisplayName,
		Role:        model.Role(user.Role),
		CreatedAt:   user.CreatedAt,
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
