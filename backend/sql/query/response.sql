-- name: CreateResponse :one
INSERT INTO responses (question_id, author_id, body, image_urls)
VALUES ($1, $2, $3, $4)
RETURNING id, question_id, author_id, body, image_urls, created_at, edited_at;

-- name: EditResponse :one
UPDATE responses
SET body = $2, edited_at = now()
WHERE id = $1
RETURNING id, question_id, author_id, body, image_urls, created_at, edited_at;

-- name: DeleteResponse :exec
DELETE FROM responses WHERE id = $1;

-- name: GetResponsesByQuestionID :many
SELECT
  r.id,
  r.question_id,
  r.author_id,
  u.username,
  u.display_name,
  u.avatar_url,
  r.body,
  r.image_urls,
  r.created_at,
  r.edited_at
FROM responses r
JOIN users u ON u.id = r.author_id
WHERE r.question_id = $1
ORDER BY r.created_at DESC;