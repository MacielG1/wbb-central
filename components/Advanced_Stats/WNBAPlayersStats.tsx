'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import React from 'react';
import { calculateAllThresholds, getStatStyle, getTurnoverStyle, getDefensiveStyle, getPersonalFoulsStyle, statDescriptions } from '@/lib/statsColors';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { TableVirtuoso } from 'react-virtuoso';
import { MoveDown, MoveUp, Loader2, Users } from 'lucide-react';
import { fetchWNBAPlayerStats, WNBAPlayerStats } from '@/utils/WNBA/fetchPlayersStats';
import { getTeamLogoUrl } from '@/utils/WNBA/teamLogos';

const getFullTeamName = (teamAbbr: string): string => {
  const teamMapping: { [key: string]: string } = {
    ATL: 'Atlanta Dream',
    CHI: 'Chicago Sky',
    CON: 'Connecticut Sun',
    DAL: 'Dallas Wings',
    GSV: 'Golden State Valkyries',
    IND: 'Indiana Fever',
    LV: 'Las Vegas Aces',
    LVA: 'Las Vegas Aces',
    LA: 'Los Angeles Sparks',
    LAS: 'Los Angeles Sparks',
    MIN: 'Minnesota Lynx',
    NY: 'New York Liberty',
    NYL: 'New York Liberty',
    PHO: 'Phoenix Mercury',
    PHX: 'Phoenix Mercury',
    SEA: 'Seattle Storm',
    WAS: 'Washington Mystics',
    WSH: 'Washington Mystics',
  };

  return teamMapping[teamAbbr] || teamAbbr;
};

const getTeamLogo = (teamAbbr: string): string => {
  return getTeamLogoUrl(teamAbbr);
};

type SortConfig = {
  key: keyof WNBAPlayerStats | null;
  direction: 'asc' | 'desc';
};

interface FilterConfig {
  minMinutes: number;
  minGames: number;
  search: string;
  season: number;
  team: string;
}

interface WNBAPlayersStatsProps {
  initialData: WNBAPlayerStats[];
}

const generateSeasonOptions = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  // Show 5 years (current year and 4 previous years)
  const startYear = currentYear - 4;
  return Array.from({ length: 5 }, (_, i) => startYear + i);
};

