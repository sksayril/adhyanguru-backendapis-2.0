# Student API Documentation

## Base URL
```
http://localhost:3023/api/student
```

## Overview
Student APIs for registration and authentication. Students can signup with their details including category selection, profile picture, coordinates, address, and optional field employee code.

---

## Endpoints

### 1. Student Signup
Register a new student account.

**POST** `/api/student/signup`

**Headers:**
```
Content-Type: multipart/form-data
```

**Form Data:**
- `firstName` (required): Student's first name
- `lastName` (required): Student's last name
- `email` (optional): Student's email address
- `mobileNumber` (required): Student's mobile number (unique)
- `password` (required): Password for login
- `categories` (required): JSON array of category objects. Each object must have:
  - `mainCategoryId` (required): Main category ID
  - `subCategoryId` (required): Sub category ID
  - Example: `[{"mainCategoryId": "507f1f77bcf86cd799439011", "subCategoryId": "507f1f77bcf86cd799439012"}]`
- `latitude` (optional): Latitude coordinate
- `longitude` (optional): Longitude coordinate
- `address` (optional): Student's address
- `pincode` (optional): Pincode
- `fieldEmployeeCode` (optional): Field employee code
- `profilePicture` (optional): Profile picture file (JPEG, PNG, GIF, WebP, max 5MB)

**Note:** You can add multiple categories during signup. Each category must have a unique combination of main category and sub category.

**Response (201):**
```json
{
  "success": true,
  "message": "Student registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "507f1f77bcf86cd799439021",
      "userId": "ADGUSTU01",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "mobileNumber": "9876543210",
      "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-student-1234567890-john.jpg",
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
      "latitude": 28.6139,
      "longitude": 77.2090,
      "address": "123 Main Street, City",
      "pincode": "110001",
      "fieldEmployeeCode": "FEM001",
      "role": "STUDENT",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Error Responses:**

**400 Bad Request - Missing required fields:**
```json
{
  "success": false,
  "message": "First name, last name, mobile number, and password are required"
}
```

**400 Bad Request - No categories provided:**
```json
{
  "success": false,
  "message": "At least one category (main category and sub category) is required"
}
```

**400 Bad Request - Student already exists:**
```json
{
  "success": false,
  "message": "Student already exists with this mobile number or email"
}
```

**404 Not Found - Category not found:**
```json
{
  "success": false,
  "message": "Main category not found"
}
```

or

```json
{
  "success": false,
  "message": "Sub category not found or does not belong to the specified main category"
}
```

---

### 2. Student Login
Login with mobile number or email and password.

**POST** `/api/student/login`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "identifier": "9876543210",
  "password": "password123"
}
```

or

```json
{
  "identifier": "john.doe@example.com",
  "password": "password123"
}
```

**Request Body Fields:**
- `identifier` (required): Mobile number or email address
- `password` (required): Password

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "507f1f77bcf86cd799439021",
      "userId": "ADGUSTU01",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "mobileNumber": "9876543210",
      "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-student-1234567890-john.jpg",
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
      "latitude": 28.6139,
      "longitude": 77.2090,
      "address": "123 Main Street, City",
      "pincode": "110001",
      "fieldEmployeeCode": "FEM001",
      "role": "STUDENT",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Mobile number/email and password are required"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Invalid mobile number/email or password"
}
```

**403 Forbidden - Account deactivated:**
```json
{
  "success": false,
  "message": "Your account has been deactivated. Please contact support."
}
```

---

### 3. Student Logout
Logout from the application. (Client-side token removal)

**POST** `/api/student/logout`

**Headers:**
```
Content-Type: application/json
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Note:** No authentication required. The client should delete the token from local storage/session after receiving success response.

---

### 4. Get Student Profile
Get student profile data. (Protected - Requires Student authentication)

**GET** `/api/student/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Student profile retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "userId": "ADGUSTU01",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "mobileNumber": "9876543210",
    "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-student-1234567890-john.jpg",
    "mainCategories": [
      {
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
        "addedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "latitude": 28.6139,
    "longitude": 77.2090,
    "address": "123 Main Street, City",
    "pincode": "110001",
    "fieldEmployeeCode": "FEM001",
    "role": "STUDENT",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**

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
  "message": "Student not found"
}
```

---

### 5. Get My Boards Subjects
Get student's subjects grouped by board. Only returns subject data, no chapters. (Protected - Requires Student authentication)

