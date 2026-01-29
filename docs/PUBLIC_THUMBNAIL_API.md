# Public Thumbnail API Documentation

## Base URL
```
http://localhost:3000/api/public/thumbnails
```

## Overview
Public API endpoints for retrieving thumbnails. **No authentication required.**

---

## Endpoints

### 1. Get All Thumbnails
Get all active thumbnails for public display. No authentication required.

**GET** `/`

**Query Parameters:**
- `sortBy` (optional): Sort field (default: `order`)
- `sortOrder` (optional): Sort order (`asc`/`desc`, default: `asc`)

**Response (200):**
```json
{
  "success": true,
  "message": "Thumbnails retrieved successfully",
  "data": {
    "thumbnails": [
      {
        "_id": "507f1f77bcf86cd799439020",
        "title": "Mathematics Thumbnail",
        "image": "https://your-bucket.s3.amazonaws.com/thumbnails/1234567890-mathematics-thumbnail.jpg",
        "description": "Mathematics category thumbnail",
        "order": 1,
        "createdAt": "2024-01-15T10:30:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439021",
        "title": "Science Thumbnail",
        "image": "https://your-bucket.s3.amazonaws.com/thumbnails/1234567891-science-thumbnail.jpg",
        "description": "Science category thumbnail",
        "order": 2,
        "createdAt": "2024-01-15T10:35:00.000Z"
      }
    ],
    "count": 2
  }
}
```

**Note:**
- Only returns active thumbnails (`isActive: true`)
- No authentication required
- Images are stored in S3 and URLs are returned directly

---

### 2. Get Thumbnail by ID
Get a specific thumbnail by ID. No authentication required.

**GET** `/:id`

**Parameters:**
- `id` (path): Thumbnail MongoDB `_id`

**Response (200):**
```json
{
  "success": true,
  "message": "Thumbnail retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "title": "Mathematics Thumbnail",
    "image": "https://your-bucket.s3.amazonaws.com/thumbnails/1234567890-mathematics-thumbnail.jpg",
    "description": "Mathematics category thumbnail",
    "order": 1,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Response (404):**
```json
{
  "success": false,
  "message": "Thumbnail not found or inactive"
}
```

**Note:**
- Only returns active thumbnails
- No authentication required
- Returns 404 if thumbnail is inactive or doesn't exist

---

## Error Responses

**404 Not Found:**
```json
{
  "success": false,
  "message": "Thumbnail not found or inactive"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Error retrieving thumbnails",
  "error": "Detailed error message"
}
```

---

## Notes

- All endpoints are public and require no authentication
- Only active thumbnails are returned
- Images are automatically processed and optimized before upload to S3:
  - Resized to maximum 600x600px (maintaining aspect ratio)
  - Quality reduced to 60% for smaller file size and faster loading
  - Converted to JPEG format for consistency
- Supported input formats: JPEG, PNG, GIF, WebP (all converted to JPEG)
- Maximum file size: 5MB (before processing)
- Images are stored in S3 under the `thumbnails/` folder
- Thumbnails can be ordered using the `order` field for custom display sequence
- All thumbnails are stored as JPEG format regardless of original format for optimal performance
