package logger

import (
	"context"
	"github.com/lmittmann/tint"
	"log/slog"
	"os"
	"time"
)

func init() {
	handler := tint.NewHandler(os.Stdout, &tint.Options{
		Level:      slog.LevelDebug,
		TimeFormat: time.DateTime,
	})
	slog.SetDefault(slog.New(handler))
}

var (
	keys []string
)

// AddContextKey adds the given key(s) as a recognized context key to parse when logging.
// NOTE: This function is NOT thread-safe. It is recommended to invoke during initialization process.
func AddContextKey(contextKeys ...string) {
	keys = append(keys, contextKeys...)
}

type ContextHandler struct {
	slog.Handler
}

func NewCtxHandler(baseHandler slog.Handler) *ContextHandler {
	return &ContextHandler{
		Handler: baseHandler,
	}
}

// Handle overrides the default Handle method to add context values
func (h *ContextHandler) Handle(ctx context.Context, r slog.Record) error {
	var attrs []slog.Attr
	for _, key := range keys {
		value := ctx.Value(key)
		if value != nil {
			attrs = append(attrs, slog.Any(key, value))
		}
	}
	r.AddAttrs(attrs...)
	return h.Handler.Handle(ctx, r)
}
