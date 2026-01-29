# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
Most endpoints require authentication. Include the JWT token in the request header:
```
Authorization: Bearer <token>
```

---

## Super Admin APIs

### 1. Super Admin Signup
**POST** `/api/super-admin/signup`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `email` (required): Email address
- `mobileNumber` (required): Mobile number
- `password` (required): Password
- `firstName` (required): First name
- `lastName` (required): Last name
- `profilePicture` (optional): Profile picture file (JPEG, PNG, GIF, WebP, max 5MB)

**Response:**
```json
{
  "success": true,
  "message": "Super Admin created successfully",
  "data": {
    "_id": "...",
    "userId": "ADGUSUP01",
    "email": "superadmin@example.com",
    "mobileNumber": "1234567890",
    "firstName": "Super",
    "lastName": "Admin",
    "role": "SUPER_ADMIN",
    "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-superadmin-ADGUSUP01.jpg",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Super Admin Login
**POST** `/api/super-admin/login`

**Request Body (can use email, mobileNumber, or userId):**
```json
{
  "identifier": "superadmin@example.com", // or mobileNumber or userId
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "_id": "...",
      "userId": "ADGUSUP01",
      "email": "superadmin@example.com",
      "mobileNumber": "1234567890",
      "firstName": "Super",
      "lastName": "Admin",
      "role": "SUPER_ADMIN",
      "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-superadmin-ADGUSUP01.jpg"
    }
  }
}
```

### 3. Create Admin (Protected)
**POST** `/api/super-admin/create-admin`

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

**Response:**
```json
{
  "success": true,
  "message": "Admin created successfully",
  "data": {
    "_id": "...",
    "userId": "ADGUADM01",
    "email": "admin@example.com",
    "mobileNumber": "1234567891",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN",
    "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-admin-ADGUADM01.jpg",
    "createdBy": "...",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4. Create Any Downline User (Protected)
**POST** `/api/super-admin/create-user`

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

**Response:**
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
    "createdBy": "...",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Note:** 
- Super Admin can create any downline user type
- User IDs are auto-generated
- Profile pictures are automatically optimized (resized to 800x800px, 80% quality) before upload

---

### 5. Get All Users (Protected)
**GET** `/api/super-admin/all-users`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "All users retrieved successfully",
  "data": [...],
  "count": 10
}
```

### 6. Get User Details with Decrypted Password (Protected)
**GET** `/api/super-admin/user/:userId?includePassword=true`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "User details retrieved successfully",
  "data": {
    "_id": "...",
    "userId": "ADGUSUP01",
    "email": "superadmin@example.com",
    "mobileNumber": "1234567890",
    "firstName": "Super",
    "lastName": "Admin",
    "role": "SUPER_ADMIN",
    "password": "password123", // decrypted password
    "encryptedPassword": "encrypted_string"
  }
}
```

---

## Admin APIs

### 1. Admin Signup
**POST** `/api/admin/signup`

**Request Body:**
```json
{
  "email": "admin@example.com",
  "mobileNumber": "1234567891",
  "password": "password123",
  "firstName": "Admin",
  "lastName": "User"
}
```

### 2. Admin Login
**POST** `/api/admin/login`

**Request Body:**
```json
{
  "identifier": "admin@example.com", // or mobileNumber or userId
  "password": "password123"
}
```

### 3. Create District Coordinator (Protected)
**POST** `/api/admin/create-district-coordinator`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "email": "dc@example.com",
  "mobileNumber": "1234567892",
  "password": "password123",
  "firstName": "District",
  "lastName": "Coordinator",
  "district": "District A"
}
```

**Response:**
```json
{
  "success": true,
  "message": "District Coordinator created successfully",
  "data": {
    "_id": "...",
    "userId": "ADGUDC01",
    "email": "dc@example.com",
    "mobileNumber": "1234567892",
    "firstName": "District",
    "lastName": "Coordinator",
    "district": "District A",
    "role": "DISTRICT_COORDINATOR",
    "createdBy": "..."
  }
}
```

### 4. Create Any Downline User (Protected)
**POST** `/api/admin/create-user`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "userType": "DISTRICT_COORDINATOR",  // DISTRICT_COORDINATOR, COORDINATOR, FIELD_MANAGER, TEAM_LEADER, FIELD_EMPLOYEE
  "email": "user@example.com",
  "mobileNumber": "1234567892",
  "password": "password123",
  "firstName": "First",
  "lastName": "Last",
  "district": "District A"  // Required for all types
}
```

**Response:**
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
    "role": "DISTRICT_COORDINATOR",
    "createdBy": "..."
  }
}
```

**Note:** Admin can create any downline user type. User IDs are auto-generated.

---

### 5. Get My Users (Protected)
**GET** `/api/admin/my-users`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [...],
  "count": 5
}
```

---

## District Coordinator APIs

### 1. District Coordinator Login
**POST** `/api/district-coordinator/login`

**Request Body:**
```json
{
  "identifier": "dc@example.com", // or mobileNumber or userId
  "password": "password123"
}
```

