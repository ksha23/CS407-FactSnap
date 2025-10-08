package model

type CreateUserParams struct {
	ClerkUserID string
	Username    string
	Email       string
	DisplayName string
	AvatarURL   *string
	Role        Role
}
