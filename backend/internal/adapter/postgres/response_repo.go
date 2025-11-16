package postgres

import (
    "context"
    "github.com/google/uuid"
    "github.com/jackc/pgx/v5"
    "github.com/jackc/pgx/v5/pgxpool"
    "github.com/ksha23/CS407-FactSnap/internal/adapter/postgres/sqlc"
    "github.com/ksha23/CS407-FactSnap/internal/core/model"
    "time"
    "errors"
)

type responseRepo struct {
	query *sqlc.Queries
	db    *pgxpool.Pool
}

func NewResponseRepo(db *pgxpool.Pool) *responseRepo {
	return &responseRepo{
		query: sqlc.New(db),
		db:    db,
	}
}

//Jerry:  only GetResponsesByUserID have not implemented yet
func (r *responseRepo) CreateResponse(ctx context.Context, userID string, params model.CreateResponseParams) (model.Response, error) {
    // use our db pool directly to insert and RETURNING the row
    id := uuid.New()
    now := time.Now().UTC()

    insertSQL := `
    INSERT INTO responses (id, question_id, author_id, body, image_urls, created_at, edited_at)
    VALUES ($1, $2, $3, $4, $5, $6, $6)
    RETURNING id, question_id, author_id, body, image_urls, created_at, edited_at;
    `
    var rowID, questionID uuid.UUID
    var authorID string
    var body string
    var imageURLs []string
    var createdAt time.Time
    var editedAt *time.Time

    err := r.db.QueryRow(ctx, insertSQL, id, params.QuestionID, userID, params.Body, params.ImageURLs, now).
        Scan(&rowID, &questionID, &authorID, &body, &imageURLs, &createdAt, &editedAt)
    if err != nil {
        return model.Response{}, err
    }

    // load user info (join) - simpler: fetch from users table
    var username, displayName string
    var avatarUrl *string
    usrSel := `SELECT username, display_name, avatar_url FROM users WHERE id = $1`
    if err := r.db.QueryRow(ctx, usrSel, authorID).Scan(&username, &displayName, &avatarUrl); err != nil {
        return model.Response{}, err
    }

    // Map to model.Response
    var editedVal time.Time
    if editedAt != nil {
        editedVal = *editedAt
    } else {
        editedVal = time.Time{}
    }

    author := model.User{
        ID:          authorID,
        Username:    username,
        DisplayName: displayName,
        AvatarURL:   avatarUrl,
    }

    resp := model.Response{
        ID:         rowID,
        QuestionID: questionID,
        Author:     author,
        Body:       &body,
        Data:       nil,
        ImageURLs:  imageURLs,
        CreatedAt:  createdAt,
        EditedAt:   editedVal,
    }

    return resp, nil
}

func (r *responseRepo) GetResponsesByQuestionID(ctx context.Context, userID string, questionID uuid.UUID, page model.PageParams) ([]model.Response, error) {
    sql := `
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
    ORDER BY r.created_at DESC
    `
    rows, err := r.db.Query(ctx, sql, questionID)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var out []model.Response
    for rows.Next() {
        var rowID uuid.UUID
        var qid uuid.UUID
        var authorID string
        var username, displayName string
        var avatarURL *string
        var body string
        var imageURLs []string
        var createdAt time.Time
        var editedAt *time.Time

        if err := rows.Scan(&rowID, &qid, &authorID, &username, &displayName, &avatarURL, &body, &imageURLs, &createdAt, &editedAt); err != nil {
            return nil, err
        }

        var editedVal time.Time
        if editedAt != nil {
            editedVal = *editedAt
        } else {
            editedVal = time.Time{}
        }

        author := model.User{
            ID:          authorID,
            Username:    username,
            DisplayName: displayName,
            AvatarURL:   avatarURL,
        }

        out = append(out, model.Response{
            ID:         rowID,
            QuestionID: qid,
            Author:     author,
            Body:       &body,
            Data:       nil,
            ImageURLs:  imageURLs,
            CreatedAt:  createdAt,
            EditedAt:   editedVal,
        })
    }

    if err := rows.Err(); err != nil {
        return nil, err
    }
    return out, nil
}



