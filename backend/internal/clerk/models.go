package clerk

import "github.com/google/uuid"

const (
	UserIDKey = "clerk_user_id"
)

type Metadata struct {
	ClerkUserID    string
	InternalUserID uuid.UUID
}
