package model

type QuestionType string

const (
	QuestionTypeWaitTime     QuestionType = "wait_time"
	QuestionTypeAvailabiilty QuestionType = "availabilty"
	QuestionTypeRule         QuestionType = "rule"
	QuestionTypeWeather      QuestionType = "weather"
	QuestionTypeStatus       QuestionType = "status"
)
