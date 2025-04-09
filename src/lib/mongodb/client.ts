import { MongoClient, MongoClientOptions } from 'mongodb';

if (!process.env.MONGODB_URL) {
  throw new Error('Missing environment variable: "MONGODB_URL"');
}

const url = process.env.MONGODB_URL;
const options: MongoClientOptions = {
  appName: `next-shop.${process.env.NODE_ENV.toLowerCase()}`,
};

let mongoClient: MongoClient;

if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line prefer-const
  let globalWithMongo = global as typeof globalThis & {
    _mongoClient?: MongoClient;
  };

  if (!globalWithMongo._mongoClient) {
    globalWithMongo._mongoClient = new MongoClient(url, options);
  }
  mongoClient = globalWithMongo._mongoClient;
} else {
  mongoClient = new MongoClient(url, options);
}

export default mongoClient;
