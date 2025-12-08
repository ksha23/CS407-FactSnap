package s3

import (
	"fmt"
	"net/url"
	"strings"
)

// extractObjectKey returns the S3 object key from either a CDN URL or an S3 URL.
// baseURL is the CDN base, e.g. "https://d33u88xndopu36.cloudfront.net".
func extractObjectKey(rawURL string, baseURL string) (string, error) {
	u, err := url.Parse(rawURL)
	if err != nil {
		return "", fmt.Errorf("could not parse url %s: %w", rawURL, err)
	}

	// Normalize baseURL (may not include protocol)
	if baseURL != "" {
		if !strings.HasPrefix(baseURL, "http://") && !strings.HasPrefix(baseURL, "https://") {
			baseURL = "https://" + baseURL
		}
		baseURL = strings.TrimRight(baseURL, "/")
	}

	parsedBase, _ := url.Parse(baseURL)

	// --- CASE 1: URL is under CDN baseURL -----------------------------
	if baseURL != "" && parsedBase.Host != "" && u.Host == parsedBase.Host {
		// Example: https://cdn.example.com/<key>
		key := strings.TrimPrefix(u.Path, "/")
		return key, nil
	}

	// --- CASE 2: S3 virtual-hosted ------------------------------
	// Example:
	//   https://bucket.s3.us-east-2.amazonaws.com/<key>?...
	host := u.Host
	path := strings.TrimPrefix(u.Path, "/")

	if strings.Contains(host, ".s3.") || strings.HasSuffix(host, ".s3.amazonaws.com") {
		return path, nil
	}

	// --- CASE 3: S3 path-style ---------------------------------
	// Example:
	//   https://s3.us-east-2.amazonaws.com/<bucket>/<key>?...
	if host == "s3.amazonaws.com" || strings.HasPrefix(host, "s3.") {
		parts := strings.SplitN(path, "/", 2)
		if len(parts) != 2 {
			return "", fmt.Errorf("cannot extract key from path-style S3 URL: %s", rawURL)
		}
		return parts[1], nil
	}

	// --- CASE 4: Unknown host ----------
	return "", fmt.Errorf("unknown host")
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
