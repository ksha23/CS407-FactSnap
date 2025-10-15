package dto

import "github.com/ksha23/CS407-FactSnap/internal/core/model"

type SyncClerkUserRes struct {
	AuthUser model.AuthUser `json:"auth_user"`
}

type GetAuthUserRes struct {
	AuthUser model.AuthUser `json:"auth_user"`
}
