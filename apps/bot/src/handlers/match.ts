import { Context, InlineKeyboard } from "grammy";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { MAX_WEEKLY_MATCHES_FREE, MAX_WEEKLY_MATCHES_PRO } from "@random-coffee/shared";

export async function handleMatch(ctx: Context) {
  try {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
      include: {
        profile: true,
        subscriptions: {
          where: { status: 'active' }
        }
      }
    });

    if (!user?.profile) {
      await ctx.reply("You need to complete onboarding first. Use /start to get started!");
      return;
    }

    if (user.profile.isPaused) {
      await ctx.reply("Your matching is paused. Use /resume to activate matching again.");
      return;
    }

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const thisWeekMatches = await prisma.pairing.count({
      where: {
        OR: [
          { user1Id: user.id },
          { user2Id: user.id }
        ],
        createdAt: {
          gte: weekStart,
          lte: weekEnd
        }
      }
    });

    const hasPro = user.subscriptions.some(sub => sub.type === 'PRO_MONTHLY');
    const maxMatches = hasPro ? MAX_WEEKLY_MATCHES_PRO : MAX_WEEKLY_MATCHES_FREE;

    if (thisWeekMatches >= maxMatches) {
      const keyboard = new InlineKeyboard()
        .text("🌟 Upgrade to Pro", "upgrade_pro").row()
        .text("☕ Buy Extra Match", "buy_extra_match");

      await ctx.reply(
        `You've reached your weekly limit of ${maxMatches} matches.\n\n` +
        "Upgrade to Pro for ${MAX_WEEKLY_MATCHES_PRO} matches per week, or buy an extra match!",
        { reply_markup: keyboard }
      );
      return;
    }

    // Enqueue manual match request
    await ctx.reply(
      "🔍 Looking for someone great for you to meet...\n\n" +
      "I'll search our community and get back to you within a few hours with a potential match!"
    );

    // This would trigger the matching algorithm
    logger.info({ userId: user.id }, 'Manual match requested');

  } catch (error) {
    logger.error(error, 'Error in handleMatch');
    await ctx.reply("Sorry, something went wrong. Please try again.");
  }
}

export async function handlePairingResponse(ctx: Context, pairingId: string, action: 'accept' | 'decline') {
  try {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const pairing = await prisma.pairing.findUnique({
      where: { id: pairingId },
      include: {
        user1: { include: { profile: true } },
        user2: { include: { profile: true } }
      }
    });

    if (!pairing) {
      await ctx.answerCallbackQuery("This pairing is no longer available.");
      return;
    }

    const currentUserId = ctx.from?.id.toString();
    const isUser1 = pairing.user1Id === currentUserId;
    const otherUser = isUser1 ? pairing.user2 : pairing.user1;

    if (action === 'accept') {
      await prisma.pairing.update({
        where: { id: pairingId },
        data: { status: 'CONFIRMED', confirmedAt: new Date() }
      });

      // Create group chat
      const groupChat = await ctx.api.createGroup(`Coffee Chat: ${pairing.user1.firstName} & ${pairing.user2.firstName}`);
      
      await prisma.pairing.update({
        where: { id: pairingId },
        data: { groupChatId: BigInt(groupChat.id) }
      });

      // Add both users to group
      await ctx.api.addChatMember(groupChat.id, Number(pairing.user1.telegramId));
      await ctx.api.addChatMember(groupChat.id, Number(pairing.user2.telegramId));

      // Send intro message to group
      const introMessage = `☕ Welcome to your coffee chat!\n\n` +
        `${pairing.user1.firstName}: ${pairing.user1.profile?.about}\n` +
        `${pairing.user2.firstName}: ${pairing.user2.profile?.about}\n\n` +
        `You both share interests in similar topics. Enjoy your conversation!`;

      await ctx.api.sendMessage(groupChat.id, introMessage);

      await ctx.editMessageText("✅ Match accepted! I've created a group chat for you both. Enjoy your coffee! ☕");

    } else {
      await prisma.pairing.update({
        where: { id: pairingId },
        data: { status: 'EXPIRED', expiredAt: new Date() }
      });

      await ctx.editMessageText("❌ Match declined. No problem - I'll find someone else for both of you!");

      // Notify the other user
      await ctx.api.sendMessage(
        Number(otherUser.telegramId),
        "Your proposed coffee match wasn't accepted, but don't worry - I'm finding you someone else!"
      );
    }

    await ctx.answerCallbackQuery();

  } catch (error) {
    logger.error(error, 'Error handling pairing response');
    await ctx.answerCallbackQuery("Something went wrong. Please try again.");
  }
}

export async function sendMatchProposal(user1Id: string, user2Id: string, pairingId: string) {
  try {
    const pairing = await prisma.pairing.findUnique({
      where: { id: pairingId },
      include: {
        user1: { include: { profile: true } },
        user2: { include: { profile: true } }
      }
    });

    if (!pairing) return;

    const sendProposalToUser = async (toUser: any, aboutUser: any) => {
      const keyboard = new InlineKeyboard()
        .text("☕ Accept", `accept_${pairingId}`)
        .text("❌ Decline", `decline_${pairingId}`);

      const message = `☕ I found someone great for you to meet!\n\n` +
        `👤 ${aboutUser.firstName}\n` +
        `🔹 ${aboutUser.profile?.profession}\n` +
        `🔹 ${aboutUser.profile?.about}\n\n` +
        `You both share similar interests. Would you like to connect?`;

      await prisma.user.findUnique({ where: { id: toUser.id } }).then(async (user) => {
        if (user) {
          // This would use the bot API to send message
          // await bot.api.sendMessage(Number(user.telegramId), message, { reply_markup: keyboard });
        }
      });
    };

    await sendProposalToUser(pairing.user1, pairing.user2);
    await sendProposalToUser(pairing.user2, pairing.user1);

  } catch (error) {
    logger.error(error, 'Error sending match proposal');
  }
}