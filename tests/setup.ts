import { vi } from 'vitest';

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_coffee';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.BOT_TOKEN = 'test_bot_token';
process.env.APP_URL = 'http://localhost:3000';
process.env.NODE_ENV = 'test';

// Mock Prisma globally
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    profile: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    pairing: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    payment: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      aggregate: vi.fn(),
    },
    subscription: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $queryRaw: vi.fn(),
    $disconnect: vi.fn(),
  })),
}));

// Mock Redis/IORedis
vi.mock('ioredis', () => ({
  default: vi.fn(() => ({
    quit: vi.fn(),
    ping: vi.fn(),
  })),
}));

// Mock BullMQ
vi.mock('bullmq', () => ({
  Queue: vi.fn(() => ({
    add: vi.fn(),
    close: vi.fn(),
    obliterate: vi.fn(),
    getWaiting: vi.fn(() => []),
    getActive: vi.fn(() => []),
    getCompleted: vi.fn(() => []),
    getFailed: vi.fn(() => []),
  })),
  Worker: vi.fn(() => ({
    close: vi.fn(),
    on: vi.fn(),
  })),
  QueueScheduler: vi.fn(() => ({
    close: vi.fn(),
  })),
}));

// Mock grammY
vi.mock('grammy', () => ({
  Bot: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    command: vi.fn(),
    callbackQuery: vi.fn(),
    on: vi.fn(),
    catch: vi.fn(),
    api: {
      sendMessage: vi.fn(),
      sendInvoice: vi.fn(),
      createGroup: vi.fn(),
      addChatMember: vi.fn(),
    },
  })),
  InlineKeyboard: vi.fn(() => ({
    text: vi.fn().mockReturnThis(),
    row: vi.fn().mockReturnThis(),
  })),
  webhookCallback: vi.fn(),
}));

// Mock pino logger
vi.mock('pino', () => ({
  default: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}));