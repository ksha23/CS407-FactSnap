package clerk

import (
	"context"
	"fmt"
	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/clerk/clerk-sdk-go/v2/jwks"
	"github.com/clerk/clerk-sdk-go/v2/jwt"
	"github.com/clerk/clerk-sdk-go/v2/user"
)

type Client interface {
	VerifyToken(ctx context.Context, token string) (string, error)
	GetUser(ctx context.Context, clerkUserID string) (*clerk.User, error)
}

type client struct {
	jwksClient *jwks.Client
}

func NewClient(secretKey string) *client {
	clerk.SetKey(secretKey)
	config := &clerk.ClientConfig{}
	config.Key = clerk.String(secretKey)
	return &client{
		jwksClient: jwks.NewClient(config),
	}
}

func (c *client) VerifyToken(ctx context.Context, token string) (string, error) {
	// decode the session JWT to find the key ID
	jwtClaims, err := jwt.Decode(ctx, &jwt.DecodeParams{Token: token})
	if err != nil {
		return "", fmt.Errorf("ClerkClient::VerifyToken: could not decode JWT token: %w", err)
	}

	// fetch the JSON Web Key (this makes API request)
	// TODO: cache the JWK for like an hour
	jwk, err := jwt.GetJSONWebKey(ctx, &jwt.GetJSONWebKeyParams{
		KeyID:      jwtClaims.KeyID,
		JWKSClient: c.jwksClient,
	})
	if err != nil {
		return "", fmt.Errorf("ClerkClient::VerifyToken: could not fetch JWK: %w", err)
	}

	// verify session (offline)
	sessionClaims, err := jwt.Verify(ctx, &jwt.VerifyParams{
		Token: token,
		JWK:   jwk,
	})
	if err != nil {
		return "", fmt.Errorf("ClerkClient::VerifyToken: could not verify session: %w", err)
	}

	// sub is the user's clerk id
	return sessionClaims.Subject, nil
}

func (c *client) GetUser(ctx context.Context, clerkUserID string) (*clerk.User, error) {
	clerkUser, err := user.Get(ctx, clerkUserID)
	if err != nil {
		return nil, fmt.Errorf("ClerkClient::GetUser: %w", err)
	}

	return clerkUser, nil
}
