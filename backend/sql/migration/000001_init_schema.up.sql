CREATE TABLE "users" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "clerk_user_id" text UNIQUE NOT NULL,
    "username" text UNIQUE NOT NULL,
    "email" text UNIQUE NOT NULL,
    "display_name" text NOT NULL,
    "role" text NOT NULL DEFAULT 'User',
    "about_me" text,
    "avatar_url" text,
    "created_at" timestamptz NOT NULL DEFAULT current_timestamp
)