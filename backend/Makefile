MIGRATION_DIR=./sql/migration

all: run

# DEVELOPMENT
run:
	go run cmd/api/main.go

install:
	go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
	go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

# SQLC
sqlc:
	sqlc generate

# MIGRATIONS
migrateup:
	migrate -path $(MIGRATION_DIR) -database "$(DB_URL)" -verbose up

migrateup1:
	migrate -path $(MIGRATION_DIR) -database "$(DB_URL)" -verbose up 1

migratedown:
	migrate -path $(MIGRATION_DIR) -database "$(DB_URL)" -verbose down

migratedown1:
	migrate -path $(MIGRATION_DIR) -database "$(DB_URL)" -verbose down 1

createmigration:
	migrate create -ext sql -dir $(MIGRATION_DIR) -seq $(name)


# DOCKER COMPOSE
docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-stop:
	docker-compose stop

docker-restart: docker-down docker-up