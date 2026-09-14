import mongoose from 'mongoose';
import { env } from '../config/env.js';
import Hospital from '../models/Hospital.js';

const fields = ['score', 'rankingScore', 'hospitalScore'];

try {
  await mongoose.connect(env.mongoUri);
  console.log('Connected to MongoDB');

  const result = await Hospital.collection.updateMany(
    {},
    { $unset: Object.fromEntries(fields.map((field) => [field, ''])) }
  );

  console.log(`Matched ${result.matchedCount} hospital documents`);
  console.log(`Updated ${result.modifiedCount} hospital documents`);
  console.log(`Removed legacy fields: ${fields.join(', ')}`);
} finally {
  await mongoose.disconnect();
}
