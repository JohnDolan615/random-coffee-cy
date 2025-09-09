import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PROFESSIONS = [
  'Software Engineer', 'Product Manager', 'Designer', 'Data Scientist', 'Marketing Manager',
  'Sales Manager', 'Consultant', 'CEO', 'CTO', 'Engineering Manager', 'Operations Manager',
  'Business Analyst', 'UX Researcher', 'DevOps Engineer', 'Technical Writer',
];

const COMPANIES = [
  'TechCorp', 'InnovateLab', 'DataFlow Inc', 'CloudFirst', 'StartupX', 'MegaCorp',
  'DesignStudio', 'AI Innovations', 'FinanceFlow', 'HealthTech Solutions', 'EduPlatform',
  'RetailTech', 'GreenEnergy Co', 'FoodTech Ltd', 'TravelApp Inc',
];

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Consulting', 'Media', 'Education',
  'E-commerce', 'AI/ML', 'Fintech', 'Gaming', 'Real Estate', 'Insurance',
  'Banking', 'Investment', 'Pharma', 'Biotech', 'Entertainment', 'Publishing',
];

const TOPICS = [
  'Artificial Intelligence', 'Startups', 'Product Strategy', 'Leadership', 'Career Growth',
  'Investing', 'Remote Work', 'Tech Trends', 'Innovation', 'Entrepreneurship',
  'Data Science', 'Design Thinking', 'Marketing', 'Sales', 'Operations',
  'Finance', 'HR', 'Legal', 'Cloud Computing', 'Cybersecurity', 'Blockchain',
  'Machine Learning', 'Product Design', 'Growth Hacking', 'Venture Capital',
];

