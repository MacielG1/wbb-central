import { cacheLife } from 'next/cache';

const ncaawConfig = {
  endpoint: 'womens-college-basketball',
  params: {
    limit: '200',
    groups: '50',
  },
};

export default async function fetchSchedule(date?: string) {
  'use cache';

  const is24HoursAgo = date && new Date(date) < new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const is1DayAhead = date && new Date(date) > new Date(Date.now() + 24 * 60 * 60 * 1000);
  if (date && (is24HoursAgo || is1DayAhead)) {
    cacheLife('hours');
  } else {
    cacheLife('minutes');
  }

  const d = new Date();

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

  let apiDate;
  if (date) {
    apiDate = date.replace(/-/g, '');
  } else {
    apiDate = today;
  }

  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(ncaawConfig.params).filter(([_, v]) => v !== undefined)) as Record<string, string>
  );
  if (date) {
    params.append('dates', apiDate);
  }

  const url = `${process.env.NCAAW_fetchSchedule}/${ncaawConfig.endpoint}/scoreboard?${params.toString()}`;

  async function attemptFetch(isRetry = false) {
    const res = await fetch(url, {});

    if (!res.ok) {
      throw new Error(`Failed to fetch NCAAW schedule ${res.statusText}`);
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
