import { type } from 'arktype';
import { Db, ObjectId } from 'mongodb';

// ==================================
// Product Schema
// ==================================

/**
 * Represents a single attribute of a variant combination, like "Color: Red".
 */
export type VariantAttribute = {
  name: string; // e.g., 'Color', 'Size'
  value: string; // e.g., 'Red', 'Large'
};

/**
 * Represents a specific, purchasable combination of product attributes.
 * Each variant combination has its own SKU, price, stock, and potentially specific images.
 */
export type ProductVariant = {
  _id: ObjectId; // Optional: A unique ID for the specific variant combination itself
  attributes: VariantAttribute[]; // The combination, e.g., [{ name: 'Color', value: 'Red' }, { name: 'Size', value: 'Large' }]
  sku?: string; // Optional: Unique SKU for this *specific* combination
  price: number; // The absolute price for this combination (overrides base product price)
  stock: number; // Stock available for this *specific* combination

  /**
   * References to specific images in the main product.images array that apply to this variant.
   *
   * Display Logic Recommendation:
   * - If a variant is selected and this array has IDs, show only the referenced images.
   * - Otherwise (no variant selected, or this array is empty/null), show all images from product.images.
   */
  imageIds?: ObjectId[];
};

/**
 * Represents an image associated with a product.
 */
export type ProductImage = {
  _id: ObjectId; // ID to allow referencing from ProductVariant.imageIds
  url: string; // URL of the image (e.g., path in object storage)
  altText?: string; // Alt text for accessibility and SEO
};

/**
 * Represents a product in the catalog.
 */
export type Product = {
  _id: ObjectId;
  name: string; // Name of the product
  slug: string; // SEO-friendly identifier (unique, URL-safe)
  description: string; // Detailed product description (can include HTML or Markdown)
  price: number; // Base or display price (e.g., "Starting at..."). Authoritative price is in ProductVariant if variants exist.
  categories: ObjectId[]; // References to Category._id documents
  images: ProductImage[]; // Master list of all images for the product. Variants can reference specific images from this list.
  variants?: ProductVariant[]; // Array of specific, purchasable variant combinations. If empty/null, the product is sold as a single item using the top-level price/stock.
  createdAt: Date; // Timestamp when the product was created
  updatedAt: Date; // Timestamp when the product was last updated
};

// ==================================
// Category Schema
// ==================================

export type CategoryOld = {
  _id: ObjectId;
  name: string; // Name of the category (e.g., "T-Shirts", "Electronics")
  slug: string; // Unique, URL-safe identifier (e.g., "t-shirts", "electronics")
  description?: string; // Optional category description
  parentCategory?: ObjectId; // Optional reference to a parent Category._id for hierarchies (e.g., "Men's" -> "Clothing")
  // Add other relevant fields if needed, like 'image', 'order', etc.
  // image?: string; // URL for a category image
  // order?: number; // For manual sorting of categories
  createdAt: Date;
  updatedAt: Date;
};

export const collectionCategory = (db: Db) => {
  return db.collection<Category>('categories');
};

export const Category = type({
  name: '3 <= string <= 50',
  slug: '3 <= /^[a-z0-9]+(?:-[a-z0-9]+)*$/ <= 50',
  'description?': 'string',
  createdAt: 'Date',
  updatedAt: 'Date',
});

export type Category = typeof Category.infer;

// ==================================
// Cart Schema
// ==================================

/**
 * Represents an item within a shopping cart.
 */
export type CartItem = {
  productId: ObjectId; // Reference to the Product._id
  variantId?: ObjectId; // Reference to the ProductVariant._id if a specific variant is added
  quantity: number; // Number of units for this item
  // Price snapshot is usually handled during checkout or cart display logic by fetching current product/variant price
};

/**
 * Represents a user's shopping cart.
 * Typically, one cart per user.
 */
export type Cart = {
  _id: ObjectId;
  userId: ObjectId; // Reference to the User._id who owns the cart (Should be unique index)
  items: CartItem[]; // Array of items currently in the cart
  createdAt: Date;
  updatedAt: Date; // Timestamp of the last modification (add, remove, update item)
  // Optional: Add fields like 'expiresAt' for abandoned carts, 'couponCode', 'discountAmount' later
};

// ==================================
// User Schema
// ==================================

/**
 * Represents a user. Details will depend heavily on the chosen auth provider (better-auth).
 * This is a basic structure.
 */
export type User = {
  _id: ObjectId; // Internal database ID
  authProviderId: string; // ID from the authentication provider (e.g., better-auth user ID) - Must be unique
  email: string; // User's email (likely unique, managed by auth provider)
  name?: string; // User's display name
  // Consider adding fields like roles, address book reference, etc. later
  // roles?: ('admin' | 'customer')[];
  createdAt: Date;
  updatedAt: Date;
};
