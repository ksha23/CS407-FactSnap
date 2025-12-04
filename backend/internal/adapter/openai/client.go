package openai

import (
	"context"
	"fmt"
	"github.com/ksha23/CS407-FactSnap/internal/config"
	"github.com/openai/openai-go/v3"
	"github.com/openai/openai-go/v3/option"
	"github.com/openai/openai-go/v3/responses"
	"log/slog"
)

type Client struct {
	openai.Client
}

func NewClient(cfg config.OpenAI) *Client {
	client := openai.NewClient(
		option.WithAPIKey(cfg.APIKey),
	)
	return &Client{Client: client}
}

func (c *Client) Prompt(ctx context.Context, prompt string) (string, error) {
	// TODO: maybe can optimize this further
	slog.DebugContext(ctx, "OpenAI Client: sending prompt...")

	params := responses.ResponseNewParams{
		Input: responses.ResponseNewParamsInputUnion{OfString: openai.String(prompt)},
		Model: openai.ChatModelGPT5_1,
	}

	resp, err := c.Responses.New(ctx, params)
	if err != nil {
		return "", fmt.Errorf("OpenAI Client::Prompt: %w", err)
	}

	return resp.OutputText(), nil
}
