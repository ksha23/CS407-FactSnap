-- name: CreateLocation :one
INSERT INTO locations (location, name, address)
VALUES (
           ST_GeomFromText(sqlc.arg(wkt)::text, 4326),
           sqlc.arg(name),
           sqlc.arg(address)
       )
RETURNING *;