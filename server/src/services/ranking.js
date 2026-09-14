export const rankingWeights = { distance: 0.35, availability: 0.15, emergency: 0.2, resources: 0.2, ambulance: 0.1 };
export function calculateRankingValue({ distanceKm, hospital, ambulanceAvailable, requiredDepartment, emergencyType, requestedResources = [], bloodGroup }) {
  const distanceScore = Math.max(0, 1 - distanceKm / 30);
  const availability = hospital.availableBeds > 0 ? 1 : 0;
  const emergency = hospital.emergencyAvailable ? 1 : 0;
  const dept = requiredDepartment && hospital.departments?.some(d => d.toLowerCase() === requiredDepartment.toLowerCase()) ? 1 : 0.5;
  const baseResources = Math.min(1, (hospital.icuAvailable ? 0.35 : 0) + (hospital.oxygenAvailable ? 0.35 : 0) + Math.min(0.3, hospital.availableBeds / Math.max(1, hospital.totalBeds) * 0.3));
  const venomEmergency = requestedResources.includes('ANTIVENOM') || /snake|bite|venom|poison/i.test(emergencyType || '');
  const bloodAvailable = bloodGroup ? Number(hospital.bloodBank?.[bloodGroup] || 0) > 0 : false;
  const requestedAvailability = requestedResources.length
    ? requestedResources.filter(resource => ({
        ANTIVENOM: hospital.antivenomAvailable && hospital.antivenomUnits > 0,
        BLOOD: bloodAvailable,
        AMBULANCE: ambulanceAvailable,
        ICU_BED: hospital.icuAvailable && hospital.availableBeds > 0
      })[resource]).length / requestedResources.length
    : baseResources;
  const resources = venomEmergency ? 0.5 * baseResources + 0.5 * (hospital.antivenomAvailable && hospital.antivenomUnits > 0 ? 1 : 0) : requestedResources.length ? requestedAvailability : baseResources;
  const ambulance = ambulanceAvailable ? 1 : 0;
  const rankingValue = rankingWeights.distance*distanceScore + rankingWeights.availability*availability + rankingWeights.emergency*emergency + rankingWeights.resources*(0.5*resources+0.5*dept) + rankingWeights.ambulance*ambulance;
  return Number(rankingValue.toFixed(4));
}
