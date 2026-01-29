# Project Folder Structure

## Complete Directory Tree

```
adhyanguru-backendapis-2.0/
│
├── bin/
│   └── www                          # Server entry point
│
├── controllers/                     # Business logic controllers
│   ├── superAdmin.controller.js     # Super Admin operations
│   ├── admin.controller.js          # Admin operations
│   ├── districtCoordinator.controller.js
│   ├── coordinator.controller.js
│   ├── fieldManager.controller.js
│   ├── teamLeader.controller.js
│   └── fieldEmployee.controller.js
│
├── docs/                            # API Documentation
│   ├── API_DOCUMENTATION.md         # Complete API documentation
│   ├── SUPER_ADMIN_API.md
│   ├── ADMIN_API.md
│   ├── DISTRICT_COORDINATOR_API.md
│   ├── COORDINATOR_API.md
│   ├── FIELD_MANAGER_API.md
│   ├── TEAM_LEADER_API.md
│   ├── FIELD_EMPLOYEE_API.md
│   └── FOLDER_STRUCTURE.md          # This file
│
├── middleware/                      # Express middleware
│   └── auth.js                     # Authentication & Authorization
│
├── models/                          # MongoDB Mongoose models
│   ├── superAdmin.model.js
│   ├── admin.model.js
│   ├── districtCoordinator.model.js
│   ├── coordinator.model.js
│   ├── fieldManager.model.js
│   ├── teamLeader.model.js
│   └── fieldEmployee.model.js
│
├── public/                          # Static files
│   ├── index.html
│   └── stylesheets/
│       └── style.css
│
├── routes/                          # Express routes
│   ├── index.js                    # Base routes
│   ├── users.js                    # Legacy user routes
│   ├── superAdmin.routes.js
│   ├── admin.routes.js
│   ├── districtCoordinator.routes.js
│   ├── coordinator.routes.js
│   ├── fieldManager.routes.js
│   ├── teamLeader.routes.js
│   └── fieldEmployee.routes.js
│
├── services/                        # Business services
│   ├── passwordService.js          # Password encryption/decryption
│   └── userIdService.js            # User ID generation
│
├── utils/                           # Utility functions
│   ├── constants.js                # User roles & hierarchy constants
│   └── userModelMapper.js          # Model mapping utilities
│
├── utilities/                       # Legacy utilities
│   └── database.js                 # Database connection
│
├── app.js                           # Express app configuration
├── package.json                     # Dependencies
├── package-lock.json
└── README.md                        # Project documentation
```

## Folder Descriptions

### `/controllers`
Contains all business logic for each user type. Each controller handles:
- Signup/Login
- User creation (for authorized roles)
- User retrieval (hierarchical)

### `/models`
MongoDB Mongoose schemas for all 7 user types. Each model includes:
- `_id`: MongoDB ObjectId
- `userId`: Custom generated ID (e.g., ADGUSUP01)
- `email`, `mobileNumber`: Unique identifiers
- `password`, `encryptedPassword`: Encrypted passwords
- `role`: User role
- `createdBy`: Reference to creator
- Timestamps

### `/routes`
Express route definitions. Each route file:
- Defines public endpoints (signup/login)
- Defines protected endpoints (with authentication)
- Uses authorization middleware for user creation

### `/middleware`
Express middleware functions:
- `authenticate`: JWT token verification
- `authorizeCreate`: Permission checking for user creation
- `generateToken`: JWT token generation

### `/services`
Reusable business services:
- `passwordService`: Encrypt/decrypt passwords using crypto-js
- `userIdService`: Generate unique user IDs based on type

### `/utils`
Utility functions and constants:
- `constants.js`: User roles and hierarchy definitions
- `userModelMapper.js`: Map user roles to their models

### `/docs`
Complete API documentation for all endpoints, including:
- Request/response examples
- Error handling
- Authentication requirements

## File Naming Conventions

- **Models**: `*.model.js`
- **Controllers**: `*.controller.js`
- **Routes**: `*.routes.js`
- **Services**: `*.service.js`
- **Middleware**: `*.js` (or descriptive names)
- **Utils**: `*.js` (descriptive names)

## User Type Abbreviations

- Super Admin: `superAdmin`
- Admin: `admin`
- District Coordinator: `districtCoordinator`
- Coordinator: `coordinator`
- Field Manager: `fieldManager`
- Team Leader: `teamLeader`
- Field Employee: `fieldEmployee`

## API Route Prefixes

- `/api/super-admin/*`
- `/api/admin/*`
- `/api/district-coordinator/*`
- `/api/coordinator/*`
- `/api/field-manager/*`
- `/api/team-leader/*`
- `/api/field-employee/*`

