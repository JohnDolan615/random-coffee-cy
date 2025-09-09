# Random Coffee Telegram Bot

A Telegram bot that connects professionals for coffee chats using intelligent matching algorithms and Telegram Stars monetization.

## Features

- 60-second onboarding flow
- AI-powered matching based on profession, interests, and availability
- Telegram Stars (XTR) payments for premium features
- Automated scheduling with timezone support
- Mini-app for profile management
- Admin dashboard for monitoring

## Quick Start

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Start services**
   ```bash
   docker compose up -d
   ```

3. **Set up database**
   ```bash
   pnpm migrate && pnpm seed
   ```

4. **Configure environment**
   - Copy `.env.example` to `.env`
   - Set your `BOT_TOKEN` from @BotFather

5. **Start development**
   ```bash
   pnpm dev
   ```

## Optional: Webhook Setup

To use webhooks instead of long polling:

1. Set webhook URL:
   ```bash
   curl -X POST "https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url":"https://your-domain.com/api/bot"}'
   ```

2. Update bot configuration in `apps/bot/src/index.ts`

## Architecture

- **apps/bot**: Telegram bot using grammY framework
- **apps/next**: Next.js 14 app with mini-app and admin dashboard
- **packages/shared**: Common types and constants
- **PostgreSQL**: Primary database with Prisma ORM
- **Redis + BullMQ**: Job queues for matching and reminders

## Commands

- `/start` - Begin onboarding
- `/profile` - Edit profile settings
- `/match` - Request manual match
- `/pause` - Pause matching
- `/resume` - Resume matching
- `/terms` - View terms of service
- `/paysupport` - Payment support

## Monetization

- **Pro Monthly** (770 XTR): Weekly limit removal, priority matching
- **Extra Match** (150 XTR): Additional match request
- **Instant Re-roll** (60 XTR): Get new match immediately
- **Priority Boost** (120 XTR): 24h matching priority

## Development

Run tests:
```bash
pnpm test
```

Lint code:
```bash
pnpm lint
```

## Support

For payment issues, use `/paysupport` command in the bot or contact support.