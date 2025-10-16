package postgres

import (
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ksha23/CS407-FactSnap/internal/adapter/postgres/sqlc"
)

type responseRepo struct {
	query *sqlc.Queries
	db    *pgxpool.Pool
}

func NewResponseRepo(db *pgxpool.Pool) *responseRepo {
	return &responseRepo{
		query: sqlc.New(db),
		db:    db,
	}
}

// TODO: implement ResponseRepo interface methods
