CREATE TABLE "users" (
    "id" text PRIMARY KEY,
    "username" text UNIQUE NOT NULL,
    "email" text UNIQUE NOT NULL,
    "display_name" text NOT NULL,
    "role" text NOT NULL DEFAULT 'User',
    "about_me" text,
    "avatar_url" text,
    "created_at" timestamptz NOT NULL DEFAULT current_timestamp
)