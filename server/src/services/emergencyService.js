import mongoose from 'mongoose';
import Hospital from '../models/Hospital.js';
import Ambulance from '../models/Ambulance.js';
import PatientProfile from '../models/PatientProfile.js';
import EmergencyRequest from '../models/EmergencyRequest.js';
import { haversineKm, toPoint } from '../utils/geo.js';
import { scoreHospital } from './ranking.js';
import { dijkstra, reconstructPath } from '../algorithms/dijkstra.js';
import { AppError } from '../utils/errors.js';

export async function findRankedHospitals(lat, lng, radiusKm=25, requiredDepartment, emergencyType) {
  const hospitals = await Hospital.find({ location: { $near: { $geometry: toPoint(lat, lng), $maxDistance: radiusKm*1000 } }, isVerified: true }).lean();
  const ids = hospitals.map(h => h._id);
  const ambulances = await Ambulance.find({ hospitalId: { $in: ids }, status: 'AVAILABLE' }).lean();
  const counts = new Map(ids.map(id => [String(id), 0])); ambulances.forEach(a => counts.set(String(a.hospitalId), (counts.get(String(a.hospitalId)) || 0)+1));
  return hospitals.map(h => {
    const [hLng,hLat] = h.location.coordinates; const distanceKm = haversineKm({lat,lng},{lat:hLat,lng:hLng}); const ambulanceAvailable = (counts.get(String(h._id)) || 0) > 0;
    return { ...h, distanceKm: Number(distanceKm.toFixed(2)), score: scoreHospital({ distanceKm, hospital: h, ambulanceAvailable, requiredDepartment, emergencyType }), ambulanceAvailable };
  }).sort((a,b) => b.score-a.score || a.distanceKm-b.distanceKm);
}

function syntheticRoute(patient, hospital) {
  const source='patient', destination='hospital';
  const p = {lat:patient.coordinates[1],lng:patient.coordinates[0]}, h={lat:hospital.location.coordinates[1],lng:hospital.location.coordinates[0]};
  const graph={ [source]: [{to:destination, weight:haversineKm(p,h)}], [destination]: [] };
  const result=dijkstra(graph,source), path=reconstructPath(result.previous,source,destination);
  return { distanceKm: Number(result.distances[destination].toFixed(2)), estimatedMinutes: Math.max(1, Math.round(result.distances[destination]*2.2)), path, routingMode:'synthetic-demo-distance' };
}

export async function createSos({ patientId, lat, lng, emergencyType, description, priority, requiredDepartment }, io) {
  const active = await EmergencyRequest.findOne({ patientId, status: { $in: ['CREATED','SEARCHING_HOSPITAL','HOSPITAL_NOTIFIED','ACCEPTED','AMBULANCE_REQUESTED','AMBULANCE_ASSIGNED','AMBULANCE_EN_ROUTE','AMBULANCE_ARRIVED','PATIENT_PICKED_UP','PATIENT_DELIVERED'] } });
  if (active) throw new AppError('An active emergency already exists',409,'DUPLICATE_SOS');
  const profile = await PatientProfile.findOne({ userId: patientId });
  if (!profile) throw new AppError('Complete your medical profile before SOS',422,'PROFILE_REQUIRED');
  const emergency = await EmergencyRequest.create({ patientId, emergencyType, description, priority: priority || 'HIGH', patientLocation: toPoint(lat,lng), status:'SEARCHING_HOSPITAL' });
  io?.to(`user:${patientId}`).emit('emergency:created', emergency);
  const ranked = await findRankedHospitals(lat,lng,50,requiredDepartment,emergencyType);
  if (!ranked.length) { emergency.status='SEARCHING_HOSPITAL'; await emergency.save(); return { emergency, hospitals: [] }; }
  emergency.status='HOSPITAL_NOTIFIED'; await emergency.save();
  for (const h of ranked.slice(0,5)) io?.to(`hospital:${h._id}`).emit('emergency:hospital-notified',{ emergencyId:emergency._id, priority:emergency.priority, distanceKm:h.distanceKm });
  io?.to(`user:${patientId}`).emit('emergency:hospital-notified',{ emergencyId:emergency._id, hospitals:ranked.slice(0,5) });
  return { emergency, hospitals: ranked.slice(0,5) };
}

export async function acceptEmergency(emergencyId, hospitalId, io) {
  const emergency = await EmergencyRequest.findById(emergencyId);
  if (!emergency) throw new AppError('Emergency not found',404,'NOT_FOUND');
  if (emergency.status !== 'HOSPITAL_NOTIFIED') throw new AppError('Emergency is no longer available',409,'EMERGENCY_UNAVAILABLE');
  emergency.hospitalId=hospitalId; emergency.status='ACCEPTED'; emergency.acceptedAt=new Date();
  const hospital=await Hospital.findById(hospitalId);
  emergency.destinationLocation=hospital.location;
  const route=syntheticRoute(emergency.patientLocation,hospital); emergency.routing=route; await emergency.save();
  io?.to(`user:${emergency.patientId}`).emit('emergency:accepted',{ emergencyId:emergency._id, hospital, routing:route });
  return emergency.populate(['hospitalId','patientId']);
}

export async function assignAmbulance(emergencyId, hospitalId, ambulanceId, io) {
  const emergency=await EmergencyRequest.findById(emergencyId); if(!emergency) throw new AppError('Emergency not found',404,'NOT_FOUND');
  const ambulance=ambulanceId ? await Ambulance.findById(ambulanceId) : await Ambulance.findOne({hospitalId,status:'AVAILABLE'});
  if(!ambulance) throw new AppError('No available ambulance',409,'AMBULANCE_UNAVAILABLE');
  if(String(ambulance.hospitalId)!==String(hospitalId)) throw new AppError('Ambulance does not belong to this hospital',403,'FORBIDDEN');
  ambulance.status='ASSIGNED'; ambulance.currentLocation=emergency.patientLocation; await ambulance.save();
  emergency.ambulanceId=ambulance._id; emergency.status='AMBULANCE_ASSIGNED'; await emergency.save();
  io?.to(`user:${emergency.patientId}`).emit('ambulance:assigned',{ emergencyId:emergency._id, ambulance });
  io?.to(`ambulance:${ambulance._id}`).emit('ambulance:assigned',{ emergency, ambulance });
  return emergency.populate('ambulanceId');
}
