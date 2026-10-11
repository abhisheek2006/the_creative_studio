const mongoose = require('mongoose');
const env = require('./env');

// Cache the connection across serverless (Vercel) warm invocations.
let cached = global.__tcsMongoose;
if (!cached) {
  cached = global.__tcsMongoose = { conn: null, promise: null };
}

async function connectDatabase() {
  if (cached.conn) return cached.conn;

  if (!env.mongodbUri) {
    throw new Error(
      'MONGODB_URI is not set. Add it to your .env (local) or Vercel Environment Variables.'
    );
  }

  if (!cached.promise) {
    mongoose.set('strictQuery', true);
    cached.promise = mongoose
      .connect(env.mongodbUri, {
        // Keep the pool small for serverless environments.
        maxPoolSize: env.isVercel ? 5 : 10,
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        autoIndex: !env.isProd,
      })
      .then((m) => {
        console.log('[db] MongoDB connected');
        return m;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

module.exports = { connectDatabase, mongoose };
