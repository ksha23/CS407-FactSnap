-- name: CreateQuestion :one
WITH new_question AS (
    INSERT INTO questions (
        author_id,
        content_type,
        title,
        body,
        category,
        image_urls,
        expired_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
)
SELECT
    nq.*,
    sqlc.embed(u),
    TRUE AS is_owned
FROM
    new_question nq
    JOIN users u ON nq.author_id = u.id;

-- name: EditQuestion :one
WITH edited_question AS (
    UPDATE questions
    SET
        title = sqlc.arg(title),
        body = sqlc.arg(body),
        category = sqlc.arg(category),
        edited_at = current_timestamp
    WHERE questions.id = sqlc.arg(id)
    RETURNING *
)
SELECT
    eq.*,
    sqlc.embed(l),
    sqlc.embed(u),
    TRUE AS is_owned
FROM
    edited_question eq
        JOIN users u ON eq.author_id = u.id
        JOIN locations l ON eq.id = l.question_id;

-- name: DeleteQuestion :exec
DELETE FROM questions
WHERE questions.id = sqlc.arg(id);

-- name: SetQuestionContentType :exec
UPDATE questions
SET content_type = $2
WHERE id = $1;

-- name: GetQuestionByID :one
SELECT
    sqlc.embed(q),
    sqlc.embed(u),
    sqlc.embed(l),
    q.author_id = $2 AS is_owned
FROM
    questions q
    JOIN users u ON q.author_id = u.id
    JOIN locations l ON q.id = l.question_id
WHERE
    q.id = $1
    LIMIT 1;

-- name: GetQuestionsInRadiusFeed :many
SELECT
    sqlc.embed(q),
    sqlc.embed(l),
    sqlc.embed(u),
    q.author_id = sqlc.arg(user_id) AS is_owned
FROM questions q
         JOIN users u ON q.author_id = u.id
         JOIN locations l ON q.id = l.question_id
WHERE q.expired_at > now() AND
      ST_DWithin(
              l.location::geography,
              ST_SetSRID(
                      ST_MakePoint(
                              sqlc.arg(longitude)::float8,
                              sqlc.arg(latitude)::float8
                      ),
                      4326
              )::geography,
              sqlc.arg(radius_miles)::float8 * 1609.34
      )
ORDER BY q.created_at DESC, q.id DESC
LIMIT sqlc.arg(limit_num) OFFSET sqlc.arg(offset_num);

-- name: GetQuestionsInRadiusFeedByCategory :many
SELECT
    sqlc.embed(q),
    sqlc.embed(l),
    sqlc.embed(u),
    q.author_id = sqlc.arg(user_id) AS is_owned
FROM questions q
         JOIN users u ON q.author_id = u.id
         JOIN locations l ON q.id = l.question_id
WHERE
    q.category = sqlc.arg(category) AND
    q.expired_at > now() AND
    ST_DWithin(
              l.location::geography,
              ST_SetSRID(
                      ST_MakePoint(
                              sqlc.arg(longitude)::float8,
                              sqlc.arg(latitude)::float8
                      ),
                      4326
              )::geography,
              sqlc.arg(radius_miles)::float8 * 1609.34
      )
ORDER BY q.created_at DESC, q.id DESC
LIMIT sqlc.arg(limit_num) OFFSET sqlc.arg(offset_num);


-- name: CreatePoll :one
INSERT INTO polls (question_id)
VALUES ($1)
RETURNING *;

-- name: CreatePollOptions :copyfrom
INSERT INTO poll_options (poll_id, label, index)
VALUES ($1, $2, $3);

-- name: GetPollByQuestionID :one
SELECT sqlc.embed(p)
FROM polls p
WHERE p.question_id = $1;

-- name: GetPollOptions :many
SELECT sqlc.embed(po)
FROM
    polls p
    JOIN poll_options po ON p.id = po.poll_id
WHERE p.id = $1
GROUP BY po.id
ORDER BY po.index;

-- name: GetPollVotes :many
SELECT
    po.index,
    COUNT(pv.user_id)         AS num_votes,
    BOOL_OR(pv.user_id = $2)  AS is_selected
FROM poll_options po
    JOIN poll_votes pv ON pv.option_id = po.id
WHERE po.poll_id = $1
GROUP BY po.id;

-- name: IsPollExpired :one
SELECT q.expired_at < now() AS is_expired
FROM
    polls p
    JOIN questions q ON q.id = p.question_id
WHERE p.id = $1;

-- name: DeletePollVote :exec
DELETE FROM poll_votes
WHERE user_id = $1 AND poll_id = $2;

-- name: CreatePollVote :exec
INSERT INTO poll_votes (poll_id, option_id, user_id)
VALUES ($1, $2, $3);

-- name: IncrementResponseAmount :exec
UPDATE questions
SET num_responses = num_responses + 1
WHERE id = $1;

-- name: DecrementResponseAmount :exec
UPDATE questions
SET num_responses =
        CASE
            WHEN num_responses > 0
                THEN num_responses - $2
            ELSE 0
            END
WHERE id = $1;

