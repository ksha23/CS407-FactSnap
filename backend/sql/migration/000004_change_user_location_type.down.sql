ALTER TABLE users
ALTER COLUMN last_known_location TYPE geography(Point, 4326)
USING last_known_location::geography;
