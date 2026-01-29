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

---

### 7. Get Dashboard
Get comprehensive dashboard with sign-ups, subscriptions, growth chart, and performance metrics. (Protected)

**GET** `/dashboard?period=30`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `period` (optional): Number of days for growth chart data (default: 30)

**Response (200):**
```json
{
  "success": true,
  "message": "Dashboard data retrieved successfully",
  "data": {
    "coordinator": {
      "userId": "ADGUCO01",
      "firstName": "Coordinator",
      "lastName": "User",
      "email": "coordinator@example.com"
    },
    "wallet": {
      "balance": 1200.50,
      "totalEarned": 1500.00,
      "totalWithdrawn": 299.50
    },
    "overview": {
      "totalSignUps": 150,
      "totalSubscriptionUsers": 85,
      "totalCourseUsers": 45,
      "totalRevenue": {
        "subscriptions": 85000,
        "courses": 135000,
        "total": 220000
      },
      "totalCommissions": 88000,
      "hierarchyCounts": {
        "districtCoordinators": 3,
        "teamLeaders": 12,
        "fieldEmployees": 48
      }
    },
    "growthChart": {
      "period": "30 days",
      "data": [
        {
          "date": "2024-01-01",
          "signUps": 5,
          "subscriptions": 3
        },
        {
          "date": "2024-01-02",
          "signUps": 8,
          "subscriptions": 4
        }
      ]
    },
    "recentActivity": {
      "signUps": [
        {
          "userId": "ADGUSTU01",
          "name": "John Doe",
          "email": "john@example.com",
          "mobileNumber": "1234567890",
          "referredBy": {
            "userId": "ADGUF01",
            "name": "Field Employee",
            "referralCode": "FE1A2B3C"
          },
          "createdAt": "2024-01-15T10:30:00.000Z"
        }
      ],
      "subscriptions": [
        {
          "student": {
            "userId": "ADGUSTU01",
            "name": "John Doe"
          },
          "plan": {
            "duration": "1_MONTH",
            "amount": 999
          },
          "subCategory": "Mathematics",
          "amount": 999,
          "createdAt": "2024-01-15T10:30:00.000Z"
        }
      ],
      "commissions": [
        {
          "amount": 40.00,
          "student": {
            "userId": "ADGUSTU01",
            "name": "John Doe"
          },
          "description": "Commission from subscription - 40 (40%)",
          "createdAt": "2024-01-15T10:30:00.000Z"
        }
      ]
    }
  }
}
```

**Note:** 
- Dashboard includes all students registered under the coordinator's hierarchy (through referral system)
- Growth chart shows daily sign-ups and subscriptions for the specified period
- Recent activity shows the last 10 sign-ups, subscriptions, and commissions
- Total revenue includes both subscription and course purchase revenue
- Hierarchy counts show the number of users in the coordinator's network

---

### 8. Get Admin Contact Information
Get the admin's contact details (email and mobile number) for support purposes. (Protected)

**GET** `/admin-contact`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Admin contact information retrieved successfully",
  "data": {
    "admin": {
      "userId": "ADGUAD01",
      "name": "Admin User",
      "email": "admin@example.com",
      "mobileNumber": "1234567890"
    },
    "supportInfo": {
      "email": "admin@example.com",
      "contactNumber": "1234567890",
      "message": "Contact your admin for support and assistance"
    }
  }
}
```

**Note:**
- Returns the admin who created the district coordinator that created this coordinator
- Use this information to contact the admin for support and assistance
- The admin's email and mobile number are provided for direct contact

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

---

### 9. Get Wallet Balance
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
    "userId": "ADGUCO01",
    "name": "Coordinator User",
    "wallet": {
      "balance": 1200.50,
      "totalEarned": 1500.00,
      "totalWithdrawn": 299.50
    }
  }
}
```

---

### 10. Get Wallet Transactions
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
        "amount": 40.00,
        "balanceAfter": 1200.50,
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
          "percentage": 40,
          "baseAmount": 100
        },
        "description": "Commission from subscription - 40 (40%)",
        "status": "COMPLETED",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 30,
      "pages": 2
    }
  }
}
```**Note:** 
- Coordinators receive commissions when students referred by Field Employees in their hierarchy purchase subscriptions or courses
- Commission percentages are configurable by Super Admin through the Commission Settings API
- Super Admin can create and update commission settings using `/api/super-admin/commission-settings` endpoints:
  - `POST /api/super-admin/commission-settings` - Create initial commission settings
  - `PUT /api/super-admin/commission-settings` - Update existing commission settings
  - `GET /api/super-admin/commission-settings` - Get current commission settings
- Default commission percentages: Coordinator 40%, District Coordinator 10%, Team Leader 10%, Field Employee 10%
