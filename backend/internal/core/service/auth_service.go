package service

import (
	"context"
	"crypto/rand"
	"fmt"
	"github.com/ksha23/CS407-FactSnap/internal/clerk"
	"github.com/ksha23/CS407-FactSnap/internal/core/model"
	"github.com/ksha23/CS407-FactSnap/internal/core/port"
	"github.com/ksha23/CS407-FactSnap/internal/errs"
	"github.com/ksha23/CS407-FactSnap/internal/ptr"
	"github.com/ksha23/CS407-FactSnap/internal/validate"
	"strings"
)

type authService struct {
	clerkClient clerk.Client
	userRepo    port.UserRepository
}

func NewAuthService(clerkClient clerk.Client, userRepo port.UserRepository) *authService {
	return &authService{
		clerkClient: clerkClient,
		userRepo:    userRepo,
	}
}

func (s *authService) VerifyClerkToken(ctx context.Context, token string) (string, error) {
	clerkID, err := s.clerkClient.VerifyToken(ctx, token)
	if err != nil {
		return "", fmt.Errorf("AuthService::VerifyClerkToken: %w", err)
	}

	return clerkID, nil
}

func (s *authService) SyncClerkUser(ctx context.Context, userID string) (model.AuthUser, error) {
	// check if user already exists in db
	authUser, err := s.userRepo.GetAuthUserByID(ctx, userID)
	if err == nil {
		// user exists, so return it
		return authUser, nil
	}
	if errs.ErrType(err) != errs.TypeNotFound {
		return model.AuthUser{}, fmt.Errorf("AuthService::SyncClerkUser: could not check if user exists in db: %w", err)
	}

	// if reached here, then user doesn't exist, so create new user from Clerk data
	// NOTE: this makes API request to Clerk
	clerkUser, err := s.clerkClient.GetUser(ctx, userID)
	if err != nil {
		return model.AuthUser{}, fmt.Errorf("AuthService::SyncClerkUser: could not get clerk user: %w", err)
	}

	email := clerkUser.EmailAddresses[0].EmailAddress
	emailUsername := strings.Split(email, "@")[0]
	username := s.generateNewUsername(emailUsername)
	displayName := emailUsername
	if clerkUser.FirstName != nil && clerkUser.LastName != nil {
		displayName = fmt.Sprintf("%s %s", ptr.Deref(clerkUser.FirstName), ptr.Deref(clerkUser.LastName))
	}

	newUser, err := s.userRepo.CreateUser(ctx, model.CreateUserParams{
		ID:          clerkUser.ID,
		Username:    username,
		Email:       email,
		DisplayName: displayName,
		AvatarURL:   clerkUser.ImageURL,
		Role:        model.RoleUser,
	})
	if err != nil {
		return model.AuthUser{}, fmt.Errorf("AuthService::SyncClerkUser: could not create user: %w", err)
	}

	return newUser, err
}

func (s *authService) GetAuthUser(ctx context.Context, userID string) (model.AuthUser, error) {
	authUser, err := s.userRepo.GetAuthUserByID(ctx, userID)
	if err != nil {
		return model.AuthUser{}, fmt.Errorf("AuthService::GetAuthUser: %w", err)
	}

	return authUser, nil
}

func (s *authService) generateNewUsername(username string) string {
	b := make([]byte, 2)
	rand.Read(b)
	token := fmt.Sprintf("%x", b)
	length := validate.MaxUsernameLength - (len(token) + 1)
	if len(username) > length {
		username = username[:length]
	}
	return fmt.Sprintf("%s_%s", username, token)
}
