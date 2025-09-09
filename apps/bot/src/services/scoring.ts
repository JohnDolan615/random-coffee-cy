import type { MatchingCandidate, MatchScore } from "@random-coffee/shared";
import { 
  MATCHING_WEIGHTS, 
  VIBE_WEIGHT_ADJUSTMENTS,
  PROFESSION_RELATIONS,
  INDUSTRY_PROXIMITY,
  GOAL_COMPATIBILITY,
  SENIORITY_LEVELS
} from "@random-coffee/shared";

export function calculateMatchScore(
  candidate1: MatchingCandidate,
  candidate2: MatchingCandidate
): MatchScore {
  const profile1 = candidate1.profile;
  const profile2 = candidate2.profile;

  // Get vibe adjustments
  const vibe1Adjustments = VIBE_WEIGHT_ADJUSTMENTS[profile1.vibe as keyof typeof VIBE_WEIGHT_ADJUSTMENTS];
  const vibe2Adjustments = VIBE_WEIGHT_ADJUSTMENTS[profile2.vibe as keyof typeof VIBE_WEIGHT_ADJUSTMENTS];
  
  // Average the vibe adjustments
  const avgAdjustments = Object.keys(MATCHING_WEIGHTS).reduce((acc, key) => {
    const weightKey = key as keyof typeof MATCHING_WEIGHTS;
    acc[weightKey] = (vibe1Adjustments[weightKey] + vibe2Adjustments[weightKey]) / 2;
    return acc;
  }, {} as typeof MATCHING_WEIGHTS);

  const components = {
    topics: calculateTopicsSimilarity(profile1, profile2) * avgAdjustments.topics,
    industry: calculateIndustrySimilarity(profile1, profile2) * avgAdjustments.industry,
    profession: calculateProfessionSimilarity(profile1, profile2) * avgAdjustments.profession,
    goal: calculateGoalCompatibility(profile1, profile2) * avgAdjustments.goal,
    seniority: calculateSeniorityFit(profile1, profile2) * avgAdjustments.seniority,
    availability: calculateAvailabilityOverlap(profile1, profile2) * avgAdjustments.availability,
    distance: calculateDistancePenalty(profile1, profile2) * avgAdjustments.distance,
    diversity: calculateDiversityBoost(profile1, profile2) * avgAdjustments.diversity,
  };

  const score = Object.entries(components).reduce((total, [component, value]) => {
    const weight = MATCHING_WEIGHTS[component as keyof typeof MATCHING_WEIGHTS];
    return total + (value * weight);
  }, 0);

  return {
    user1Id: candidate1.userId,
    user2Id: candidate2.userId,
    score: Math.max(0, Math.min(1, score)), // Clamp between 0-1
    components
  };
}

export function calculateTopicsSimilarity(profile1: any, profile2: any): number {
  const topics1 = new Set(profile1.topics.map((t: any) => t.topic.name.toLowerCase()));
  const topics2 = new Set(profile2.topics.map((t: any) => t.topic.name.toLowerCase()));
  
  return jaccardSimilarity(topics1, topics2);
}

export function calculateIndustrySimilarity(profile1: any, profile2: any): number {
  const industries1 = profile1.industries.map((i: any) => i.industry.name);
  const industries2 = profile2.industries.map((i: any) => i.industry.name);
  
  let maxSimilarity = 0;
  
  for (const ind1 of industries1) {
    for (const ind2 of industries2) {
      if (ind1 === ind2) {
        return 1.0; // Exact match
      }
      
      // Check proximity
      const proximity1 = INDUSTRY_PROXIMITY[ind1 as keyof typeof INDUSTRY_PROXIMITY] || [];
      const proximity2 = INDUSTRY_PROXIMITY[ind2 as keyof typeof INDUSTRY_PROXIMITY] || [];
      
      if (proximity1.includes(ind2) || proximity2.includes(ind1)) {
        maxSimilarity = Math.max(maxSimilarity, 0.7);
      }
    }
  }
  
  return maxSimilarity;
}

export function calculateProfessionSimilarity(profile1: any, profile2: any): number {
  const prof1 = profile1.profession;
  const prof2 = profile2.profession;
  
  if (!prof1 || !prof2) return 0.5; // Neutral if missing
  if (prof1 === prof2) return 1.0;
  
  const relations1 = PROFESSION_RELATIONS[prof1 as keyof typeof PROFESSION_RELATIONS] || [];
  const relations2 = PROFESSION_RELATIONS[prof2 as keyof typeof PROFESSION_RELATIONS] || [];
  
  if (relations1.includes(prof2) || relations2.includes(prof1)) {
    return 0.8;
  }
  
  return 0.3; // Different but not incompatible
}

