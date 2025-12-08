ALTER TABLE "users" ADD COLUMN "expo_push_token" text;
ALTER TABLE "users" ADD COLUMN "last_known_location" geography(Point, 4326);