**GET** `/api/student/my-boards-subjects`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Student subjects retrieved successfully",
  "data": {
    "boards": [
      {
        "board": {
          "_id": "507f1f77bcf86cd799439031",
          "name": "CBSE",
          "description": "Central Board of Secondary Education",
          "code": "CBSE"
        },
        "subjects": [
          {
            "_id": "507f1f77bcf86cd799439041",
            "title": "Mathematics",
            "description": "Mathematics subject for CBSE",
            "thumbnail": "https://your-bucket.s3.amazonaws.com/subject-1234567890-math.jpg",
            "mainCategory": {
              "_id": "507f1f77bcf86cd799439011",
              "name": "Education",
              "description": "Educational courses",
              "image": "https://your-bucket.s3.amazonaws.com/main-category-1234567890-education.jpg"
            },
            "subCategory": {
              "_id": "507f1f77bcf86cd799439012",
              "name": "Mathematics",
              "description": "Math courses",
              "image": "https://your-bucket.s3.amazonaws.com/sub-category-1234567891-mathematics.jpg"
            },
            "board": {
              "_id": "507f1f77bcf86cd799439031",
              "name": "CBSE",
              "description": "Central Board of Secondary Education",
              "code": "CBSE"
            },
            "isActive": true,
            "hasActiveSubscription": true,
            "createdAt": "2024-01-01T00:00:00.000Z",
            "updatedAt": "2024-01-01T00:00:00.000Z"
          }
        ]
      },
      {
        "board": {
          "_id": "507f1f77bcf86cd799439032",
          "name": "ICSE",
          "description": "Indian Certificate of Secondary Education",
          "code": "ICSE"
        },
        "subjects": [
          {
            "_id": "507f1f77bcf86cd799439042",
            "title": "Science",
            "description": "Science subject for ICSE",
            "thumbnail": "https://your-bucket.s3.amazonaws.com/subject-1234567891-science.jpg",
            "mainCategory": {
              "_id": "507f1f77bcf86cd799439011",
              "name": "Education",
              "description": "Educational courses",
              "image": "https://your-bucket.s3.amazonaws.com/main-category-1234567890-education.jpg"
            },
            "subCategory": {
              "_id": "507f1f77bcf86cd799439013",
              "name": "Science",
              "description": "Science courses",
              "image": "https://your-bucket.s3.amazonaws.com/sub-category-1234567892-science.jpg"
            },
            "board": {
              "_id": "507f1f77bcf86cd799439032",
              "name": "ICSE",
              "description": "Indian Certificate of Secondary Education",
              "code": "ICSE"
            },
            "isActive": true,
            "createdAt": "2024-01-02T00:00:00.000Z",
            "updatedAt": "2024-01-02T00:00:00.000Z"
          }
        ]
      },
      {
        "board": null,
        "subjects": [
          {
            "_id": "507f1f77bcf86cd799439043",
            "title": "General Studies",
            "description": "General studies subject",
            "thumbnail": "https://your-bucket.s3.amazonaws.com/subject-1234567892-general.jpg",
            "mainCategory": {
              "_id": "507f1f77bcf86cd799439011",
              "name": "Education",
              "description": "Educational courses",
              "image": "https://your-bucket.s3.amazonaws.com/main-category-1234567890-education.jpg"
            },
            "subCategory": {
              "_id": "507f1f77bcf86cd799439014",
              "name": "General",
              "description": "General courses",
              "image": "https://your-bucket.s3.amazonaws.com/sub-category-1234567893-general.jpg"
            },
            "board": null,
            "isActive": true,
            "hasActiveSubscription": false,
            "createdAt": "2024-01-03T00:00:00.000Z",
            "updatedAt": "2024-01-03T00:00:00.000Z"
          }
        ]
      }
    ],
    "totalBoards": 3,
    "totalSubjects": 3
  }
}
```

**Note:** 
- Subjects are grouped by board
- If a subject doesn't have a board assigned, it will be in a separate group with `board: null`
- Only subject data is returned, no chapters included
- Only active subjects are returned
- Subjects are filtered based on student's selected categories

**Error Responses:**

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
  "message": "Student not found"
}
```

---

### 6. Get Subject Chapters
Get chapters for a particular subject with completion status. (Protected - Requires Student authentication)

**GET** `/api/student/subject/chapters`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `subjectId` (required): Subject ID
- `boardId` (optional): Board ID (for validation)
- `subCategoryId` (optional): Sub Category ID (for validation)

**Response (200):**
```json
{
  "success": true,
  "message": "Chapters retrieved successfully",
  "data": {
    "subject": {
      "_id": "507f1f77bcf86cd799439041",
      "title": "Mathematics",
      "description": "Mathematics subject for CBSE",
      "thumbnail": "https://your-bucket.s3.amazonaws.com/subject-1234567890-math.jpg",
      "mainCategory": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Education",
        "description": "Educational courses",
        "image": "https://your-bucket.s3.amazonaws.com/main-category-1234567890-education.jpg"
      },
      "subCategory": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Mathematics",
        "description": "Math courses",
        "image": "https://your-bucket.s3.amazonaws.com/sub-category-1234567891-mathematics.jpg"
      },
      "board": {
        "_id": "507f1f77bcf86cd799439031",
        "name": "CBSE",
        "description": "Central Board of Secondary Education",
        "code": "CBSE"
      },
      "isActive": true
    },
    "chapters": [
      {
        "_id": "507f1f77bcf86cd799439051",
        "title": "Introduction to Algebra",
        "description": "Basic algebra concepts",
        "subject": {
          "_id": "507f1f77bcf86cd799439041",
          "title": "Mathematics",
          "description": "Mathematics subject",
          "thumbnail": "https://your-bucket.s3.amazonaws.com/subject-1234567890-math.jpg"
        },
        "order": 1,
        "content": {
          "text": "# Introduction to Algebra\n\nAlgebra is...",
          "pdf": "https://your-bucket.s3.amazonaws.com/chapter-1234567890-algebra.pdf",
          "video": "https://your-bucket.s3.amazonaws.com/chapter-1234567890-algebra.mp4"
        },
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "progress": {
          "isCompleted": true,
          "completedAt": "2024-01-02T10:30:00.000Z"
        }
      },
      {
        "_id": "507f1f77bcf86cd799439052",
        "title": "Linear Equations",
        "description": "Solving linear equations",
        "subject": {
          "_id": "507f1f77bcf86cd799439041",
          "title": "Mathematics",
          "description": "Mathematics subject",
          "thumbnail": "https://your-bucket.s3.amazonaws.com/subject-1234567890-math.jpg"
        },
        "order": 2,
        "content": {
          "text": "# Linear Equations\n\nLinear equations are...",
          "pdf": null,
          "video": "https://your-bucket.s3.amazonaws.com/chapter-1234567891-linear-equations.mp4"
        },
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "progress": {
          "isCompleted": false,
          "completedAt": null
        }
      }
    ],
    "totalChapters": 2,
    "completedChapters": 1
  }
}
```

