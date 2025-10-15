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

CREATE TABLE "locations" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "location" point NOT NULL,
    "name" text NOT NULL
);

CREATE TYPE category_enum AS ENUM ('restaurant', 'store', 'transportation', 'event');
CREATE TYPE question_type AS ENUM ('wait_time', 'availabilty', 'rule', 'weather', 'status');

CREATE TABLE "questions" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "author_id" text NOT NULL,
    "type" question_type NOT NULL,
    "title" text NOT NULL,
    "body" text NULL,
    "location_id" uuid NOT NULL,
    "image_urls" text[] NULL,
    "category" category_enum NOT NULL,
    "summary" text NULL,
    "created_at" timestamptz NOT NULL DEFAULT current_timestamp,
    "edited_at" timestamptz NOT NULL DEFAULT current_timestamp,
    FOREIGN KEY (author_id) REFERENCES "users" (id),
    FOREIGN KEY (location_id) REFERENCES "locations" (id)
);

CREATE TABLE "responses" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "author_id" text NOT NULL,
    "question_id" uuid NOT NULL,
    "body" text NULL,
    "data" JSONB NOT NULL,
    "image_urls" text[] NULL,
    "created_at" timestamptz NOT NULL DEFAULT current_timestamp,
    "edited_at" timestamptz NOT NULL DEFAULT current_timestamp,
    FOREIGN KEY (author_id) REFERENCES "users" (id),
    FOREIGN KEY (question_id) REFERENCES "questions" (id)
);