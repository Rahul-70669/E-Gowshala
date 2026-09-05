import dotenv from 'dotenv';
dotenv.config();
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function testCloudinary() {
  console.log('Testing Cloudinary with cloud_name:', process.env.CLOUDINARY_CLOUD_NAME);
  try {
    const res = await cloudinary.api.ping();
    console.log('✅ Cloudinary Ping Successful:', res);
    
    // Upload a small 1x1 test pixel
    const testPixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const uploadRes = await cloudinary.uploader.upload(testPixel, {
      folder: 'egowshala/test',
      public_id: 'ping_test',
      overwrite: true,
    });
    console.log('✅ Cloudinary Test Image Uploaded:');
    console.log('   URL:', uploadRes.secure_url);
    console.log('   Public ID:', uploadRes.public_id);
  } catch (err: any) {
    console.error('❌ Cloudinary Test Failed:', err.message || err);
  }
}

testCloudinary();