**Error Responses:**

**400 Bad Request - Missing subjectId:**
```json
{
  "success": false,
  "message": "Subject ID is required"
}
```

**403 Forbidden - No access:**
```json
{
  "success": false,
  "message": "You do not have access to this subject. Please select the required category."
}
```

---

### 7. Mark Chapter as Completed
Mark a chapter as completed for the student. (Protected - Requires Student authentication)

**POST** `/api/student/chapter/complete`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "chapterId": "507f1f77bcf86cd799439051"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Chapter marked as completed",
  "data": {
    "_id": "507f1f77bcf86cd799439061",
    "student": "507f1f77bcf86cd799439021",
    "chapter": {
      "_id": "507f1f77bcf86cd799439051",
      "title": "Introduction to Algebra",
      "order": 1
    },
    "subject": {
      "_id": "507f1f77bcf86cd799439041",
      "title": "Mathematics"
    },
    "isCompleted": true,
    "completedAt": "2024-01-02T10:30:00.000Z",
    "createdAt": "2024-01-02T10:30:00.000Z",
    "updatedAt": "2024-01-02T10:30:00.000Z"
  }
}
```

**Error Responses:**

**400 Bad Request - Missing chapterId:**
```json
{
  "success": false,
  "message": "Chapter ID is required"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Chapter not found"
}
```

---

### 8. Get My Learning Progress
Get all completed chapters organized by subject. (Protected - Requires Student authentication)

**GET** `/api/student/my-learning`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Learning progress retrieved successfully",
  "data": {
    "learning": [
      {
        "subject": {
          "_id": "507f1f77bcf86cd799439041",
          "title": "Mathematics",
          "description": "Mathematics subject for CBSE",
          "thumbnail": "https://your-bucket.s3.amazonaws.com/subject-1234567890-math.jpg",
          "mainCategory": {
            "_id": "507f1f77bcf86cd799439011",
            "name": "Education",
            "description": "Educational courses",
            "image": "https://your-bucket.s3.amazonaws.com/main-category-1234567890-education.jpg"
          },
          "subCategory": {
            "_id": "507f1f77bcf86cd799439012",
            "name": "Mathematics",
            "description": "Math courses",
            "image": "https://your-bucket.s3.amazonaws.com/sub-category-1234567891-mathematics.jpg"
          },
          "board": {
            "_id": "507f1f77bcf86cd799439031",
            "name": "CBSE",
            "description": "Central Board of Secondary Education",
            "code": "CBSE"
          }
        },
        "chapters": [
          {
            "_id": "507f1f77bcf86cd799439051",
            "title": "Introduction to Algebra",
            "description": "Basic algebra concepts",
            "order": 1,
            "content": {
              "text": "# Introduction to Algebra\n\nAlgebra is...",
              "pdf": "https://your-bucket.s3.amazonaws.com/chapter-1234567890-algebra.pdf",
              "video": "https://your-bucket.s3.amazonaws.com/chapter-1234567890-algebra.mp4"
            },
            "completedAt": "2024-01-02T10:30:00.000Z",
            "progressId": "507f1f77bcf86cd799439061"
          }
        ]
      }
    ],
    "totalSubjects": 1,
    "totalCompletedChapters": 1
  }
}
```

**Note:** Only completed chapters are returned, organized by subject.

---

### 9. Get Student Progress
Get overall progress statistics for the student. (Protected - Requires Student authentication)

