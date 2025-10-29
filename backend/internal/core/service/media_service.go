package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/ksha23/CS407-FactSnap/internal/core/model"
	"github.com/ksha23/CS407-FactSnap/internal/core/port"
	"github.com/ksha23/CS407-FactSnap/internal/errs"
)

const defaultMaxUploadBytes = 25 << 20 // 25 MB

type mediaService struct {
	provider port.MediaProvider
	maxBytes int
}

func NewMediaService(provider port.MediaProvider) port.MediaService {
	return &mediaService{
		provider: provider,
		maxBytes: defaultMaxUploadBytes,
	}
}

func (s *mediaService) UploadMedia(ctx context.Context, params model.UploadMediaParams) (model.MediaAsset, error) {
	if err := s.validateUploadParams(params); err != nil {
		return model.MediaAsset{}, err
	}

	asset, err := s.provider.Upload(ctx, params)
	if err != nil {
		return model.MediaAsset{}, err
	}

	return asset, nil
}

func (s *mediaService) GetMediaURL(ctx context.Context, key string) (model.MediaAsset, error) {
	if key == "" {
		return model.MediaAsset{}, errs.Error{
			Type:     errs.TypeBadRequest,
			Message:  "media key is required",
			Internal: errors.New("media key was empty"),
		}
	}

	return s.provider.Get(ctx, key)
}

func (s *mediaService) DeleteMedia(ctx context.Context, key string) error {
	if key == "" {
		return errs.Error{
			Type:     errs.TypeBadRequest,
			Message:  "media key is required",
			Internal: errors.New("media key was empty"),
		}
	}

	return s.provider.Delete(ctx, key)
}

func (s *mediaService) validateUploadParams(params model.UploadMediaParams) error {
	if params.Uploader == "" {
		return errs.UnauthenticatedError("uploader id is required", errors.New("missing uploader id"))
	}
	if params.FileName == "" {
		return errs.Error{
			Type:     errs.TypeBadRequest,
			Message:  "file name is required",
			Internal: errors.New("missing file name"),
		}
	}
	if len(params.Data) == 0 {
		return errs.Error{
			Type:     errs.TypeBadRequest,
			Message:  "file payload is required",
			Internal: errors.New("media payload was empty"),
		}
	}
	if params.MimeType == "" {
		return errs.Error{
			Type:     errs.TypeBadRequest,
			Message:  "mime type is required",
			Internal: errors.New("missing mime type"),
		}
	}
	if s.maxBytes > 0 && len(params.Data) > s.maxBytes {
		return errs.Error{
			Type:     errs.TypeBadRequest,
			Message:  fmt.Sprintf("file exceeds maximum size of %d bytes", s.maxBytes),
			Internal: fmt.Errorf("media payload exceeded maximum size %d bytes", s.maxBytes),
		}
	}
	return nil
}
