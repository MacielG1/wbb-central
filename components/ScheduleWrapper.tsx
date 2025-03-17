import { Suspense } from 'react';
import Schedule from './Schedule';
import allTeamsData from '@/utils/allTeamsData.json';

export const specialCases: { [key: string]: string } = {
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

interface ScheduleWrapperProps {
  events: any[];
  league: string;
}

// Helper function to normalize team names for comparison
function normalizeTeamName(name: string): string {
  if (!name) return '';
  
  return name.toLowerCase()
    .replace(/\./g, '') // Remove periods
    .replace(/&/g, 'and') // Replace & with 'and'
    .replace(/-/g, ' ') // Replace hyphens with spaces
    .replace(/'/g, '') // Remove apostrophes
    .replace(/\(/g, '') // Remove opening parentheses
    .replace(/\)/g, '') // Remove closing parentheses
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

// Helper function to find team data by name - moved outside component
function findTeamByName(rankingName: string) {
  if (!rankingName) return null;
  
  const rankingNameLower = rankingName.toLowerCase();
  const normalizedRankingName = normalizeTeamName(rankingName);

  // Check special cases first
  if (specialCases[rankingNameLower]) {
    const specialCaseName = specialCases[rankingNameLower].toLowerCase();
    const match = allTeamsData.find(
      (t) => 
        t.displayName.toLowerCase() === specialCaseName || 
        t.nickname.toLowerCase() === specialCaseName
    );
    
    if (match) return match;
  }

  // Handle "Ole Miss" / "Mississippi" special case
  if (rankingNameLower === 'ole miss' || rankingNameLower === 'mississippi') {
    const match = allTeamsData.find(t => t.displayName.toLowerCase() === 'ole miss rebels' || t.nickname.toLowerCase() === 'rebels');
    if (match) return match;
  }

  // Try to find a match by normalizing both the ranking name and team names
  for (const team of allTeamsData) {
    const normalizedDisplayName = normalizeTeamName(team.displayName);
    const normalizedNickname = normalizeTeamName(team.nickname);
    
    if (normalizedDisplayName === normalizedRankingName || normalizedNickname === normalizedRankingName) {
      return team;
    }
  }

  // First try exact matches with nickname
  const nicknameMatch = allTeamsData.find((t) => t.nickname.toLowerCase() === rankingNameLower);
  if (nicknameMatch) return nicknameMatch;

  // Then try exact matches with displayName
  const displayMatch = allTeamsData.find((t) => t.displayName.toLowerCase() === rankingNameLower);
  if (displayMatch) return displayMatch;

  // Try matching by parts
  const nameParts = normalizedRankingName.split(' ').filter(Boolean);
  return allTeamsData.find((t) => {
    const displayNameParts = normalizeTeamName(t.displayName).split(' ');
    const nicknameParts = normalizeTeamName(t.nickname).split(' ');

    // Check both displayName and nickname parts
    return nameParts.every(
      (part) => 
        displayNameParts.some((namePart) => namePart.startsWith(part)) || 
        nicknameParts.some((namePart) => namePart.startsWith(part))
    );
  });
}

// This component fetches the T-Rank data
async function TRankProvider() {
  // Fetch T-Rank data - this will be streamed in  
  // Create a mapping from ESPN team ID to T-Rank
  const tRankMap: Record<string, number> = {};
  
  // Create a normalized version of specialCases for lookup
  const normalizedSpecialCases: Record<string, string> = {};
  Object.keys(specialCases).forEach(key => {
    normalizedSpecialCases[normalizeTeamName(key)] = specialCases[key];
  });
  
  // Additional mappings for common variations that might not be in specialCases
  const additionalMappings: Record<string, string> = {
    'nc state': 'nc state wolfpack',
    'miami fl': 'miami hurricanes',
    'albany': 'ualbany great danes',
    'hawaii': "hawai'i rainbow wahine",
    'illinois chicago': 'uic flames',
    'texas am corpus chris': 'texas a&m-corpus christi islanders',
    'louisiana monroe': 'ul monroe warhawks',
    'nicholls st': 'nicholls colonels',
    'tennessee martin': 'ut martin skyhawks',
    'nebraska omaha': 'omaha mavericks',
    'appalachian st': 'app state mountaineers',
    'grambling st': 'grambling lady tigers',
    'sam houston st': 'sam houston bearkats',
    'gardner webb': "gardner-webb runnin' bulldogs",
    'san jose st': 'san josé state spartans',
    'saint francis': 'st. francis (pa) red flash',
    'liu': 'long island university sharks',
    'usc upstate': 'south carolina upstate spartans',
    'arkansas pine bluff': 'arkansas-pine bluff golden lions',
    'mcneese st': 'mcneese cowgirls',
    'umkc': 'kansas city roos',
    'bethune cookman': 'bethune-cookman wildcats',
    'texas am commerce': 'texas a&m-commerce lions',
    'southeastern louisiana': 'se louisiana',
    'west georgia': 'west georgia wolves',
    'ole miss': 'ole miss rebels',
    'mississippi': 'ole miss rebels',
  };
  
  // Merge additional mappings with normalized special cases
  Object.keys(additionalMappings).forEach(key => {
    normalizedSpecialCases[key] = additionalMappings[key];
  });
  
  // Direct ID mappings for problematic teams
  const directIdMappings: Record<string, string> = {
    'West Georgia': '2692', // West Georgia Wolves ID
    'Texas A&M Commerce': '2351', // Texas A&M-Commerce Lions ID
    'Ole Miss': '145',  // Ole Miss Rebels ID
    'Mississippi': '145' // Ole Miss Rebels ID
  };
  
  // Helper function for fuzzy matching as a last resort
  function findBestFuzzyMatch(teamName: string) {
    const normalizedName = normalizeTeamName(teamName);
    const nameParts = normalizedName.split(' ').filter(Boolean);
    
    // Skip very short team names to avoid false matches
    if (nameParts.length < 1 || normalizedName.length < 3) return null;
    
    // Try to find teams that match at least the first part of the name
    const possibleMatches = allTeamsData.filter(team => {
      const normalizedDisplayName = normalizeTeamName(team.displayName);
      const normalizedNickname = normalizeTeamName(team.nickname);
      
      // Check if the first part of the name matches
      return normalizedDisplayName.includes(nameParts[0]) || 
             normalizedNickname.includes(nameParts[0]);
    });
    
    if (possibleMatches.length === 0) return null;
    
    // If we have multiple matches, try to find the best one
    if (possibleMatches.length > 1) {
      // Score each match by how many parts of the name it matches
      const scoredMatches = possibleMatches.map(team => {
        const normalizedDisplayName = normalizeTeamName(team.displayName);
        const normalizedNickname = normalizeTeamName(team.nickname);
        
        let score = 0;
        for (const part of nameParts) {
          if (normalizedDisplayName.includes(part)) score++;
          if (normalizedNickname.includes(part)) score++;
        }
        
        return { team, score };
      });
      
      // Sort by score (highest first)
      scoredMatches.sort((a, b) => b.score - a.score);
      
      // Return the team with the highest score
      return scoredMatches[0].team;
    }
    
    // If we only have one match, return it
    return possibleMatches[0];
  }
  
  return tRankMap;
}

export default function ScheduleWrapper({ events, league }: ScheduleWrapperProps) {
  return (
    <Suspense fallback={null}>
      <ScheduleWithTRank events={events} league={league} />
    </Suspense>
  );
}

// This component combines the Schedule with T-Rank data
async function ScheduleWithTRank({ events, league }: ScheduleWrapperProps) {
  const tRankMap = await TRankProvider();

  return <Schedule events={events} league={league} tRankMap={tRankMap} />;
} 