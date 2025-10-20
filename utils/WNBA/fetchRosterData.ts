import { cacheLife as usecache } from 'next/cache';

interface WNBAPlayer {
  id: string;
  fullName: string;
  displayName: string;
  position: { abbreviation: string };
  jersey: string;
  headshot: { href: string; alt: string };
  links?: { rel: string[]; href: string }[];
}

interface WNBALeaderStat {
  name: string;
  displayValue: string;
}

interface WNBALeader {
  athlete: WNBAPlayer;
  statistics: {
    name: string;
    stats: WNBALeaderStat[];
  }[];
}

interface WNBARosterData {
  season: {
    year: number;
    type: number;
    name: string;
    displayName: string;
  };
  team: {
    id: string;
    abbreviation: string;
    location: string;
    name: string;
    displayName: string;
    color: string;
    logo: string;
    recordSummary: string;
    seasonSummary: string;
    standingSummary: string;
  };
  results: Array<{
    name: string;
    displayName: string;
    shortDisplayName: string;
    abbreviation: string;
    leaders: WNBALeader[];
    sort: string;
  }>;
  status: string;
}

export default async function fetchWNBARosterData(teamId: string): Promise<WNBARosterData> {
  'use cache';
  usecache('minutes');
  try {
    const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/teams/${teamId}/athletes/statistics`);

    if (!response.ok) {
      throw new Error(`Failed to fetch WNBA roster data: ${response.status}`);
    }

    const data = await response.json();

    // The API response is already in the correct format
    return {
      season: data.season,
      team: data.team,
      results: data.results,
      status: data.status,
    };
  } catch (error) {
    console.error('Error fetching WNBA roster data:', error);
    // Return empty data structure on error
    return {
      season: {
        year: new Date().getFullYear(),
        type: 2,
        name: 'Regular Season',
        displayName: new Date().getFullYear().toString(),
      },
      team: {
        id: teamId,
        abbreviation: '',
        location: '',
        name: '',
        displayName: '',
        color: '000000',
        logo: '',
        recordSummary: '',
        seasonSummary: '',
        standingSummary: '',
      },
      results: [
        {
          name: 'game',
          displayName: 'Game Statistics',
          shortDisplayName: 'Game',
          abbreviation: 'GAME',
          leaders: [],
          sort: '',
        },
      ],
      status: 'error',
    };
  }
}
