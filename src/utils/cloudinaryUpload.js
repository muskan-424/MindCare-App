import axios from 'axios';

const CLOUDINARY_CLOUD_NAME = 'dx9gbds0a';
const CLOUDINARY_UPLOAD_PRESET = 'mindcare_profiles'; // unsigned upload preset

/**
 * Uploads an image to Cloudinary using an unsigned upload preset.
 * No API secret needed on the client side — the upload preset handles auth.
 *
 * @param {string} imageUri - Local file URI from image picker (e.g. file:///...)
 * @param {string} folder   - Cloudinary folder to organize uploads (e.g. 'profile_pics')
 * @returns {Promise<string>} - The secure HTTPS URL of the uploaded image
 */
export const uploadImageToCloudinary = async (imageUri, folder = 'profile_pics') => {
  const formData = new FormData();

  // Extract filename and type from URI
  const filename = imageUri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('file', {
    uri: imageUri,
    name: filename || 'profile.jpg',
    type,
  });
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);

  const response = await axios.post(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000, // 30s for slow mobile connections
    }
  );

  return response.data.secure_url;
};
