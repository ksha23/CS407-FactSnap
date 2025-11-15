package service

import (
	"github.com/ksha23/CS407-FactSnap/internal/core/port"
)

type responseService struct {
	responseRepo port.ResponseRepo
}

func NewResponseService(responseRepo port.ResponseRepo) *responseService {
	return &responseService{responseRepo: responseRepo}
}

//func (s *responseService) CreateResponse(ctx context.Context, userID string, params model.CreateResponseParams) (model.Response, error) {
//	//TODO implement me
//	panic("implement me")
//}
//
//func (s *responseService) EditResponse(ctx context.Context, userID string, params model.EditResponseParams) (model.Response, error) {
//	//TODO implement me
//	panic("implement me")
//}
//
//func (s *responseService) DeleteResponse(ctx context.Context, userID string, responseID uuid.UUID) (model.Response, error) {
//	//TODO implement me
//	panic("implement me")
//}
//
//func (s *responseService) GetResponsesByQuestionID(ctx context.Context, userID string, questionID uuid.UUID, page model.PageParams) ([]model.Response, error) {
//	//TODO implement me
//	panic("implement me")
//}
//
//func (s *responseService) GetResponsesByUserID(ctx context.Context, userID string, page model.PageParams) ([]model.Response, error) {
//	//TODO implement me
//	panic("implement me")
//}