### 2. Create Coordinator (Protected)
**POST** `/api/district-coordinator/create-coordinator`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "email": "coordinator@example.com",
  "mobileNumber": "1234567893",
  "password": "password123",
  "firstName": "Coordinator",
  "lastName": "User",
  "district": "District A"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Coordinator created successfully",
  "data": {
    "_id": "...",
    "userId": "ADGUCO01",
    "email": "coordinator@example.com",
    "mobileNumber": "1234567893",
    "firstName": "Coordinator",
    "lastName": "User",
    "district": "District A",
    "role": "COORDINATOR",
    "createdBy": "..."
  }
}
```

### 3. Get My Users (Protected)
**GET** `/api/district-coordinator/my-users`

**Headers:**
```
Authorization: Bearer <token>
```

---

## Coordinator APIs

### 1. Coordinator Login
**POST** `/api/coordinator/login`

**Request Body:**
```json
{
  "identifier": "coordinator@example.com", // or mobileNumber or userId
  "password": "password123"
}
```

### 2. Create Field Manager (Protected)
**POST** `/api/coordinator/create-field-manager`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "email": "fm@example.com",
  "mobileNumber": "1234567894",
  "password": "password123",
  "firstName": "Field",
  "lastName": "Manager",
  "district": "District A"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Field Manager created successfully",
  "data": {
    "_id": "...",
    "userId": "ADGUFM01",
    "email": "fm@example.com",
    "mobileNumber": "1234567894",
    "firstName": "Field",
    "lastName": "Manager",
    "district": "District A",
    "role": "FIELD_MANAGER",
    "createdBy": "..."
  }
}
```

### 3. Get My Users (Protected)
**GET** `/api/coordinator/my-users`

**Headers:**
```
Authorization: Bearer <token>
```

---

## Field Manager APIs

### 1. Field Manager Login
**POST** `/api/field-manager/login`

**Request Body:**
```json
{
  "identifier": "fm@example.com", // or mobileNumber or userId
  "password": "password123"
}
```

### 2. Create Team Leader (Protected)
**POST** `/api/field-manager/create-team-leader`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "email": "tl@example.com",
  "mobileNumber": "1234567895",
  "password": "password123",
  "firstName": "Team",
  "lastName": "Leader",
  "district": "District A"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Team Leader created successfully",
  "data": {
    "_id": "...",
    "userId": "ADGUTL01",
    "email": "tl@example.com",
    "mobileNumber": "1234567895",
    "firstName": "Team",
    "lastName": "Leader",
    "district": "District A",
    "role": "TEAM_LEADER",
    "createdBy": "..."
  }
}
```

### 3. Get My Users (Protected)
**GET** `/api/field-manager/my-users`

**Headers:**
```
Authorization: Bearer <token>
```

---

## Team Leader APIs

### 1. Team Leader Login
**POST** `/api/team-leader/login`

**Request Body:**
```json
{
  "identifier": "tl@example.com", // or mobileNumber or userId
  "password": "password123"
}
```

### 2. Create Field Employee (Protected)
**POST** `/api/team-leader/create-field-employee`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "email": "fe@example.com",
  "mobileNumber": "1234567896",
  "password": "password123",
  "firstName": "Field",
  "lastName": "Employee",
  "district": "District A"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Field Employee created successfully",
  "data": {
    "_id": "...",
    "userId": "ADGUF01",
    "email": "fe@example.com",
    "mobileNumber": "1234567896",
    "firstName": "Field",
    "lastName": "Employee",
    "district": "District A",
    "role": "FIELD_EMPLOYEE",
    "createdBy": "..."
  }
}
```

### 3. Get My Users (Protected)
**GET** `/api/team-leader/my-users`

**Headers:**
```
Authorization: Bearer <token>
```

---

## Field Employee APIs

### 1. Field Employee Login
**POST** `/api/field-employee/login`

**Request Body:**
```json
{
  "identifier": "fe@example.com", // or mobileNumber or userId
  "password": "password123"
}
```

### 2. Get My Profile (Protected)
**GET** `/api/field-employee/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "_id": "...",
    "userId": "ADGUF01",
    "email": "fe@example.com",
    "mobileNumber": "1234567896",
    "firstName": "Field",
    "lastName": "Employee",
    "district": "District A",
    "role": "FIELD_EMPLOYEE"
  }
}
```

---

## User ID Format

- **Super Admin**: `ADGUSUP01`, `ADGUSUP02`, etc.
- **Admin**: `ADGUADM01`, `ADGUADM02`, etc.
- **District Coordinator**: `ADGUDC01`, `ADGUDC02`, etc.
- **Coordinator**: `ADGUCO01`, `ADGUCO02`, etc.
- **Field Manager**: `ADGUFM01`, `ADGUFM02`, etc.
- **Team Leader**: `ADGUTL01`, `ADGUTL02`, etc.
- **Field Employee**: `ADGUF01`, `ADGUF02`, etc.

---

## User Hierarchy

1. **Super Admin** → Can create: Admin, District Coordinator, Coordinator, Field Manager, Team Leader, Field Employee
2. **Admin** → Can create: District Coordinator, Coordinator, Field Manager, Team Leader, Field Employee
3. **District Coordinator** → Can create: Coordinator
4. **Coordinator** → Can create: Field Manager
5. **Field Manager** → Can create: Team Leader
6. **Team Leader** → Can create: Field Employee
7. **Field Employee** → Cannot create anyone

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error message here",
  "error": "Detailed error message (in development)"
}
```

### Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Password Encryption

- Passwords are encrypted using **crypto-js** with AES encryption
- Both `password` and `encryptedPassword` fields store the encrypted password
- To decrypt password, use the `/api/super-admin/user/:userId?includePassword=true` endpoint (Super Admin only)

---

## Notes

1. All login endpoints accept `identifier` which can be:
   - Email address
   - Mobile number
   - User ID (custom generated ID)

2. All protected routes require JWT token in the Authorization header

3. Super Admin can view all users in the system

4. Each user type can only view users they created or users in their hierarchy

5. User IDs are auto-generated based on user type and sequence number

