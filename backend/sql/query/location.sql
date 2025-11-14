-- name: CreateLocation :one
INSERT INTO locations (location, name, address)
VALUES (
           ST_GeomFromText(sqlc.arg(wkt)::text, 4326),
           sqlc.arg(name),
           sqlc.arg(address)
       )
RETURNING *;

-- name: EditLocation :one
UPDATE locations
SET
    location = ST_GeomFromText(sqlc.arg(wkt)::text, 4326),
    name = sqlc.arg(name),
    address = sqlc.arg(address)
WHERE locations.id = sqlc.arg(id)
RETURNING *;