package service

import (
	"context"
	"fmt"
    "strings"
    "github.com/ksha23/CS407-FactSnap/internal/core/model"
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

func (s *userService) UpdateLocation(ctx context.Context, userID string, lat, long float64) error {
	return s.userRepo.UpdateLocation(ctx, userID, lat, long)
}

func (s *userService) UpdatePushToken(ctx context.Context, userID, token string) error {
	return s.userRepo.UpdatePushToken(ctx, userID, token)
}

func (s *userService) DeletePushToken(ctx context.Context, userID string) error {
	return s.userRepo.DeletePushToken(ctx, userID)
}

func (s *userService) UpdateProfile(ctx context.Context, userID string, displayName string) (model.AuthUser, error) {
    name := strings.TrimSpace(displayName)

    if len(name) < 2 || len(name) > 50 {
        return model.AuthUser{}, fmt.Errorf("display name must be between 2 and 50 characters")
    }

    user, err := s.userRepo.UpdateDisplayName(ctx, userID, name)
    if err != nil {
        return model.AuthUser{}, fmt.Errorf("UserService::UpdateProfile: %w", err)
    }

    return user, nil
}