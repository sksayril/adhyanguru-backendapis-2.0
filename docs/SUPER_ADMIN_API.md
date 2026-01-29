# Super Admin API Documentation

## Base URL
```
http://localhost:3000/api/super-admin
```

## Endpoints

### 1. Signup
Create a new Super Admin account.

**POST** `/signup`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `email` (required): Email address
- `mobileNumber` (required): Mobile number
- `password` (required): Password
- `firstName` (required): First name
- `lastName` (required): Last name
- `profilePicture` (optional): Profile picture file (JPEG, PNG, GIF, WebP, max 5MB)

**Request Example (JSON for reference):**
```json
{
  "email": "superadmin@example.com",
  "mobileNumber": "1234567890",
  "password": "password123",
  "firstName": "Super",
  "lastName": "Admin"
}
```

**Note:** When uploading profile picture, use `multipart/form-data` instead of JSON.

**Response (201):**
```json
{
  "success": true,
  "message": "Super Admin created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "ADGUSUP01",
    "email": "superadmin@example.com",
    "mobileNumber": "1234567890",
    "firstName": "Super",
    "lastName": "Admin",
    "role": "SUPER_ADMIN",
    "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-superadmin-ADGUSUP01.jpg",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 2. Login
Login with email, mobile number, or user ID.

**POST** `/login`

**Request Body:**
```json
{
  "identifier": "superadmin@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "ADGUSUP01",
      "email": "superadmin@example.com",
      "mobileNumber": "1234567890",
      "firstName": "Super",
      "lastName": "Admin",
      "role": "SUPER_ADMIN",
      "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-superadmin-ADGUSUP01.jpg",
      "latitude": 28.6139,
      "longitude": 77.2090
    }
  }
}
```

---

### 3. Logout
Logout from the system. Note: Since JWT tokens are stateless, the client should remove the token from storage after logout.

**POST** `/logout`

**Request Body:**
```json
{}
```

**Note:** No authentication required. The client should delete the token from local storage/session after receiving success response.

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### 4. Create Admin
Create a new Admin user. (Protected - Requires Super Admin authentication)

**POST** `/create-admin`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `email` (required): Email address
- `mobileNumber` (required): Mobile number
- `password` (required): Password
- `firstName` (required): First name
- `lastName` (required): Last name
- `profilePicture` (optional): Profile picture file (JPEG, PNG, GIF, WebP, max 5MB)
- `latitude` (optional): Latitude coordinate (decimal number)
- `longitude` (optional): Longitude coordinate (decimal number)

**Response (201):**
```json
{
  "success": true,
  "message": "Admin created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": "ADGUADM01",
    "email": "admin@example.com",
    "mobileNumber": "1234567891",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN",
    "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-admin-ADGUADM01.jpg",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "createdBy": "507f1f77bcf86cd799439011",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 5. Create Any Downline User (Protected)
Create any downline user type. Super Admin can create: Admin, District Coordinator, Coordinator, Field Manager, Team Leader, Field Employee.

**POST** `/create-user`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `userType` (required): ADMIN, DISTRICT_COORDINATOR, COORDINATOR, FIELD_MANAGER, TEAM_LEADER, FIELD_EMPLOYEE
- `email` (required): Email address
- `mobileNumber` (required): Mobile number
- `password` (required): Password
- `firstName` (required): First name
- `lastName` (required): Last name
- `district` (required for all except ADMIN): District name
- `profilePicture` (optional): Profile picture file (JPEG, PNG, GIF, WebP, max 5MB)
- `latitude` (optional): Latitude coordinate (decimal number)
- `longitude` (optional): Longitude coordinate (decimal number)

**Response (201):**
```json
{
  "success": true,
  "message": "ADMIN created successfully",
  "data": {
    "_id": "...",
    "userId": "ADGUADM01",
    "email": "user@example.com",
    "mobileNumber": "1234567891",
    "firstName": "First",
    "lastName": "Last",
    "role": "ADMIN",
    "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-admin-ADGUADM01.jpg",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "createdBy": "...",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Note:** 
- User IDs are auto-generated based on user type
- District is required for all user types except ADMIN
- Profile pictures are automatically optimized (resized to 800x800px, 80% quality) before upload

---

### 6. Get All Users
Get all users in the system. (Protected - Super Admin only)

**GET** `/all-users`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "All users retrieved successfully",
  "data": [
    {
      "_id": "...",
      "userId": "ADGUSUP01",
      "email": "...",
      "role": "SUPER_ADMIN"
    },
    {
      "_id": "...",
      "userId": "ADGUADM01",
      "email": "...",
      "role": "ADMIN"
    }
  ],
  "count": 10
}
```

---

### 7. Get User Details
Get user details with optional decrypted password. (Protected - Super Admin only)

**GET** `/user/:userId?includePassword=true`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `includePassword` (optional): Set to `true` to include decrypted password

**Response (200):**
```json
{
  "success": true,
  "message": "User details retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "ADGUSUP01",
    "email": "superadmin@example.com",
    "mobileNumber": "1234567890",
    "firstName": "Super",
    "lastName": "Admin",
    "role": "SUPER_ADMIN",
    "isActive": true,
    "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-superadmin-ADGUSUP01.jpg",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "password": "password123",
    "encryptedPassword": "U2FsdGVkX1..."
  }
}
```

---

## Setup Requirements

### Environment Variables

Add these to your `.env` file:

```env
# Database
DATABASE_URL=mongodb://localhost:27017/adhyanguru

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ENCRYPTION_KEY=your-encryption-secret-key-change-this-in-production

# AWS S3 Configuration (for profile pictures)
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-s3-bucket-name

# Server
PORT=3000
```

### AWS S3 Setup

1. Create an S3 bucket in AWS
2. Configure bucket permissions for public read access
3. Create IAM user with S3 permissions
4. Add credentials to `.env` file

See `PROFILE_PICTURE_UPLOAD.md` for detailed S3 setup instructions.

---

## Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "User already exists with this email or mobile number"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "You don't have permission to create ADMIN"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "User not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Error creating super admin",
  "error": "Detailed error message"
}
```

---

## Subject Management APIs

### 13. Create Subject
Create a new subject under a main category and sub category. (Protected - Super Admin only)

**POST** `/api/super-admin/subject`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `title` (required): Subject title
- `description` (optional): Subject description
- `mainCategoryId` (required): Main category ID
- `subCategoryId` (required): Sub category ID
- `boardId` (optional): Board ID (optional - can be assigned later)
- `thumbnail` (optional): Subject thumbnail image file (JPEG, PNG, GIF, WebP, max 5MB)

**Response (201):**
```json
{
  "success": true,
  "message": "Subject created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "title": "Mathematics Fundamentals",
    "description": "Basic mathematics concepts",
    "thumbnail": "https://your-bucket.s3.amazonaws.com/subject-thumbnail-1234567892-mathematics-fundamentals.jpg",
    "mainCategory": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Education",
      "description": "Educational courses and materials",
      "image": "https://your-bucket.s3.amazonaws.com/main-category-1234567890-education.jpg"
    },
    "subCategory": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Mathematics",
      "description": "Math courses and tutorials",
      "image": "https://your-bucket.s3.amazonaws.com/sub-category-1234567891-mathematics.jpg"
    },
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 14. Get All Subjects
Get all subjects with optional filters. (Protected - Super Admin only)

