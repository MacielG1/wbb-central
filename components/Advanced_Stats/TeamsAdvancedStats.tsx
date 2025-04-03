'use client';

import { useState, useEffect, useMemo } from 'react';
import { TableVirtuoso } from 'react-virtuoso';
import { MoveDown, MoveUp, Loader2, UserRound, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import allTeamsData from '@/utils/allTeamsData.json';
import { DARK_COLORED_LOGOS } from '@/lib/consts';
import { fetchTeamsStatsBT } from '@/utils/fetchTeamsBT';
import getFavorites from '@/lib/getFavorites';
import { fetchPlayersStatsBT } from '@/utils/fetchPlayersBT';
import { specialCases } from './PlayersAdvancedStats';

interface TeamStats {
  team: string;
  adjOffensiveEfficiency: number;
  adjDefensiveEfficiency: number;
  barthag: number;
  wins: number;
  games: number;
  effectiveFieldGoalPct: number;
  defEffectiveFieldGoalPct: number;
  freeThrowRate: number;
  defFreeThrowRate: number;
  turnoverRate: number;
  defTurnoverRate: number;
  offensiveReboundRate: number;
  defensiveReboundRate: number;
  twoPtPct: number;
  defTwoPtPct: number;
  threePtPct: number;
  defThreePtPct: number;
  blockRate: number;
  blockRateAllowed: number;
  assistRate: number;
  defAssistRate: number;
  threeFgRate: number;
  defThreeFgRate: number;
  adjustedTempo: number;
  winsAboveBubble: number;
  freeThrowPct: number;
  defFreeThrowPct: number;
  season: number;
  winningPercentage?: number;
  conference?: string;
}

interface TeamsAdvancedStatsProps {
  initialData: TeamStats[];
}

type SortConfig = {
  key: keyof TeamStats | null;
  direction: 'asc' | 'desc';
};

interface FilterConfig {
  search: string;
  season: number;
  conference: string;
}


const findTeamData = (teamName: string) => {
  const teamNameLower = teamName.toLowerCase();

  // Check special cases first
  if (specialCases[teamNameLower]) {
    return allTeamsData.find((t) => t.displayName.toLowerCase() === specialCases[teamNameLower] || t.nickname.toLowerCase() === specialCases[teamNameLower]);
  }

  // Then try exact matches with nickname
  const nicknameMatch = allTeamsData.find((t) => t.nickname.toLowerCase() === teamNameLower);
  if (nicknameMatch) return nicknameMatch;

  // Then try exact matches with displayName
  const displayMatch = allTeamsData.find((t) => t.displayName.toLowerCase() === teamNameLower);
  if (displayMatch) return displayMatch;

  // Try matching by parts
  const nameParts = teamNameLower.split(' ').filter(Boolean);
  return allTeamsData.find((t) => {
    const displayNameParts = t.displayName.toLowerCase().split(' ');
    const nicknameParts = t.nickname.toLowerCase().split(' ');

    return nameParts.every(
      (part) => displayNameParts.some((namePart) => namePart.startsWith(part.replace('.', ''))) || nicknameParts.some((namePart) => namePart.startsWith(part.replace('.', '')))
    );
  });
};

// Constants for year handling
// CURRENT_SEASON = 2024;
const NUM_SEASONS_TO_SHOW = 4;

// Add function to determine current season dynamically
const getCurrentSeason = (): number => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed (0 = January, 11 = December)
  
  // If we're in the latter part of the year (July-December), we're in the season that starts this year
  // Otherwise, we're in the season that started the previous year
  return currentMonth >= 6 ? currentYear : currentYear - 1;
};

// Add helper function to generate season options
const generateSeasonOptions = () => {
  const currentSeason = getCurrentSeason();
  const startYear = currentSeason - (NUM_SEASONS_TO_SHOW - 1);
  return Array.from({ length: NUM_SEASONS_TO_SHOW }, (_, i) => startYear + i);
};

// Add cache key constant
const CONFERENCE_CACHE_KEY = 'teamConferenceCache';
const CACHE_EXPIRY_DAYS = 30; // Cache conference data for 30 days

