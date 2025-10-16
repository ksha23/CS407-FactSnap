package model

type QuestionType string

const (
	QuestionTypeWaitTime     QuestionType = "wait_time"
	QuestionTypeAvailability QuestionType = "availability"
	QuestionTypeRule         QuestionType = "rule"
	QuestionTypeWeather      QuestionType = "weather"
	QuestionTypeStatus       QuestionType = "status"
)
