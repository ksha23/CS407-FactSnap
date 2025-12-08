-- name: CreateUser :one
INSERT INTO users (id, username, email, display_name, avatar_url, role)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: GetUserByID :one
SELECT *
FROM users
WHERE id = $1 LIMIT 1;

-- name: UpdateUserLocation :exec
UPDATE users
SET last_known_location = ST_SetSRID(ST_MakePoint(sqlc.arg(longitude)::float8, sqlc.arg(latitude)::float8), 4326)
WHERE id = $1;

-- name: UpdateUserPushToken :exec
UPDATE users
SET expo_push_token = $2
WHERE id = $1;

-- name: DeleteUserPushToken :exec
UPDATE users
SET expo_push_token = NULL
WHERE id = $1;

-- name: GetUsersInRadius :many
SELECT id, expo_push_token
FROM users
WHERE ST_DWithin(
    last_known_location,
    ST_SetSRID(ST_MakePoint(sqlc.arg(longitude)::float8, sqlc.arg(latitude)::float8), 4326)::geography,
    sqlc.arg(radius_meters)::float8
)
AND expo_push_token IS NOT NULL;

-- name: GetUserQuestionCount :one
SELECT COUNT(*) FROM questions
WHERE author_id = $1;

-- name: GetUserResponseCount :one
SELECT COUNT(*) FROM responses
WHERE author_id = $1;


-- name: UpdateUserDisplayName :one
UPDATE users
SET display_name = $1
WHERE id = $2
RETURNING id, username, email, display_name, role, about_me, avatar_url, created_at;