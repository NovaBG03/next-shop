import { type } from 'arktype';
import { ObjectId as MongoObjectId } from 'mongodb';

const ObjectId = type.instanceOf(MongoObjectId);
type ObjectId = typeof ObjectId.infer;

export const ImageMetadata = type({
  url: 'string',
  'alt?': 'string',
});
export type ImageMetadata = typeof ImageMetadata.infer;

export const ProductOption = type({
  name: 'string',
  values: 'string[]',
});
export type ProductOption = typeof ProductOption.infer;

export const ProductVariant = type({
  optionValues: 'string[]',
  price: 'number',
  stock: 'number',
  'images?': ImageMetadata.array(),
});
export type ProductVariant = typeof ProductVariant.infer;

const Slug = type('3 <= /^[a-z0-9]+(?:-[a-z0-9]+)*$/ <= 50');

export const Product = type({
  name: '3 <= string <= 127',
  slug: Slug,
  'description?': 'string <= 2000',
  categoryIds: ObjectId.array().atLeastLength(1),
  price: '0 < number < 1000000000',
  stock: '0 < number < 1000000000',
  'images?': ImageMetadata.array(),
  'options?': ProductOption.array(),
  'variants?': ProductVariant.array(),
  createdAt: 'Date',
  updatedAt: 'Date',
});
export type Product = typeof Product.infer;

export const Category = type({
  name: '3 <= string <= 50',
  slug: Slug,
  'description?': 'string <= 2000',
  // parentCategory?: ObjectId; // Optional reference to a parent Category._id for hierarchies (e.g., "Men's" -> "Clothing")
  // Add other relevant fields if needed, like 'image', 'order', etc.
  // image?: string; // URL for a category image
  // order?: number; // For manual sorting of categories
  createdAt: 'Date',
  updatedAt: 'Date',
});
export type Category = typeof Category.infer;

export const CartItem = type({
  productId: ObjectId,
  quantity: 'number > 0',
});
export type CartItem = typeof CartItem.infer;

export const Cart = type({
  userId: ObjectId,
  items: CartItem.array(),
  // Optional: Add fields like 'expiresAt' for abandoned carts, 'couponCode', 'discountAmount' later
  createdAt: 'Date',
  updatedAt: 'Date',
});
export type Cart = typeof Cart.infer;

export const User = type({
  name: 'string',
  email: 'string.email',
  emailVerified: 'boolean',
  image: 'string.url',
  createdAt: 'Date',
  updatedAt: 'Date',
});
export type User = typeof User.infer;
