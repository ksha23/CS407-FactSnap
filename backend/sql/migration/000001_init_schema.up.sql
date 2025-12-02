CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE "users" (
    "id" text PRIMARY KEY,
    "username" text UNIQUE NOT NULL,
    "email" text UNIQUE NOT NULL,
    "display_name" text NOT NULL,
    "role" text NOT NULL DEFAULT 'User',
    "about_me" text,
    "avatar_url" text,
    "created_at" timestamptz NOT NULL DEFAULT current_timestamp
);

CREATE TABLE "questions" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "author_id" text NOT NULL,
    "content_type" text NOT NULL,
    "title" text NOT NULL,
    "body" text NULL,
    "image_urls" text[] NULL,
    "category" text NOT NULL,
    "num_responses" integer NOT NULL DEFAULT 0,
    "created_at" timestamptz NOT NULL DEFAULT current_timestamp,
    "edited_at" timestamptz NOT NULL DEFAULT current_timestamp,
    "expired_at" timestamptz NOT NULL,
    FOREIGN KEY (author_id) REFERENCES "users" (id) ON DELETE CASCADE
);

CREATE TABLE "locations" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "question_id" uuid NOT NULL,
    "location" geometry(Point, 4326) NOT NULL, -- This stores GPS coordinate as PostGIS geometry point using the WGS-84 coordinate system
    "name" text NULL,
    "address" text NULL,
    UNIQUE(question_id), -- Each question should only have one location
    FOREIGN KEY (question_id) REFERENCES "questions" (id) ON DELETE CASCADE
);

CREATE TABLE "responses" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "author_id" text NOT NULL,
    "question_id" uuid NOT NULL,
    "body" text NOT NULL,
    "image_urls" text[] NULL,
    "created_at" timestamptz NOT NULL DEFAULT current_timestamp,
    "edited_at" timestamptz NOT NULL DEFAULT current_timestamp,
    FOREIGN KEY (author_id) REFERENCES "users" (id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES "questions" (id) ON DELETE CASCADE
);