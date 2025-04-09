import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { nextCookies } from 'better-auth/next-js';

import mongoClient from '~/lib/mongodb/client';

if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error('Missing environment variable: "GOOGLE_CLIENT_ID"');
}
if (!process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Missing environment variable: "GOOGLE_CLIENT_SECRET"');
}

const db = mongoClient.db();

export const auth = betterAuth({
  database: mongodbAdapter(db),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
  // nextCookies should be last plugin in the array
  plugins: [nextCookies()],
});
