# Task Level System Documentation

## Overview

The Task Level System provides a hierarchical management structure with task levels, registration limits, and user distribution capabilities across the user hierarchy.

## Features

### 1. Task Level Management
- **Admin/Super Admin** can create, view, and update task levels
- Task levels have a name, description, numeric level, and **registration limit**
- Task levels can be assigned to Coordinators, District Coordinators, and Team Leaders
- **Task creation time tracking**: Each task level assignment records when it was assigned and by whom

### 2. Task Level Registration Limits
- **Global Registration Limit**: Each task level has a global limit on how many users can register across all coordinators
- **Per-Coordinator Registration Limit**: Each coordinator can have a custom registration limit for each assigned task level
- **Automatic Tracking**: Registration counts are automatically tracked at both global and per-coordinator levels
- **Dual Limit Checking**: System checks both coordinator-specific and global limits when creating users

### 3. Coordinator Registration Limits (Legacy Support)
- **Level 1 Limit**: Controls how many users can register under a coordinator (legacy)
- **Level 2 Limit**: Additional level for extended registration control (legacy)
- Registration counts are automatically tracked and incremented when users are created
- Registration limits are enforced when creating new users

### 3. User Distribution/Splitting
- **Coordinator → District Coordinators**: Coordinators can split/distribute District Coordinators
- **District Coordinator → Team Leaders**: District Coordinators can split/distribute Team Leaders
- **Team Leader → Field Employees**: Team Leaders can split/distribute Field Employees

## API Endpoints

### Task Level Management

#### Create Task Level
```
POST /api/admin/task-level
Authorization: Bearer <admin_token>
Body: {
  "name": "Level 1",
  "description": "Basic level",
  "level": 1,
  "registrationLimit": 1000  // Optional: Global registration limit (0 = unlimited)
}
```

#### Get All Task Levels
```
GET /api/admin/task-levels?isActive=true
Authorization: Bearer <admin_token>
```

#### Update Task Level
```
PUT /api/admin/task-level/:taskLevelId
Authorization: Bearer <admin_token>
Body: {
  "name": "Updated Level 1",
  "description": "Updated description",
  "level": 1,
  "isActive": true
}
```

### Task Level Assignment

#### Assign Task Levels to Coordinator
```
POST /api/admin/coordinator/task-levels
Authorization: Bearer <admin_token>
Body: {
  "coordinatorId": "<coordinator_id>",
  "taskLevels": [
    {
      "taskLevelId": "<task_level_id1>",
      "registrationLimit": 100  // Optional: Per-coordinator limit (0 = use task level's global limit)
    },
    {
      "taskLevelId": "<task_level_id2>",
      "registrationLimit": 50
    }
  ]
}
```

**Note**: The `taskLevels` array can also accept simple strings (task level IDs) for backward compatibility, but using objects allows setting per-coordinator limits.

#### Assign Task Levels to District Coordinator
```
POST /api/admin/district-coordinator/task-levels
Authorization: Bearer <admin_token>
Body: {
  "districtCoordinatorId": "<district_coordinator_id>",
  "taskLevelIds": ["<task_level_id1>", "<task_level_id2>"]
}
```

#### Assign Task Levels to Team Leader
```
POST /api/admin/team-leader/task-levels
Authorization: Bearer <admin_token>
Body: {
  "teamLeaderId": "<team_leader_id>",
  "taskLevelIds": ["<task_level_id1>", "<task_level_id2>"]
}
```

### Registration Limits

#### Set Coordinator Registration Limits (Legacy)
```
POST /api/admin/coordinator/registration-limits
Authorization: Bearer <admin_token>
Body: {
  "coordinatorId": "<coordinator_id>",
  "level1Limit": 100,
  "level2Limit": 50
}
```

#### Set Task Level Registration Limit (Global)
```
POST /api/admin/task-level/registration-limit
Authorization: Bearer <admin_token>
Body: {
  "taskLevelId": "<task_level_id>",
  "registrationLimit": 1000
}
```

#### Set Task Level Registration Limit for Coordinator
```
POST /api/admin/coordinator/task-level/registration-limit
Authorization: Bearer <admin_token>
Body: {
  "coordinatorId": "<coordinator_id>",
  "taskLevelId": "<task_level_id>",
  "registrationLimit": 100
}
```

