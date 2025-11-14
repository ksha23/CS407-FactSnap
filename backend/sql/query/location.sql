-- name: CreateLocation :one
INSERT INTO locations (location, name, address, question_id)
VALUES (
           ST_GeomFromText(sqlc.arg(wkt)::text, 4326),
           sqlc.arg(name),
           sqlc.arg(address),
        sqlc.arg(question_id)
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