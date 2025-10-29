package ginhttp

import (
	"errors"
	"fmt"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ksha23/CS407-FactSnap/internal/adapter/ginhttp/dto"
	"github.com/ksha23/CS407-FactSnap/internal/core/model"
	"github.com/ksha23/CS407-FactSnap/internal/core/port"
	"github.com/ksha23/CS407-FactSnap/internal/errs"
)

type MediaHandler struct {
	MediaService port.MediaService
}

func NewMediaHandler(mediaService port.MediaService) *MediaHandler {
	return &MediaHandler{MediaService: mediaService}
}

func (h *MediaHandler) RegisterRoutes(r *gin.RouterGroup) {
	mediaRoutes := r.Group("/media")
	mediaRoutes.POST("/upload", h.UploadMedia)
	mediaRoutes.GET("/:key", h.GetMediaByKey)
	mediaRoutes.DELETE("/:key", h.DeleteMediaByKey)
}

func (h *MediaHandler) UploadMedia(c *gin.Context) {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		if errors.Is(err, http.ErrMissingFile) {
			HandleErr(c, errs.Error{
				Type:     errs.TypeBadRequest,
				Message:  "file field is required",
				Internal: err,
			})
			return
		}
		HandleErr(c, fmt.Errorf("%s: %w", "MediaHandler::UploadMedia", err))
		return
	}

	file, err := fileHeader.Open()
	if err != nil {
		HandleErr(c, fmt.Errorf("%s: %w", "MediaHandler::UploadMedia", err))
		return
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		HandleErr(c, fmt.Errorf("%s: %w", "MediaHandler::UploadMedia", err))
		return
	}

	mimeType := fileHeader.Header.Get("Content-Type")
	if mimeType == "" {
		mimeType = http.DetectContentType(data)
	}

	params := model.UploadMediaParams{
		FileName: fileHeader.Filename,
		MimeType: mimeType,
		Data:     data,
		Uploader: getAuthUserID(c),
	}

	asset, err := h.MediaService.UploadMedia(c.Request.Context(), params)
	if err != nil {
		HandleErr(c, fmt.Errorf("%s: %w", "MediaHandler::UploadMedia", err))
		return
	}

	res := dto.MediaAssetRes{Asset: asset}
	c.JSON(http.StatusCreated, res)
}

func (h *MediaHandler) GetMediaByKey(c *gin.Context) {
	key := c.Param("key")

	asset, err := h.MediaService.GetMediaURL(c.Request.Context(), key)
	if err != nil {
		HandleErr(c, fmt.Errorf("%s: %w", "MediaHandler::GetMediaByKey", err))
		return
	}

	res := dto.MediaAssetRes{Asset: asset}
	c.JSON(http.StatusOK, res)
}

func (h *MediaHandler) DeleteMediaByKey(c *gin.Context) {
	key := c.Param("key")

	if err := h.MediaService.DeleteMedia(c.Request.Context(), key); err != nil {
		HandleErr(c, fmt.Errorf("%s: %w", "MediaHandler::DeleteMediaByKey", err))
		return
	}

	res := dto.MessageRes{Message: "Media deleted"}
	c.JSON(http.StatusOK, res)
}
