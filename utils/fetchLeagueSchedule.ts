import { unstable_cacheLife as cacheLife } from 'next/cache';

export default async function fetchLeagueSchedule(date?: string) {
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

  const dateParam = `&dates=${apiDate}`;
  const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/womens-college-basketball/scoreboard?limit=200&groups=50${dateParam}`;

  async function attemptFetch(isRetry = false) {
    const res = await fetch(url, {
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch league schedule${isRetry ? ' after retry' : ''}: ${res.statusText}`, isRetry ? { cause: res } : undefined);
    }

    return res.json();
  }

  try {
    return await attemptFetch();
  } catch (error) {
    return await attemptFetch(true);
  }
}
