import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3';

if (!process.env.S3_ACCESS_KEY_ID) {
  throw new Error('Missing environment variable: "S3_ACCESS_KEY_ID"');
}
if (!process.env.S3_SECRET_ACCESS_KEY) {
  throw new Error('Missing environment variable: "S3_SECRET_ACCESS_KEY"');
}

const options: S3ClientConfig = {
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION,
  forcePathStyle: true, // required for MinIO
};

let s3Client: S3Client;

if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line prefer-const
  let globalWithS3 = global as typeof globalThis & {
    _s3Client?: S3Client;
  };

  if (!globalWithS3._s3Client) {
    globalWithS3._s3Client = new S3Client(options);
  }
  s3Client = globalWithS3._s3Client;
} else {
  s3Client = new S3Client(options);
}

export default s3Client;
