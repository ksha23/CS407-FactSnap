package postgres

import (
	"context"
	"fmt"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ksha23/CS407-FactSnap/internal/adapter/postgres/sqlc"
	"github.com/ksha23/CS407-FactSnap/internal/core/model"
)

type questionRepo struct {
	query *sqlc.Queries
	db    *pgxpool.Pool
}

func NewQuestionRepo(db *pgxpool.Pool) *questionRepo {
	return &questionRepo{
		query: sqlc.New(db),
		db:    db,
	}
}

func (r *questionRepo) CreateQuestion(ctx context.Context, userID string, params model.CreateQuestionParams) (uuid.UUID, error) {
	var row sqlc.CreateQuestionRow
	err := execTx(ctx, r.db, func(query *sqlc.Queries) error {
		// in a single transaction:
		// - insert location first
		location, err := query.CreateLocation(ctx,
			toPoint(params.Location.Latitude, params.Location.Longitude),
			params.Location.Name,
			params.Location.Address,
		)
		if err != nil {
			return fmt.Errorf("CreateLocation: %w", wrapError(err))
		}

		// - then insert question
		row, err = query.CreateQuestion(ctx, sqlc.CreateQuestionParams{
			AuthorID:    userID,
			ContentType: string(model.ContentTypeNone),
			Title:       params.Title,
			Body:        params.Body,
			Category:    string(params.Category),
			LocationID:  location.ID,
			ImageUrls:   params.ImageURLs,
			ExpiredAt:   params.ExpiresAt,
		})
		if err != nil {
			return fmt.Errorf("CreateQuestion: %w", wrapError(err))
		}

		return nil
	})
	if err != nil {
		return uuid.UUID{}, fmt.Errorf("QuestionRepo::CreateQuestion: %w", err)
	}

	// NOTE: The newly-created question will not have its content populated yet.
	// We are assuming the user will add the content after, if they intend to
	return row.ID, nil
}

func (r *questionRepo) CreatePoll(ctx context.Context, userID string, params model.CreatePollParams) (uuid.UUID, error) {
	var pollID uuid.UUID
	err := execTx(ctx, r.db, func(query *sqlc.Queries) error {
		// in a single transaction:
		// - first, insert poll
		pollRow, err := query.CreatePoll(ctx, params.QuestionID)
		if err != nil {
			return fmt.Errorf("CreatePoll: %w", wrapError(err))
		}
		pollID = pollRow.ID

		// - then, insert poll options
		pollOptionParams := make([]sqlc.CreatePollOptionsParams, 0, len(params.OptionLabels))
		for i, label := range params.OptionLabels {
			pollOptionParams = append(pollOptionParams, sqlc.CreatePollOptionsParams{
				PollID: pollID,
				Label:  label,
				Index:  i,
			})
		}
		_, err = query.CreatePollOptions(ctx, pollOptionParams)
		if err != nil {
			return fmt.Errorf("CreatePollOptions: %w", wrapError(err))
		}

		// - then set the question content type
		err = query.SetQuestionContentType(ctx, params.QuestionID, string(model.ContentTypePoll))
		if err != nil {
			return fmt.Errorf("SetQuestionContentType: %w", wrapError(err))
		}

		return nil
	})
	if err != nil {
		return uuid.UUID{}, fmt.Errorf("QuestionRepo::CreatePoll: %w", err)
	}

	return pollID, nil
}

func (r *questionRepo) IsPollExpired(ctx context.Context, pollID uuid.UUID) (bool, error) {
	isExpired, err := r.query.IsPollExpired(ctx, pollID)
	if err != nil {
		return false, fmt.Errorf("QuestionRepo::IsPollExpired: %w", wrapError(err))
	}
	return isExpired, nil
}

