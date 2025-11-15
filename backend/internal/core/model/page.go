package model

import (
	"fmt"
	"strings"
)

type PageFilterType string

const (
	PageFilterTypeNone             PageFilterType = "none"
	PageFilterTypeQuestionCategory PageFilterType = "question_category"
)

var pageFilterTypeEnumValues = map[string]PageFilterType{
	"none":              PageFilterTypeNone,
	"question_category": PageFilterTypeQuestionCategory,
}

func ParsePageFilterType(str string) (PageFilterType, error) {
	if str == "" {
		return PageFilterTypeNone, nil
	}
	if enum, ok := pageFilterTypeEnumValues[strings.ToLower(str)]; ok {
		return enum, nil
	}
	return "", fmt.Errorf("%s is not a valid page filter type", str)
}

type PageFilter struct {
	Type  PageFilterType
	Value string
}

type PageParams struct {
	Limit  int
	Offset int
	Filter PageFilter
}
