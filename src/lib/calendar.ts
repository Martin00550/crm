/**
 * Calendar Integration Utilities
 * For Google Calendar and Outlook integration
 */

export interface CalendarEvent {
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  attendees?: string[];
}

/**
 * Generate Google Calendar event URL
 */
export function getGoogleCalendarUrl(event: CalendarEvent): string {
  const baseUrl = 'https://calendar.google.com/calendar/render';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatDateForGoogle(event.start)}/${formatDateForGoogle(event.end)}`,
    details: event.description || '',
    location: event.location || '',
  });

  if (event.attendees) {
    params.append('add', event.attendees.join(','));
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generate Outlook Calendar event URL
 */
export function getOutlookCalendarUrl(event: CalendarEvent): string {
  const baseUrl = 'https://outlook.live.com/calendar/0/deepLink';
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    startdt: formatDateForOutlook(event.start),
    enddt: formatDateForOutlook(event.end),
    subject: event.title,
    body: event.description || '',
    location: event.location || '',
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Format date for Google Calendar (YYYYMMDDTHHMMSSZ)
 */
function formatDateForGoogle(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Format date for Outlook (ISO string)
 */
function formatDateForOutlook(date: Date): string {
  return date.toISOString();
}

/**
 * Create policy renewal reminder event
 */
export function createRenewalReminderEvent(
  policyNumber: string,
  carrier: string,
  expirationDate: Date,
  reminderDays: number = 30
): CalendarEvent {
  const reminderDate = new Date(expirationDate);
  reminderDate.setDate(reminderDate.getDate() - reminderDays);

  return {
    title: `Policy Renewal: ${policyNumber}`,
    description: `Policy renewal reminder for ${policyNumber} with ${carrier}. Expiration date: ${expirationDate.toLocaleDateString()}`,
    start: reminderDate,
    end: new Date(reminderDate.getTime() + 60 * 60 * 1000), // 1 hour
    location: '',
  };
}

/**
 * Create meeting event
 */
export function createMeetingEvent(
  title: string,
  start: Date,
  duration: number = 60,
  description?: string,
  location?: string
): CalendarEvent {
  return {
    title,
    description,
    start,
    end: new Date(start.getTime() + duration * 60 * 1000),
    location,
  };
}
