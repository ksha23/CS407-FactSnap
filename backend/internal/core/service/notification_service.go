package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/ksha23/CS407-FactSnap/internal/core/port"
)

type ExpoNotificationService struct {
	client *http.Client
}

func NewExpoNotificationService() port.NotificationService {
	return &ExpoNotificationService{
		client: &http.Client{},
	}
}

type ExpoMessage struct {
	To    string                 `json:"to"`
	Title string                 `json:"title"`
	Body  string                 `json:"body"`
	Data  map[string]interface{} `json:"data,omitempty"`
}

func (s *ExpoNotificationService) SendPushNotification(ctx context.Context, tokens []string, title, body string, data map[string]interface{}) error {
	if len(tokens) == 0 {
		// log that there are no tokens to send to
		fmt.Println("No tokens to send push notifications to")
		return nil
	}

	fmt.Println("Sending push notification to tokens:", tokens)

	// Expo allows batching, but for simplicity we send one request with all messages
	// Note: Expo recommends batching if sending to many users.
	// Here we assume tokens list is not huge.

	var messages []ExpoMessage
	for _, token := range tokens {
		messages = append(messages, ExpoMessage{
			To:    token,
			Title: title,
			Body:  body,
			Data:  data,
		})
	}

	payload, err := json.Marshal(messages)
	if err != nil {
		return fmt.Errorf("failed to marshal notification payload: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", "https://exp.host/--/api/v2/push/send", bytes.NewBuffer(payload))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	// Read response body for debugging
	var respBody map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&respBody); err != nil {
		return fmt.Errorf("failed to decode response body: %w", err)
	}
	fmt.Println("Expo push notification response:", respBody)

	if resp.StatusCode >= 400 {
		return fmt.Errorf("expo api returned status: %d, response: %v", resp.StatusCode, respBody)
	}

	return nil
}