**Note**: When creating a Field Manager through a Coordinator, you can specify:
- `taskLevelId`: To use task-level-specific registration limits (recommended)
- `registrationLevel: 1` or `registrationLevel: 2`: To use legacy level1/level2 limits

### User Distribution/Splitting

#### Assign District Coordinators to Coordinator
```
POST /api/admin/coordinator/assign-district-coordinators
Authorization: Bearer <admin_token>
Body: {
  "coordinatorId": "<coordinator_id>",
  "districtCoordinatorIds": ["<dc_id1>", "<dc_id2>"]
}
```

#### Assign Team Leaders to District Coordinator
```
POST /api/admin/district-coordinator/assign-team-leaders
Authorization: Bearer <admin_token>
Body: {
  "districtCoordinatorId": "<district_coordinator_id>",
  "teamLeaderIds": ["<tl_id1>", "<tl_id2>"]
}
```

#### Assign Field Employees to Team Leader
```
POST /api/admin/team-leader/assign-field-employees
Authorization: Bearer <admin_token>
Body: {
  "teamLeaderId": "<team_leader_id>",
  "fieldEmployeeIds": ["<fe_id1>", "<fe_id2>"]
}
```

## Data Models

### TaskLevel Model
```javascript
{
  name: String (required, unique),
  description: String,
  level: Number (required, unique, min: 1),
  registrationLimit: Number (default: 0, 0 = unlimited), // Global limit
  globalRegistrationCount: Number (default: 0), // Total users registered across all coordinators
  isActive: Boolean (default: true),
  createdBy: ObjectId (ref: Admin/SuperAdmin),
  createdAt: Date,
  updatedAt: Date
}
```

### Coordinator Model (Updated)
```javascript
{
  // ... existing fields ...
  taskLevels: [{
    taskLevel: ObjectId (ref: TaskLevel, required),
    registrationLimit: Number (default: 0, 0 = use task level's global limit),
    registrationCount: Number (default: 0), // Users registered by this coordinator for this task level
    assignedAt: Date (default: Date.now), // When task level was assigned
    assignedBy: ObjectId (ref: Admin/SuperAdmin/DistrictCoordinator),
    assignedByModel: String (enum: ['Admin', 'SuperAdmin', 'DistrictCoordinator'])
  }],
  registrationLimits: { // Legacy support
    level1: Number (default: 0),
    level2: Number (default: 0)
  },
  registrationCounts: { // Legacy support
    level1: Number (default: 0),
    level2: Number (default: 0)
  },
  assignedDistrictCoordinators: [ObjectId] (ref: DistrictCoordinator)
}
```

### DistrictCoordinator Model (Updated)
```javascript
{
  // ... existing fields ...
  taskLevels: [ObjectId] (ref: TaskLevel),
  assignedByCoordinator: ObjectId (ref: Coordinator),
  assignedTeamLeaders: [ObjectId] (ref: TeamLeader)
}
```

### TeamLeader Model (Updated)
```javascript
{
  // ... existing fields ...
  taskLevels: [ObjectId] (ref: TaskLevel),
  assignedByDistrictCoordinator: ObjectId (ref: DistrictCoordinator),
  assignedFieldEmployees: [ObjectId] (ref: FieldEmployee)
}
```

### FieldEmployee Model (Updated)
```javascript
{
  // ... existing fields ...
  assignedByTeamLeader: ObjectId (ref: TeamLeader)
}
```

## Usage Examples

### Example 1: Setting Up a Coordinator with Task Levels and Limits

1. Create task level with global registration limit:
```bash
POST /api/admin/task-level
{
  "name": "Basic Level",
  "description": "Basic task level",
  "level": 1,
  "registrationLimit": 1000  // Global limit: 1000 users across all coordinators
}
```

2. Assign task levels to coordinator with per-coordinator limits:
```bash
POST /api/admin/coordinator/task-levels
{
  "coordinatorId": "COORD001",
  "taskLevels": [
    {
      "taskLevelId": "<task_level_id>",
      "registrationLimit": 100  // This coordinator can register 100 users for this task level
    }
  ]
}
```

