package model

// UploadMediaParams captures the input required to upload a media asset.
type UploadMediaParams struct {
	FileName string
	MimeType string
	Data     []byte
	Uploader string
}

// MediaAsset represents a media object stored in UploadThing.
type MediaAsset struct {
	Key      string `json:"key"`
	URL      string `json:"url"`
	FileName string `json:"fileName"`
	MimeType string `json:"mimeType"`
	Size     int64  `json:"size"`
	Provider string `json:"provider"`
	Uploader string `json:"uploader"`
}
