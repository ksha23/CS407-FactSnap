package uploadthing

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/ksha23/CS407-FactSnap/internal/config"
	"github.com/ksha23/CS407-FactSnap/internal/core/model"
	"github.com/ksha23/CS407-FactSnap/internal/errs"
)

const (
	providerName            = "uploadthing"
	createUploadPath        = "/v3/direct-files"
	filePathFormat          = "/v3/files/%s"
	defaultHTTPClientTimout = 45 * time.Second
)

type Client struct {
	httpClient *http.Client
	cfg        config.Uploadthing
}

func NewClient(cfg config.Uploadthing) (*Client, error) {
	cfg.BaseURL = strings.TrimRight(cfg.BaseURL, "/")
	cfg.CDNBaseURL = strings.TrimRight(cfg.CDNBaseURL, "/")

	if cfg.SecretKey == "" {
		return nil, errors.New("uploadthing secret key is required")
	}
	if cfg.AppID == "" {
		return nil, errors.New("uploadthing app id is required")
	}
	if cfg.BaseURL == "" {
		return nil, errors.New("uploadthing api base url is required")
	}
	if cfg.CDNBaseURL == "" {
		return nil, errors.New("uploadthing cdn base url is required")
	}

	return &Client{
		httpClient: &http.Client{Timeout: defaultHTTPClientTimout},
		cfg:        cfg,
	}, nil
}

func (c *Client) Upload(ctx context.Context, params model.UploadMediaParams) (model.MediaAsset, error) {
	meta, err := c.requestUploadMetadata(ctx, params)
	if err != nil {
		return model.MediaAsset{}, err
	}

	if err := c.performUpload(ctx, meta, params); err != nil {
		return model.MediaAsset{}, err
	}

	assetURL := meta.FileURL
	if assetURL == "" {
		assetURL = c.buildFileURL(meta.FileKey)
	}

	return model.MediaAsset{
		Key:      meta.FileKey,
		URL:      assetURL,
		FileName: params.FileName,
		MimeType: params.MimeType,
		Size:     int64(len(params.Data)),
		Provider: providerName,
		Uploader: params.Uploader,
	}, nil
}

func (c *Client) Get(ctx context.Context, key string) (model.MediaAsset, error) {
	url := c.buildAPIURL(fmt.Sprintf(filePathFormat, strings.TrimPrefix(key, "/")))
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return model.MediaAsset{}, fmt.Errorf("uploadthing client: building get request failed: %w", err)
	}
	c.decorateRequest(req)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return model.MediaAsset{}, fmt.Errorf("uploadthing client: get media request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return model.MediaAsset{}, c.errorFromResponse(resp, errs.TypeNotFound, "media asset not found")
	}
	if resp.StatusCode >= 400 {
		return model.MediaAsset{}, c.errorFromResponse(resp, errs.TypeBadRequest, "failed to fetch media asset metadata")
	}

	var payload fileMetadataResponse
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return model.MediaAsset{}, fmt.Errorf("uploadthing client: decoding media metadata failed: %w", err)
	}

	data := payload.Data
	if data.FileKey == "" {
		data.FileKey = key
	}
	assetURL := data.FileURL
	if assetURL == "" {
		assetURL = c.buildFileURL(data.FileKey)
	}

	return model.MediaAsset{
		Key:      data.FileKey,
		URL:      assetURL,
		FileName: data.Name,
		MimeType: data.Type,
		Size:     data.Size,
		Provider: providerName,
	}, nil
}

func (c *Client) Delete(ctx context.Context, key string) error {
	url := c.buildAPIURL(fmt.Sprintf(filePathFormat, strings.TrimPrefix(key, "/")))
	req, err := http.NewRequestWithContext(ctx, http.MethodDelete, url, nil)
	if err != nil {
		return fmt.Errorf("uploadthing client: building delete request failed: %w", err)
	}
	c.decorateRequest(req)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("uploadthing client: delete media request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return c.errorFromResponse(resp, errs.TypeNotFound, "media asset not found")
	}
	if resp.StatusCode >= 400 {
		return c.errorFromResponse(resp, errs.TypeBadRequest, "failed to delete media asset")
	}

	return nil
}

