# Generic User Creation API

## Overview

Super Admin and Admin can now create **any** downline user type directly, not just their immediate subordinates. This provides more flexibility in user management.

## Super Admin Capabilities

Super Admin can create:
- ✅ **ADMIN**
- ✅ **DISTRICT_COORDINATOR**
- ✅ **COORDINATOR**
- ✅ **FIELD_MANAGER**
- ✅ **TEAM_LEADER**
- ✅ **FIELD_EMPLOYEE**

## Admin Capabilities

Admin can create:
- ✅ **DISTRICT_COORDINATOR**
- ✅ **COORDINATOR**
- ✅ **FIELD_MANAGER**
- ✅ **TEAM_LEADER**
- ✅ **FIELD_EMPLOYEE**

## API Endpoints

### Super Admin - Create Any Downline User

**POST** `/api/super-admin/create-user`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "userType": "ADMIN",  // Required: ADMIN, DISTRICT_COORDINATOR, COORDINATOR, FIELD_MANAGER, TEAM_LEADER, FIELD_EMPLOYEE
  "email": "user@example.com",  // Required
  "mobileNumber": "1234567890",  // Required
  "password": "password123",  // Required
  "firstName": "First",  // Required
  "lastName": "Last",  // Required
  "district": "District A"  // Required for all types except ADMIN
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "ADMIN created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": "ADGUADM01",  // Auto-generated
    "email": "user@example.com",
    "mobileNumber": "1234567890",
    "firstName": "First",
    "lastName": "Last",
    "role": "ADMIN",
    "createdBy": "507f1f77bcf86cd799439011"  // Super Admin's _id
  }
}
```

### Admin - Create Any Downline User

**POST** `/api/admin/create-user`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "userType": "DISTRICT_COORDINATOR",  // Required: DISTRICT_COORDINATOR, COORDINATOR, FIELD_MANAGER, TEAM_LEADER, FIELD_EMPLOYEE
  "email": "user@example.com",  // Required
  "mobileNumber": "1234567890",  // Required
  "password": "password123",  // Required
  "firstName": "First",  // Required
  "lastName": "Last",  // Required
  "district": "District A"  // Required for all types
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "DISTRICT_COORDINATOR created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "userId": "ADGUDC01",  // Auto-generated
    "email": "user@example.com",
    "mobileNumber": "1234567890",
    "firstName": "First",
    "lastName": "Last",
    "district": "District A",
    "role": "DISTRICT_COORDINATOR",
    "createdBy": "507f1f77bcf86cd799439012"  // Admin's _id
  }
}
```

## User ID Generation

User IDs are automatically generated based on user type:

- **ADMIN**: `ADGUADM01`, `ADGUADM02`, etc.
- **DISTRICT_COORDINATOR**: `ADGUDC01`, `ADGUDC02`, etc.
- **COORDINATOR**: `ADGUCO01`, `ADGUCO02`, etc.
- **FIELD_MANAGER**: `ADGUFM01`, `ADGUFM02`, etc.
- **TEAM_LEADER**: `ADGUTL01`, `ADGUTL02`, etc.
- **FIELD_EMPLOYEE**: `ADGUF01`, `ADGUF02`, etc.

## Field Requirements

### For ADMIN (Super Admin only):
- ✅ email
- ✅ mobileNumber
- ✅ password
- ✅ firstName
- ✅ lastName
- ❌ district (not required)

### For All Other Types:
- ✅ email
- ✅ mobileNumber
- ✅ password
- ✅ firstName
- ✅ lastName
- ✅ district (required)

## Authorization

- The API automatically checks if the authenticated user has permission to create the specified user type
- Super Admin can create all downline types
- Admin can create all downline types (except Admin)
- Other roles can only create their immediate subordinates (using their specific endpoints)

## Error Responses

### 400 Bad Request - Invalid User Type
```json
{
  "success": false,
  "message": "Invalid user type. Allowed types: ADMIN, DISTRICT_COORDINATOR, ..."
}
```

### 400 Bad Request - Missing Fields
```json
{
  "success": false,
  "message": "Missing required fields: email, mobileNumber, password, firstName, lastName"
}
```

### 400 Bad Request - Missing District
```json
{
  "success": false,
  "message": "District is required for this user type"
}
```

### 403 Forbidden - No Permission
```json
{
  "success": false,
  "message": "You don't have permission to create DISTRICT_COORDINATOR"
}
```

### 500 Internal Server Error - User Already Exists
```json
{
  "success": false,
  "message": "Error creating ADMIN",
  "error": "ADMIN already exists with this email or mobile number"
}
```

## Examples

### Example 1: Super Admin creates a Field Employee directly

```bash
POST /api/super-admin/create-user
Authorization: Bearer <super_admin_token>

{
  "userType": "FIELD_EMPLOYEE",
  "email": "employee@example.com",
  "mobileNumber": "1234567896",
  "password": "password123",
  "firstName": "Field",
  "lastName": "Employee",
  "district": "District A"
}
```

### Example 2: Admin creates a Coordinator directly

```bash
POST /api/admin/create-user
Authorization: Bearer <admin_token>

{
  "userType": "COORDINATOR",
  "email": "coordinator@example.com",
  "mobileNumber": "1234567893",
  "password": "password123",
  "firstName": "Coordinator",
  "lastName": "User",
  "district": "District B"
}
```

## Notes

1. **User IDs are auto-generated** - You don't need to provide a userId, it's automatically generated based on the user type and sequence number.

2. **createdBy field** - The `createdBy` field will reference the creator's MongoDB `_id`, maintaining the hierarchy relationship.

3. **Password encryption** - All passwords are automatically encrypted using AES encryption before storage.

4. **Unique constraints** - Email and mobileNumber must be unique across all user types.

5. **Backward compatibility** - The specific creation endpoints (e.g., `/create-admin`, `/create-district-coordinator`) still work and are maintained for backward compatibility.