export default function WNBAPlayersStats({ initialData }: WNBAPlayersStatsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const league = pathname?.split('/')[1];

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  const yearParam = searchParams.get('year');
  const initialYear = yearParam ? parseInt(yearParam, 10) : currentYear;

  const [players, setPlayers] = useState<WNBAPlayerStats[]>(initialData);
  const [inputValue, setInputValue] = useState('');
  const [filters, setFilters] = useState<FilterConfig>({
    minMinutes: 10,
    minGames: 5,
    search: '',
    season: initialYear,
    team: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [hasAutoSelectedYear, setHasAutoSelectedYear] = useState(false);

  const fetchYearData = async (year: number) => {
    setIsLoading(true);
    try {
      const data = await fetchWNBAPlayerStats(year);
      setPlayers(data);
      setSelectedPlayerId(null);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleYearChange = (year: number) => {
    setFilters((prev) => ({ ...prev, season: year }));

    const params = new URLSearchParams(searchParams.toString());
    params.set('year', year.toString());
    router.push(`${pathname}?${params.toString()}`);

    fetchYearData(year);
  };

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({ ...prev, team: e.target.value }));
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

  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'points', direction: 'desc' });

  // Get unique teams for dropdown
  const teamOptions = useMemo(() => {
    const teams = Array.from(new Set(players.map((p) => p.team)));
    teams.sort();
    return teams;
  }, [players]);

  const qualifiedPlayers = useMemo(() => {
    const minMinutes = filters.minMinutes;
    const minGames = filters.minGames;
    const team = filters.team;

    // Get the maximum number of games played by any player
    const maxGamesPlayed = Math.max(...players.map((player) => player.gamesPlayed));

    // Only apply minGames filter if at least 10 games have been played
    const effectiveMinGames = maxGamesPlayed >= 10 ? minGames : 0;

    return players.filter((player) => {
      if (player.minutes < minMinutes || player.gamesPlayed < effectiveMinGames) return false;
      if (team && player.team !== team) return false;
      return true;
    });
  }, [players, filters.minMinutes, filters.minGames, filters.team]);

  // Calculate effective min games for display
  const effectiveMinGames = useMemo(() => {
    const maxGamesPlayed = Math.max(...players.map((player) => player.gamesPlayed));
    return maxGamesPlayed >= 10 ? filters.minGames : 0;
  }, [players, filters.minGames]);

  const thresholds = useMemo(() => calculateAllThresholds(qualifiedPlayers), [qualifiedPlayers]);

  const searchFilteredPlayers = useMemo(() => {
    const searchTerm = filters.search.toLowerCase();
    if (!searchTerm) return qualifiedPlayers;

    const searchTerms = searchTerm.split(' ').filter(Boolean);

    return qualifiedPlayers.filter((player) => {
      const searchableText = `${player.playerName.toLowerCase()} ${player.team.toLowerCase()}`;

      return searchTerms.every((term) => searchableText.includes(term));
    });
  }, [qualifiedPlayers, filters.search]);

  const sortedPlayers = useMemo(() => {
    if (!sortConfig.key) return searchFilteredPlayers;

    return [...searchFilteredPlayers].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        // Special case: turnovers should always be sorted lowest-to-highest (ascending)
        if (sortConfig.key === 'turnovers') {
          const comparison = aValue - bValue;
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        }
        const comparison = aValue - bValue;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      const comparison = String(aValue).localeCompare(String(bValue));
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [searchFilteredPlayers, sortConfig]);

  const globalRankMap = useMemo(() => {
    if (!sortConfig.key) return new Map();

    const rankMap = new Map();

    const sortedAllPlayers = [...qualifiedPlayers].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const comparison = aValue - bValue;
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
  }, [qualifiedPlayers, sortConfig]);

  const handleSort = (key: keyof WNBAPlayerStats) => {
    setSortConfig((prevConfig) => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const handleRowClick = useCallback(
    (index: number) => {
      if (index >= 0 && index < sortedPlayers.length) {
        const player = sortedPlayers[index];
        const playerId = `${player.playerName}_${player.team}`;
        setSelectedPlayerId((prevId) => (prevId === playerId ? null : playerId));
      }
    },
    [sortedPlayers]
  );

  const selectedRowIndex = useMemo(() => {
    if (!selectedPlayerId) return null;
    return sortedPlayers.findIndex((player) => `${player.playerName}_${player.team}` === selectedPlayerId);
  }, [selectedPlayerId, sortedPlayers]);

  const columnWidths = {
    rank: 35,
    superCompact: 50,
    basicStats: 55,
    compact: 60,
    smallStats: 65,
    default: 80,
    team: 130,
    playerName: 115,
    gp: 50,
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

  const getSortIndicator = (key: keyof WNBAPlayerStats) => {
    if (sortConfig.key !== key) return null;
    return (
      <span className="absolute right-0 top-1/2 -translate-y-1/2">
        {sortConfig.direction === 'asc' ? <MoveUp className="w-2.5 h-2.5" /> : <MoveDown className="w-2.5 h-2.5" />}
      </span>
    );
  };

  const getRowStyle = useCallback(
    (index: number) => ({
      cursor: 'pointer',
      backgroundColor: selectedRowIndex === index ? '#1a1835' : '#171717',
      borderLeft: selectedRowIndex === index ? '2px solid #4f39f640' : '2px solid #171717',
      borderRight: selectedRowIndex === index ? '2px solid #4f39f640' : '2px solid #171717',
      borderTop: selectedRowIndex === index ? '1px solid #4f39f640' : '1px solid #171717',
      borderBottom: selectedRowIndex === index ? '1px solid #4f39f640' : '1px solid #171717',
    }),
    [selectedRowIndex]
  );

  const getCellStyle = useCallback(
    (baseStyle: any, index: number, isFixed: boolean = false) => {
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
    },
    [selectedRowIndex]
  );

  const MemoizedTableRow = useMemo(
    () =>
      React.memo(({ item: _item, ...props }: any) => {
        const index = props['data-index'] as number;
        return <tr {...props} className="border-b bg-neutral-900 hover:bg-gray-50 text-xs" onClick={() => handleRowClick(index)} style={getRowStyle(index)} />;
      }),
    [handleRowClick, getRowStyle]
  );

  const cellStyleCache = useMemo(() => new Map<string, React.CSSProperties>(), []);
  const getCachedCellStyle = useCallback(
    (baseStyle: any, index: number, isFixed: boolean = false) => {
      const key = `${JSON.stringify(baseStyle)}-${index}-${isFixed}-${selectedRowIndex === index}`;
      if (!cellStyleCache.has(key)) {
        cellStyleCache.set(key, getCellStyle(baseStyle, index, isFixed));
      }
      return cellStyleCache.get(key);
    },
    [selectedRowIndex, getCellStyle, cellStyleCache]
  );

  useEffect(() => {
    async function autoSelectMostRecentYearWithData() {
      // Only run if there is NO year param in the URL
      if (!yearParam && players.length === 0 && !isLoading && !hasAutoSelectedYear) {
        const years = generateSeasonOptions().slice().reverse();
        for (const year of years) {
          if (year === filters.season) continue;
          const data = await fetchWNBAPlayerStats(year);
          if (data && data.length > 0) {
            setFilters((prev) => ({ ...prev, season: year }));
            setPlayers(data);

            const params = new URLSearchParams(searchParams.toString());
            params.set('year', year.toString());
            router.replace(`${pathname}?${params.toString()}`);
            setHasAutoSelectedYear(true);
            break;
          }
        }
      }
    }
    autoSelectMostRecentYearWithData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players, isLoading, filters.season, hasAutoSelectedYear, yearParam]);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-neutral-950 ">
      <div className="p-2 border-b border-neutral-800 flex-shrink-0">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={handleSearchChange}
              placeholder="Search player or team..."
              className="w-full pl-4 pr-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md focus:outline-hidden focus:border-neutral-400 dark:focus:border-neutral-600"
              disabled={isLoading || !players.length}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm">Min Minutes:</label>
            <input
              type="number"
              value={filters.minMinutes}
              min={0}
              onChange={(e) => setFilters((prev) => ({ ...prev, minMinutes: Math.max(0, Number(e.target.value)) }))}
              className="w-20 pl-4 pr-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md focus:outline-hidden focus:border-neutral-400 dark:focus:border-neutral-600"
              disabled={isLoading || !players.length}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm">Min Games:</label>
            <input
              type="number"
              value={effectiveMinGames}
              min={0}
              onChange={(e) => setFilters((prev) => ({ ...prev, minGames: Math.max(0, Number(e.target.value)) }))}
              className="w-20 pl-4 pr-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md focus:outline-hidden focus:border-neutral-400 dark:focus:border-neutral-600"
              disabled={isLoading || !players.length}
            />
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
                    {year}
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
            <label className="text-sm">Team:</label>
            <select
              value={filters.team}
              onChange={handleTeamChange}
              className="pl-4 pr-8 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md focus:outline-hidden focus:border-neutral-400 dark:focus:border-neutral-600 appearance-none"
              disabled={isLoading || !players.length}
            >
              <option value="">All</option>
              {teamOptions.map((team) => (
                <option key={team} value={team}>
                  {getFullTeamName(team)}
                </option>
              ))}
            </select>
          </div>

          <div className="text-sm text-neutral-500">{players.length > 0 && `Showing ${searchFilteredPlayers.length} of ${players.length} players`}</div>

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

        {/* Show simple message when no data is available */}
        {!players.length && !isLoading ? (
          <div className="flex-1 flex items-center justify-center mt-10">
            <div className="text-center p-6 rounded-lg bg-neutral-900/50 border border-neutral-800">
              <h2 className="text-2xl font-semibold mb-2">No stats available for this year yet</h2>
            </div>
          </div>
        ) : players.length && thresholds ? (
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
                    <th className={smallerCellClass} style={{ ...firstColumnStyle, width: columnWidths.rank }} onClick={() => handleSort('rank')}>
                      Rank {getSortIndicator('rank')}
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
                        left: columnWidths.rank + columnWidths.playerName,
                        zIndex: 98,
                        backgroundClip: 'padding-box',
                      }}
                      onClick={() => handleSort('team')}
                    >
                      Team {getSortIndicator('team')}
                    </th>
                    <th className={cellClass} style={{ ...headerStyle, width: columnWidths.gp }} onClick={() => handleSort('gamesPlayed')} title={statDescriptions.gamesPlayed}>
                      GP {getSortIndicator('gamesPlayed')}
                    </th>
                    <th className={cellClass} style={{ ...headerStyle, width: columnWidths.basicStats }} onClick={() => handleSort('minutes')} title={statDescriptions.minutes}>
                      MIN {getSortIndicator('minutes')}
                    </th>
                    <th className={cellClass} style={{ ...headerStyle, width: columnWidths.basicStats }} onClick={() => handleSort('points')} title={statDescriptions.points}>
                      PTS {getSortIndicator('points')}
                    </th>
                    <th className={cellClass} style={{ ...headerStyle, width: columnWidths.basicStats }} onClick={() => handleSort('assists')} title={statDescriptions.assists}>
                      AST {getSortIndicator('assists')}
                    </th>
                    <th className={cellClass} style={{ ...headerStyle, width: columnWidths.basicStats }} onClick={() => handleSort('rebounds')} title={statDescriptions.rebounds}>
                      REB {getSortIndicator('rebounds')}
                    </th>
                    <th className={cellClass} style={{ ...headerStyle, width: columnWidths.basicStats }} onClick={() => handleSort('steals')} title={statDescriptions.steals}>
                      STL {getSortIndicator('steals')}
                    </th>
                    <th className={cellClass} style={{ ...headerStyle, width: columnWidths.basicStats }} onClick={() => handleSort('blocks')} title={statDescriptions.blocks}>
                      BLK {getSortIndicator('blocks')}
                    </th>
                    <th className={cellClass} style={{ ...headerStyle, width: columnWidths.basicStats }} onClick={() => handleSort('personalFoulsDrawn')} title={statDescriptions.personalFoulsDrawn}>
                      PFD {getSortIndicator('personalFoulsDrawn')}
                    </th>
                    <th className={cellClass} style={{ ...headerStyle, width: columnWidths.basicStats }} onClick={() => handleSort('plusMinus')} title={statDescriptions.plusMinus}>
                      +/- {getSortIndicator('plusMinus')}
                    </th>
                    <th className={cellClass} style={{ ...headerStyle, width: columnWidths.basicStats }} onClick={() => handleSort('fgMade')} title={statDescriptions.fgMade}>
                      FGM {getSortIndicator('fgMade')}
                    </th>
                    <th className={cellClass} style={{ ...headerStyle, width: columnWidths.basicStats }} onClick={() => handleSort('fgAttempted')} title={statDescriptions.fgAttempted}>
                      FGA {getSortIndicator('fgAttempted')}
                    </th>
                    <th className={cellClass} style={{ ...headerStyle, width: columnWidths.basicStats }} onClick={() => handleSort('fgPercentage')} title={statDescriptions.fgPercentage}>
                      FG% {getSortIndicator('fgPercentage')}
                    </th>
                    <th className={cellClass} style={{ ...headerStyle, width: columnWidths.basicStats }} onClick={() => handleSort('fg3Made')} title={statDescriptions.fg3Made}>
                      3PM {getSortIndicator('fg3Made')}
                    </th>
                    <th className={cellClass} style={{ ...headerStyle, width: columnWidths.basicStats }} onClick={() => handleSort('fg3Attempted')} title={statDescriptions.fg3Attempted}>
                      3PA {getSortIndicator('fg3Attempted')}
                    </th>
                    <th className={cellClass} style={{ ...headerStyle, width: columnWidths.basicStats }} onClick={() => handleSort('fg3Percentage')} title={statDescriptions.fg3Percentage}>
                      3P% {getSortIndicator('fg3Percentage')}
                    </th>
                    <th className={cellClass} style={{ ...headerStyle, width: columnWidths.basicStats }} onClick={() => handleSort('ftMade')} title={statDescriptions.ftMade}>
                      FTM {getSortIndicator('ftMade')}
                    </th>
                    <th className={cellClass} style={{ ...headerStyle, width: columnWidths.basicStats }} onClick={() => handleSort('ftAttempted')} title={statDescriptions.ftAttempted}>
                      FTA {getSortIndicator('ftAttempted')}
                    </th>
                    <th className={cellClass} style={{ ...headerStyle, width: columnWidths.basicStats }} onClick={() => handleSort('ftPercentage')} title={statDescriptions.ftPercentage}>
                      FT% {getSortIndicator('ftPercentage')}
                    </th>
                    <th className={cellClass} style={{ ...headerStyle, width: columnWidths.basicStats }} onClick={() => handleSort('offensiveRebounds')} title={statDescriptions.offensiveRebounds}>
                      OREB {getSortIndicator('offensiveRebounds')}
                    </th>
                    <th className={cellClass} style={{ ...headerStyle, width: columnWidths.basicStats }} onClick={() => handleSort('defensiveRebounds')} title={statDescriptions.defensiveRebounds}>
                      DREB {getSortIndicator('defensiveRebounds')}
                    </th>
                    <th className={cellClass} style={{ ...headerStyle, width: columnWidths.basicStats }} onClick={() => handleSort('turnovers')} title={statDescriptions.turnovers}>
                      TOV {getSortIndicator('turnovers')}
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
                      width: columnWidths.rank,
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
                      left: columnWidths.rank,
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
                      left: columnWidths.rank + columnWidths.playerName,
                      zIndex: 98,
                      backgroundClip: 'padding-box',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="relative w-5 h-5 flex-shrink-0">
                        <Image src={getTeamLogo(player.team)} alt={`${player.team} logo`} width={20} height={20} className="object-contain" />
                      </div>
                      <span className="text-indigo-300">{getFullTeamName(player.team)}</span>
                    </div>
                  </td>
                  <td key="gp" className={cellClass} style={{ ...getCachedCellStyle({}, index), width: columnWidths.gp }}>
                    {player.gamesPlayed}
                  </td>
                  <td key="minutes" className={cellClass} style={{ ...getCachedCellStyle({}, index), width: columnWidths.basicStats }}>
                    {player.minutes.toFixed(1)}
                  </td>
                  <td
                    key="points"
                    className={cellClass}
                    style={{
                      ...getCachedCellStyle(getStatStyle(player.points, thresholds?.points, 'points'), index),
                      width: columnWidths.basicStats,
                    }}
                  >
                    {player.points.toFixed(1)}
                  </td>
                  <td
                    key="assists"
                    className={cellClass}
                    style={{
                      ...getCachedCellStyle(getStatStyle(player.assists, thresholds?.assists, 'assists'), index),
                      width: columnWidths.basicStats,
                    }}
                  >
                    {player.assists.toFixed(1)}
                  </td>
                  <td
                    key="rebounds"
                    className={cellClass}
                    style={{
                      ...getCachedCellStyle(getStatStyle(player.rebounds, thresholds?.rebounds, 'rebounds'), index),
                      width: columnWidths.basicStats,
                    }}
                  >
                    {player.rebounds.toFixed(1)}
                  </td>
                  <td
                    key="steals"
                    className={cellClass}
                    style={{
                      ...getCachedCellStyle(getStatStyle(player.steals, thresholds?.steals, 'steals'), index),
                      width: columnWidths.basicStats,
                    }}
                  >
                    {player.steals.toFixed(1)}
                  </td>
                  <td
                    key="blocks"
                    className={cellClass}
                    style={{
                      ...getCachedCellStyle(getStatStyle(player.blocks, thresholds?.blocks, 'blocks'), index),
                      width: columnWidths.basicStats,
                    }}
                  >
                    {player.blocks.toFixed(1)}
                  </td>
                  <td
                    key="personalFoulsDrawn"
                    className={cellClass}
                    style={{
                      ...getCachedCellStyle(getStatStyle(player.personalFoulsDrawn, thresholds?.personalFoulsDrawn, 'personalFoulsDrawn'), index),
                      width: columnWidths.basicStats,
                    }}
                    title={statDescriptions.personalFoulsDrawn}
                  >
                    {player.personalFoulsDrawn.toFixed(1)}
                  </td>
                  <td
                    key="plusMinus"
                    className={cellClass}
                    style={{
                      ...getCachedCellStyle(getStatStyle(player.plusMinus, thresholds?.plusMinus, 'plusMinus'), index),
                      width: columnWidths.basicStats,
                    }}
                    title={statDescriptions.plusMinus}
                  >
                    {player.plusMinus.toFixed(1)}
                  </td>
                  <td
                    key="fgMade"
                    className={cellClass}
                    style={{
                      ...getCachedCellStyle(getStatStyle(player.fgMade, thresholds?.fgMade, 'fgMade'), index),
                      width: columnWidths.basicStats,
                    }}
                  >
                    {player.fgMade.toFixed(1)}
                  </td>
                  <td
                    key="fgAttempted"
                    className={cellClass}
                    style={{
                      ...getCachedCellStyle(getStatStyle(player.fgAttempted, thresholds?.fgAttempted, 'fgAttempted'), index),
                      width: columnWidths.basicStats,
                    }}
                  >
                    {player.fgAttempted.toFixed(1)}
                  </td>
                  <td
                    key="fgPct"
                    className={cellClass}
                    style={{
                      ...getCachedCellStyle(getStatStyle(player.fgPercentage * 100, thresholds?.fgPercentage, 'fgPercentage', player.fgAttempted), index),
                      width: columnWidths.basicStats,
                    }}
                  >
                    {(player.fgPercentage * 100).toFixed(1)}
                  </td>
                  <td
                    key="fg3Made"
                    className={cellClass}
                    style={{
                      ...getCachedCellStyle(getStatStyle(player.fg3Made, thresholds?.fg3Made, 'fg3Made'), index),
                      width: columnWidths.basicStats,
                    }}
                  >
                    {player.fg3Made.toFixed(1)}
                  </td>
                  <td
                    key="fg3Attempted"
                    className={cellClass}
                    style={{
                      ...getCachedCellStyle(getStatStyle(player.fg3Attempted, thresholds?.fg3Attempted, 'fg3Attempted'), index),
                      width: columnWidths.basicStats,
                    }}
                  >
                    {player.fg3Attempted.toFixed(1)}
                  </td>
                  <td
                    key="fg3Pct"
                    className={cellClass}
                    style={{
                      ...getCachedCellStyle(getStatStyle(player.fg3Percentage * 100, thresholds?.fg3Percentage, 'fg3Percentage', player.fg3Attempted), index),
                      width: columnWidths.basicStats,
                    }}
                  >
                    {(player.fg3Percentage * 100).toFixed(1)}
                  </td>
                  <td
                    key="ftMade"
                    className={cellClass}
                    style={{
                      ...getCachedCellStyle(getStatStyle(player.ftMade, thresholds?.ftMade, 'ftMade'), index),
                      width: columnWidths.basicStats,
                    }}
                  >
                    {player.ftMade.toFixed(1)}
                  </td>
                  <td
                    key="ftAttempted"
                    className={cellClass}
                    style={{
                      ...getCachedCellStyle(getStatStyle(player.ftAttempted, thresholds?.ftAttempted, 'ftAttempted'), index),
                      width: columnWidths.basicStats,
                    }}
                  >
                    {player.ftAttempted.toFixed(1)}
                  </td>
                  <td
                    key="ftPct"
                    className={cellClass}
                    style={{
                      ...getCachedCellStyle(getStatStyle(player.ftPercentage * 100, thresholds?.ftPercentage, 'ftPercentage', player.ftAttempted), index),
                      width: columnWidths.basicStats,
                    }}
                  >
                    {(player.ftPercentage * 100).toFixed(1)}
                  </td>
                  <td
                    key="oreb"
                    className={cellClass}
                    style={{
                      ...getCachedCellStyle(getStatStyle(player.offensiveRebounds, thresholds?.offensiveRebounds, 'oreb'), index),
                      width: columnWidths.basicStats,
                    }}
                  >
                    {player.offensiveRebounds.toFixed(1)}
                  </td>
                  <td
                    key="dreb"
                    className={cellClass}
                    style={{
                      ...getCachedCellStyle(getStatStyle(player.defensiveRebounds, thresholds?.defensiveRebounds, 'dreb'), index),
                      width: columnWidths.basicStats,
                    }}
                  >
                    {player.defensiveRebounds.toFixed(1)}
                  </td>
                  <td
                    key="turnovers"
                    className={cellClass}
                    style={{
                      ...getCachedCellStyle(getTurnoverStyle(player.turnovers, thresholds?.turnovers), index),
                      width: columnWidths.basicStats,
                    }}
                  >
                    {player.turnovers.toFixed(1)}
                  </td>
                </>
              );
            }}
          />
        ) : (
          <div>Loading...</div>
        )}
      </div>
    </div>
  );
}
