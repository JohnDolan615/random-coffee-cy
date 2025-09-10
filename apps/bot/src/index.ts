import { Bot, GrammyError, HttpError } from "grammy";
import { logger } from "./lib/logger.js";
import { setupDailyMatchingCron, shutdown } from "./queue/bull.js";
import { dailyMatchWorker } from "./queue/jobs/dailyMatch.js";

// Import handlers
import { 
  handleStart, 
  handleOnboardingCallback, 
  handleTextMessage 
} from "./handlers/onboarding.js";
import { 
  handleProfile, 
  handleProfileCallback, 
  handlePause, 
  handleResume 
} from "./handlers/profile.js";
import { 
  handleMatch, 
  handlePairingResponse 
} from "./handlers/match.js";
import { 
  handlePayments, 
  handlePaymentCallback,
  handlePreCheckoutQuery,
  handleSuccessfulPayment
} from "./handlers/payments.js";
import { handleSchedulingCallback } from "./handlers/scheduling.js";

// Initialize bot
const token = process.env.BOT_TOKEN;
if (!token) {
  logger.error('BOT_TOKEN is required');
  process.exit(1);
}

const bot = new Bot(token);

// Error handling
bot.catch((err) => {
  const ctx = err.ctx;
  logger.error({ 
    error: err.error instanceof Error ? err.error.message : 'Unknown error',
    updateId: ctx.update.update_id 
  }, `Error while handling update ${ctx.update.update_id}`);
  
  const e = err.error;
  if (e instanceof GrammyError) {
    logger.error(e.description, "Error in request");
  } else if (e instanceof HttpError) {
    logger.error("Could not contact Telegram", e);
  } else {
    logger.error("Unknown error", e);
  }
});

// Commands
bot.command("start", handleStart);
bot.command("profile", handleProfile);
bot.command("match", handleMatch);
bot.command("pause", handlePause);
bot.command("resume", handleResume);
bot.command("payments", handlePayments);

bot.command("terms", async (ctx) => {
  const termsText = `📋 Terms of Service

Random Coffee Bot Terms:

1. **Service**: We connect professionals for coffee chats
2. **Payments**: All payments via Telegram Stars (XTR)
3. **Refunds**: Available within 7 days for unused services
4. **Privacy**: We protect your data per our Privacy Policy
5. **Matching**: Algorithm-based, no guarantee of matches
6. **Conduct**: Be respectful in all interactions

For support: /paysupport

Last updated: ${new Date().toLocaleDateString()}`;

  await ctx.reply(termsText);
});

bot.command("paysupport", async (ctx) => {
  const supportText = `🛠️ Payment Support

Having payment issues? Please provide:

1. Screenshot of the payment
2. Telegram payment charge ID
3. Description of the issue

Our team responds within 24 hours and can process refunds if needed.

Contact: @RandomCoffeeSupport`;

  await ctx.reply(supportText);
});

// Callback query handlers
bot.callbackQuery(/^(profession|industry|topic|goal|mode)/, handleOnboardingCallback);
bot.callbackQuery(/^(edit_|toggle_|manage_|back_to_)/, handleProfileCallback);
bot.callbackQuery(/^(buy_|payment_|upgrade_|contact_|terms_)/, handlePaymentCallback);
bot.callbackQuery(/^(accept_|decline_)/, async (ctx) => {
  const data = ctx.callbackQuery?.data;
  if (!data) return;
  
  const [action, pairingId] = data.split('_');
  await handlePairingResponse(ctx, pairingId, action as 'accept' | 'decline');
});
bot.callbackQuery(/^(schedule_|suggest_time_)/, handleSchedulingCallback);

// Text messages (for onboarding)
bot.on("message:text", handleTextMessage);

// Payment handlers
bot.on("pre_checkout_query", handlePreCheckoutQuery);
bot.on("message:successful_payment", handleSuccessfulPayment);

// Start bot
async function startBot() {
  try {
    logger.info('Starting Random Coffee Bot...');

    // Setup queues and cron jobs
    await setupDailyMatchingCron();
    logger.info('Queue system initialized');

    // Start bot with long polling (default)
    await bot.start({
      onStart: (botInfo) => {
        logger.info({
          username: botInfo.username,
          id: botInfo.id
        }, 'Bot started successfully');
      }
    });

  } catch (error) {
    logger.error(error, 'Failed to start bot');
    process.exit(1);
  }
}

// Graceful shutdown
async function gracefulShutdown() {
  logger.info('Shutting down bot...');
  
  try {
    await bot.stop();
    if (dailyMatchWorker) await dailyMatchWorker.close();
    await shutdown();
    logger.info('Bot shut down gracefully');
    process.exit(0);
  } catch (error) {
    logger.error(error, 'Error during shutdown');
    process.exit(1);
  }
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error(error, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled rejection');
  process.exit(1);
});

// Start the bot
if (process.env.NODE_ENV !== 'test') {
  startBot();
}

export { bot };

// Alternative webhook setup (commented out, can be enabled)
/*
import express from 'express';

const app = express();
app.use(express.json());

// Webhook endpoint
app.post(`/webhook/${token}`, (req, res) => {
  bot.handleUpdate(req.body);
  res.sendStatus(200);
});

// Set webhook
async function setWebhook() {
  const webhookUrl = `${process.env.APP_URL}/webhook/${token}`;
  await bot.api.setWebhook(webhookUrl);
  logger.info({ webhookUrl }, 'Webhook set');
}

// Start with webhook instead of long polling
if (process.env.USE_WEBHOOK === 'true') {
  const port = process.env.PORT || 3001;
  app.listen(port, async () => {
    await setWebhook();
    logger.info({ port }, 'Webhook server started');
  });
}
*/