package service

import (
	"context"
	"errors"
	"testing"

	"github.com/ksha23/CS407-FactSnap/internal/core/model"
	"github.com/ksha23/CS407-FactSnap/internal/errs"
	"github.com/ksha23/CS407-FactSnap/internal/uploadthing"
)

type stubUploadClient struct {
	resp      *uploadthing.UploadResponse
	uploadErr error
	url       string
	urlErr    error
	deleteErr error
}

func (s *stubUploadClient) UploadFile(fileName string, fileData []byte, mimeType string) (*uploadthing.UploadResponse, error) {
	if s.uploadErr != nil {
		return nil, s.uploadErr
	}
	return s.resp, nil
}

func (s *stubUploadClient) DeleteFile(key string) error {
	return s.deleteErr
}

func (s *stubUploadClient) FileURL(key string) (string, error) {
	if s.urlErr != nil {
		return "", s.urlErr
	}
	return s.url, nil
}

func TestMediaServiceUploadMedia_Success(t *testing.T) {
	client := &stubUploadClient{
		resp: &uploadthing.UploadResponse{
			Key:  "file-key",
			URL:  "https://cdn.test/file-key",
			Name: "photo.jpg",
			Size: 1024,
		},
	}

	service := NewMediaService(client)

	params := model.UploadMediaParams{
		FileName: "photo.jpg",
		MimeType: "image/jpeg",
		Data:     []byte("fake-binary"),
		Uploader: "user_123",
	}

	asset, err := service.UploadMedia(context.Background(), params)
	if err != nil {
		t.Fatalf("UploadMedia returned error: %v", err)
	}

	if asset.Key != "file-key" || asset.URL != "https://cdn.test/file-key" {
		t.Fatalf("unexpected asset: %+v", asset)
	}

	if asset.Uploader != "user_123" {
		t.Fatalf("expected uploader to be set, got %s", asset.Uploader)
	}

	if asset.MimeType != "image/jpeg" {
		t.Fatalf("expected mime type to be propagated, got %s", asset.MimeType)
	}
}

func TestMediaServiceUploadMedia_ValidationError(t *testing.T) {
	client := &stubUploadClient{}
	service := NewMediaService(client)

	_, err := service.UploadMedia(context.Background(), model.UploadMediaParams{})
	if err == nil {
		t.Fatalf("expected validation error but got nil")
	}

	var e errs.Error
	if !errors.As(err, &e) {
		t.Fatalf("expected errs.Error but got %T", err)
	}

	if e.Type != errs.TypeBadRequest {
		t.Fatalf("expected TypeBadRequest but got %s", e.Type)
	}
}

func TestMediaServiceGetMediaURL_Success(t *testing.T) {
	client := &stubUploadClient{url: "https://cdn.test/file-key"}
	service := NewMediaService(client)

	asset, err := service.GetMediaURL(context.Background(), "file-key")
	if err != nil {
		t.Fatalf("GetMediaURL returned error: %v", err)
	}

	if asset.URL != "https://cdn.test/file-key" {
		t.Fatalf("expected url to be resolved, got %s", asset.URL)
	}
}

func TestMediaServiceDeleteMedia(t *testing.T) {
	client := &stubUploadClient{}
	service := NewMediaService(client)

	if err := service.DeleteMedia(context.Background(), "file-key"); err != nil {
		t.Fatalf("DeleteMedia returned error: %v", err)
	}
}
