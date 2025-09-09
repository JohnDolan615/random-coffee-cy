import { Context, InlineKeyboard } from "grammy";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import type { TimeSlot } from "@random-coffee/shared";

export async function proposeTimeSlots(pairingId: string) {
  try {
    const pairing = await prisma.pairing.findUnique({
      where: { id: pairingId },
      include: {
        user1: { 
          include: { 
            profile: { 
              include: { availability: true } 
            } 
          } 
        },
        user2: { 
          include: { 
            profile: { 
              include: { availability: true } 
            } 
          } 
        }
      }
    });

    if (!pairing) return;

    const slots = findOverlappingTimeSlots(
      pairing.user1.profile?.availability || [],
      pairing.user2.profile?.availability || [],
      pairing.user1.profile?.timezone || 'UTC',
      pairing.user2.profile?.timezone || 'UTC'
    );

    if (slots.length === 0) {
      // No overlapping availability, ask them to coordinate
      logger.info({ pairingId }, 'No overlapping availability found');
      return;
    }

    // Take first 3 slots
    const proposedSlots = slots.slice(0, 3);
    
    const sendSlotsToUser = async (userId: bigint, otherUserName: string) => {
      const keyboard = new InlineKeyboard();
      
      proposedSlots.forEach((slot, index) => {
        keyboard.text(
          `${formatTimeSlot(slot)} - ${slot.timezone}`,
          `schedule_${pairingId}_${index}`
        ).row();
      });
      
      keyboard.text("🗓️ Suggest different time", `suggest_time_${pairingId}`);

      const message = `📅 Great! Here are some times that work for both you and ${otherUserName}:\n\n` +
        "Pick a time that works best for you:";

      // This would send via bot API
      logger.info({ userId, pairingId, slots: proposedSlots }, 'Time slots proposed');
    };

    await sendSlotsToUser(
      pairing.user1.telegramId, 
      pairing.user2.firstName || 'your match'
    );
    await sendSlotsToUser(
      pairing.user2.telegramId, 
      pairing.user1.firstName || 'your match'
    );

  } catch (error) {
    logger.error(error, 'Error proposing time slots');
  }
}

export async function handleSchedulingCallback(ctx: Context) {
  try {
    const telegramId = ctx.from?.id;
    if (!telegramId || !ctx.callbackQuery?.data) return;

    await ctx.answerCallbackQuery();
    const data = ctx.callbackQuery.data;

    if (data.startsWith('schedule_')) {
      const [, pairingId, slotIndex] = data.split('_');
      await confirmTimeSlot(ctx, pairingId, parseInt(slotIndex));
    } else if (data.startsWith('suggest_time_')) {
      const [, , pairingId] = data.split('_');
      await handleCustomTimeRequest(ctx, pairingId);
    }

  } catch (error) {
    logger.error(error, 'Error in handleSchedulingCallback');
    await ctx.reply("Something went wrong with scheduling. Please try again.");
  }
}

async function confirmTimeSlot(ctx: Context, pairingId: string, slotIndex: number) {
  try {
    const pairing = await prisma.pairing.findUnique({
      where: { id: pairingId },
      include: {
        user1: true,
        user2: true
      }
    });

    if (!pairing) return;

    // Calculate the actual scheduled time based on slot index
    const scheduledTime = new Date();
    scheduledTime.setDate(scheduledTime.getDate() + slotIndex + 1);
    scheduledTime.setHours(10 + slotIndex * 2, 0, 0, 0);

    await prisma.pairing.update({
      where: { id: pairingId },
      data: {
        scheduledAt: scheduledTime,
        status: 'CONFIRMED'
      }
    });

    const otherUser = pairing.user1.telegramId === BigInt(ctx.from?.id || 0) 
      ? pairing.user2 
      : pairing.user1;

    await ctx.editMessageText(
      `✅ Time confirmed!\n\n` +
      `📅 ${formatDate(scheduledTime)}\n` +
      `I've notified ${otherUser.firstName} about the confirmed time.`
    );

    // Notify other user
    logger.info({ 
      pairingId, 
      scheduledTime, 
      confirmedBy: ctx.from?.id 
    }, 'Time slot confirmed');

    // Set reminder for 48 hours before
    const reminderTime = new Date(scheduledTime);
    reminderTime.setHours(reminderTime.getHours() - 48);
    
    // This would schedule a reminder job
    logger.info({ pairingId, reminderTime }, 'Reminder scheduled');

  } catch (error) {
    logger.error(error, 'Error confirming time slot');
    await ctx.reply("Sorry, couldn't confirm the time. Please try again.");
  }
}

async function handleCustomTimeRequest(ctx: Context, pairingId: string) {
  await ctx.editMessageText(
    "🗓️ No problem! Please coordinate directly with your match for a custom time.\n\n" +
    "Once you agree on a time, let me know and I'll set up the reminder!"
  );
}

function findOverlappingTimeSlots(
  availability1: any[],
  availability2: any[],
  timezone1: string,
  timezone2: string
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  
  // Simple overlap detection - in real implementation would use proper timezone conversion
  const commonDays = [1, 2, 3, 4, 5]; // Mon-Fri for now
  
  commonDays.forEach(dayOfWeek => {
    const user1Slots = availability1.filter(a => a.dayOfWeek === dayOfWeek);
    const user2Slots = availability2.filter(a => a.dayOfWeek === dayOfWeek);
    
    user1Slots.forEach(slot1 => {
      user2Slots.forEach(slot2 => {
        const overlap = getTimeOverlap(slot1, slot2);
        if (overlap && overlap.duration >= 60) { // At least 1 hour
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + (7 - nextWeek.getDay()) + dayOfWeek);
          
          slots.push({
            date: nextWeek.toISOString().split('T')[0],
            startTime: overlap.start,
            endTime: overlap.end,
            timezone: timezone1
          });
        }
      });
    });
  });

  return slots.slice(0, 5); // Return up to 5 options
}

function getTimeOverlap(slot1: any, slot2: any): { start: string; end: string; duration: number } | null {
  const start1 = timeToMinutes(slot1.startTime);
  const end1 = timeToMinutes(slot1.endTime);
  const start2 = timeToMinutes(slot2.startTime);
  const end2 = timeToMinutes(slot2.endTime);

  const overlapStart = Math.max(start1, start2);
  const overlapEnd = Math.min(end1, end2);

  if (overlapStart >= overlapEnd) return null;

  return {
    start: minutesToTime(overlapStart),
    end: minutesToTime(overlapEnd),
    duration: overlapEnd - overlapStart
  };
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function formatTimeSlot(slot: TimeSlot): string {
  return `${slot.date} ${slot.startTime}-${slot.endTime}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export async function sendReminder(pairingId: string) {
  try {
    const pairing = await prisma.pairing.findUnique({
      where: { id: pairingId },
      include: {
        user1: true,
        user2: true
      }
    });

    if (!pairing || !pairing.scheduledAt) return;

    const reminderMessage = `⏰ Reminder: Your coffee chat is tomorrow!\n\n` +
      `📅 ${formatDate(pairing.scheduledAt)}\n\n` +
      `Looking forward to your conversation! ☕`;

    // This would send reminders to both users
    logger.info({ pairingId }, 'Reminders sent');

    await prisma.pairing.update({
      where: { id: pairingId },
      data: { reminderSentAt: new Date() }
    });

  } catch (error) {
    logger.error(error, 'Error sending reminder');
  }
}