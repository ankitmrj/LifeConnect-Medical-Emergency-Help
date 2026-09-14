import Hospital from '../models/Hospital.js'; import Ambulance from '../models/Ambulance.js'; import EmergencyRequest from '../models/EmergencyRequest.js'; import User from '../models/User.js'; import { findRankedHospitals } from '../services/emergencyService.js'; import { ok } from '../utils/api.js'; import { AppError } from '../utils/errors.js'; import { toPoint } from '../utils/geo.js';
export async function list(req,res){const hospitals=await Hospital.find({isVerified:true}).sort({rating:-1});ok(res,{hospitals});}
export async function nearby(req,res){const {lat,lng,radius=25,bloodGroup}=req.query;const requestedResources=String(req.query.resources||'').split(',').filter(Boolean);const allowedResources=['ANTIVENOM','BLOOD','AMBULANCE','ICU_BED'];const allowedBloodGroups=['A+','A-','B+','B-','AB+','AB-','O+','O-'];if(!Number.isFinite(Number(lat))||!Number.isFinite(Number(lng)))throw new AppError('Valid coordinates required',422,'VALIDATION_ERROR');if(requestedResources.some(resource=>!allowedResources.includes(resource)))throw new AppError('Invalid emergency resource',422,'VALIDATION_ERROR');if(requestedResources.includes('BLOOD')&&!allowedBloodGroups.includes(bloodGroup))throw new AppError('A valid blood group is required for blood searches',422,'BLOOD_GROUP_REQUIRED');const hospitals=await findRankedHospitals(Number(lat),Number(lng),Number(radius),req.query.department,undefined,requestedResources,bloodGroup);ok(res,{hospitals});}
export async function details(req,res){const h=await Hospital.findById(req.params.id);if(!h)throw new AppError('Hospital not found',404,'NOT_FOUND');ok(res,{hospital:h});}
export async function create(req,res){
	const existing=await Hospital.findOne({ownerId:req.user._id});
	if(existing)throw new AppError('Hospital profile already exists',409,'PROFILE_EXISTS');
	const {ownerId:_ignoredOwnerId,lat,lng,antivenomAvailable,antivenomUnits,...profile}=req.body;
	if(!Number.isFinite(Number(lat))||!Number.isFinite(Number(lng)))throw new AppError('Valid coordinates required',422,'VALIDATION_ERROR');
	const antivenom=normalizeAntivenom(antivenomAvailable,antivenomUnits);
	const h=await Hospital.create({...profile,...antivenom,ownerId:req.user._id,location:toPoint(lat,lng)});
	ok(res,{hospital:h},'Hospital created',201);
}
function normalizeAntivenom(available,units){
	const hasUnits=units!==undefined;
	const parsedUnits=hasUnits?Number(units):0;
	if(hasUnits&&(!Number.isFinite(parsedUnits)||parsedUnits<0))throw new AppError('Antivenom units must be a non-negative number',422,'VALIDATION_ERROR');
	const safeUnits=Math.floor(parsedUnits);
	const safeAvailable=available===true;
	return {antivenomUnits:safeAvailable?safeUnits:0,antivenomAvailable:safeAvailable&&safeUnits>0};
}
export async function resources(req,res){
	const h=await Hospital.findOne({ownerId:req.user._id});
	if(!h)throw new AppError('Hospital profile not found',404,'NOT_FOUND');
	if(String(req.params.id)!==String(h._id))throw new AppError('You can only update your own hospital resources',403,'FORBIDDEN');
	const {availableBeds,icuAvailable,oxygenAvailable,bloodBank,emergencyAvailable}=req.body;
	if(availableBeds!==undefined){const beds=Number(availableBeds);if(!Number.isInteger(beds)||beds<0||beds>h.totalBeds)throw new AppError(`Available beds must be an integer between 0 and ${h.totalBeds}`,422,'VALIDATION_ERROR');h.availableBeds=beds;}
	for(const [key,value] of [['icuAvailable',icuAvailable],['oxygenAvailable',oxygenAvailable],['emergencyAvailable',emergencyAvailable]]){if(value!==undefined){if(typeof value!=='boolean')throw new AppError(`${key} must be a boolean`,422,'VALIDATION_ERROR');h[key]=value;}}
	if(bloodBank!==undefined){if(!bloodBank||typeof bloodBank!=='object'||Array.isArray(bloodBank))throw new AppError('Blood bank must be an object',422,'VALIDATION_ERROR');for(const [group,value] of Object.entries(bloodBank)){const units=Number(value);if(!Number.isFinite(units)||units<0)throw new AppError(`Blood bank quantity for ${group} must be non-negative`,422,'VALIDATION_ERROR');}h.bloodBank=bloodBank;}
	for(const key of ['departments','services'])if(req.body[key]!==undefined)h[key]=req.body[key];
	if(req.body.antivenomAvailable!==undefined&&typeof req.body.antivenomAvailable!=='boolean')throw new AppError('antivenomAvailable must be a boolean',422,'VALIDATION_ERROR');
	if(req.body.antivenomAvailable!==undefined||req.body.antivenomUnits!==undefined){const antivenom=normalizeAntivenom(req.body.antivenomAvailable??h.antivenomAvailable,req.body.antivenomUnits??h.antivenomUnits);h.antivenomAvailable=antivenom.antivenomAvailable;h.antivenomUnits=antivenom.antivenomUnits;}
	await h.save();ok(res,{hospital:h});
}
export async function dashboard(req,res){const h=await Hospital.findOne({ownerId:req.user._id});if(!h)throw new AppError('Hospital profile not found',404,'NOT_FOUND');const [active,pending,completed,ambulances]=await Promise.all([EmergencyRequest.countDocuments({hospitalId:h._id,status:{$nin:['COMPLETED','CANCELLED','REJECTED']}}),EmergencyRequest.countDocuments({hospitalId:h._id,status:'HOSPITAL_NOTIFIED'}),EmergencyRequest.countDocuments({hospitalId:h._id,status:'COMPLETED'}),Ambulance.find({hospitalId:h._id})]);const requests=await EmergencyRequest.find({$or:[{hospitalId:h._id},{status:'HOSPITAL_NOTIFIED'}]}).sort({priority:1,createdAt:-1}).limit(30).populate('patientId','name phone');ok(res,{hospital:h,metrics:{active,pending,completed,availableBeds:h.availableBeds,icuBeds:h.icuAvailable?1:0,availableAmbulances:ambulances.filter(a=>a.status==='AVAILABLE').length},requests,ambulances});}
export async function publicSeedOwnerLink(){return User;}
