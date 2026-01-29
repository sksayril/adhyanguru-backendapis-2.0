# Plan Management API Documentation

## Base URL
```
http://localhost:3000/api/super-admin
```

## Overview
Plans are subscription plans associated with sub categories. Each sub category can have up to 4 plans:
- 1 Month Plan (`1_MONTH`)
- 3 Months Plan (`3_MONTHS`)
- 6 Months Plan (`6_MONTHS`)
- 1 Year Plan (`1_YEAR`)

Each sub category can have only one plan per duration type.

---

## Endpoints

### 1. Create Plan
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

### 2. Create Multiple Plans
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

**Note:** If some plans fail to create (e.g., duplicate duration), the response will include an `errors` array with details, but successfully created plans will still be returned.

---

### 3. Get All Plans
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

### 4. Get Plans by Sub Category
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

### 5. Get Plan by ID
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

### 6. Update Plan
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

### 7. Delete Plan
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
- Plans are specific to sub categories - each sub category can have its own set of plans

---

## Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Plan with duration 1_MONTH already exists for this sub category"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Sub category not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Error creating plan",
  "error": "Detailed error message"
}
```

