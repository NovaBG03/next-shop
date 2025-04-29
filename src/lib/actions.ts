'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { type } from 'arktype';
import { ObjectId } from 'mongodb';

import mongoClient from '~/lib/mongodb/client';
import s3Client from '~/lib/s3';
import { collections, getDefaultDb } from './mongodb/db';
import { Category } from './mongodb/schema';

const formDataToObject = (formData: FormData) => {
  const obj: Record<string, unknown> = {};
  formData.forEach((value, key) => {
    if (typeof value === undefined) {
      return;
    }
    if (typeof value === 'string') {
      obj[key] = value.trim();
      return;
    }
    obj[key] = value;
  });
  return obj;
};

const getObjectId = <T extends string | ObjectId | undefined>(
  id: T,
): T extends undefined ? undefined : ObjectId => {
  if (typeof id === 'undefined') {
    return undefined as never;
  }
  if (id instanceof ObjectId) {
    return id as never;
  }
  try {
    return new ObjectId(id as string) as never;
  } catch (error) {
    throw new Error(`Invalid ID format: ${id}`, { cause: error });
  }
};

export const getAllCategories = async () => {
  try {
    const db = getDefaultDb();
    const collectionCategories = collections.categories(db);
    return await collectionCategories.find().sort({ createdAt: 1 }).toArray();
  } catch (error) {
    throw new Error('Error fetching categories:', { cause: error });
  }
};

export const getCategory = async (id: string | ObjectId) => {
  try {
    const db = getDefaultDb();
    return await collections.categories(db).findOne({ _id: getObjectId(id) });
  } catch (error) {
    throw new Error('Error fetching category:', { cause: error });
  }
};

const getExistingCategoryErrorMessage = async (
  data: {
    id?: string | ObjectId;
    slug: string;
    name: string;
  },
  db = getDefaultDb(),
) => {
  const objectId = getObjectId(data.id);
  const category = await collections.categories(db).findOne({
    ...(objectId ? { _id: { $ne: objectId } } : {}),
    $or: [{ slug: data.slug }, { name: data.name }],
  });

  if (!category) {
    return;
  }
  if (data.name === category.name) {
    return `Category with name "${data.name}" already exists.`;
  }
  if (data.slug === category.slug) {
    return `Category with slug "${data.slug}" already exists.`;
  }
};

const NewCategoryData = Category.pick('name', 'slug', 'description');

type CreateCategoryActionResult =
  | undefined
  | { data: Record<string, unknown>; error?: string | undefined };

export const createCategoryAction = async (
  _: unknown,
  formData: FormData,
): Promise<CreateCategoryActionResult> => {
  const dataObject = formDataToObject(formData);
  const data = NewCategoryData(dataObject);
  if (data instanceof type.errors) {
    return { data: dataObject, error: data.summary };
  }

  try {
    const db = getDefaultDb();
    const collectionCategories = collections.categories(db);

    const existingCategoryErrorMessage = await getExistingCategoryErrorMessage(data, db);
    if (existingCategoryErrorMessage) {
      return { data, error: existingCategoryErrorMessage };
    }

    await collectionCategories.insertOne({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    revalidatePath('/admin/categories');
  } catch (error) {
    console.error('Error creating new category:', error);
    return { data, error: 'Failed to create category due to a server error.' };
  }
  redirect('/admin/categories');
};

const UpdateCategoryData = Category.pick('name', 'slug', 'description');

type UpdateCategoryActionResult =
  | undefined
  | { data: Record<string, unknown>; error?: string | undefined };

export const updateCategoryAction = async (
  categoryId: string,
  _: unknown,
  formData: FormData,
): Promise<UpdateCategoryActionResult> => {
  const dataObject = formDataToObject(formData);
  const data = UpdateCategoryData(dataObject);
  if (data instanceof type.errors) {
    return { data: dataObject, error: data.summary };
  }
  try {
    const db = getDefaultDb();
    const collectionCategories = collections.categories(db);

    const objectId = getObjectId(categoryId);

    const existingCategoryErrorMessage = await getExistingCategoryErrorMessage(
      { ...data, id: objectId },
      db,
    );
    if (existingCategoryErrorMessage) {
      return { data, error: existingCategoryErrorMessage };
    }

    const result = await collectionCategories.updateOne(
      { _id: objectId },
      {
        $set: {
          ...data,
          updatedAt: new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      return { data, error: 'Category not found for update.' };
    }

    revalidatePath('/admin/categories');
    revalidatePath(`/admin/categories/${categoryId}/edit`);
  } catch (error) {
    console.error('Error updating category:', error);
    return { data, error: 'Failed to update category due to a server error.' };
  }
  redirect('/admin/categories');
};

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
