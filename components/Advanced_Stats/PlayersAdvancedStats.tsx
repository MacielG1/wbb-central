'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import React from 'react';
import { calculateAllThresholds, getStatStyle, getTurnoverStyle, getDefensiveStyle, statDescriptions } from '@/lib/statsColors';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import allTeamsData from '@/utils/NCAAW/allTeamsData.json';
import { DARK_COLORED_LOGOS } from '@/lib/consts';
import { TableVirtuoso } from 'react-virtuoso';
import { MoveDown, MoveUp, Loader2, Users } from 'lucide-react';
import { fetchPlayersStatsBT } from '@/utils/NCAAW/fetchPlayersBT';
import { useSearchParams } from 'next/navigation';
import { specialCasesBT } from '../NCAAWSchedule';

interface PlayerStats {
  playerName: string;
  team: string;
  conference: string;
  gamesPlayed: number;
  minutesPercentage: number;
  offensiveRating: number;
  usage: number;
  effectiveFGPercentage: number;
  trueShootingPercentage: number;
  offensiveReboundPercentage: number;
  defensiveReboundPercentage: number;
  assistPercentage: number;
  turnoverPercentage: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  freeThrowPercentage: number;
  twoPMade: number;
  twoPAttempted: number;
  twoPPercentage: number;
  threePMade: number;
  threePAttempted: number;
  threePPercentage: number;
  blockPercentage: number;
  stealPercentage: number;
  foulRate: number;
  year: string;
  height: string;
  number: number;
  porpag: number;
  adjoe: number;
  foulsPer40: number;
  season: number;
  hometown: string;
  recruitRank: number;
  assistToTurnover: number;
  rimMakes: number;
  rimAttempts: number;
  midRangeMakes: number;
  midRangeAttempts: number;
  rimPercentage: number;
  midRangePercentage: number;
  defensiveRating: number;
  adjustedDefensiveRating: number;
  defensivePorpag: number;
  stops: number;
  boxPlusMinus: number;
  offensiveBoxPlusMinus: number;
  defensiveBoxPlusMinus: number;
  gameBoxPlusMinus: number;
  minutesPerGame: number;
  offensiveGameBoxPlusMinus: number;
  defensiveGameBoxPlusMinus: number;
  offensiveRebounds: number;
  defensiveRebounds: number;
  totalRebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  points: number;
  role: string;
  threePPer100: number;
}

interface PlayersAdvancedStatsProps {
  initialData: PlayerStats[];
}

type SortConfig = {
  key: keyof PlayerStats | null;
  direction: 'asc' | 'desc';
};

interface FilterConfig {
  minMinutes: number;
  minGames: number;
  conference: string;
  search: string;
  year: string;
  season: number;
}


const findTeamData = (teamName: string) => {
  const teamNameLower = teamName.toLowerCase();

  if (specialCasesBT[teamNameLower]) {
    return allTeamsData.find((t) => t.displayName.toLowerCase() === specialCasesBT[teamNameLower] || t.nickname.toLowerCase() === specialCasesBT[teamNameLower]);
  }

  const nicknameMatch = allTeamsData.find((t) => t.nickname.toLowerCase() === teamNameLower);
  if (nicknameMatch) return nicknameMatch;

  const displayMatch = allTeamsData.find((t) => t.displayName.toLowerCase() === teamNameLower);
  if (displayMatch) return displayMatch;

  const nameParts = teamNameLower.split(' ').filter(Boolean);
  return allTeamsData.find((t) => {
    const displayNameParts = t.displayName.toLowerCase().split(' ');
    const nicknameParts = t.nickname.toLowerCase().split(' ');

    return nameParts.every(
      (part) => displayNameParts.some((namePart) => namePart.startsWith(part.replace('.', ''))) || nicknameParts.some((namePart) => namePart.startsWith(part.replace('.', '')))
    );
  });
};

const generateSeasonOptions = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  const currentSeason = currentMonth >= 8 ? currentYear : currentYear - 1;
  
  const startYear = currentSeason - 3;
  return Array.from({ length: 4 }, (_, i) => startYear + i);
};

