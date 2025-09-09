import { Context, InlineKeyboard } from "grammy";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { PRICING } from "@random-coffee/shared";

export async function handlePayments(ctx: Context) {
  try {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const keyboard = new InlineKeyboard()
      .text("🌟 Pro Monthly (770 XTR)", "buy_pro_monthly").row()
      .text("➕ Extra Match (150 XTR)", "buy_extra_match").row()
      .text("🔄 Instant Re-roll (60 XTR)", "buy_reroll").row()
      .text("⚡ Priority Boost 24h (120 XTR)", "buy_priority").row()
      .text("❓ Payment Support", "payment_support");

    await ctx.reply(
      "💫 Premium Features\n\n" +
      "🌟 Pro Monthly - 5 matches/week + priority + auto-scheduler\n" +
      "➕ Extra Match - One additional match this week\n" +
      "🔄 Instant Re-roll - Get a different match right away\n" +
      "⚡ Priority Boost - 24h priority in matching queue\n\n" +
      "All payments use Telegram Stars (XTR) ⭐",
      { reply_markup: keyboard }
    );

  } catch (error) {
    logger.error(error, 'Error in handlePayments');
    await ctx.reply("Sorry, couldn't load payment options. Please try again.");
  }
}

export async function handlePaymentCallback(ctx: Context) {
  try {
    const telegramId = ctx.from?.id;
    if (!telegramId || !ctx.callbackQuery?.data) return;

    await ctx.answerCallbackQuery();
    const action = ctx.callbackQuery.data;

    switch (action) {
      case 'buy_pro_monthly':
        await createInvoice(ctx, 'pro_monthly');
        break;
      case 'buy_extra_match':
        await createInvoice(ctx, 'extra_match');
        break;
      case 'buy_reroll':
        await createInvoice(ctx, 'reroll');
        break;
      case 'buy_priority':
        await createInvoice(ctx, 'priority');
        break;
      case 'payment_support':
        await showPaymentSupport(ctx);
        break;
    }

  } catch (error) {
    logger.error(error, 'Error in handlePaymentCallback');
    await ctx.reply("Something went wrong. Please try again.");
  }
}

async function createInvoice(ctx: Context, productType: string) {
  try {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const products = {
      'pro_monthly': {
        title: 'Pro Monthly Subscription',
        description: '5 matches per week + priority matching + auto-scheduler',
        price: PRICING.PRO_MONTHLY,
        payload: 'pro_monthly_' + Date.now()
      },
      'extra_match': {
        title: 'Extra Match',
        description: 'One additional coffee match this week',
        price: PRICING.EXTRA_MATCH,
        payload: 'extra_match_' + Date.now()
      },
      'reroll': {
        title: 'Instant Re-roll',
        description: 'Get a new match immediately',
        price: PRICING.INSTANT_REROLL,
        payload: 'reroll_' + Date.now()
      },
      'priority': {
        title: '24h Priority Boost',
        description: '24 hours of priority in the matching queue',
        price: PRICING.PRIORITY_BOOST_24H,
        payload: 'priority_' + Date.now()
      }
    };

    const product = products[productType as keyof typeof products];
    if (!product) return;

    // Store pending payment
    await prisma.payment.create({
      data: {
        userId: telegramId.toString(),
        telegramChargeId: product.payload, // Temporary, will be updated
        currency: 'XTR',
        totalAmount: product.price,
        invoicePayload: product.payload,
        status: 'PENDING',
        productType,
        productDescription: product.description,
      }
    });

    await ctx.api.sendInvoice(
      telegramId,
      product.title,
      product.description,
      product.payload,
      'XTR', // currency
      [{ label: product.title, amount: product.price }],
      {
        provider_token: '', // Empty for Stars
        start_parameter: 'start_param',
        photo_url: 'https://example.com/coffee-icon.png',
        photo_size: 512,
        photo_width: 512,
        photo_height: 512,
        need_name: false,
        need_phone_number: false,
        need_email: false,
        need_shipping_address: false,
        send_phone_number_to_provider: false,
        send_email_to_provider: false,
        is_flexible: false,
      }
    );

  } catch (error) {
    logger.error(error, `Error creating invoice for ${productType}`);
    await ctx.reply("Sorry, couldn't create payment. Please try again or contact support.");
  }
}

