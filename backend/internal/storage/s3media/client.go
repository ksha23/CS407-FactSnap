package s3media

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"path"
	"path/filepath"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"

	"github.com/ksha23/CS407-FactSnap/internal/config"
	"github.com/ksha23/CS407-FactSnap/internal/core/model"
	"github.com/ksha23/CS407-FactSnap/internal/errs"
)

const (
	providerName        = "aws-s3"
	defaultKeyPrefix    = "uploads"
	metadataFileNameKey = "filename"
	metadataUploaderKey = "uploader"
)

type Client struct {
	s3Client        *s3.Client
	presignClient   *s3.PresignClient
	bucket          string
	region          string
	cdnBaseURL      string
	presignDuration time.Duration
}

func NewClient(cfg config.S3) (*Client, error) {
	if cfg.Bucket == "" {
		return nil, errors.New("s3 bucket is required")
	}
	if cfg.Region == "" {
		return nil, errors.New("s3 region is required")
	}

	expires, err := time.ParseDuration(cfg.PresignDuration)
	if err != nil {
		return nil, fmt.Errorf("invalid s3 presign duration: %w", err)
	}

	loadOpts := []func(*awsconfig.LoadOptions) error{
		awsconfig.WithRegion(cfg.Region),
	}

	if cfg.AccessKeyID != "" && cfg.SecretAccessKey != "" {
		loadOpts = append(loadOpts, awsconfig.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(cfg.AccessKeyID, cfg.SecretAccessKey, cfg.SessionToken),
		))
	}

	if cfg.Endpoint != "" {
		endpoint := cfg.Endpoint
		loadOpts = append(loadOpts, awsconfig.WithEndpointResolverWithOptions(
			aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
				return aws.Endpoint{
					URL:           endpoint,
					PartitionID:   "aws",
					SigningRegion: cfg.Region,
				}, nil
			}),
		))
	}

	awsCfg, err := awsconfig.LoadDefaultConfig(context.Background(), loadOpts...)
	if err != nil {
		return nil, fmt.Errorf("loading aws configuration failed: %w", err)
	}

	s3Client := s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		o.UsePathStyle = cfg.UsePathStyle
	})

	return &Client{
		s3Client:        s3Client,
		presignClient:   s3.NewPresignClient(s3Client, func(o *s3.PresignOptions) { o.Expires = expires }),
		bucket:          cfg.Bucket,
		region:          cfg.Region,
		cdnBaseURL:      cfg.CDNBaseURL,
		presignDuration: expires,
	}, nil
}

func (c *Client) Upload(ctx context.Context, params model.UploadMediaParams) (model.MediaAsset, error) {
	objectKey := c.buildObjectKey(params)

	contentLength := int64(len(params.Data))
	_, err := c.s3Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:        aws.String(c.bucket),
		Key:           aws.String(objectKey),
		Body:          bytes.NewReader(params.Data),
		ContentType:   aws.String(params.MimeType),
		ContentLength: &contentLength,
		Metadata: map[string]string{
			metadataFileNameKey: params.FileName,
			metadataUploaderKey: params.Uploader,
		},
	})
	if err != nil {
		return model.MediaAsset{}, fmt.Errorf("s3 client: uploading media failed: %w", err)
	}

	url, err := c.presignGetURL(ctx, objectKey)
	if err != nil {
		return model.MediaAsset{}, fmt.Errorf("s3 client: generating media url failed: %w", err)
	}

	expiresAt := time.Now().Add(c.presignDuration)

	return model.MediaAsset{
		Key:          objectKey,
		URL:          url,
		URLExpiresAt: expiresAt,
		FileName:     params.FileName,
		MimeType:     params.MimeType,
		Size:         int64(len(params.Data)),
		Provider:     providerName,
		Uploader:     params.Uploader,
	}, nil
}

func (c *Client) Get(ctx context.Context, key string) (model.MediaAsset, error) {
	objectKey := strings.TrimPrefix(key, "/")

	headOutput, err := c.s3Client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(objectKey),
	})
	if err != nil {
		return model.MediaAsset{}, c.handleS3Error(err, "media asset not found", "fetching media metadata failed")
	}

	url, err := c.presignGetURL(ctx, objectKey)
	if err != nil {
		return model.MediaAsset{}, fmt.Errorf("s3 client: generating media url failed: %w", err)
	}

	expiresAt := time.Now().Add(c.presignDuration)

	fileName := headOutput.Metadata[metadataFileNameKey]
	if fileName == "" {
		fileName = filepath.Base(objectKey)
	}

	var size int64
	if headOutput.ContentLength != nil {
		size = *headOutput.ContentLength
	}

	return model.MediaAsset{
		Key:          objectKey,
		URL:          url,
		URLExpiresAt: expiresAt,
		FileName:     fileName,
		MimeType:     aws.ToString(headOutput.ContentType),
		Size:         size,
		Provider:     providerName,
		Uploader:     headOutput.Metadata[metadataUploaderKey],
	}, nil
}

func (c *Client) Delete(ctx context.Context, key string) error {
	objectKey := strings.TrimPrefix(key, "/")

	_, err := c.s3Client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(objectKey),
	})
	if err != nil {
		return c.handleS3Error(err, "media asset not found", "deleting media asset failed")
	}

	_, err = c.s3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(objectKey),
	})
	if err != nil {
		return c.handleS3Error(err, "media asset not found", "deleting media asset failed")
	}

	return nil
}

func (c *Client) presignGetURL(ctx context.Context, key string) (string, error) {
	presigned, err := c.presignClient.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return "", err
	}

	return presigned.URL, nil
}

func (c *Client) buildObjectKey(params model.UploadMediaParams) string {
	ext := strings.ToLower(filepath.Ext(params.FileName))
	if ext == "" {
		ext = ".bin"
	}

	uploaderSegment := sanitizeKeySegment(params.Uploader)
	timestamp := time.Now().UTC().Format("20060102T150405Z")
	randomPart := strings.ReplaceAll(uuid.NewString(), "-", "")
	fileNameSegment := sanitizeKeySegment(strings.TrimSuffix(params.FileName, ext))

	objectParts := []string{
		defaultKeyPrefix,
		uploaderSegment,
		fmt.Sprintf("%s-%s-%s%s", timestamp, randomPart, fileNameSegment, ext),
	}

	return path.Join(objectParts...)
}

func sanitizeKeySegment(value string) string {
	value = strings.ToLower(value)
	if value == "" {
		return "unknown"
	}

	var builder strings.Builder
	for _, r := range value {
		switch {
		case r >= 'a' && r <= 'z':
			builder.WriteRune(r)
		case r >= '0' && r <= '9':
			builder.WriteRune(r)
		case r == '-' || r == '_':
			builder.WriteRune(r)
		default:
			builder.WriteRune('-')
		}
	}

	return strings.Trim(builder.String(), "-")
}

func (c *Client) handleS3Error(err error, notFoundMsg, genericMsg string) error {
	var apiErr interface {
		ErrorCode() string
	}
	if errors.As(err, &apiErr) {
		code := apiErr.ErrorCode()
		if code == "NotFound" || code == "NoSuchKey" {
			return errs.Error{
				Type:     errs.TypeNotFound,
				Message:  notFoundMsg,
				Internal: err,
			}
		}
	}

	return fmt.Errorf("s3 client: %s: %w", genericMsg, err)
}
