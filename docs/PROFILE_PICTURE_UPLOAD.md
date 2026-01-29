# Profile Picture Upload Documentation

## Overview

All users can upload profile pictures during signup or user creation. Profile pictures are:
- Processed and optimized using **Jimp** (resized to max 800x800px, quality reduced to 80%)
- Uploaded to **AWS S3** for storage
- Automatically assigned unique file names

## Features

- ✅ Image optimization using Jimp
- ✅ AWS S3 storage
- ✅ Automatic image resizing (max 800x800px)
- ✅ Quality reduction (80% JPEG quality)
- ✅ Support for JPEG, PNG, GIF, WebP formats
- ✅ Maximum file size: 5MB
- ✅ Creation time tracking

## Environment Variables

Add these to your `.env` file:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-s3-bucket-name
```

## API Usage

### Super Admin Signup with Profile Picture

**POST** `/api/super-admin/signup`

**Content-Type:** `multipart/form-data`

**Form Data:**
```
email: superadmin@example.com
mobileNumber: 1234567890
password: password123
firstName: Super
lastName: Admin
profilePicture: [file] (optional)
```

**Response:**
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
    "role": "SUPER_ADMIN",
    "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-filename.jpg",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Create User with Profile Picture

**POST** `/api/super-admin/create-user`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
```
userType: ADMIN
email: admin@example.com
mobileNumber: 1234567891
password: password123
firstName: Admin
lastName: User
district: District A (if required)
profilePicture: [file] (optional)
```

**Response:**
```json
{
  "success": true,
  "message": "ADMIN created successfully",
  "data": {
    "_id": "...",
    "userId": "ADGUADM01",
    "email": "admin@example.com",
    "mobileNumber": "1234567891",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN",
    "profilePicture": "https://your-bucket.s3.amazonaws.com/profile-pictures/uuid-filename.jpg",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Image Processing

### Jimp Processing
- **Resize**: Images are resized to maximum 800x800px while maintaining aspect ratio
- **Quality**: JPEG quality set to 80% for optimal file size
- **Format**: All images are converted to JPEG format

### Supported Formats
- JPEG/JPG
- PNG
- GIF
- WebP

### File Size Limits
- **Maximum size**: 5MB
- **Recommended**: Under 2MB for faster uploads

## AWS S3 Configuration

### Bucket Setup

1. Create an S3 bucket in your AWS account
2. Configure bucket permissions:
   - Enable public read access for profile pictures (or use CloudFront)
   - Set CORS configuration if needed

### IAM Policy Example

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/profile-pictures/*"
    }
  ]
}
```

### S3 Folder Structure

```
your-bucket/
  └── profile-pictures/
      ├── uuid-superadmin-ADGUSUP01.jpg
      ├── uuid-admin-ADGUADM01.jpg
      └── uuid-field_employee-ADGUF01.jpg
```

## cURL Examples

### Signup with Profile Picture

```bash
curl -X POST http://localhost:3000/api/super-admin/signup \
  -F "email=superadmin@example.com" \
  -F "mobileNumber=1234567890" \
  -F "password=password123" \
  -F "firstName=Super" \
  -F "lastName=Admin" \
  -F "profilePicture=@/path/to/image.jpg"
```

### Create User with Profile Picture

```bash
curl -X POST http://localhost:3000/api/super-admin/create-user \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "userType=ADMIN" \
  -F "email=admin@example.com" \
  -F "mobileNumber=1234567891" \
  -F "password=password123" \
  -F "firstName=Admin" \
  -F "lastName=User" \
  -F "profilePicture=@/path/to/image.jpg"
```

## Postman Example

1. Set request method to **POST**
2. Set URL: `http://localhost:3000/api/super-admin/signup`
3. Go to **Body** tab
4. Select **form-data**
5. Add fields:
   - `email` (Text)
   - `mobileNumber` (Text)
   - `password` (Text)
   - `firstName` (Text)
   - `lastName` (Text)
   - `profilePicture` (File) - Select file from your computer
6. Click **Send**

## Error Responses

### 400 Bad Request - Invalid File Type
```json
{
  "success": false,
  "message": "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed (max 5MB)"
}
```

### 400 Bad Request - File Too Large
```json
{
  "success": false,
  "message": "File size exceeds 5MB limit"
}
```

### 500 Internal Server Error - Image Processing Failed
```json
{
  "success": false,
  "message": "Error processing profile picture",
  "error": "Image processing failed: ..."
}
```

### 500 Internal Server Error - S3 Upload Failed
```json
{
  "success": false,
  "message": "Error processing profile picture",
  "error": "S3 upload failed: ..."
}
```

## Notes

1. **Profile picture is optional** - Users can sign up without a profile picture
2. **Automatic optimization** - All images are automatically optimized before upload
3. **Unique file names** - Each file gets a unique UUID-based name to prevent conflicts
4. **Creation time** - `createdAt` field is automatically set when user is created
5. **Public URLs** - Profile picture URLs are publicly accessible from S3
6. **File deletion** - Old profile pictures can be deleted from S3 when users update their pictures

## Updating Profile Picture

To update a profile picture, you would need to:
1. Delete the old picture from S3 (if exists)
2. Upload the new picture
3. Update the user's `profilePicture` field in the database

This functionality can be added as a separate endpoint if needed.

