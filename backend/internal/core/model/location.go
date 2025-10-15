package model

import "github.com/google/uuid"

type Location struct {
	ID        uuid.UUID `json:"id,omitempty"`
	Latitude  string    `json:"latitude,omitempty"`
	Longitude string    `json:"longitude,omitempty"`
	Name      string    `json:"name,omitempty"`
}
