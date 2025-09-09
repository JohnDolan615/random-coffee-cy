export interface MatchingCandidate {
  userId: string;
  profile: {
    profession: string | null;
    professionLevel: string;
    company: string | null;
    goal1: string | null;
    goal2: string | null;
    mode: string;
    cityId: string | null;
    radiusKm: number | null;
    timezone: string;
    vibe: string;
    topics: Array<{ topicId: string; topic: { name: string } }>;
    industries: Array<{ industryId: string; industry: { name: string } }>;
    availability: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      timezone: string;
    }>;
    city?: {
      latitude: number;
      longitude: number;
      timezone: string;
    } | null;
  };
  user: {
    telegramId: bigint;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
  };
}

export interface MatchScore {
  user1Id: string;
  user2Id: string;
  score: number;
  components: {
    topics: number;
    industry: number;
    profession: number;
    goal: number;
    seniority: number;
    availability: number;
    distance: number;
    diversity: number;
  };
}

export interface PairingProposal {
  user1Id: string;
  user2Id: string;
  score1to2: number;
  score2to1: number;
  avgScore: number;
  mode: string;
  proposedSlots: Array<{
    date: string;
    startTime: string;
    endTime: string;
    timezone: string;
  }>;
}

export interface OnboardingState {
  step: 'profession' | 'industries' | 'topics' | 'about' | 'goals' | 'mode' | 'city' | 'timezone' | 'frequency' | 'complete';
  data: {
    profession?: string;
    professionLevel?: string;
    company?: string;
    industries?: string[];
    topics?: string[];
    customTopics?: string[];
    about?: string;
    goal1?: string;
    goal2?: string;
    mode?: string;
    cityName?: string;
    radiusKm?: number;
    timezone?: string;
    frequency?: string;
    vibe?: string;
  };
}

export interface PaymentProduct {
  type: 'pro_monthly' | 'extra_match' | 'reroll' | 'priority';
  title: string;
  description: string;
  priceXTR: number;
  payload: string;
}

export interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone: string;
}

export interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
  timezone: string;
}

export interface FeedbackData {
  rating: number;
  tags: string[];
  comment?: string;
  noShow: boolean;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  todaysPairings: number;
  acceptanceRate: number;
  showUpRate: number;
  avgRating: number;
  revenue: {
    thisMonth: number;
    lastMonth: number;
  };
}

export type Vibe = 'CASUAL' | 'PROFESSIONAL' | 'MIXED';
export type Mode = 'IN_PERSON' | 'ONLINE' | 'BOTH';
export type PairingStatus = 'PENDING' | 'CONFIRMED' | 'EXPIRED' | 'DONE' | 'NO_SHOW';
export type GoalType = 'NETWORKING' | 'MENTORSHIP' | 'CAREER_ADVICE' | 'INDUSTRY_INSIGHTS' | 'COLLABORATION' | 'FRIENDSHIP';
export type ProfessionLevel = 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'DIRECTOR' | 'VP' | 'C_LEVEL';