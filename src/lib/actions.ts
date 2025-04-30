'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { type } from 'arktype';
import { ObjectId } from 'mongodb';

import { collections, getDefaultDb } from './mongodb/db';
import { Category, Product } from './mongodb/schema';
import { seedCategories, seedProducts } from './seed';

const PRODUCTS_TEXT_SEARCH_INDEX = 'products_text_search';

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

export const getCategoriesPage = async (page = 1, limit = 10) => {
  try {
    const db = getDefaultDb();
    const collectionCategories = collections.categories(db);

    const [results, total] = await Promise.all([
      collectionCategories
        .find()
        .sort({ createdAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      collectionCategories.countDocuments(),
    ]);

    return { results, total, totalPages: Math.ceil(total / limit) };
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

const NewCategoryData = type({
  '...': Category.pick('name', 'slug', 'description'),
  '+': 'delete',
});

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
    revalidatePath('/admin');
    revalidatePath('/admin/categories');
  } catch (error) {
    console.error('Error creating new category:', error);
    return { data, error: 'Failed to create category due to a server error.' };
  }
  redirect('/admin/categories');
};

const UpdateCategoryData = type({
  '...': Category.pick('name', 'slug', 'description'),
  '+': 'delete',
});

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

    revalidatePath('/admin');
    revalidatePath('/admin/categories');
    revalidatePath(`/admin/categories/${categoryId}/edit`);
  } catch (error) {
    console.error('Error updating category:', error);
    return { data, error: 'Failed to update category due to a server error.' };
  }
  redirect('/admin/categories');
};

export const getProduct = async (id: string | ObjectId) => {
  try {
    const db = getDefaultDb();
    return await collections.products(db).findOne({ _id: getObjectId(id) });
  } catch (error) {
    console.error(`Error fetching product with ID ${id}:`, error);
    return null;
  }
};

export const getProductsPage = async (page = 1, limit = 10) => {
  try {
    const db = getDefaultDb();
    const collectionProducts = collections.products(db);

    const [results, total] = await Promise.all([
      collectionProducts
        .find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      collectionProducts.countDocuments(),
    ]);

    return { results, total, totalPages: Math.ceil(total / limit) };
  } catch (error) {
    throw new Error('Error fetching products:', { cause: error });
  }
};

const getExistingProductErrorMessage = async (
  data: {
    id?: string | ObjectId;
    slug: string;
    name: string;
  },
  db = getDefaultDb(),
) => {
  const objectId = getObjectId(data.id);
  const product = await collections.products(db).findOne({
    ...(objectId ? { _id: { $ne: objectId } } : {}),
    $or: [{ slug: data.slug }, { name: data.name }],
  });

  if (!product) return;
  if (data.name === product.name) return `Product with name "${data.name}" already exists.`;
  if (data.slug === product.slug) return `Product with slug "${data.slug}" already exists.`;
};

const StringToTwoDecimalFloat = type('string').pipe.try(
  (str) => +Number.parseFloat(str).toFixed(2),
);

const imageUrlToImage = (url: string) => ({ url, alt: 'Product Image' });

const NewProductData = type({
  '...': Product.pick('name', 'slug', 'description'),
  price: StringToTwoDecimalFloat.to(Product.get('price')),
  stock: type('string.integer.parse').to(Product.get('stock')),
  categoryIds: type('string | string[]')
    .pipe.try((v) => (typeof v === 'string' ? [getObjectId(v)] : v.map(getObjectId)))
    .to(Product.get('categoryIds')),
  imageUrls: type('string.url | string.url[]').pipe((v) =>
    typeof v === 'string' ? [imageUrlToImage(v)] : v.map(imageUrlToImage),
  ),
  '+': 'delete',
});

