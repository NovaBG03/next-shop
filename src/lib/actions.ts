'use server';

import { revalidatePath } from 'next/cache';

import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import mongoClient from '~/lib/mongodb/client';
import s3Client from '~/lib/s3';

export const addNewProduct = async (count: number) => {
  console.log('add');
  await mongoClient
    .db('next-shop')
    .collection('products')
    .insertOne({ name: 'ivan' + count });
  revalidatePath('/');
};

export const removeProduct = async () => {
  console.log('delete');
  await mongoClient.db('next-shop').collection('products').deleteOne();
  revalidatePath('/');
};

export const getPresignedUploadUrl = async (fileName: string, fileType: string) => {
  if (!s3Client) {
    return { failure: 'S3 client or bucket name not configured' };
  }

  // TODO: make sure the Bucket is created
  try {
    // Create a command to put the object in the bucket
    const command = new PutObjectCommand({
      Bucket: 'test-bucket',
      Key: Math.random() + '_' + fileName, // The desired name for the file in the bucket
      ContentType: fileType, // The MIME type of the file
      ACL: 'public-read',
    });

    // Generate the presigned URL, valid for 60 seconds
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

    return { success: { url: signedUrl } };
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return { failure: 'Could not get presigned URL' };
  }
};
