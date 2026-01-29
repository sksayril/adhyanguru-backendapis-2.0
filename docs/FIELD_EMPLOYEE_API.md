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

### 3. Get Wallet Balance
Get wallet balance and earnings information. (Protected)

**GET** `/wallet`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Wallet balance retrieved successfully",
  "data": {
    "userId": "ADGUF01",
    "name": "Field Employee",
    "wallet": {
      "balance": 150.50,
      "totalEarned": 200.00,
      "totalWithdrawn": 0
    }
  }
}
```

---

### 4. Get Wallet Transactions
Get wallet transaction history with pagination. (Protected)

**GET** `/wallet/transactions`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `type` (optional): Filter by transaction type (`COMMISSION`, `WITHDRAWAL`, `ADJUSTMENT`)

**Response (200):**
```json
{
  "success": true,
  "message": "Wallet transactions retrieved successfully",
  "data": {
    "transactions": [
      {
        "_id": "507f1f77bcf86cd799439020",
        "type": "COMMISSION",
        "amount": 10.00,
        "balanceAfter": 150.50,
        "relatedTransaction": {
          "type": "SUBSCRIPTION",
          "transactionId": "507f1f77bcf86cd799439021",
          "student": {
            "userId": "ADGUSTU01",
            "firstName": "John",
            "lastName": "Doe"
          },
          "amount": 100
        },
        "commissionDetails": {
          "percentage": 10,
          "baseAmount": 100
        },
        "description": "Commission from subscription - 10 (10%)",
        "status": "COMPLETED",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    }
  }
}
```

**Note:** 
- Field Employees receive commissions when students they referred purchase subscriptions or courses
- The referral code is automatically generated when a Field Employee is created (format: `FE` + 6 alphanumeric characters)
- Commission percentages are configurable by Super Admin through the Commission Settings API
- Super Admin can create and update commission settings using `/api/super-admin/commission-settings` endpoints:
  - `POST /api/super-admin/commission-settings` - Create initial commission settings
  - `PUT /api/super-admin/commission-settings` - Update existing commission settings
  - `GET /api/super-admin/commission-settings` - Get current commission settings
- Default commission percentages: Coordinator 40%, District Coordinator 10%, Team Leader 10%, Field Employee 10%

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

