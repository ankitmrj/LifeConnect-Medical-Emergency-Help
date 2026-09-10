import mongoose from 'mongoose';
const schema = new mongoose.Schema({ patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, diagnosis: String, medications: [String], doctor: String, hospital: String, notes: String, date: { type: Date, default: Date.now } }, { timestamps: true });
export default mongoose.model('MedicalRecord', schema);
