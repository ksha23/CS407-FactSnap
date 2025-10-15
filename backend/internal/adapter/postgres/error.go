package postgres

import (
	"errors"
	"fmt"
	"github.com/jackc/pgerrcode"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/ksha23/CS407-FactSnap/internal/errs"
	"strings"
)

// Error represents a Postgres error
type Error struct {
	Type     errs.Type `json:"type"`
	Code     string    `json:"code"`
	Message  string    `json:"message"`
	Detail   string    `json:"detail"`
	Field    string    `json:"field"`
	Internal error     `json:"internal"`
}

func (err Error) Error() string {
	return fmt.Sprintf("pg error: type=%s code=%s message=%s detail=%s field=%s internal=%s",
		err.Type,
		err.Code,
		err.Message,
		err.Detail,
		err.Field,
		err.Internal,
	)
}

func wrapError(err error) error {
	if err == nil {
		return nil
	}
	pgErr := postgresErr(err)
	errsError := errs.Error{
		Type:     pgErr.Type,
		Internal: pgErr,
	}
	switch pgErr.Type {
	case errs.TypeForbidden:
		if pgErr.Field != "" {
			errsError.Message = fmt.Sprintf("%s is already taken", pgErr.Field)
		}
	}
	return errsError
}

func postgresErr(err error) Error {
	var pgErr Error
	if errors.As(err, &pgErr) {
		return pgErr
	}

	if errors.Is(err, pgx.ErrNoRows) {
		return Error{
			Type:     errs.TypeNotFound,
			Message:  "No rows returned",
			Internal: err,
		}
	}

	if err, ok := err.(*pgconn.PgError); ok {
		switch err.Code {
		case pgerrcode.UniqueViolation:
			return Error{
				Type:     errs.TypeForbidden,
				Code:     err.Code,
				Message:  err.Message,
				Detail:   err.Detail,
				Field:    extractField(err.Detail),
				Internal: err,
			}
		case pgerrcode.ForeignKeyViolation:
			return Error{
				Type:     errs.TypeNotFound,
				Code:     err.Code,
				Message:  err.Message,
				Detail:   err.Detail,
				Field:    err.ColumnName,
				Internal: err,
			}
		default:
			return Error{
				Code:     err.Code,
				Message:  err.Message,
				Detail:   err.Detail,
				Field:    err.ColumnName,
				Internal: err,
			}
		}
	}

	return Error{
		Message:  "Unknown postgres error has occurred",
		Internal: err,
	}
}

func extractField(detail string) string {
	if strings.Contains(detail, ",") {
		return ""
	}

	start := strings.Index(detail, "=") + 2
	end := strings.Index(detail[start:], ")") + start

	if start > 1 && end > start {
		return detail[start:end]
	} else {
		return ""
	}
}
