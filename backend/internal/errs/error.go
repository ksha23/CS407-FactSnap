package errs

import (
	"errors"
	"fmt"
)

type Type string

const (
	TypeNotFound        Type = "NotFound"
	TypeForbidden       Type = "Forbidden"
	TypeUnauthorized    Type = "Unauthorized"
	TypeUnauthenticated Type = "Unauthenticated"
	TypeBadRequest      Type = "BadRequest"
)

type Error struct {
	Type     Type   `json:"type"`     // Type is the type of this error, for clients to act accordingly. Optional
	Message  string `json:"message"`  // Message is a descriptive message for clients. Optional
	Internal error  `json:"internal"` // Internal is the underlying, wrapped error. Required
}

func (e Error) Error() string {
	if e.Message != "" && e.Message != e.Internal.Error() {
		return fmt.Sprintf("message=%s internal=%s", e.Message, e.Internal)
	} else {
		return fmt.Sprintf("internal=%s", e.Internal)
	}
}

func (e Error) Unwrap() error {
	return e.Internal
}

// ErrType returns the Type associated with Error.
// If there is no type, then it returns empty string.
func ErrType(err error) Type {
	var errsError Error
	if errors.As(err, &errsError) {
		return errsError.Type
	}
	return ""
}

func UnauthorizedError(msg string, err error) error {
	if err == nil {
		err = errors.New(msg)
	}
	return Error{
		Type:     TypeUnauthorized,
		Message:  msg,
		Internal: err,
	}
}
