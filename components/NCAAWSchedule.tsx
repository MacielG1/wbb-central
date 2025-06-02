import { Suspense } from 'react';
import Schedule from './Schedule';
import allTeamsData from '@/utils/NCAAW/allTeamsData.json';

interface NCAAWScheduleProps {
  events: any[];
  league: string;
}

export const specialCasesBT: { [key: string]: string } = {
  connecticut: 'uconn',
  'n.c. state': 'nc state wolfpack',
  'miami fl': 'miami hurricanes',
  albany: 'ualbany great danes',
  hawaii: "hawai'i rainbow wahine",
  'illinois chicago': 'uic flames',
  'texas a&m corpus chris': 'texas a&m-corpus christi islanders',
  'louisiana monroe': 'ul monroe warhawks',
  'nicholls st.': 'nicholls colonels',
  'tennessee martin': 'ut martin skyhawks',
  'nebraska omaha': 'omaha mavericks',
  'appalachian st.': 'app state mountaineers',
  'grambling st.': 'grambling lady tigers',
  'sam houston st.': 'sam houston bearkats',
  'gardner webb': "gardner-webb runnin' bulldogs",
  'san jose st.': 'san josé state spartans',
  'saint francis': 'st. francis (pa) red flash',
  liu: 'long island university sharks',
  'usc upstate': 'south carolina upstate spartans',
  'arkansas pine bluff': 'arkansas-pine bluff golden lions',
  'mcneese st.': 'mcneese cowgirls',
  umkc: 'kansas city roos',
  mercyhurst: 'mercyhurst lakers',
  'west georgia': 'georgia state panthers',
  'bethune cookman': 'bethune-cookman wildcats',
  'texas a&m commerce': 'east texas a&m lions',
  'southeastern louisiana': 'se louisiana',
  'mississippi': 'ole miss rebels',
};

function normalizeTeamName(name: string): string {
  if (!name) return '';
  
  return name.toLowerCase()
    .replace(/\./g, '') 
    .replace(/&/g, 'and')
    .replace(/-/g, ' ')
    .replace(/'/g, '')
    .replace(/\(/g, '')
    .replace(/\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function findTeamByName(rankingName: string) {
  if (!rankingName) return null;
  
  const rankingNameLower = rankingName.toLowerCase();
  const normalizedRankingName = normalizeTeamName(rankingName);

  if (specialCasesBT[rankingNameLower]) {
    const specialCaseName = specialCasesBT[rankingNameLower].toLowerCase();
    const match = allTeamsData.find(
      (t) => 
        t.displayName.toLowerCase() === specialCaseName || 
        t.nickname.toLowerCase() === specialCaseName
    );
    
    if (match) return match;
  }

  if (rankingNameLower === 'ole miss' || rankingNameLower === 'mississippi') {
    const match = allTeamsData.find(t => t.displayName.toLowerCase() === 'ole miss rebels' || t.nickname.toLowerCase() === 'rebels');
    if (match) return match;
  }

  for (const team of allTeamsData) {
    const normalizedDisplayName = normalizeTeamName(team.displayName);
    const normalizedNickname = normalizeTeamName(team.nickname);
    
    if (normalizedDisplayName === normalizedRankingName || normalizedNickname === normalizedRankingName) {
      return team;
    }
  }

  const nicknameMatch = allTeamsData.find((t) => t.nickname.toLowerCase() === rankingNameLower);
  if (nicknameMatch) return nicknameMatch;

  const displayMatch = allTeamsData.find((t) => t.displayName.toLowerCase() === rankingNameLower);
  if (displayMatch) return displayMatch;

  const nameParts = normalizedRankingName.split(' ').filter(Boolean);
  return allTeamsData.find((t) => {
    const displayNameParts = normalizeTeamName(t.displayName).split(' ');
    const nicknameParts = normalizeTeamName(t.nickname).split(' ');

    return nameParts.every(
      (part) => 
        displayNameParts.some((namePart) => namePart.startsWith(part)) || 
        nicknameParts.some((namePart) => namePart.startsWith(part))
    );
  });
}



async function NCAAWScheduleWithTRank({ events, league }: NCAAWScheduleProps) {
  return <Schedule events={events} league={league} />;
}

export default function NCAAWSchedule({ events, league }: NCAAWScheduleProps) {
  return (
    <Suspense fallback={null}>
      <NCAAWScheduleWithTRank events={events} league={league} />
    </Suspense>
  );
} 