import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { env } from './env';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload a Buffer (e.g. from multer memoryStorage) directly to Cloudinary via stream.
 */
export const uploadBufferToCloudinary = (
  buffer: Buffer,
  folder: string = 'egowshala',
  resourceType: 'image' | 'raw' | 'auto' = 'image'
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error('Cloudinary upload returned empty response'));
        }
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

/**
 * Upload a Base64 string or data URL to Cloudinary.
 */
export const uploadBase64ToCloudinary = async (
  base64String: string,
  folder: string = 'egowshala',
  resourceType: 'image' | 'raw' | 'auto' = 'image'
): Promise<UploadApiResponse> => {
  return cloudinary.uploader.upload(base64String, {
    folder,
    resource_type: resourceType,
  });
};

export default cloudinary;
