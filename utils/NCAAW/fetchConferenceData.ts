import { unstable_cacheLife as cacheLife } from 'next/cache';

interface ConferenceTeam {
  team: {
    id: string;
    location: string;
    name: string;
    abbreviation: string;
    displayName: string;
    shortDisplayName: string;
  };
  stats: {
    wins: number;
    losses: number;
    winPercent: number;
  }[];
}

interface Conference {
  id: string;
  name: string;
  shortName: string;
  entries: ConferenceTeam[];
}

export async function fetchConferenceData(conferenceId: string) {
  'use cache';
  cacheLife('minutes');

  async function attemptFetch() {
    const res = await fetch(`${process.env.NCAAW_fetchConferenceData}&group=${conferenceId}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch conference data: ${res.statusText}`);
    }
    return res;
  }

  try {
    let res;
    try {
      res = await attemptFetch();
    } catch (error) {
      res = await attemptFetch();
    }

    const data = await res.json();
    return data;
  } catch (error: any) {
    console.error('Error fetching conference data:', error.message);
  }
}
