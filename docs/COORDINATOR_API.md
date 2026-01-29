# Coordinator API Documentation

## Base URL
```
http://localhost:3000/api/coordinator
```

## Endpoints

### 1. Login
Login with email, mobile number, or user ID.

**POST** `/login`

**Request Body:**
```json
{
  "identifier": "coordinator@example.com",
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
      "_id": "507f1f77bcf86cd799439014",
      "userId": "ADGUCO01",
      "email": "coordinator@example.com",
      "mobileNumber": "1234567893",
      "firstName": "Coordinator",
      "lastName": "User",
      "role": "COORDINATOR",
      "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-coordinator-ADGUCO01.jpg",
      "district": "District A",
      "districtCoordinator": {
        "_id": "507f1f77bcf86cd799439013",
        "userId": "ADGUDC01",
        "firstName": "District",
        "lastName": "Coordinator",
        "email": "dc@example.com"
      }
    }
  }
}
```

---

### 2. Get Profile
Get the profile of the current logged-in Coordinator. (Protected)

**GET** `/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "userId": "ADGUCO01",
    "email": "coordinator@example.com",
    "mobileNumber": "1234567893",
    "firstName": "Coordinator",
    "lastName": "User",
    "role": "COORDINATOR",
    "profilePicture": "...",
    "district": "District A",
    "districtRef": {
      "_id": "507f1f77bcf86cd799439015",
      "name": "District A",
      "areaRange": { "type": "Polygon", "coordinates": [...] }
    },
    "districtCoordinator": {
      "_id": "507f1f77bcf86cd799439013",
      "userId": "ADGUDC01",
      "firstName": "District",
      "lastName": "Coordinator",
      "profilePicture": "..."
    },
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 3. Update Profile
Update the profile of the current logged-in Coordinator. (Protected)

**PUT** `/profile`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `firstName` (optional)
- `lastName` (optional)
- `email` (optional)
- `mobileNumber` (optional)
- `profilePicture` (optional)
- `latitude` (optional)
- `longitude` (optional)

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { ... }
}
```

---

### 4. Create Field Manager
Create a new Field Manager. (Protected - Requires Coordinator authentication)

**POST** `/create-field-manager`

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
- `district` (required): District name
- `profilePicture` (optional): Profile picture file (JPEG, PNG, GIF, WebP, max 5MB)

**Response (201):**
```json
{
  "success": true,
  "message": "Field Manager created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "userId": "ADGUFM01",
    "email": "fm@example.com",
    "mobileNumber": "1234567894",
    "firstName": "Field",
    "lastName": "Manager",
    "district": "District A",
    "role": "FIELD_MANAGER",
    "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-field_manager-ADGUFM01.jpg",
    "createdBy": "507f1f77bcf86cd799439014",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 5. Get My Users
Get users related to current coordinator. Returns the parent **District Coordinator**. (Protected)

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
      "_id": "507f1f77bcf86cd799439013",
      "userId": "ADGUDC01",
      "email": "dc@example.com",
      "mobileNumber": "1234567892",
      "firstName": "District",
      "lastName": "Coordinator",
      "role": "DISTRICT_COORDINATOR",
      "district": "District A",
      "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-dc-ADGUDC01.jpg"
    }
  ],
  "count": 1
}

---

### 6. Get User Details
Get full details of a specific user (e.g., the parent District Coordinator). (Protected)

**GET** `/user/:id`

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
  "message": "User details retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "userId": "ADGUDC01",
    "email": "dc@example.com",
    "mobileNumber": "1234567892",
    "firstName": "District",
    "lastName": "Coordinator",
    "role": "DISTRICT_COORDINATOR",
    "district": "District A",
    "districtRef": {
      "_id": "507f1f77bcf86cd799439015",
      "name": "District A",
      "centerPoint": { "latitude": 28.55, "longitude": 77.25 }
    },
    "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-dc-ADGUDC01.jpg",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```
```

---

## Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Field Manager already exists with this email or mobile number"
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
  "message": "You don't have permission to create FIELD_MANAGER"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Error creating field manager",
  "error": "Detailed error message"
}
```

