package port

import (
	"context"
)

type NotificationService interface {
	SendPushNotification(ctx context.Context, tokens []string, title, body string, data map[string]interface{}) error
}
