import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true }, userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vehicleNumber: { type: String, required: true, unique: true }, driverName: String, driverPhone: String, type: { type: String, default: 'Basic Life Support' },
  status: { type: String, enum: ['AVAILABLE','ASSIGNED','EN_ROUTE','ARRIVED','TRANSPORTING','COMPLETED','OFFLINE'], default: 'AVAILABLE' },
  currentLocation: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], default: [0,0] } },
  capacity: { type: Number, default: 1 }, equipment: [String]
}, { timestamps: true });
schema.index({ currentLocation: '2dsphere' });
export default mongoose.model('Ambulance', schema);
