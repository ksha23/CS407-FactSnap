package port

import "context"

type AIClient interface {
	Prompt(ctx context.Context, prompt string) (string, error)
}