**GET** `/api/super-admin/subject?mainCategoryId=xxx&subCategoryId=xxx&isActive=true`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `mainCategoryId` (optional): Filter by main category ID
- `subCategoryId` (optional): Filter by sub category ID
- `isActive` (optional): Filter by active status (`true` or `false`)

**Response (200):**
```json
{
  "success": true,
  "message": "Subjects retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "title": "Mathematics Fundamentals",
      "description": "Basic mathematics concepts",
      "thumbnail": "https://your-bucket.s3.amazonaws.com/subject-thumbnail-1234567892-mathematics-fundamentals.jpg",
      "mainCategory": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Education",
        "description": "Educational courses and materials",
        "image": "https://your-bucket.s3.amazonaws.com/main-category-1234567890-education.jpg"
      },
      "subCategory": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Mathematics",
        "description": "Math courses and tutorials",
        "image": "https://your-bucket.s3.amazonaws.com/sub-category-1234567891-mathematics.jpg"
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

### 15. Get Subject by ID
Get a specific subject by ID with its chapters. (Protected - Super Admin only)

**GET** `/api/super-admin/subject/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Subject retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "title": "Mathematics Fundamentals",
    "description": "Basic mathematics concepts",
    "thumbnail": "https://your-bucket.s3.amazonaws.com/subject-thumbnail-1234567892-mathematics-fundamentals.jpg",
    "mainCategory": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Education",
      "description": "Educational courses and materials",
      "image": "https://your-bucket.s3.amazonaws.com/main-category-1234567890-education.jpg"
    },
    "subCategory": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Mathematics",
      "description": "Math courses and tutorials",
      "image": "https://your-bucket.s3.amazonaws.com/sub-category-1234567891-mathematics.jpg"
    },
    "board": null,
    "isActive": true,
    "createdBy": {
      "_id": "507f1f77bcf86cd799439013",
      "userId": "ADGUSUP01",
      "firstName": "Super",
      "lastName": "Admin"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "chapters": [
      {
        "_id": "507f1f77bcf86cd799439015",
        "title": "Introduction to Algebra",
        "description": "Basic algebra concepts",
        "order": 1,
        "content": {
          "text": "# Introduction\n\nThis chapter covers basic algebra...",
          "pdf": null,
          "video": null
        },
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

### 16. Update Subject
Update an existing subject. (Protected - Super Admin only)

**PUT** `/api/super-admin/subject/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `title` (optional): Subject title
- `description` (optional): Subject description
- `mainCategoryId` (optional): Main category ID
- `subCategoryId` (optional): Sub category ID
- `boardId` (optional): Board ID - Set to assign/update board, set to `null` or empty string to remove board assignment
- `isActive` (optional): Active status (`true` or `false`)
- `thumbnail` (optional): New thumbnail image file (JPEG, PNG, GIF, WebP, max 5MB)

**Response (200):**
```json
{
  "success": true,
  "message": "Subject updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "title": "Updated Mathematics Fundamentals",
    "description": "Updated description",
    "thumbnail": "https://your-bucket.s3.amazonaws.com/subject-thumbnail-1234567893-updated-mathematics-fundamentals.jpg",
    "mainCategory": {...},
    "subCategory": {...},
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

---

### 17. Delete Subject
Delete a subject. Cannot delete if it has chapters. (Protected - Super Admin only)

**DELETE** `/api/super-admin/subject/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Subject deleted successfully"
}
```

**Error Response (400) - If subject has chapters:**
```json
{
  "success": false,
  "message": "Cannot delete subject. It has 5 chapter(s). Please delete chapters first."
}
```

---

## Chapter Management APIs

### 18. Create Chapter
Create a new chapter for a subject. Supports text (markdown), PDF, and video content. (Protected - Super Admin only)

**POST** `/api/super-admin/chapter`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `title` (required): Chapter title
- `description` (optional): Chapter description
- `subjectId` (required): Subject ID
- `order` (optional): Chapter order number (auto-assigned if not provided)
- `textContent` (optional): Markdown text content
- `pdf` (optional): PDF file (max 50MB)
- `video` (optional): Video file (max 500MB)

**Response (201):**
```json
{
  "success": true,
  "message": "Chapter created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "title": "Introduction to Algebra",
    "description": "Basic algebra concepts",
    "subject": {
      "_id": "507f1f77bcf86cd799439014",
      "title": "Mathematics Fundamentals",
      "description": "Basic mathematics concepts",
      "thumbnail": "https://your-bucket.s3.amazonaws.com/subject-thumbnail-1234567892-mathematics-fundamentals.jpg"
    },
    "order": 1,
    "content": {
      "text": "# Introduction\n\nThis chapter covers basic algebra concepts...",
      "pdf": {
        "url": "https://your-bucket.s3.amazonaws.com/chapter-pdf-1234567894-introduction-to-algebra.pdf",
        "fileName": "algebra-intro.pdf"
      },
      "video": {
        "url": "https://your-bucket.s3.amazonaws.com/chapter-video-1234567895-introduction-to-algebra.mp4",
        "fileName": "algebra-intro.mp4"
      }
    },
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 19. Get Chapters by Subject
Get all chapters for a specific subject. (Protected - Super Admin only)

**GET** `/api/super-admin/chapter/subject/:subjectId?isActive=true`

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
  "message": "Chapters retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "title": "Introduction to Algebra",
      "description": "Basic algebra concepts",
      "order": 1,
      "content": {
        "text": "# Introduction\n\nThis chapter covers basic algebra...",
        "pdf": {
          "url": "https://your-bucket.s3.amazonaws.com/chapter-pdf-1234567894-introduction-to-algebra.pdf",
          "fileName": "algebra-intro.pdf"
        },
        "video": {
          "url": "https://your-bucket.s3.amazonaws.com/chapter-video-1234567895-introduction-to-algebra.mp4",
          "fileName": "algebra-intro.mp4"
        }
      },
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 20. Get Chapter by ID
Get a specific chapter by ID. (Protected - Super Admin only)

**GET** `/api/super-admin/chapter/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Chapter retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "title": "Introduction to Algebra",
    "description": "Basic algebra concepts",
    "subject": {
      "_id": "507f1f77bcf86cd799439014",
      "title": "Mathematics Fundamentals",
      "description": "Basic mathematics concepts",
      "thumbnail": "https://your-bucket.s3.amazonaws.com/subject-thumbnail-1234567892-mathematics-fundamentals.jpg",
      "mainCategory": {...},
      "subCategory": {...}
    },
    "order": 1,
    "content": {
      "text": "# Introduction\n\nThis chapter covers basic algebra...",
      "pdf": {
        "url": "https://your-bucket.s3.amazonaws.com/chapter-pdf-1234567894-introduction-to-algebra.pdf",
        "fileName": "algebra-intro.pdf"
      },
      "video": {
        "url": "https://your-bucket.s3.amazonaws.com/chapter-video-1234567895-introduction-to-algebra.mp4",
        "fileName": "algebra-intro.mp4"
      }
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

### 21. Update Chapter
Update an existing chapter. (Protected - Super Admin only)

**PUT** `/api/super-admin/chapter/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `title` (optional): Chapter title
- `description` (optional): Chapter description
- `order` (optional): Chapter order number
- `textContent` (optional): Markdown text content
- `isActive` (optional): Active status (`true` or `false`)
- `pdf` (optional): New PDF file (max 50MB) - replaces existing PDF
- `video` (optional): New video file (max 500MB) - replaces existing video

**Response (200):**
```json
{
  "success": true,
  "message": "Chapter updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "title": "Updated Introduction to Algebra",
    "description": "Updated description",
    "order": 1,
    "content": {
      "text": "# Updated Introduction\n\nUpdated content...",
      "pdf": {...},
      "video": {...}
    },
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

---

### 22. Delete Chapter
Delete a chapter. (Protected - Super Admin only)

**DELETE** `/api/super-admin/chapter/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Chapter deleted successfully"
}
```

---

## Notes

- Subject thumbnails are automatically processed with Jimp (resized to 800x800px, 80% quality) before upload to S3
- Chapter text content should be in Markdown format
- PDF files are limited to 50MB
- Video files are limited to 500MB
- Chapters are automatically ordered if order is not provided
- Cannot delete a subject if it has chapters
- All file uploads (PDF, video) are stored in AWS S3

---

## Board Management APIs

### 23. Create Board
Create a new board. (Protected - Super Admin only)

**POST** `/api/super-admin/board`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "CBSE",
  "description": "Central Board of Secondary Education",
  "code": "CBSE"
}
```

**Form Data:**
- `name` (required): Board name
- `description` (optional): Board description
- `code` (optional): Board code (unique identifier)

**Response (201):**
```json
{
  "success": true,
  "message": "Board created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439016",
    "name": "CBSE",
    "description": "Central Board of Secondary Education",
    "code": "CBSE",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 24. Get All Boards
Get all boards with optional filters. (Protected - Super Admin only)

**GET** `/api/super-admin/board?isActive=true`

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
  "message": "Boards retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439016",
      "name": "CBSE",
      "description": "Central Board of Secondary Education",
      "code": "CBSE",
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

### 25. Get Board by ID
Get a specific board by ID. (Protected - Super Admin only)

**GET** `/api/super-admin/board/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Board retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439016",
    "name": "CBSE",
    "description": "Central Board of Secondary Education",
    "code": "CBSE",
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

### 26. Update Board
Update an existing board. (Protected - Super Admin only)

**PUT** `/api/super-admin/board/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Updated CBSE",
  "description": "Updated description",
  "code": "CBSE-UPDATED",
  "isActive": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Board updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439016",
    "name": "Updated CBSE",
    "description": "Updated description",
    "code": "CBSE-UPDATED",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

---

### 27. Delete Board
Delete a board. Cannot delete if it is assigned to any subjects. (Protected - Super Admin only)

**DELETE** `/api/super-admin/board/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Board deleted successfully"
}
```

**Error Response (400) - If board is assigned to subjects:**
```json
{
  "success": false,
  "message": "Cannot delete board. It is assigned to 5 subject(s). Please remove board assignment from subjects first."
}
```

---

## Updated Subject APIs

### Updated: Create Subject
The create subject endpoint now supports optional board assignment.

**POST** `/api/super-admin/subject`

**Form Data:**
- `title` (required): Subject title
- `description` (optional): Subject description
- `mainCategoryId` (required): Main category ID
- `subCategoryId` (required): Sub category ID
- `boardId` (optional): Board ID
- `thumbnail` (optional): Subject thumbnail image file

**Response now includes board:**
```json
{
  "success": true,
  "message": "Subject created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "title": "Mathematics Fundamentals",
    "description": "Basic mathematics concepts",
    "thumbnail": "...",
    "mainCategory": {...},
    "subCategory": {...},
    "board": {
      "_id": "507f1f77bcf86cd799439016",
      "name": "CBSE",
      "description": "Central Board of Secondary Education",
      "code": "CBSE"
    },
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Updated: Get All Subjects
The get all subjects endpoint now supports filtering by board.

**GET** `/api/super-admin/subject?boardId=xxx&mainCategoryId=xxx&subCategoryId=xxx&isActive=true`

**Query Parameters:**
- `boardId` (optional): Filter by board ID
- `mainCategoryId` (optional): Filter by main category ID
- `subCategoryId` (optional): Filter by sub category ID
- `isActive` (optional): Filter by active status

### Updated: Update Subject
The update subject endpoint now supports updating board assignment.

**PUT** `/api/super-admin/subject/:id`

**Form Data:**
- `boardId` (optional): Board ID - Set to assign/update board, set to `null` or empty string `""` to remove board assignment

**Examples:**
- To assign a board: `boardId: "507f1f77bcf86cd799439016"`
- To remove board assignment: `boardId: null` or `boardId: ""`
- To keep existing board: Omit `boardId` field

---

## Plan Management APIs

### 28. Create Plan
Create a new plan for a sub category. (Protected - Super Admin only)

**POST** `/api/super-admin/plan`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "subCategoryId": "507f1f77bcf86cd799439012",
  "duration": "1_MONTH",
  "amount": 999,
  "description": "1 month subscription plan"
}
```

**Request Body Fields:**
- `subCategoryId` (required): Sub category ID
- `duration` (required): Plan duration - `1_MONTH`, `3_MONTHS`, `6_MONTHS`, or `1_YEAR`
- `amount` (required): Plan amount (number, must be >= 0)
- `description` (optional): Plan description

**Response (201):**
```json
{
  "success": true,
  "message": "Plan created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439017",
    "subCategory": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Mathematics",
      "description": "Math courses and tutorials",
      "image": "https://your-bucket.s3.amazonaws.com/sub-category-1234567891-mathematics.jpg",
      "mainCategory": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Education"
      }
    },
    "duration": "1_MONTH",
    "amount": 999,
    "description": "1 month subscription plan",
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

### 29. Create Multiple Plans
Create multiple plans for a sub category at once (1 month, 3 months, 6 months, 1 year). (Protected - Super Admin only)

**POST** `/api/super-admin/plan/multiple`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "subCategoryId": "507f1f77bcf86cd799439012",
  "plans": [
    {
      "duration": "1_MONTH",
      "amount": 999,
      "description": "1 month subscription plan"
    },
    {
      "duration": "3_MONTHS",
      "amount": 2499,
      "description": "3 months subscription plan"
    },
    {
      "duration": "6_MONTHS",
      "amount": 4499,
      "description": "6 months subscription plan"
    },
    {
      "duration": "1_YEAR",
      "amount": 7999,
      "description": "1 year subscription plan"
    }
  ]
}
```

**Request Body Fields:**
- `subCategoryId` (required): Sub category ID
- `plans` (required): Array of plan objects, each with:
  - `duration` (required): `1_MONTH`, `3_MONTHS`, `6_MONTHS`, or `1_YEAR`
  - `amount` (required): Plan amount (number, must be >= 0)
  - `description` (optional): Plan description

**Response (201):**
```json
{
  "success": true,
  "message": "Successfully created 4 plan(s)",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439017",
      "subCategory": {...},
      "duration": "1_MONTH",
      "amount": 999,
      "description": "1 month subscription plan",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439018",
      "subCategory": {...},
      "duration": "3_MONTHS",
      "amount": 2499,
      "description": "3 months subscription plan",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439019",
      "subCategory": {...},
      "duration": "6_MONTHS",
      "amount": 4499,
      "description": "6 months subscription plan",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439020",
      "subCategory": {...},
      "duration": "1_YEAR",
      "amount": 7999,
      "description": "1 year subscription plan",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 4
}
```

---

### 30. Get All Plans
Get all plans with optional filters. (Protected - Super Admin only)

**GET** `/api/super-admin/plan?subCategoryId=xxx&duration=1_MONTH&isActive=true`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `subCategoryId` (optional): Filter by sub category ID
- `duration` (optional): Filter by duration (`1_MONTH`, `3_MONTHS`, `6_MONTHS`, `1_YEAR`)
- `isActive` (optional): Filter by active status (`true` or `false`)

**Response (200):**
```json
{
  "success": true,
  "message": "Plans retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439017",
      "subCategory": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Mathematics",
        "description": "Math courses and tutorials",
        "image": "https://your-bucket.s3.amazonaws.com/sub-category-1234567891-mathematics.jpg",
        "mainCategory": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Education"
        }
      },
      "duration": "1_MONTH",
      "amount": 999,
      "description": "1 month subscription plan",
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

### 31. Get Plans by Sub Category
Get all plans for a specific sub category. (Protected - Super Admin only)

**GET** `/api/super-admin/plan/sub-category/:subCategoryId?isActive=true`

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
  "message": "Plans retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439017",
      "subCategory": {...},
      "duration": "1_MONTH",
      "amount": 999,
      "description": "1 month subscription plan",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439018",
      "subCategory": {...},
      "duration": "3_MONTHS",
      "amount": 2499,
      "description": "3 months subscription plan",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439019",
      "subCategory": {...},
      "duration": "6_MONTHS",
      "amount": 4499,
      "description": "6 months subscription plan",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439020",
      "subCategory": {...},
      "duration": "1_YEAR",
      "amount": 7999,
      "description": "1 year subscription plan",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 4
}
```

---

### 32. Get Plan by ID
Get a specific plan by ID. (Protected - Super Admin only)

**GET** `/api/super-admin/plan/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Plan retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439017",
    "subCategory": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Mathematics",
      "description": "Math courses and tutorials",
      "image": "https://your-bucket.s3.amazonaws.com/sub-category-1234567891-mathematics.jpg",
      "mainCategory": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Education"
      }
    },
    "duration": "1_MONTH",
    "amount": 999,
    "description": "1 month subscription plan",
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

### 33. Update Plan
Update an existing plan. (Protected - Super Admin only)

**PUT** `/api/super-admin/plan/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "duration": "1_MONTH",
  "amount": 1299,
  "description": "Updated 1 month subscription plan",
  "isActive": true
}
```

**Request Body Fields:**
- `duration` (optional): Plan duration - `1_MONTH`, `3_MONTHS`, `6_MONTHS`, or `1_YEAR`
- `amount` (optional): Plan amount (number, must be >= 0)
- `description` (optional): Plan description
- `isActive` (optional): Active status (`true` or `false`)

**Response (200):**
```json
{
  "success": true,
  "message": "Plan updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439017",
    "subCategory": {...},
    "duration": "1_MONTH",
    "amount": 1299,
    "description": "Updated 1 month subscription plan",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

---

### 34. Delete Plan
Delete a plan. (Protected - Super Admin only)

**DELETE** `/api/super-admin/plan/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Plan deleted successfully"
}
```

---

## Plan Duration Values

The following duration values are supported:
- `1_MONTH` - 1 month plan
- `3_MONTHS` - 3 months plan
- `6_MONTHS` - 6 months plan
- `1_YEAR` - 1 year plan

**Important Notes:**
- Each sub category can have only one plan per duration type
- If you try to create a duplicate plan with the same duration for the same sub category, it will return an error
- Amount must be a number greater than or equal to 0
- Plans are specific to sub categories - each sub category can have its own set of plans with different amounts

---

## Public Course Management APIs

### 35. Create Course
Create a new public course. Courses are standalone and not linked to categories. (Protected - Super Admin only)

**POST** `/api/super-admin/course`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `title` (required): Course title
- `description` (optional): Course description
- `price` (required): Course price (number, must be >= 0)
- `thumbnail` (optional): Course thumbnail image file (JPEG, PNG, GIF, WebP, max 5MB)

**Response (201):**
```json
{
  "success": true,
  "message": "Course created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "title": "Complete Web Development Course",
    "description": "Learn full-stack web development from scratch",
    "thumbnail": "https://your-bucket.s3.amazonaws.com/course-thumbnails/uuid-course-1234567890-complete-web-development-course.jpg",
    "price": 2999,
    "isActive": true,
    "createdBy": "507f1f77bcf86cd799439011",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 36. Get All Courses
Get all courses with optional filters. (Protected - Super Admin only)

**GET** `/api/super-admin/course?isActive=true`

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
  "message": "Courses retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439021",
      "title": "Complete Web Development Course",
      "description": "Learn full-stack web development from scratch",
      "thumbnail": "https://your-bucket.s3.amazonaws.com/course-thumbnails/uuid-course-1234567890-complete-web-development-course.jpg",
      "price": 2999,
      "isActive": true,
      "createdBy": {
        "_id": "507f1f77bcf86cd799439011",
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

### 37. Get Course by ID
Get a specific course by ID with its chapters. (Protected - Super Admin only)

**GET** `/api/super-admin/course/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Course retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "title": "Complete Web Development Course",
    "description": "Learn full-stack web development from scratch",
    "thumbnail": "https://your-bucket.s3.amazonaws.com/course-thumbnails/uuid-course-1234567890-complete-web-development-course.jpg",
    "price": 2999,
    "isActive": true,
    "createdBy": {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "ADGUSUP01",
      "firstName": "Super",
      "lastName": "Admin"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "chapters": [
      {
        "_id": "507f1f77bcf86cd799439022",
        "title": "Introduction to HTML",
        "description": "Learn HTML basics",
        "order": 1,
        "content": {
          "text": "# HTML Basics\n\nHTML stands for...",
          "pdf": "https://your-bucket.s3.amazonaws.com/course-pdfs/uuid-course-chapter-1234567891-introduction-to-html.pdf",
          "video": "https://your-bucket.s3.amazonaws.com/course-videos/uuid-course-chapter-1234567892-introduction-to-html.mp4"
        },
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

### 38. Update Course
Update an existing course. (Protected - Super Admin only)

**PUT** `/api/super-admin/course/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `title` (optional): Course title
- `description` (optional): Course description
- `price` (optional): Course price (number, must be >= 0)
- `isActive` (optional): Active status (`true` or `false`)
- `thumbnail` (optional): New thumbnail image file (JPEG, PNG, GIF, WebP, max 5MB)

**Response (200):**
```json
{
  "success": true,
  "message": "Course updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "title": "Updated Complete Web Development Course",
    "description": "Updated description",
    "thumbnail": "https://your-bucket.s3.amazonaws.com/course-thumbnails/uuid-course-1234567893-updated-complete-web-development-course.jpg",
    "price": 3499,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

---

### 39. Delete Course
Delete a course. Cannot delete if it has chapters. (Protected - Super Admin only)

**DELETE** `/api/super-admin/course/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Course deleted successfully"
}
```

**Error Response (400) - If course has chapters:**
```json
{
  "success": false,
  "message": "Cannot delete course. Please delete all chapters first."
}
```

---

## Course Chapter Management APIs

### 40. Create Course Chapter
Create a new chapter for a course. Supports text (markdown), PDF, and video content. (Protected - Super Admin only)

**POST** `/api/super-admin/course-chapter`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `title` (required): Chapter title
- `description` (optional): Chapter description
- `courseId` (required): Course ID
- `order` (required): Chapter order number
- `text` (optional): Markdown text content
- `pdf` (optional): PDF file (max 50MB)
- `video` (optional): Video file (max 500MB)

**Response (201):**
```json
{
  "success": true,
  "message": "Course chapter created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439022",
    "title": "Introduction to HTML",
    "description": "Learn HTML basics",
    "course": "507f1f77bcf86cd799439021",
    "order": 1,
    "content": {
      "text": "# HTML Basics\n\nHTML stands for HyperText Markup Language...",
      "pdf": "https://your-bucket.s3.amazonaws.com/course-pdfs/uuid-course-chapter-1234567891-introduction-to-html.pdf",
      "video": "https://your-bucket.s3.amazonaws.com/course-videos/uuid-course-chapter-1234567892-introduction-to-html.mp4"
    },
    "isActive": true,
    "createdBy": "507f1f77bcf86cd799439011",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 41. Get Course Chapters
Get all chapters for a specific course. (Protected - Super Admin only)

**GET** `/api/super-admin/course/:courseId/chapters?isActive=true`

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
  "message": "Course chapters retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439022",
      "title": "Introduction to HTML",
      "description": "Learn HTML basics",
      "order": 1,
      "content": {
        "text": "# HTML Basics\n\nHTML stands for...",
        "pdf": "https://your-bucket.s3.amazonaws.com/course-pdfs/uuid-course-chapter-1234567891-introduction-to-html.pdf",
        "video": "https://your-bucket.s3.amazonaws.com/course-videos/uuid-course-chapter-1234567892-introduction-to-html.mp4"
      },
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 42. Get Course Chapter by ID
Get a specific course chapter by ID. (Protected - Super Admin only)

**GET** `/api/super-admin/course-chapter/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Course chapter retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439022",
    "title": "Introduction to HTML",
    "description": "Learn HTML basics",
    "course": {
      "_id": "507f1f77bcf86cd799439021",
      "title": "Complete Web Development Course",
      "description": "Learn full-stack web development from scratch",
      "thumbnail": "https://your-bucket.s3.amazonaws.com/course-thumbnails/uuid-course-1234567890-complete-web-development-course.jpg"
    },
    "order": 1,
    "content": {
      "text": "# HTML Basics\n\nHTML stands for...",
      "pdf": "https://your-bucket.s3.amazonaws.com/course-pdfs/uuid-course-chapter-1234567891-introduction-to-html.pdf",
      "video": "https://your-bucket.s3.amazonaws.com/course-videos/uuid-course-chapter-1234567892-introduction-to-html.mp4"
    },
    "isActive": true,
    "createdBy": {
      "_id": "507f1f77bcf86cd799439011",
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

### 43. Update Course Chapter
Update an existing course chapter. (Protected - Super Admin only)

**PUT** `/api/super-admin/course-chapter/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `title` (optional): Chapter title
- `description` (optional): Chapter description
- `order` (optional): Chapter order number
- `text` (optional): Markdown text content
- `isActive` (optional): Active status (`true` or `false`)
- `pdf` (optional): New PDF file (max 50MB) - replaces existing PDF
- `video` (optional): New video file (max 500MB) - replaces existing video

**Response (200):**
```json
{
  "success": true,
  "message": "Course chapter updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439022",
    "title": "Updated Introduction to HTML",
    "description": "Updated description",
    "order": 1,
    "content": {
      "text": "# Updated HTML Basics\n\nUpdated content...",
      "pdf": "https://your-bucket.s3.amazonaws.com/course-pdfs/uuid-course-chapter-1234567893-updated-introduction-to-html.pdf",
      "video": "https://your-bucket.s3.amazonaws.com/course-videos/uuid-course-chapter-1234567894-updated-introduction-to-html.mp4"
    },
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

---

### 44. Delete Course Chapter
Delete a course chapter. (Protected - Super Admin only)

**DELETE** `/api/super-admin/course-chapter/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Course chapter deleted successfully"
}
```

---

## Course Management Notes

- Course thumbnails are automatically processed with Jimp (resized to 800x800px, 80% quality) before upload to S3
- Course chapters support text (markdown), PDF, and video content
- PDF files are limited to 50MB
- Video files are limited to 500MB
- Courses are standalone and not linked to categories
- Each course can have multiple chapters with unique order numbers
- Cannot delete a course if it has chapters
- All file uploads (thumbnails, PDFs, videos) are stored in AWS S3
- Course price must be a number greater than or equal to 0

