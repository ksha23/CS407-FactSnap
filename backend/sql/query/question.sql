-- name: CreateQuestion :one
WITH new_question AS (
    INSERT INTO questions (
        author_id,
        content_type,
        title,
        body,
        category,
        location_id,
        image_urls,
        expired_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
)
SELECT
    nq.*,
    sqlc.embed(l),
    sqlc.embed(u),
    TRUE AS is_owned
FROM
    new_question nq
    JOIN users u ON nq.author_id = u.id
    JOIN locations l ON nq.location_id = l.id;

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
    JOIN locations l ON q.location_id = l.id

WHERE
    q.id = $1
    LIMIT 1;

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

