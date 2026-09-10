import mongoose from 'mongoose';
const contact = new mongoose.Schema({ name: String, relationship: String, phone: String, email: String }, { _id: true });
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true }, dateOfBirth: Date,
  bloodGroup: String, gender: String, allergies: [String], medicalConditions: [String], medications: [String],
  emergencyContacts: [contact], address: String, location: { type: { type: String, enum: ['Point'] }, coordinates: { type: [Number] } }, medicalNotes: String
}, { timestamps: true });
schema.index({ location: '2dsphere' });
export default mongoose.model('PatientProfile', schema);
