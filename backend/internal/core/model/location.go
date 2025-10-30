package model

import "github.com/google/uuid"

type Location struct {
	ID        uuid.UUID `json:"id"`
	Latitude  string    `json:"latitude"`
	Longitude string    `json:"longitude"`
	Name      *string   `json:"name"`
	Address   *string   `json:"address"`
}