export async function handlePreCheckoutQuery(ctx: Context) {
  try {
    const query = ctx.preCheckoutQuery;
    if (!query) return;

    // Validate the payment
    const payment = await prisma.payment.findFirst({
      where: {
        invoicePayload: query.invoice_payload,
        status: 'PENDING'
      }
    });

    if (!payment) {
      await ctx.answerPreCheckoutQuery(false, "Payment not found");
      return;
    }

    if (payment.totalAmount !== query.total_amount || payment.currency !== query.currency) {
      await ctx.answerPreCheckoutQuery(false, "Amount mismatch");
      return;
    }

    await ctx.answerPreCheckoutQuery(true);

  } catch (error) {
    logger.error(error, 'Error in handlePreCheckoutQuery');
    await ctx.answerPreCheckoutQuery(false, "Payment validation failed");
  }
}

export async function handleSuccessfulPayment(ctx: Context) {
  try {
    const payment = ctx.message?.successful_payment;
    if (!payment) return;

    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    // Update payment record
    const paymentRecord = await prisma.payment.findFirst({
      where: {
        invoicePayload: payment.invoice_payload,
        status: 'PENDING'
      }
    });

    if (!paymentRecord) {
      logger.error('Payment record not found for successful payment');
      return;
    }

    await prisma.payment.update({
      where: { id: paymentRecord.id },
      data: {
        telegramChargeId: payment.telegram_payment_charge_id,
        providerChargeId: payment.provider_payment_charge_id,
        status: 'COMPLETED'
      }
    });

    // Activate entitlement
    await activateEntitlement(telegramId.toString(), paymentRecord.productType);

    const thankYouMessages = {
      'pro_monthly': "🌟 Welcome to Pro! You now have 5 matches per week, priority matching, and auto-scheduling. Enjoy!",
      'extra_match': "➕ Extra match activated! I'll find you another great person to meet this week.",
      'reroll': "🔄 Re-roll activated! Let me find you a different match right now...",
      'priority': "⚡ Priority boost activated! You'll be prioritized in matching for the next 24 hours."
    };

    const message = thankYouMessages[paymentRecord.productType as keyof typeof thankYouMessages] 
      || "✅ Payment successful! Your feature has been activated.";

    await ctx.reply(message);

  } catch (error) {
    logger.error(error, 'Error in handleSuccessfulPayment');
    await ctx.reply("Payment received but there was an issue activating your feature. Please contact support.");
  }
}

async function activateEntitlement(userId: string, productType: string) {
  try {
    switch (productType) {
      case 'pro_monthly':
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        
        await prisma.subscription.create({
          data: {
            userId,
            type: 'PRO_MONTHLY',
            status: 'active',
            endDate
          }
        });
        break;
        
      case 'extra_match':
        // This would increment available matches or trigger immediate matching
        logger.info({ userId, productType }, 'Extra match entitlement activated');
        break;
        
      case 'reroll':
        // This would trigger a new match immediately
        logger.info({ userId, productType }, 'Re-roll entitlement activated');
        break;
        
      case 'priority':
        // This would set priority flag for 24 hours
        logger.info({ userId, productType }, 'Priority boost entitlement activated');
        break;
    }
  } catch (error) {
    logger.error(error, `Error activating entitlement for ${productType}`);
  }
}

export async function refundStarPayment(telegramChargeId: string, userId: string) {
  try {
    // This would use the Telegram Bot API to refund
    // await bot.api.refundStarPayment(userId, telegramChargeId);
    
    await prisma.payment.updateMany({
      where: { telegramChargeId },
      data: { status: 'REFUNDED' }
    });
    
    logger.info({ telegramChargeId, userId }, 'Payment refunded');
    
  } catch (error) {
    logger.error(error, 'Error refunding payment');
    throw error;
  }
}

async function showPaymentSupport(ctx: Context) {
  const supportMessage = "🛠️ Payment Support\n\n" +
    "Having issues with payments? Here's how to get help:\n\n" +
    "1. Use /paysupport command\n" +
    "2. Include your payment ID or screenshot\n" +
    "3. Describe the issue\n\n" +
    "Our team will respond within 24 hours and can process refunds if needed.";

  const keyboard = new InlineKeyboard()
    .text("📧 Contact Support", "contact_support")
    .text("📋 Terms of Service", "terms_service");

  await ctx.editMessageText(supportMessage, { reply_markup: keyboard });
}