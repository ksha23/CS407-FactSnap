-- name: CreateLocation :one
INSERT INTO locations (location, name, address)
VALUES (
           sqlc.arg(location), -- postgis.PointS
           sqlc.arg(name),
           sqlc.arg(address)
       )
RETURNING *;