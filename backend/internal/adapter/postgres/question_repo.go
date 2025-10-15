package postgres

import (
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ksha23/CS407-FactSnap/internal/adapter/postgres/sqlc"
)

type questionRepo struct {
	query *sqlc.Queries
	db    *pgxpool.Pool
}

func NewQuestionRepo(db *pgxpool.Pool) *questionRepo {
	return &questionRepo{
		query: sqlc.New(db),
		db:    db,
	}
}
