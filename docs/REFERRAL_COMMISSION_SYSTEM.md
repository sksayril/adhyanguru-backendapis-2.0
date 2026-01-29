# Referral and Commission System Documentation

## Overview

The Referral and Commission System enables Field Employees to have unique referral codes that students can use during registration. When students purchase subscriptions or courses, commissions are automatically distributed to the referral hierarchy (Field Employee → Team Leader → District Coordinator → Coordinator → Admin) based on configurable percentages set by Super Admin.

## Features

### 1. Referral Code System
- **Field Employees** automatically receive a unique referral code when created (format: `FE` + 6 alphanumeric characters, e.g., `FE1A2B3C`)
- Students can use this referral code during signup
- The system validates the referral code and builds the complete hierarchy chain
- Only the Field Employee who referred the student receives commissions (others in the chain don't get commissions if they didn't refer)

### 2. Commission Distribution
- Commissions are automatically distributed when students complete subscription or course purchase payments
- Distribution follows the hierarchy:
  - **Coordinator**: 40% (default, configurable)
  - **District Coordinator**: 10% (default, configurable)
  - **Team Leader**: 10% (default, configurable)
  - **Field Employee**: 10% (default, configurable)
- Only active users in the hierarchy receive commissions
- Commissions are added to user wallets automatically

### 3. Wallet System
- Each role (Coordinator, District Coordinator, Team Leader, Field Employee) has a wallet
- Wallet tracks:
  - **balance**: Current available balance
  - **totalEarned**: Total commissions earned
  - **totalWithdrawn**: Total amount withdrawn (for future withdrawal feature)
- All transactions are logged in WalletTransaction model

### 4. Commission Settings Management
- Super Admin can configure commission percentages
- Settings are versioned (old settings are deactivated when new ones are created)
- Default percentages: Coordinator 40%, District Coordinator 10%, Team Leader 10%, Field Employee 10%

## Data Models

### Field Employee Model (Updated)
```javascript
{
  // ... existing fields ...
  referralCode: String (unique, format: FE[A-Z0-9]{6}),
  wallet: {
    balance: Number (default: 0),
    totalEarned: Number (default: 0),
    totalWithdrawn: Number (default: 0)
  }
}
```

### Student Model (Updated)
```javascript
{
  // ... existing fields ...
  referralHierarchy: {
    referringFieldEmployee: ObjectId (ref: FieldEmployee),
    teamLeader: ObjectId (ref: TeamLeader),
    districtCoordinator: ObjectId (ref: DistrictCoordinator),
    coordinator: ObjectId (ref: Coordinator),
    admin: ObjectId (ref: Admin)
  }
}
```

### CommissionSettings Model
```javascript
{
  coordinatorPercentage: Number (0-100, default: 40),
  districtCoordinatorPercentage: Number (0-100, default: 10),
  teamLeaderPercentage: Number (0-100, default: 10),
  fieldEmployeePercentage: Number (0-100, default: 10),
  updatedBy: ObjectId (ref: SuperAdmin/Admin),
  updatedByModel: String (enum: ['SuperAdmin', 'Admin']),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### WalletTransaction Model
```javascript
{
  user: ObjectId (ref: Coordinator/DistrictCoordinator/TeamLeader/FieldEmployee),
  userModel: String (enum: ['Coordinator', 'DistrictCoordinator', 'TeamLeader', 'FieldEmployee']),
  type: String (enum: ['COMMISSION', 'WITHDRAWAL', 'ADJUSTMENT']),
  amount: Number,
  balanceAfter: Number,
  relatedTransaction: {
    type: String (enum: ['SUBSCRIPTION', 'COURSE_PURCHASE']),
    transactionId: ObjectId,
    transactionModel: String,
    student: ObjectId (ref: Student),
    amount: Number
  },
  commissionDetails: {
    percentage: Number,
    baseAmount: Number
  },
  description: String,
  status: String (enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED']),
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Student Signup (Updated)
**POST** `/api/student/signup`

**New Fields:**
- `referralCode` (optional): Referral code from Field Employee (format: FE[A-Z0-9]{6})
- `fieldEmployeeCode` (optional, backward compatible): Same as referralCode

**Response:** Includes referral hierarchy information

### Super Admin - Commission Settings

#### Get Commission Settings
**GET** `/api/super-admin/commission-settings`

**Response:**
```json
{
  "success": true,
  "message": "Commission settings retrieved successfully",
  "data": {
    "_id": "...",
    "coordinatorPercentage": 40,
    "districtCoordinatorPercentage": 10,
    "teamLeaderPercentage": 10,
    "fieldEmployeePercentage": 10,
    "updatedBy": {...},
    "isActive": true,
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Update Commission Settings
**PUT** `/api/super-admin/commission-settings`

**Request Body:**
```json
{
  "coordinatorPercentage": 40,
  "districtCoordinatorPercentage": 10,
  "teamLeaderPercentage": 10,
  "fieldEmployeePercentage": 10
}
```

**Note:** All fields are optional. Only provided fields will be updated. Previous settings are deactivated and new settings are created.

### Wallet Endpoints

#### Get Wallet Balance
**GET** `/api/field-employee/wallet`
**GET** `/api/team-leader/wallet`
**GET** `/api/district-coordinator/wallet`
**GET** `/api/coordinator/wallet`

**Response:**
```json
{
  "success": true,
  "message": "Wallet balance retrieved successfully",
  "data": {
    "userId": "ADGUF01",
    "name": "John Doe",
    "wallet": {
      "balance": 150.50,
      "totalEarned": 200.00,
      "totalWithdrawn": 49.50
    }
  }
}
```

#### Get Wallet Transactions
**GET** `/api/field-employee/wallet/transactions?page=1&limit=20&type=COMMISSION`
**GET** `/api/team-leader/wallet/transactions?page=1&limit=20&type=COMMISSION`
**GET** `/api/district-coordinator/wallet/transactions?page=1&limit=20&type=COMMISSION`
**GET** `/api/coordinator/wallet/transactions?page=1&limit=20&type=COMMISSION`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `type` (optional): Filter by type (COMMISSION, WITHDRAWAL, ADJUSTMENT)

**Response:**
```json
{
  "success": true,
  "message": "Wallet transactions retrieved successfully",
  "data": {
    "transactions": [
      {
        "_id": "...",
        "type": "COMMISSION",
        "amount": 10.00,
        "balanceAfter": 150.50,
        "relatedTransaction": {
          "type": "SUBSCRIPTION",
          "transactionId": "...",
          "student": {
            "userId": "ADGUSTU01",
            "firstName": "Jane",
            "lastName": "Smith"
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

## Commission Distribution Flow

### When Student Purchases Subscription/Course:

1. **Payment Verification**: Student completes payment for subscription or course
2. **Commission Calculation**: System retrieves active commission settings
3. **Hierarchy Lookup**: System finds student's referral hierarchy
4. **Distribution**: Commissions are calculated and distributed:
   - Field Employee: `amount * fieldEmployeePercentage / 100`
   - Team Leader: `amount * teamLeaderPercentage / 100`
   - District Coordinator: `amount * districtCoordinatorPercentage / 100`
   - Coordinator: `amount * coordinatorPercentage / 100`
5. **Wallet Update**: Each user's wallet balance is updated
6. **Transaction Log**: WalletTransaction records are created for each distribution

### Example Calculation:

If a student purchases a subscription for **₹100**:
- Coordinator (40%): ₹40.00
- District Coordinator (10%): ₹10.00
- Team Leader (10%): ₹10.00
- Field Employee (10%): ₹10.00
- **Total Distributed**: ₹70.00

## Important Notes

1. **Referral Code Format**: Must be `FE` followed by 6 alphanumeric characters (uppercase)
2. **Only Referring Field Employee Benefits**: Only the Field Employee who referred the student gets commissions. Others in the chain get commissions based on their position in the hierarchy.
3. **Active Users Only**: Only active users receive commissions
4. **Asynchronous Distribution**: Commission distribution happens asynchronously and doesn't block payment verification
5. **Transaction Logging**: All commission distributions are logged for audit purposes
6. **Settings Versioning**: When commission settings are updated, old settings are deactivated and new ones are created (maintains history)
7. **Backward Compatibility**: The system still supports `fieldEmployeeCode` field for backward compatibility, but `referralCode` is preferred

## Error Handling

- Invalid referral code format: Returns 400 error with format requirements
- Referral code not found: Returns 404 error
- Inactive Field Employee: Returns 404 error
- Commission distribution errors: Logged but don't fail payment verification
- Missing commission settings: Uses default percentages (40%, 10%, 10%, 10%)

## Future Enhancements

- Withdrawal functionality for wallet balances
- Commission reports and analytics
- Referral code sharing/QR code generation
- Commission history dashboard
- Automated commission payouts