export default function PlayersAdvancedStats({ initialData }: PlayersAdvancedStatsProps) {
  const pathname = usePathname();
  const league = pathname?.split('/')[1];

  
  const currentDate = new Date();
  const defaultSeason = currentDate.getMonth() >= 8 ? currentDate.getFullYear() : currentDate.getFullYear() - 1;
  
  const [players, setPlayers] = useState<PlayerStats[]>(initialData);
  const [inputValue, setInputValue] = useState('');
  const [filters, setFilters] = useState<FilterConfig>({
    minMinutes: 10,
    minGames: 5,
    conference: 'all',
    search: '',
    year: 'all',
    season: defaultSeason,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const createTeamDataCache = (playerData: PlayerStats[]) => {
    const cache: Record<string, any> = {};
    const uniqueTeams = new Set(playerData.map((p) => p.team));
    uniqueTeams.forEach((team) => {
      const teamNameLower = team.toLowerCase();
      const matchingSpecialCase = Object.entries(specialCasesBT).find(([key]) => teamNameLower === key);
      cache[team] = {
        teamData: findTeamData(team),
        specialCase: matchingSpecialCase ? specialCasesBT[matchingSpecialCase[0]].toLowerCase() : null,
      };
    });
    return cache;
  };

  const [teamDataCache, setTeamDataCache] = useState(() => createTeamDataCache(initialData));

  useEffect(() => {
    setTeamDataCache(createTeamDataCache(players));
  }, [players]);

  const fetchYearData = async (year: number) => {
    setIsLoading(true);
    try {
      const data = await fetchPlayersStatsBT(year);
      setPlayers(data);
      setSelectedPlayerId(null);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleYearChange = (year: number) => {
    setFilters(prev => ({ ...prev, season: year }));
    fetchYearData(year);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: inputValue }));
    }, 200);

    return () => {
      clearTimeout(timer);
    };
  }, [inputValue]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
  };

  const [uniqueConferences] = useState(() => {
    const conferences = Array.from(new Set(initialData.map((p) => p.conference))) as string[];
    return conferences.sort();
  });

  const [uniqueYears] = useState(() => {
    const years = ['Fr', 'So', 'Jr', 'Sr'];
    return years;
  });

  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'porpag', direction: 'desc' });

  const baseQualifiedPlayers = (() => {
    const minMinutes = filters.minMinutes;
    const minGames = filters.minGames;

    const maxGamesPlayed = Math.max(...players.map(player => player.gamesPlayed));
    const effectiveMinGames = maxGamesPlayed >= 10 ? minGames : 0;

    return players.filter((player) => {
      return !(player.minutesPercentage < minMinutes || player.gamesPlayed < effectiveMinGames);
    });
  })();

  const effectiveMinGames = useMemo(() => {
    const maxGamesPlayed = Math.max(...players.map(player => player.gamesPlayed));
    return maxGamesPlayed >= 10 ? filters.minGames : 0;
  }, [players, filters.minGames]);

  const thresholds = calculateAllThresholds(baseQualifiedPlayers);

  const qualifiedPlayers = (() => {
    const conference = filters.conference;
    const year = filters.year;
    let filtered = baseQualifiedPlayers;

    if (conference !== 'all') {
      filtered = filtered.filter((player) => player.conference === conference);
    }

    if (year !== 'all') {
      filtered = filtered.filter((player) => player.year === year);
    }

    return filtered;
  })();

  const searchFilteredPlayers = (() => {
    const searchTerm = filters.search.toLowerCase();
    if (!searchTerm) return qualifiedPlayers;

    const searchTerms = searchTerm.split(' ').filter(Boolean);
    
    return qualifiedPlayers.filter((player) => {
      const { teamData, specialCase } = teamDataCache[player.team];
      
      const searchableText = `${player.playerName.toLowerCase()} ${specialCase || ''} ${teamData?.nickname.toLowerCase() || ''} ${teamData?.displayName.toLowerCase() || ''}`;
      
      return searchTerms.every(term => searchableText.includes(term));
    });
  })();

  const sortedPlayers = (() => {
    if (!sortConfig.key) return searchFilteredPlayers;

    const compareValues = (a: any, b: any, key: keyof PlayerStats): number => {
      if ((a === null || a === undefined) && (b === null || b === undefined)) return 0;

      const numA = !isNaN(Number(a)) ? Number(a) : a;
      const numB = !isNaN(Number(b)) ? Number(b) : b;

      if (key === 'turnoverPercentage' || key === 'defensiveRating' || key === 'adjustedDefensiveRating') {
        return typeof numA === 'number' && typeof numB === 'number' ? numA - numB : String(a).localeCompare(String(b));
      }
      return typeof numA === 'number' && typeof numB === 'number' ? numA - numB : String(a).localeCompare(String(b));
    };

    return [...searchFilteredPlayers].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = compareValues(aValue, bValue, sortConfig.key!);

      if (sortConfig.key === 'turnoverPercentage' || sortConfig.key === 'defensiveRating' || sortConfig.key === 'adjustedDefensiveRating') {
        return sortConfig.direction === 'asc' ? -comparison : comparison;
      }
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  })();

  const globalRankMap = (() => {
    if (!sortConfig.key) return new Map();

    const rankMap = new Map();

    const sortedAllPlayers = [...qualifiedPlayers].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const comparison = aValue - bValue;
        if (sortConfig.key === 'turnoverPercentage' || sortConfig.key === 'defensiveRating' || sortConfig.key === 'adjustedDefensiveRating') {
          return sortConfig.direction === 'asc' ? -comparison : comparison;
        }
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      const comparison = String(aValue).localeCompare(String(bValue));
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    sortedAllPlayers.forEach((player, index) => {
      const playerKey = `${player.playerName}_${player.team}`;
      rankMap.set(playerKey, index + 1);
    });

    return rankMap;
  })();

  const handleSort = (key: keyof PlayerStats) => {
    setSortConfig((prevConfig) => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const handleRowClick = useCallback((index: number) => {
    if (index >= 0 && index < sortedPlayers.length) {
      const player = sortedPlayers[index];
      const playerId = `${player.playerName}_${player.team}`;
      setSelectedPlayerId((prevId) => prevId === playerId ? null : playerId);
    } 
  }, [sortedPlayers]);

  const selectedRowIndex = useMemo(() => {
    if (!selectedPlayerId) return null;
    return sortedPlayers.findIndex(
      (player) => `${player.playerName}_${player.team}` === selectedPlayerId
    );
  }, [selectedPlayerId, sortedPlayers]);

  if (!players.length || !thresholds) return <div>Loading...</div>;

  const columnWidths = {
    number: 35,
    superCompact: 50,
    basicStats: 55,
    compact: 60,
    smallStats: 65,
    porpag: 70,
    default: 80,
    team: 138,
    hometown: 150,
    playerName: 142,
  } as const;

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

  const cellClass = 'px-1.5 py-1 text-center bg-neutral-900 border-r border-b border-black ';
  const nameTeamCellClass = 'px-1.5 py-1 pl-2 text-left bg-neutral-900 border-r border-b border-black ';
  const smallerCellClass = 'px-1.5 py-1 text-center bg-neutral-900 border-r border-b border-black';
  const conferenceCellClass = 'px-1.5 py-1 text-center bg-neutral-900 border-r border-b border-black';

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
    left: columnWidths.number,
    zIndex: 101,
    backgroundColor: '#4f39f6',
    backgroundClip: 'padding-box',
  };

  const getSortIndicator = (key: keyof PlayerStats) => {
    if (sortConfig.key !== key) return null;
    return (
      <span className="absolute right-0 top-1/2 -translate-y-1/2">
        {sortConfig.direction === 'asc' ? <MoveUp className="w-2.5 h-2.5" /> : <MoveDown className="w-2.5 h-2.5" />}
      </span>
    );
  };

  const getRowStyle = useCallback((index: number) => ({
    cursor: 'pointer',
    backgroundColor: selectedRowIndex === index ? '#1a1835' : '#171717',
    borderLeft: selectedRowIndex === index ? '2px solid #4f39f640' : '2px solid #171717',
    borderRight: selectedRowIndex === index ? '2px solid #4f39f640' : '2px solid #171717',
    borderTop: selectedRowIndex === index ? '1px solid #4f39f640' : '1px solid #171717',
    borderBottom: selectedRowIndex === index ? '1px solid #4f39f640' : '1px solid #171717',
  }), [selectedRowIndex]);

  const getCellStyle = useCallback((baseStyle: any, index: number, isFixed: boolean = false) => {
    if (isFixed) {
      return {
        backgroundColor: selectedRowIndex === index ? '#1a1835' : '#171717',
        color: 'white',
        boxShadow: 'none',
      };
    }
    if (!baseStyle.backgroundColor || baseStyle.backgroundColor === '#171717') {
      return {
        backgroundColor: selectedRowIndex === index ? '#1a1835' : '#171717',
        color: 'white',
        boxShadow: 'none',
      };
    }
    return baseStyle;
  }, [selectedRowIndex]);

  const MemoizedTableRow = useMemo(() => React.memo(({ item: _item, ...props }: any) => {
    const index = props['data-index'] as number;
    return (
      <tr
        {...props}
        className="border-b bg-neutral-900 hover:bg-gray-50 text-xs"
        onClick={() => handleRowClick(index)}
        style={getRowStyle(index)}
      />
    );
  }), [handleRowClick, getRowStyle]);

  const cellStyleCache = useMemo(() => new Map<string, React.CSSProperties>(), []);
  const getCachedCellStyle = useCallback((baseStyle: any, index: number, isFixed: boolean = false) => {
    const key = `${JSON.stringify(baseStyle)}-${index}-${isFixed}-${selectedRowIndex === index}`;
    if (!cellStyleCache.has(key)) {
      cellStyleCache.set(key, getCellStyle(baseStyle, index, isFixed));
    }
    return cellStyleCache.get(key);
  }, [selectedRowIndex, getCellStyle, cellStyleCache]);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-neutral-950">
      <div className="p-2 border-b border-neutral-800 flex-shrink-0">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={handleSearchChange}
              placeholder="Search player or team..."
              className="w-full pl-4 pr-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md focus:outline-hidden focus:border-neutral-400 dark:focus:border-neutral-600"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm">Min Minutes %:</label>
            <input
              type="number"
              value={filters.minMinutes}
              onChange={(e) => setFilters((prev) => ({ ...prev, minMinutes: Number(e.target.value) }))}
              className="w-20 pl-4 pr-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md focus:outline-hidden focus:border-neutral-400 dark:focus:border-neutral-600"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm">Min Games:</label>
            <input
              type="number"
              value={effectiveMinGames}
              onChange={(e) => setFilters((prev) => ({ ...prev, minGames: Number(e.target.value) }))}
              className="w-20 pl-4 pr-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md focus:outline-hidden focus:border-neutral-400 dark:focus:border-neutral-600"
              disabled={isLoading}
            />
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

          
          <div className="flex items-center gap-2">
            <label className="text-sm">Year:</label>
            <select
              value={filters.year}
              onChange={(e) => setFilters((prev) => ({ ...prev, year: e.target.value }))}
              className="pl-4 cursor-pointer pr-8 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md focus:outline-hidden focus:border-neutral-400 dark:focus:border-neutral-600 appearance-none bg-[length:16px_16px] bg-[right_0.5rem_center] bg-no-repeat bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNy40MSA4LjU5TDEyIDEzLjE3bDQuNTktNC41OEwxOCAxMGwtNiA2LTYtNiAxLjQxLTEuNDF6IiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==')]"
              disabled={isLoading}
            >
              <option value="all">All Years</option>
              {uniqueYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm">Season:</label>
            <div className="relative">
              <select
                value={filters.season}
                onChange={(e) => handleYearChange(Number(e.target.value))}
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


          <div className="text-sm text-neutral-500">
            Showing {searchFilteredPlayers.length} of {players.length} players
          </div>

          <Link
            href={`/${league}/teams`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-300 hover:text-neutral-400 bg-neutral-900 rounded-md border border-neutral-800 hover:border-neutral-700 transition-colors ml-auto"
          >
            <Users className="w-4 h-4" />
            View Teams Stats
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
          totalCount={sortedPlayers.length}
          overscan={{
            main: 50,
            reverse: 50,
          }}
          increaseViewportBy={{
            top: 50,
            bottom: 50,
          }}
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
                  <th className={smallerCellClass} style={{ ...firstColumnStyle, width: columnWidths.number }}>
                    #
                  </th>
                  <th className={nameTeamCellClass} style={{ ...secondColumnStyle, width: columnWidths.playerName }} onClick={() => handleSort('playerName')}>
                    Player {getSortIndicator('playerName')}
                  </th>
                  <th
                    className={nameTeamCellClass}
                    style={{
                      ...headerStyle,
                      width: columnWidths.team,
                      position: 'sticky',
                      left: columnWidths.number + columnWidths.playerName,
                      zIndex: 98,
                      backgroundClip: 'padding-box',
                    }}
                    onClick={() => handleSort('team')}
                  >
                    Team {getSortIndicator('team')}
                  </th>
                  <th className={conferenceCellClass} style={{ ...headerStyle, width: columnWidths.superCompact }} onClick={() => handleSort('conference')}>
                    Conf {getSortIndicator('conference')}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.smallStats }} onClick={() => handleSort('porpag')} title={statDescriptions.porpag}>
                    PORPAG {getSortIndicator('porpag')}
                  </th>
                  <th
                    className={cellClass}
                    style={{ ...headerStyle, width: columnWidths.smallStats }}
                    onClick={() => handleSort('boxPlusMinus')}
                    title={statDescriptions.boxPlusMinus}
                  >
                    BPM {getSortIndicator('boxPlusMinus')}
                  </th>
                  <th
                    className={cellClass}
                    style={{ ...headerStyle, width: columnWidths.smallStats }}
                    onClick={() => handleSort('offensiveBoxPlusMinus')}
                    title={statDescriptions.offensiveBoxPlusMinus}
                  >
                    OBPM {getSortIndicator('offensiveBoxPlusMinus')}
                  </th>
                  <th
                    className={cellClass}
                    style={{ ...headerStyle, width: columnWidths.smallStats }}
                    onClick={() => handleSort('defensiveBoxPlusMinus')}
                    title={statDescriptions.defensiveBoxPlusMinus}
                  >
                    DBPM {getSortIndicator('defensiveBoxPlusMinus')}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.smallStats }} onClick={() => handleSort('adjoe')} title={statDescriptions.adjoe}>
                    AdjOE {getSortIndicator('adjoe')}
                  </th>
                  <th
                    className={cellClass}
                    style={{ ...headerStyle, width: columnWidths.smallStats }}
                    onClick={() => handleSort('adjustedDefensiveRating')}
                    title={statDescriptions.adjustedDefensiveRating}
                  >
                    AdjDRtg {getSortIndicator('adjustedDefensiveRating')}
                  </th>
                  <th
                    className={cellClass}
                    style={{ ...headerStyle, width: columnWidths.smallStats }}
                    onClick={() => handleSort('gameBoxPlusMinus')}
                    title={statDescriptions.gameBoxPlusMinus}
                  >
                    GBPM {getSortIndicator('gameBoxPlusMinus')}
                  </th>
                  <th
                    className={cellClass}
                    style={{ ...headerStyle, width: columnWidths.smallStats }}
                    onClick={() => handleSort('offensiveGameBoxPlusMinus')}
                    title={statDescriptions.offensiveGameBoxPlusMinus}
                  >
                    OGBPM {getSortIndicator('offensiveGameBoxPlusMinus')}
                  </th>
                  <th
                    className={cellClass}
                    style={{ ...headerStyle, width: columnWidths.smallStats }}
                    onClick={() => handleSort('defensiveGameBoxPlusMinus')}
                    title={statDescriptions.defensiveGameBoxPlusMinus}
                  >
                    DGBPM {getSortIndicator('defensiveGameBoxPlusMinus')}
                  </th>
 
                  <th
                    className={cellClass}
                    style={{ ...headerStyle, width: columnWidths.compact }}
                    onClick={() => handleSort('effectiveFGPercentage')}
                    title={statDescriptions.effectiveFGPercentage}
                  >
                    eFG% {getSortIndicator('effectiveFGPercentage')}
                  </th>
                  <th
                    className={cellClass}
                    style={{ ...headerStyle, width: columnWidths.compact }}
                    onClick={() => handleSort('trueShootingPercentage')}
                    title={statDescriptions.trueShootingPercentage}
                  >
                    TS% {getSortIndicator('trueShootingPercentage')}
                  </th>
                  <th
                    className={cellClass}
                    style={{ ...headerStyle, width: columnWidths.compact }}
                    onClick={() => handleSort('assistToTurnover')}
                    title={statDescriptions.assistToTurnover}
                  >
                    AST/TO {getSortIndicator('assistToTurnover')}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.compact }} onClick={() => handleSort('usage')} title={statDescriptions.usage}>
                    Usage {getSortIndicator('usage')}
                  </th>
                  <th
                    className={cellClass}
                    style={{ ...headerStyle, width: columnWidths.basicStats }}
                    onClick={() => handleSort('minutesPercentage')}
                    title={statDescriptions.minutesPercentage}
                  >
                    Min% {getSortIndicator('minutesPercentage')}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.basicStats }} onClick={() => handleSort('minutesPerGame')}>
                    MPG {getSortIndicator('minutesPerGame')}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.basicStats }} onClick={() => handleSort('points')}>
                    PTS {getSortIndicator('points')}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.basicStats }} onClick={() => handleSort('assists')}>
                    AST {getSortIndicator('assists')}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.basicStats }} onClick={() => handleSort('totalRebounds')}>
                    TReb {getSortIndicator('totalRebounds')}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.basicStats }} onClick={() => handleSort('steals')}>
                    STL {getSortIndicator('steals')}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.basicStats }} onClick={() => handleSort('blocks')}>
                    BLK {getSortIndicator('blocks')}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.basicStats }} onClick={() => handleSort('offensiveRebounds')}>
                    OReb {getSortIndicator('offensiveRebounds')}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.basicStats }} onClick={() => handleSort('defensiveRebounds')}>
                    DReb {getSortIndicator('defensiveRebounds')}
                  </th>
                  <th
                    className={cellClass}
                    style={{ ...headerStyle, width: columnWidths.compact }}
                    onClick={() => handleSort('offensiveReboundPercentage')}
                    title={statDescriptions.offensiveReboundPercentage}
                  >
                    OR% {getSortIndicator('offensiveReboundPercentage')}
                  </th>
                  <th
                    className={cellClass}
                    style={{ ...headerStyle, width: columnWidths.compact }}
                    onClick={() => handleSort('defensiveReboundPercentage')}
                    title={statDescriptions.defensiveReboundPercentage}
                  >
                    DR% {getSortIndicator('defensiveReboundPercentage')}
                  </th>
                  <th
                    className={cellClass}
                    style={{ ...headerStyle, width: columnWidths.compact }}
                    onClick={() => handleSort('assistPercentage')}
                    title={statDescriptions.assistPercentage}
                  >
                    AST% {getSortIndicator('assistPercentage')}
                  </th>
                  <th
                    className={cellClass}
                    style={{ ...headerStyle, width: columnWidths.compact }}
                    onClick={() => handleSort('turnoverPercentage')}
                    title={statDescriptions.turnoverPercentage}
                  >
                    TO% {getSortIndicator('turnoverPercentage')}
                  </th>
                  <th
                    className={cellClass}
                    style={{ ...headerStyle, width: columnWidths.compact }}
                    onClick={() => handleSort('stealPercentage')}
                    title={statDescriptions.stealPercentage}
                  >
                    STL% {getSortIndicator('stealPercentage')}
                  </th>
                  <th
                    className={cellClass}
                    style={{ ...headerStyle, width: columnWidths.smallStats }}
                    onClick={() => handleSort('freeThrowsMade')}
                    title="Free throws made-attempted"
                  >
                    FT {getSortIndicator('freeThrowsMade')}
                  </th>
                  <th
                    className={cellClass}
                    style={{ ...headerStyle, width: columnWidths.compact }}
                    onClick={() => handleSort('freeThrowPercentage')}
                    title={statDescriptions.freeThrowPercentage}
                  >
                    FT% {getSortIndicator('freeThrowPercentage')}
                  </th>
                  <th
                    className={cellClass}
                    style={{ ...headerStyle, width: columnWidths.smallStats }}
                    onClick={() => handleSort('twoPMade')}
                    title="2-point field goals made-attempted"
                  >
                    2P {getSortIndicator('twoPMade')}
                  </th>
                  <th
                    className={cellClass}
                    style={{ ...headerStyle, width: columnWidths.compact }}
                    onClick={() => handleSort('twoPPercentage')}
                    title={statDescriptions.twoPPercentage}
                  >
                    2P% {getSortIndicator('twoPPercentage')}
                  </th>
                  <th
                    className={cellClass}
                    style={{ ...headerStyle, width: columnWidths.smallStats }}
                    onClick={() => handleSort('threePMade')}
                    title="3-point field goals made-attempted"
                  >
                    3P {getSortIndicator('threePMade')}
                  </th>
                  <th
                    className={cellClass}
                    style={{ ...headerStyle, width: columnWidths.compact }}
                    onClick={() => handleSort('threePPercentage')}
                    title={statDescriptions.threePPercentage}
                  >
                    3P% {getSortIndicator('threePPercentage')}
                  </th>
                  <th
                    className={cellClass}
                    style={{ ...headerStyle, width: columnWidths.smallStats }}
                    onClick={() => handleSort('offensiveRating')}
                    title={statDescriptions.offensiveRating}
                  >
                    ORtg {getSortIndicator('offensiveRating')}
                  </th>
                  <th
                    className={cellClass}
                    style={{ ...headerStyle, width: columnWidths.smallStats }}
                    onClick={() => handleSort('defensiveRating')}
                    title={statDescriptions.defensiveRating}
                  >
                    DRtg {getSortIndicator('defensiveRating')}
                  </th>
                  <th
                    className={cellClass}
                    style={{ ...headerStyle, width: columnWidths.default }}
                    onClick={() => handleSort('defensivePorpag')}
                    title={statDescriptions.defensivePorpag}
                  >
                    DPORPAG {getSortIndicator('defensivePorpag')}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.smallStats }} onClick={() => handleSort('rimMakes')} title="Rim shots made-attempted">
                    Rim {getSortIndicator('rimMakes')}
                  </th>
                  <th
                    className={cellClass}
                    style={{ ...headerStyle, width: columnWidths.compact }}
                    onClick={() => handleSort('rimPercentage')}
                    title={statDescriptions.rimPercentage}
                  >
                    Rim% {getSortIndicator('rimPercentage')}
                  </th>
                  <th
                    className={cellClass}
                    style={{ ...headerStyle, width: columnWidths.smallStats }}
                    onClick={() => handleSort('midRangeMakes')}
                    title="Mid-range shots made-attempted"
                  >
                    Mid {getSortIndicator('midRangeMakes')}
                  </th>
                  <th
                    className={cellClass}
                    style={{ ...headerStyle, width: columnWidths.compact }}
                    onClick={() => handleSort('midRangePercentage')}
                    title={statDescriptions.midRangePercentage}
                  >
                    Mid% {getSortIndicator('midRangePercentage')}
                  </th>
                  <th
                    className={cellClass}
                    style={{ ...headerStyle, width: columnWidths.compact }}
                    onClick={() => handleSort('threePPer100')}
                    title={statDescriptions.threePPer100}
                  >
                    3P/100 {getSortIndicator('threePPer100')}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.default }} onClick={() => handleSort('role')}>
                    Role {getSortIndicator('role')}
                  </th>
                  <th className={smallerCellClass} style={{ ...headerStyle, width: columnWidths.superCompact }} onClick={() => handleSort('year')}>
                    Year {getSortIndicator('year')}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.superCompact }} onClick={() => handleSort('height')}>
                    Height {getSortIndicator('height')}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.hometown }} onClick={() => handleSort('hometown')}>
                    Hometown {getSortIndicator('hometown')}
                  </th>
                  <th className={cellClass} style={{ ...headerStyle, width: columnWidths.superCompact }} onClick={() => handleSort('recruitRank')} title="Recruit Rank">
                    RR {getSortIndicator('recruitRank')}
                  </th>
                </tr>
              </thead>
            ),
            TableRow: MemoizedTableRow,
          }}
          fixedHeaderContent={() => null}
          itemContent={(index) => {
            const player = sortedPlayers[index];
            return (
              <>
                <td
                  key="rank"
                  className={smallerCellClass}
                  style={{
                    ...getCachedCellStyle({}, index, true),
                    width: columnWidths.number,
                    position: 'sticky',
                    left: 0,
                    zIndex: 98,
                    backgroundClip: 'padding-box',
                  }}
                >
                  {globalRankMap.get(`${player.playerName}_${player.team}`) || index + 1}
                </td>
                <td
                  key="name"
                  className={nameTeamCellClass}
                  style={{
                    ...getCachedCellStyle({}, index, true),
                    width: columnWidths.playerName,
                    position: 'sticky',
                    left: columnWidths.number,
                    zIndex: 98,
                    backgroundClip: 'padding-box',
                  }}
                >
                  {player.playerName}
                </td>
                <td
                  key="team"
                  className={nameTeamCellClass}
                  style={{
                    ...getCachedCellStyle({}, index, true),
                    width: columnWidths.team,
                    position: 'sticky',
                    left: columnWidths.number + columnWidths.playerName,
                    zIndex: 98,
                    backgroundClip: 'padding-box',
                  }}
                >
                  {
                    (() => {
                      const teamData = findTeamData(player.team);
                      if (teamData) {
                        return (
                          <div className="flex items-center gap-1">
                            {teamData.logos && (
                              <Link href={`/${league}/${teamData.id}`} className="flex items-center gap-1 hover:opacity-80">
                                <Image
                                  src={DARK_COLORED_LOGOS.includes(teamData.displayName) ? teamData.logos[1].href : teamData.logos[0].href}
                                  alt={``}
                                  width={20}
                                  height={20}
                                  className="w-5 h-5"
                                  unoptimized
                                />
                                <span className="text-indigo-300 hover:text-indigo-200">{teamData.nickname}</span>
                              </Link>
                            )}
                          </div>
                        );
                      }
                      return <span className="text-indigo-300">{player.team}</span>;
                    })() as React.ReactNode
                  }
                </td>
                <td key="conf" className={conferenceCellClass} style={{ ...getCachedCellStyle({}, index), width: columnWidths.superCompact }}>
                  {player.conference}
                </td>
                <td key="porpag" className={cellClass} style={{ ...getCachedCellStyle(getStatStyle(player.porpag, thresholds.porpag), index), width: columnWidths.porpag }}>
                  {player.porpag?.toFixed(2)}
                </td>
                <td
                  key="boxPlusMinus"
                  className={cellClass}
                  style={{ ...getCachedCellStyle(getStatStyle(player.boxPlusMinus, thresholds.boxPlusMinus), index), width: columnWidths.smallStats }}
                >
                  {player.boxPlusMinus?.toFixed(1)}
                </td>
                <td
                  key="offensiveBoxPlusMinus"
                  className={cellClass}
                  style={{ ...getCachedCellStyle(getStatStyle(player.offensiveBoxPlusMinus, thresholds.offensiveBoxPlusMinus, 'offensiveBoxPlusMinus'), index), width: columnWidths.smallStats }}
                >
                  {player.offensiveBoxPlusMinus?.toFixed(1)}
                </td>
                <td
                  key="defensiveBoxPlusMinus"
                  className={cellClass}
                  style={{ ...getCachedCellStyle(getStatStyle(player.defensiveBoxPlusMinus, thresholds.defensiveBoxPlusMinus), index), width: columnWidths.smallStats }}
                >
                  {player.defensiveBoxPlusMinus?.toFixed(1)}
                </td>
                <td key="adjoe" className={cellClass} style={{ ...getCachedCellStyle(getStatStyle(player.adjoe, thresholds.adjoe), index), width: columnWidths.smallStats }}>
                  {player.adjoe?.toFixed(1)}
                </td>
                <td
                  key="adjustedDefensiveRating"
                  className={cellClass}
                  style={{ ...getCachedCellStyle(getDefensiveStyle(player.adjustedDefensiveRating, thresholds.adjustedDefensiveRating), index), width: columnWidths.compact }}
                >
                  {player.adjustedDefensiveRating?.toFixed(1)}
                </td>
                <td
                  key="gameBoxPlusMinus"
                  className={cellClass}
                  style={{ ...getCachedCellStyle(getStatStyle(player.gameBoxPlusMinus, thresholds.gameBoxPlusMinus), index), width: columnWidths.default }}
                >
                  {player.gameBoxPlusMinus?.toFixed(1)}
                </td>
                <td
                  key="offensiveGameBoxPlusMinus"
                  className={cellClass}
                  style={{ ...getCachedCellStyle(getStatStyle(player.offensiveGameBoxPlusMinus, thresholds.offensiveGameBoxPlusMinus), index), width: columnWidths.default }}
                >
                  {player.offensiveGameBoxPlusMinus?.toFixed(1)}
                </td>
                <td
                  key="defensiveGameBoxPlusMinus"
                  className={cellClass}
                  style={{ ...getCachedCellStyle(getStatStyle(player.defensiveGameBoxPlusMinus, thresholds.defensiveGameBoxPlusMinus), index), width: columnWidths.default }}
                >
                  {player.defensiveGameBoxPlusMinus?.toFixed(1)}
                </td>
  
                <td
                  key="effectiveFGPercentage"
                  className={cellClass}
                  style={{ ...getCachedCellStyle(getStatStyle(player.effectiveFGPercentage, thresholds.effectiveFGPercentage, 'effectiveFGPercentage'), index), width: columnWidths.compact }}
                >
                  {player.effectiveFGPercentage?.toFixed(1)}
                </td>
                <td
                  key="trueShootingPercentage"
                  className={cellClass}
                  style={{ ...getCachedCellStyle(getStatStyle(player.trueShootingPercentage, thresholds.trueShootingPercentage, 'trueShootingPercentage'), index), width: columnWidths.compact }}
                >
                  {player.trueShootingPercentage?.toFixed(1)}
                </td>
                <td
                  key="assistToTurnover"
                  className={cellClass}
                  style={{ ...getCachedCellStyle(getStatStyle(player.assistToTurnover, thresholds.assistToTurnover), index), width: columnWidths.compact }}
                >
                  {player.assistToTurnover?.toFixed(2)}
                </td>
                <td key="usage" className={cellClass} style={{ ...getCachedCellStyle(getStatStyle(player.usage, thresholds.usage), index), width: columnWidths.smallStats }}>
                  {player.usage?.toFixed(1)}
                </td>
                <td
                  key="minutesPercentage"
                  className={cellClass}
                  style={{ ...getCachedCellStyle({}, index), width: columnWidths.compact }}
                >
                  {player.minutesPercentage?.toFixed(1)}
                </td>
                <td
                  key="minutesPerGame"
                  className={cellClass}
                  style={{ ...getCachedCellStyle({}, index), width: columnWidths.basicStats }}
                >
                  {player.minutesPerGame?.toFixed(1)}
                </td>
                <td key="points" className={cellClass} style={{ ...getCachedCellStyle(getStatStyle(player.points, thresholds.points), index), width: columnWidths.basicStats }}>
                  {player.points?.toFixed(1)}
                </td>
                <td key="assists" className={cellClass} style={{ ...getCachedCellStyle(getStatStyle(player.assists, thresholds.assists), index), width: columnWidths.basicStats }}>
                  {player.assists?.toFixed(1)}
                </td>
                <td
                  key="totalRebounds"
                  className={cellClass}
                  style={{ ...getCachedCellStyle(getStatStyle(player.totalRebounds, thresholds.totalRebounds), index), width: columnWidths.basicStats }}
                >
                  {player.totalRebounds?.toFixed(1)}
                </td>
                <td key="steals" className={cellClass} style={{ ...getCachedCellStyle(getStatStyle(player.steals, thresholds.steals), index), width: columnWidths.basicStats }}>
                  {player.steals?.toFixed(1)}
                </td>
                <td key="blocks" className={cellClass} style={{ ...getCachedCellStyle(getStatStyle(player.blocks, thresholds.blocks), index), width: columnWidths.basicStats }}>
                  {player.blocks?.toFixed(1)}
                </td>
                <td
                  key="offensiveRebounds"
                  className={cellClass}
                  style={{ ...getCachedCellStyle(getStatStyle(player.offensiveRebounds, thresholds.offensiveRebounds, 'offensiveRebounds'), index), width: columnWidths.basicStats }}
                >
                  {player.offensiveRebounds?.toFixed(1)}
                </td>
                <td
                  key="defensiveRebounds"
                  className={cellClass}
                  style={{ ...getCachedCellStyle(getStatStyle(player.defensiveRebounds, thresholds.defensiveRebounds, 'defensiveRebounds'), index), width: columnWidths.basicStats }}
                >
                  {player.defensiveRebounds?.toFixed(1)}
                </td>
                <td
                  key="offensiveReboundPercentage"
                  className={cellClass}
                  style={{ ...getCachedCellStyle(getStatStyle(player.offensiveReboundPercentage, thresholds.offensiveReboundPercentage, 'offensiveReboundPercentage'), index), width: columnWidths.compact }}
                >
                  {player.offensiveReboundPercentage?.toFixed(1)}
                </td>
                <td
                  key="defensiveReboundPercentage"
                  className={cellClass}
                  style={{ ...getCachedCellStyle(getStatStyle(player.defensiveReboundPercentage, thresholds.defensiveReboundPercentage, 'defensiveReboundPercentage'), index), width: columnWidths.compact }}
                >
                  {player.defensiveReboundPercentage?.toFixed(1)}
                </td>
                <td
                  key="assistPercentage"
                  className={cellClass}
                  style={{ ...getCachedCellStyle(getStatStyle(player.assistPercentage, thresholds.assistPercentage, 'assistPercentage'), index), width: columnWidths.compact }}
                >
                  {player.assistPercentage?.toFixed(1)}
                </td>
                <td
                  key="turnoverPercentage"
                  className={cellClass}
                  style={{ ...getCachedCellStyle(getTurnoverStyle(player.turnoverPercentage, thresholds.turnoverPercentage), index), width: columnWidths.compact }}
                >
                  {player.turnoverPercentage?.toFixed(1)}
                </td>
                <td
                  key="stealPercentage"
                  className={cellClass}
                  style={{ ...getCachedCellStyle(getStatStyle(player.stealPercentage, thresholds.stealPercentage, 'stealPercentage'), index), width: columnWidths.compact }}
                >
                  {player.stealPercentage?.toFixed(1)}
                </td>
                <td
                  key="freeThrows"
                  className={`${cellClass} whitespace-nowrap`}
                  style={{ ...getCachedCellStyle(getStatStyle(player.freeThrowsMade, thresholds.freeThrowsMade), index), width: columnWidths.smallStats }}
                >
                  {`${Math.round(player.freeThrowsMade)}-${Math.round(player.freeThrowsAttempted)}`}
                </td>
                <td
                  key="freeThrowPercentage"
                  className={cellClass}
                  style={{ ...getCachedCellStyle(getStatStyle(player.freeThrowPercentage * 100, thresholds.freeThrowPercentage), index), width: columnWidths.compact }}
                >
                  {(player.freeThrowPercentage * 100)?.toFixed(1)}
                </td>
                <td
                  key="twoPoint"
                  className={`${cellClass} whitespace-nowrap`}
                  style={{ ...getCachedCellStyle(getStatStyle(player.twoPMade, thresholds.twoPMade, 'twoPMade'), index), width: columnWidths.smallStats }}
                >
                  {`${Math.round(player.twoPMade)}-${Math.round(player.twoPAttempted)}`}
                </td>
                <td
                  key="twoPPercentage"
                  className={cellClass}
                  style={{ ...getCachedCellStyle(getStatStyle(player.twoPPercentage * 100, thresholds.twoPPercentage), index), width: columnWidths.compact }}
                >
                  {(player.twoPPercentage * 100)?.toFixed(1)}
                </td>
                <td
                  key="threePoint"
                  className={`${cellClass} whitespace-nowrap`}
                  style={{ ...getCachedCellStyle(getStatStyle(player.threePMade, thresholds.threePMade, 'threePMade'), index), width: columnWidths.smallStats }}
                >
                  {`${Math.round(player.threePMade)}-${Math.round(player.threePAttempted)}`}
                </td>
                <td
                  key="threePPercentage"
                  className={cellClass}
                  style={{ ...getCachedCellStyle(getStatStyle(player.threePPercentage * 100, thresholds.threePPercentage), index), width: columnWidths.compact }}
                >
                  {(player.threePPercentage * 100)?.toFixed(1)}
                </td>
                <td
                  key="offensiveRating"
                  className={cellClass}
                  style={{ ...getCachedCellStyle(getStatStyle(player.offensiveRating, thresholds.offensiveRating), index), width: columnWidths.smallStats }}
                >
                  {player.offensiveRating?.toFixed(1)}
                </td>
                <td
                  key="defensiveRating"
                  className={cellClass}
                  style={{ ...getCachedCellStyle(getDefensiveStyle(player.defensiveRating, thresholds.defensiveRating), index), width: columnWidths.smallStats }}
                >
                  {player.defensiveRating?.toFixed(1)}
                </td>
                <td
                  key="defensivePorpag"
                  className={cellClass}
                  style={{ ...getCachedCellStyle(getStatStyle(player.defensivePorpag, thresholds.defensivePorpag, 'defensivePorpag'), index), width: columnWidths.default }}
                >
                  {player.defensivePorpag?.toFixed(2)}
                </td>
                <td
                  key="rimMakes"
                  className={`${cellClass} whitespace-nowrap`}
                  style={{ ...getCachedCellStyle(getStatStyle(player.rimMakes, thresholds.rimMakes), index), width: columnWidths.smallStats }}
                >
                  {`${player.rimMakes}-${player.rimAttempts}`}
                </td>
                <td
                  key="rimPercentage"
                  className={cellClass}
                  style={{ ...getCachedCellStyle(getStatStyle(player.rimPercentage * 100, thresholds.rimPercentage, 'rimPercentage', player.rimAttempts), index), width: columnWidths.compact }}
                >
                  {(player.rimPercentage * 100)?.toFixed(1)}
                </td>
                <td
                  key="midRangeMakes"
                  className={`${cellClass} whitespace-nowrap`}
                  style={{ ...getCachedCellStyle(getStatStyle(player.midRangeMakes, thresholds.midRangeMakes), index), width: columnWidths.smallStats }}
                >
                  {`${player.midRangeMakes}-${player.midRangeAttempts}`}
                </td>
                <td
                  key="midRangePercentage"
                  className={cellClass}
                  style={{ ...getCachedCellStyle(getStatStyle(player.midRangePercentage * 100, thresholds.midRangePercentage, 'midRangePercentage', player.midRangeAttempts), index), width: columnWidths.compact }}
                >
                  {(player.midRangePercentage * 100)?.toFixed(1)}
                </td>
                <td
                  key="threePPer100"
                  className={cellClass}
                  style={{ ...getCachedCellStyle(getStatStyle(player.threePPer100, thresholds.threePPer100), index), width: columnWidths.compact }}
                >
                  {player.threePPer100?.toFixed(1)}
                </td>
                <td key="role" className={cellClass} style={{ ...getCachedCellStyle({}, index), width: columnWidths.default }}>
                  {player.role}
                </td>
                <td key="year" className={cellClass} style={{ ...getCachedCellStyle({}, index), width: columnWidths.superCompact }}>
                  {player.year}
                </td>
                <td key="height" className={cellClass} style={{ ...getCachedCellStyle({}, index), width: columnWidths.superCompact }}>
                  {player.height}
                </td>
                <td key="hometown" className={cellClass} style={{ ...getCachedCellStyle({}, index), width: columnWidths.hometown }}>
                  {player.hometown}
                </td>
                <td
                  key="recruitRank"
                  className={cellClass}
                  style={{ ...getCachedCellStyle({}, index), width: columnWidths.superCompact }}
                  onClick={() => handleSort('recruitRank')}
                  title="Recruit Rank"
                >
                  {player.recruitRank}
                </td>
              </>
            );
          }}
        />
      </div>
    </div>
  );
}
