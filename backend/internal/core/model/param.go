package model

type CreateUserParams struct {
	ID          string
	Username    string
	Email       string
	DisplayName string
	AvatarURL   *string
	Role        Role
}
