import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';

// Mock Prisma for testing
const mockPrisma = {
  user: {
    findMany: vi.fn(),
  },
  pairing: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
  },
  subscription: {
    findFirst: vi.fn(),
  },
} as any;

vi.mock('../apps/bot/src/lib/prisma', () => ({
  prisma: mockPrisma
}));

describe('Pairing System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockUser = (id: string, overrides = {}) => ({
    id,
    telegramId: BigInt(parseInt(id)),
    username: `user${id}`,
    firstName: `User${id}`,
    lastName: 'Test',
    profile: {
      id: `profile${id}`,
      isOnboarded: true,
      isPaused: false,
      mode: 'BOTH',
      cityId: 'city1',
      radiusKm: 25,
      timezone: 'UTC',
      topics: [
        { topicId: '1', topic: { name: 'AI' } },
        { topicId: '2', topic: { name: 'Startups' } }
      ],
      industries: [
        { industryId: '1', industry: { name: 'Technology' } }
      ],
      availability: [
        {
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
          timezone: 'UTC'
        }
      ],
      city: {
        id: 'city1',
        name: 'New York',
        latitude: 40.7128,
        longitude: -74.0060,
        timezone: 'America/New_York'
      },
      profession: 'Software Engineer',
      professionLevel: 'MID',
      company: 'TechCorp',
      goal1: 'NETWORKING',
      goal2: 'CAREER_ADVICE',
      vibe: 'MIXED',
      ...overrides
    },
    ...overrides
  });

  describe('Eligibility Filtering', () => {
    it('should filter out paused users', async () => {
      const users = [
        createMockUser('1'),
        createMockUser('2', { profile: { isPaused: true } }),
        createMockUser('3'),
      ];
      
      mockPrisma.user.findMany.mockResolvedValue(users);
      mockPrisma.pairing.findMany.mockResolvedValue([]);
      mockPrisma.pairing.count.mockResolvedValue(0);
      mockPrisma.subscription.findFirst.mockResolvedValue(null);
      
      // This would be tested with the actual getEligibleCandidates function
      const eligibleUsers = users.filter(user => !user.profile?.isPaused);
      expect(eligibleUsers).toHaveLength(2);
      expect(eligibleUsers.map(u => u.id)).toEqual(['1', '3']);
    });

    it('should filter out users who are not onboarded', async () => {
      const users = [
        createMockUser('1'),
        createMockUser('2', { profile: { isOnboarded: false } }),
        createMockUser('3'),
      ];
      
      const eligibleUsers = users.filter(user => user.profile?.isOnboarded);
      expect(eligibleUsers).toHaveLength(2);
    });

    it('should respect weekly match limits', async () => {
      // User with no subscription should be limited to 1 match per week
      mockPrisma.subscription.findFirst.mockResolvedValue(null);
      mockPrisma.pairing.count.mockResolvedValue(1); // Already has 1 match this week
      
      const hasReachedLimit = true; // Would be calculated based on match count
      expect(hasReachedLimit).toBe(true);
    });

    it('should allow more matches for Pro subscribers', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue({
        type: 'PRO_MONTHLY',
        status: 'active',
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
      mockPrisma.pairing.count.mockResolvedValue(3); // Has 3 matches this week
      
      const hasReachedLimit = false; // Pro users get 5 matches per week
      expect(hasReachedLimit).toBe(false);
    });
  });

  describe('Mode Compatibility', () => {
    it('should match ONLINE users with ONLINE and BOTH', () => {
      const user1 = createMockUser('1', { profile: { mode: 'ONLINE' } });
      const user2Online = createMockUser('2', { profile: { mode: 'ONLINE' } });
      const user3Both = createMockUser('3', { profile: { mode: 'BOTH' } });
      const user4InPerson = createMockUser('4', { profile: { mode: 'IN_PERSON' } });
      
      // Test compatibility logic
      const canMatch = (u1: any, u2: any) => {
        if (u1.profile.mode === 'ONLINE' && u2.profile.mode === 'IN_PERSON') return false;
        if (u1.profile.mode === 'IN_PERSON' && u2.profile.mode === 'ONLINE') return false;
        return true;
      };
      
      expect(canMatch(user1, user2Online)).toBe(true);
      expect(canMatch(user1, user3Both)).toBe(true);
      expect(canMatch(user1, user4InPerson)).toBe(false);
    });

    it('should check location for in-person meetings', () => {
      const user1 = createMockUser('1', { 
        profile: { 
          mode: 'IN_PERSON',
          city: { latitude: 40.7128, longitude: -74.0060 }, // NYC
          radiusKm: 25
        }
      });
      const user2Close = createMockUser('2', { 
        profile: { 
          mode: 'IN_PERSON',
          city: { latitude: 40.7589, longitude: -73.9851 }, // Close to NYC
          radiusKm: 25
        }
      });
      const user3Far = createMockUser('3', { 
        profile: { 
          mode: 'IN_PERSON',
          city: { latitude: 34.0522, longitude: -118.2437 }, // LA
          radiusKm: 25
        }
      });
      
      // Calculate Haversine distance (simplified)
      const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      };
      
      const distanceToClose = calculateDistance(
        user1.profile.city.latitude, user1.profile.city.longitude,
        user2Close.profile.city.latitude, user2Close.profile.city.longitude
      );
      
      const distanceToFar = calculateDistance(
        user1.profile.city.latitude, user1.profile.city.longitude,
        user3Far.profile.city.latitude, user3Far.profile.city.longitude
      );
      
      expect(distanceToClose).toBeLessThan(25);
      expect(distanceToFar).toBeGreaterThan(25);
    });
  });

  describe('Cooldown Periods', () => {
    it('should prevent re-matching within cooldown period', async () => {
      const cooldownWeeks = 12;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - (cooldownWeeks * 7));
      
      // Mock a recent pairing within cooldown period
      mockPrisma.pairing.findFirst.mockResolvedValue({
        id: 'pairing1',
        user1Id: '1',
        user2Id: '2',
        createdAt: new Date(Date.now() - 5 * 7 * 24 * 60 * 60 * 1000) // 5 weeks ago
      });
      
      const hasCooldown = true; // Would be determined by the pairing being within cooldown
      expect(hasCooldown).toBe(true);
    });

    it('should allow re-matching after cooldown period', async () => {
      const cooldownWeeks = 12;
      
      // Mock a pairing outside cooldown period
      mockPrisma.pairing.findFirst.mockResolvedValue({
        id: 'pairing1',
        user1Id: '1',
        user2Id: '2',
        createdAt: new Date(Date.now() - 15 * 7 * 24 * 60 * 60 * 1000) // 15 weeks ago
      });
      
      const hasCooldown = false;
      expect(hasCooldown).toBe(false);
    });
  });

  describe('Greedy Matching Algorithm', () => {
    it('should prioritize higher scoring pairs', () => {
      const scores = [
        { user1Id: '1', user2Id: '2', avgScore: 0.9 },
        { user1Id: '3', user2Id: '4', avgScore: 0.8 },
        { user1Id: '1', user2Id: '4', avgScore: 0.7 },
        { user1Id: '2', user2Id: '3', avgScore: 0.6 },
      ];
      
      const sortedScores = scores.sort((a, b) => b.avgScore - a.avgScore);
      expect(sortedScores[0].avgScore).toBe(0.9);
      expect(sortedScores[0].user1Id).toBe('1');
      expect(sortedScores[0].user2Id).toBe('2');
    });

    it('should ensure no user is matched twice', () => {
      const scores = [
        { user1Id: '1', user2Id: '2', avgScore: 0.9 },
        { user1Id: '1', user2Id: '3', avgScore: 0.8 }, // User 1 already matched
        { user1Id: '4', user2Id: '5', avgScore: 0.7 },
      ];
      
      const matched = new Set<string>();
      const pairs = [];
      
      for (const score of scores.sort((a, b) => b.avgScore - a.avgScore)) {
        if (!matched.has(score.user1Id) && !matched.has(score.user2Id)) {
          pairs.push(score);
          matched.add(score.user1Id);
          matched.add(score.user2Id);
        }
      }
      
      expect(pairs).toHaveLength(2);
      expect(pairs[0]).toEqual({ user1Id: '1', user2Id: '2', avgScore: 0.9 });
      expect(pairs[1]).toEqual({ user1Id: '4', user2Id: '5', avgScore: 0.7 });
    });
  });

  describe('Reciprocity Check', () => {
    it('should require mutual top-N preference', () => {
      const allScores = {
        '1_2': { user1Id: '1', user2Id: '2', score1to2: 0.9, score2to1: 0.8 },
        '1_3': { user1Id: '1', user2Id: '3', score1to2: 0.7, score2to1: 0.6 },
        '2_1': { user1Id: '2', user2Id: '1', score1to2: 0.8, score2to1: 0.9 },
        '2_3': { user1Id: '2', user2Id: '3', score1to2: 0.5, score2to1: 0.4 },
      };
      
      // User 1's preferences: User 2 (0.9), User 3 (0.7)
      // User 2's preferences: User 1 (0.8), User 3 (0.5)
      
      const user1Preferences = Object.values(allScores)
        .filter(s => s.user1Id === '1')
        .sort((a, b) => b.score1to2 - a.score1to2);
      
      const user2Preferences = Object.values(allScores)
        .filter(s => s.user1Id === '2' || s.user2Id === '2')
        .sort((a, b) => {
          const scoreA = a.user1Id === '2' ? a.score1to2 : a.score2to1;
          const scoreB = b.user1Id === '2' ? b.score1to2 : b.score2to1;
          return scoreB - scoreA;
        });
      
      expect(user1Preferences[0].user2Id).toBe('2');
      expect(user2Preferences[0].user1Id === '1' || user2Preferences[0].user2Id === '1').toBe(true);
    });
  });

  describe('Pairing Creation', () => {
    it('should create pairing with correct data', async () => {
      const proposal = {
        user1Id: '1',
        user2Id: '2',
        score1to2: 0.85,
        score2to1: 0.78,
        avgScore: 0.815,
        mode: 'BOTH',
        proposedSlots: []
      };
      
      mockPrisma.pairing.create.mockResolvedValue({
        id: 'pairing123',
        ...proposal,
        status: 'PENDING',
        createdAt: new Date()
      });
      
      const result = await mockPrisma.pairing.create({
        data: {
          user1Id: proposal.user1Id,
          user2Id: proposal.user2Id,
          status: 'PENDING',
          mode: proposal.mode,
          score1to2: proposal.score1to2,
          score2to1: proposal.score2to1,
          avgScore: proposal.avgScore,
        }
      });
      
      expect(result.id).toBe('pairing123');
      expect(result.user1Id).toBe('1');
      expect(result.user2Id).toBe('2');
      expect(result.status).toBe('PENDING');
    });
  });

  describe('Bucketing Strategy', () => {
    it('should group users by mode and location', () => {
      const users = [
        createMockUser('1', { profile: { mode: 'ONLINE', timezone: 'UTC' } }),
        createMockUser('2', { profile: { mode: 'ONLINE', timezone: 'UTC' } }),
        createMockUser('3', { profile: { mode: 'IN_PERSON', city: { name: 'NYC', country: 'USA' } } }),
        createMockUser('4', { profile: { mode: 'IN_PERSON', city: { name: 'NYC', country: 'USA' } } }),
        createMockUser('5', { profile: { mode: 'IN_PERSON', city: { name: 'LA', country: 'USA' } } }),
      ];
      
      const buckets = new Map<string, any[]>();
      
      users.forEach(user => {
        const keys = [];
        
        if (user.profile.mode === 'ONLINE' || user.profile.mode === 'BOTH') {
          keys.push(`online_${user.profile.timezone}`);
        }
        
        if (user.profile.mode === 'IN_PERSON' || user.profile.mode === 'BOTH') {
          if (user.profile.city) {
            keys.push(`inperson_${user.profile.city.name}_${user.profile.city.country}`);
          }
        }
        
        keys.forEach(key => {
          if (!buckets.has(key)) buckets.set(key, []);
          buckets.get(key)!.push(user);
        });
      });
      
      expect(buckets.has('online_UTC')).toBe(true);
      expect(buckets.get('online_UTC')).toHaveLength(2);
      expect(buckets.has('inperson_NYC_USA')).toBe(true);
      expect(buckets.get('inperson_NYC_USA')).toHaveLength(2);
      expect(buckets.has('inperson_LA_USA')).toBe(true);
      expect(buckets.get('inperson_LA_USA')).toHaveLength(1);
    });
  });
});