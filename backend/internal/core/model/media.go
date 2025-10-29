package model

import (
	"fmt"
)

type MediaAsset struct {
	Key      string `json:"key"`
	URL      string `json:"url"`
	Name     string `json:"name"`
	Size     int64  `json:"size"`
	MimeType string `json:"mime_type"`
	Uploader string `json:"uploader"`
}

type UploadMediaParams struct {
	FileName string
	MimeType string
	Data     []byte
	Uploader string
}

func (p UploadMediaParams) Validate() error {
	if p.Uploader == "" {
		return fmt.Errorf("uploader is required")
	}
	if p.FileName == "" {
		return fmt.Errorf("file name is required")
	}
	if len(p.Data) == 0 {
		return fmt.Errorf("file data is required")
	}
	if p.MimeType == "" {
		return fmt.Errorf("mime type is required")
	}
	return nil
}
