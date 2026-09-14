import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' }, ambulanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ambulance' },
  emergencyType: { type: String, default: 'General' }, requestedResources: { type: [String], enum: ['ANTIVENOM', 'BLOOD', 'AMBULANCE', 'ICU_BED'], default: [] }, description: String, patientLocation: { type: { type: String, enum: ['Point'] }, coordinates: [Number] }, destinationLocation: { type: { type: String, enum: ['Point'] }, coordinates: [Number] },
  status: { type: String, enum: ['CREATED','SEARCHING_HOSPITAL','HOSPITAL_NOTIFIED','ACCEPTED','AMBULANCE_REQUESTED','AMBULANCE_ASSIGNED','AMBULANCE_EN_ROUTE','AMBULANCE_ARRIVED','PATIENT_PICKED_UP','PATIENT_DELIVERED','COMPLETED','CANCELLED','REJECTED'], default: 'CREATED' },
  priority: { type: String, enum: ['CRITICAL','HIGH','MEDIUM','LOW'], default: 'HIGH' }, acceptedAt: Date, completedAt: Date,
  routing: { distanceKm: Number, estimatedMinutes: Number, path: [[Number]], routingMode: String }
}, { timestamps: true });
schema.index({ patientLocation: '2dsphere' });
export default mongoose.model('EmergencyRequest', schema);
