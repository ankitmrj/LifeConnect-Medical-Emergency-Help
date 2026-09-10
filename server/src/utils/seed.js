import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import User from '../models/User.js';
import PatientProfile from '../models/PatientProfile.js';
import Hospital from '../models/Hospital.js';
import Ambulance from '../models/Ambulance.js';

const demo = [
  { name: 'Demo Patient', email: 'patient1@lifeconnect.demo', phone: '9000000001', role: 'patient' },
  { name: 'CityCare Admin', email: 'admin@lifeconnect.demo', phone: '9000000000', role: 'admin' },
  { name: 'Sunrise Hospital Staff', email: 'hospital1@lifeconnect.demo', phone: '9000000011', role: 'hospital' },
  { name: 'Sunrise Driver', email: 'ambulance1@lifeconnect.demo', phone: '9000000021', role: 'ambulance' }
];

const namedHospitals = [
  ['Sunrise Multispecialty Hospital', 26.7606, 83.3732],
  ['MMMUT Medical Centre', 26.7700, 83.3830],
  ['City Heart & Trauma', 26.7430, 83.3900],
  ['LifeCare Hospital', 26.7820, 83.3600],
  ['North East Medical Institute', 26.7350, 83.3600],
  ['Green Valley Hospital', 26.7150, 83.3850],
  ['Railway Health Hospital', 26.7650, 83.3860],
  ['Sadar Emergency Hospital', 26.7480, 83.3700],
  ['MediBridge Hospital', 26.7900, 83.3950],
  ['Apex Critical Care', 26.7250, 83.3450]
];

const cityAreas = [
  ['Gorakhpur', 26.7606, 83.3732],
  ['Kushinagar', 26.7397, 83.8882],
  ['Deoria', 26.5024, 83.7791],
  ['Basti', 26.7882, 82.7160],
  ['Sant Kabir Nagar', 26.7900, 83.0544],
  ['Maharajganj', 27.1270, 83.5615],
  ['Siddharthnagar', 27.2594, 83.0088],
  ['Gonda', 27.1330, 81.9619],
  ['Azamgarh', 26.0738, 83.1856]
];

