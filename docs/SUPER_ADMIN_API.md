# Super Admin API Documentation

## Base URL
```
http://localhost:3000/api/super-admin
```

## Endpoints

### 1. Signup
Create a new Super Admin account.

**POST** `/signup`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `email` (required): Email address
- `mobileNumber` (required): Mobile number
- `password` (required): Password
- `firstName` (required): First name
- `lastName` (required): Last name
- `profilePicture` (optional): Profile picture file (JPEG, PNG, GIF, WebP, max 5MB)

**Request Example (JSON for reference):**
```json
{
  "email": "superadmin@example.com",
  "mobileNumber": "1234567890",
  "password": "password123",
  "firstName": "Super",
  "lastName": "Admin"
}
```

**Note:** When uploading profile picture, use `multipart/form-data` instead of JSON.

**Response (201):**
```json
{
  "success": true,
  "message": "Super Admin created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "ADGUSUP01",
    "email": "superadmin@example.com",
    "mobileNumber": "1234567890",
    "firstName": "Super",
    "lastName": "Admin",
    "role": "SUPER_ADMIN",
    "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-superadmin-ADGUSUP01.jpg",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 2. Login
Login with email, mobile number, or user ID.

**POST** `/login`

**Request Body:**
```json
{
  "identifier": "superadmin@example.com",
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
      "_id": "507f1f77bcf86cd799439011",
      "userId": "ADGUSUP01",
      "email": "superadmin@example.com",
      "mobileNumber": "1234567890",
      "firstName": "Super",
      "lastName": "Admin",
      "role": "SUPER_ADMIN",
      "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-superadmin-ADGUSUP01.jpg",
      "latitude": 28.6139,
      "longitude": 77.2090
    }
  }
}
```

---

### 3. Logout
Logout from the system. Note: Since JWT tokens are stateless, the client should remove the token from storage after logout.

**POST** `/logout`

**Request Body:**
```json
{}
```

**Note:** No authentication required. The client should delete the token from local storage/session after receiving success response.

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### 4. Create Admin
Create a new Admin user. (Protected - Requires Super Admin authentication)

**POST** `/create-admin`

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
- `latitude` (optional): Latitude coordinate (decimal number)
- `longitude` (optional): Longitude coordinate (decimal number)

**Response (201):**
```json
{
  "success": true,
  "message": "Admin created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "userId": "ADGUADM01",
    "email": "admin@example.com",
    "mobileNumber": "1234567891",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN",
    "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-admin-ADGUADM01.jpg",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "createdBy": "507f1f77bcf86cd799439011",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 5. Create Any Downline User (Protected)
Create any downline user type. Super Admin can create: Admin, District Coordinator, Coordinator, Field Manager, Team Leader, Field Employee.

**POST** `/create-user`

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
- `latitude` (optional): Latitude coordinate (decimal number)
- `longitude` (optional): Longitude coordinate (decimal number)

**Response (201):**
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
    "latitude": 28.6139,
    "longitude": 77.2090,
    "createdBy": "...",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Note:** 
- User IDs are auto-generated based on user type
- District is required for all user types except ADMIN
- Profile pictures are automatically optimized (resized to 800x800px, 80% quality) before upload

---

### 6. Get All Users
Get all users in the system. (Protected - Super Admin only)

**GET** `/all-users`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "All users retrieved successfully",
  "data": [
    {
      "_id": "...",
      "userId": "ADGUSUP01",
      "email": "...",
      "role": "SUPER_ADMIN"
    },
    {
      "_id": "...",
      "userId": "ADGUADM01",
      "email": "...",
      "role": "ADMIN"
    }
  ],
  "count": 10
}
```

---

### 7. Get Commission Settings
Get current commission settings configured for the referral system. (Protected - Super Admin only)

**GET** `/commission-settings`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Commission settings retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439030",
    "coordinatorPercentage": 40,
    "districtCoordinatorPercentage": 10,
    "teamLeaderPercentage": 10,
    "fieldEmployeePercentage": 10,
    "updatedBy": {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "ADGUSUP01",
      "firstName": "Super",
      "lastName": "Admin"
    },
    "updatedByModel": "SuperAdmin",
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Note:** If no settings exist, default values are returned (Coordinator: 40%, District Coordinator: 10%, Team Leader: 10%, Field Employee: 10%).

---

### 8. Create Commission Settings
Create initial commission settings for the referral system. (Protected - Super Admin only)

**POST** `/commission-settings`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "coordinatorPercentage": 40,
  "districtCoordinatorPercentage": 10,
  "teamLeaderPercentage": 10,
  "fieldEmployeePercentage": 10
}
```

**Request Body Fields (all required):**
- `coordinatorPercentage` (required): Commission percentage for Coordinators (0-100)
- `districtCoordinatorPercentage` (required): Commission percentage for District Coordinators (0-100)
- `teamLeaderPercentage` (required): Commission percentage for Team Leaders (0-100)
- `fieldEmployeePercentage` (required): Commission percentage for Field Employees (0-100)

**Response (201):**
```json
{
  "success": true,
  "message": "Commission settings created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439030",
    "coordinatorPercentage": 40,
    "districtCoordinatorPercentage": 10,
    "teamLeaderPercentage": 10,
    "fieldEmployeePercentage": 10,
    "updatedBy": "507f1f77bcf86cd799439011",
    "updatedByModel": "SuperAdmin",
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Validation:**
- All percentages must be between 0 and 100
- All four percentages are required
- Cannot create if active settings already exist (use PUT to update instead)

**Error Response (400) - If settings already exist:**
```json
{
  "success": false,
  "message": "Commission settings already exist. Use PUT /commission-settings to update them."
}
```

**Error Response (400) - Missing fields:**
```json
{
  "success": false,
  "message": "All commission percentages are required: coordinatorPercentage, districtCoordinatorPercentage, teamLeaderPercentage, fieldEmployeePercentage"
}
```

---

### 9. Update Commission Settings
Update commission percentages for the referral system. (Protected - Super Admin only)

**PUT** `/commission-settings`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "coordinatorPercentage": 40,
  "districtCoordinatorPercentage": 10,
  "teamLeaderPercentage": 10,
  "fieldEmployeePercentage": 10
}
```