export const createProductAction = async (
  _: unknown,
  formData: FormData,
): Promise<MutateActionResult> => {
  const dataObject = formDataToObject(formData);
  const data = NewProductData(dataObject);
  if (data instanceof type.errors) {
    return { data: dataObject, error: data.summary };
  }

  try {
    const db = getDefaultDb();
    const collectionProducts = collections.products(db);

    const existingProductErrorMessage = await getExistingProductErrorMessage(data, db);
    if (existingProductErrorMessage) {
      return { data, error: existingProductErrorMessage };
    }

    await collectionProducts.insertOne({
      ...data,
      images: data.imageUrls,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    revalidatePath('/admin');
    revalidatePath('/admin/products');
  } catch (error) {
    console.error('Error creating new product:', error);
    return { data, error: 'Failed to create product due to a server error.' };
  }
  redirect('/admin/products');
};

export const clearDatabaseAction = async (): Promise<void> => {
  const db = getDefaultDb();

  await collections.categories(db).deleteMany({});
  await collections.products(db).deleteMany({});

  revalidatePath('/admin');
  revalidatePath('/admin/categories');
  revalidatePath('/admin/products');
};

export const dropIndexesAction = async (): Promise<void> => {
  const db = getDefaultDb();

  await collections.categories(db).dropIndexes();
  await collections.products(db).dropIndexes();

  revalidatePath('/admin');
  revalidatePath('/admin/categories');
  revalidatePath('/admin/products');
};

export const initializeIndexesAction = async (): Promise<void> => {
  try {
    const db = getDefaultDb();

    await collections
      .categories(db)
      .createIndexes([
        { key: { slug: 1 }, unique: true },
        { key: { name: 1 }, unique: true },
        { key: { createdAt: 1 } },
      ]);

    await collections.products(db).createIndexes([
      { key: { slug: 1 }, unique: true },
      { key: { name: 1 }, unique: true },
      { key: { categoryIds: 1 } },
      { key: { price: 1 } },
      { key: { stock: 1 } },
      { key: { createdAt: -1 } },
      {
        key: { name: 'text', description: 'text' },
        weights: { name: 10, description: 5 },
        name: PRODUCTS_TEXT_SEARCH_INDEX,
      },
    ]);
  } catch (error) {
    console.log('Error initializing database indexes:', error);
  }
  revalidatePath('/admin');
};

export const seedDatabaseAction = async (): Promise<void> => {
  try {
    const db = getDefaultDb();
    const categoriesCollection = collections.categories(db);
    const productsCollection = collections.products(db);

    const categoriesToInsert = seedCategories.map((category) => ({
      ...category,
      _id: new ObjectId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    await categoriesCollection.insertMany(categoriesToInsert);

    const categorySlugToIdMap = new Map<string, ObjectId>();
    categoriesToInsert.forEach((category) => categorySlugToIdMap.set(category.slug, category._id));

    const productsToInsert = seedProducts.map((prodData) => {
      const { categorySlugs, ...restProdData } = prodData;
      const categoryIds =
        categorySlugs
          ?.map((slug) => categorySlugToIdMap.get(slug))
          .filter((id): id is ObjectId => id !== undefined) ?? [];

      const variants = (restProdData.variants ?? []).map((variant) => ({
        ...variant,
        images: variant.images ?? [],
      }));

      return {
        ...restProdData,
        _id: new ObjectId(),
        categoryIds,
        variants: variants,
        options: restProdData.options ?? [],
        images: restProdData.images ?? [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    if (productsToInsert.length > 0) {
      const validatedProducts = productsToInsert
        .map((p) => Product(p))
        .filter((x) => !(x instanceof type.errors));

      const errors = validatedProducts.filter((p) => p instanceof type.errors);
      if (errors.length > 0) {
        console.error(
          'Validation errors in seed products:',
          errors.map((e) => e.summary),
        );
        throw new Error(`Validation failed for ${errors.length} seed products. Check console.`);
      }

      await productsCollection.insertMany(validatedProducts as Product[]);
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/admin/categories');
  revalidatePath('/admin/products');
};

export const isProductTextSearchIndexInitialized = async () => {
  const db = getDefaultDb();
  const indexes = await collections.products(db).indexes();
  return indexes.some((index) => index.name === PRODUCTS_TEXT_SEARCH_INDEX);
};
