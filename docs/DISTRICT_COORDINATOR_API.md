# District Coordinator API Documentation

## Base URL
```
http://localhost:3023/api/district-coordinator
```

## Endpoints

### 1. Login
Login with email, mobile number, or user ID.

**POST** `/login`

**Request Body:**
```json
{
  "identifier": "dc@example.com",
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
      "_id": "507f1f77bcf86cd799439013",
      "userId": "ADGUDC01",
      "email": "dc@example.com",
      "mobileNumber": "1234567892",
      "firstName": "District",
      "lastName": "Coordinator",
      "role": "DISTRICT_COORDINATOR",
      "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-district_coordinator-ADGUDC01.jpg",
      "district": "District A",
      "admin": {
        "_id": "507f1f77bcf86cd799439012",
        "userId": "ADGUADM01",
        "firstName": "Admin",
        "lastName": "User",
        "email": "admin@example.com"
      }
    }
  }
}
```

---

### 2. Get Profile
Get the profile of the current logged-in District Coordinator. (Protected)

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
    "_id": "507f1f77bcf86cd799439013",
    "userId": "ADGUDC01",
    "email": "dc@example.com",
    "mobileNumber": "1234567892",
    "firstName": "District",
    "lastName": "Coordinator",
    "role": "DISTRICT_COORDINATOR",
    "profilePicture": "...",
    "district": "District A",
    "districtRef": {
      "_id": "507f1f77bcf86cd799439015",
      "name": "District A",
      "areaRange": { "type": "Polygon", "coordinates": [...] }
    },
    "admin": {
      "_id": "507f1f77bcf86cd799439012",
      "userId": "ADGUADM01",
      "firstName": "Admin",
      "lastName": "User"
    },
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 3. Update Profile
Update the profile of the current logged-in District Coordinator. (Protected)

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

### 4. Create Team Leader
Create a new Team Leader. (Protected - Requires District Coordinator authentication)

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
- `district` (optional): District name (defaults to DC's district)
- `profilePicture` (optional): Profile picture file
- `areaRange` (optional): JSON string of GeoJSON Polygon coordinates
- `boundingBox` (optional): JSON string of bounding box
- `latitude` (optional): Center latitude
- `longitude` (optional): Center longitude

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
    "districtRef": {
      "_id": "507f1f77bcf86cd799439015",
      "name": "District A",
      "description": "District A description",
      "areaRange": { "type": "Polygon", "coordinates": [...] },
      "boundingBox": { "minLatitude": ..., "maxLatitude": ... },
      "centerPoint": { "latitude": 28.55, "longitude": 77.25 }
    },
    "areaRange": { "type": "Polygon", "coordinates": [...] },
    "boundingBox": { "minLatitude": ..., "maxLatitude": ... },
    "latitude": 28.55,
    "longitude": 77.25,
    "role": "TEAM_LEADER",
    "createdBy": {
      "_id": "507f1f77bcf86cd799439013",
      "userId": "ADGUDC01",
      "firstName": "District",
      "lastName": "Coordinator",
      "email": "dc@example.com",
      "mobileNumber": "1234567892",
      "profilePicture": "..."
    },
    "createdByModel": "DistrictCoordinator",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 5. Get All Team Leaders
Retrieve all Team Leaders created by the current District Coordinator. Returns only team leaders created by the authenticated district coordinator. (Protected)

**GET** `/team-leaders`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Team Leaders retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439016",
      "userId": "ADGUTL01",
      "email": "tl@example.com",
      "mobileNumber": "1234567895",
      "firstName": "Team",
      "lastName": "Leader",
      "district": "District A",
      "districtRef": {
        "_id": "507f1f77bcf86cd799439015",
        "name": "District A",
        "description": "District A description",
        "areaRange": { "type": "Polygon", "coordinates": [...] },
        "boundingBox": { "minLatitude": ..., "maxLatitude": ... },
        "centerPoint": { "latitude": 28.55, "longitude": 77.25 }
      },
      "areaRange": { "type": "Polygon", "coordinates": [...] },
      "boundingBox": { "minLatitude": ..., "maxLatitude": ... },
      "latitude": 28.55,
      "longitude": 77.25,
      "role": "TEAM_LEADER",
      "isActive": true,
      "createdBy": {
        "_id": "507f1f77bcf86cd799439013",
        "userId": "ADGUDC01",
        "firstName": "District",
        "lastName": "Coordinator",
        "email": "dc@example.com",
        "mobileNumber": "1234567892",
        "profilePicture": "..."
      },
      "createdByModel": "DistrictCoordinator",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 6. Get Team Leader Details
Get full details of a specific Team Leader, including their decrypted password. **Only returns team leaders created by the authenticated district coordinator.** If the team leader was not created by the current district coordinator, a 404 error will be returned. (Protected)

**GET** `/team-leader/:id`

**Parameters:**
- `id` (path): MongoDB `_id` or `userId` (e.g., ADGUTL01)

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Team Leader details retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439016",
    "userId": "ADGUTL01",
    "email": "tl@example.com",
    "mobileNumber": "1234567895",
    "password": "plainTextPassword123",
    "firstName": "Team",
    "lastName": "Leader",
    "district": "District A",
    "districtRef": {
      "_id": "507f1f77bcf86cd799439015",
      "name": "District A",
      "description": "District A description",
      "areaRange": { "type": "Polygon", "coordinates": [...] },
      "boundingBox": { "minLatitude": ..., "maxLatitude": ... },
      "centerPoint": { "latitude": 28.55, "longitude": 77.25 }
    },
    "areaRange": { "type": "Polygon", "coordinates": [...] },
    "boundingBox": { "minLatitude": ..., "maxLatitude": ... },
    "latitude": 28.55,
    "longitude": 77.25,
    "role": "TEAM_LEADER",
    "isActive": true,
    "createdBy": {
      "_id": "507f1f77bcf86cd799439013",
      "userId": "ADGUDC01",
      "firstName": "District",
      "lastName": "Coordinator",
      "email": "dc@example.com",
      "mobileNumber": "1234567892",
      "profilePicture": "..."
    },
    "createdByModel": "DistrictCoordinator",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Team Leader not found or you don't have permission to view this team leader"
}
```

---

### 7. Get My Users
Get users under current District Coordinator. Returns only **Coordinators**. (Protected)

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
      "_id": "507f1f77bcf86cd799439014",
      "userId": "ADGUCO01",
      "email": "coordinator@example.com",
      "mobileNumber": "1234567893",
      "firstName": "Coordinator",
      "lastName": "User",
      "role": "COORDINATOR",
      "district": "District A",
      "profilePicture": "..."
    }
  ],
  "count": 1
}
```

