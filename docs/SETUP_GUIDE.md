# Setup Guide

## Prerequisites

1. **Node.js** (v14 or higher)
2. **MongoDB** (local installation or MongoDB Atlas)
3. **npm** or **yarn**

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

This will install:
- express
- mongoose
- jsonwebtoken
- crypto-js
- joi
- dotenv
- and other dependencies

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=mongodb://localhost:27017/adhyanguru

# JWT Secret Key (IMPORTANT: Change this in production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Password Encryption Key (IMPORTANT: Change this in production)
ENCRYPTION_KEY=your-encryption-secret-key-change-this-in-production

# Server Port (optional)
PORT=3000
```

**⚠️ Important:** 
- Never commit `.env` file to version control
- Use strong, random keys in production
- Keep keys secure and never share them

### 3. Start MongoDB

**Local MongoDB:**
```bash
# Windows
mongod

# Linux/Mac
sudo systemctl start mongod
# or
mongod
```

**MongoDB Atlas:**
- Update `DATABASE_URL` in `.env` with your Atlas connection string

### 4. Start the Server

```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in `.env`)

## Testing the API

### 1. Create Super Admin

```bash
POST http://localhost:3000/api/super-admin/signup
Content-Type: application/json

{
  "email": "superadmin@example.com",
  "mobileNumber": "1234567890",
  "password": "password123",
  "firstName": "Super",
  "lastName": "Admin"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Super Admin created successfully",
  "data": {
    "_id": "...",
    "userId": "ADGUSUP01",
    "email": "superadmin@example.com",
    "mobileNumber": "1234567890",
    "firstName": "Super",
    "lastName": "Admin",
    "role": "SUPER_ADMIN"
  }
}
```

### 2. Login

```bash
POST http://localhost:3000/api/super-admin/login
Content-Type: application/json

{
  "identifier": "superadmin@example.com",
  "password": "password123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "...",
      "userId": "ADGUSUP01",
      "email": "superadmin@example.com",
      "mobileNumber": "1234567890",
      "firstName": "Super",
      "lastName": "Admin",
      "role": "SUPER_ADMIN"
    }
  }
}
```

### 3. Create Admin (Protected Route)

```bash
POST http://localhost:3000/api/super-admin/create-admin
Authorization: Bearer <token_from_login>
Content-Type: application/json

{
  "email": "admin@example.com",
  "mobileNumber": "1234567891",
  "password": "password123",
  "firstName": "Admin",
  "lastName": "User"
}
```

## Using Postman or cURL

### Postman Collection

1. Import the following as a Postman collection
2. Set environment variables:
   - `base_url`: `http://localhost:3000/api`
   - `token`: (will be set after login)

### cURL Examples

**Signup:**
```bash
curl -X POST http://localhost:3000/api/super-admin/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@example.com",
    "mobileNumber": "1234567890",
    "password": "password123",
    "firstName": "Super",
    "lastName": "Admin"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/super-admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "superadmin@example.com",
    "password": "password123"
  }'
```

**Create Admin (with token):**
```bash
curl -X POST http://localhost:3000/api/super-admin/create-admin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "email": "admin@example.com",
    "mobileNumber": "1234567891",
    "password": "password123",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

## User Hierarchy Flow

1. **Super Admin** signs up (first user)
2. **Super Admin** creates **Admin**
3. **Admin** creates **District Coordinator**
4. **District Coordinator** creates **Coordinator**
5. **Coordinator** creates **Field Manager**
6. **Field Manager** creates **Team Leader**
7. **Team Leader** creates **Field Employee**

## Login Options

All users can login using any of these identifiers:
- **Email**: `user@example.com`
- **Mobile Number**: `1234567890`
- **User ID**: `ADGUSUP01`

Example:
```json
{
  "identifier": "ADGUSUP01",  // or email or mobileNumber
  "password": "password123"
}
```

## Troubleshooting

### Database Connection Error
- Check if MongoDB is running
- Verify `DATABASE_URL` in `.env` is correct
- Check MongoDB connection string format

### Authentication Error
- Verify JWT token is included in Authorization header
- Check token hasn't expired (default: 7 days)
- Ensure token format: `Bearer <token>`

### Password Decryption Error
- Only Super Admin can decrypt passwords
- Use `?includePassword=true` query parameter
- Check `ENCRYPTION_KEY` in `.env` matches the one used for encryption

### User Creation Permission Error
- Verify user has permission to create the target user type
- Check user hierarchy rules
- Ensure correct role in JWT token

## Next Steps

1. Review API documentation in `/docs` folder
2. Test all endpoints
3. Implement additional features as needed
4. Set up production environment variables
5. Configure CORS if needed for frontend integration

## Production Checklist

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Change `ENCRYPTION_KEY` to a strong random string
- [ ] Use MongoDB Atlas or secure database
- [ ] Enable HTTPS
- [ ] Set up proper CORS configuration
- [ ] Implement rate limiting
- [ ] Set up logging
- [ ] Configure error handling
- [ ] Set up monitoring
- [ ] Backup database regularly

