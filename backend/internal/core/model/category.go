package model

import (
	"fmt"
	"strings"
)

type Category string

const (
	CategoryRestaurant     Category = "Restaurant"
	CategoryStore          Category = "Store"
	CategoryTransportation Category = "Transportation"
	CategoryEvent          Category = "Event"
	CategoryGeneral        Category = "General"
)

var categoryEnumValues = map[string]Category{
	"restaurant":     CategoryRestaurant,
	"store":          CategoryStore,
	"transportation": CategoryTransportation,
	"event":          CategoryEvent,
	"general":        CategoryGeneral,
}

func ParseCategory(str string) (Category, error) {
	if enum, ok := categoryEnumValues[strings.ToLower(str)]; ok {
		return enum, nil
	}
	return "", fmt.Errorf("%s is not a valid category", str)
}
