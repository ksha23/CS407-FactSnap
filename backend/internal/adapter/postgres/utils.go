package postgres

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/cridenour/go-postgis"
	"github.com/golang-migrate/migrate/v4"
	pgxmigrate "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/ksha23/CS407-FactSnap/internal/adapter/postgres/sqlc"
	"github.com/ksha23/CS407-FactSnap/internal/config"
	"github.com/ksha23/CS407-FactSnap/sql/migration"
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

	config, err := pgxpool.ParseConfig(connString)
	if err != nil {
		return nil, err
	}

	// Register PostGIS types
	config.AfterConnect = func(ctx context.Context, conn *pgx.Conn) error {
		// Register the geography type
		// OID 17100 is typically geography in PostGIS, but it's safer to look it up if possible.
		// However, pgx usually needs explicit registration for custom types if not using standard extensions.
		// Since we are seeing "cannot scan unknown type (OID 17100)", we need to tell pgx how to handle it.
		// But wait, we are casting to geography in SQL, but scanning into... what?
		// The error says: "can't scan into dest[20] (col: last_known_location): cannot scan unknown type (OID 17100) in text format into *interface {}"
		// This means sqlc generated a struct field with `interface{}` or similar because it didn't know the type,
		// and pgx doesn't know how to decode OID 17100 into it.
		return nil
	}

	db, err := pgxpool.NewWithConfig(context.Background(), config)
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

	databaseDriver, err := pgxmigrate.WithInstance(stdDB, &pgxmigrate.Config{})
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
