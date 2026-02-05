const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-south-1'
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET;
if (process.env.AWS_S3_BUCKET && !process.env.AWS_S3_BUCKET_NAME) {
  console.warn('Using AWS_S3_BUCKET from environment. Consider setting AWS_S3_BUCKET_NAME for consistency.');
}

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
      throw new Error('AWS S3 bucket is not configured. Set AWS_S3_BUCKET_NAME or AWS_S3_BUCKET in environment variables');
    }

    // Generate unique file name
    const uniqueFileName = `${uuidv4()}-${fileName}`;
    const key = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;

    // Upload parameters
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType
    };

    // Add ACL only if explicitly enabled via env var (some buckets disallow ACLs)
    if (process.env.AWS_S3_USE_ACL === 'true') {
      params.ACL = 'public-read';
    }

    // Upload to S3
    const result = await s3.upload(params).promise();

    return result.Location; // Return the public URL
  } catch (error) {
    throw new Error(`S3 upload failed: ${error.message}`);
  }
};

/**
 * Delete file from AWS S3 (Optional - fails gracefully)
 * @param {string} fileUrl - S3 file URL
 * @returns {Promise<void>}
 * @description This function will not throw errors. It's optional to delete from S3.
 * If IAM permissions don't allow deletion, it will just log a warning and continue.
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
    // Don't throw error - S3 deletion is optional
    // Only log if it's not a permission error (permission errors are expected)
    if (!error.message || !error.message.includes('not authorized') && !error.message.includes('explicit deny')) {
      console.warn(`S3 delete warning (optional operation): ${error.message}`);
    }
    // Silently continue - deletion from S3 is optional
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

