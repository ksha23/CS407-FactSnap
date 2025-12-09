package dto

import "github.com/ksha23/CS407-FactSnap/internal/core/model"

type SyncClerkUserRes struct {
	AuthUser model.AuthUser `json:"auth_user"`
}

type GetAuthUserRes struct {
	AuthUser model.AuthUser `json:"auth_user"`
}

type GetUserStatisticsRes struct {
	QuestionCount int `json:"question_count"`
	ResponseCount int `json:"response_count"`
}


type UpdateProfileReq struct {
    DisplayName string `json:"display_name" binding:"required,min=2,max=50"`
}

func (r *UpdateProfileReq) Validate() error {
    return nil
}