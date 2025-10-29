package uploadthing

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

const (
	DefaultAPIBaseURL = "https://api.uploadthing.com"
	DefaultCDNBaseURL = "https://utfs.io/f"
)

type Client struct {
	SecretKey  string
	AppID      string
	BaseURL    string
	CDNBaseURL string
	HTTPClient *http.Client
}

type UploadResponse struct {
	Key  string `json:"key"`
	URL  string `json:"url"`
	Name string `json:"name"`
	Size int64  `json:"size"`
}

type FileInfo struct {
	Name string `json:"name"`
	Size int64  `json:"size"`
	Type string `json:"type"`
}

type UploadRequest struct {
	Files []FileInfo `json:"files"`
}

func NewClient(secretKey, appID string) *Client {
	return &Client{
		SecretKey:  secretKey,
		AppID:      appID,
		BaseURL:    DefaultAPIBaseURL,
		CDNBaseURL: DefaultCDNBaseURL,
		HTTPClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (c *Client) UploadFile(fileName string, fileData []byte, mimeType string) (*UploadResponse, error) {
	baseURL := c.BaseURL
	if baseURL == "" {
		baseURL = DefaultAPIBaseURL
	}

	url := fmt.Sprintf("%s/api/uploadFiles", strings.TrimRight(baseURL, "/"))

	reqBody := UploadRequest{
		Files: []FileInfo{
			{
				Name: fileName,
				Size: int64(len(fileData)),
				Type: mimeType,
			},
		},
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.SecretKey)
	if c.AppID != "" {
		req.Header.Set("X-UploadThing-App-ID", c.AppID)
	}

	// Debug logging
	fmt.Printf("UploadThing Request URL: %s\n", url)
	fmt.Printf("UploadThing Request Headers: Authorization=%s, AppID=%s\n",
		req.Header.Get("Authorization")[:20]+"...", req.Header.Get("X-UploadThing-App-ID"))
	fmt.Printf("UploadThing Request Body: %s\n", string(jsonData))

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to upload file: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Printf("UploadThing Response Status: %d\n", resp.StatusCode)
	fmt.Printf("UploadThing Response Body: %s\n", string(body))

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("upload failed with status %d: %s", resp.StatusCode, string(body))
	}

	var uploadResp UploadResponse
	if err := json.Unmarshal(body, &uploadResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return &uploadResp, nil
}

func (c *Client) DeleteFile(key string) error {
	baseURL := c.BaseURL
	if baseURL == "" {
		baseURL = DefaultAPIBaseURL
	}
	url := fmt.Sprintf("%s/api/deleteFile", strings.TrimRight(baseURL, "/"))

	reqBody := map[string]string{"key": key}
	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.SecretKey)
	if c.AppID != "" {
		req.Header.Set("X-UploadThing-App-ID", c.AppID)
	}

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to delete file: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("delete failed with status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

func (c *Client) FileURL(key string) (string, error) {
	if key == "" {
		return "", fmt.Errorf("file key cannot be empty")
	}

	cdnBase := c.CDNBaseURL
	if cdnBase == "" {
		cdnBase = DefaultCDNBaseURL
	}

	return fmt.Sprintf("%s/%s", strings.TrimRight(cdnBase, "/"), strings.TrimLeft(key, "/")), nil
}