**Note:** All fields are optional. Only provided fields will be updated. Previous settings are deactivated and new settings are created (maintains history).

**Response (200):**
```json
{
  "success": true,
  "message": "Commission settings updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439031",
    "coordinatorPercentage": 40,
    "districtCoordinatorPercentage": 10,
    "teamLeaderPercentage": 10,
    "fieldEmployeePercentage": 10,
    "updatedBy": "507f1f77bcf86cd799439011",
    "updatedByModel": "SuperAdmin",
    "isActive": true,
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

**Validation:**
- All percentages must be between 0 and 100
- At least one percentage must be provided

**Error Response (400):**
```json
{
  "success": false,
  "message": "coordinatorPercentage must be a number between 0 and 100"
}
```

---

### 10. Get Dashboard
Get comprehensive dashboard with all metrics, revenue, expenses, user statistics, and charts. Optimized using aggregation pipelines for fast response. (Protected)

**GET** `/dashboard?period=30`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `period` (optional): Number of days for charts and period-based metrics (default: 30)

**Response (200):**
```json
{
  "success": true,
  "message": "Dashboard data retrieved successfully",
  "data": {
    "overview": {
      "totalUsers": 1500,
      "userBreakdown": {
        "students": 1200,
        "admins": 5,
        "coordinators": 20,
        "districtCoordinators": 15,
        "teamLeaders": 50,
        "fieldEmployees": 210
      },
      "activeUsers": {
        "students": 850,
        "total": 850
      },
      "inactiveUsers": {
        "students": 350,
        "total": 350,
        "note": "Users with no activity in last 10 days"
      }
    },
    "revenue": {
      "period": {
        "subscriptions": 85000,
        "courses": 135000,
        "total": 220000,
        "transactions": 250,
        "netRevenue": 180000
      },
      "allTime": {
        "subscriptions": 500000,
        "courses": 800000,
        "total": 1300000,
        "netRevenue": 1100000
      }
    },
    "expenses": {
      "period": {
        "total": 40000,
        "transactions": 200
      },
      "allTime": {
        "total": 200000
      },
      "note": "Total commissions paid out to coordinators, district coordinators, team leaders, and field employees"
    },
    "userCounts": {
      "students": 1200,
      "admins": 5,
      "coordinators": 20,
      "districtCoordinators": 15,
      "teamLeaders": 50,
      "fieldEmployees": 210
    },
    "growthChart": {
      "period": "30 days",
      "data": [
        {
          "date": "2024-01-01",
          "signUps": 25
        },
        {
          "date": "2024-01-02",
          "signUps": 30
        }
      ]
    },
    "salesChart": {
      "period": "30 days",
      "topSubcategories": [
        {
          "subCategory": "Mathematics",
          "subCategoryId": "507f1f77bcf86cd799439020",
          "totalSales": 50000,
          "transactions": 150
        },
        {
          "subCategory": "Science",
          "subCategoryId": "507f1f77bcf86cd799439021",
          "totalSales": 35000,
          "transactions": 100
        }
      ],
      "topCourses": [
        {
          "course": "Advanced Mathematics Course",
          "courseId": "507f1f77bcf86cd799439022",
          "totalSales": 80000,
          "transactions": 80
        },
        {
          "course": "Physics Fundamentals",
          "courseId": "507f1f77bcf86cd799439023",
          "totalSales": 55000,
          "transactions": 55
        }
      ]
    },
    "recentActivity": {
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
      "coursePurchases": [
        {
          "student": {
            "userId": "ADGUSTU02",
            "name": "Jane Smith"
          },
          "course": {
            "title": "Advanced Mathematics Course",
            "price": 2000
          },
          "amount": 2000,
          "createdAt": "2024-01-15T11:00:00.000Z"
        }
      ]
    }
  }
}
```

**Note:**
- Dashboard uses MongoDB aggregation pipelines for optimal performance
- Active users are determined by activity (subscriptions, course purchases, or new signups) in the last 10 days
- Inactive users are users with no activity in the last 10 days
- Revenue includes both subscription and course purchase revenue
- Expenses represent total commissions paid out
- Net revenue = Total revenue - Total expenses
- Growth chart shows daily user sign-ups
- Sales chart shows top 10 subcategories and courses by sales volume
- All metrics are calculated using efficient aggregation pipelines

---

### 11. Get Server Health Check
Get comprehensive server health check including database connectivity, system metrics, memory usage, and performance indicators. (Protected)

**GET** `/health`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Health check completed",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "health": {
    "status": "healthy",
    "message": "All systems operational",
    "issues": []
  },
  "server": {
    "status": "running",
    "platform": "win32",
    "arch": "x64",
    "hostname": "DESKTOP-ABC123",
    "nodeVersion": "v20.19.4",
    "uptime": 86400,
    "uptimeFormatted": "1d 0h 0m 0s"
  },
  "database": {
    "connected": true,
    "state": "connected",
    "responseTime": 15,
    "error": null,
    "stats": {
      "collections": 25,
      "dataSize": "125.5 MB",
      "storageSize": "200.3 MB",
      "indexes": 45,
      "indexSize": "12.8 MB",
      "objects": 15000
    }
  },
  "memory": {
    "process": {
      "rss": "150.5 MB",
      "heapTotal": "50.2 MB",
      "heapUsed": "35.8 MB",
      "external": "5.2 MB",
      "arrayBuffers": "2.1 MB"
    },
    "system": {
      "total": "16 GB",
      "free": "8 GB",
      "used": "8 GB",
      "usagePercent": "50.00"
    }
  },
  "cpu": {
    "cores": 8,
    "model": "Intel(R) Core(TM) i7-9700K CPU @ 3.60GHz",
    "loadAverage": [1.5, 1.2, 1.0]
  },
  "performance": {
    "apiResponseTime": "25ms",
    "databaseResponseTime": "15ms"
  }
}
```

