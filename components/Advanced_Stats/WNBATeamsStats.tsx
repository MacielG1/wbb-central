'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import React from 'react';
import { fetchWNBAteamStats, WNBATeamStats } from '@/utils/WNBA/fetchTeamStats';
import { getTeamLogoUrl } from '@/utils/WNBA/teamLogos';
import { TableVirtuoso } from 'react-virtuoso';
import { MoveDown, MoveUp, Loader2, Users, User, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link'; 
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import getFavorites from '@/lib/getFavorites';


const generateSeasonOptions = () => {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 4;
  return Array.from({ length: 5 }, (_, i) => startYear + i);
};

type SortConfig = {
  key: keyof WNBATeamStats | 'rank' | null; // Added 'rank'
  direction: 'asc' | 'desc';
};

type WNBATeamStatsWithRank = WNBATeamStats & { rank: number };

interface FilterConfig {
  search: string;
  season: number;
  seasonType: string;
}

interface WNBATeamsStatsProps {
  initialData: WNBATeamStats[];
}

const columnWidths = {
  rank: 40,
  teamName: 180,
  basicStats: 55,
  compact: 60,
  default: 80,
} as const;

const headerStyle: React.CSSProperties = {
  backgroundColor: '#4f39f6',
  color: 'black',
  cursor: 'pointer',
  position: 'relative',
  userSelect: 'none',
  fontSize: '0.75rem',
  whiteSpace: 'nowrap',
  padding: '4px 6px',
  textAlign: 'center',
  borderRight: '1px solid black',
  borderBottom: '1px solid black',
};

const cellClass = 'px-1.5 py-1 text-center bg-neutral-900 border-r border-b border-black ';
const nameTeamCellClass = 'px-1.5 py-1 pl-2 text-left bg-neutral-900 border-r border-b border-black ';
const smallerCellClass = 'px-1.5 py-1 text-center bg-neutral-900 border-r border-b border-black'

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
  backgroundColor: '#4f39f6',
  backgroundClip: 'padding-box',
};

