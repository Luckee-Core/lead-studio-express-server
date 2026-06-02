/**
 * Enforce 8 AM - 5 PM EST Email Scheduling Window
 * Adjusts scheduled times to fall within business hours (8 AM - 5 PM EST)
 * 
 * Rules:
 * - If time is before 8 AM EST: schedule for 8 AM EST (same day, or next day if already past 8 AM today)
 * - If time is after 5 PM EST: schedule for 8 AM EST the next day
 * - If time is between 8 AM - 5 PM EST: keep the original time
 */

import { DateTime } from 'luxon';

const EST_TIMEZONE = 'America/New_York';
const START_HOUR = 8; // 8 AM
const END_HOUR = 17; // 5 PM

/**
 * Enforce 8 AM - 5 PM EST time window
 * @param date - The date to enforce the window on (can be in any timezone, will be converted to EST)
 * @returns A Date object in UTC representing the adjusted time within the window
 */
export const enforceTimeWindow = (date: Date): Date => {
  // Convert the input date to EST timezone
  const estDateTime = DateTime.fromJSDate(date).setZone(EST_TIMEZONE);
  
  // Get the current time in EST for comparison
  const nowEST = DateTime.now().setZone(EST_TIMEZONE);
  
  // If before 8 AM EST
  if (estDateTime.hour < START_HOUR) {
    // Check if current time is already past 8 AM today
    const isSameDay = estDateTime.year === nowEST.year && 
                      estDateTime.month === nowEST.month && 
                      estDateTime.day === nowEST.day;
    
    if (isSameDay && nowEST.hour >= START_HOUR) {
      // Already past 8 AM today, schedule for 8 AM tomorrow
      const tomorrowEST = estDateTime.plus({ days: 1 }).set({ hour: START_HOUR, minute: 0, second: 0, millisecond: 0 });
      return tomorrowEST.toJSDate();
    } else {
      // Schedule for 8 AM EST same day
      const sameDay8AM = estDateTime.set({ hour: START_HOUR, minute: 0, second: 0, millisecond: 0 });
      return sameDay8AM.toJSDate();
    }
  }
  
  // If at or after 5 PM EST (17:00)
  if (estDateTime.hour >= END_HOUR) {
    // Schedule for 8 AM EST next day
    const nextDay8AM = estDateTime.plus({ days: 1 }).set({ hour: START_HOUR, minute: 0, second: 0, millisecond: 0 });
    return nextDay8AM.toJSDate();
  }
  
  // Between 8 AM - 5 PM EST, return original time (converted to UTC for database storage)
  return estDateTime.toJSDate();
};

/**
 * Check if the current time is within business hours (8 AM - 5 PM EST)
 * @returns true if current time is between 8 AM and 5 PM EST, false otherwise
 */
export const isWithinBusinessHours = (): boolean => {
  const nowEST = DateTime.now().setZone(EST_TIMEZONE);
  return nowEST.hour >= START_HOUR && nowEST.hour < END_HOUR;
};
