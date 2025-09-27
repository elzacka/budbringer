/**
 * Timezone utilities for consistent Oslo/Norway timezone handling throughout the app
 */

const OSLO_TIMEZONE = 'Europe/Oslo';
const NORWEGIAN_LOCALE = 'no-NO';

/**
 * Get current date/time in Oslo timezone as ISO string
 */
export function getNowOsloISO(): string {
  const now = new Date();
  // Convert to Oslo timezone and then back to ISO format
  const osloTime = new Date(now.toLocaleString('en-US', { timeZone: OSLO_TIMEZONE }));
  return osloTime.toISOString();
}

/**
 * Get current date in Oslo timezone (YYYY-MM-DD format)
 */
export function getTodayOslo(): string {
  const now = new Date();
  const osloDate = new Date(now.toLocaleString('en-US', { timeZone: OSLO_TIMEZONE }));
  return osloDate.toISOString().split('T')[0];
}

/**
 * Format date for Norwegian locale in Oslo timezone
 */
export function formatNorwegianDate(date: Date = new Date()): string {
  return date.toLocaleDateString(NORWEGIAN_LOCALE, {
    timeZone: OSLO_TIMEZONE,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format date for newsletter header (no year, capitalized weekday)
 */
export function formatNewsletterDate(date: Date = new Date()): string {
  const formatted = date.toLocaleDateString(NORWEGIAN_LOCALE, {
    timeZone: OSLO_TIMEZONE,
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  // Capitalize first letter of weekday
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/**
 * Format date and time for Norwegian locale in Oslo timezone
 */
export function formatNorwegianDateTime(date: Date = new Date()): string {
  return date.toLocaleString(NORWEGIAN_LOCALE, {
    timeZone: OSLO_TIMEZONE,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Format time only for Norwegian locale in Oslo timezone
 */
export function formatNorwegianTime(date: Date = new Date()): string {
  return date.toLocaleString(NORWEGIAN_LOCALE, {
    timeZone: OSLO_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Get Oslo timezone offset string (e.g., "+02:00" or "+01:00")
 */
export function getOsloTimezoneOffset(): string {
  const now = new Date();
  const osloTime = new Date(now.toLocaleString('en-US', { timeZone: OSLO_TIMEZONE }));
  const utcTime = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));

  const diffMs = osloTime.getTime() - utcTime.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  const sign = diffHours >= 0 ? '+' : '-';
  const hours = Math.abs(diffHours).toString().padStart(2, '0');
  const minutes = Math.abs(diffMinutes).toString().padStart(2, '0');

  return `${sign}${hours}:${minutes}`;
}

/**
 * Parse date string and ensure it's interpreted in Oslo timezone
 */
export function parseOsloDate(dateString: string): Date {
  const date = new Date(dateString);
  // If no timezone info, assume it's already in Oslo timezone
  if (!dateString.includes('T') || (!dateString.includes('+') && !dateString.includes('Z'))) {
    // Treat as Oslo time
    return new Date(date.toLocaleString('en-US', { timeZone: OSLO_TIMEZONE }));
  }
  return date;
}

/**
 * Convert any date to Oslo timezone and return as ISO string
 */
export function toOsloISO(date: Date = new Date()): string {
  const osloTime = new Date(date.toLocaleString('en-US', { timeZone: OSLO_TIMEZONE }));
  return osloTime.toISOString();
}

/**
 * Get date X days ago in Oslo timezone
 */
export function getDaysAgoOslo(days: number): Date {
  const now = new Date();
  const osloNow = new Date(now.toLocaleString('en-US', { timeZone: OSLO_TIMEZONE }));
  osloNow.setDate(osloNow.getDate() - days);
  return osloNow;
}