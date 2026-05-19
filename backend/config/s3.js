// AWS S3 Configuration with Mock Mode Support
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// check for aws keys
const hasAwsCredentials = () => {
  return process.env.AWS_ACCESS_KEY_ID && 
         process.env.AWS_SECRET_ACCESS_KEY && 
         process.env.S3_BUCKET_NAME;
};

// start s3 if we have keys
let s3Client = null;
if (hasAwsCredentials()) {
  s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}


async function ensureUploadDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}


function generateUniqueKey(originalFilename) {
  const ext = path.extname(originalFilename);
  const uuid = crypto.randomUUID();
  const timestamp = new Date().toISOString().slice(0, 7); // YYYY-MM
  return `policies/${timestamp}/${uuid}${ext}`;
}


async function uploadToS3(buffer, key, mimeType) {
  if (s3Client && hasAwsCredentials()) {
    // Real S3 upload
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ServerSideEncryption: 'AES256',
    });

    await s3Client.send(command);

    const s3_file_url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    return { s3_file_url, s3_file_key: key };
  } else {
    // save locally instead of aws
    await ensureUploadDir();
    
    const filePath = path.join(UPLOAD_DIR, key);
    const fileDir = path.dirname(filePath);
    
    await fs.mkdir(fileDir, { recursive: true });
    await fs.writeFile(filePath, buffer);
    
    // Return a mock URL that will be served via local endpoint
    const s3_file_url = `/api/files/${key}`;
    return { s3_file_url, s3_file_key: key };
  }
}


async function getPresignedUrl(key, expiresIn = 900) {
  if (s3Client && hasAwsCredentials()) {
    // Real S3 presigned URL
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } else {
    // Mock mode: Return local URL
    return `/api/files/${key}`;
  }
}


function getLocalFilePath(key) {
  return path.join(UPLOAD_DIR, key);
}

module.exports = { 
  s3Client, 
  uploadToS3, 
  getPresignedUrl, 
  getLocalFilePath,
  isMockMode: () => !hasAwsCredentials() 
};