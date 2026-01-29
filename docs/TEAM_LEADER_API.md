# Team Leader API Documentation

## Base URL
```
http://localhost:3000/api/team-leader
```

## Endpoints

### 1. Login
Login with email, mobile number, or user ID.

**POST** `/login`

**Request Body:**
```json
{
  "identifier": "tl@example.com",
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
      "_id": "507f1f77bcf86cd799439016",
      "userId": "ADGUTL01",
      "email": "tl@example.com",
      "mobileNumber": "1234567895",
      "firstName": "Team",
      "lastName": "Leader",
      "role": "TEAM_LEADER",
      "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-team_leader-ADGUTL01.jpg"
    }
  }
}
```

---

### 2. Create Field Employee
Create a new Field Employee. (Protected - Requires Team Leader authentication)

**POST** `/create-field-employee`

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
- `districtId` (required): District ID (ObjectId of the District)
- `profilePicture` (optional): Profile picture file (JPEG, PNG, GIF, WebP, max 5MB)

**Response (201):**
```json
{
  "success": true,
  "message": "Field Employee created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439017",
    "userId": "ADGUF01",
    "email": "fe@example.com",
    "mobileNumber": "1234567896",
    "firstName": "Field",
    "lastName": "Employee",
    "district": "District A",
    "districtRef": "507f1f77bcf86cd799439015",
    "role": "FIELD_EMPLOYEE",
    "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-field_employee-ADGUF01.jpg",
    "createdBy": "507f1f77bcf86cd799439016",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 3. Get My Users
Get all field employees under team leader. (Protected)

**GET** `/my-users`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Field employees retrieved successfully",
  "data": [
    {
      "_id": "...",
      "userId": "ADGUF01",
      "email": "fe@example.com",
      "mobileNumber": "1234567896",
      "firstName": "Field",
      "lastName": "Employee",
      "role": "FIELD_EMPLOYEE",
      "district": "District A",
      "districtRef": {
        "_id": "507f1f77bcf86cd799439015",
        "name": "District A",
        "description": "District description",
        "areaRange": {...},
        "boundingBox": {...},
        "centerPoint": {...}
      },
      "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-field_employee-ADGUF01.jpg",
      "latitude": null,
      "longitude": null,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 5
}
```

---

### 4. Get Field Employee Details
Get detailed information about a specific field employee by ID. (Protected - Only returns employees created by the authenticated team leader)

**GET** `/field-employee/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Parameters:**
- `id` (required): Field Employee ID (can be MongoDB _id or userId like "ADGUF01")

**Response (200):**
```json
{
  "success": true,
  "message": "Field Employee details retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439017",
    "userId": "ADGUF01",
    "email": "fe@example.com",
    "mobileNumber": "1234567896",
    "password": "decrypted_password",
    "encryptedPassword": "encrypted_password_string",
    "firstName": "Field",
    "lastName": "Employee",
    "role": "FIELD_EMPLOYEE",
    "district": "District A",
    "districtRef": {
      "_id": "507f1f77bcf86cd799439015",
      "name": "District A",
      "description": "District description",
      "areaRange": {...},
      "boundingBox": {...},
      "centerPoint": {...}
    },
    "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-field_employee-ADGUF01.jpg",
    "latitude": null,
    "longitude": null,
    "isActive": true,
    "createdBy": {
      "_id": "507f1f77bcf86cd799439016",
      "userId": "ADGUTL01",
      "firstName": "Team",
      "lastName": "Leader",
      "email": "tl@example.com",
      "mobileNumber": "1234567895",
      "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-team_leader-ADGUTL01.jpg"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Field Employee not found or you don't have permission to view this employee"
}
```

---

## Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Field Employee already exists with this email or mobile number"
}
```

**400 Bad Request - Missing Fields:**
```json
{
  "success": false,
  "message": "Missing required fields: email, mobileNumber, password, firstName, lastName"
}
```

**400 Bad Request - Missing districtId:**
```json
{
  "success": false,
  "message": "districtId is required"
}
```

**404 Not Found - District:**
```json
{
  "success": false,
  "message": "District not found with the provided districtId"
}
```

**400 Bad Request - Inactive District:**
```json
{
  "success": false,
  "message": "District is not active"
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
  "message": "You don't have permission to create FIELD_EMPLOYEE"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Error creating field employee",
  "error": "Detailed error message"
}
```