const CITIES = [
  { name: 'New York', country: 'USA', region: 'NY', latitude: 40.7128, longitude: -74.0060, timezone: 'America/New_York', population: 8336817 },
  { name: 'San Francisco', country: 'USA', region: 'CA', latitude: 37.7749, longitude: -122.4194, timezone: 'America/Los_Angeles', population: 881549 },
  { name: 'London', country: 'UK', region: 'England', latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London', population: 9648110 },
  { name: 'Berlin', country: 'Germany', region: 'Berlin', latitude: 52.5200, longitude: 13.4050, timezone: 'Europe/Berlin', population: 3769495 },
  { name: 'Paris', country: 'France', region: 'Île-de-France', latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris', population: 2165423 },
  { name: 'Toronto', country: 'Canada', region: 'ON', latitude: 43.6532, longitude: -79.3832, timezone: 'America/Toronto', population: 2731571 },
  { name: 'Tokyo', country: 'Japan', region: 'Kanto', latitude: 35.6762, longitude: 139.6503, timezone: 'Asia/Tokyo', population: 13960000 },
  { name: 'Singapore', country: 'Singapore', region: 'Central', latitude: 1.3521, longitude: 103.8198, timezone: 'Asia/Singapore', population: 5850342 },
  { name: 'Sydney', country: 'Australia', region: 'NSW', latitude: -33.8688, longitude: 151.2093, timezone: 'Australia/Sydney', population: 5312163 },
  { name: 'Amsterdam', country: 'Netherlands', region: 'North Holland', latitude: 52.3676, longitude: 4.9041, timezone: 'Europe/Amsterdam', population: 872680 },
];

const GOALS = ['NETWORKING', 'MENTORSHIP', 'CAREER_ADVICE', 'INDUSTRY_INSIGHTS', 'COLLABORATION', 'FRIENDSHIP'];
const MODES = ['IN_PERSON', 'ONLINE', 'BOTH'];
const PROFESSION_LEVELS = ['ENTRY', 'MID', 'SENIOR', 'LEAD', 'DIRECTOR', 'VP', 'C_LEVEL'];
const VIBES = ['CASUAL', 'PROFESSIONAL', 'MIXED'];

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomChoices<T>(array: T[], min: number, max: number): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = array.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateAbout(): string {
  const templates = [
    'Passionate about {0} and {1}. Love discussing {2} over coffee!',
    '{0} professional with expertise in {1}. Always eager to learn about {2}.',
    'Building the future of {0}. Interested in {1} and {2}.',
    'Ex-{0} now working on {1}. Coffee chats about {2} are my favorite!',
    'Helping companies with {0} and {1}. Let\'s talk {2}!',
  ];
  
  const interests = randomChoices(['tech', 'innovation', 'startups', 'AI', 'growth', 'strategy', 'data', 'design'], 2, 3);
  const template = randomChoice(templates);
  
  return template
    .replace('{0}', interests[0] || 'innovation')
    .replace('{1}', interests[1] || 'tech')
    .replace('{2}', interests[2] || 'startups');
}

function generateAvailability(): Array<{ dayOfWeek: number; startTime: string; endTime: string; timezone: string }> {
  const availability = [];
  const timezone = randomChoice(['America/New_York', 'Europe/London', 'Asia/Singapore', 'America/Los_Angeles']);
  
  // Generate 2-4 availability slots
  const numSlots = Math.floor(Math.random() * 3) + 2;
  const usedDays = new Set<number>();
  
  for (let i = 0; i < numSlots; i++) {
    let dayOfWeek;
    do {
      dayOfWeek = Math.floor(Math.random() * 5); // Mon-Fri (0-4)
    } while (usedDays.has(dayOfWeek));
    
    usedDays.add(dayOfWeek);
    
    const startHour = Math.floor(Math.random() * 8) + 9; // 9 AM - 4 PM
    const endHour = startHour + Math.floor(Math.random() * 3) + 1; // 1-3 hours later
    
    availability.push({
      dayOfWeek,
      startTime: `${startHour.toString().padStart(2, '0')}:00`,
      endTime: `${Math.min(endHour, 17).toString().padStart(2, '0')}:00`,
      timezone,
    });
  }
  
  return availability;
}

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data (in development only)
  if (process.env.NODE_ENV !== 'production') {
    console.log('🧹 Clearing existing data...');
    await prisma.pairFeedback.deleteMany();
    await prisma.pairing.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.blocklist.deleteMany();
    await prisma.availability.deleteMany();
    await prisma.userTopic.deleteMany();
    await prisma.userIndustry.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.user.deleteMany();
    await prisma.topic.deleteMany();
    await prisma.industry.deleteMany();
    await prisma.city.deleteMany();
  }

  // Seed cities
  console.log('🏙️ Seeding cities...');
  for (const cityData of CITIES) {
    await prisma.city.upsert({
      where: { name_country: { name: cityData.name, country: cityData.country } },
      update: {},
      create: cityData,
    });
  }

  // Seed industries
  console.log('🏭 Seeding industries...');
  for (const industryName of INDUSTRIES) {
    await prisma.industry.upsert({
      where: { name: industryName },
      update: {},
      create: { name: industryName },
    });
  }

  // Seed topics
  console.log('💡 Seeding topics...');
  for (const topicName of TOPICS) {
    await prisma.topic.upsert({
      where: { name: topicName },
      update: {},
      create: { name: topicName },
    });
  }

  // Get all created entities for reference
  const cities = await prisma.city.findMany();
  const industries = await prisma.industry.findMany();
  const topics = await prisma.topic.findMany();

  console.log('👥 Seeding users and profiles...');
  
  // Generate 100 diverse fake users
  for (let i = 0; i < 100; i++) {
    const firstName = `User${i + 1}`;
    const lastName = `Demo`;
    const username = `user${i + 1}_demo`;
    const telegramId = BigInt(1000000 + i);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        telegramId,
        username,
        firstName,
        lastName,
        languageCode: 'en',
        isPremium: Math.random() < 0.1, // 10% premium users
      },
    });

    // Create profile
    const city = randomChoice(cities);
    const userIndustries = randomChoices(industries, 1, 2);
    const userTopics = randomChoices(topics, 3, 5);
    const goals = randomChoices(GOALS, 1, 2);
    
    const profile = await prisma.profile.create({
      data: {
        userId: user.id,
        profession: randomChoice(PROFESSIONS),
        professionLevel: randomChoice(PROFESSION_LEVELS),
        company: randomChoice(COMPANIES),
        about: generateAbout(),
        goal1: goals[0] as any,
        goal2: goals[1] as any,
        mode: randomChoice(MODES) as any,
        cityId: city.id,
        radiusKm: Math.floor(Math.random() * 40) + 10, // 10-50km
        timezone: city.timezone,
        frequency: 'weekly',
        vibe: randomChoice(VIBES) as any,
        isPaused: Math.random() < 0.1, // 10% paused
        isOnboarded: true,
        matchCount: Math.floor(Math.random() * 10),
      },
    });

    // Create user-industry relationships
    for (const industry of userIndustries) {
      await prisma.userIndustry.create({
        data: {
          userId: profile.id,
          industryId: industry.id,
        },
      });
    }

    // Create user-topic relationships
    for (const topic of userTopics) {
      await prisma.userTopic.create({
        data: {
          userId: profile.id,
          topicId: topic.id,
        },
      });
    }

    // Create availability
    const availability = generateAvailability();
    for (const slot of availability) {
      await prisma.availability.create({
        data: {
          userId: profile.id,
          ...slot,
        },
      });
    }

    // Create some pro subscriptions (20% of users)
    if (Math.random() < 0.2) {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      
      await prisma.subscription.create({
        data: {
          userId: user.id,
          type: 'PRO_MONTHLY',
          status: 'active',
          endDate,
        },
      });
    }
  }

  // Create some sample pairings
  console.log('☕ Creating sample pairings...');
  const allUsers = await prisma.user.findMany({ include: { profile: true } });
  
  for (let i = 0; i < 20; i++) {
    const user1 = randomChoice(allUsers);
    let user2;
    do {
      user2 = randomChoice(allUsers);
    } while (user2.id === user1.id);

    const statuses = ['PENDING', 'CONFIRMED', 'DONE', 'EXPIRED'];
    const status = randomChoice(statuses);
    
    const scheduledAt = status !== 'PENDING' ? new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000) : null;
    
    const pairing = await prisma.pairing.create({
      data: {
        user1Id: user1.id,
        user2Id: user2.id,
        status: status as any,
        mode: randomChoice(MODES) as any,
        scheduledAt,
        confirmedAt: status === 'CONFIRMED' || status === 'DONE' ? new Date() : null,
        completedAt: status === 'DONE' ? new Date() : null,
        score1to2: Math.random() * 0.5 + 0.5, // 0.5 - 1.0
        score2to1: Math.random() * 0.5 + 0.5,
        avgScore: Math.random() * 0.5 + 0.5,
      },
    });

    // Add feedback for completed pairings
    if (status === 'DONE' && Math.random() < 0.8) { // 80% feedback rate
      await prisma.pairFeedback.create({
        data: {
          pairingId: pairing.id,
          fromUserId: user1.id,
          toUserId: user2.id,
          rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars mostly
          tags: randomChoices(['professional', 'friendly', 'insightful', 'interesting', 'helpful'], 1, 3),
          comment: 'Great conversation! Looking forward to staying in touch.',
          noShow: Math.random() < 0.05, // 5% no-show rate
        },
      });
    }
  }

  // Create some payment records
  console.log('💰 Creating sample payments...');
  const sampleUsers = allUsers.slice(0, 30);
  
  for (const user of sampleUsers) {
    if (Math.random() < 0.3) { // 30% have made payments
      const productTypes = ['pro_monthly', 'extra_match', 'reroll', 'priority'];
      const productType = randomChoice(productTypes);
      const amounts = { pro_monthly: 770, extra_match: 150, reroll: 60, priority: 120 };
      
      await prisma.payment.create({
        data: {
          userId: user.id,
          telegramChargeId: `charge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          currency: 'XTR',
          totalAmount: amounts[productType as keyof typeof amounts],
          invoicePayload: `${productType}_${Date.now()}`,
          status: 'COMPLETED',
          productType,
          productDescription: `Payment for ${productType.replace('_', ' ')}`,
        },
      });
    }
  }

  console.log('✅ Seed completed successfully!');
  console.log(`Created:`);
  console.log(`- ${CITIES.length} cities`);
  console.log(`- ${INDUSTRIES.length} industries`);
  console.log(`- ${TOPICS.length} topics`);
  console.log(`- 100 users with profiles`);
  console.log(`- ~20 pairings with feedback`);
  console.log(`- Sample payments and subscriptions`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });