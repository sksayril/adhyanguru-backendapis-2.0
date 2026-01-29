# Adhyanguru Backend API 2.0

## Project Structure

This is a hierarchical user management system with 7 user types and role-based access control.

### Folder Structure

```
├── models/              # MongoDB models for all user types
│   ├── superAdmin.model.js
│   ├── admin.model.js
│   ├── districtCoordinator.model.js
│   ├── coordinator.model.js
│   ├── fieldManager.model.js
│   ├── teamLeader.model.js
│   └── fieldEmployee.model.js
├── controllers/         # Business logic for each user type
│   ├── superAdmin.controller.js
│   ├── admin.controller.js
│   ├── districtCoordinator.controller.js
│   ├── coordinator.controller.js
│   ├── fieldManager.controller.js
│   ├── teamLeader.controller.js
│   └── fieldEmployee.controller.js
├── routes/             # API routes for each user type
│   ├── superAdmin.routes.js
│   ├── admin.routes.js
│   ├── districtCoordinator.routes.js
│   ├── coordinator.routes.js
│   ├── fieldManager.routes.js
│   ├── teamLeader.routes.js
│   └── fieldEmployee.routes.js
├── middleware/         # Authentication and authorization
│   └── auth.js
├── services/           # Business services
│   ├── passwordService.js    # Password encryption/decryption
│   └── userIdService.js      # User ID generation
├── utils/              # Utility functions
│   ├── constants.js         # User roles and hierarchy
│   └── userModelMapper.js   # Model mapping
└── docs/               # API documentation
    ├── API_DOCUMENTATION.md
    ├── SUPER_ADMIN_API.md
    ├── ADMIN_API.md
    ├── DISTRICT_COORDINATOR_API.md
    ├── COORDINATOR_API.md
    ├── FIELD_MANAGER_API.md
    ├── TEAM_LEADER_API.md
    └── FIELD_EMPLOYEE_API.md
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)

### Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Create `.env` file:**
```env
DATABASE_URL=mongodb://localhost:27017/adhyanguru
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ENCRYPTION_KEY=your-encryption-secret-key-change-this-in-production
PORT=3000
```

3. **Start the server:**
```bash
npm start
```

## User Hierarchy

1. **Super Admin** (ADGUSUP01, ADGUSUP02, ...)
   - Can create: Admin
   - Can view: All users

2. **Admin** (ADGUADM01, ADGUADM02, ...)
   - Can create: District Coordinator
   - Can view: District Coordinator and below

3. **District Coordinator** (ADGUDC01, ADGUDC02, ...)
   - Can create: Coordinator
   - Can view: Coordinator and below

4. **Coordinator** (ADGUCO01, ADGUCO02, ...)
   - Can create: Field Manager
   - Can view: Field Manager and below

5. **Field Manager** (ADGUFM01, ADGUFM02, ...)
   - Can create: Team Leader
   - Can view: Team Leader and below

6. **Team Leader** (ADGUTL01, ADGUTL02, ...)
   - Can create: Field Employee
   - Can view: Field Employee

7. **Field Employee** (ADGUF01, ADGUF02, ...)
   - Cannot create anyone
   - Can view: Own profile only

## Features

- ✅ Password encryption using crypto-js (AES)
- ✅ Password decryption capability (Super Admin only)
- ✅ Auto-generated user IDs based on user type
- ✅ Multiple login options (email, mobile, or user ID)
- ✅ JWT-based authentication
- ✅ Role-based authorization
- ✅ Hierarchical user creation
- ✅ User hierarchy viewing permissions

## API Endpoints

### Base URL: `http://localhost:3000/api`

- `/api/super-admin/*` - Super Admin endpoints
- `/api/admin/*` - Admin endpoints
- `/api/district-coordinator/*` - District Coordinator endpoints
- `/api/coordinator/*` - Coordinator endpoints
- `/api/field-manager/*` - Field Manager endpoints
- `/api/team-leader/*` - Team Leader endpoints
- `/api/field-employee/*` - Field Employee endpoints

For detailed API documentation, see the `docs/` folder.

## Quick Start Example

### 1. Create Super Admin
```bash
POST /api/super-admin/signup
{
  "email": "superadmin@example.com",
  "mobileNumber": "1234567890",
  "password": "password123",
  "firstName": "Super",
  "lastName": "Admin"
}
```

### 2. Login
```bash
POST /api/super-admin/login
{
  "identifier": "superadmin@example.com",  // or mobileNumber or userId
  "password": "password123"
}
```

### 3. Create Admin (with token)
```bash
POST /api/super-admin/create-admin
Headers: Authorization: Bearer <token>
{
  "email": "admin@example.com",
  "mobileNumber": "1234567891",
  "password": "password123",
  "firstName": "Admin",
  "lastName": "User"
}
```

## Technologies Used

- Express.js
- MongoDB with Mongoose
- JWT (jsonwebtoken)
- crypto-js (for password encryption)
- Joi (for validation)

## Notes

- All passwords are encrypted using AES encryption
- User IDs are auto-generated and unique per user type
- Each user has both MongoDB `_id` and custom `userId`
- Super Admin can decrypt passwords when needed
- All protected routes require JWT token in Authorization header
