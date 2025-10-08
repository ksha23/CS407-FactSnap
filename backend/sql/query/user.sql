-- name: CreateUser :one
INSERT INTO users (clerk_user_id, username, email, display_name, avatar_url, role)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetUserByID :one
SELECT * FROM users
WHERE id = $1 LIMIT 1;

-- name: GetUserByClerkID :one
SELECT * FROM users
WHERE clerk_user_id = $1 LIMIT 1;