**GET** `/api/student/progress`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Student progress retrieved successfully",
  "data": {
    "overall": {
      "totalChapters": 50,
      "completedChapters": 25,
      "progressPercentage": 50
    },
    "bySubCategory": [
      {
        "subCategory": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Mathematics",
          "description": "Math courses",
          "image": "https://your-bucket.s3.amazonaws.com/sub-category-1234567891-mathematics.jpg"
        },
        "totalChapters": 30,
        "completedChapters": 15,
        "progressPercentage": 50
      },
      {
        "subCategory": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Science",
          "description": "Science courses",
          "image": "https://your-bucket.s3.amazonaws.com/sub-category-1234567892-science.jpg"
        },
        "totalChapters": 20,
        "completedChapters": 10,
        "progressPercentage": 50
      }
    ],
    "totalSubjects": 10,
    "totalSubCategories": 2
  }
}
```

---

### 10. Get Student Dashboard
Get comprehensive dashboard data including progress, subscriptions, and learning stats. (Protected - Requires Student authentication)

**GET** `/api/student/dashboard`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Student dashboard retrieved successfully",
  "data": {
    "student": {
      "_id": "507f1f77bcf86cd799439021",
      "userId": "ADGUSTU01",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "mobileNumber": "9876543210",
      "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-student-1234567890-john.jpg"
    },
    "progress": {
      "totalChapters": 50,
      "completedChapters": 25,
      "progressPercentage": 50,
      "totalSubjects": 10
    },
    "subscriptions": {
      "total": 2,
      "active": 1,
      "list": [
        {
          "_id": "507f1f77bcf86cd799439071",
          "plan": {
            "_id": "507f1f77bcf86cd799439061",
            "duration": "1_MONTH",
            "amount": 999,
            "description": "1 Month Plan"
          },
          "subCategory": {
            "_id": "507f1f77bcf86cd799439012",
            "name": "Mathematics",
            "description": "Math courses",
            "image": "https://your-bucket.s3.amazonaws.com/sub-category-1234567891-mathematics.jpg"
          },
          "amount": 999,
          "duration": "1_MONTH",
          "startDate": "2024-01-01T00:00:00.000Z",
          "endDate": "2024-02-01T00:00:00.000Z",
          "isActive": true,
          "paymentStatus": "COMPLETED"
        }
      ]
    },
    "categories": [
      {
        "mainCategory": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Education",
          "description": "Educational courses",
          "image": "https://your-bucket.s3.amazonaws.com/main-category-1234567890-education.jpg"
        },
        "subCategory": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Mathematics",
          "description": "Math courses",
          "image": "https://your-bucket.s3.amazonaws.com/sub-category-1234567891-mathematics.jpg"
        },
        "hasActiveSubscription": true,
        "subscription": {
          "_id": "507f1f77bcf86cd799439071",
          "plan": {
            "_id": "507f1f77bcf86cd799439061",
            "duration": "1_MONTH",
            "amount": 999
          },
          "amount": 999,
          "duration": "1_MONTH",
          "startDate": "2024-01-01T00:00:00.000Z",
          "endDate": "2024-02-01T00:00:00.000Z"
        }
      }
    ],
    "recentActivity": [
      {
        "chapter": {
          "_id": "507f1f77bcf86cd799439051",
          "title": "Introduction to Algebra",
          "subject": {
            "_id": "507f1f77bcf86cd799439041",
            "title": "Mathematics",
            "thumbnail": "https://your-bucket.s3.amazonaws.com/subject-1234567890-math.jpg"
          }
        },
        "completedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "stats": {
      "totalCategories": 2,
      "totalSubscriptions": 2,
      "activeSubscriptions": 1
    }
  }
}
```

---

### 11. Get Plans for SubCategory
Get all available subscription plans for a specific subcategory. (Protected - Requires Student authentication)

**GET** `/api/student/plans?subCategoryId=xxx`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `subCategoryId` (required): Sub Category ID

**Response (200):**
```json
{
  "success": true,
  "message": "Plans retrieved successfully",
  "data": {
    "plans": [
      {
        "_id": "507f1f77bcf86cd799439061",
        "subCategory": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Mathematics",
          "description": "Math courses",
          "image": "https://your-bucket.s3.amazonaws.com/sub-category-1234567891-mathematics.jpg"
        },
        "duration": "1_MONTH",
        "amount": 999,
        "description": "1 Month Plan for Mathematics"
      },
      {
        "_id": "507f1f77bcf86cd799439062",
        "subCategory": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Mathematics",
          "description": "Math courses",
          "image": "https://your-bucket.s3.amazonaws.com/sub-category-1234567891-mathematics.jpg"
        },
        "duration": "3_MONTHS",
        "amount": 2499,
        "description": "3 Months Plan for Mathematics"
      },
      {
        "_id": "507f1f77bcf86cd799439063",
        "subCategory": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Mathematics",
          "description": "Math courses",
          "image": "https://your-bucket.s3.amazonaws.com/sub-category-1234567891-mathematics.jpg"
        },
        "duration": "6_MONTHS",
        "amount": 4499,
        "description": "6 Months Plan for Mathematics"
      },
      {
        "_id": "507f1f77bcf86cd799439064",
        "subCategory": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Mathematics",
          "description": "Math courses",
          "image": "https://your-bucket.s3.amazonaws.com/sub-category-1234567891-mathematics.jpg"
        },
        "duration": "1_YEAR",
        "amount": 7999,
        "description": "1 Year Plan for Mathematics"
      }
    ],
    "totalPlans": 4
  }
}
```

**Error Responses:**

