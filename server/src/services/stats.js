import User from '../models/User.js'; import Hospital from '../models/Hospital.js'; import Ambulance from '../models/Ambulance.js'; import EmergencyRequest from '../models/EmergencyRequest.js';
export async function getStats(){
 const [users,hospitals,ambulances,active,completed,pending]=await Promise.all([
  User.countDocuments(),Hospital.countDocuments(),Ambulance.countDocuments(),EmergencyRequest.countDocuments({status:{$nin:['COMPLETED','CANCELLED','REJECTED']}}),EmergencyRequest.countDocuments({status:'COMPLETED'}),Hospital.countDocuments({isVerified:false})
 ]); return {users,patients:await User.countDocuments({role:'patient'}),hospitals,ambulances,activeEmergencies:active,completedEmergencies:completed,pendingHospitalVerification:pending};
}
