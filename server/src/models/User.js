import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  phone: { type: String, required: true }, password: { type: String, required: true, select: false },
  role: { type: String, enum: ['patient','hospital','ambulance','admin'], required: true },
  profileImage: String, isVerified: { type: Boolean, default: false }, isActive: { type: Boolean, default: true }
}, { timestamps: true });
export default mongoose.model('User', schema);
