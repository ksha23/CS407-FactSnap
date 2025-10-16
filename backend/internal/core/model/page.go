package model

type PageFilter string

const (
	PageFilterQuestionTitle    PageFilter = "question_title"
	PageFilterQuestionCategory PageFilter = "question_category"
	PageFilterQuestionType     PageFilter = "question_type"
)

type PageParams struct {
	Limit       int
	Offset      int
	Filter      PageFilter
	FilterValue string
}
