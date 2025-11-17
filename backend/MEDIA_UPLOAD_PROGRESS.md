# Media Upload Implementation Progress

## Summary
Successfully implemented and tested media upload functionality with Clerk authentication and AWS S3 storage. The system allows authenticated users to upload images and videos to S3, with presigned URLs for secure access.

## What Was Implemented

### 1. Authentication Flow
- **Clerk Integration**: All media endpoints are protected by Clerk authentication middleware
- **User Identification**: Uploaded files are associated with the authenticated user's Clerk ID
- **Token Verification**: JWT tokens from Clerk are verified before allowing uploads

### 2. S3 Storage Integration
- **AWS S3 Client**: Implemented using `aws-sdk-go-v2`
- **File Upload**: Files are uploaded directly to S3 with metadata (filename, uploader, mime type)
- **Presigned URLs**: Generated presigned URLs for secure, time-limited access to uploaded files
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
- **Response**:
  ```json
  {
    "asset": {
      "key": "uploads/user_34jhcthdrx7sydqax1hrsbfsndr/20251117T045303Z-4ed1671f96fe496dab3af8f9ed268379-test.png",
      "url": "https://factsnap407.s3.us-east-2.amazonaws.com/...",
      "urlExpiresAt": "2025-11-16T23:08:03.412954-06:00",
      "fileName": "test.png",
      "mimeType": "image/png",
      "size": 180534,
      "provider": "aws-s3",
      "uploader": "user_34jHCTHdRX7sydqax1hRsBFsnDR"
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
7. Presigned URL is generated (default: 15 minutes validity)
8. Response includes file key and presigned URL

### Access Flow
1. Client requests file using stored `key`
2. Server verifies authentication
3. New presigned URL is generated (refreshes expiration)
4. Client uses presigned URL to access file from S3

## Configuration

### Environment Variables
Required in `.env`:
```bash
S3_BUCKET=your-bucket-name
S3_REGION=us-east-2
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_PRESIGN_DURATION=24h
```

### Presigned URL Duration
- **Current**: 15 minutes (default)
- **Configurable**: Can be set via `S3_PRESIGN_DURATION` env var
- **Maximum**: 7 days (AWS S3 limit)
- **Recommendation**: 
  - Public images: 24h - 7d
  - General media: 1h - 24h
  - Sensitive files: 15m - 1h

## Security Considerations

1. **Authentication Required**: All endpoints require valid Clerk JWT tokens
2. **User Isolation**: Files are organized by user ID, preventing unauthorized access
3. **Presigned URLs**: Time-limited access prevents permanent URL sharing
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

- Presigned URL expiration can be adjusted based on use case
- Files are automatically organized by uploader ID
- All endpoints require Clerk authentication
- Maximum file size: 25MB (configurable in code)

