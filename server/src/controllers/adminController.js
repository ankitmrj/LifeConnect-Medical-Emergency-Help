import User from '../models/User.js'; import Hospital from '../models/Hospital.js'; import EmergencyRequest from '../models/EmergencyRequest.js'; import Ambulance from '../models/Ambulance.js'; import { getStats } from '../services/stats.js'; import { ok } from '../utils/api.js'; import { AppError } from '../utils/errors.js';
export async function stats(req,res){ok(res,await getStats());}
export async function users(req,res){ok(res,{users:await User.find().select('-password').sort({createdAt:-1}).limit(200)});}
export async function hospitals(req,res){ok(res,{hospitals:await Hospital.find().sort({createdAt:-1})});}
export async function verifyHospital(req,res){const h=await Hospital.findByIdAndUpdate(req.params.id,{isVerified:true},{new:true});if(!h)throw new AppError('Hospital not found',404,'NOT_FOUND');ok(res,{hospital:h},'Hospital verified');}
export async function disableUser(req,res){const u=await User.findByIdAndUpdate(req.params.id,{isActive:false},{new:true});if(!u)throw new AppError('User not found',404,'NOT_FOUND');ok(res,{user:u},'User disabled');}
export async function emergencies(req,res){ok(res,{emergencies:await EmergencyRequest.find().sort({createdAt:-1}).limit(300).populate('patientId','name').populate('hospitalId','name').populate('ambulanceId','vehicleNumber')});}
export async function ambulances(req,res){ok(res,{ambulances:await Ambulance.find().populate('hospitalId','name')});}
