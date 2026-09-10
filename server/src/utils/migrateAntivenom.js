import mongoose from 'mongoose';
import { env } from '../config/env.js';
import Hospital from '../models/Hospital.js';

function syntheticValues(hospital) {
  const match = String(hospital.registrationNumber || '').match(/(\d+)$/);
  const index = match ? Number(match[1]) - 1 : 0;
  const available = index % 5 < 2;
  return { antivenomAvailable: available, antivenomUnits: available ? 4 + ((index * 7) % 17) : 0 };
}

await mongoose.connect(env.mongoUri);
console.log('Connected to MongoDB');

const total = await Hospital.countDocuments();
const cursor = Hospital.find({ $or: [{ antivenomAvailable: { $exists: false } }, { antivenomUnits: { $exists: false } }] }).lean().cursor();
let updated = 0;
for await (const hospital of cursor) {
  const synthetic = syntheticValues(hospital);
  const update = {};
  if (hospital.antivenomAvailable === undefined) {
    update.antivenomAvailable = hospital.antivenomUnits === undefined ? synthetic.antivenomAvailable : Number(hospital.antivenomUnits) > 0;
  }
  if (hospital.antivenomUnits === undefined) {
    update.antivenomUnits = hospital.antivenomAvailable === undefined ? synthetic.antivenomUnits : hospital.antivenomAvailable ? synthetic.antivenomUnits : 0;
  }
  if (Object.keys(update).length) {
    await Hospital.updateOne({ _id: hospital._id }, { $set: update });
    updated += 1;
  }
}

console.log(`Found ${total} hospitals`);
console.log(`Updated ${updated} hospitals with synthetic antivenom data`);
console.log('Migration complete');
await mongoose.disconnect();
