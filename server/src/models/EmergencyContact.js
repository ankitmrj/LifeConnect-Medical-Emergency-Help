import mongoose from 'mongoose';
const schema = new mongoose.Schema({ patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, name: String, relationship: String, phone: String, email: String }, { timestamps: true });
export default mongoose.model('EmergencyContact', schema);
