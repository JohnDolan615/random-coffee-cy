import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { calculateMatchScore } from "./scoring.js";
import type { MatchingCandidate, PairingProposal } from "@random-coffee/shared";
import { TOP_K_CANDIDATES, MUTUAL_TOP_N, COOLDOWN_WEEKS } from "@random-coffee/shared";

export async function runDailyMatching(timezone: string = 'UTC') {
  try {
    logger.info({ timezone }, 'Starting daily matching');

    const candidates = await getEligibleCandidates(timezone);
    logger.info({ candidateCount: candidates.length }, 'Found eligible candidates');

    if (candidates.length < 2) {
      logger.info('Not enough candidates for matching');
      return;
    }

    const buckets = bucketCandidates(candidates);
    
    for (const [bucketKey, bucketCandidates] of buckets) {
      logger.info({ bucketKey, count: bucketCandidates.length }, 'Processing bucket');
      
      if (bucketCandidates.length < 2) continue;
      
      const pairs = await greedyMatching(bucketCandidates);
      
      for (const pair of pairs) {
        await createPairing(pair);
      }
      
      logger.info({ bucketKey, pairsCreated: pairs.length }, 'Bucket matching complete');
    }

    logger.info('Daily matching completed');

  } catch (error) {
    logger.error(error, 'Error in daily matching');
    throw error;
  }
}

async function getEligibleCandidates(timezone: string): Promise<MatchingCandidate[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - (COOLDOWN_WEEKS * 7));

  const candidates = await prisma.user.findMany({
    where: {
      profile: {
        isOnboarded: true,
        isPaused: false,
        // Additional eligibility filters would go here
      }
    },
    include: {
      profile: {
        include: {
          topics: { include: { topic: true } },
          industries: { include: { industry: true } },
          availability: true,
          city: true,
        }
      }
    }
  });

  // Filter out users with recent pairings, pending matches, etc.
  const eligibleCandidates: MatchingCandidate[] = [];
  
  for (const candidate of candidates) {
    if (!candidate.profile) continue;

    // Check for recent pairings within cooldown period
    const recentPairings = await prisma.pairing.findMany({
      where: {
        OR: [
          { user1Id: candidate.id },
          { user2Id: candidate.id }
        ],
        createdAt: { gte: cutoffDate }
      }
    });

    // Check for pending/confirmed pairings
    const pendingPairings = await prisma.pairing.findMany({
      where: {
        OR: [
          { user1Id: candidate.id },
          { user2Id: candidate.id }
        ],
        status: { in: ['PENDING', 'CONFIRMED'] }
      }
    });

    if (pendingPairings.length > 0) continue; // Skip if has pending matches

    // Check weekly match limit (if not Pro)
    const weekStart = getWeekStart();
    const thisWeekMatches = await prisma.pairing.count({
      where: {
        OR: [
          { user1Id: candidate.id },
          { user2Id: candidate.id }
        ],
        createdAt: { gte: weekStart }
      }
    });

    const hasPro = await prisma.subscription.findFirst({
      where: {
        userId: candidate.id,
        type: 'PRO_MONTHLY',
        status: 'active',
        endDate: { gt: new Date() }
      }
    });

    const maxMatches = hasPro ? 5 : 1;
    if (thisWeekMatches >= maxMatches) continue;

    eligibleCandidates.push({
      userId: candidate.id,
      profile: candidate.profile,
      user: candidate,
    });
  }

  return eligibleCandidates;
}

function bucketCandidates(candidates: MatchingCandidate[]): Map<string, MatchingCandidate[]> {
  const buckets = new Map<string, MatchingCandidate[]>();

  for (const candidate of candidates) {
    const bucketKeys = generateBucketKeys(candidate);
    
    for (const key of bucketKeys) {
      if (!buckets.has(key)) {
        buckets.set(key, []);
      }
      buckets.get(key)!.push(candidate);
    }
  }

  return buckets;
}

function generateBucketKeys(candidate: MatchingCandidate): string[] {
  const keys: string[] = [];
  const profile = candidate.profile;

  // Mode-based buckets
  if (profile.mode === 'ONLINE' || profile.mode === 'BOTH') {
    keys.push(`online_${profile.timezone}`);
  }

  if (profile.mode === 'IN_PERSON' || profile.mode === 'BOTH') {
    if (profile.city) {
      keys.push(`inperson_${profile.city.name}_${profile.city.country}`);
    }
  }

  return keys;
}

