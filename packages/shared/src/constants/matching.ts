export const MATCHING_WEIGHTS = {
  topics: 0.25,
  industry: 0.15,
  profession: 0.15,
  goal: 0.15,
  seniority: 0.10,
  availability: 0.10,
  distance: 0.05,
  diversity: 0.05,
} as const;

export const VIBE_WEIGHT_ADJUSTMENTS = {
  CASUAL: {
    topics: 1.2,
    industry: 0.8,
    profession: 0.8,
    goal: 1.1,
    seniority: 0.9,
    availability: 1.0,
    distance: 1.0,
    diversity: 1.1,
  },
  PROFESSIONAL: {
    topics: 0.9,
    industry: 1.3,
    profession: 1.3,
    goal: 1.2,
    seniority: 1.2,
    availability: 1.0,
    distance: 1.0,
    diversity: 0.8,
  },
  MIXED: {
    topics: 1.0,
    industry: 1.0,
    profession: 1.0,
    goal: 1.0,
    seniority: 1.0,
    availability: 1.0,
    distance: 1.0,
    diversity: 1.0,
  },
} as const;

export const PROFESSION_RELATIONS = {
  "Software Engineer": ["Product Manager", "Designer", "Data Scientist", "DevOps Engineer"],
  "Product Manager": ["Software Engineer", "Designer", "Marketing Manager", "Business Analyst"],
  "Designer": ["Product Manager", "Software Engineer", "Marketing Manager", "UX Researcher"],
  "Data Scientist": ["Software Engineer", "Product Manager", "Business Analyst", "ML Engineer"],
  "Marketing Manager": ["Product Manager", "Designer", "Sales Manager", "Content Creator"],
  "Sales Manager": ["Marketing Manager", "Business Development", "Account Manager", "Customer Success"],
  "Consultant": ["Business Analyst", "Strategy Manager", "Project Manager", "Operations Manager"],
  "CEO": ["CTO", "CMO", "CFO", "VP of Engineering", "VP of Sales"],
  "CTO": ["CEO", "VP of Engineering", "Software Engineer", "Product Manager"],
} as const;

export const INDUSTRY_PROXIMITY = {
  "Technology": ["Software", "AI/ML", "Fintech", "Healthtech", "E-commerce"],
  "Finance": ["Banking", "Investment", "Insurance", "Fintech", "Real Estate"],
  "Healthcare": ["Medical", "Pharma", "Biotech", "Healthtech", "Medical Devices"],
  "Consulting": ["Strategy", "Management", "Operations", "Technology", "Finance"],
  "Media": ["Entertainment", "Publishing", "Advertising", "Social Media", "Gaming"],
  "Education": ["EdTech", "Training", "Academic", "E-learning", "Research"],
} as const;

export const GOAL_COMPATIBILITY = {
  "NETWORKING": ["COLLABORATION", "INDUSTRY_INSIGHTS", "FRIENDSHIP"],
  "MENTORSHIP": ["CAREER_ADVICE", "INDUSTRY_INSIGHTS", "NETWORKING"],
  "CAREER_ADVICE": ["MENTORSHIP", "NETWORKING", "INDUSTRY_INSIGHTS"],
  "INDUSTRY_INSIGHTS": ["NETWORKING", "CAREER_ADVICE", "COLLABORATION"],
  "COLLABORATION": ["NETWORKING", "INDUSTRY_INSIGHTS", "FRIENDSHIP"],
  "FRIENDSHIP": ["NETWORKING", "COLLABORATION", "INDUSTRY_INSIGHTS"],
} as const;

export const SENIORITY_LEVELS = {
  "ENTRY": 1,
  "MID": 2,
  "SENIOR": 3,
  "LEAD": 4,
  "DIRECTOR": 5,
  "VP": 6,
  "C_LEVEL": 7,
} as const;

export const COOLDOWN_WEEKS = 12;
export const MAX_WEEKLY_MATCHES_FREE = 1;
export const MAX_WEEKLY_MATCHES_PRO = 5;
export const TOP_K_CANDIDATES = 50;
export const MUTUAL_TOP_N = 10;

export const PRICING = {
  PRO_MONTHLY: 770, // XTR
  EXTRA_MATCH: 150, // XTR
  INSTANT_REROLL: 60, // XTR
  PRIORITY_BOOST_24H: 120, // XTR
} as const;

export const PAIRING_CONFIG = {
  PROPOSAL_SLOTS: 3,
  REMINDER_HOURS: 48,
  EXPIRY_HOURS_MIN: 72,
  EXPIRY_HOURS_MAX: 96,
} as const;