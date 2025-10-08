package sqlc

import "github.com/ksha23/CS407-FactSnap/internal/core/model"

func (row User) ToDomainModel() model.AuthUser {
	return toDomainAuthUser(row)
}