export default function WNBATeamsStats({ initialData }: WNBATeamsStatsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const league = pathname?.split('/')[1]?.toLowerCase();

  const currentYear = new Date().getFullYear();
  const yearParam = searchParams.get('year');
  const initialYear = yearParam ? parseInt(yearParam, 10) : initialData.length > 0 ? initialData[0].season : currentYear;

  const [teams, setTeams] = useState<WNBATeamStats[]>(initialData);
  const [inputValue, setInputValue] = useState('');
  const [filters, setFilters] = useState<FilterConfig>({
    search: '',
    season: initialYear,
    seasonType: 'Regular Season',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'winPct', direction: 'desc' });
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [hasAutoSelectedYear, setHasAutoSelectedYear] = useState(false);
  const [favorites, setFavorites] = useState<Record<string, any>>({});

  useEffect(() => {
    const favs = getFavorites(league);
    setFavorites(favs);
  }, [league]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: inputValue }));
    }, 200);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const fetchYearData = async (year: number, seasonType: string = 'Regular Season') => {
    setIsLoading(true);
    try {
      const data = await fetchWNBAteamStats(year, seasonType);
      setTeams(data);
      setSelectedTeamId(null);
    } catch (error) {
      console.error('Error fetching team data:', error);
      setTeams([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleYearChange = (year: number) => {
    setFilters((prev) => ({ ...prev, season: year }));
    const params = new URLSearchParams(searchParams.toString());
    params.set('year', year.toString());
    router.push(`${pathname}?${params.toString()}`);
    fetchYearData(year, filters.seasonType);
  };

  const handleSeasonTypeChange = (seasonType: string) => {
    setFilters((prev) => ({ ...prev, seasonType }));
    fetchYearData(filters.season, seasonType);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const searchFilteredTeams = useMemo((): WNBATeamStats[] => {
    const searchTerm = filters.search.toLowerCase();
    if (!searchTerm) return teams;
    return teams.filter((team) => team.teamName.toLowerCase().includes(searchTerm));
  }, [teams, filters.search]);

  const sortedTeams = useMemo((): WNBATeamStatsWithRank[] => {
    const teamsToRank = filters.search ? searchFilteredTeams : teams;

    if (!sortConfig.key) {
      const defaultSorted = [...teamsToRank].sort((a, b) => (b.winPct ?? 0) - (a.winPct ?? 0));
      return defaultSorted.map((team, index) => ({ ...team, rank: index + 1 }));
    }

    const sorted = [...teamsToRank].sort((a, b) => {
      const key = sortConfig.key === 'rank' ? 'winPct' : sortConfig.key;
      if (!key) return 0;

      const aValue = a[key as keyof WNBATeamStats];
      const bValue = b[key as keyof WNBATeamStats];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const comparison = aValue - bValue;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      const comparison = String(aValue).localeCompare(String(bValue));
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return sorted.map((team, index) => ({ ...team, rank: index + 1 }));
  }, [searchFilteredTeams, sortConfig]);

  const handleSort = (key: keyof WNBATeamStats | 'rank') => {
    setSortConfig((prevConfig) => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  // Handle row click for selection
  const handleRowClick = useCallback(
    (index: number) => {
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) {
        return;
      }
      
      if (index >= 0 && index < sortedTeams.length) {
        const team = sortedTeams[index];
        const teamId = team.teamId; // Use teamId as a unique ID for teams instead of teamName
        setSelectedTeamId((prevId) => (prevId === teamId ? null : teamId));
      }
    },
    [sortedTeams]
  );

  const selectedRowIndex = useMemo(() => {
    if (!selectedTeamId) return null;
    return sortedTeams.findIndex((team) => team.teamId === selectedTeamId);
  }, [selectedTeamId, sortedTeams]);

  const getSortIndicator = (key: keyof WNBATeamStats | 'rank') => {
    if (sortConfig.key !== key) return null;
    return (
      <span className="absolute right-0 top-1/2 -translate-y-1/2 mr-1">
        {sortConfig.direction === 'asc' ? <MoveUp className="w-2.5 h-2.5" /> : <MoveDown className="w-2.5 h-2.5" />}
      </span>
    );
  };

  const getRowStyle = useCallback(
    (index: number): React.CSSProperties => ({
      cursor: 'pointer',
      backgroundColor: selectedRowIndex === index ? '#1a1835' : '#171717', // Highlight color vs default
      borderLeft: selectedRowIndex === index ? '2px solid #4f39f640' : '2px solid #171717',
      borderRight: selectedRowIndex === index ? '2px solid #4f39f640' : '2px solid #171717',
      borderTop: selectedRowIndex === index ? '1px solid #4f39f640' : '1px solid #171717',
      borderBottom: selectedRowIndex === index ? '1px solid #4f39f640' : '1px solid #171717',
    }),
    [selectedRowIndex]
  );

  const getCellStyle = useCallback(
    (baseStyle: any, index: number, isFixed: boolean = false): React.CSSProperties => {
      const selected = selectedRowIndex === index;
      const backgroundColor = selected ? '#1a1835' : baseStyle.backgroundColor || '#171717';
      const color = baseStyle.color || 'white';

      if (isFixed) {
        return {
          ...baseStyle,
          backgroundColor: selected ? '#1a1835' : '#171717',
          color: color,
          boxShadow: 'none',
        };
      }

      return { ...baseStyle, backgroundColor, color, boxShadow: 'none' };
    },
    [selectedRowIndex]
  ); 

  const MemoizedTableRow = useMemo(
    () =>
      React.memo(({ item: _item, ...props }: any) => {
        const index = props['data-index'] as number;
        return <tr {...props} onClick={() => handleRowClick(index)} style={getRowStyle(index)} />;
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
      if (!yearParam && teams.length === 0 && !isLoading && !hasAutoSelectedYear) {
        const years = generateSeasonOptions().slice().reverse();
        for (const year of years) {
          if (year === filters.season) continue; 
          setIsLoading(true);
          try {
            const data = await fetchWNBAteamStats(year);
            if (data && data.length > 0) {
              setFilters((prev) => ({ ...prev, season: year }));
              setTeams(data);
              const params = new URLSearchParams(searchParams.toString());
              params.set('year', year.toString());
              router.replace(`${pathname}?${params.toString()}`);
              setHasAutoSelectedYear(true);
              break;
            }
          } catch (error) {
            console.error(`Error fetching data for year ${year}:`, error);
          } finally {
            setIsLoading(false);
          }
        }
      }
    }
    autoSelectMostRecentYearWithData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teams.length, isLoading, filters.season, hasAutoSelectedYear, yearParam, router, pathname, searchParams]); // Dependencies

  const columns: {
    key: keyof WNBATeamStats | 'rank';
    label: string;
    sortable?: boolean;
    width: number;
    style?: React.CSSProperties;
    headerClassName?: string;
    cellClassName?: string;
  }[] = [
    { key: 'rank', label: 'Rank', sortable: true, width: columnWidths.rank, style: firstColumnStyle, headerClassName: smallerCellClass, cellClassName: smallerCellClass },
    {
      key: 'teamName',
      label: 'Team',
      sortable: true,
      width: columnWidths.teamName,
      style: secondColumnStyle,
      headerClassName: nameTeamCellClass,
      cellClassName: nameTeamCellClass,
    },
    { key: 'gamesPlayed', label: 'GP', sortable: true, width: columnWidths.basicStats, headerClassName: cellClass, cellClassName: cellClass },
    { key: 'winPct', label: 'Win%', sortable: true, width: columnWidths.compact, headerClassName: cellClass, cellClassName: cellClass },
    { key: 'wins', label: 'W', sortable: true, width: columnWidths.basicStats, headerClassName: cellClass, cellClassName: cellClass },
    { key: 'losses', label: 'L', sortable: true, width: columnWidths.basicStats, headerClassName: cellClass, cellClassName: cellClass },
    // { key: 'minutes', label: 'MIN', sortable: true, width: columnWidths.compact, headerClassName: cellClass, cellClassName: cellClass },
    { key: 'points', label: 'PTS', sortable: true, width: columnWidths.compact, headerClassName: cellClass, cellClassName: cellClass },
    { key: 'fgMade', label: 'FGM', sortable: true, width: columnWidths.compact, headerClassName: cellClass, cellClassName: cellClass },
    { key: 'fgAttempted', label: 'FGA', sortable: true, width: columnWidths.compact, headerClassName: cellClass, cellClassName: cellClass },
    { key: 'fgPct', label: 'FG%', sortable: true, width: columnWidths.compact, headerClassName: cellClass, cellClassName: cellClass },
    { key: 'fg3Made', label: '3PM', sortable: true, width: columnWidths.compact, headerClassName: cellClass, cellClassName: cellClass },
    { key: 'fg3Attempted', label: '3PA', sortable: true, width: columnWidths.compact, headerClassName: cellClass, cellClassName: cellClass },
    { key: 'fg3Pct', label: '3P%', sortable: true, width: columnWidths.compact, headerClassName: cellClass, cellClassName: cellClass },
    { key: 'ftMade', label: 'FTM', sortable: true, width: columnWidths.compact, headerClassName: cellClass, cellClassName: cellClass },
    { key: 'ftAttempted', label: 'FTA', sortable: true, width: columnWidths.compact, headerClassName: cellClass, cellClassName: cellClass },
    { key: 'ftPct', label: 'FT%', sortable: true, width: columnWidths.compact, headerClassName: cellClass, cellClassName: cellClass },
    { key: 'oreb', label: 'OREB', sortable: true, width: columnWidths.compact, headerClassName: cellClass, cellClassName: cellClass },
    { key: 'dreb', label: 'DREB', sortable: true, width: columnWidths.compact, headerClassName: cellClass, cellClassName: cellClass },
    { key: 'reb', label: 'REB', sortable: true, width: columnWidths.compact, headerClassName: cellClass, cellClassName: cellClass },
    { key: 'ast', label: 'AST', sortable: true, width: columnWidths.compact, headerClassName: cellClass, cellClassName: cellClass },
    { key: 'tov', label: 'TOV', sortable: true, width: columnWidths.compact, headerClassName: cellClass, cellClassName: cellClass },
    { key: 'stl', label: 'STL', sortable: true, width: columnWidths.compact, headerClassName: cellClass, cellClassName: cellClass },
    { key: 'blk', label: 'BLK', sortable: true, width: columnWidths.compact, headerClassName: cellClass, cellClassName: cellClass },
    { key: 'pf', label: 'PF', sortable: true, width: columnWidths.compact, headerClassName: cellClass, cellClassName: cellClass },
    { key: 'plusMinus', label: '+/-', sortable: true, width: columnWidths.compact, headerClassName: cellClass, cellClassName: cellClass },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden bg-neutral-950 mr-1">
      {' '}
      <div className="p-2 border-b border-neutral-800 flex-shrink-0">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search Input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={handleSearchChange} // Use immediate update handler
              placeholder="Search team..."
              className="w-full pl-4 pr-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md focus:outline-hidden focus:border-neutral-400 dark:focus:border-neutral-600"
              disabled={isLoading || !teams.length}
            />
          </div>

          {/* Season Selector */}
          <div className="flex items-center gap-2">
            <label className="text-sm">Season:</label>
            <div className="relative">
              <select
                value={filters.season} // Use filters.season
                onChange={(e) => handleYearChange(Number(e.target.value))}
                className="pl-4 cursor-pointer pr-8 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md focus:outline-hidden focus:border-neutral-400 dark:focus:border-neutral-600 appearance-none bg-[length:16px_16px] bg-[right_0.5rem_center] bg-no-repeat bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNy40MSA4LjU5TDEyIDEzLjE3bDQuNTktNC41OEwxOCAxMGwtNiA2LTYtNiAxLjQxLTEuNDF6IiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==')]" // Style like players
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

          {/* Season Type Selector - only show when there's data */}
          {teams.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-sm">Season Type:</label>
              <select
                value={filters.seasonType}
                onChange={(e) => handleSeasonTypeChange(e.target.value)}
                className="pl-4 cursor-pointer pr-8 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md focus:outline-hidden focus:border-neutral-400 dark:focus:border-neutral-600 appearance-none bg-[length:16px_16px] bg-[right_0.5rem_center] bg-no-repeat bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNy40MSA4LjU5TDEyIDEzLjE3bDQuNTktNC41OEwxOCAxMGwtNiA2LTYtNiAxLjQxLTEuNDF6IiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==')]"
                disabled={isLoading}
              >
                <option value="Regular Season">Regular Season</option>
                <option value="Playoffs">Playoffs</option>
              </select>
            </div>
          )}

          {/* Team Count */}
          <div className="text-sm text-neutral-500">{teams.length > 0 && `Showing ${searchFilteredTeams.length} of ${teams.length} teams`}</div>

          {/* Link to Players Stats */}
          <Link
            href={`/${league}/players?year=${filters.season}`} // Link to players, include current year
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-300 hover:text-neutral-400 bg-neutral-900 rounded-md border border-neutral-800 hover:border-neutral-700 transition-colors ml-auto"
          >
            <User className="w-4 h-4" /> {/* Player icon */}
            View Players Stats
          </Link>
        </div>
      </div>
      {/* Table Area */}
      <div className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-neutral-950/50 z-50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        )}

        {!teams.length && !isLoading ? (
          <div className="flex-1 flex items-center justify-center mt-10">
            <div className="text-center p-6 rounded-lg bg-neutral-900/50 border border-neutral-800">
              <h2 className="text-2xl font-semibold mb-2">No stats available for this year yet</h2>
              <p className="text-neutral-400">Try selecting a different season.</p>
            </div>
          </div>
        ) : (
          teams.length > 0 && (
            <TableVirtuoso
              style={{ height: '100%' }}
              totalCount={sortedTeams.length}
              overscan={{ main: 50, reverse: 50 }} 
              increaseViewportBy={{ top: 50, bottom: 50 }}
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
                    className="table-auto text-xs"
                  />
                ),
                TableHead: () => (
                  <thead className="sticky top-0 z-[100] bg-neutral-900">
                    <tr>
                      {columns.map((col) => (
                        <th
                          key={col.key}
                          className={col.headerClassName || cellClass} // Use defined class or default
                          style={{ ...headerStyle, ...(col.style || {}), width: col.width, opacity: isLoading ? 0.7 : 1, transition: 'opacity 0.15s ease' }}
                          onClick={col.sortable ? () => handleSort(col.key as keyof WNBATeamStats | 'rank') : undefined}
                        >
                          {col.label}
                          {col.sortable && getSortIndicator(col.key as keyof WNBATeamStats | 'rank')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                ),
                TableRow: MemoizedTableRow, 
              }}
              fixedHeaderContent={() => null}
              itemContent={(index) => {
                const team = sortedTeams[index];
                const rankCellStyle = getCachedCellStyle({ width: columnWidths.rank, position: 'sticky', left: 0, zIndex: 98, backgroundClip: 'padding-box' }, index, true);
                const teamNameCellStyle = getCachedCellStyle(
                  { width: columnWidths.teamName, position: 'sticky', left: columnWidths.rank, zIndex: 98, backgroundClip: 'padding-box' },
                  index,
                  true
                );

                return (
                  <>
                    {/* Rank */}
                    <td key="rank" className={smallerCellClass} style={rankCellStyle}>
                      {team.rank}
                    </td>
                    {/* Team Name with Logo */}
                    <td key="teamName" className={nameTeamCellClass} style={teamNameCellStyle}>
                      <div className="flex items-center gap-2">
                        <div className="relative w-5 h-5 flex-shrink-0">
                          <Image src={getTeamLogoUrl(team.teamAbbr || '')} alt={`${team.teamName} logo`} width={20} height={20} className="object-contain" />
                        </div>
                        <Link href={`/${league}/${(team.teamAbbr || '').toLowerCase()}`} className="flex items-center gap-1 hover:opacity-80">
                          <span className="text-indigo-300 hover:text-indigo-200">{team.teamName}</span>
                        </Link>
                        {/* Remove debug but use custom check for favorites by name */}
                        {(() => {
                          const isFavoriteById = !!favorites[team.teamId];
                          const isFavoriteByName = Object.values(favorites).some(fav => 
                            fav.name?.toLowerCase() === team.teamName?.toLowerCase());
                          return (isFavoriteById || isFavoriteByName) && (
                            <Star className="size-2.5 fill-yellow-600 text-yellow-600" />
                          );
                        })()}
                      </div>
                    </td>
                    {/* Other Stats */}
                    <td key="gp" className={cellClass} style={{ ...getCachedCellStyle({}, index), width: columnWidths.basicStats }}>
                      {team.gamesPlayed}
                    </td>
                    <td key="winPct" className={cellClass} style={{ ...getCachedCellStyle({}, index), width: columnWidths.compact }}>
                      {(team.winPct * 100).toFixed(1)}
                    </td>
                    <td key="w" className={cellClass} style={{ ...getCachedCellStyle({}, index), width: columnWidths.basicStats }}>
                      {team.wins}
                    </td>
                    <td key="l" className={cellClass} style={{ ...getCachedCellStyle({}, index), width: columnWidths.basicStats }}>
                      {team.losses}
                    </td>
                    {/* <td key="min" className={cellClass} style={{ ...getCachedCellStyle({}, index), width: columnWidths.compact }}>
                      {team.minutes.toFixed(1)}
                    </td> */}
                    <td key="pts" className={cellClass} style={{ ...getCachedCellStyle({}, index), width: columnWidths.compact }}>
                      {team.points.toFixed(1)}
                    </td>
                    <td key="fgm" className={cellClass} style={{ ...getCachedCellStyle({}, index), width: columnWidths.compact }}>
                      {team.fgMade.toFixed(1)}
                    </td>
                    <td key="fga" className={cellClass} style={{ ...getCachedCellStyle({}, index), width: columnWidths.compact }}>
                      {team.fgAttempted.toFixed(1)}
                    </td>
                    <td key="fgPct" className={cellClass} style={{ ...getCachedCellStyle({}, index), width: columnWidths.compact }}>
                      {(team.fgPct * 100).toFixed(1)}
                    </td>
                    <td key="fg3m" className={cellClass} style={{ ...getCachedCellStyle({}, index), width: columnWidths.compact }}>
                      {team.fg3Made.toFixed(1)}
                    </td>
                    <td key="fg3a" className={cellClass} style={{ ...getCachedCellStyle({}, index), width: columnWidths.compact }}>
                      {team.fg3Attempted.toFixed(1)}
                    </td>
                    <td key="fg3Pct" className={cellClass} style={{ ...getCachedCellStyle({}, index), width: columnWidths.compact }}>
                      {(team.fg3Pct * 100).toFixed(1)}
                    </td>
                    <td key="ftm" className={cellClass} style={{ ...getCachedCellStyle({}, index), width: columnWidths.compact }}>
                      {team.ftMade.toFixed(1)}
                    </td>
                    <td key="fta" className={cellClass} style={{ ...getCachedCellStyle({}, index), width: columnWidths.compact }}>
                      {team.ftAttempted.toFixed(1)}
                    </td>
                    <td key="ftPct" className={cellClass} style={{ ...getCachedCellStyle({}, index), width: columnWidths.compact }}>
                      {(team.ftPct * 100).toFixed(1)}
                    </td>
                    <td key="oreb" className={cellClass} style={{ ...getCachedCellStyle({}, index), width: columnWidths.compact }}>
                      {team.oreb.toFixed(1)}
                    </td>
                    <td key="dreb" className={cellClass} style={{ ...getCachedCellStyle({}, index), width: columnWidths.compact }}>
                      {team.dreb.toFixed(1)}
                    </td>
                    <td key="reb" className={cellClass} style={{ ...getCachedCellStyle({}, index), width: columnWidths.compact }}>
                      {team.reb.toFixed(1)}
                    </td>
                    <td key="ast" className={cellClass} style={{ ...getCachedCellStyle({}, index), width: columnWidths.compact }}>
                      {team.ast.toFixed(1)}
                    </td>
                    <td key="tov" className={cellClass} style={{ ...getCachedCellStyle({}, index), width: columnWidths.compact }}>
                      {team.tov.toFixed(1)}
                    </td>
                    <td key="stl" className={cellClass} style={{ ...getCachedCellStyle({}, index), width: columnWidths.compact }}>
                      {team.stl.toFixed(1)}
                    </td>
                    <td key="blk" className={cellClass} style={{ ...getCachedCellStyle({}, index), width: columnWidths.compact }}>
                      {team.blk.toFixed(1)}
                    </td>
                    <td key="pf" className={cellClass} style={{ ...getCachedCellStyle({}, index), width: columnWidths.compact }}>
                      {team.pf.toFixed(1)}
                    </td>
                    <td key="plusMinus" className={cellClass} style={{ ...getCachedCellStyle({}, index), width: columnWidths.compact }}>
                      {team.plusMinus.toFixed(1)}
                    </td>
                  </>
                );
              }}
            />
          )
        )}
      </div>
    </div>
  );
}