async function greedyMatching(candidates: MatchingCandidate[]): Promise<PairingProposal[]> {
  const pairs: PairingProposal[] = [];
  const matched = new Set<string>();

  // Calculate all pairwise scores
  const scores: { [key: string]: any } = {};
  
  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const candidate1 = candidates[i];
      const candidate2 = candidates[j];
      
      // Check if they can be matched (same mode compatibility, etc.)
      if (!canBePaired(candidate1, candidate2)) continue;

      // Check for existing pairing cooldown
      const hasCooldown = await checkPairingCooldown(candidate1.userId, candidate2.userId);
      if (hasCooldown) continue;

      const score1to2 = calculateMatchScore(candidate1, candidate2);
      const score2to1 = calculateMatchScore(candidate2, candidate1);
      
      const key = `${candidate1.userId}_${candidate2.userId}`;
      scores[key] = {
        user1Id: candidate1.userId,
        user2Id: candidate2.userId,
        score1to2: score1to2.score,
        score2to1: score2to1.score,
        avgScore: (score1to2.score + score2to1.score) / 2,
      };
    }
  }

  // Sort by average score
  const sortedPairs = Object.values(scores).sort((a: any, b: any) => b.avgScore - a.avgScore);

  // Greedy selection with reciprocity check
  for (const pairScore of sortedPairs) {
    if (matched.has(pairScore.user1Id) || matched.has(pairScore.user2Id)) continue;

    // Check mutual top-N preference
    if (await checkMutualPreference(pairScore, scores)) {
      pairs.push({
        user1Id: pairScore.user1Id,
        user2Id: pairScore.user2Id,
        score1to2: pairScore.score1to2,
        score2to1: pairScore.score2to1,
        avgScore: pairScore.avgScore,
        mode: determineMeetingMode(
          candidates.find(c => c.userId === pairScore.user1Id)!,
          candidates.find(c => c.userId === pairScore.user2Id)!
        ),
        proposedSlots: [] // Would be populated by scheduling service
      });

      matched.add(pairScore.user1Id);
      matched.add(pairScore.user2Id);
    }
  }

  return pairs;
}

function canBePaired(candidate1: MatchingCandidate, candidate2: MatchingCandidate): boolean {
  const profile1 = candidate1.profile;
  const profile2 = candidate2.profile;

  // Mode compatibility
  if (profile1.mode === 'ONLINE' && profile2.mode === 'IN_PERSON') return false;
  if (profile1.mode === 'IN_PERSON' && profile2.mode === 'ONLINE') return false;

  // In-person location check
  if ((profile1.mode === 'IN_PERSON' || profile1.mode === 'BOTH') &&
      (profile2.mode === 'IN_PERSON' || profile2.mode === 'BOTH')) {
    if (!profile1.city || !profile2.city) return false;
    
    // Check if within radius
    const distance = calculateDistance(profile1.city, profile2.city);
    const maxRadius = Math.min(profile1.radiusKm || 25, profile2.radiusKm || 25);
    
    if (distance > maxRadius) return false;
  }

  return true;
}

async function checkPairingCooldown(userId1: string, userId2: string): Promise<boolean> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - (COOLDOWN_WEEKS * 7));

  const existingPairing = await prisma.pairing.findFirst({
    where: {
      OR: [
        { user1Id: userId1, user2Id: userId2 },
        { user1Id: userId2, user2Id: userId1 }
      ],
      createdAt: { gte: cutoffDate }
    }
  });

  return !!existingPairing;
}

async function checkMutualPreference(pairScore: any, allScores: { [key: string]: any }): Promise<boolean> {
  // Check if each user is in the other's top-N preferences
  const user1Preferences = Object.values(allScores)
    .filter((score: any) => score.user1Id === pairScore.user1Id)
    .sort((a: any, b: any) => b.score1to2 - a.score1to2)
    .slice(0, MUTUAL_TOP_N);

  const user2Preferences = Object.values(allScores)
    .filter((score: any) => score.user1Id === pairScore.user2Id || score.user2Id === pairScore.user2Id)
    .sort((a: any, b: any) => {
      const score = a.user1Id === pairScore.user2Id ? a.score1to2 : a.score2to1;
      const scoreB = b.user1Id === pairScore.user2Id ? b.score1to2 : b.score2to1;
      return scoreB - score;
    })
    .slice(0, MUTUAL_TOP_N);

  const user1LikesUser2 = user1Preferences.some((p: any) => p.user2Id === pairScore.user2Id);
  const user2LikesUser1 = user2Preferences.some((p: any) => 
    p.user1Id === pairScore.user1Id || p.user2Id === pairScore.user1Id
  );

  return user1LikesUser2 && user2LikesUser1;
}

function determineMeetingMode(candidate1: MatchingCandidate, candidate2: MatchingCandidate): string {
  if (candidate1.profile.mode === 'ONLINE' || candidate2.profile.mode === 'ONLINE') {
    return 'ONLINE';
  }
  return 'IN_PERSON';
}

async function createPairing(proposal: PairingProposal) {
  try {
    const pairing = await prisma.pairing.create({
      data: {
        user1Id: proposal.user1Id,
        user2Id: proposal.user2Id,
        status: 'PENDING',
        mode: proposal.mode as any,
        score1to2: proposal.score1to2,
        score2to1: proposal.score2to1,
        avgScore: proposal.avgScore,
      }
    });

    logger.info({ 
      pairingId: pairing.id, 
      user1Id: proposal.user1Id, 
      user2Id: proposal.user2Id,
      avgScore: proposal.avgScore 
    }, 'Pairing created');

    // Trigger match proposal sending
    // This would call the handler to send proposals to both users

  } catch (error) {
    logger.error(error, 'Error creating pairing');
    throw error;
  }
}

function calculateDistance(city1: any, city2: any): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(city2.latitude - city1.latitude);
  const dLon = toRadians(city2.longitude - city1.longitude);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(city1.latitude)) * Math.cos(toRadians(city2.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function getWeekStart(): Date {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}