// Jerry added new file
package dto

import (
    "errors"
    "strings"
)

type CreateResponseReq struct {
    Body      string   `json:"body"`
    ImageURLs []string `json:"image_urls"`
}

func (r *CreateResponseReq) Validate() error {
    if strings.TrimSpace(r.Body) == "" {
        return errors.New("body is required")
    }
    return nil
}

type CreateResponseRes struct {
    Response interface{} `json:"response"`
}

type EditResponseReq struct {
    Body      string   `json:"body"`
    ImageURLs []string `json:"image_urls"`
}

func (r *EditResponseReq) Validate() error {
    if strings.TrimSpace(r.Body) == "" {
        return errors.New("body is required")
    }
    return nil
}

type EditResponseRes struct {
    Response interface{} `json:"response"`
}