import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import type { AvailabilitySlot } from "@random-coffee/shared";

export async function getUserAvailability(userId: string): Promise<AvailabilitySlot[]> {
  try {
    const availability = await prisma.availability.findMany({
      where: { userId },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });

    return availability.map(slot => ({
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      timezone: slot.timezone
    }));

  } catch (error) {
    logger.error(error, 'Error getting user availability');
    return [];
  }
}

export async function addAvailabilitySlot(
  userId: string,
  slot: AvailabilitySlot
): Promise<boolean> {
  try {
    // Validate slot
    if (!isValidTimeSlot(slot)) {
      throw new Error('Invalid time slot');
    }

    // Check for conflicts
    const existingSlots = await getUserAvailability(userId);
    if (hasConflict(slot, existingSlots)) {
      throw new Error('Time slot conflicts with existing availability');
    }

    await prisma.availability.create({
      data: {
        userId,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        timezone: slot.timezone
      }
    });

    logger.info({ userId, slot }, 'Availability slot added');
    return true;

  } catch (error) {
    logger.error(error, 'Error adding availability slot');
    return false;
  }
}

export async function removeAvailabilitySlot(
  userId: string,
  dayOfWeek: number,
  startTime: string
): Promise<boolean> {
  try {
    await prisma.availability.deleteMany({
      where: {
        userId,
        dayOfWeek,
        startTime
      }
    });

    logger.info({ userId, dayOfWeek, startTime }, 'Availability slot removed');
    return true;

  } catch (error) {
    logger.error(error, 'Error removing availability slot');
    return false;
  }
}

export async function clearUserAvailability(userId: string): Promise<boolean> {
  try {
    await prisma.availability.deleteMany({
      where: { userId }
    });

    logger.info({ userId }, 'User availability cleared');
    return true;

  } catch (error) {
    logger.error(error, 'Error clearing user availability');
    return false;
  }
}

export async function updateAvailabilitySlot(
  userId: string,
  oldSlot: { dayOfWeek: number; startTime: string },
  newSlot: AvailabilitySlot
): Promise<boolean> {
  try {
    if (!isValidTimeSlot(newSlot)) {
      throw new Error('Invalid time slot');
    }

    await prisma.availability.updateMany({
      where: {
        userId,
        dayOfWeek: oldSlot.dayOfWeek,
        startTime: oldSlot.startTime
      },
      data: {
        dayOfWeek: newSlot.dayOfWeek,
        startTime: newSlot.startTime,
        endTime: newSlot.endTime,
        timezone: newSlot.timezone
      }
    });

    logger.info({ userId, oldSlot, newSlot }, 'Availability slot updated');
    return true;

  } catch (error) {
    logger.error(error, 'Error updating availability slot');
    return false;
  }
}

export function findOverlappingAvailability(
  availability1: AvailabilitySlot[],
  availability2: AvailabilitySlot[],
  minDurationMinutes: number = 60
): Array<{
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}> {
  const overlaps: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    durationMinutes: number;
  }> = [];

  for (const slot1 of availability1) {
    for (const slot2 of availability2) {
      if (slot1.dayOfWeek !== slot2.dayOfWeek) continue;

      const overlap = calculateTimeOverlap(slot1, slot2);
      if (overlap && overlap.durationMinutes >= minDurationMinutes) {
        overlaps.push({
          dayOfWeek: slot1.dayOfWeek,
          startTime: overlap.startTime,
          endTime: overlap.endTime,
          durationMinutes: overlap.durationMinutes
        });
      }
    }
  }

  return overlaps.sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  });
}

export function suggestMeetingTimes(
  availability1: AvailabilitySlot[],
  availability2: AvailabilitySlot[],
  timezone1: string,
  timezone2: string,
  durationMinutes: number = 60
): Array<{
  date: string;
  startTime: string;
  endTime: string;
  timezone: string;
  localTime1: string;
  localTime2: string;
}> {
  const overlaps = findOverlappingAvailability(availability1, availability2, durationMinutes);
  const suggestions: Array<{
    date: string;
    startTime: string;
    endTime: string;
    timezone: string;
    localTime1: string;
    localTime2: string;
  }> = [];

  // Get dates for next week
  const nextWeek = getNextWeekDates();

  for (const overlap of overlaps.slice(0, 5)) { // Limit to 5 suggestions
    const date = nextWeek[overlap.dayOfWeek];
    if (!date) continue;

    // Convert times to both timezones
    const utcTime = convertToUTC(overlap.startTime, timezone1);
    const localTime1 = convertFromUTC(utcTime, timezone1);
    const localTime2 = convertFromUTC(utcTime, timezone2);

    suggestions.push({
      date: date.toISOString().split('T')[0],
      startTime: overlap.startTime,
      endTime: overlap.endTime,
      timezone: 'UTC',
      localTime1,
      localTime2
    });
  }

  return suggestions;
}

function isValidTimeSlot(slot: AvailabilitySlot): boolean {
  // Validate day of week
  if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6) return false;

  // Validate time format
  if (!isValidTimeFormat(slot.startTime) || !isValidTimeFormat(slot.endTime)) return false;

  // Validate start < end
  const startMinutes = timeToMinutes(slot.startTime);
  const endMinutes = timeToMinutes(slot.endTime);
  if (startMinutes >= endMinutes) return false;

  // Validate minimum duration (15 minutes)
  if (endMinutes - startMinutes < 15) return false;

  return true;
}

function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

function hasConflict(newSlot: AvailabilitySlot, existingSlots: AvailabilitySlot[]): boolean {
  const sameDaySlots = existingSlots.filter(slot => slot.dayOfWeek === newSlot.dayOfWeek);
  
  for (const existingSlot of sameDaySlots) {
    const overlap = calculateTimeOverlap(newSlot, existingSlot);
    if (overlap && overlap.durationMinutes > 0) {
      return true;
    }
  }
  
  return false;
}

function calculateTimeOverlap(
  slot1: AvailabilitySlot,
  slot2: AvailabilitySlot
): { startTime: string; endTime: string; durationMinutes: number } | null {
  const start1 = timeToMinutes(slot1.startTime);
  const end1 = timeToMinutes(slot1.endTime);
  const start2 = timeToMinutes(slot2.startTime);
  const end2 = timeToMinutes(slot2.endTime);

  const overlapStart = Math.max(start1, start2);
  const overlapEnd = Math.min(end1, end2);

  if (overlapStart >= overlapEnd) return null;

  return {
    startTime: minutesToTime(overlapStart),
    endTime: minutesToTime(overlapEnd),
    durationMinutes: overlapEnd - overlapStart
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

function getNextWeekDates(): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  const daysUntilNextMonday = (8 - today.getDay()) % 7 || 7;
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + daysUntilNextMonday + i);
    dates.push(date);
  }
  
  return dates;
}

function convertToUTC(time: string, timezone: string): Date {
  // Simplified timezone conversion - in production use proper timezone library
  const today = new Date();
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
  return date;
}

function convertFromUTC(utcTime: Date, timezone: string): string {
  // Simplified timezone conversion - in production use proper timezone library
  const hours = utcTime.getHours().toString().padStart(2, '0');
  const minutes = utcTime.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}