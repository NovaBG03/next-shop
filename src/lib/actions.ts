'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { type } from 'arktype';
import { ObjectId } from 'mongodb';

import { collections, getDefaultDb } from './mongodb/db';
import { Category, Product } from './mongodb/schema';

const formDataToObject = (formData: FormData) => {
  const formDataObject: Record<string, unknown> = {};
  [...new Set([...formData.keys()])].forEach((key) => {
    const values = formData.getAll(key);
    formDataObject[key] = values.length === 1 ? values[0] : values;
  });
  return formDataObject;
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

  if (!category) return;
  if (data.name === category.name) return `Category with name "${data.name}" already exists.`;
  if (data.slug === category.slug) return `Category with slug "${data.slug}" already exists.`;
};

const NewCategoryData = Category.pick('name', 'slug', 'description');

type MutateActionResult = undefined | { data: Record<string, unknown>; error?: string | undefined };
export type MutateAction = (data: unknown, formData: FormData) => Promise<MutateActionResult>;

export const createCategoryAction = async (
  _: unknown,
  formData: FormData,
): Promise<MutateActionResult> => {
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

export const updateCategoryAction = async (
  categoryId: string,
  _: unknown,
  formData: FormData,
): Promise<MutateActionResult> => {
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

// export const getPresignedUploadUrl = async (fileName: string, fileType: string) => {
//   if (!s3Client) {
//     return { error: 'S3 client or bucket name not configured' };
//   }

//   const safeFileName = `${new Date().toISOString()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '')}`;
//   const key = `products/${safeFileName}`;

//   try {
//     // Create a command to put the object in the bucket
//     const command = new PutObjectCommand({
//       Bucket: process.env.S3_BUCKET_NAME || 'test-bucket',
//       Key: key,
//       ContentType: fileType,
//     });

//     // Generate the presigned URL, valid for 5 minutes
//     const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

//     // Construct the public URL that will be accessible after upload
//     const publicUrl = process.env.S3_PUBLIC_URL
//       ? `${process.env.S3_PUBLIC_URL}/${key}`
//       : `${process.env.S3_ENDPOINT || 'http://localhost:9000'}/test-bucket/${key}`;

//     return {
//       uploadUrl,
//       publicUrl,
//       key,
//     };
//   } catch (error) {
//     console.error('Error generating presigned URL:', error);
//     return { error: 'Could not get presigned URL' };
//   }
// };

// Batch generate presigned URLs for multiple file uploads
// export const getMultiplePresignedUrls = async (files: { name: string; type: string }[]) => {
//   const results = await Promise.all(
//     files.map(async (file) => {
//       const result = await getPresignedUploadUrl(file.name, file.type);
//       return {
//         fileName: file.name,
//         ...result,
//       };
//     }),
//   );

//   return results;
// };

// Helper to safely parse JSON from FormData, returning null on error
// const safeJsonParse = <T>(jsonString: string | undefined | null): T | null => {
//   if (!jsonString) return null;
//   try {
//     return JSON.parse(jsonString) as T;
//   } catch (e) {
//     console.error('Failed to parse JSON:', e);
//     return null;
//   }
// };

export const getProduct = async (id: string | ObjectId) => {
  try {
    const db = getDefaultDb();
    return await collections.products(db).findOne({ _id: getObjectId(id) });
  } catch (error) {
    console.error(`Error fetching product with ID ${id}:`, error);
    return null;
  }
};

const StringToTwoDecimalFloat = type('string').pipe.try(
  (str) => +Number.parseFloat(str).toFixed(2),
);

const NewProductData = type({
  '...': Product.pick('name', 'slug', 'description'),
  price: StringToTwoDecimalFloat.to(Product.get('price')),
  stock: type('string.integer.parse').to(Product.get('stock')),
  categoryIds: type('string | string[]')
    .pipe.try((v) => (typeof v === 'string' ? [getObjectId(v)] : v.map(getObjectId)))
    .to(Product.get('categoryIds')),
});

export const createProductAction = async (
  _: unknown,
  formData: FormData,
): Promise<MutateActionResult> => {
  console.log(formData);
  const dataObject = formDataToObject(formData);
  console.log(dataObject);
  const data = NewProductData(dataObject);
  if (data instanceof type.errors) {
    return { data: dataObject, error: data.summary };
  }

  console.log('DATA');
  console.log(data);
  return;
};

// // --- Helper to parse and prepare product data from FormData ---
// const parseProductFormData = (formData: FormData): Record<string, unknown> => {
//   const dataObject = Object.fromEntries(formData.entries());
//   const parsedData: Record<string, unknown> = { ...dataObject };

//   parsedData.price = parseFloat((dataObject.price as string) || '0');
//   parsedData.stock = dataObject.stock ? parseInt(dataObject.stock as string, 10) : undefined;

//   const categoryIdsRaw = formData.getAll('categoryIds');
//   parsedData.categoryIds = categoryIdsRaw.map((id) => {
//     if (typeof id === 'string' && ObjectId.isValid(id)) {
//       return new ObjectId(id);
//     }
//     throw new Error(`Invalid category ID format in selection: ${id}`);
//   });

//   parsedData.images = safeJsonParse<ImageMetadata[]>(dataObject.images as string) ?? [];
//   parsedData.options = safeJsonParse<ProductOption[]>(dataObject.options as string);
//   parsedData.variants = safeJsonParse<ProductVariant[]>(dataObject.variants as string);

//   if (
//     !parsedData.options ||
//     (Array.isArray(parsedData.options) && parsedData.options.length === 0)
//   ) {
//     delete parsedData.options;
//   }
//   if (
//     !parsedData.variants ||
//     (Array.isArray(parsedData.variants) && parsedData.variants.length === 0)
//   ) {
//     delete parsedData.variants;
//   }
//   delete parsedData.hasVariants;

//   return parsedData;
// };

// export type ProductFormState = {
//   errors?: Record<string, string[]>; // Revert to simpler structure
//   productData?: Record<string, unknown>; // Keep raw form data for repopulation
// };

// // Define ProductFormData ArkType before use
// const ProductFormData = Product.pick(
//   'name',
//   'slug',
//   'description',
//   'price',
//   'sku',
//   'stock',
//   'categoryIds',
//   'images',
//   'options',
//   'variants',
// );

// // --- Create Product Action ---
// export const createProductAction = async (
//   prevState: ProductFormState | undefined,
//   formData: FormData,
// ): Promise<ProductFormState> => {
//   let parsedData: Record<string, unknown>;
//   try {
//     parsedData = parseProductFormData(formData);
//   } catch (error) {
//     console.error('Error parsing form data:', error);
//     const message = error instanceof Error ? error.message : 'Failed to parse form data.';
//     return {
//       message,
//       errors: { _form: [message] }, // Simple form error
//       productData: Object.fromEntries(formData.entries()), // Return raw form data on parse error
//     };
//   }

//   const result = ProductFormData(parsedData);

//   if (result instanceof type.errors) {
//     console.error('Validation Errors:', result.summary, result);
//     // Use summary for a general message, and pass back data
//     return {
//       // errors: result.byKey, // Avoid complex mapping for now
//       productData: parsedData, // Return parsed data for repopulation
//       message: `Validation failed: ${result.summary}`,
//     };
//   }

//   const validatedProductData = result;

//   try {
//     const db = getDefaultDb();
//     const collectionProducts = collections.products(db);

//     console.log('Data to insert:', validatedProductData);
//     await collectionProducts.insertOne({
//       _id: new ObjectId(),
//       ...validatedProductData,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     });

//     revalidatePath('/admin/products');
//   } catch (error) {
//     console.error('Error creating product:', error);
//     return {
//       productData: validatedProductData, // Return validated data even on DB error
//       message: 'Failed to create product due to a server error.',
//     };
//   }

//   redirect('/admin/products');
// };

// // --- Update Product Action ---
// export const updateProductAction = async (
//   productId: string,
//   prevState: ProductFormState | undefined,
//   formData: FormData,
// ): Promise<ProductFormState> => {
//   let objectId: ObjectId;
//   try {
//     objectId = getObjectId(productId);
//   } catch (e) {
//     console.error('Invalid product ID for update:', productId, e);
//     return { message: 'Invalid product ID provided.' };
//   }

//   let parsedData: Record<string, unknown>;
//   try {
//     parsedData = parseProductFormData(formData);
//   } catch (error) {
//     console.error('Error parsing form data for update:', error);
//     const message = error instanceof Error ? error.message : 'Failed to parse form data.';
//     return {
//       message,
//       errors: { _form: [message] }, // Simple form error
//       productData: Object.fromEntries(formData.entries()),
//     };
//   }

//   const result = ProductFormData(parsedData);

//   if (result instanceof type.errors) {
//     console.error('Validation Errors:', result.summary, result);
//     // Use summary for a general message, and pass back data
//     return {
//       // errors: result.byKey, // Avoid complex mapping for now
//       productData: parsedData, // Return parsed data for repopulation
//       message: `Validation failed: ${result.summary}`,
//     };
//   }

//   const validatedProductData = result;

//   try {
//     const db = getDefaultDb();
//     const collectionProducts = collections.products(db);

//     console.log(`Data to update for ${productId}:`, validatedProductData);
//     const updateResult = await collectionProducts.updateOne(
//       { _id: objectId },
//       { $set: { ...validatedProductData, updatedAt: new Date() } },
//     );

//     if (updateResult.matchedCount === 0) {
//       return { productData: validatedProductData, message: 'Product not found for update.' };
//     }

//     revalidatePath('/admin/products');
//     revalidatePath(`/admin/products/${productId}/edit`);
//   } catch (error) {
//     console.error('Error updating product:', error);
//     return {
//       productData: validatedProductData,
//       message: 'Failed to update product due to a server error.',
//     };
//   }

//   // Return success message and potentially the updated data
//   // Returning the data helps if we want the form to reflect the saved state immediately
//   return { message: 'Product updated successfully!', productData: validatedProductData };
// };