type uploadMetadata struct {
	FileKey       string
	UploadURL     string
	UploadHeaders map[string]string
	FileURL       string
}

func (c *Client) requestUploadMetadata(ctx context.Context, params model.UploadMediaParams) (*uploadMetadata, error) {
	body, err := json.Marshal(directUploadRequest{
		AppID: c.cfg.AppID,
		Files: []directUploadFile{{
			Name: params.FileName,
			Size: int64(len(params.Data)),
			Type: params.MimeType,
		}},
		Metadata: map[string]string{
			"uploader": params.Uploader,
		},
	})
	if err != nil {
		return nil, fmt.Errorf("uploadthing client: marshalling direct upload request failed: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.buildAPIURL(createUploadPath), bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("uploadthing client: building direct upload request failed: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	c.decorateRequest(req)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("uploadthing client: direct upload request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return nil, c.errorFromResponse(resp, errs.TypeBadRequest, "failed to request upload metadata")
	}

	var payload directUploadResponse
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil, fmt.Errorf("uploadthing client: decoding upload metadata failed: %w", err)
	}
	if len(payload.Data) == 0 {
		return nil, errors.New("uploadthing client: upload metadata response contained no data")
	}

	item := payload.Data[0]
	if item.FileKey == "" {
		return nil, errors.New("uploadthing client: upload metadata response missing fileKey")
	}
	if item.UploadURL == "" {
		return nil, errors.New("uploadthing client: upload metadata response missing uploadUrl")
	}

	return &uploadMetadata{
		FileKey:       item.FileKey,
		UploadURL:     item.UploadURL,
		UploadHeaders: item.Headers,
		FileURL:       item.FileURL,
	}, nil
}

func (c *Client) performUpload(ctx context.Context, meta *uploadMetadata, params model.UploadMediaParams) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodPut, meta.UploadURL, bytes.NewReader(params.Data))
	if err != nil {
		return fmt.Errorf("uploadthing client: building upload request failed: %w", err)
	}

	req.Header.Set("Content-Type", params.MimeType)
	for key, value := range meta.UploadHeaders {
		req.Header.Set(key, value)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("uploadthing client: uploading media failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return c.errorFromResponse(resp, errs.TypeBadRequest, "failed to upload media to storage provider")
	}

	return nil
}

func (c *Client) decorateRequest(req *http.Request) {
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.cfg.SecretKey))
	req.Header.Set("X-Uploadthing-Api-Key", c.cfg.SecretKey)
	req.Header.Set("X-Uploadthing-App-Id", c.cfg.AppID)
}

func (c *Client) buildAPIURL(path string) string {
	if strings.HasPrefix(path, "/") {
		return c.cfg.BaseURL + path
	}
	return c.cfg.BaseURL + "/" + path
}

func (c *Client) buildFileURL(key string) string {
	key = strings.TrimPrefix(key, "/")
	return fmt.Sprintf("%s/%s", c.cfg.CDNBaseURL, key)
}

func (c *Client) errorFromResponse(resp *http.Response, errType errs.Type, msg string) error {
	body, _ := io.ReadAll(resp.Body)
	detail := strings.TrimSpace(string(body))
	if detail == "" {
		detail = resp.Status
	}
	internal := fmt.Errorf("uploadthing api error: status=%d detail=%s", resp.StatusCode, detail)
	return errs.Error{
		Type:     errType,
		Message:  msg,
		Internal: internal,
	}
}

type directUploadRequest struct {
	AppID    string             `json:"appId"`
	Files    []directUploadFile `json:"files"`
	Metadata map[string]string  `json:"metadata,omitempty"`
}

type directUploadFile struct {
	Name string `json:"name"`
	Size int64  `json:"size"`
	Type string `json:"type"`
}

type directUploadResponse struct {
	Data []struct {
		FileKey   string            `json:"fileKey"`
		UploadURL string            `json:"uploadUrl"`
		FileURL   string            `json:"fileUrl"`
		Headers   map[string]string `json:"headers"`
	} `json:"data"`
}

type fileMetadataResponse struct {
	Data struct {
		FileKey string `json:"fileKey"`
		FileURL string `json:"fileUrl"`
		Name    string `json:"name"`
		Type    string `json:"type"`
		Size    int64  `json:"size"`
	} `json:"data"`
}