**400 Bad Request - Missing subCategoryId:**
```json
{
  "success": false,
  "message": "Sub Category ID is required"
}
```

---

### 12. Create Subscription Order
Create a Razorpay order for subscription payment. (Protected - Requires Student authentication)

**POST** `/api/student/subscription/order`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "planId": "507f1f77bcf86cd799439061"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Subscription order created successfully",
  "data": {
    "subscription": {
      "_id": "507f1f77bcf86cd799439071",
      "plan": {
        "_id": "507f1f77bcf86cd799439061",
        "subCategory": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Mathematics",
          "description": "Math courses",
          "image": "https://your-bucket.s3.amazonaws.com/sub-category-1234567891-mathematics.jpg"
        },
        "duration": "1_MONTH",
        "amount": 999,
        "description": "1 Month Plan for Mathematics"
      },
      "amount": 999,
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-02-01T00:00:00.000Z"
    },
    "razorpayOrder": {
      "id": "order_M1234567890",
      "amount": 99900,
      "currency": "INR",
      "receipt": "sub_507f1f77bcf86cd799439021_507f1f77bcf86cd799439061_1234567890",
      "status": "created"
    },
    "keyId": "rzp_test_1234567890"
  }
}
```

**Note:** 
- The `razorpayOrder.amount` is in paise (smallest currency unit), so 99900 paise = ₹999
- Use the `keyId` and `razorpayOrder.id` in your frontend to initialize Razorpay payment
- After successful payment, call the verify endpoint to activate the subscription

**Error Responses:**

**400 Bad Request - Missing planId:**
```json
{
  "success": false,
  "message": "Plan ID is required"
}
```

**400 Bad Request - Subcategory not selected:**
```json
{
  "success": false,
  "message": "You need to select this subcategory first"
}
```

**400 Bad Request - Active subscription exists:**
```json
{
  "success": false,
  "message": "You already have an active subscription for this subcategory"
}
```

---

### 13. Verify Payment and Activate Subscription
Verify Razorpay payment and activate the subscription. (Protected - Requires Student authentication)

**POST** `/api/student/subscription/verify`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "subscriptionId": "507f1f77bcf86cd799439071",
  "razorpayPaymentId": "pay_M1234567890",
  "razorpaySignature": "abc123def456..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Payment verified and subscription activated successfully",
  "data": {
    "subscription": {
      "_id": "507f1f77bcf86cd799439071",
      "plan": {
        "_id": "507f1f77bcf86cd799439061",
        "duration": "1_MONTH",
        "amount": 999
      },
      "subCategory": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Mathematics",
        "description": "Math courses"
      },
      "amount": 999,
      "duration": "1_MONTH",
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-02-01T00:00:00.000Z",
      "isActive": true,
      "paymentStatus": "COMPLETED"
    }
  }
}
```

**Error Responses:**

**400 Bad Request - Missing fields:**
```json
{
  "success": false,
  "message": "Subscription ID, payment ID, and signature are required"
}
```

**400 Bad Request - Invalid signature:**
```json
{
  "success": false,
  "message": "Invalid payment signature"
}
```

**400 Bad Request - Payment not captured:**
```json
{
  "success": false,
  "message": "Payment not captured"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Access denied. This subscription does not belong to you."
}
```

---

### 14. Get Student Subscriptions
Get all subscriptions for the student. (Protected - Requires Student authentication)

