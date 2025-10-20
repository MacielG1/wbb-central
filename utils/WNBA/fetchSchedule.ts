import { cacheLife } from 'next/cache';
import type { APIResponse } from '@/types/espn';

export async function fetchWNBASchedule(date?: string): Promise<APIResponse> {
  'use cache';

  const is24HoursAgo = date && new Date(date) < new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const is1DayAhead = date && new Date(date) > new Date(Date.now() + 24 * 60 * 60 * 1000);
  if (date && (is24HoursAgo || is1DayAhead)) {
    cacheLife('hours');
  } else {
    cacheLife('minutes');
  }

  const d = new Date();
  const currentYear = d.getFullYear();

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = formatter.formatToParts(d);

  const today = `${parts[0].value}-${parts[2].value}-${parts[4].value}`;
  const apiDate = date ? date.replace(/-/g, '') : today;

  const seasonStartDate = new Date(`${currentYear}-05-01`); // if accessing before this date, use year only
  const requestedDate = date ? new Date(date) : new Date();

  let url: string;
  if (requestedDate < seasonStartDate) {
    // If requested date is before season start, don't include dates parameter
    url = `${process.env.WNBA_fetchSchedule}?year=${currentYear}`;
  } else {
    // Otherwise, include dates parameter for specific day
    url = `${process.env.WNBA_fetchSchedule}?dates=${apiDate}&year=${currentYear}`;
  }

  async function attemptFetch(isRetry = false) {
    const res = await fetch(url, {});

    if (!res.ok) {
      throw new Error(`Failed to fetch WNBA schedule ${res.statusText}`);
    }

    const data = await res.json();

    return data;
  }

  try {
    return await attemptFetch();
  } catch (error) {
    return await attemptFetch(true);
  }
}
