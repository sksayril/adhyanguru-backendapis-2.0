const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

/**
 * Upload file to AWS S3
 * @param {Buffer|Stream} fileBody - File buffer or stream to upload
 * @param {string} fileName - File name
 * @param {string} contentType - MIME type
 * @param {string} folder - Folder path in S3 (optional)
 * @returns {Promise<string>} S3 file URL
 */
const uploadToS3 = async (fileBuffer, fileName, contentType, folder = 'profile-pictures') => {
  try {
    if (!BUCKET_NAME) {
      throw new Error('AWS_S3_BUCKET_NAME is not configured');
    }

    // Generate unique file name
    const uniqueFileName = `${uuidv4()}-${fileName}`;
    const key = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;

    // Upload parameters
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      ACL: 'public-read' // Make file publicly accessible
    };

    // Upload to S3
    const result = await s3.upload(params).promise();

    return result.Location; // Return the public URL
  } catch (error) {
    throw new Error(`S3 upload failed: ${error.message}`);
  }
};

/**
 * Delete file from AWS S3
 * @param {string} fileUrl - S3 file URL
 * @returns {Promise<void>}
 */
const deleteFromS3 = async (fileUrl) => {
  try {
    if (!BUCKET_NAME || !fileUrl) {
      return;
    }

    // Extract key from URL
    const urlParts = fileUrl.split('/');
    const key = urlParts.slice(-2).join('/'); // Get folder/filename

    const params = {
      Bucket: BUCKET_NAME,
      Key: key
    };

    await s3.deleteObject(params).promise();
  } catch (error) {
    console.error(`S3 delete failed: ${error.message}`);
    // Don't throw error, just log it
  }
};

/**
 * Extract S3 key from URL
 * @param {string} fileUrl - S3 file URL
 * @returns {string} S3 key
 */
const extractKeyFromUrl = (fileUrl) => {
  if (!fileUrl) return null;
  
  try {
    const url = new URL(fileUrl);
    // Remove leading slash and get path
    return url.pathname.substring(1);
  } catch (error) {
    // If URL parsing fails, try to extract from string
    const parts = fileUrl.split('/');
    return parts.slice(-2).join('/');
  }
};

module.exports = {
  uploadToS3,
  deleteFromS3,
  extractKeyFromUrl
};

