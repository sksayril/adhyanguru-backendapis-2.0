const Jimp = require('jimp');
const path = require('path');
const fs = require('fs').promises;

/**
 * Process and optimize image using Jimp
 * @param {Buffer} imageBuffer - Image buffer to process
 * @param {number} maxWidth - Maximum width (default: 800)
 * @param {number} maxHeight - Maximum height (default: 800)
 * @param {number} quality - JPEG quality 0-100 (default: 80)
 * @returns {Promise<Buffer>} Processed image buffer
 */
const processImage = async (imageBuffer, maxWidth = 800, maxHeight = 800, quality = 80) => {
  try {
    // Read image from buffer
    const image = await Jimp.read(imageBuffer);

    // Get original dimensions
    const originalWidth = image.bitmap.width;
    const originalHeight = image.bitmap.height;

    // Calculate new dimensions maintaining aspect ratio
    let newWidth = originalWidth;
    let newHeight = originalHeight;

    if (originalWidth > maxWidth || originalHeight > maxHeight) {
      const aspectRatio = originalWidth / originalHeight;

      if (originalWidth > originalHeight) {
        newWidth = maxWidth;
        newHeight = Math.round(maxWidth / aspectRatio);
      } else {
        newHeight = maxHeight;
        newWidth = Math.round(maxHeight * aspectRatio);
      }
    }

    // Resize image
    image.resize(newWidth, newHeight);

    // Convert to buffer with quality settings
    const processedBuffer = await image
      .quality(quality)
      .getBufferAsync(Jimp.MIME_JPEG);

    return processedBuffer;
  } catch (error) {
    throw new Error(`Image processing failed: ${error.message}`);
  }
};

/**
 * Validate image file
 * @param {Object} file - Multer file object
 * @returns {boolean} True if valid
 */
const validateImage = (file) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!file) {
    return false;
  }

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return false;
  }

  if (file.size > maxSize) {
    return false;
  }

  return true;
};

/**
 * Get file extension from mimetype
 * @param {string} mimetype - MIME type
 * @returns {string} File extension
 */
const getFileExtension = (mimetype) => {
  const mimeToExt = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp'
  };

  return mimeToExt[mimetype] || 'jpg';
};

module.exports = {
  processImage,
  validateImage,
  getFileExtension
};

