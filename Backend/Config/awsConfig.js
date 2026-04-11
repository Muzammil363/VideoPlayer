import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { S3Client } from '@aws-sdk/client-s3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const requiredEnv = [
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_RAW_BUCKET_NAME',
  'AWS_THUMBNAILS_BUCKET_NAME',
  'AWS_PROCESSED_BUCKET_NAME',
];

const missing = requiredEnv.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.warn(`Warning: Missing AWS env vars: ${missing.join(', ')}`);
}

export const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
