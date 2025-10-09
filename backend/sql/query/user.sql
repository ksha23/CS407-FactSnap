-- name: CreateUser :one
INSERT INTO users (id, username, email, display_name, avatar_url, role)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetUserByID :one
SELECT * FROM users
WHERE id = $1 LIMIT 1;