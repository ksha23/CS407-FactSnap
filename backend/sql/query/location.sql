-- name: CreateLocation :one
INSERT INTO locations (location, name, address)
VALUES (
           point($1, $2), -- latitude, longitude
           $3,   -- name
           $4  -- address
       )
RETURNING *;