**GET** `/api/student/subscriptions`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Subscriptions retrieved successfully",
  "data": {
    "subscriptions": [
      {
        "_id": "507f1f77bcf86cd799439071",
        "plan": {
          "_id": "507f1f77bcf86cd799439061",
          "duration": "1_MONTH",
          "amount": 999,
          "description": "1 Month Plan for Mathematics"
        },
        "subCategory": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "Mathematics",
          "description": "Math courses",
          "image": "https://your-bucket.s3.amazonaws.com/sub-category-1234567891-mathematics.jpg"
        },
        "amount": 999,
        "duration": "1_MONTH",
        "startDate": "2024-01-01T00:00:00.000Z",
        "endDate": "2024-02-01T00:00:00.000Z",
        "isActive": true,
        "paymentStatus": "COMPLETED",
        "createdAt": "2024-01-01T00:00:00.000Z"
      },
      {
        "_id": "507f1f77bcf86cd799439072",
        "plan": {
          "_id": "507f1f77bcf86cd799439062",
          "duration": "3_MONTHS",
          "amount": 2499,
          "description": "3 Months Plan for Science"
        },
        "subCategory": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Science",
          "description": "Science courses",
          "image": "https://your-bucket.s3.amazonaws.com/sub-category-1234567892-science.jpg"
        },
        "amount": 2499,
        "duration": "3_MONTHS",
        "startDate": "2023-12-01T00:00:00.000Z",
        "endDate": "2024-03-01T00:00:00.000Z",
        "isActive": false,
        "paymentStatus": "COMPLETED",
        "createdAt": "2023-12-01T00:00:00.000Z"
      }
    ],
    "total": 2,
    "active": 1
  }
}
```

**Note:** 
- `isActive` is calculated based on subscription validity (payment status, end date, etc.)
- Only subscriptions with `paymentStatus: "COMPLETED"` and valid end date are considered active

---

## Student Model Fields

### Required Fields:
- `firstName`: Student's first name
- `lastName`: Student's last name
- `mobileNumber`: Mobile number (must be unique)
- `password`: Password for authentication
- `categories`: Array of category objects (at least one required during signup)
  - Each category object must have:
    - `mainCategoryId`: Main category ID
    - `subCategoryId`: Sub category ID

### Optional Fields:
- `email`: Email address (optional, but must be unique if provided)
- `profilePicture`: Profile picture file
- `latitude`: Latitude coordinate
- `longitude`: Longitude coordinate
- `address`: Student's address
- `pincode`: Pincode
- `fieldEmployeeCode`: Field employee code

**Note:** Students can have multiple main categories and sub categories. Categories are stored as an array in the `mainCategories` field.

---

## User ID Generation

Student user IDs are automatically generated in the format: `ADGUSTU01`, `ADGUSTU02`, etc.
- Prefix: `ADGUSTU` (Adhyanguru Student)
- Sequence: 01, 02, 03, etc.

---

## Notes

- Profile pictures are automatically processed with Jimp (resized to 800x800px, 80% quality) before upload to S3
- Passwords are encrypted using AES encryption with `crypto-js`
- Mobile number must be unique across all students
- Email is optional but must be unique if provided
- Students can login with either mobile number or email
- Sub category must belong to the selected main category
- All coordinates, address, and field employee code are optional
- JWT token is returned on successful signup and login

---

## Example Signup Request

**Using cURL:**
```bash
curl -X POST http://localhost:3000/api/student/signup \
  -F "firstName=John" \
  -F "lastName=Doe" \
  -F "email=john.doe@example.com" \
  -F "mobileNumber=9876543210" \
  -F "password=password123" \
  -F "mainCategoryId=507f1f77bcf86cd799439011" \
  -F "subCategoryId=507f1f77bcf86cd799439012" \
  -F "latitude=28.6139" \
  -F "longitude=77.2090" \
  -F "address=123 Main Street, City" \
  -F "pincode=110001" \
  -F "fieldEmployeeCode=FEM001" \
  -F "profilePicture=@/path/to/image.jpg"
```

**Using JavaScript (FormData):**
```javascript
const formData = new FormData();
formData.append('firstName', 'John');
formData.append('lastName', 'Doe');
formData.append('email', 'john.doe@example.com');
formData.append('mobileNumber', '9876543210');
formData.append('password', 'password123');

// Add categories as JSON string
const categories = [
  { mainCategoryId: '507f1f77bcf86cd799439011', subCategoryId: '507f1f77bcf86cd799439012' },
  { mainCategoryId: '507f1f77bcf86cd799439013', subCategoryId: '507f1f77bcf86cd799439014' }
];
formData.append('categories', JSON.stringify(categories));

formData.append('latitude', '28.6139');
formData.append('longitude', '77.2090');
formData.append('address', '123 Main Street, City');
formData.append('pincode', '110001');
formData.append('fieldEmployeeCode', 'FEM001');
formData.append('profilePicture', fileInput.files[0]);

