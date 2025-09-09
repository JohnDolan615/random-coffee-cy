import { describe, it, expect } from 'vitest';
import { 
  calculateTopicsSimilarity, 
  calculateIndustrySimilarity,
  calculateProfessionSimilarity,
  calculateGoalCompatibility,
  calculateSeniorityFit,
  calculateAvailabilityOverlap,
  calculateDistancePenalty,
  calculateDiversityBoost,
  calculateMatchScore
} from '../apps/bot/src/services/scoring';
import type { MatchingCandidate } from '@random-coffee/shared';

describe('Scoring Algorithm', () => {
  const createMockCandidate = (overrides: any = {}): MatchingCandidate => ({
    userId: 'user1',
    user: {
      telegramId: BigInt(123),
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe'
    },
    profile: {
      profession: 'Software Engineer',
      professionLevel: 'MID',
      company: 'TechCorp',
      goal1: 'NETWORKING',
      goal2: 'CAREER_ADVICE',
      mode: 'BOTH',
      cityId: 'city1',
      radiusKm: 25,
      timezone: 'UTC',
      vibe: 'MIXED',
      topics: [
        { topicId: '1', topic: { name: 'Artificial Intelligence' } },
        { topicId: '2', topic: { name: 'Startups' } },
        { topicId: '3', topic: { name: 'Leadership' } }
      ],
      industries: [
        { industryId: '1', industry: { name: 'Technology' } },
        { industryId: '2', industry: { name: 'AI/ML' } }
      ],
      availability: [
        {
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '12:00',
          timezone: 'UTC'
        },
        {
          dayOfWeek: 3,
          startTime: '14:00',
          endTime: '17:00',
          timezone: 'UTC'
        }
      ],
      city: {
        latitude: 40.7128,
        longitude: -74.0060,
        timezone: 'America/New_York'
      }
    },
    ...overrides
  });

  describe('calculateTopicsSimilarity', () => {
    it('should return 1.0 for identical topics', () => {
      const profile1 = {
        topics: [
          { topic: { name: 'AI' } },
          { topic: { name: 'Startups' } }
        ]
      };
      const profile2 = {
        topics: [
          { topic: { name: 'AI' } },
          { topic: { name: 'Startups' } }
        ]
      };
      
      const similarity = calculateTopicsSimilarity(profile1, profile2);
      expect(similarity).toBe(1.0);
    });

    it('should return 0.0 for no common topics', () => {
      const profile1 = {
        topics: [{ topic: { name: 'AI' } }]
      };
      const profile2 = {
        topics: [{ topic: { name: 'Marketing' } }]
      };
      
      const similarity = calculateTopicsSimilarity(profile1, profile2);
      expect(similarity).toBe(0.0);
    });

    it('should calculate Jaccard similarity correctly', () => {
      const profile1 = {
        topics: [
          { topic: { name: 'AI' } },
          { topic: { name: 'Startups' } },
          { topic: { name: 'Leadership' } }
        ]
      };
      const profile2 = {
        topics: [
          { topic: { name: 'AI' } },
          { topic: { name: 'Marketing' } }
        ]
      };
      
      const similarity = calculateTopicsSimilarity(profile1, profile2);
      // Intersection: 1 (AI), Union: 4 (AI, Startups, Leadership, Marketing)
      expect(similarity).toBe(0.25);
    });
  });

  describe('calculateIndustrySimilarity', () => {
    it('should return 1.0 for exact industry match', () => {
      const profile1 = {
        industries: [{ industry: { name: 'Technology' } }]
      };
      const profile2 = {
        industries: [{ industry: { name: 'Technology' } }]
      };
      
      const similarity = calculateIndustrySimilarity(profile1, profile2);
      expect(similarity).toBe(1.0);
    });

    it('should return 0.7 for related industries', () => {
      const profile1 = {
        industries: [{ industry: { name: 'Technology' } }]
      };
      const profile2 = {
        industries: [{ industry: { name: 'AI/ML' } }]
      };
      
      const similarity = calculateIndustrySimilarity(profile1, profile2);
      expect(similarity).toBe(0.7);
    });
  });

  describe('calculateProfessionSimilarity', () => {
    it('should return 1.0 for same profession', () => {
      const profile1 = { profession: 'Software Engineer' };
      const profile2 = { profession: 'Software Engineer' };
      
      const similarity = calculateProfessionSimilarity(profile1, profile2);
      expect(similarity).toBe(1.0);
    });

    it('should return 0.8 for related professions', () => {
      const profile1 = { profession: 'Software Engineer' };
      const profile2 = { profession: 'Product Manager' };
      
      const similarity = calculateProfessionSimilarity(profile1, profile2);
      expect(similarity).toBe(0.8);
    });

    it('should return 0.5 for missing profession', () => {
      const profile1 = { profession: null };
      const profile2 = { profession: 'Software Engineer' };
      
      const similarity = calculateProfessionSimilarity(profile1, profile2);
      expect(similarity).toBe(0.5);
    });
  });

  describe('calculateGoalCompatibility', () => {
    it('should return 1.0 for same goals', () => {
      const profile1 = { goal1: 'NETWORKING', goal2: 'MENTORSHIP' };
      const profile2 = { goal1: 'NETWORKING', goal2: null };
      
      const compatibility = calculateGoalCompatibility(profile1, profile2);
      expect(compatibility).toBe(1.0);
    });

    it('should return 0.8 for compatible goals', () => {
      const profile1 = { goal1: 'NETWORKING', goal2: null };
      const profile2 = { goal1: 'COLLABORATION', goal2: null };
      
      const compatibility = calculateGoalCompatibility(profile1, profile2);
      expect(compatibility).toBe(0.8);
    });
  });

  describe('calculateSeniorityFit', () => {
    it('should return 1.0 for same seniority level', () => {
      const profile1 = { professionLevel: 'MID' };
      const profile2 = { professionLevel: 'MID' };
      
      const fit = calculateSeniorityFit(profile1, profile2);
      expect(fit).toBe(1.0);
    });

    it('should return 0.9 for adjacent levels', () => {
      const profile1 = { professionLevel: 'MID' };
      const profile2 = { professionLevel: 'SENIOR' };
      
      const fit = calculateSeniorityFit(profile1, profile2);
      expect(fit).toBe(0.9);
    });

    it('should return lower values for distant levels', () => {
      const profile1 = { professionLevel: 'ENTRY' };
      const profile2 = { professionLevel: 'C_LEVEL' };
      
      const fit = calculateSeniorityFit(profile1, profile2);
      expect(fit).toBe(0.3);
    });
  });

  describe('calculateAvailabilityOverlap', () => {
    it('should return 0.7 for empty availability', () => {
      const profile1 = { availability: [] };
      const profile2 = { availability: [] };
      
      const overlap = calculateAvailabilityOverlap(profile1, profile2);
      expect(overlap).toBe(0.7);
    });

    it('should calculate overlap correctly', () => {
      const profile1 = {
        availability: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '12:00', timezone: 'UTC' }
        ]
      };
      const profile2 = {
        availability: [
          { dayOfWeek: 1, startTime: '10:00', endTime: '14:00', timezone: 'UTC' }
        ]
      };
      
      const overlap = calculateAvailabilityOverlap(profile1, profile2);
      expect(overlap).toBeGreaterThan(0);
    });
  });

  describe('calculateDistancePenalty', () => {
    it('should return 1.0 for online mode', () => {
      const profile1 = { mode: 'ONLINE', city: null };
      const profile2 = { mode: 'ONLINE', city: null };
      
      const penalty = calculateDistancePenalty(profile1, profile2);
      expect(penalty).toBe(1.0);
    });

    it('should return penalty for missing city in in-person mode', () => {
      const profile1 = { mode: 'IN_PERSON', city: null, radiusKm: 25 };
      const profile2 = { mode: 'IN_PERSON', city: null, radiusKm: 25 };
      
      const penalty = calculateDistancePenalty(profile1, profile2);
      expect(penalty).toBe(0.5);
    });

    it('should calculate distance-based penalty', () => {
      const profile1 = {
        mode: 'IN_PERSON',
        radiusKm: 25,
        city: { latitude: 40.7128, longitude: -74.0060 }
      };
      const profile2 = {
        mode: 'IN_PERSON',
        radiusKm: 25,
        city: { latitude: 40.7589, longitude: -73.9851 } // Close location
      };
      
      const penalty = calculateDistancePenalty(profile1, profile2);
      expect(penalty).toBeGreaterThan(0.5);
      expect(penalty).toBeLessThanOrEqual(1.0);
    });
  });

  describe('calculateDiversityBoost', () => {
    it('should give boost for different companies', () => {
      const profile1 = { company: 'TechCorp', industries: [] };
      const profile2 = { company: 'StartupX', industries: [] };
      
      const boost = calculateDiversityBoost(profile1, profile2);
      expect(boost).toBeGreaterThan(0.5);
    });

    it('should give boost for different industries', () => {
      const profile1 = {
        company: 'TechCorp',
        industries: [{ industry: { name: 'Technology' } }]
      };
      const profile2 = {
        company: 'TechCorp',
        industries: [{ industry: { name: 'Finance' } }]
      };
      
      const boost = calculateDiversityBoost(profile1, profile2);
      expect(boost).toBeGreaterThan(0.5);
    });
  });

  describe('calculateMatchScore - Full Integration', () => {
    it('should calculate complete match score', () => {
      const candidate1 = createMockCandidate();
      const candidate2 = createMockCandidate({
        userId: 'user2',
        profile: {
          ...candidate1.profile,
          profession: 'Product Manager',
          company: 'StartupX',
          topics: [
            { topicId: '1', topic: { name: 'Artificial Intelligence' } },
            { topicId: '4', topic: { name: 'Product Strategy' } }
          ]
        }
      });
      
      const score = calculateMatchScore(candidate1, candidate2);
      
      expect(score.user1Id).toBe('user1');
      expect(score.user2Id).toBe('user2');
      expect(score.score).toBeGreaterThan(0);
      expect(score.score).toBeLessThanOrEqual(1);
      expect(score.components).toHaveProperty('topics');
      expect(score.components).toHaveProperty('industry');
      expect(score.components).toHaveProperty('profession');
      expect(score.components).toHaveProperty('goal');
      expect(score.components).toHaveProperty('seniority');
      expect(score.components).toHaveProperty('availability');
      expect(score.components).toHaveProperty('distance');
      expect(score.components).toHaveProperty('diversity');
    });

    it('should apply vibe weight adjustments', () => {
      const candidate1 = createMockCandidate({
        profile: { ...createMockCandidate().profile, vibe: 'CASUAL' }
      });
      const candidate2 = createMockCandidate({
        userId: 'user2',
        profile: { ...createMockCandidate().profile, vibe: 'PROFESSIONAL' }
      });
      
      const score = calculateMatchScore(candidate1, candidate2);
      
      expect(score.components.topics).toBeGreaterThan(0);
      expect(score.components.industry).toBeGreaterThan(0);
    });

    it('should handle edge cases gracefully', () => {
      const candidate1 = createMockCandidate({
        profile: {
          ...createMockCandidate().profile,
          topics: [],
          industries: [],
          availability: [],
          city: null,
          profession: null
        }
      });
      const candidate2 = createMockCandidate({ userId: 'user2' });
      
      const score = calculateMatchScore(candidate1, candidate2);
      
      expect(score.score).toBeGreaterThanOrEqual(0);
      expect(score.score).toBeLessThanOrEqual(1);
      expect(Number.isNaN(score.score)).toBe(false);
    });
  });
});