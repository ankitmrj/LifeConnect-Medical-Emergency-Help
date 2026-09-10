import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, name: { type: String, required: true }, registrationNumber: { type: String, unique: true },
  description: String, phone: String, email: String, address: String,
  location: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], required: true } },
  departments: [String], services: [String], emergencyAvailable: { type: Boolean, default: true }, icuAvailable: { type: Boolean, default: false },
  totalBeds: { type: Number, default: 0 }, availableBeds: { type: Number, default: 0 }, oxygenAvailable: { type: Boolean, default: false }, antivenomAvailable: { type: Boolean, default: false }, antivenomUnits: { type: Number, default: 0, min: 0 },
  bloodBank: { type: Map, of: Number, default: {} }, rating: { type: Number, default: 0 }, isVerified: { type: Boolean, default: false },
  operatingHours: { type: String, default: '24x7' }
}, { timestamps: true });
schema.index({ location: '2dsphere' });
export default mongoose.model('Hospital', schema);