**Health Status Values:**
- `healthy`: All systems operational
- `warning`: Some issues detected but system is functional
- `unhealthy`: Critical issues detected

**Common Issues:**
- `Database is not connected`: MongoDB connection is down
- `High memory usage`: System memory usage exceeds 90%
- `Slow database response`: Database response time exceeds 1000ms

**Note:**
- Health check endpoint is lightweight and can be called frequently for monitoring
- Database stats are only included when database is connected
- Response time includes all health check operations
- System metrics are real-time snapshots

---

### 12. Get Analytics Report
Get comprehensive financial analytics report including trial balance, income statement, balance sheet, money distribution, and commission breakdown. Optimized using aggregation pipelines for fast response. (Protected - Super Admin only)

**GET** `/analytics?period=all&startDate=2024-01-01&endDate=2024-12-31`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `period` (optional): Time period (`all`, `today`, `week`, `month`, `year`) - default: `all`
- `startDate` (optional): Custom start date (YYYY-MM-DD format) - overrides period
- `endDate` (optional): Custom end date (YYYY-MM-DD format) - overrides period

**Response (200):**
```json
{
  "success": true,
  "message": "Analytics report retrieved successfully",
  "period": "Last 30 Days",
  "dateRange": {
    "createdAt": {
      "$gte": "2024-01-01T00:00:00.000Z",
      "$lte": "2024-01-31T23:59:59.999Z"
    }
  },
  "data": {
    "trialBalance": {
      "debits": {
        "expenses": 40000,
        "walletBalances": 50000,
        "total": 90000
      },
      "credits": {
        "revenue": 220000,
        "total": 220000
      },
      "balance": 130000
    },
    "incomeStatement": {
      "revenue": {
        "subscriptions": 85000,
        "courses": 135000,
        "total": 220000
      },
      "expenses": {
        "commissions": 40000,
        "total": 40000
      },
      "netIncome": 180000,
      "grossProfit": 220000,
      "operatingExpenses": 40000
    },
    "balanceSheet": {
      "assets": {
        "cash": 130000,
        "accountsReceivable": 0,
        "total": 130000
      },
      "liabilities": {
        "accountsPayable": 50000,
        "commissionsPayable": 10000,
        "total": 60000
      },
      "equity": {
        "retainedEarnings": 70000,
        "total": 70000
      },
      "total": 260000
    },
    "revenue": {
      "subscriptions": {
        "total": 85000,
        "count": 150
      },
      "courses": {
        "total": 135000,
        "count": 100
      },
      "total": 220000,
      "totalTransactions": 250
    },
    "expenses": {
      "total": 40000,
      "count": 200,
      "byRole": {
        "Coordinator": 16000,
        "DistrictCoordinator": 4000,
        "TeamLeader": 10000,
        "FieldEmployee": 10000
      }
    },
    "commissionDistribution": {
      "byRole": {
        "Coordinator": {
          "totalCommissions": 16000,
          "transactions": 80,
          "uniqueUsers": 5
        },
        "DistrictCoordinator": {
          "totalCommissions": 4000,
          "transactions": 40,
          "uniqueUsers": 3
        },
        "TeamLeader": {
          "totalCommissions": 10000,
          "transactions": 50,
          "uniqueUsers": 10
        },
        "FieldEmployee": {
          "totalCommissions": 10000,
          "transactions": 30,
          "uniqueUsers": 25
        }
      },
      "total": 40000
    },
    "walletBalances": {
      "coordinators": {
        "totalBalance": 20000,
        "totalEarned": 50000,
        "totalWithdrawn": 30000,
        "count": 5
      },
      "districtCoordinators": {
        "totalBalance": 10000,
        "totalEarned": 20000,
        "totalWithdrawn": 10000,
        "count": 3
      },
      "teamLeaders": {
        "totalBalance": 15000,
        "totalEarned": 30000,
        "totalWithdrawn": 15000,
        "count": 10
      },
      "fieldEmployees": {
        "totalBalance": 5000,
        "totalEarned": 15000,
        "totalWithdrawn": 10000,
        "count": 25
      },
      "total": {
        "balance": 50000,
        "earned": 115000,
        "withdrawn": 65000
      }
    },
    "moneyDistribution": {
      "byRole": {
        "Coordinator": [
          {
            "month": "2024-01",
            "amount": 8000,
            "transactions": 40
          },
          {
            "month": "2024-02",
            "amount": 8000,
            "transactions": 40
          }
        ],
        "DistrictCoordinator": [
          {
            "month": "2024-01",
            "amount": 2000,
            "transactions": 20
          }
        ]
      },
      "summary": {
        "Coordinator": 16000,
        "DistrictCoordinator": 4000,
        "TeamLeader": 10000,
        "FieldEmployee": 10000
      }
    },
    "transactionSummary": {
      "walletTransactions": {
        "COMMISSION": {
          "total": 40000,
          "count": 200
        },
        "WITHDRAWAL": {
          "total": -30000,
          "count": 50
        }
      },
      "subscriptions": {
        "COMPLETED": {
          "total": 85000,
          "count": 150
        }
      },
      "coursePurchases": {
        "COMPLETED": {
          "total": 135000,
          "count": 100
        }
      }
    }
  }
}
```

