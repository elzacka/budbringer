import { formatNewsletterDate } from '../lib/timezone';

console.log('🗓️ Testing date formatting:');
console.log('formatNewsletterDate():', formatNewsletterDate());

// Test with specific date
const testDate = new Date('2024-09-27'); // Friday
console.log('formatNewsletterDate(friday):', formatNewsletterDate(testDate));

// Test capitalization directly
const NORWEGIAN_LOCALE = 'no-NO';
const OSLO_TIMEZONE = 'Europe/Oslo';

const formatted = testDate.toLocaleDateString(NORWEGIAN_LOCALE, {
  timeZone: OSLO_TIMEZONE,
  weekday: 'long',
  month: 'long',
  day: 'numeric'
});

console.log('Raw formatted:', formatted);
console.log('First char:', formatted.charAt(0));
console.log('Capitalized:', formatted.charAt(0).toUpperCase() + formatted.slice(1));