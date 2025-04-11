/**
 * Date utility functions for the what-i-did application
 */
import { format, parseISO, sub, startOfDay, endOfDay } from 'date-fns';
import { ValidationError } from './errors.js';
import config from './config.js';

/**
 * Get date range for current day (from 12am to 11:59pm)
 * @returns {Object} Object containing startDate and endDate
 */
export function getDayRange() {
  const today = new Date();
  const startDate = startOfDay(today);
  const endDate = endOfDay(today);
  return { startDate, endDate };
}

/**
 * Get date range for current work week (Monday 8am to Friday 5pm)
 * @returns {Object} Object containing startDate and endDate
 */
export function getWeekRange() {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  // Calculate the most recent Monday
  let monday = new Date(now);
  const daysFromMonday = (currentDay === 0) ? 6 : currentDay - 1; // Handle Sunday special case
  monday.setDate(now.getDate() - daysFromMonday);
  
  // Set to Monday 8am
  monday.setHours(8, 0, 0, 0);
  
  // Calculate the upcoming Friday or current Friday if today is Friday
  let friday = new Date(monday);
  friday.setDate(monday.getDate() + 4); // Monday + 4 days = Friday
  
  // Set to Friday 5pm
  friday.setHours(17, 0, 0, 0);
  
  // If current time is past Friday 5pm, use current time as end date
  if (now > friday) {
    friday = now;
  }
  
  return { startDate: monday, endDate: friday };
}

/**
 * Get date range for current month (all weekdays since the 1st)
 * @returns {Object} Object containing startDate and endDate
 */
export function getMonthRange() {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  return { startDate: firstDayOfMonth, endDate: now };
}

/**
 * Get date range for year to date (Jan 1 to today)
 * @returns {Object} Object containing startDate and endDate
 */
export function getYearToDateRange() {
  const now = new Date();
  const firstDayOfYear = new Date(now.getFullYear(), 0, 1); // January 1st of current year
  
  return { startDate: firstDayOfYear, endDate: now };
}

/**
 * Get date range for a specific number of days in the past
 * @param {number} days - Number of days to look back
 * @returns {Object} Object containing startDate and endDate
 */
export function getDaysRange(days) {
  const now = new Date();
  const daysAgo = sub(now, { days: parseInt(days) - 1 }); // -1 because we want to include today
  
  return { startDate: startOfDay(daysAgo), endDate: endOfDay(now) };
}

/**
 * Calculate date range based on command line options
 * @param {Object} options - Command line options
 * @returns {Object} Object containing startDate and endDate
 */
export function calculateDateRange(options) {
  // If specific dates are provided, use them
  if (options.startDate && options.endDate) {
    return {
      startDate: startOfDay(parseISO(options.startDate)),
      endDate: endOfDay(parseISO(options.endDate))
    };
  }
  
  // Quick options
  if (options.day) {
    return getDayRange();
  }
  
  if (options.week) {
    return getWeekRange();
  }
  
  if (options.month) {
    return getMonthRange();
  }
  
  if (options.yearToDate) {
    return getYearToDateRange();
  }
  
  if (options.days) {
    const days = parseInt(options.days);
    if (isNaN(days) || days <= 0) {
      throw new ValidationError(config.errors.invalidDaysOption);
    }
    return getDaysRange(days);
  }
  
  // Default: last 7 days
  const endDate = endOfDay(new Date());
  const startDate = startOfDay(sub(endDate, { days: 7 }));
  return { startDate, endDate };
}

/**
 * Determine the period type based on command line options
 * @param {Object} options - Command line options
 * @returns {string} Period type (day, week, month, year-to-date, days, or custom)
 */
export function determinePeriodType(options) {
  if (options.day) return 'day';
  if (options.week) return 'week';
  if (options.month) return 'month';
  if (options.yearToDate) return 'year-to-date';
  if (options.days) return `last-${options.days}-days`;
  return 'custom';
}

/**
 * Format a date range for display
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {string} Formatted date range
 */
export function formatDateRange(startDate, endDate) {
  return `${format(startDate, config.report.dateFormat)} to ${format(endDate, config.report.dateFormat)}`;
}

/**
 * Format a date for display in reports
 * @param {Date} date - Date to format
 * @returns {string} Formatted date
 */
export function formatReportDate(date) {
  return format(date, config.report.dateFormat);
}

/**
 * Format a day for display in reports
 * @param {Date} date - Date to format
 * @returns {string} Formatted day
 */
export function formatDay(date) {
  return format(date, config.report.dayFormat);
}
