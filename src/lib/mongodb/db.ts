import { Db, DbOptions } from 'mongodb';

import mongoClient from './client';
import { Category, Product } from './schema';

const DB_NAME = 'next-shop';

export const getDefaultDb = (dbOptions?: DbOptions) => mongoClient.db(DB_NAME, dbOptions);

export const collections = {
  categories: (db: Db) => db.collection<Category>('categories'),
  products: (db: Db) => db.collection<Product>('products'),
};
