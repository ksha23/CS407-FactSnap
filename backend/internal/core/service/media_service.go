package service

import (
	"context"
	"fmt"

	"github.com/ksha23/CS407-FactSnap/internal/core/model"
	"github.com/ksha23/CS407-FactSnap/internal/errs"
	"github.com/ksha23/CS407-FactSnap/internal/uploadthing"
)

type uploadClient interface {
	UploadFile(fileName string, fileData []byte, mimeType string) (*uploadthing.UploadResponse, error)
	DeleteFile(key string) error
	FileURL(key string) (string, error)
}

type mediaService struct {
	client uploadClient
}

func NewMediaService(client uploadClient) *mediaService {
	return &mediaService{client: client}
}

func (s *mediaService) UploadMedia(ctx context.Context, params model.UploadMediaParams) (model.MediaAsset, error) {
	if err := params.Validate(); err != nil {
		return model.MediaAsset{}, errs.Error{
			Type:     errs.TypeBadRequest,
			Message:  err.Error(),
			Internal: err,
		}
	}

	resp, err := s.client.UploadFile(params.FileName, params.Data, params.MimeType)
	if err != nil {
		return model.MediaAsset{}, fmt.Errorf("MediaService::UploadMedia: %w", err)
	}

	url := resp.URL
	if url == "" {
		url, err = s.client.FileURL(resp.Key)
		if err != nil {
			return model.MediaAsset{}, fmt.Errorf("MediaService::UploadMedia: could not resolve file url: %w", err)
		}
	}

	asset := model.MediaAsset{
		Key:      resp.Key,
		URL:      url,
		Name:     resp.Name,
		Size:     resp.Size,
		MimeType: params.MimeType,
		Uploader: params.Uploader,
	}

	if asset.Name == "" {
		asset.Name = params.FileName
	}

	if asset.Size == 0 {
		asset.Size = int64(len(params.Data))
	}

	return asset, nil
}

func (s *mediaService) GetMediaURL(ctx context.Context, key string) (model.MediaAsset, error) {
	if key == "" {
		err := fmt.Errorf("media key is required")
		return model.MediaAsset{}, errs.Error{
			Type:     errs.TypeBadRequest,
			Message:  err.Error(),
			Internal: err,
		}
	}

	url, err := s.client.FileURL(key)
	if err != nil {
		return model.MediaAsset{}, fmt.Errorf("MediaService::GetMediaURL: %w", err)
	}

	return model.MediaAsset{
		Key: key,
		URL: url,
	}, nil
}

func (s *mediaService) DeleteMedia(ctx context.Context, key string) error {
	if key == "" {
		err := fmt.Errorf("media key is required")
		return errs.Error{
			Type:     errs.TypeBadRequest,
			Message:  err.Error(),
			Internal: err,
		}
	}

	if err := s.client.DeleteFile(key); err != nil {
		return fmt.Errorf("MediaService::DeleteMedia: %w", err)
	}

	return nil
}