fetch('http://localhost:3000/api/student/signup', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

---

## Example Login Request

**Using cURL:**
```bash
curl -X POST http://localhost:3000/api/student/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "9876543210",
    "password": "password123"
  }'
```

**Using JavaScript:**
```javascript
fetch('http://localhost:3000/api/student/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    identifier: '9876543210', // or 'john.doe@example.com'
    password: 'password123'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

---

## Public Course APIs

### 15. Get All Public Courses
Get all active public courses. (Public - No authentication required)

**GET** `/api/student/courses`

**Note:** This endpoint is also available at `/api/public/course/courses` without authentication.

**Response (200):**
```json
{
  "success": true,
  "message": "Public courses retrieved successfully",
  "data": {
    "courses": [
      {
        "_id": "507f1f77bcf86cd799439021",
        "title": "Complete Web Development Course",
        "description": "Learn full-stack web development from scratch",
        "thumbnail": "https://your-bucket.s3.amazonaws.com/course-thumbnails/uuid-course-1234567890-complete-web-development-course.jpg",
        "price": 2999,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "totalCourses": 1
  }
}
```

---

### 16. Get Course Details
Get course details with chapters. Shows purchase status if authenticated. (Public - Optional authentication)

**GET** `/api/student/course/:courseId`

**Headers (Optional):**
```
Authorization: Bearer <token>
```

**Note:** This endpoint is also available at `/api/public/course/course/:courseId` without authentication. If you provide a token, it will show whether you have purchased the course.

**Response (200) - Not Purchased:**
```json
{
  "success": true,
  "message": "Course details retrieved successfully",
  "data": {
    "course": {
      "_id": "507f1f77bcf86cd799439021",
      "title": "Complete Web Development Course",
      "description": "Learn full-stack web development from scratch",
      "thumbnail": "https://your-bucket.s3.amazonaws.com/course-thumbnails/uuid-course-1234567890-complete-web-development-course.jpg",
      "price": 2999,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "chapters": [
      {
        "_id": "507f1f77bcf86cd799439022",
        "title": "Introduction to HTML",
        "description": "Learn HTML basics",
        "order": 1,
        "content": {
          "text": null,
          "pdf": null,
          "video": null
        },
        "isActive": true
      }
    ],
    "totalChapters": 1,
    "isPurchased": false,
    "canAccessContent": false
  }
}
```

**Response (200) - Purchased:**
```json
{
  "success": true,
  "message": "Course details retrieved successfully",
  "data": {
    "course": {
      "_id": "507f1f77bcf86cd799439021",
      "title": "Complete Web Development Course",
      "description": "Learn full-stack web development from scratch",
      "thumbnail": "https://your-bucket.s3.amazonaws.com/course-thumbnails/uuid-course-1234567890-complete-web-development-course.jpg",
      "price": 2999,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "chapters": [
      {
        "_id": "507f1f77bcf86cd799439022",
        "title": "Introduction to HTML",
        "description": "Learn HTML basics",
        "order": 1,
        "content": {
          "text": "# HTML Basics\n\nHTML stands for HyperText Markup Language...",
          "pdf": "https://your-bucket.s3.amazonaws.com/course-pdfs/uuid-course-chapter-1234567891-introduction-to-html.pdf",
          "video": "https://your-bucket.s3.amazonaws.com/course-videos/uuid-course-chapter-1234567892-introduction-to-html.mp4"
        },
        "isActive": true
      }
    ],
    "totalChapters": 1,
    "isPurchased": true,
    "canAccessContent": true
  }
}
```

**Note:** 
- If not purchased, chapter content (text, PDF, video) is hidden (returns `null`)
- If purchased, full chapter content is visible
- Authentication is optional - if you're logged in, it will show purchase status

---

### 17. Create Course Purchase Order
Create a Razorpay order for course purchase. (Protected - Requires Student authentication)

**POST** `/api/student/course/purchase/order`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "courseId": "507f1f77bcf86cd799439021"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Course purchase order created successfully",
  "data": {
    "purchase": {
      "_id": "507f1f77bcf86cd799439031",
      "course": {
        "_id": "507f1f77bcf86cd799439021",
        "title": "Complete Web Development Course",
        "thumbnail": "https://your-bucket.s3.amazonaws.com/course-thumbnails/uuid-course-1234567890-complete-web-development-course.jpg",
        "price": 2999
      },
      "amount": 2999
    },
    "razorpayOrder": {
      "id": "order_M1234567890",
      "amount": 299900,
      "currency": "INR",
      "receipt": "CRS507f1f77bcf86cd799439021_1234567890",
      "status": "created"
    },
    "keyId": "rzp_test_1234567890"
  }
}
```

**Note:** 
- The `razorpayOrder.amount` is in paise (smallest currency unit), so 299900 paise = ₹2999
- Use the `keyId` and `razorpayOrder.id` in your frontend to initialize Razorpay payment
- After successful payment, call the verify endpoint to activate course access

**Error Responses:**

**400 Bad Request - Missing courseId:**
```json
{
  "success": false,
  "message": "Course ID is required"
}
```

**400 Bad Request - Already purchased:**
```json
{
  "success": false,
  "message": "You have already purchased this course"
}
```

**400 Bad Request - Course not available:**
```json
{
  "success": false,
  "message": "Course is not available"
}
```

---

### 18. Verify Course Purchase Payment
Verify Razorpay payment and activate course access. (Protected - Requires Student authentication)

**POST** `/api/student/course/purchase/verify`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "purchaseId": "507f1f77bcf86cd799439031",
  "razorpayPaymentId": "pay_M1234567890",
  "razorpaySignature": "abc123def456..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Payment verified and course access activated successfully",
  "data": {
    "purchase": {
      "_id": "507f1f77bcf86cd799439031",
      "course": {
        "_id": "507f1f77bcf86cd799439021",
        "title": "Complete Web Development Course",
        "thumbnail": "https://your-bucket.s3.amazonaws.com/course-thumbnails/uuid-course-1234567890-complete-web-development-course.jpg",
        "price": 2999
      },
      "amount": 2999,
      "paymentStatus": "COMPLETED",
      "purchasedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Error Responses:**

**400 Bad Request - Missing fields:**
```json
{
  "success": false,
  "message": "Purchase ID, payment ID, and signature are required"
}
```

**400 Bad Request - Invalid signature:**
```json
{
  "success": false,
  "message": "Invalid payment signature"
}
```

**400 Bad Request - Payment not captured:**
```json
{
  "success": false,
  "message": "Payment not captured"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Access denied. This purchase does not belong to you."
}
```

---

### 19. Get My Purchased Courses
Get all courses purchased by the student. (Protected - Requires Student authentication)

**GET** `/api/student/my-courses`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Purchased courses retrieved successfully",
  "data": {
    "courses": [
      {
        "_id": "507f1f77bcf86cd799439021",
        "title": "Complete Web Development Course",
        "description": "Learn full-stack web development from scratch",
        "thumbnail": "https://your-bucket.s3.amazonaws.com/course-thumbnails/uuid-course-1234567890-complete-web-development-course.jpg",
        "price": 2999,
        "purchasedAt": "2024-01-01T00:00:00.000Z",
        "purchaseId": "507f1f77bcf86cd799439031"
      }
    ],
    "totalCourses": 1
  }
}
```

---

### 20. Get Course Chapters
Get course chapters with full content. Only accessible if course is purchased. (Protected - Requires Student authentication)

**GET** `/api/student/course/chapters?courseId=xxx`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `courseId` (required): Course ID

**Response (200):**
```json
{
  "success": true,
  "message": "Course chapters retrieved successfully",
  "data": {
    "course": {
      "_id": "507f1f77bcf86cd799439021",
      "title": "Complete Web Development Course",
      "description": "Learn full-stack web development from scratch",
      "thumbnail": "https://your-bucket.s3.amazonaws.com/course-thumbnails/uuid-course-1234567890-complete-web-development-course.jpg",
      "price": 2999
    },
    "chapters": [
      {
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
          "text": "# HTML Basics\n\nHTML stands for HyperText Markup Language...",
          "pdf": "https://your-bucket.s3.amazonaws.com/course-pdfs/uuid-course-chapter-1234567891-introduction-to-html.pdf",
          "video": "https://your-bucket.s3.amazonaws.com/course-videos/uuid-course-chapter-1234567892-introduction-to-html.mp4"
        },
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "totalChapters": 1
  }
}
```

**Error Responses:**

**400 Bad Request - Missing courseId:**
```json
{
  "success": false,
  "message": "Course ID is required"
}
```

**403 Forbidden - Not purchased:**
```json
{
  "success": false,
  "message": "You need to purchase this course to access chapters"
}
```

---

## 20. Save Chapter Result

Save dynamic data/results for a student chapter. This API allows storing any type of data in an array format for a specific chapter.

**Endpoint:** `POST /api/student/chapter/result`

**Authentication:** Required (Student token)

**Request Body:**
```json
{
  "chapterId": "507f1f77bcf86cd799439011",
  "results": [
    {
      "questionId": "q1",
      "answer": "Option A",
      "score": 10,
      "timeTaken": 120
    },
    {
      "questionId": "q2",
      "answer": "Option B",
      "score": 8,
      "timeTaken": 90
    },
    {
      "customField1": "value1",
      "customField2": "value2",
      "anyData": "can be stored here"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Chapter result saved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "student": {
      "_id": "507f1f77bcf86cd799439013",
      "userId": "ADGUSTU0001",
      "firstName": "John",
      "lastName": "Doe"
    },
    "chapter": {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Introduction to Mathematics",
      "order": 1
    },
    "subject": {
      "_id": "507f1f77bcf86cd799439014",
      "title": "Mathematics"
    },
    "results": [
      {
        "questionId": "q1",
        "answer": "Option A",
        "score": 10,
        "timeTaken": 120
      },
      {
        "questionId": "q2",
        "answer": "Option B",
        "score": 8,
        "timeTaken": 90
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**

**400 Bad Request - Missing chapterId:**
```json
{
  "success": false,
  "message": "Chapter ID is required"
}
```

**400 Bad Request - Invalid results format:**
```json
{
  "success": false,
  "message": "Results must be an array"
}
```

**404 Not Found - Chapter not found:**
```json
{
  "success": false,
  "message": "Chapter not found"
}
```

---

## 21. Get Chapter Result

Retrieve saved results/data for a student chapter.

**Endpoint:** `GET /api/student/chapter/result?chapterId=507f1f77bcf86cd799439011`

**Authentication:** Required (Student token)

**Query Parameters:**
- `chapterId` (required): The ID of the chapter

**Response:**
```json
{
  "success": true,
  "message": "Chapter result retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "student": {
      "_id": "507f1f77bcf86cd799439013",
      "userId": "ADGUSTU0001",
      "firstName": "John",
      "lastName": "Doe"
    },
    "chapter": {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Introduction to Mathematics",
      "order": 1
    },
    "subject": {
      "_id": "507f1f77bcf86cd799439014",
      "title": "Mathematics"
    },
    "results": [
      {
        "questionId": "q1",
        "answer": "Option A",
        "score": 10,
        "timeTaken": 120
      },
      {
        "questionId": "q2",
        "answer": "Option B",
        "score": 8,
        "timeTaken": 90
      },
      {
        "customField1": "value1",
        "customField2": "value2",
        "anyData": "can be stored here"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**

**400 Bad Request - Missing chapterId:**
```json
{
  "success": false,
  "message": "Chapter ID is required"
}
```

**404 Not Found - No results found:**
```json
{
  "success": false,
  "message": "No results found for this chapter"
}
```

---

## Course Purchase Notes

- Courses are standalone and not linked to categories
- Students can purchase courses individually
- Course content (chapters) is only accessible after purchase
- Payment is processed through Razorpay
- After successful payment verification, course access is activated immediately
- Students can view all their purchased courses in "My Courses"
- Course chapters support text (markdown), PDF, and video content
- All course files (thumbnails, PDFs, videos) are stored on AWS S3

