package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/ksha23/CS407-FactSnap/internal/core/model"
	"github.com/ksha23/CS407-FactSnap/internal/core/port"
	"github.com/ksha23/CS407-FactSnap/internal/errs"
)

const defaultMaxUploadBytes = 2 << 20 // 2 MB

type mediaService struct {
	provider port.MediaClient
	maxBytes int
}

func NewMediaService(provider port.MediaClient) port.MediaService {
	return &mediaService{
		provider: provider,
		maxBytes: defaultMaxUploadBytes,
	}
}

func (s *mediaService) UploadMedia(ctx context.Context, params model.UploadMediaParams) (model.MediaAsset, error) {
	if err := s.validateUploadParams(params); err != nil {
		return model.MediaAsset{}, fmt.Errorf("MediaService::UploadMedia: %w", err)
	}

	asset, err := s.provider.Upload(ctx, params)
	if err != nil {
		return model.MediaAsset{}, fmt.Errorf("MediaService::UploadMedia: %w", err)
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

	asset, err := s.provider.Get(ctx, key)
	if err != nil {
		return model.MediaAsset{}, fmt.Errorf("MediaService::GetMediaURL: %w", err)
	}

	return asset, nil
}

func (s *mediaService) DeleteMedia(ctx context.Context, key string) error {
	if key == "" {
		return errs.Error{
			Type:     errs.TypeBadRequest,
			Message:  "media key is required",
			Internal: errors.New("media key was empty"),
		}
	}

	err := s.provider.Delete(ctx, key)
	if err != nil {
		return fmt.Errorf("MediaService::DeleteMedia: %w", err)
	}

	return nil
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
