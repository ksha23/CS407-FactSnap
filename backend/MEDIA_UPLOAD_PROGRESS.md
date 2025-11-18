# Media Upload Implementation Progress

## Summary
Successfully implemented and tested media upload functionality with Clerk authentication and AWS S3 storage. The system allows authenticated users to upload images and videos to S3, with support for both permanent CDN URLs and presigned URLs for secure access.

## What Was Implemented

### 1. Authentication Flow
- **Clerk Integration**: All media endpoints are protected by Clerk authentication middleware
- **User Identification**: Uploaded files are associated with the authenticated user's Clerk ID
- **Token Verification**: JWT tokens from Clerk are verified before allowing uploads

### 2. S3 Storage Integration
- **AWS S3 Client**: Implemented using `aws-sdk-go-v2`
- **File Upload**: Files are uploaded directly to S3 with metadata (filename, uploader, mime type)
- **Permanent URLs**: Returns permanent CDN URLs when `S3_CDN_BASE_URL` is configured (recommended for DB storage)
- **Presigned URLs**: Falls back to presigned URLs when CDN is not configured (time-limited access)
- **File Organization**: Files are organized by uploader ID in the S3 bucket structure:
  ```
  uploads/{user_id}/{timestamp}-{uuid}-{filename}
  ```

### 3. API Endpoints
- `POST /api/media/upload` - Upload a file (requires authentication)
- `GET /api/media/:key` - Get presigned URL for a file (requires authentication)
- `DELETE /api/media/:key` - Delete a file (requires authentication)

## Test Results

### Successful Test Case
- **User**: Dummy user (`user_34jHCTHdRX7sydqax1hRsBFsnDR`)
- **File**: `test.png` (180KB)
- **Result**: Successfully uploaded to S3

**With CDN (Permanent URL):**
```json
{
  "asset": {
    "key": "uploads/user_34jhcthdrx7sydqax1hrsbfsndr/20251118T051315Z-dde75a2354324391a76ad52667eb19b1-test.png",
    "url": "https://d33u88xndopu36.cloudfront.net/uploads/user_34jhcthdrx7sydqax1hrsbfsndr/20251118T051315Z-dde75a2354324391a76ad52667eb19b1-test.png",
    "urlExpiresAt": "0001-01-01T00:00:00Z",
    "fileName": "test.png",
    "mimeType": "image/png",
    "size": 180534,
    "provider": "aws-s3",
    "uploader": "user_34jHCTHdRX7sydqax1hRsBFsnDR"
  }
}
```
*Note: `urlExpiresAt` is empty (zero time) for permanent URLs*

**Without CDN (Presigned URL):**
```json
{
  "asset": {
    "key": "uploads/user_34jhcthdrx7sydqax1hrsbfsndr/...",
    "url": "https://factsnap407.s3.us-east-2.amazonaws.com/...?X-Amz-Algorithm=...",
    "urlExpiresAt": "2025-11-18T22:58:20.699761-06:00",
    ...
  }
}
```

## How It Works

### Upload Flow
1. Client sends file with Clerk JWT token in `Authorization: Bearer {token}` header
2. Server verifies token using Clerk SDK
3. File is read into memory (max 25MB)
4. File metadata is extracted (filename, mime type, size)
5. S3 object key is generated: `uploads/{user_id}/{timestamp}-{uuid}-{filename}`
6. File is uploaded to S3 with metadata
7. URL is generated:
   - **If CDN Base URL is configured**: Permanent URL (e.g., `https://cdn.com/uploads/...`)
   - **If CDN is not configured**: Presigned URL (default: 24h validity)
8. Response includes file key and URL (permanent or presigned)

### Access Flow
1. Client requests file using stored `key`
2. Server verifies authentication
3. URL is generated:
   - **If CDN Base URL is configured**: Permanent URL (same URL every time)
   - **If CDN is not configured**: New presigned URL (refreshes expiration)
4. Client uses URL to access file from S3/CDN

## Configuration

### Environment Variables
Required in `.env`:
```bash
S3_BUCKET=your-bucket-name
S3_REGION=us-east-2
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_PRESIGN_DURATION=24h  # Only used when CDN is not configured
S3_CDN_BASE_URL=https://d33u88xndopu36.cloudfront.net  # Optional: for permanent URLs
```

### URL Types

**Permanent URLs (Recommended for DB storage):**
- **When**: `S3_CDN_BASE_URL` is configured
- **Format**: `https://your-cdn.com/uploads/...`
- **Expiration**: Never expires
- **Use Case**: Store directly in database
- **Example**: CloudFront, custom CDN domain

**Presigned URLs (Fallback):**
- **When**: `S3_CDN_BASE_URL` is not configured
- **Format**: `https://bucket.s3.region.amazonaws.com/...?X-Amz-...`
- **Expiration**: Configurable via `S3_PRESIGN_DURATION` (default: 24h)
- **Maximum**: 7 days (AWS S3 limit)
- **Use Case**: Temporary access, CDN not available
- **Recommendation**: 
  - Public images: 24h - 7d
  - General media: 1h - 24h
  - Sensitive files: 15m - 1h

## Database Storage

### Recommended Approach
- **Store the `url` field** directly in your database when using CDN (permanent URL)
- **Or store the `key`** and fetch fresh URLs via `GET /api/media/:key` when needed
- **Don't store presigned URLs** - they expire and become invalid

### URL Field Behavior
- **With CDN**: `url` is permanent, `urlExpiresAt` is empty (zero time)
- **Without CDN**: `url` is presigned, `urlExpiresAt` contains expiration time

## Security Considerations

1. **Authentication Required**: All endpoints require valid Clerk JWT tokens
2. **User Isolation**: Files are organized by user ID, preventing unauthorized access
3. **URL Security**:
   - **CDN URLs**: Can be made public or protected via CloudFront policies
   - **Presigned URLs**: Time-limited access prevents permanent URL sharing
4. **File Size Limit**: 25MB maximum upload size
5. **MIME Type Validation**: Content type is detected and stored

## Testing

### Get Clerk Token for Testing
```bash
# 1. Create session
curl -X POST https://api.clerk.com/v1/sessions \
  -H "Authorization: Bearer YOUR_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user_34jHCTHd..."}'

# 2. Get JWT token
curl -X POST "https://api.clerk.com/v1/sessions/{session_id_that_you_just_got}/tokens" \
  -H "Authorization: Bearer sk_test_Ocmlza9q4WnOmCfm0IlRh9nYExl3PVMLS8euICcdgq" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Upload Test
```bash
# Save your CLERK_SESSION_TOKEN for convenience
export CLERK_SESSION_TOKEN="eyJhbG..."

curl -X POST "http://localhost:8080/api/media/upload" \
  -H "Authorization: Bearer $CLERK_SESSION_TOKEN" \
  -F "file=@/path/to/test.png"

# Check server to ensure upload
```

## Files Modified/Created

- `backend/internal/storage/s3media/client.go` - S3 client implementation
- `backend/internal/adapter/ginhttp/media_handler.go` - HTTP handlers
- `backend/internal/core/service/media_service.go` - Business logic
- `backend/internal/config/config.go` - Environment variable handling
- `backend/config/local.yaml` - Configuration template

## Notes

- **Permanent URLs**: Set `S3_CDN_BASE_URL` to get permanent URLs suitable for database storage
- **Presigned URLs**: Used as fallback when CDN is not configured; expiration can be adjusted via `S3_PRESIGN_DURATION`
- Files are automatically organized by uploader ID
- All endpoints require Clerk authentication
- Maximum file size: 25MB (configurable in code)
- CDN URL protocol (`https://`) is automatically added if missing in configuration