export function calculateGoalCompatibility(profile1: any, profile2: any): number {
  const goals1 = [profile1.goal1, profile1.goal2].filter(Boolean);
  const goals2 = [profile2.goal1, profile2.goal2].filter(Boolean);
  
  let maxCompatibility = 0;
  
  for (const goal1 of goals1) {
    for (const goal2 of goals2) {
      if (goal1 === goal2) {
        return 1.0; // Same goal
      }
      
      const compatible = GOAL_COMPATIBILITY[goal1 as keyof typeof GOAL_COMPATIBILITY] || [];
      if (compatible.includes(goal2)) {
        maxCompatibility = Math.max(maxCompatibility, 0.8);
      }
    }
  }
  
  return maxCompatibility || 0.4; // Some base compatibility
}

export function calculateSeniorityFit(profile1: any, profile2: any): number {
  const level1 = SENIORITY_LEVELS[profile1.professionLevel as keyof typeof SENIORITY_LEVELS] || 2;
  const level2 = SENIORITY_LEVELS[profile2.professionLevel as keyof typeof SENIORITY_LEVELS] || 2;
  
  const diff = Math.abs(level1 - level2);
  
  if (diff === 0) return 1.0; // Same level
  if (diff === 1) return 0.9; // Adjacent levels
  if (diff === 2) return 0.7; // Close levels
  if (diff === 3) return 0.5; // Mentor/mentee potential
  
  return 0.3; // Very different levels
}

export function calculateAvailabilityOverlap(profile1: any, profile2: any): number {
  const availability1 = profile1.availability || [];
  const availability2 = profile2.availability || [];
  
  if (availability1.length === 0 || availability2.length === 0) {
    return 0.7; // Neutral if availability not set
  }
  
  let totalOverlap = 0;
  let totalSlots = 0;
  
  for (let day = 0; day < 7; day++) {
    const slots1 = availability1.filter((a: any) => a.dayOfWeek === day);
    const slots2 = availability2.filter((a: any) => a.dayOfWeek === day);
    
    if (slots1.length === 0 || slots2.length === 0) continue;
    
    for (const slot1 of slots1) {
      for (const slot2 of slots2) {
        totalSlots++;
        const overlap = calculateTimeOverlapMinutes(slot1, slot2);
        totalOverlap += Math.min(overlap / 120, 1); // Normalize to 2 hours max
      }
    }
  }
  
  return totalSlots > 0 ? totalOverlap / totalSlots : 0.7;
}

export function calculateDistancePenalty(profile1: any, profile2: any): number {
  // Only applies to in-person meetings
  if (profile1.mode === 'ONLINE' || profile2.mode === 'ONLINE') {
    return 1.0; // No penalty for online
  }
  
  if (!profile1.city || !profile2.city) {
    return 0.5; // Penalty if city missing for in-person
  }
  
  const distance = calculateHaversineDistance(
    profile1.city.latitude, profile1.city.longitude,
    profile2.city.latitude, profile2.city.longitude
  );
  
  const maxRadius = Math.min(profile1.radiusKm || 25, profile2.radiusKm || 25);
  
  if (distance <= maxRadius) {
    return 1.0 - (distance / maxRadius) * 0.3; // Slight penalty based on distance
  }
  
  return 0.1; // Heavy penalty if outside radius
}

export function calculateDiversityBoost(profile1: any, profile2: any): number {
  let diversityScore = 0.5; // Base score
  
  // Company diversity
  if (profile1.company && profile2.company && profile1.company !== profile2.company) {
    diversityScore += 0.3;
  }
  
  // Industry diversity (but not too different)
  const sameIndustry = profile1.industries.some((i1: any) => 
    profile2.industries.some((i2: any) => i1.industry.name === i2.industry.name)
  );
  
  if (!sameIndustry) {
    diversityScore += 0.2; // Small boost for different industries
  }
  
  return Math.min(diversityScore, 1.0);
}

function jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
}

function calculateTimeOverlapMinutes(slot1: any, slot2: any): number {
  const start1 = timeToMinutes(slot1.startTime);
  const end1 = timeToMinutes(slot1.endTime);
  const start2 = timeToMinutes(slot2.startTime);
  const end2 = timeToMinutes(slot2.endTime);
  
  const overlapStart = Math.max(start1, start2);
  const overlapEnd = Math.min(end1, end2);
  
  return Math.max(0, overlapEnd - overlapStart);
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}