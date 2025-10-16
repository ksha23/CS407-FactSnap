package service

import "github.com/ksha23/CS407-FactSnap/internal/core/port"

type responseService struct {
	responseRepo port.ResponseRepo
}

func NewResponseService(responseRepo port.ResponseRepo) *responseService {
	return &responseService{responseRepo: responseRepo}
}

// TODO: implement ResponseService interface methods
