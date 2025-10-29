package port

import (
	"context"

	"github.com/ksha23/CS407-FactSnap/internal/core/model"
)

type MediaService interface {
	UploadMedia(ctx context.Context, params model.UploadMediaParams) (model.MediaAsset, error)
	GetMediaURL(ctx context.Context, key string) (model.MediaAsset, error)
	DeleteMedia(ctx context.Context, key string) error
}

type MediaProvider interface {
	Upload(ctx context.Context, params model.UploadMediaParams) (model.MediaAsset, error)
	Get(ctx context.Context, key string) (model.MediaAsset, error)
	Delete(ctx context.Context, key string) error
}