interface CachedConferenceData {
  timestamp: number;
  season: number;
  conferenceMap: Record<string, string>;
}

// Add function to check if cache is valid
const isConferenceCacheValid = (cachedData: CachedConferenceData | null): boolean => {
  if (!cachedData) return false;
  
  const now = Date.now();
  const expiryTime = cachedData.timestamp + (CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  return now < expiryTime;
};

export default function TeamsAdvancedStats({ initialData }: TeamsAdvancedStatsProps) {
  const [teams, setTeams] = useState<TeamStats[]>(initialData);
  const [inputValue, setInputValue] = useState('');
  const [filters, setFilters] = useState<FilterConfig>({
    search: '',
    season: getCurrentSeason(),
    conference: 'all',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'barthag', direction: 'desc' });
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Record<string, any>>({});
  const [uniqueConferences, setUniqueConferences] = useState<string[]>([]);

  const pathname = usePathname();
  const league = pathname?.split('/')[1];

  // Create team data cache
  const [teamDataCache] = useState(() => {
    const cache: Record<string, any> = {};
    const uniqueTeams = new Set(initialData.map((t) => t.team));
    uniqueTeams.forEach((team) => {
      const teamNameLower = team.toLowerCase();
      const matchingSpecialCase = Object.entries(specialCases).find(([key]) => teamNameLower === key);
      cache[team] = {
        teamData: findTeamData(team),
        specialCase: matchingSpecialCase ? specialCases[matchingSpecialCase[0]].toLowerCase() : null,
      };
    });
    return cache;
  });

  // Add function to get cached conference data
  const getCachedConferenceData = (): CachedConferenceData | null => {
    try {
      const cached = localStorage.getItem(CONFERENCE_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error reading conference cache:', error);
      return null;
    }
  };

  // Add function to set cached conference data
  const setCachedConferenceData = (conferenceMap: Record<string, string>, season: number) => {
    try {
      const cacheData: CachedConferenceData = {
        timestamp: Date.now(),
        season,
        conferenceMap
      };
      localStorage.setItem(CONFERENCE_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving conference cache:', error);
    }
  };

  // Modify fetchAndMapConferences to use cache
  const fetchAndMapConferences = async (year: number) => {
    try {
      // Check cache first
      const cachedData = getCachedConferenceData();
      if (cachedData && isConferenceCacheValid(cachedData) && cachedData.season === year + 1) {
        // Use cached data
        const teamsWithConference = teams.map(team => ({
          ...team,
          conference: cachedData.conferenceMap[team.team.toLowerCase()] || 'Unknown'
        }));

        const conferences = Array.from(new Set(teamsWithConference.map(team => team.conference))).sort();
        setUniqueConferences(conferences);
        setTeams(teamsWithConference);
        return;
      }

      // If cache is invalid or missing, fetch new data
      const playerData = await fetchPlayersStatsBT(year + 1);
      
      // Create a map of team to conference
      const conferenceMap: Record<string, string> = {};
      playerData.forEach((player: any) => {
        if (player.team && player.conference) {
          conferenceMap[player.team.toLowerCase()] = player.conference;
        }
      });

      // Cache the conference data
      setCachedConferenceData(conferenceMap, year + 1);

      // Update teams with conference information
      const teamsWithConference = teams.map(team => ({
        ...team,
        conference: conferenceMap[team.team.toLowerCase()] || 'Unknown'
      }));

      // Update unique conferences
      const conferences = Array.from(new Set(teamsWithConference.map(team => team.conference))).sort();
      setUniqueConferences(conferences);
      setTeams(teamsWithConference);
    } catch (error) {
      console.error('Error fetching conference data:', error);
      
      // If fetch fails, try to use cached data as fallback
      const cachedData = getCachedConferenceData();
      if (cachedData) {
        const teamsWithConference = teams.map(team => ({
          ...team,
          conference: cachedData.conferenceMap[team.team.toLowerCase()] || 'Unknown'
        }));

        const conferences = Array.from(new Set(teamsWithConference.map(team => team.conference))).sort();
        setUniqueConferences(conferences);
        setTeams(teamsWithConference);
      }
    }
  };

  // Update fetchYearData to reset selection when loading new data
  const fetchYearData = async (year: number) => {
    setIsLoading(true);
    try {
      const data = await fetchTeamsStatsBT(year);
      setTeams(data);
      setSelectedTeamId(null); // Reset selection when loading new data
      await fetchAndMapConferences(year);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial conference mapping on component mount
  useEffect(() => {
    fetchAndMapConferences(filters.season);
  }, []);

  // Update filters with debounced search value
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: inputValue }));
    }, 50);

    return () => {
      clearTimeout(timer);
    };
  }, [inputValue]);

  // Simplified search handler for immediate input updates
  const handleSearchChange = (value: string) => {
    setInputValue(value);
  };

  const handleSort = (key: keyof TeamStats) => {
    setSortConfig((prevConfig) => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  // Update filteredTeams to include conference filter
  const filteredTeams = (() => {
    let filtered = teams;
    
    if (filters.conference !== 'all') {
      filtered = filtered.filter((team) => team.conference === filters.conference);
    }
    
    return filtered;
  })();

  // Apply search filter
  const searchFilteredTeams = (() => {
    const searchTerm = filters.search.toLowerCase();
    if (!searchTerm) return filteredTeams;

    return filteredTeams.filter((team) => {
      const { teamData, specialCase } = teamDataCache[team.team] || { teamData: null, specialCase: null };
      return (
        team.team.toLowerCase().includes(searchTerm) ||
        (specialCase && specialCase.includes(searchTerm)) ||
        (teamData?.nickname?.toLowerCase().includes(searchTerm)) ||
        (teamData?.displayName?.toLowerCase().includes(searchTerm))
      );
    });
  })();

  // Update the isLowerBetterStat function to include all defensive stats and other metrics where lower is better
  const isLowerBetterStat = (key: keyof TeamStats | null): boolean => {
    if (!key) return false;
    
    const lowerBetterStats = [
      // Defensive efficiency metrics
      'adjDefensiveEfficiency',
      'defEffectiveFieldGoalPct',
      'defFreeThrowRate',
      'defTwoPtPct',
      'defThreePtPct',
      'defFreeThrowPct',
      'defThreeFgRate',
      'defAssistRate',
      
      // Offensive efficiency metrics (where lower is better)
      'turnoverRate',
      'blockRateAllowed',
      
      // Other defensive metrics
      'blockRateAllowed',
      'defAssistRate'
    ];
    return lowerBetterStats.includes(key);
  };

  // Update the sortedTeams logic to handle winning percentage
  const sortedTeams = (() => {
    if (!sortConfig.key) return searchFilteredTeams;

    return [...searchFilteredTeams].sort((a, b) => {
      // Special handling for winning percentage sorting
      if (sortConfig.key === 'winningPercentage') {
        const aWinPct = a.wins / (a.games || 1);
        const bWinPct = b.wins / (b.games || 1);
        return sortConfig.direction === 'asc' ? aWinPct - bWinPct : bWinPct - aWinPct;
      }

      if (!sortConfig.key) return 0;
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Convert to numbers if possible for proper numeric comparison
      const numA = !isNaN(Number(aValue)) ? Number(aValue) : aValue;
      const numB = !isNaN(Number(bValue)) ? Number(bValue) : bValue;

      // For defensive stats and turnover percentage, lower is better
      const isLowerBetter = isLowerBetterStat(sortConfig.key);
      const comparison = typeof numA === 'number' && typeof numB === 'number' ? numA - numB : String(aValue).localeCompare(String(bValue));

      // For lower-better stats, we invert the comparison but maintain arrow direction consistency
      // Down arrow (desc) should always show better values at top
      if (isLowerBetter) {
        return sortConfig.direction === 'desc' ? comparison : -comparison;
      } else {
        return sortConfig.direction === 'desc' ? -comparison : comparison;
      }
    });
  })();

  // Now that sortedTeams is defined, define the handleRowClick function
  const handleRowClick = (index: number) => {
    // Check if there's any text selected
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      // If text is selected, don't change row selection
      return;
    }
    
    const team = sortedTeams[index];
    if (team) {
      setSelectedTeamId(selectedTeamId === team.team ? null : team.team);
    }
  };

  // Calculate selected row index based on selectedTeamId
  const selectedRowIndex = useMemo(() => {
    if (!selectedTeamId) return null;
    return sortedTeams.findIndex(team => team.team === selectedTeamId);
  }, [selectedTeamId, sortedTeams]);

  // Update the globalRankMap logic to use the same sorting logic
  const globalRankMap = (() => {
    if (!sortConfig.key) return new Map();

    const rankMap = new Map();

    // Sort all filtered teams with nulls at the end
    const sortedAllTeams = [...filteredTeams].sort((a, b) => {
      // Special handling for winning percentage sorting
      if (sortConfig.key === 'winningPercentage') {
        const aWinPct = a.wins / (a.games || 1);
        const bWinPct = b.wins / (b.games || 1);
        return sortConfig.direction === 'asc' ? aWinPct - bWinPct : bWinPct - aWinPct;
      }

      if (!sortConfig.key) return 0;
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Always put nulls at the end regardless of sort direction
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Convert to numbers if possible for proper numeric comparison
      const numA = !isNaN(Number(aValue)) ? Number(aValue) : aValue;
      const numB = !isNaN(Number(bValue)) ? Number(bValue) : bValue;

      // For defensive stats and turnover percentage, lower is better
      const isLowerBetter = isLowerBetterStat(sortConfig.key);
      const comparison = typeof numA === 'number' && typeof numB === 'number' ? numA - numB : String(aValue).localeCompare(String(bValue));

      // For lower-better stats, we invert the comparison but maintain arrow direction consistency
      if (isLowerBetter) {
        return sortConfig.direction === 'desc' ? comparison : -comparison;
      } else {
        return sortConfig.direction === 'desc' ? -comparison : comparison;
      }
    });

    // Create a unique key for each team using team name
    sortedAllTeams.forEach((team, index) => {
      const teamKey = team.team;
      rankMap.set(teamKey, index + 1);
    });

    return rankMap;
  })();

  // Add stat descriptions
  const statDescriptions: { [key: string]: string } = {
    adjOffensiveEfficiency: "Adjusted offensive efficiency (points scored per 100 possessions)",
    adjDefensiveEfficiency: "Adjusted defensive efficiency (points allowed per 100 possessions)",
    barthag: "Power rating that represents win probability against average team",
    wins: "Total wins",
    games: "Total games played",
    effectiveFieldGoalPct: "Effective field goal percentage",
    defEffectiveFieldGoalPct: "Defensive effective field goal percentage",
    freeThrowRate: "Free throw rate (FTA/FGA)",
    defFreeThrowRate: "Defensive free throw rate",
    turnoverRate: "Turnover rate (turnovers per 100 possessions)",
    defTurnoverRate: "Defensive turnover rate",
    offensiveReboundRate: "Offensive rebound percentage",
    defensiveReboundRate: "Defensive rebound percentage",
    twoPtPct: "Two-point field goal percentage",
    defTwoPtPct: "Defensive two-point field goal percentage",
    threePtPct: "Three-point field goal percentage",
    defThreePtPct: "Defensive three-point field goal percentage",
    blockRate: "Block rate (blocks per 100 2PA faced)",
    blockRateAllowed: "Block rate allowed",
    assistRate: "Assist rate (assists per 100 FGM)",
    defAssistRate: "Defensive assist rate",
    threeFgRate: "Three-point attempt rate (3PA/FGA)",
    defThreeFgRate: "Defensive three-point attempt rate",
    adjustedTempo: "Adjusted tempo (possessions per 40 minutes)",
    winsAboveBubble: "Wins above bubble team rating",
    freeThrowPct: "Free throw percentage",
    defFreeThrowPct: "Defensive free throw percentage"
  };

  // Update the column widths
  const columnWidths = {
    rank: 50,
    compact: 65,
    default: 70,
    team: 160,
    stats: 70,
    barthag: 75,
    percentage: 65,
  };

  const headerStyle = {
    backgroundColor: '#4f39f6',
    color: 'black',
    cursor: 'pointer',
    position: 'relative' as const,
    userSelect: 'none' as const,
    opacity: isLoading ? 0.7 : 1,
    transition: 'opacity 0.15s ease',
    fontSize: '0.75rem',
    whiteSpace: 'nowrap' as const,
    padding: '4px 6px',
    textAlign: 'center' as const,
  };

  const firstColumnStyle: React.CSSProperties = {
    ...headerStyle,
    position: 'sticky',
    left: 0,
    zIndex: 101,
    backgroundColor: '#4f39f6',
    backgroundClip: 'padding-box',
  };

  const secondColumnStyle: React.CSSProperties = {
    ...headerStyle,
    position: 'sticky',
    left: columnWidths.rank,
    zIndex: 101,
    backgroundColor: '#4f39f6',
    backgroundClip: 'padding-box',
  };

  const cellClass = 'px-1.5 py-1 text-center bg-neutral-900 border-r border-b border-black';
  const teamCellClass = 'px-1.5 py-1 pl-2 text-left bg-neutral-900 border-r border-b border-black';

  const getRowStyle = (index: number) => ({
    cursor: 'pointer',
    backgroundColor: selectedRowIndex === index ? '#1a1835' : '#171717',
    borderLeft: selectedRowIndex === index ? '2px solid #4f39f640' : '2px solid #171717',
    borderRight: selectedRowIndex === index ? '2px solid #4f39f640' : '2px solid #171717',
    borderTop: selectedRowIndex === index ? '1px solid #4f39f640' : '1px solid #171717',
    borderBottom: selectedRowIndex === index ? '1px solid #4f39f640' : '1px solid #171717',
  });

  const getCellStyle = (index: number, isFixed: boolean = false) => {
    if (isFixed) {
      return {
        backgroundColor: selectedRowIndex === index ? '#1a1835' : '#171717',
        color: 'white',
        boxShadow: 'none',
      };
    }
    return {
      backgroundColor: selectedRowIndex === index ? '#1a1835' : '#171717',
      color: 'white',
      boxShadow: 'none',
    };
  };

  const getSortIndicator = (key: keyof TeamStats) => {
    if (sortConfig.key !== key) return null;
    return (
      <span className="absolute right-0 top-1/2 -translate-y-1/2">
        {sortConfig.direction === 'asc' ? <MoveUp className="w-2.5 h-2.5 " /> : <MoveDown className="w-2.5 h-2.5" />}
      </span>
    );
  };

  useEffect(() => {
    const favorites = getFavorites();
    setFavorites(favorites);
  }, []);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-neutral-950">
      <div className="p-2 border-b border-neutral-800 flex-shrink-0">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm">Search:</label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search team..."
              className="w-full pl-4 pr-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md focus:outline-hidden focus:border-neutral-400 dark:focus:border-neutral-600"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm">Season:</label>
            <div className="relative">
              <select
                value={filters.season}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, season: Number(e.target.value) }));
                  fetchYearData(Number(e.target.value));
                }}
                className="pl-4 cursor-pointer pr-8 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md focus:outline-hidden focus:border-neutral-400 dark:focus:border-neutral-600 appearance-none bg-[length:16px_16px] bg-[right_0.5rem_center] bg-no-repeat bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNy40MSA4LjU5TDEyIDEzLjE3bDQuNTktNC41OEwxOCAxMGwtNiA2LTYtNiAxLjQxLTEuNDF6IiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==')]"
                disabled={isLoading}
              >
                {generateSeasonOptions().map((year) => (
                  <option key={year} value={year}>
                    {year}-{(year + 1).toString().slice(2)}
                  </option>
                ))}
              </select>
              {isLoading && (
                <div className="absolute right-8 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm">Conference:</label>
            <select
              value={filters.conference}
              onChange={(e) => setFilters((prev) => ({ ...prev, conference: e.target.value }))}
              className="pl-4 cursor-pointer pr-8 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md focus:outline-hidden focus:border-neutral-400 dark:focus:border-neutral-600 appearance-none bg-[length:16px_16px] bg-[right_0.5rem_center] bg-no-repeat bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNy40MSA4LjU5TDEyIDEzLjE3bDQuNTktNC41OEwxOCAxMGwtNiA2LTYtNiAxLjQxLTEuNDF6IiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==')]"
              disabled={isLoading}
            >
              <option value="all">All Conferences</option>
              {uniqueConferences.map((conf) => (
                <option key={conf} value={conf}>
                  {conf}
                </option>
              ))}
            </select>
          </div>

          <div className="text-sm text-neutral-500">
            Showing {searchFilteredTeams.length} of {teams.length} teams
          </div>

          <Link
            href={`/${league}/players`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-300 hover:text-neutral-400 bg-neutral-900 rounded-md border border-neutral-800 hover:border-neutral-700 transition-colors ml-auto"
          >
            <UserRound className="w-4 h-4" />
            View Players Stats
          </Link>
        </div>
      </div>

      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-neutral-950/50 z-50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        )}
        <TableVirtuoso
          style={{ height: '100%' }}
          totalCount={sortedTeams.length}
          components={{
            Table: ({ style, ...props }) => (
              <table
                {...props}
                style={{
                  ...style,
                  width: 'max-content',
                  minWidth: '100%',
                  tableLayout: 'fixed',
                  borderCollapse: 'separate',
                  borderSpacing: 0,
                }}
                className="table-auto text-sm"
              />
            ),
            TableHead: () => (
              <thead className="sticky top-0 z-[100] bg-neutral-900">
                <tr>
                  <th className={cellClass} style={{ ...firstColumnStyle, width: columnWidths.rank }} title="Current rank">
                    Rank
                  </th>
                  <th className={teamCellClass} style={{ ...secondColumnStyle, width: columnWidths.team }} onClick={() => handleSort('team')} title="Team name">
                    Team {getSortIndicator('team')}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.compact }} onClick={() => handleSort('winningPercentage')} title="Team record (wins-losses)">
                    Record {sortConfig.key === 'winningPercentage' && (
                      <span className="absolute right-0 top-1/2 -translate-y-1/2">
                        {sortConfig.direction === 'asc' ? <MoveUp className="w-2.5 h-2.5" /> : <MoveDown className="w-2.5 h-2.5" />}
                      </span>
                    )}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.barthag }} onClick={() => handleSort('barthag')} title="Power rating (win probability vs average team)">
                    BARTHAG {getSortIndicator('barthag')}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.stats }} onClick={() => handleSort('adjOffensiveEfficiency')} title="Adjusted offensive efficiency">
                    AdjOE {getSortIndicator('adjOffensiveEfficiency')}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.stats }} onClick={() => handleSort('adjDefensiveEfficiency')} title="Adjusted defensive efficiency">
                    AdjDE {getSortIndicator('adjDefensiveEfficiency')}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.percentage }} onClick={() => handleSort('effectiveFieldGoalPct')} title="Effective field goal percentage">
                    eFG% {getSortIndicator('effectiveFieldGoalPct')}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.percentage }} onClick={() => handleSort('defEffectiveFieldGoalPct')} title="Defensive effective field goal percentage">
                    Def eFG% {getSortIndicator('defEffectiveFieldGoalPct')}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.percentage }} onClick={() => handleSort('twoPtPct')} title="Two-point field goal percentage">
                    2P% {getSortIndicator('twoPtPct')}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.percentage }} onClick={() => handleSort('defTwoPtPct')} title="Defensive two-point field goal percentage">
                    Def 2P% {getSortIndicator('defTwoPtPct')}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.percentage }} onClick={() => handleSort('threePtPct')} title="Three-point field goal percentage">
                    3P% {getSortIndicator('threePtPct')}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.percentage }} onClick={() => handleSort('defThreePtPct')} title="Defensive three-point field goal percentage">
                    Def 3P% {getSortIndicator('defThreePtPct')}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.percentage }} onClick={() => handleSort('assistRate')} title="Assist rate">
                    AST% {getSortIndicator('assistRate')}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.percentage }} onClick={() => handleSort('defAssistRate')} title="Defensive assist rate">
                    Def AST% {getSortIndicator('defAssistRate')}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.percentage }} onClick={() => handleSort('turnoverRate')} title="Turnover rate">
                    TO% {getSortIndicator('turnoverRate')}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.percentage }} onClick={() => handleSort('defTurnoverRate')} title="Defensive turnover rate">
                    Def TO% {getSortIndicator('defTurnoverRate')}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.percentage }} onClick={() => handleSort('offensiveReboundRate')} title="Offensive rebound rate">
                    OR% {getSortIndicator('offensiveReboundRate')}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.percentage }} onClick={() => handleSort('defensiveReboundRate')} title="Defensive rebound rate">
                    DR% {getSortIndicator('defensiveReboundRate')}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.percentage }} onClick={() => handleSort('freeThrowPct')} title="Free throw percentage">
                    FT% {getSortIndicator('freeThrowPct')}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.percentage }} onClick={() => handleSort('freeThrowRate')} title="Free throw rate">
                    FTR {getSortIndicator('freeThrowRate')}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.percentage }} onClick={() => handleSort('defFreeThrowRate')} title="Defensive free throw rate">
                    Def FTR {getSortIndicator('defFreeThrowRate')}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.percentage }} onClick={() => handleSort('threeFgRate')} title="Three-point attempt rate">
                    3PA% {getSortIndicator('threeFgRate')}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.percentage }} onClick={() => handleSort('defThreeFgRate')} title="Defensive three-point attempt rate">
                    Def 3PA% {getSortIndicator('defThreeFgRate')}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.stats }} onClick={() => handleSort('adjustedTempo')} title="Adjusted tempo">
                    Tempo {getSortIndicator('adjustedTempo')}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.stats }} onClick={() => handleSort('winsAboveBubble')} title="Wins above bubble">
                    WAB {getSortIndicator('winsAboveBubble')}
                  </th>
                </tr>
              </thead>
            ),
            TableRow: ({ item: _item, ...props }) => (
              <tr
                {...props}
                className="border-b bg-neutral-900 hover:bg-gray-50 text-xs"
                onClick={() => handleRowClick(props['data-index'] as number)}
                style={getRowStyle(props['data-index'] as number)}
              />
            ),
          }}
          fixedHeaderContent={() => null}
          itemContent={(index) => {
            const team = sortedTeams[index];
            const teamData = teamDataCache[team.team];
            const record = `${team.wins}-${team.games - team.wins}`;
            const isFavorite = teamData?.teamData ? favorites[teamData.teamData.id] : false;

            // Helper function to format percentages
            const formatPercentage = (value: number | undefined) => {
              if (value === undefined || value === null) return '';
              return value.toFixed(1);
            };

            return (
              <>
                <td className={cellClass} style={{ ...getCellStyle(index, true), width: columnWidths.rank, position: 'sticky', left: 0, zIndex: 98, backgroundClip: 'padding-box' }}>
                  {globalRankMap.get(team.team) || index + 1}
                </td>
                <td className={teamCellClass} style={{ ...getCellStyle(index, true), width: columnWidths.team, position: 'sticky', left: columnWidths.rank, zIndex: 98, backgroundClip: 'padding-box' }}>
                  {teamData?.teamData ? (
                    <div className="flex items-center gap-2">
                      <Link href={`/${league}/${teamData.teamData.id}`} className="flex items-center gap-1 hover:opacity-80">
                        <Image
                          src={DARK_COLORED_LOGOS.includes(teamData.teamData.displayName) ? teamData.teamData.logos[1].href : teamData.teamData.logos[0].href}
                          alt={``}
                          width={20}
                          height={20}
                          className="w-5 h-5"
                          unoptimized
                        />
                        <span className="text-indigo-300 hover:text-indigo-200">{teamData.teamData.nickname}</span>
                      </Link>
                      {isFavorite && (
                        <Star className="size-2.5 fill-yellow-600 text-yellow-600" />
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-indigo-300">{team.team}</span>
                      {isFavorite && (
                        <Star className="size-2.5 fill-yellow-600 text-yellow-600" />
                      )}
                    </div>
                  )}
                </td>
                <td className={cellClass} style={{ ...getCellStyle(index), width: columnWidths.compact }}>{record}</td>
                <td className={cellClass} style={{ ...getCellStyle(index), width: columnWidths.barthag }}>{team.barthag?.toFixed(3)}</td>
                <td className={cellClass} style={{ ...getCellStyle(index), width: columnWidths.stats }}>{team.adjOffensiveEfficiency?.toFixed(1)}</td>
                <td className={cellClass} style={{ ...getCellStyle(index), width: columnWidths.stats }}>{team.adjDefensiveEfficiency?.toFixed(1)}</td>
                <td className={cellClass} style={{ ...getCellStyle(index), width: columnWidths.percentage }}>{formatPercentage(team.effectiveFieldGoalPct)}</td>
                <td className={cellClass} style={{ ...getCellStyle(index), width: columnWidths.percentage }}>{formatPercentage(team.defEffectiveFieldGoalPct)}</td>
                <td className={cellClass} style={{ ...getCellStyle(index), width: columnWidths.percentage }}>{formatPercentage(team.twoPtPct)}</td>
                <td className={cellClass} style={{ ...getCellStyle(index), width: columnWidths.percentage }}>{formatPercentage(team.defTwoPtPct)}</td>
                <td className={cellClass} style={{ ...getCellStyle(index), width: columnWidths.percentage }}>{formatPercentage(team.threePtPct)}</td>
                <td className={cellClass} style={{ ...getCellStyle(index), width: columnWidths.percentage }}>{formatPercentage(team.defThreePtPct)}</td>
                <td className={cellClass} style={{ ...getCellStyle(index), width: columnWidths.percentage }}>{formatPercentage(team.assistRate)}</td>
                <td className={cellClass} style={{ ...getCellStyle(index), width: columnWidths.percentage }}>{formatPercentage(team.defAssistRate)}</td>
                <td className={cellClass} style={{ ...getCellStyle(index), width: columnWidths.percentage }}>{formatPercentage(team.turnoverRate)}</td>
                <td className={cellClass} style={{ ...getCellStyle(index), width: columnWidths.percentage }}>{formatPercentage(team.defTurnoverRate)}</td>
                <td className={cellClass} style={{ ...getCellStyle(index), width: columnWidths.percentage }}>{formatPercentage(team.offensiveReboundRate)}</td>
                <td className={cellClass} style={{ ...getCellStyle(index), width: columnWidths.percentage }}>{formatPercentage(team.defensiveReboundRate)}</td>
                <td className={cellClass} style={{ ...getCellStyle(index), width: columnWidths.percentage }}>{formatPercentage(team.freeThrowPct)}</td>
                <td className={cellClass} style={{ ...getCellStyle(index), width: columnWidths.percentage }}>{formatPercentage(team.freeThrowRate)}</td>
                <td className={cellClass} style={{ ...getCellStyle(index), width: columnWidths.percentage }}>{formatPercentage(team.defFreeThrowRate)}</td>
                <td className={cellClass} style={{ ...getCellStyle(index), width: columnWidths.percentage }}>{formatPercentage(team.threeFgRate)}</td>
                <td className={cellClass} style={{ ...getCellStyle(index), width: columnWidths.percentage }}>{formatPercentage(team.defThreeFgRate)}</td>
                <td className={cellClass} style={{ ...getCellStyle(index), width: columnWidths.stats }}>{team.adjustedTempo?.toFixed(1)}</td>
                <td className={cellClass} style={{ ...getCellStyle(index), width: columnWidths.stats }}>{team.winsAboveBubble?.toFixed(1)}</td>
              </>
            );
          }}
        />
      </div>
    </div>
  );
}
