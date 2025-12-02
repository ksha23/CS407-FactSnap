package postgres

import (
	"context"
	"errors"
	"fmt"
	"github.com/cridenour/go-postgis"
	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/pgx/v5"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/ksha23/CS407-FactSnap/internal/adapter/postgres/sqlc"
	"github.com/ksha23/CS407-FactSnap/internal/config"
	"github.com/ksha23/CS407-FactSnap/sql/migration"
	"time"
)

// convertRowsToDomain is a helper function that converts a row of structs that implements sqlc.DomainConverter of type C
// to a row of domain models of type D
func convertRowsToDomain[D any, C sqlc.DomainConverter[D]](rows []C) []D {
	if rows == nil {
		return nil
	}

	converted := make([]D, len(rows))
	for i, row := range rows {
		converted[i] = row.ToDomainModel()
	}

	return converted
}

// execTx executes a function within a database transaction
func execTx(ctx context.Context, db *pgxpool.Pool, fn func(queries *sqlc.Queries) error) error {
	tx, err := db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("transaction::execTx:BeginTx: %w", err)
	}

	queryTx := sqlc.New(tx)
	err = fn(queryTx)
	if err != nil {
		if rbErr := tx.Rollback(ctx); rbErr != nil {
			return fmt.Errorf("transaction::execTx:Rollback: tx err: %w, rb err: %w", err, rbErr)
		}
		return fmt.Errorf("transaction::execTx: %w", err)
	}

	return tx.Commit(ctx)
}

func Connect(cfg config.Postgres) (*pgxpool.Pool, error) {
	connString := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host,
		cfg.Port,
		cfg.User,
		cfg.Password,
		cfg.Name,
		cfg.SSLMode,
	)

	db, err := pgxpool.New(context.Background(), connString)
	if err != nil {
		return nil, err
	}

	// ping the db. if it succeeds, we will assume db is healthy. otherwise it's not.
	timeoutCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := db.Ping(timeoutCtx); err != nil {
		return nil, fmt.Errorf("error pinging the db: %w", err)
	}

	return db, nil
}

func RunMigrations(db *pgxpool.Pool) error {
	stdDB := stdlib.OpenDBFromPool(db)
	defer stdDB.Close()

	sourceDriver, err := iofs.New(migration.FS, ".")
	if err != nil {
		return fmt.Errorf("error getting source driver: %w", err)
	}
	defer sourceDriver.Close()

	databaseDriver, err := pgx.WithInstance(stdDB, &pgx.Config{})
	if err != nil {
		return fmt.Errorf("error getting db driver: %w", err)
	}
	defer databaseDriver.Close()

	m, err := migrate.NewWithInstance("iofs", sourceDriver, "", databaseDriver)
	if err != nil {
		return fmt.Errorf("error getting db instance: %w", err)
	}
	defer m.Close()

	err = m.Up()
	if err != nil {
		if errors.Is(err, migrate.ErrNoChange) {
			return nil
		}
		return fmt.Errorf("error migrating up: %w", err)
	}

	return nil
}

func toWKT(lat, lon float64) string {
	return fmt.Sprintf("SRID=4326;POINT(%f %f)", lon, lat)
}

func toPoint(lat, lon float64) postgis.PointS {
	return postgis.PointS{
		SRID: 4326,
		X:    lon,
		Y:    lat,
	}
}
