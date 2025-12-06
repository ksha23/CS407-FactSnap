package service

import (
	"context"

	"github.com/ksha23/CS407-FactSnap/internal/core/port"
)

type userService struct {
	userRepo port.UserRepository
}

func NewUserService(userRepo port.UserRepository) *userService {
	return &userService{userRepo: userRepo}
}

func (s *userService) GetUserStatistics(ctx context.Context, userID string) (int, int, error) {
	questionCount, err := s.userRepo.GetUserQuestionCount(ctx, userID)
	if err != nil {
		return 0, 0, err
	}

	responseCount, err := s.userRepo.GetUserResponseCount(ctx, userID)
	if err != nil {
		return 0, 0, err
	}

	return questionCount, responseCount, nil
}

//func (s *userService) EditUser(ctx context.Context, params model.EditUserParams) (model.AuthUser, error) {
//	//TODO implement me
//	panic("implement me")
//}