**Financial Reports Explained:**

1. **Trial Balance:**
   - **Debits**: Expenses + Wallet Balances (money owed to users)
   - **Credits**: Total Revenue
   - **Balance**: Net difference (should match net income)

2. **Income Statement:**
   - **Revenue**: Subscriptions + Course Purchases
   - **Expenses**: Commissions paid out
   - **Net Income**: Revenue - Expenses

3. **Balance Sheet:**
   - **Assets**: Cash (net revenue after expenses and pending payouts)
   - **Liabilities**: Accounts Payable (wallet balances) + Commissions Payable (unpaid commissions)
   - **Equity**: Retained Earnings (net income - wallet balances)

4. **Money Distribution:**
   - Breakdown of commission payments by role
   - Monthly distribution trends
   - Summary totals by role

**Note:**
- All calculations use MongoDB aggregation pipelines for optimal performance
- Date filtering supports custom ranges or predefined periods
- Wallet balances represent money owed to users (liabilities)
- Net income represents actual profit after all expenses
- Assets = Cash available after accounting for all liabilities

---

### 18. Create Thumbnail
Create a new thumbnail with title and image. Image is processed and stored in S3. (Protected - Super Admin only)

**POST** `/thumbnails`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `title` (required): Thumbnail title (unique)
- `image` (required): Image file (JPEG, PNG, GIF, WebP, max 5MB)
- `description` (optional): Description of the thumbnail
- `order` (optional): Display order (default: 0)