const prefixes = ['Shakti', 'Sanjeevani', 'Arogya', 'Jeevan Jyoti', 'Sparsh', 'Medistar', 'CarePoint', 'HealthPlus', 'Navjeevan', 'Wellness', 'Trinity', 'Healing Hands', 'Hope', 'Prime', 'Metro', 'United', 'Apollo Care', 'Krishna', 'Radha', 'Jan Kalyan'];
const suffixes = ['Hospital', 'Medical Centre', 'Multispecialty Hospital', 'Healthcare', 'Trauma Centre', 'Critical Care', 'Nursing Home', 'Institute of Medical Sciences'];
const departments = ['Emergency', 'General Medicine', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Neurology', 'General Surgery', 'Gynecology'];
const services = ['Trauma', 'Diagnostics', 'Pharmacy', 'Pathology', 'Radiology', '24x7 Emergency', 'Ambulance'];
const bloodGroups = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'];

function pseudoRandom(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function pick(seed, array) {
  return array[Math.floor(pseudoRandom(seed) * array.length)];
}

function sampleUnique(seed, array, count) {
  const values = [];
  for (let i = 0; i < count; i++) {
    let value = pick(seed + i * 17.71, array);
    if (values.includes(value)) value = array[(array.indexOf(value) + i + 1) % array.length];
    if (!values.includes(value)) values.push(value);
  }
  return values;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

await mongoose.connect(env.mongoUri);

await Promise.all([
  User.deleteMany({ email: /@lifeconnect\.demo$/ }),
  Hospital.deleteMany({ registrationNumber: /^DEMO-/ }),
  Ambulance.deleteMany({ vehicleNumber: /^LC-DEMO/ })
]);

const hash = await bcrypt.hash('Demo@12345', 12);
const users = [];
for (const d of demo) {
  users.push(await User.create({ ...d, password: hash, isVerified: true }));
}

await PatientProfile.create({
  userId: users[0]._id,
  bloodGroup: 'O+',
  gender: 'Other',
  allergies: ['Penicillin'],
  medicalConditions: ['Asthma'],
  medications: ['Salbutamol'],
  address: 'Gorakhpur, Uttar Pradesh',
  emergencyContacts: [{ name: 'Emergency Contact', relationship: 'Family', phone: '9000000099', email: 'contact@example.com' }]
});

// 360 synthetic hospitals. The locations/resources are demo data for development,
// not verified real-world hospital information.
const hospitalDocs = [];

for (let i = 0; i < 360; i++) {
  let cityName;
  let baseLat;
  let baseLng;
  let name;

  if (i < namedHospitals.length) {
    [name, baseLat, baseLng] = namedHospitals[i];
    cityName = 'Gorakhpur';
  } else {
    const areaIndex = Math.floor(pseudoRandom(i * 2.17) * cityAreas.length);
    [cityName, baseLat, baseLng] = cityAreas[areaIndex];
    name = `${pick(i * 3.13, prefixes)} ${pick(i * 5.91, suffixes)}`;
    name += ` ${String(i + 1).padStart(3, '0')}`;
  }

  // Keep generated points in a plausible regional radius while making every
  // coordinate distinct enough for map/geospatial demos.
  const latOffset = (pseudoRandom(i * 7.31) - 0.5) * 0.22;
  const lngOffset = (pseudoRandom(i * 9.17) - 0.5) * 0.26;
  const lat = clamp(baseLat + latOffset, 25.75, 27.75);
  const lng = clamp(baseLng + lngOffset, 81.20, 84.20);

  const totalBeds = 30 + Math.floor(pseudoRandom(i * 11.27) * 271);
  const availableBeds = Math.floor(pseudoRandom(i * 13.41) * (totalBeds + 1));
  const icuAvailable = pseudoRandom(i * 15.03) > 0.18;
  const oxygenAvailable = pseudoRandom(i * 16.73) > 0.12;
  const emergencyAvailable = pseudoRandom(i * 18.19) > 0.08;
  const antivenomAvailable = i % 5 < 2;
  const antivenomUnits = antivenomAvailable ? 4 + ((i * 7) % 17) : 0;
  const selectedDepartments = sampleUnique(i * 19.31, departments, 3 + Math.floor(pseudoRandom(i * 20.77) * 3));
  const selectedServices = sampleUnique(i * 22.11, services, 3 + Math.floor(pseudoRandom(i * 24.17) * 3));
  const bloodBank = {};
  for (const group of sampleUnique(i * 25.33, bloodGroups, 3 + Math.floor(pseudoRandom(i * 26.71) * 3))) {
    bloodBank[group] = 3 + Math.floor(pseudoRandom(i * (group.length + 27.19)) * 40);
  }

  hospitalDocs.push({
    ownerId: i === 0 ? users[2]._id : undefined,
    name,
    registrationNumber: `DEMO-${String(i + 1).padStart(4, '0')}`,
    description: `${emergencyAvailable ? '24x7 emergency-capable' : 'General care'} demo healthcare facility in ${cityName}.`,
    phone: `91${String(7000000000 + i).padStart(10, '0')}`,
    email: `hospital${i + 1}@lifeconnect.demo`,
    address: `${cityName}, Uttar Pradesh, India`,
    location: { type: 'Point', coordinates: [Number(lng.toFixed(6)), Number(lat.toFixed(6))] },
    departments: selectedDepartments,
    services: selectedServices,
    emergencyAvailable,
    icuAvailable,
    totalBeds,
    availableBeds,
    oxygenAvailable,
    antivenomAvailable,
    antivenomUnits,
    bloodBank,
    rating: Number((3.2 + pseudoRandom(i * 31.41) * 1.7).toFixed(1)),
    isVerified: true,
    operatingHours: emergencyAvailable ? '24x7' : '08:00 - 22:00'
  });
}

const hospitals = await Hospital.insertMany(hospitalDocs);

// Add demo ambulances to the first 30 hospitals so the SOS/ranking workflow
// has meaningful ambulance availability across multiple locations.
const ambulanceDocs = [];
for (let i = 0; i < 30; i++) {
  const hospital = hospitals[i];
  const statuses = ['AVAILABLE', 'ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'OFFLINE'];
  ambulanceDocs.push({
    hospitalId: hospital._id,
    userId: i === 0 ? users[3]._id : undefined,
    vehicleNumber: `LC-DEMO-${String(i + 1).padStart(3, '0')}`,
    driverName: `Demo Driver ${i + 1}`,
    driverPhone: `91${String(7100000000 + i).padStart(10, '0')}`,
    type: i % 2 ? 'Advanced Life Support' : 'Basic Life Support',
    status: statuses[i % statuses.length],
    currentLocation: hospital.location,
    capacity: 1,
    equipment: ['Oxygen', 'AED', 'First Aid']
  });
}
await Ambulance.insertMany(ambulanceDocs);

console.log(`Seed complete: ${hospitals.length} hospitals + ${ambulanceDocs.length} ambulances.`);
console.log('Demo password: Demo@12345');
await mongoose.disconnect();