3. (Optional) Update task level registration limit for coordinator:
```bash
POST /api/admin/coordinator/task-level/registration-limit
{
  "coordinatorId": "COORD001",
  "taskLevelId": "<task_level_id>",
  "registrationLimit": 150  // Increase limit to 150
}
```

4. (Legacy) Set general registration limits:
```bash
POST /api/admin/coordinator/registration-limits
{
  "coordinatorId": "COORD001",
  "level1Limit": 100,
  "level2Limit": 50
}
```

### Example 2: Distributing Users

1. Coordinator distributes District Coordinators:
```bash
POST /api/admin/coordinator/assign-district-coordinators
{
  "coordinatorId": "COORD001",
  "districtCoordinatorIds": ["DC001", "DC002"]
}
```

2. District Coordinator distributes Team Leaders:
```bash
POST /api/admin/district-coordinator/assign-team-leaders
{
  "districtCoordinatorId": "DC001",
  "teamLeaderIds": ["TL001", "TL002"]
}
```

3. Team Leader distributes Field Employees:
```bash
POST /api/admin/team-leader/assign-field-employees
{
  "teamLeaderId": "TL001",
  "fieldEmployeeIds": ["FE001", "FE002"]
}
```

## Response Examples

### Get Coordinator Profile (includes task levels and registration info)
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "_id": "...",
    "userId": "COORD001",
    "firstName": "John",
    "lastName": "Doe",
    "taskLevels": [
      {
        "taskLevel": {
          "_id": "...",
          "name": "Basic Level",
          "description": "Basic task level",
          "level": 1,
          "registrationLimit": 1000,
          "globalRegistrationCount": 250
        },
        "registrationLimit": 100,
        "registrationCount": 25,
        "assignedAt": "2024-01-15T10:30:00.000Z",
        "assignedBy": {
          "_id": "...",
          "userId": "ADMIN001",
          "firstName": "Admin",
          "lastName": "User"
        },
        "assignedByModel": "Admin"
      }
    ],
    "registrationLimits": {
      "level1": 100,
      "level2": 50
    },
    "registrationCounts": {
      "level1": 25,
      "level2": 10
    },
    "assignedDistrictCoordinators": [...]
  }
}
```

### Get My Users (Coordinator)
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [...],
  "coordinatorInfo": {
    "taskLevels": [...],
    "registrationLimits": {
      "level1": 100,
      "level2": 50
    },
    "registrationCounts": {
      "level1": 25,
      "level2": 10
    }
  },
  "count": 5
}
```

## Notes

1. **Registration Limits**: 
   - **Global Limit**: Each task level has a global registration limit that applies across all coordinators
   - **Per-Coordinator Limit**: Each coordinator can have a custom limit for each task level
   - **Dual Checking**: When creating a user, the system checks both the coordinator's limit AND the global task level limit
   - If a limit is 0, it means unlimited registrations for that level

2. **Task Level Assignment Tracking**:
   - Each task level assignment records:
     - When it was assigned (`assignedAt`)
     - Who assigned it (`assignedBy` and `assignedByModel`)
   - This provides full audit trail of task level assignments

3. **Task Levels**: Task levels can be assigned to multiple coordinators and are used to categorize and organize users based on their task assignments.

4. **Distribution**: The distribution/splitting feature allows higher-level users to assign lower-level users to manage, creating a flexible organizational structure.

5. **Automatic Tracking**: 
   - Registration counts are automatically incremented when users are created through the coordinator's createFieldManager endpoint
   - Both coordinator-specific and global task level counts are updated
   - Task creation time is automatically recorded when assigning task levels

6. **Validation**: The system validates that:
   - Registration limits cannot be set below current counts (both global and per-coordinator)
   - All task levels exist before assignment
   - All users exist before distribution assignment
   - Task level must be assigned to coordinator before users can register with that task level

7. **Creating Users with Task Levels**:
   - When creating a Field Manager, include `taskLevelId` in the request body to use task-level-specific limits
   - The system will check both the coordinator's limit for that task level AND the global task level limit
   - If both checks pass, both counts are incremented
