const mongoose = require('mongoose');
const dns = require('dns');

// Fixes a very common Windows issue where mongodb+srv:// connections fail with
// "querySrv ECONNREFUSED" — some Windows networks/DNS resolvers don't handle
// SRV record lookups correctly when Node prefers IPv6 first. Forcing IPv4-first
// resolution avoids that entirely.
dns.setDefaultResultOrder('ipv4first');

let memoryMongoServer = null;

async function connectDB() {
  const defaultLocalUri = 'mongodb://127.0.0.1:27017/epass_db';
  const configuredUri = process.env.MONGODB_URI || defaultLocalUri;
  const candidateUris = Array.from(new Set([configuredUri, defaultLocalUri]));
  const options = {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    family: 4,
  };

  let lastErr = null;

  for (const uri of candidateUris) {
    try {
      console.log(`Connecting to MongoDB using ${uri}...`);
      await mongoose.connect(uri, options);
      console.log('MongoDB connected:', mongoose.connection.name, 'via', uri);
      return;
    } catch (err) {
      lastErr = err;
      console.warn(`MongoDB connection failed for ${uri}:`, err.message);
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');

      if (!memoryMongoServer) {
        console.log('Primary MongoDB connection failed. Falling back to local in-memory MongoDB...');
        memoryMongoServer = await MongoMemoryServer.create({ instance: { dbName: 'epass_db' } });
      }

      await mongoose.connect(memoryMongoServer.getUri(), { dbName: 'epass_db', ...options });
      console.log('MongoDB connected via in-memory server:', mongoose.connection.name);
      return;
    } catch (memoryErr) {
      console.error('MongoDB connection failed:', lastErr.message);
      console.error('In-memory MongoDB fallback failed:', memoryErr.message);
      process.exit(1);
    }
  }

  console.error('MongoDB connection failed:', lastErr.message);
  process.exit(1);
}

module.exports = connectDB;
