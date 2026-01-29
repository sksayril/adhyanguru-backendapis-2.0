# Field Employee API Documentation

## Base URL
```
http://localhost:3023/api/field-employee
```

## Endpoints

### 1. Login
Login with email, mobile number, or user ID.

**POST** `/login`

**Request Body:**
```json
{
  "identifier": "fe@example.com",
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
      "_id": "507f1f77bcf86cd799439017",
      "userId": "ADGUF01",
      "email": "fe@example.com",
      "mobileNumber": "1234567896",
      "firstName": "Field",
      "lastName": "Employee",
      "role": "FIELD_EMPLOYEE",
      "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-field_employee-ADGUF01.jpg"
    }
  }
}
```

---

### 2. Get My Profile
Get own profile information. (Protected)

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
    "_id": "507f1f77bcf86cd799439017",
    "userId": "ADGUF01",
    "email": "fe@example.com",
    "mobileNumber": "1234567896",
    "firstName": "Field",
    "lastName": "Employee",
    "district": "District A",
    "role": "FIELD_EMPLOYEE",
    "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-field_employee-ADGUF01.jpg",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## Error Responses

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
  "message": "Account is deactivated"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Field employee not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Login failed",
  "error": "Detailed error message"
}
```

