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