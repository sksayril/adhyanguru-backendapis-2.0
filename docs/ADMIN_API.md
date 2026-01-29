# Admin API Documentation

## Base URL
```
http://localhost:3000/api/admin
```

## Endpoints

### 1. Signup
Create a new Admin account.

**POST** `/signup`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `email` (required): Email address
- `mobileNumber` (required): Mobile number
- `password` (required): Password
- `firstName` (required): First name
- `lastName` (required): Last name
- `profilePicture` (optional): Profile picture file (JPEG, PNG, GIF, WebP, max 5MB)

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
  "identifier": "admin@example.com",
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
      "_id": "507f1f77bcf86cd799439012",
      "userId": "ADGUADM01",
      "email": "admin@example.com",
      "mobileNumber": "1234567891",
      "firstName": "Admin",
      "lastName": "User",
      "role": "ADMIN",
      "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-admin-ADGUADM01.jpg"
    }
  }
}
```

---

### 3. Create District Coordinator
Create a new District Coordinator. (Protected - Requires Admin authentication)

**POST** `/create-district-coordinator`

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
- `district` (optional): District name (required if districtId not provided)
- `districtId` (optional): District ID to assign this coordinator to a specific district (preferred)
- `profilePicture` (optional): Profile picture file (JPEG, PNG, GIF, WebP, max 5MB)
- `areaRange` (optional): JSON string of GeoJSON Polygon coordinates (overrides district polygon)
- `boundingBox` (optional): JSON string of bounding box (overrides district bounding box)
- `latitude` (optional): Center latitude (overrides district center)
- `longitude` (optional): Center longitude (overrides district center)
- `coordinatorIds` (optional): Array or comma-separated string of Coordinator IDs to assign under this DC

**Response (201):**
```json
{
  "success": true,
  "message": "District Coordinator created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "userId": "ADGUDC01",
    "email": "dc@example.com",
    "mobileNumber": "1234567892",
    "firstName": "District",
    "lastName": "Coordinator",
    "district": "District A",
    "districtRef": "507f1f77bcf86cd799439015",
    "role": "DISTRICT_COORDINATOR",
    "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-district_coordinator-ADGUDC01.jpg",
    "createdBy": "507f1f77bcf86cd799439012",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 4. Get All District Coordinators
Retrieve all District Coordinators with optional filtering. (Protected)

**GET** `/district-coordinators`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `isActive` (optional): Filter by active status (true/false)

**Response (200):**
```json
{
  "success": true,
  "message": "District Coordinators retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "userId": "ADGUDC01",
      "email": "dc@example.com",
      "mobileNumber": "1234567892",
      "firstName": "District",
      "lastName": "Coordinator",
      "district": "District A",
      "districtRef": {
        "_id": "507f1f77bcf86cd799439015",
        "name": "District A"
      },
      "role": "DISTRICT_COORDINATOR",
      "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-dc-12345.jpg",
      "areaRange": {
        "type": "Polygon",
        "coordinates": [[[77.2, 28.5], [77.3, 28.5], [77.3, 28.6], [77.2, 28.6], [77.2, 28.5]]]
      },
      "boundingBox": {
        "minLatitude": 28.5,
        "maxLatitude": 28.6,
        "minLongitude": 77.2,
        "maxLongitude": 77.3
      },
      "latitude": 28.55,
      "longitude": 77.25,
      "isActive": true,
      "createdBy": {
        "_id": "507f1f77bcf86cd799439012",
        "userId": "ADGUADM01",
        "firstName": "Admin",
        "lastName": "User"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 5. Get District Coordinator Details
Get full details of a specific District Coordinator, including their decrypted password. (Protected)

**GET** `/district-coordinator/:id`

**Parameters:**
- `id` (path): MongoDB `_id` or `userId` (e.g., ADGUDC01)

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "District Coordinator details retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "userId": "ADGUDC01",
    "email": "dc@example.com",
    "mobileNumber": "1234567892",
    "password": "plainTextPassword123",
    "firstName": "District",
    "lastName": "Coordinator",
    "district": "District A",
    "districtRef": {
      "_id": "507f1f77bcf86cd799439015",
      "name": "District A",
      "centerPoint": { "latitude": 28.55, "longitude": 77.25 }
    },
    "role": "DISTRICT_COORDINATOR",
    "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-dc-12345.jpg",
    "areaRange": {
      "type": "Polygon",
      "coordinates": [[[77.2, 28.5], [77.3, 28.5], [77.3, 28.6], [77.2, 28.6], [77.2, 28.5]]]
    },
    "boundingBox": {
      "minLatitude": 28.5,
      "maxLatitude": 28.6,
      "minLongitude": 77.2,
      "maxLongitude": 77.3
    },
    "latitude": 28.55,
    "longitude": 77.25,
    "isActive": true,
    "createdBy": {
      "_id": "507f1f77bcf86cd799439012",
      "userId": "ADGUADM01",
      "firstName": "Admin",
      "lastName": "User"
    },
    "coordinators": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "userId": "ADGUCO01",
        "firstName": "Coordinator",
        "lastName": "User",
        "isActive": true
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 6. Get All Coordinators
Retrieve all Coordinators with optional filtering. (Protected)

**GET** `/coordinators`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `isActive` (optional): Filter by active status (true/false)

**Response (200):**
```json
{
  "success": true,
  "message": "Coordinators retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "userId": "ADGUCO01",
      "email": "coordinator@example.com",
      "mobileNumber": "1234567893",
      "firstName": "Coordinator",
      "lastName": "User",
      "district": "District A",
      "districtRef": {
        "_id": "507f1f77bcf86cd799439015",
        "name": "District A"
      },
      "role": "COORDINATOR",
      "areaRange": {
        "type": "Polygon",
        "coordinates": [[[77.22, 28.52], [77.28, 28.52], [77.28, 28.58], [77.22, 28.58], [77.22, 28.52]]]
      },
      "boundingBox": {
        "minLatitude": 28.52,
        "maxLatitude": 28.58,
        "minLongitude": 77.22,
        "maxLongitude": 77.28
      },
      "latitude": 28.55,
      "longitude": 77.25,
      "createdBy": {
        "_id": "507f1f77bcf86cd799439013",
        "userId": "ADGUDC01",
        "firstName": "District",
        "lastName": "Coordinator"
      },
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 7. Get Coordinator Details
Get full details of a specific Coordinator, including their decrypted password. (Protected)

**GET** `/coordinator/:id`

**Parameters:**
- `id` (path): MongoDB `_id` or `userId` (e.g., ADGUCO01)

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Coordinator details retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "userId": "ADGUCO01",
    "email": "coordinator@example.com",
    "mobileNumber": "1234567893",
    "password": "plainTextPassword123",
    "firstName": "Coordinator",
    "lastName": "User",
    "district": "District A",
    "districtRef": {
      "_id": "507f1f77bcf86cd799439015",
      "name": "District A"
    },
    "role": "COORDINATOR",
    "createdBy": {
      "_id": "507f1f77bcf86cd799439013",
      "userId": "ADGUDC01",
      "firstName": "District",
      "lastName": "Coordinator"
    },
    "profilePicture": "...",
    "areaRange": {
      "type": "Polygon",
      "coordinates": [[[77.22, 28.52], [77.28, 28.52], [77.28, 28.58], [77.22, 28.58], [77.22, 28.52]]]
    },
    "boundingBox": {
      "minLatitude": 28.52,
      "maxLatitude": 28.58,
      "minLongitude": 77.22,
      "maxLongitude": 77.28
    },
    "latitude": 28.55,
    "longitude": 77.25,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 8. Create Any Downline User (Protected)
Create any downline user type. Admin can create: District Coordinator, Coordinator, Field Manager, Team Leader, Field Employee.

**POST** `/create-user`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `userType` (required): DISTRICT_COORDINATOR, COORDINATOR, FIELD_MANAGER, TEAM_LEADER, FIELD_EMPLOYEE
- `email` (required): Email address
- `mobileNumber` (required): Mobile number
- `password` (required): Password
- `firstName` (required): First name
- `lastName` (required): Last name
- `district` (optional): District name (required if districtId not provided)
- `districtId` (optional): District ID to assign this coordinator to a specific district (preferred over district name)
- `profilePicture` (optional): Profile picture file (JPEG, PNG, GIF, WebP, max 5MB)
- `areaRange` (optional): JSON string of GeoJSON Polygon coordinates (e.g., `{"type":"Polygon","coordinates":[[[lng,lat],...]]}`)
- `boundingBox` (optional): JSON string of bounding box (e.g., `{"minLatitude":28.5,"maxLatitude":28.6,...}`)
- `latitude` (optional): Center latitude
- `longitude` (optional): Center longitude

**Response (201):**
```json
{
  "success": true,
  "message": "DISTRICT_COORDINATOR created successfully",
  "data": {
    "_id": "...",
    "userId": "ADGUDC01",
    "email": "user@example.com",
    "mobileNumber": "1234567892",
    "firstName": "First",
    "lastName": "Last",
        "district": "District A",
        "districtRef": "507f1f77bcf86cd799439015",
        "role": "DISTRICT_COORDINATOR",
        "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-district_coordinator-ADGUDC01.jpg",
    "createdBy": "...",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Note:** 
- User IDs are auto-generated based on user type
- District is required for all user types
- Profile pictures are automatically optimized (resized to 800x800px, 80% quality) before upload

---

### 9. Get My Users
Get all users under admin's hierarchy. (Protected)

**GET** `/my-users`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "_id": "...",
      "userId": "ADGUDC01",
      "email": "dc@example.com",
      "mobileNumber": "1234567892",
      "firstName": "District",
      "lastName": "Coordinator",
      "role": "DISTRICT_COORDINATOR",
      "district": "District A",
      "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-district_coordinator-ADGUDC01.jpg",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 5
}
```

---

### 10. Create District
Create a new district with area range. Admin or Super Admin can create districts.

**POST** `/district`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "North District",
  "description": "Northern region district",
  "areaRange": {
    "type": "Polygon",
    "coordinates": [[
      [77.2, 28.5],
      [77.3, 28.5],
      [77.3, 28.6],
      [77.2, 28.6],
      [77.2, 28.5]
    ]]
  },
  "boundingBox": {
    "minLatitude": 28.5,
    "maxLatitude": 28.6,
    "minLongitude": 77.2,
    "maxLongitude": 77.3
  },
  "centerPoint": {
    "latitude": 28.55,
    "longitude": 77.25
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "District created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "name": "North District",
    "description": "Northern region district",
    "areaRange": {
      "type": "Polygon",
      "coordinates": [[[77.2, 28.5], [77.3, 28.5], [77.3, 28.6], [77.2, 28.6], [77.2, 28.5]]]
    },
    "boundingBox": {
      "minLatitude": 28.5,
      "maxLatitude": 28.6,
      "minLongitude": 77.2,
      "maxLongitude": 77.3
    },
        "centerPoint": {
          "latitude": 28.55,
          "longitude": 77.25
        },
        "districtCoordinator": null,
        "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Note:**
- `areaRange` uses GeoJSON Polygon format: `[[[lng, lat], [lng, lat], ...]]`
- `boundingBox` is optional but useful for simple rectangular boundaries
- `centerPoint` is optional but recommended for map display
- `districtCoordinatorId` is NOT accepted - districts are created without coordinators
- District coordinators should be created with `districtId` parameter to assign them to districts

---

### 11. Get All Districts
Retrieve all districts with optional filtering.

**GET** `/districts`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `isActive` (optional): Filter by active status (true/false)

**Response (200):**
```json
{
  "success": true,
  "message": "Districts retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "name": "North District",
      "description": "Northern region district",
      "areaRange": {
        "type": "Polygon",
        "coordinates": [[[77.2, 28.5], [77.3, 28.5], [77.3, 28.6], [77.2, 28.6], [77.2, 28.5]]]
      },
      "boundingBox": {
        "minLatitude": 28.5,
        "maxLatitude": 28.6,
        "minLongitude": 77.2,
        "maxLongitude": 77.3
      },
      "centerPoint": {
        "latitude": 28.55,
        "longitude": 77.25
      },
      "districtCoordinator": {
        "_id": "507f1f77bcf86cd799439013",
        "userId": "ADGUDC01",
        "firstName": "District",
        "lastName": "Coordinator"
      },
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 12. Update District
Update district details including area range.

**PUT** `/district/:districtId`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "North District Updated",
  "description": "Updated description",
  "areaRange": {
    "type": "Polygon",
    "coordinates": [[
      [77.2, 28.5],
      [77.4, 28.5],
      [77.4, 28.7],
      [77.2, 28.7],
      [77.2, 28.5]
    ]]
  },
  "boundingBox": {
    "minLatitude": 28.5,
    "maxLatitude": 28.7,
    "minLongitude": 77.2,
    "maxLongitude": 77.4
  },
  "centerPoint": {
    "latitude": 28.6,
    "longitude": 77.3
  },
  "isActive": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "District updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "name": "North District Updated",
    "description": "Updated description",
    "areaRange": {
      "type": "Polygon",
      "coordinates": [[[77.2, 28.5], [77.4, 28.5], [77.4, 28.7], [77.2, 28.7], [77.2, 28.5]]]
    },
    "boundingBox": {
      "minLatitude": 28.5,
      "maxLatitude": 28.7,
      "minLongitude": 77.2,
      "maxLongitude": 77.4
    },
    "centerPoint": {
      "latitude": 28.6,
      "longitude": 77.3
    },
    "districtCoordinator": {
      "_id": "507f1f77bcf86cd799439013",
      "userId": "ADGUDC01",
      "firstName": "District",
      "lastName": "Coordinator"
    },
    "isActive": true,
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 13. Assign District to District Coordinator
Assign a district to a district coordinator.

**POST** `/district/assign`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "districtId": "507f1f77bcf86cd799439015",
  "districtCoordinatorId": "507f1f77bcf86cd799439013"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "District assigned to District Coordinator successfully",
  "data": {
    "district": {
      "_id": "507f1f77bcf86cd799439015",
      "name": "North District",
      "districtCoordinator": {
        "_id": "507f1f77bcf86cd799439013",
        "userId": "ADGUDC01",
        "firstName": "District",
        "lastName": "Coordinator"
      }
    },
    "districtCoordinator": {
      "_id": "507f1f77bcf86cd799439013",
      "userId": "ADGUDC01",
      "firstName": "District",
      "lastName": "Coordinator",
      "districtRef": "507f1f77bcf86cd799439015"
    }
  }
}
```

---

### 14. Assign Area Range to Coordinator
Assign area range to a coordinator (can be smaller than district).

**POST** `/coordinator/area-range`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "coordinatorId": "507f1f77bcf86cd799439014",
  "districtId": "507f1f77bcf86cd799439015",
  "areaRange": {
    "type": "Polygon",
    "coordinates": [[
      [77.22, 28.52],
      [77.28, 28.52],
      [77.28, 28.58],
      [77.22, 28.58],
      [77.22, 28.52]
    ]]
  },
  "boundingBox": {
    "minLatitude": 28.52,
    "maxLatitude": 28.58,
    "minLongitude": 77.22,
    "maxLongitude": 77.28
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Area range assigned to Coordinator successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "userId": "ADGUCO01",
    "firstName": "Coordinator",
    "lastName": "User",
    "areaRange": {
      "type": "Polygon",
      "coordinates": [[[77.22, 28.52], [77.28, 28.52], [77.28, 28.58], [77.22, 28.58], [77.22, 28.52]]]
    },
    "boundingBox": {
      "minLatitude": 28.52,
      "maxLatitude": 28.58,
      "minLongitude": 77.22,
      "maxLongitude": 77.28
    },
    "districtRef": "507f1f77bcf86cd799439015",
    "district": "North District"
  }
}
```

**Note:**
- Coordinator's area range can be smaller than the district's area range
- This allows multiple coordinators to cover different areas within the same district
- `districtId` is optional if coordinator already has a district assigned

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
  "message": "District Coordinator already exists with this email or mobile number"
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
  "message": "You don't have permission to create DISTRICT_COORDINATOR"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Error creating district coordinator",
  "error": "Detailed error message"
}
```

