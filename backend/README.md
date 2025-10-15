# Backend

We are using the following:
- [Go](https://go.dev/) - Backend programming language
- [sqlc](https://sqlc.dev/) - Go library to generate type-safe Go code to interact with raw SQL
- [Gin](https://gin-gonic.com/) - Go API framework

Check `go.mod` file to see all the Go packages we are using.

## Development & Local Testing

### Prerequisites

1. Install [Go](https://go.dev/doc/install)
2. Install [Docker](https://www.docker.com/get-started/) and [Docker Compose](https://docs.docker.com/compose/install/)

### Installation
1. Create `local.yaml` file in `config/` directory and fill it in. Use `config/example.yaml` as reference.
2. Create `.env` file and put your variables there. Use `.env.example` as reference.
    > Note: Pass the path to your config file for `CONFIG_FILE` variable (e.g., `/config/local.yaml`)
3. Run `go mod download` to download all the Go packages we're using
4. Run `make install` to install the necessary Go CLI tools like sqlc and golang-migrate
5. Run `make docker-up` to spin up Docker containers for secondary adapters (i.e., Postgres)
6. Run `make run` to run the backend API locally

### Notes
Check the Makefile for other useful commands. 

You'll likely want to run `make sqlc` after making any adjustments to
`sql/` so that you can regenerate the code to interact with the new SQL tables or queries.

When you run the API, it will run SQL migrations for you during the initialization process.