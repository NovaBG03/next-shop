import { type } from 'arktype';
import { ObjectId as MongoObjectId } from 'mongodb';

const ObjectId = type.instanceOf(MongoObjectId);
type ObjectId = typeof ObjectId.infer;

export const ImageMetadata = type({
  url: 'string',
  'alt?': 'string',
});
export type ImageMetadata = typeof ImageMetadata.infer;

export const VariantAttribute = type({
  name: 'string', // e.g., 'Color', 'Size'
  value: 'string', // e.g., 'Red', 'Large'
});
export type VariantAttribute = typeof VariantAttribute.infer;

export const ProductVariant = type({
  attributes: type(VariantAttribute).array(),
  'sku?': 'string', // Unique SKU for this *specific* combination
  price: 'number', // The absolute price for this combination (overrides base product price)
  stock: 'number', // Stock available for this *specific* combination
  'images?': ImageMetadata.array(),
});
export type ProductVariant = typeof ProductVariant.infer;

export const Product = type({
  name: 'string',
  slug: 'string',
  description: 'string',
  price: 'number', // Base or display price (e.g., "Starting at..."). Authoritative price is in ProductVariant if variants exist.
  categoryIds: ObjectId.array(), // References to Category._id documents
  images: ImageMetadata.array(), // Master list of all images for the product. Variants can reference specific images from this list.
  'variants?': ProductVariant.array(), // Array of specific, purchasable variant combinations. If empty/null, the product is sold as a single item using the top-level price/stock.
  createdAt: 'Date', // Timestamp when the product was created
  updatedAt: 'Date', // Timestamp when the product was last updated
});
export type Product = typeof Product.infer;

export const Category = type({
  name: '3 <= string <= 50',
  slug: '3 <= /^[a-z0-9]+(?:-[a-z0-9]+)*$/ <= 50',
  'description?': 'string',
  // parentCategory?: ObjectId; // Optional reference to a parent Category._id for hierarchies (e.g., "Men's" -> "Clothing")
  // Add other relevant fields if needed, like 'image', 'order', etc.
  // image?: string; // URL for a category image
  // order?: number; // For manual sorting of categories
  createdAt: 'Date',
  updatedAt: 'Date',
});
export type Category = typeof Category.infer;

export const CardItem = type({
  productId: ObjectId,
  'variantId?': ObjectId,
  quantity: 'number',
});
export type CardItem = typeof CardItem.infer;

export const Cart = type({
  userId: ObjectId,
  items: CardItem.array(),
  // Optional: Add fields like 'expiresAt' for abandoned carts, 'couponCode', 'discountAmount' later
  createdAt: 'Date',
  updatedAt: 'Date',
});

export const User = type({
  name: 'string',
  email: 'string.email',
  emailVerified: 'boolean',
  image: 'string.url',
  createdAt: 'Date',
  updatedAt: 'Date',
});
export type User = typeof User.infer;
