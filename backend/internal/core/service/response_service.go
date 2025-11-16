package service

import (
    "context"
    "errors"
    "strings"
    "github.com/google/uuid"
    "github.com/ksha23/CS407-FactSnap/internal/core/model"
	"github.com/ksha23/CS407-FactSnap/internal/core/port"
)

type responseService struct {
	responseRepo port.ResponseRepo
}

func NewResponseService(responseRepo port.ResponseRepo) *responseService {
	return &responseService{responseRepo: responseRepo}
}

// Jerry: only GetResponsesByUserID have not implemented yet

var ErrInvalidParam = errors.New("invalid param")



func (s *responseService) CreateResponse(ctx context.Context, userID string, params model.CreateResponseParams) (model.Response, error) {
    if params.QuestionID == uuid.Nil {
        return model.Response{}, ErrInvalidParam
    }
    if strings.TrimSpace(params.Body) == "" {
        return model.Response{}, ErrInvalidParam
    }
    return s.responseRepo.CreateResponse(ctx, userID, params)
}

func (s *responseService) GetResponsesByQuestionID(ctx context.Context, userID string, questionID uuid.UUID, page model.PageParams) ([]model.Response, error) {
    return s.responseRepo.GetResponsesByQuestionID(ctx, userID, questionID, page)
}


func (s *responseService) EditResponse(ctx context.Context, userID string, params model.EditResponseParams) (model.Response, error) {
    if params.ResponseID == uuid.Nil {
        return model.Response{}, ErrInvalidParam
    }
    if strings.TrimSpace(params.Body) == "" {
        return model.Response{}, ErrInvalidParam
    }
    // delegate to repo
    resp, err := s.responseRepo.EditResponse(ctx, userID, params)
    if err != nil {
        // 直接返回 repo 的错误（handler 会翻译 pgx.ErrNoRows -> 404, "forbidden" -> 403）
        return model.Response{}, err
    }
    return resp, nil
}

func (s *responseService) DeleteResponse(ctx context.Context, userID string, responseID uuid.UUID) (uuid.UUID, error) {
    if responseID == uuid.Nil {
        return uuid.Nil, ErrInvalidParam
    }
    qid, err := s.responseRepo.DeleteResponse(ctx, userID, responseID)
    if err != nil {
        return uuid.Nil, err
    }
    return qid, nil
}


//func (s *responseService) GetResponsesByUserID(ctx context.Context, userID string, page model.PageParams) ([]model.Response, error) {
//	//TODO implement me
//	panic("implement me")
//}