func (r *responseRepo) EditResponse(ctx context.Context, userID string, params model.EditResponseParams) (model.Response, error) {
    updateSQL := `
    UPDATE responses
    SET body = $1, image_urls = $2, edited_at = now()
    WHERE id = $3 AND author_id = $4
    RETURNING id, question_id, author_id, body, image_urls, created_at, edited_at;
    `

    var rowID, questionID uuid.UUID
    var authorID string
    var body string
    var imageURLs []string
    var createdAt time.Time
    var editedAt *time.Time

    err := r.db.QueryRow(ctx, updateSQL, params.Body, params.ImageURLs, params.ResponseID, userID).
        Scan(&rowID, &questionID, &authorID, &body, &imageURLs, &createdAt, &editedAt)
    if err != nil {
        if errors.Is(err, pgx.ErrNoRows) {
            var existsAuthor string
            sel := `SELECT author_id FROM responses WHERE id = $1`
            if err2 := r.db.QueryRow(ctx, sel, params.ResponseID).Scan(&existsAuthor); err2 != nil {
                if errors.Is(err2, pgx.ErrNoRows) {
                    return model.Response{}, pgx.ErrNoRows // not found
                }
                return model.Response{}, err2
            }
            // found but different author
            return model.Response{}, errors.New("forbidden")
        }
        return model.Response{}, err
    }

    // load user info from users table
    var username, displayName string
    var avatarUrl *string
    usrSel := `SELECT username, display_name, avatar_url FROM users WHERE id = $1`
    if err := r.db.QueryRow(ctx, usrSel, authorID).Scan(&username, &displayName, &avatarUrl); err != nil {
        return model.Response{}, err
    }

    var editedVal time.Time
    if editedAt != nil {
        editedVal = *editedAt
    } else {
        editedVal = time.Time{}
    }

    author := model.User{
        ID:          authorID,
        Username:    username,
        DisplayName: displayName,
        AvatarURL:   avatarUrl,
    }

    resp := model.Response{
        ID:         rowID,
        QuestionID: questionID,
        Author:     author,
        Body:       &body,
        Data:       nil,
        ImageURLs:  imageURLs,
        CreatedAt:  createdAt,
        EditedAt:   editedVal,
    }

    return resp, nil
}

// DeleteResponse: check if author exists -> delete response -> decrement questions.num_responses
func (r *responseRepo) DeleteResponse(ctx context.Context, userID string, responseID uuid.UUID) (uuid.UUID, error) {
    tx, err := r.db.Begin(ctx)
    if err != nil {
        return uuid.Nil, err
    }
    defer func() {
        _ = tx.Rollback(ctx)
    }()

    // check question_id and author_id
    var questionID uuid.UUID
    var authorID string
    selSQL := `SELECT question_id, author_id FROM responses WHERE id = $1 FOR UPDATE`
    if err := tx.QueryRow(ctx, selSQL, responseID).Scan(&questionID, &authorID); err != nil {
        if errors.Is(err, pgx.ErrNoRows) {
            return uuid.Nil, pgx.ErrNoRows
        }
        return uuid.Nil, err
    }

    if authorID != userID {
        return uuid.Nil, errors.New("forbidden")
    }

    // Delete
    if _, err := tx.Exec(ctx, `DELETE FROM responses WHERE id = $1`, responseID); err != nil {
        return uuid.Nil, err
    }

    // update questions.num_responses
    if _, err := tx.Exec(ctx, `UPDATE questions SET num_responses = GREATEST(num_responses - 1, 0) WHERE id = $1`, questionID); err != nil {
        return uuid.Nil, err
    }

    if err := tx.Commit(ctx); err != nil {
        return uuid.Nil, err
    }

    return questionID, nil
}



//func (r *responseRepo) GetResponsesByUserID(ctx context.Context, userID string, page model.PageParams) ([]model.Response, error) {
//	//TODO implement me
//	panic("implement me")
//}