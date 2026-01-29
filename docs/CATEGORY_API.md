# Category Management API Documentation

## Base URLs
- **Protected APIs (Super Admin)**: `http://localhost:3000/api/super-admin`
- **Public APIs**: `http://localhost:3000/api/public/category`

## Public Endpoints (No Authentication Required)

### 1. Get All Active Main Categories
Get all active main categories (public access).

**GET** `/api/public/category/main-categories`

**Response (200):**
```json
{
  "success": true,
  "message": "Main categories retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Education",
      "description": "Educational courses and materials",
      "image": "https://your-bucket.s3.amazonaws.com/main-category-1234567890-education.jpg",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 2. Get All Active Sub Categories
Get all active sub categories, optionally filtered by main category (public access).

**GET** `/api/public/category/sub-categories?mainCategoryId=507f1f77bcf86cd799439011`

**Query Parameters:**
- `mainCategoryId` (optional): Filter sub categories by main category ID

**Response (200):**
```json
{
  "success": true,
  "message": "Sub categories retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Mathematics",
      "description": "Math courses and tutorials",
      "image": "https://your-bucket.s3.amazonaws.com/sub-category-1234567891-mathematics.jpg",
      "mainCategory": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Education",
        "description": "Educational courses and materials",
        "image": "https://your-bucket.s3.amazonaws.com/main-category-1234567890-education.jpg"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

## Protected Endpoints (Super Admin Only - Requires Authentication)

### 3. Create Main Category
Create a new main category. (Protected - Requires Super Admin authentication)

**POST** `/api/super-admin/main-category`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `name` (required): Category name
- `description` (optional): Category description
- `image` (optional): Category image file (JPEG, PNG, GIF, WebP, max 5MB)

**Response (201):**
```json
{
  "success": true,
  "message": "Main category created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Education",
    "description": "Educational courses and materials",
    "image": "https://your-bucket.s3.amazonaws.com/main-category-1234567890-education.jpg",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 4. Get All Main Categories (Protected)
Get all main categories with optional filters. (Protected - Super Admin only)

**GET** `/api/super-admin/main-category?isActive=true`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `isActive` (optional): Filter by active status (`true` or `false`)

**Response (200):**
```json
{
  "success": true,
  "message": "Main categories retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Education",
      "description": "Educational courses and materials",
      "image": "https://your-bucket.s3.amazonaws.com/main-category-1234567890-education.jpg",
      "isActive": true,
      "createdBy": {
        "_id": "507f1f77bcf86cd799439013",
        "userId": "ADGUSUP01",
        "firstName": "Super",
        "lastName": "Admin"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 5. Get Main Category by ID (Protected)
Get a specific main category by ID. (Protected - Super Admin only)

**GET** `/api/super-admin/main-category/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Main category retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Education",
    "description": "Educational courses and materials",
    "image": "https://your-bucket.s3.amazonaws.com/main-category-1234567890-education.jpg",
    "isActive": true,
    "createdBy": {
      "_id": "507f1f77bcf86cd799439013",
      "userId": "ADGUSUP01",
      "firstName": "Super",
      "lastName": "Admin"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 6. Update Main Category (Protected)
Update an existing main category. (Protected - Super Admin only)

**PUT** `/api/super-admin/main-category/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `name` (optional): Category name
- `description` (optional): Category description
- `isActive` (optional): Active status (`true` or `false`)
- `image` (optional): New category image file (JPEG, PNG, GIF, WebP, max 5MB)

**Response (200):**
```json
{
  "success": true,
  "message": "Main category updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Updated Education",
    "description": "Updated description",
    "image": "https://your-bucket.s3.amazonaws.com/main-category-1234567892-updated-education.jpg",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

---

### 7. Delete Main Category (Protected)
Delete a main category. Cannot delete if it has sub categories. (Protected - Super Admin only)

**DELETE** `/api/super-admin/main-category/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Main category deleted successfully"
}
```

**Error Response (400) - If category has sub categories:**
```json
{
  "success": false,
  "message": "Cannot delete main category. It has 3 sub category(ies). Please delete sub categories first."
}
```

---

### 8. Create Sub Category (Protected)
Create a new sub category under a main category. (Protected - Super Admin only)

**POST** `/api/super-admin/sub-category`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `name` (required): Sub category name
- `description` (optional): Sub category description
- `mainCategoryId` (required): Main category ID
- `image` (optional): Sub category image file (JPEG, PNG, GIF, WebP, max 5MB)

**Response (201):**
```json
{
  "success": true,
  "message": "Sub category created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Mathematics",
    "description": "Math courses and tutorials",
    "image": "https://your-bucket.s3.amazonaws.com/sub-category-1234567891-mathematics.jpg",
    "mainCategory": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Education",
      "description": "Educational courses and materials",
      "image": "https://your-bucket.s3.amazonaws.com/main-category-1234567890-education.jpg"
    },
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 9. Get All Sub Categories (Protected)
Get all sub categories with optional filters. (Protected - Super Admin only)

**GET** `/api/super-admin/sub-category?mainCategoryId=507f1f77bcf86cd799439011&isActive=true`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `mainCategoryId` (optional): Filter by main category ID
- `isActive` (optional): Filter by active status (`true` or `false`)

**Response (200):**
```json
{
  "success": true,
  "message": "Sub categories retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Mathematics",
      "description": "Math courses and tutorials",
      "image": "https://your-bucket.s3.amazonaws.com/sub-category-1234567891-mathematics.jpg",
      "mainCategory": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Education",
        "description": "Educational courses and materials",
        "image": "https://your-bucket.s3.amazonaws.com/main-category-1234567890-education.jpg"
      },
      "isActive": true,
      "createdBy": {
        "_id": "507f1f77bcf86cd799439013",
        "userId": "ADGUSUP01",
        "firstName": "Super",
        "lastName": "Admin"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 10. Get Sub Category by ID (Protected)
Get a specific sub category by ID. (Protected - Super Admin only)

**GET** `/api/super-admin/sub-category/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Sub category retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Mathematics",
    "description": "Math courses and tutorials",
    "image": "https://your-bucket.s3.amazonaws.com/sub-category-1234567891-mathematics.jpg",
    "mainCategory": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Education",
      "description": "Educational courses and materials",
      "image": "https://your-bucket.s3.amazonaws.com/main-category-1234567890-education.jpg"
    },
    "isActive": true,
    "createdBy": {
      "_id": "507f1f77bcf86cd799439013",
      "userId": "ADGUSUP01",
      "firstName": "Super",
      "lastName": "Admin"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 11. Update Sub Category (Protected)
Update an existing sub category. (Protected - Super Admin only)

**PUT** `/api/super-admin/sub-category/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `name` (optional): Sub category name
- `description` (optional): Sub category description
- `mainCategoryId` (optional): Main category ID (to move sub category)
- `isActive` (optional): Active status (`true` or `false`)
- `image` (optional): New sub category image file (JPEG, PNG, GIF, WebP, max 5MB)

**Response (200):**
```json
{
  "success": true,
  "message": "Sub category updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Advanced Mathematics",
    "description": "Updated description",
    "image": "https://your-bucket.s3.amazonaws.com/sub-category-1234567892-advanced-mathematics.jpg",
    "mainCategory": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Education",
      "description": "Educational courses and materials",
      "image": "https://your-bucket.s3.amazonaws.com/main-category-1234567890-education.jpg"
    },
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

---

### 12. Delete Sub Category (Protected)
Delete a sub category. (Protected - Super Admin only)

**DELETE** `/api/super-admin/sub-category/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Sub category deleted successfully"
}
```

---

## Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Category name is required"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "No token provided. Authentication required."
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Main category not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Error creating main category",
  "error": "Detailed error message"
}
```

---

## Notes

- All images are automatically processed with Jimp (resized to 800x800px, 80% quality) before upload to S3
- Main category names must be unique across all categories
- Sub category names must be unique within the same main category
- Cannot delete a main category if it has sub categories
- Public APIs only return active categories
- Protected APIs can filter by `isActive` status