func (r *questionRepo) VotePoll(ctx context.Context, userID string, pollID uuid.UUID, optionID *uuid.UUID) error {
	err := execTx(ctx, r.db, func(query *sqlc.Queries) error {
		// in a single transaction:
		// - first, delete the previous poll vote (in case it exists)
		if err := query.DeletePollVote(ctx, userID, pollID); err != nil {
			return fmt.Errorf("DeletePollVote: %w", wrapError(err))
		}

		// - then, create new poll vote (if applicable)
		if optionID != nil {
			if err := query.CreatePollVote(ctx, pollID, *optionID, userID); err != nil {
				return fmt.Errorf("CreatePollVote: %w", wrapError(err))
			}
		}

		return nil
	})
	if err != nil {
		return fmt.Errorf("QuestionRepo::VotePoll: %w", err)
	}
	return nil
}

func (r *questionRepo) GetQuestionByID(ctx context.Context, userID string, questionID uuid.UUID) (model.Question, error) {
	// get question
	questionRow, err := r.query.GetQuestionByID(ctx, questionID, userID)
	if err != nil {
		return model.Question{}, fmt.Errorf("QuestionRepo::GetQuestionByID: %w", wrapError(err))
	}

	question := questionRow.ToDomainModel()

	// set question content (if applicable)
	question.Content, err = r.getQuestionContent(ctx, question, userID)
	if err != nil {
		return model.Question{}, fmt.Errorf("QuestionRepo::GetQuestionByID: %w", err)
	}

	return question, nil
}

func (r *questionRepo) getQuestionContent(ctx context.Context, question model.Question, userID string) (model.QuestionContent, error) {
	content := model.QuestionContent{
		Type: question.Content.Type,
	}

	switch question.Content.Type {
	case model.ContentTypePoll:
		poll, err := r.getPoll(ctx, question, userID)
		if err != nil {
			return content, fmt.Errorf("getQuestionContent: %w", err)
		}
		content.Data = poll
	default:
		content.Data = nil
	}

	return content, nil
}

func (r *questionRepo) getPoll(ctx context.Context, question model.Question, userID string) (model.Poll, error) {
	// get poll
	pollRow, err := r.query.GetPollByQuestionID(ctx, question.ID)
	if err != nil {
		return model.Poll{}, fmt.Errorf("getPoll:GetPollByQuestionID: %w", wrapError(err))
	}
	poll := model.Poll{
		ID:         pollRow.Poll.ID,
		QuestionID: pollRow.Poll.QuestionID,
		CreatedAt:  pollRow.Poll.CreatedAt,
		ExpiredAt:  question.ExpiredAt,
	}

	// get poll options
	pollOptionRows, err := r.query.GetPollOptions(ctx, poll.ID)
	if err != nil {
		return model.Poll{}, fmt.Errorf("getPoll:GetPollOptions: %w", wrapError(err))
	}

	pollOptions := make([]model.PollOption, len(pollOptionRows))
	for _, row := range pollOptionRows {
		pollOptions[row.PollOption.Index] = model.PollOption{
			ID:    row.PollOption.ID,
			Label: row.PollOption.Label,
		}
	}

	// get poll votes
	pollVoteRows, err := r.query.GetPollVotes(ctx, poll.ID, userID)
	if err != nil {
		return model.Poll{}, fmt.Errorf("getPoll:GetPollVotes: %w", wrapError(err))
	}
	for _, row := range pollVoteRows {
		pollOptions[row.Index].NumVotes = row.NumVotes
		pollOptions[row.Index].IsSelected = row.IsSelected
		poll.NumTotalVotes += row.NumVotes
	}
	poll.Options = pollOptions

	return poll, nil
}

//func (r *questionRepo) GetQuestions(ctx context.Context, userID string, params model.GetQuestionsParams, page model.PageParams) ([]model.Question, error) {
//	//TODO implement me
//	panic("implement me")
//}
//
//func (r *questionRepo) DeleteQuestion(ctx context.Context, userID string, questionID uuid.UUID) (model.Question, error) {
//	//TODO implement me
//	panic("implement me")
//}
//
//func (r *questionRepo) EditQuestion(ctx context.Context, userID string, params model.EditQuestionParams) (model.Question, error) {
//	//TODO implement me
//	panic("implement me")
//}
//
//
//func (r *questionRepo) GetQuestionsByUserID(ctx context.Context, userID string, page model.PageParams) ([]model.Question, error) {
//	//TODO implement me
//	panic("implement me")
//}
