const cloudinary = require('cloudinary').v2;
const FormData = require('form-data');
const axios = require('axios');

// Configure Cloudinary if credentials are present
const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// ImgBB API Configuration
const IMGBB_API_KEY = process.env.IMGBB_API_KEY || 'a0d1c7f2693c806b61ca26899e0a1a29';
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

/**
 * Uploads a file buffer to Cloudinary (preferred) or ImgBB (fallback).
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} fileName - Original file name
 * @param {string} mimeType - The mime type of the file
 * @param {string} folder - The destination folder on Cloudinary
 * @returns {Promise<{url: string, display_url: string, thumb_url: string, delete_hash: string}>}
 */
const uploadImage = async (fileBuffer, fileName, mimeType = 'image/jpeg', folder = 'smartplaza') => {
  if (isCloudinaryConfigured) {
    try {
      const base64Data = fileBuffer.toString('base64');
      const dataURI = `data:${mimeType || 'image/jpeg'};base64,${base64Data}`;
      
      const response = await cloudinary.uploader.upload(dataURI, {
        folder: folder,
        resource_type: 'auto'
      });

      return {
        url: response.secure_url,
        display_url: response.secure_url,
        thumb_url: response.secure_url,
        delete_hash: response.public_id
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error.message || error);
      throw error;
    }
  } else {
    // Fallback to ImgBB
    try {
      const formData = new FormData();
      formData.append('image', fileBuffer, {
        filename: fileName || 'image.jpg',
        contentType: mimeType || 'image/jpeg',
      });

      const response = await axios.post(IMGBB_API_URL, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        params: {
          key: IMGBB_API_KEY,
        },
      });

      if (response.data.success) {
        return {
          url: response.data.data.url,
          display_url: response.data.data.display_url,
          thumb_url: response.data.data.thumb?.url || response.data.data.url,
          delete_hash: response.data.data.deletehash
        };
      } else {
        throw new Error('ImgBB upload failed');
      }
    } catch (error) {
      console.error('ImgBB upload error:', error.response?.data || error.message);
      throw error;
    }
  }
};

module.exports = {
  uploadImage,
  isCloudinaryConfigured
};
