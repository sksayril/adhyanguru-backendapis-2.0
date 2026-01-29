# Field Manager API Documentation

## Base URL
```
http://localhost:3000/api/field-manager
```

## Endpoints

### 1. Login
Login with email, mobile number, or user ID.

**POST** `/login`

**Request Body:**
```json
{
  "identifier": "fm@example.com",
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
      "_id": "507f1f77bcf86cd799439015",
      "userId": "ADGUFM01",
      "email": "fm@example.com",
      "mobileNumber": "1234567894",
      "firstName": "Field",
      "lastName": "Manager",
      "role": "FIELD_MANAGER",
      "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-field_manager-ADGUFM01.jpg"
    }
  }
}
```

---

### 2. Create Team Leader
Create a new Team Leader. (Protected - Requires Field Manager authentication)

**POST** `/create-team-leader`

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
  "message": "Team Leader created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439016",
    "userId": "ADGUTL01",
    "email": "tl@example.com",
    "mobileNumber": "1234567895",
    "firstName": "Team",
    "lastName": "Leader",
    "district": "District A",
    "role": "TEAM_LEADER",
    "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-team_leader-ADGUTL01.jpg",
    "createdBy": "507f1f77bcf86cd799439015",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 3. Get My Users
Get all users under field manager's hierarchy. (Protected)

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
      "userId": "ADGUTL01",
      "email": "tl@example.com",
      "mobileNumber": "1234567895",
      "firstName": "Team",
      "lastName": "Leader",
      "role": "TEAM_LEADER",
      "district": "District A",
      "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-team_leader-ADGUTL01.jpg",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 3
}
```

---

## Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Team Leader already exists with this email or mobile number"
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
  "message": "You don't have permission to create TEAM_LEADER"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Error creating team leader",
  "error": "Detailed error message"
}
```

