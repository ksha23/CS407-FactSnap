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

//func (s *userService) EditUser(ctx context.Context, params model.EditUserParams) (model.AuthUser, error) {
//	//TODO implement me
//	panic("implement me")
//}

func (s *userService) UpdateLocation(ctx context.Context, userID string, lat, long float64) error {
	return s.userRepo.UpdateLocation(ctx, userID, lat, long)
}

func (s *userService) UpdatePushToken(ctx context.Context, userID, token string) error {
	return s.userRepo.UpdatePushToken(ctx, userID, token)
}
