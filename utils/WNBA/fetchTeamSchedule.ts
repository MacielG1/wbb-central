import { cacheLife } from 'next/cache';
import { WNBATeam, WNBAEvent, WNBATeamScheduleData } from '../../types/wnba';

export default async function fetchWNBATeamSchedule(teamId: string): Promise<WNBATeamScheduleData> {
  'use cache';
  cacheLife('minutes');

  const currentYear = new Date().getFullYear();

  try {
    const response = await fetch(`${process.env.WNBA_fetchTeamSchedule}/${teamId}/schedule?region=us&lang=en&season=${currentYear}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch WNBA team schedule: ${response.status}`);
    }

    const data = await response.json();

    // Default logo fallback for WNBA
    const defaultLogo = 'https://a.espncdn.com/i/teamlogos/leagues/500/wnba.png';

    const processedData: WNBATeamScheduleData = {
      team: {
        id: data.team.id,
        abbreviation: data.team.abbreviation,
        displayName: data.team.displayName,
        shortDisplayName: data.team.shortDisplayName,
        logo: data.team.logo || defaultLogo,
        logos: data.team.logos || [{ href: defaultLogo }],
        color: data.team.color,
        recordSummary: data.team.recordSummary || '0-0',
        standingSummary: data.team.standingSummary || '',
        groups: data.team.groups,
      },
      events: data.events || [],
    };

    return processedData;
  } catch (error) {
    console.error('Error fetching WNBA team schedule:', error);
    return {
      team: {
        id: teamId,
        abbreviation: '',
        displayName: '',
        shortDisplayName: '',
        logo: 'https://a.espncdn.com/i/teamlogos/leagues/500/wnba.png',
        logos: [{ href: 'https://a.espncdn.com/i/teamlogos/leagues/500/wnba.png' }],
        color: '',
        recordSummary: '0-0',
        standingSummary: '',
        groups: { id: '' },
      },
      events: [],
    };
  }
}