**Response (201):**
```json
{
  "success": true,
  "message": "Thumbnail created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "title": "Mathematics Thumbnail",
    "image": "https://your-bucket.s3.amazonaws.com/thumbnails/1234567890-mathematics-thumbnail.jpg",
    "description": "Mathematics category thumbnail",
    "order": 1,
    "isActive": true,
    "createdBy": "507f1f77bcf86cd799439011",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 19. Get All Thumbnails (Super Admin)
Get all thumbnails with pagination and filtering. (Protected - Super Admin only)

**GET** `/thumbnails?page=1&limit=20&isActive=true&sortBy=order&sortOrder=asc`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `isActive` (optional): Filter by active status (`true`/`false`)
- `sortBy` (optional): Sort field (default: `order`)
- `sortOrder` (optional): Sort order (`asc`/`desc`, default: `asc`)

**Response (200):**
```json
{
  "success": true,
  "message": "Thumbnails retrieved successfully",
  "data": {
    "thumbnails": [
      {
        "_id": "507f1f77bcf86cd799439020",
        "title": "Mathematics Thumbnail",
        "image": "https://your-bucket.s3.amazonaws.com/thumbnails/1234567890-mathematics-thumbnail.jpg",
        "description": "Mathematics category thumbnail",
        "order": 1,
        "isActive": true,
        "createdBy": {
          "_id": "507f1f77bcf86cd799439011",
          "userId": "ADGUSUP01",
          "firstName": "Super",
          "lastName": "Admin"
        },
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 10,
      "pages": 1
    }
  }
}
```

---

### 20. Get Thumbnail by ID (Super Admin)
Get a specific thumbnail by ID. (Protected - Super Admin only)

**GET** `/thumbnails/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Thumbnail retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "title": "Mathematics Thumbnail",
    "image": "https://your-bucket.s3.amazonaws.com/thumbnails/1234567890-mathematics-thumbnail.jpg",
    "description": "Mathematics category thumbnail",
    "order": 1,
    "isActive": true,
    "createdBy": {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "ADGUSUP01",
      "firstName": "Super",
      "lastName": "Admin"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 21. Update Thumbnail
Update thumbnail title, description, order, image, or active status. (Protected - Super Admin only)

**PUT** `/thumbnails/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `title` (optional): New title (must be unique)
- `image` (optional): New image file (JPEG, PNG, GIF, WebP, max 5MB)
- `description` (optional): New description
- `order` (optional): New display order
- `isActive` (optional): Active status (`true`/`false`)

**Response (200):**
```json
{
  "success": true,
  "message": "Thumbnail updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "title": "Updated Mathematics Thumbnail",
    "image": "https://your-bucket.s3.amazonaws.com/thumbnails/1234567891-updated-mathematics-thumbnail.jpg",
    "description": "Updated description",
    "order": 2,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

**Note:** 
- When updating the image, the old image is automatically deleted from S3
- New images are processed with reduced quality (60%) and resized to max 600x600px
- All images are converted to JPEG format for consistency and smaller file size

---

### 22. Delete Thumbnail
Delete a thumbnail and its image from S3. (Protected - Super Admin only)

**DELETE** `/thumbnails/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Thumbnail deleted successfully"
}
```

**Note:** 
- The image file is automatically deleted from S3 when the thumbnail is deleted
- Thumbnails are optimized with 60% quality and max 600x600px dimensions for faster loading

---

### 17. Get User Details
Get user details with optional decrypted password. (Protected - Super Admin only)

**GET** `/user/:userId?includePassword=true`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `includePassword` (optional): Set to `true` to include decrypted password

**Response (200):**
```json
{
  "success": true,
  "message": "User details retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "ADGUSUP01",
    "email": "superadmin@example.com",
    "mobileNumber": "1234567890",
    "firstName": "Super",
    "lastName": "Admin",
    "role": "SUPER_ADMIN",
    "isActive": true,
    "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-superadmin-ADGUSUP01.jpg",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "password": "password123",
    "encryptedPassword": "U2FsdGVkX1..."
  }
}
```

---

## Setup Requirements

### Environment Variables

Add these to your `.env` file:

```env
# Database
DATABASE_URL=mongodb://localhost:27017/adhyanguru

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ENCRYPTION_KEY=your-encryption-secret-key-change-this-in-production

# AWS S3 Configuration (for profile pictures)
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-s3-bucket-name

# Server
PORT=3000
```

### AWS S3 Setup

1. Create an S3 bucket in AWS
2. Configure bucket permissions for public read access
3. Create IAM user with S3 permissions
4. Add credentials to `.env` file

See `PROFILE_PICTURE_UPLOAD.md` for detailed S3 setup instructions.

---

## Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "User already exists with this email or mobile number"
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
  "message": "You don't have permission to create ADMIN"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "User not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Error creating super admin",
  "error": "Detailed error message"
}
```

---

## Subject Management APIs

### 13. Create Subject
Create a new subject under a main category and sub category. (Protected - Super Admin only)

**POST** `/api/super-admin/subject`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `title` (required): Subject title
- `description` (optional): Subject description
- `mainCategoryId` (required): Main category ID
- `subCategoryId` (required): Sub category ID
- `boardId` (optional): Board ID (optional - can be assigned later)
- `thumbnail` (optional): Subject thumbnail image file (JPEG, PNG, GIF, WebP, max 5MB)

**Response (201):**
```json
{
  "success": true,
  "message": "Subject created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "title": "Mathematics Fundamentals",
    "description": "Basic mathematics concepts",
    "thumbnail": "https://your-bucket.s3.amazonaws.com/subject-thumbnail-1234567892-mathematics-fundamentals.jpg",
    "mainCategory": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Education",
      "description": "Educational courses and materials",
      "image": "https://your-bucket.s3.amazonaws.com/main-category-1234567890-education.jpg"
    },
    "subCategory": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Mathematics",
      "description": "Math courses and tutorials",
      "image": "https://your-bucket.s3.amazonaws.com/sub-category-1234567891-mathematics.jpg"
    },
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 14. Get All Subjects
Get all subjects with optional filters. (Protected - Super Admin only)

**GET** `/api/super-admin/subject?mainCategoryId=xxx&subCategoryId=xxx&isActive=true`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `mainCategoryId` (optional): Filter by main category ID
- `subCategoryId` (optional): Filter by sub category ID
- `isActive` (optional): Filter by active status (`true` or `false`)

**Response (200):**
```json
{
  "success": true,
  "message": "Subjects retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "title": "Mathematics Fundamentals",
      "description": "Basic mathematics concepts",
      "thumbnail": "https://your-bucket.s3.amazonaws.com/subject-thumbnail-1234567892-mathematics-fundamentals.jpg",
      "mainCategory": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Education",
        "description": "Educational courses and materials",
        "image": "https://your-bucket.s3.amazonaws.com/main-category-1234567890-education.jpg"
      },
      "subCategory": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Mathematics",
        "description": "Math courses and tutorials",
        "image": "https://your-bucket.s3.amazonaws.com/sub-category-1234567891-mathematics.jpg"
      },
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

### 15. Get Subject by ID
Get a specific subject by ID with its chapters. (Protected - Super Admin only)

**GET** `/api/super-admin/subject/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Subject retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "title": "Mathematics Fundamentals",
    "description": "Basic mathematics concepts",
    "thumbnail": "https://your-bucket.s3.amazonaws.com/subject-thumbnail-1234567892-mathematics-fundamentals.jpg",
    "mainCategory": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Education",
      "description": "Educational courses and materials",
      "image": "https://your-bucket.s3.amazonaws.com/main-category-1234567890-education.jpg"
    },
    "subCategory": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Mathematics",
      "description": "Math courses and tutorials",
      "image": "https://your-bucket.s3.amazonaws.com/sub-category-1234567891-mathematics.jpg"
    },
    "board": null,
    "isActive": true,
    "createdBy": {
      "_id": "507f1f77bcf86cd799439013",
      "userId": "ADGUSUP01",
      "firstName": "Super",
      "lastName": "Admin"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "chapters": [
      {
        "_id": "507f1f77bcf86cd799439015",
        "title": "Introduction to Algebra",
        "description": "Basic algebra concepts",
        "order": 1,
        "content": {
          "text": "# Introduction\n\nThis chapter covers basic algebra...",
          "pdf": null,
          "video": null
        },
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

### 16. Update Subject
Update an existing subject. (Protected - Super Admin only)

**PUT** `/api/super-admin/subject/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `title` (optional): Subject title
- `description` (optional): Subject description
- `mainCategoryId` (optional): Main category ID
- `subCategoryId` (optional): Sub category ID
- `boardId` (optional): Board ID - Set to assign/update board, set to `null` or empty string to remove board assignment
- `isActive` (optional): Active status (`true` or `false`)
- `thumbnail` (optional): New thumbnail image file (JPEG, PNG, GIF, WebP, max 5MB)

**Response (200):**
```json
{
  "success": true,
  "message": "Subject updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "title": "Updated Mathematics Fundamentals",
    "description": "Updated description",
    "thumbnail": "https://your-bucket.s3.amazonaws.com/subject-thumbnail-1234567893-updated-mathematics-fundamentals.jpg",
    "mainCategory": {...},
    "subCategory": {...},
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

---

### 17. Delete Subject
Delete a subject. Cannot delete if it has chapters. (Protected - Super Admin only)

**DELETE** `/api/super-admin/subject/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Subject deleted successfully"
}
```

**Error Response (400) - If subject has chapters:**
```json
{
  "success": false,
  "message": "Cannot delete subject. It has 5 chapter(s). Please delete chapters first."
}
```

---

## Chapter Management APIs

### 18. Create Chapter
Create a new chapter for a subject. Supports text (markdown), PDF, and video content. (Protected - Super Admin only)

**POST** `/api/super-admin/chapter`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `title` (required): Chapter title
- `description` (optional): Chapter description
- `subjectId` (required): Subject ID
- `order` (optional): Chapter order number (auto-assigned if not provided)
- `textContent` (optional): Markdown text content
- `pdf` (optional): PDF file (max 50MB)
- `video` (optional): Video file (max 500MB)

**Response (201):**
```json
{
  "success": true,
  "message": "Chapter created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "title": "Introduction to Algebra",
    "description": "Basic algebra concepts",
    "subject": {
      "_id": "507f1f77bcf86cd799439014",
      "title": "Mathematics Fundamentals",
      "description": "Basic mathematics concepts",
      "thumbnail": "https://your-bucket.s3.amazonaws.com/subject-thumbnail-1234567892-mathematics-fundamentals.jpg"
    },
    "order": 1,
    "content": {
      "text": "# Introduction\n\nThis chapter covers basic algebra concepts...",
      "pdf": {
        "url": "https://your-bucket.s3.amazonaws.com/chapter-pdf-1234567894-introduction-to-algebra.pdf",
        "fileName": "algebra-intro.pdf"
      },
      "video": {
        "url": "https://your-bucket.s3.amazonaws.com/chapter-video-1234567895-introduction-to-algebra.mp4",
        "fileName": "algebra-intro.mp4"
      }
    },
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 19. Get Chapters by Subject
Get all chapters for a specific subject. (Protected - Super Admin only)

**GET** `/api/super-admin/chapter/subject/:subjectId?isActive=true`

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
  "message": "Chapters retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "title": "Introduction to Algebra",
      "description": "Basic algebra concepts",
      "order": 1,
      "content": {
        "text": "# Introduction\n\nThis chapter covers basic algebra...",
        "pdf": {
          "url": "https://your-bucket.s3.amazonaws.com/chapter-pdf-1234567894-introduction-to-algebra.pdf",
          "fileName": "algebra-intro.pdf"
        },
        "video": {
          "url": "https://your-bucket.s3.amazonaws.com/chapter-video-1234567895-introduction-to-algebra.mp4",
          "fileName": "algebra-intro.mp4"
        }
      },
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 20. Get Chapter by ID
Get a specific chapter by ID. (Protected - Super Admin only)

**GET** `/api/super-admin/chapter/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Chapter retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "title": "Introduction to Algebra",
    "description": "Basic algebra concepts",
    "subject": {
      "_id": "507f1f77bcf86cd799439014",
      "title": "Mathematics Fundamentals",
      "description": "Basic mathematics concepts",
      "thumbnail": "https://your-bucket.s3.amazonaws.com/subject-thumbnail-1234567892-mathematics-fundamentals.jpg",
      "mainCategory": {...},
      "subCategory": {...}
    },
    "order": 1,
    "content": {
      "text": "# Introduction\n\nThis chapter covers basic algebra...",
      "pdf": {
        "url": "https://your-bucket.s3.amazonaws.com/chapter-pdf-1234567894-introduction-to-algebra.pdf",
        "fileName": "algebra-intro.pdf"
      },
      "video": {
        "url": "https://your-bucket.s3.amazonaws.com/chapter-video-1234567895-introduction-to-algebra.mp4",
        "fileName": "algebra-intro.mp4"
      }
    },
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

### 21. Update Chapter
Update an existing chapter. (Protected - Super Admin only)

**PUT** `/api/super-admin/chapter/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `title` (optional): Chapter title
- `description` (optional): Chapter description
- `order` (optional): Chapter order number
- `textContent` (optional): Markdown text content
- `isActive` (optional): Active status (`true` or `false`)
- `pdf` (optional): New PDF file (max 50MB) - replaces existing PDF
- `video` (optional): New video file (max 500MB) - replaces existing video

**Response (200):**
```json
{
  "success": true,
  "message": "Chapter updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "title": "Updated Introduction to Algebra",
    "description": "Updated description",
    "order": 1,
    "content": {
      "text": "# Updated Introduction\n\nUpdated content...",
      "pdf": {...},
      "video": {...}
    },
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

---

### 22. Delete Chapter
Delete a chapter. (Protected - Super Admin only)

**DELETE** `/api/super-admin/chapter/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Chapter deleted successfully"
}
```

---

## Notes

- Subject thumbnails are automatically processed with Jimp (resized to 800x800px, 80% quality) before upload to S3
- Chapter text content should be in Markdown format
- PDF files are limited to 50MB
- Video files are limited to 500MB
- Chapters are automatically ordered if order is not provided
- Cannot delete a subject if it has chapters
- All file uploads (PDF, video) are stored in AWS S3

---

## Board Management APIs

### 23. Create Board
Create a new board. (Protected - Super Admin only)

**POST** `/api/super-admin/board`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "CBSE",
  "description": "Central Board of Secondary Education",
  "code": "CBSE"
}
```

**Form Data:**
- `name` (required): Board name
- `description` (optional): Board description
- `code` (optional): Board code (unique identifier)

**Response (201):**
```json
{
  "success": true,
  "message": "Board created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439016",
    "name": "CBSE",
    "description": "Central Board of Secondary Education",
    "code": "CBSE",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 24. Get All Boards
Get all boards with optional filters. (Protected - Super Admin only)

**GET** `/api/super-admin/board?isActive=true`

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
  "message": "Boards retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439016",
      "name": "CBSE",
      "description": "Central Board of Secondary Education",
      "code": "CBSE",
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

### 25. Get Board by ID
Get a specific board by ID. (Protected - Super Admin only)

**GET** `/api/super-admin/board/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Board retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439016",
    "name": "CBSE",
    "description": "Central Board of Secondary Education",
    "code": "CBSE",
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

### 26. Update Board
Update an existing board. (Protected - Super Admin only)

**PUT** `/api/super-admin/board/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Updated CBSE",
  "description": "Updated description",
  "code": "CBSE-UPDATED",
  "isActive": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Board updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439016",
    "name": "Updated CBSE",
    "description": "Updated description",
    "code": "CBSE-UPDATED",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

---

### 27. Delete Board
Delete a board. Cannot delete if it is assigned to any subjects. (Protected - Super Admin only)

**DELETE** `/api/super-admin/board/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Board deleted successfully"
}
```

**Error Response (400) - If board is assigned to subjects:**
```json
{
  "success": false,
  "message": "Cannot delete board. It is assigned to 5 subject(s). Please remove board assignment from subjects first."
}
```

---

## Updated Subject APIs

### Updated: Create Subject
The create subject endpoint now supports optional board assignment.

**POST** `/api/super-admin/subject`

**Form Data:**
- `title` (required): Subject title
- `description` (optional): Subject description
- `mainCategoryId` (required): Main category ID
- `subCategoryId` (required): Sub category ID
- `boardId` (optional): Board ID
- `thumbnail` (optional): Subject thumbnail image file

**Response now includes board:**
```json
{
  "success": true,
  "message": "Subject created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "title": "Mathematics Fundamentals",
    "description": "Basic mathematics concepts",
    "thumbnail": "...",
    "mainCategory": {...},
    "subCategory": {...},
    "board": {
      "_id": "507f1f77bcf86cd799439016",
      "name": "CBSE",
      "description": "Central Board of Secondary Education",
      "code": "CBSE"
    },
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Updated: Get All Subjects
The get all subjects endpoint now supports filtering by board.

**GET** `/api/super-admin/subject?boardId=xxx&mainCategoryId=xxx&subCategoryId=xxx&isActive=true`

**Query Parameters:**
- `boardId` (optional): Filter by board ID
- `mainCategoryId` (optional): Filter by main category ID
- `subCategoryId` (optional): Filter by sub category ID
- `isActive` (optional): Filter by active status

### Updated: Update Subject
The update subject endpoint now supports updating board assignment.

**PUT** `/api/super-admin/subject/:id`

**Form Data:**
- `boardId` (optional): Board ID - Set to assign/update board, set to `null` or empty string `""` to remove board assignment

**Examples:**
- To assign a board: `boardId: "507f1f77bcf86cd799439016"`
- To remove board assignment: `boardId: null` or `boardId: ""`
- To keep existing board: Omit `boardId` field

---

## Plan Management APIs

### 28. Create Plan
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

### 29. Create Multiple Plans
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

---

### 30. Get All Plans
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

### 31. Get Plans by Sub Category
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

### 32. Get Plan by ID
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

### 33. Update Plan
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

### 34. Delete Plan
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
- Plans are specific to sub categories - each sub category can have its own set of plans with different amounts

---

## Public Course Management APIs

### 35. Create Course
Create a new public course. Courses are standalone and not linked to categories. (Protected - Super Admin only)

**POST** `/api/super-admin/course`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `title` (required): Course title
- `description` (optional): Course description
- `price` (required): Course price (number, must be >= 0)
- `thumbnail` (optional): Course thumbnail image file (JPEG, PNG, GIF, WebP, max 5MB)

**Response (201):**
```json
{
  "success": true,
  "message": "Course created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "title": "Complete Web Development Course",
    "description": "Learn full-stack web development from scratch",
    "thumbnail": "https://your-bucket.s3.amazonaws.com/course-thumbnails/uuid-course-1234567890-complete-web-development-course.jpg",
    "price": 2999,
    "isActive": true,
    "createdBy": "507f1f77bcf86cd799439011",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 36. Get All Courses
Get all courses with optional filters. (Protected - Super Admin only)

**GET** `/api/super-admin/course?isActive=true`

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
  "message": "Courses retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439021",
      "title": "Complete Web Development Course",
      "description": "Learn full-stack web development from scratch",
      "thumbnail": "https://your-bucket.s3.amazonaws.com/course-thumbnails/uuid-course-1234567890-complete-web-development-course.jpg",
      "price": 2999,
      "isActive": true,
      "createdBy": {
        "_id": "507f1f77bcf86cd799439011",
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

### 37. Get Course by ID
Get a specific course by ID with its chapters. (Protected - Super Admin only)

**GET** `/api/super-admin/course/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Course retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "title": "Complete Web Development Course",
    "description": "Learn full-stack web development from scratch",
    "thumbnail": "https://your-bucket.s3.amazonaws.com/course-thumbnails/uuid-course-1234567890-complete-web-development-course.jpg",
    "price": 2999,
    "isActive": true,
    "createdBy": {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "ADGUSUP01",
      "firstName": "Super",
      "lastName": "Admin"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "chapters": [
      {
        "_id": "507f1f77bcf86cd799439022",
        "title": "Introduction to HTML",
        "description": "Learn HTML basics",
        "order": 1,
        "content": {
          "text": "# HTML Basics\n\nHTML stands for...",
          "pdf": "https://your-bucket.s3.amazonaws.com/course-pdfs/uuid-course-chapter-1234567891-introduction-to-html.pdf",
          "video": "https://your-bucket.s3.amazonaws.com/course-videos/uuid-course-chapter-1234567892-introduction-to-html.mp4"
        },
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

### 38. Update Course
Update an existing course. (Protected - Super Admin only)

**PUT** `/api/super-admin/course/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `title` (optional): Course title
- `description` (optional): Course description
- `price` (optional): Course price (number, must be >= 0)
- `isActive` (optional): Active status (`true` or `false`)
- `thumbnail` (optional): New thumbnail image file (JPEG, PNG, GIF, WebP, max 5MB)

**Response (200):**
```json
{
  "success": true,
  "message": "Course updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439021",
    "title": "Updated Complete Web Development Course",
    "description": "Updated description",
    "thumbnail": "https://your-bucket.s3.amazonaws.com/course-thumbnails/uuid-course-1234567893-updated-complete-web-development-course.jpg",
    "price": 3499,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

---

### 39. Delete Course
Delete a course. Cannot delete if it has chapters. (Protected - Super Admin only)

**DELETE** `/api/super-admin/course/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Course deleted successfully"
}
```

**Error Response (400) - If course has chapters:**
```json
{
  "success": false,
  "message": "Cannot delete course. Please delete all chapters first."
}
```

---

## Course Chapter Management APIs

### 40. Create Course Chapter
Create a new chapter for a course. Supports text (markdown), PDF, and video content. (Protected - Super Admin only)

**POST** `/api/super-admin/course-chapter`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `title` (required): Chapter title
- `description` (optional): Chapter description
- `courseId` (required): Course ID
- `order` (required): Chapter order number
- `text` (optional): Markdown text content
- `pdf` (optional): PDF file (max 50MB)
- `video` (optional): Video file (max 500MB)

**Response (201):**
```json
{
  "success": true,
  "message": "Course chapter created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439022",
    "title": "Introduction to HTML",
    "description": "Learn HTML basics",
    "course": "507f1f77bcf86cd799439021",
    "order": 1,
    "content": {
      "text": "# HTML Basics\n\nHTML stands for HyperText Markup Language...",
      "pdf": "https://your-bucket.s3.amazonaws.com/course-pdfs/uuid-course-chapter-1234567891-introduction-to-html.pdf",
      "video": "https://your-bucket.s3.amazonaws.com/course-videos/uuid-course-chapter-1234567892-introduction-to-html.mp4"
    },
    "isActive": true,
    "createdBy": "507f1f77bcf86cd799439011",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 41. Get Course Chapters
Get all chapters for a specific course. (Protected - Super Admin only)

**GET** `/api/super-admin/course/:courseId/chapters?isActive=true`

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
  "message": "Course chapters retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439022",
      "title": "Introduction to HTML",
      "description": "Learn HTML basics",
      "order": 1,
      "content": {
        "text": "# HTML Basics\n\nHTML stands for...",
        "pdf": "https://your-bucket.s3.amazonaws.com/course-pdfs/uuid-course-chapter-1234567891-introduction-to-html.pdf",
        "video": "https://your-bucket.s3.amazonaws.com/course-videos/uuid-course-chapter-1234567892-introduction-to-html.mp4"
      },
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1
}
```

---

### 42. Get Course Chapter by ID
Get a specific course chapter by ID. (Protected - Super Admin only)

**GET** `/api/super-admin/course-chapter/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Course chapter retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439022",
    "title": "Introduction to HTML",
    "description": "Learn HTML basics",
    "course": {
      "_id": "507f1f77bcf86cd799439021",
      "title": "Complete Web Development Course",
      "description": "Learn full-stack web development from scratch",
      "thumbnail": "https://your-bucket.s3.amazonaws.com/course-thumbnails/uuid-course-1234567890-complete-web-development-course.jpg"
    },
    "order": 1,
    "content": {
      "text": "# HTML Basics\n\nHTML stands for...",
      "pdf": "https://your-bucket.s3.amazonaws.com/course-pdfs/uuid-course-chapter-1234567891-introduction-to-html.pdf",
      "video": "https://your-bucket.s3.amazonaws.com/course-videos/uuid-course-chapter-1234567892-introduction-to-html.mp4"
    },
    "isActive": true,
    "createdBy": {
      "_id": "507f1f77bcf86cd799439011",
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

### 43. Update Course Chapter
Update an existing course chapter. (Protected - Super Admin only)

**PUT** `/api/super-admin/course-chapter/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `title` (optional): Chapter title
- `description` (optional): Chapter description
- `order` (optional): Chapter order number
- `text` (optional): Markdown text content
- `isActive` (optional): Active status (`true` or `false`)
- `pdf` (optional): New PDF file (max 50MB) - replaces existing PDF
- `video` (optional): New video file (max 500MB) - replaces existing video

**Response (200):**
```json
{
  "success": true,
  "message": "Course chapter updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439022",
    "title": "Updated Introduction to HTML",
    "description": "Updated description",
    "order": 1,
    "content": {
      "text": "# Updated HTML Basics\n\nUpdated content...",
      "pdf": "https://your-bucket.s3.amazonaws.com/course-pdfs/uuid-course-chapter-1234567893-updated-introduction-to-html.pdf",
      "video": "https://your-bucket.s3.amazonaws.com/course-videos/uuid-course-chapter-1234567894-updated-introduction-to-html.mp4"
    },
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

---

### 44. Delete Course Chapter
Delete a course chapter. (Protected - Super Admin only)

**DELETE** `/api/super-admin/course-chapter/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Course chapter deleted successfully"
}
```

---

## Course Management Notes

- Course thumbnails are automatically processed with Jimp (resized to 800x800px, 80% quality) before upload to S3
- Course chapters support text (markdown), PDF, and video content
- PDF files are limited to 50MB
- Video files are limited to 500MB
- Courses are standalone and not linked to categories
- Each course can have multiple chapters with unique order numbers
- Cannot delete a course if it has chapters
- All file uploads (thumbnails, PDFs, videos) are stored in AWS S3
- Course price must be a number greater than or equal to 0

