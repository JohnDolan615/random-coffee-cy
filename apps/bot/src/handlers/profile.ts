import { Context, InlineKeyboard } from "grammy";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";

export async function handleProfile(ctx: Context) {
  try {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
      include: {
        profile: {
          include: {
            topics: { include: { topic: true } },
            industries: { include: { industry: true } },
            city: true
          }
        }
      }
    });

    if (!user?.profile) {
      await ctx.reply("You need to complete onboarding first. Use /start to get started!");
      return;
    }

    const profile = user.profile;
    const topics = profile.topics.map(ut => ut.topic.name).join(", ");
    const industries = profile.industries.map(ui => ui.industry.name).join(", ");
    
    let profileText = "👤 Your Profile:\n\n";
    profileText += `🔹 Profession: ${profile.profession || "Not set"}\n`;
    profileText += `🔹 Company: ${profile.company || "Not specified"}\n`;
    profileText += `🔹 Industries: ${industries || "Not set"}\n`;
    profileText += `🔹 Topics: ${topics || "Not set"}\n`;
    profileText += `🔹 About: ${profile.about || "Not set"}\n`;
    profileText += `🔹 Goals: ${[profile.goal1, profile.goal2].filter(Boolean).join(", ") || "Not set"}\n`;
    profileText += `🔹 Mode: ${profile.mode}\n`;
    if (profile.city) {
      profileText += `🔹 Location: ${profile.city.name}, ${profile.city.country}\n`;
      profileText += `🔹 Radius: ${profile.radiusKm}km\n`;
    }
    profileText += `🔹 Timezone: ${profile.timezone}\n`;
    profileText += `🔹 Status: ${profile.isPaused ? "⏸️ Paused" : "✅ Active"}\n`;

    const keyboard = new InlineKeyboard()
      .text("✏️ Edit Profession", "edit_profession").row()
      .text("✏️ Edit Industries", "edit_industries").row()
      .text("✏️ Edit Topics", "edit_topics").row()
      .text("✏️ Edit About", "edit_about").row()
      .text("✏️ Edit Goals", "edit_goals").row()
      .text("✏️ Change Mode", "edit_mode").row()
      .text(profile.isPaused ? "▶️ Resume matching" : "⏸️ Pause matching", "toggle_pause").row()
      .text("🕐 Manage availability", "manage_availability");

    await ctx.reply(profileText, { reply_markup: keyboard });

  } catch (error) {
    logger.error(error, 'Error in handleProfile');
    await ctx.reply("Sorry, couldn't load your profile. Please try again.");
  }
}

export async function handleProfileCallback(ctx: Context) {
  try {
    const telegramId = ctx.from?.id;
    if (!telegramId || !ctx.callbackQuery?.data) return;

    await ctx.answerCallbackQuery();
    const action = ctx.callbackQuery.data;

    switch (action) {
      case 'toggle_pause':
        await togglePause(ctx);
        break;
      case 'manage_availability':
        await showAvailabilityManagement(ctx);
        break;
      case 'edit_profession':
        await ctx.editMessageText("Send me your new profession:");
        break;
      case 'edit_about':
        await ctx.editMessageText("Send me your new 120-character intro:");
        break;
      default:
        await ctx.editMessageText("Feature coming soon! Use /profile to go back.");
        break;
    }

  } catch (error) {
    logger.error(error, 'Error in handleProfileCallback');
    await ctx.reply("Something went wrong. Please try again.");
  }
}

async function togglePause(ctx: Context) {
  try {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const profile = await prisma.profile.findFirst({
      where: { user: { telegramId: BigInt(telegramId) } }
    });

    if (!profile) {
      await ctx.editMessageText("Profile not found. Please complete onboarding with /start");
      return;
    }

    const newPausedState = !profile.isPaused;
    
    await prisma.profile.update({
      where: { id: profile.id },
      data: { isPaused: newPausedState }
    });

    const message = newPausedState 
      ? "⏸️ Matching paused. You won't be included in new matches until you resume."
      : "▶️ Matching resumed! You're back in the pool for coffee connections.";

    const keyboard = new InlineKeyboard()
      .text("👤 View profile", "back_to_profile");

    await ctx.editMessageText(message, { reply_markup: keyboard });

  } catch (error) {
    logger.error(error, 'Error toggling pause state');
    await ctx.reply("Sorry, couldn't update your status. Please try again.");
  }
}

async function showAvailabilityManagement(ctx: Context) {
  try {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
      include: {
        profile: {
          include: { availability: true }
        }
      }
    });

    if (!user?.profile) return;

    let availabilityText = "🕐 Your Availability:\n\n";
    
    if (user.profile.availability.length === 0) {
      availabilityText += "No availability set. Add some time slots so people know when you're free!\n\n";
    } else {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      user.profile.availability.forEach(slot => {
        availabilityText += `${days[slot.dayOfWeek]}: ${slot.startTime} - ${slot.endTime}\n`;
      });
    }

    const keyboard = new InlineKeyboard()
      .text("➕ Add time slot", "add_availability").row()
      .text("🗑️ Clear all", "clear_availability").row()
      .text("⬅️ Back to profile", "back_to_profile");

    await ctx.editMessageText(availabilityText, { reply_markup: keyboard });

  } catch (error) {
    logger.error(error, 'Error showing availability');
    await ctx.reply("Sorry, couldn't load availability. Please try again.");
  }
}

export async function handlePause(ctx: Context) {
  try {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    await prisma.profile.updateMany({
      where: { user: { telegramId: BigInt(telegramId) } },
      data: { isPaused: true }
    });

    await ctx.reply("⏸️ Matching paused. Use /resume when you're ready to meet new people again!");

  } catch (error) {
    logger.error(error, 'Error in handlePause');
    await ctx.reply("Sorry, couldn't pause matching. Please try again.");
  }
}

export async function handleResume(ctx: Context) {
  try {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    await prisma.profile.updateMany({
      where: { user: { telegramId: BigInt(telegramId) } },
      data: { isPaused: false }
    });

    await ctx.reply("▶️ Welcome back! You're now active for coffee matches.");

  } catch (error) {
    logger.error(error, 'Error in handleResume');
    await ctx.reply("Sorry, couldn't resume matching. Please try again.");
  }
}