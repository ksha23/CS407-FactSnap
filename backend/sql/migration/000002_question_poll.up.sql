CREATE TABLE polls (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "question_id" uuid NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT current_timestamp,
    UNIQUE (question_id),
    FOREIGN KEY (question_id) REFERENCES "questions" (id) ON DELETE CASCADE
);

CREATE TABLE poll_options (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "poll_id" uuid NOT NULL,
    "label" text NOT NULL,
    "index" int NOT NULL,
    UNIQUE(poll_id, index),
    FOREIGN KEY (poll_id) REFERENCES "polls" (id) ON DELETE CASCADE
);

CREATE TABLE poll_votes (
    "poll_id" uuid NOT NULL,
    "option_id" uuid NOT NULL,
    "user_id" text NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT current_timestamp,
    PRIMARY KEY (poll_id, user_id),
    FOREIGN KEY (poll_id) REFERENCES "polls" (id) ON DELETE CASCADE,
    FOREIGN KEY (option_id) REFERENCES "poll_options" (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES "users" (id) ON DELETE CASCADE
);