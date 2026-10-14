import User from '../models/User.js';
import Hospital from '../models/Hospital.js';
import Ambulance from '../models/Ambulance.js';
import EmergencyRequest from '../models/EmergencyRequest.js';

// Get Admin Dashboard Statistics
export async function getStats() {
  // Fetch statistics in parallel
  const [
    users,
    hospitals,
    ambulances,
    active,
    completed,
    pending,
  ] = await Promise.all([
    User.countDocuments(),

    Hospital.countDocuments(),

    Ambulance.countDocuments(),

    // Active Emergencies
    EmergencyRequest.countDocuments({
      status: {
        $nin: ['COMPLETED', 'CANCELLED', 'REJECTED'],
      },
    }),

    // Completed Emergencies
    EmergencyRequest.countDocuments({
      status: 'COMPLETED',
    }),

    // Pending Hospital Verification
    Hospital.countDocuments({
      isVerified: false,
    }),
  ]);

  // Return Dashboard Statistics
  return {
    users,
    patients: await User.countDocuments({
      role: 'patient',
    }),
    hospitals,
    ambulances,
    activeEmergencies: active,
    completedEmergencies: completed,
    pendingHospitalVerification: pending,
  };
}
