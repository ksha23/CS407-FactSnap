package model

import "github.com/google/uuid"

type Location struct {
	ID        uuid.UUID `json:"id"`
	Latitude  float64   `json:"latitude"`
	Longitude float64   `json:"longitude"`
	Name      *string   `json:"name"`
	Address   *string   `json:"address"`
}
