package service

import "github.com/ksha23/CS407-FactSnap/internal/core/port"

type userService struct {
	userRepo port.UserRepository
}

func NewUserService(userRepo port.UserRepository) *userService {
	return &userService{userRepo: userRepo}
}
