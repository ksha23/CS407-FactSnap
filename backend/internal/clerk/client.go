package clerk

import (
	"context"
	"fmt"
	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/clerk/clerk-sdk-go/v2/jwks"
	"github.com/clerk/clerk-sdk-go/v2/jwt"
	"github.com/clerk/clerk-sdk-go/v2/user"
	"github.com/jftuga/TtlMap"
	"time"
)

const (
	jwkCacheKey = "jwk"
)

type Client interface {
	VerifyToken(ctx context.Context, token string) (string, error)
	GetUser(ctx context.Context, clerkUserID string) (*clerk.User, error)
}

type client struct {
	jwksClient *jwks.Client
	cache      *TtlMap.TtlMap[string]
}

func NewClient(secretKey string) *client {
	clerk.SetKey(secretKey)
	config := &clerk.ClientConfig{}
	config.Key = clerk.String(secretKey)
	return &client{
		jwksClient: jwks.NewClient(config),
		// cache JWK for an hour
		cache: TtlMap.New[string](time.Hour, 1, 30*time.Minute, false),
	}
}

func (c *client) VerifyToken(ctx context.Context, token string) (string, error) {
	// decode the session JWT to find the key ID
	jwtClaims, err := jwt.Decode(ctx, &jwt.DecodeParams{Token: token})
	if err != nil {
		return "", fmt.Errorf("ClerkClient::VerifyToken: could not decode JWT token: %w", err)
	}

	// get the JSON Web Key
	jwk, err := c.getJWK(ctx, jwtClaims.KeyID)
	if err != nil {
		return "", fmt.Errorf("ClerkClient::VerifyToken: could not get JWK: %w", err)
	}

	// verify session (offline)
	sessionClaims, err := jwt.Verify(ctx, &jwt.VerifyParams{
		Token:  token,
		JWK:    jwk,
		Leeway: time.Minute * 5, // add some leeway to account for potential clock skews
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

func (c *client) getJWK(ctx context.Context, keyID string) (*clerk.JSONWebKey, error) {
	// check if in cache
	jwk, ok := c.cache.Get(jwkCacheKey).(*clerk.JSONWebKey)
	if jwk != nil {
		if ok {
			return jwk, nil
		} else {
			return nil, fmt.Errorf("getJWK: (cache hit) could not cast to type")
		}
	}

	// if reached here, then it is not in cache
	// fetch the JSON Web Key (this makes API request)
	jwk, err := jwt.GetJSONWebKey(ctx, &jwt.GetJSONWebKeyParams{
		KeyID:      keyID,
		JWKSClient: c.jwksClient,
	})
	if err != nil {
		return nil, fmt.Errorf("getJWK: (cache miss) could not fetch JWK from Clerk: %w", err)
	}

	// put in cache
	c.cache.Put(jwkCacheKey, jwk)

	return jwk, nil
}
