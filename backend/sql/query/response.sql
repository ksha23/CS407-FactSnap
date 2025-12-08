-- name: CreateResponse :one
WITH new_response AS (
    INSERT INTO responses (
        author_id,
        question_id,
        body,
        image_urls
    )
    VALUES ($1, $2, $3, $4)
    RETURNING *
)
SELECT
    nr.*,
    sqlc.embed(u),
    TRUE AS is_owned
FROM
    new_response nr
    JOIN users u ON nr.author_id = u.id;

-- name: EditResponse :one
WITH edited_response AS (
    UPDATE responses
    SET
        body = sqlc.arg(body),
        edited_at = current_timestamp
    WHERE responses.id = sqlc.arg(id)
    RETURNING *
)
SELECT
    er.*,
    sqlc.embed(u),
    TRUE AS is_owned
FROM
    edited_response er
        JOIN users u ON er.author_id = u.id;

-- name: DeleteResponse :exec
DELETE FROM responses WHERE id = $1;

-- name: GetResponseByID :one
SELECT
    sqlc.embed(r),
    sqlc.embed(u),
    r.author_id = sqlc.arg(user_id) AS is_owned
FROM
    responses r
    JOIN users u ON r.author_id = u.id
WHERE
    r.id = sqlc.arg(id)
    LIMIT 1;

-- name: GetResponsesByQuestionID :many
SELECT
    sqlc.embed(r),
    sqlc.embed(u),
    r.author_id = sqlc.arg(user_id) AS is_owned
FROM
    responses r
    JOIN users u ON r.author_id = u.id
WHERE
    r.question_id = sqlc.arg(question_id)
ORDER BY r.created_at DESC
LIMIT sqlc.arg(limit_num) OFFSET sqlc.arg(offset_num);
    r.id = sqlc.arg(id)
    LIMIT 1;

-- name: GetQuestionsRespondedByUserID :many
SELECT
    sqlc.embed(q),
    sqlc.embed(l),
    sqlc.embed(u),
    q.author_id = sqlc.arg(user_id) AS is_owned
FROM questions q
    JOIN responses r ON r.question_id = q.id
    JOIN users u ON q.author_id = u.id
    JOIN locations l ON q.id = l.question_id
WHERE
    r.author_id = sqlc.arg(user_id)
ORDER BY r.created_at DESC, q.created_at DESC, q.id DESC
LIMIT sqlc.arg(limit_num) OFFSET sqlc.arg(offset_num);