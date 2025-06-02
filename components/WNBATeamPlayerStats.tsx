'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import Image from 'next/image';

interface WNBAPlayerStatsProps {
  teamStats: {
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
      leaders: Array<{
        athlete: {
          id: string;
          displayName: string;
          headshot?: {
            href: string;
            alt: string;
          };
          position: {
            abbreviation: string;
          };
          links?: Array<{
            rel: string[];
            href: string;
          }>;
        };
        statistics: Array<{
          name: string;
          stats: Array<{
            name: string;
            displayValue: string;
          }>;
        }>;
      }>;
      sort: string;
    }>;
    status: string;
  };
}

type SortOption = {
  label: string;
  value: string;
  statType: string;
  statName: string;
};

const sortOptions: SortOption[] = [
  { label: 'Points', value: 'points', statType: 'offensive', statName: 'avgPoints' },
  { label: 'Assists', value: 'assists', statType: 'offensive', statName: 'avgAssists' },
  { label: 'Rebounds', value: 'rebounds', statType: 'general', statName: 'avgRebounds' },
  { label: 'Minutes', value: 'minutes', statType: 'general', statName: 'avgMinutes' },
  { label: 'Steals', value: 'steals', statType: 'defensive', statName: 'avgSteals' },
  { label: 'Blocks', value: 'blocks', statType: 'defensive', statName: 'avgBlocks' },
];

export default function WNBATeamPlayerStats({ teamStats }: WNBAPlayerStatsProps) {
  const [sortBy, setSortBy] = useState<SortOption>(sortOptions[0]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const players = teamStats.results?.[0]?.leaders || [];

  const sortedPlayers = [...players].sort((a, b) => {
    const statGroupA = a.statistics.find((stat) => stat.name === sortBy.statType);
    const statGroupB = b.statistics.find((stat) => stat.name === sortBy.statType);

    const valueA = parseFloat(statGroupA?.stats.find((stat) => stat.name === sortBy.statName)?.displayValue || '0');
    const valueB = parseFloat(statGroupB?.stats.find((stat) => stat.name === sortBy.statName)?.displayValue || '0');

    if (valueA === 0 && valueB === 0) {
      if (a.athlete.headshot?.href && !b.athlete.headshot?.href) return -1;
      if (!a.athlete.headshot?.href && b.athlete.headshot?.href) return 1;
      return a.athlete.displayName.localeCompare(b.athlete.displayName);
    }

    return valueB - valueA;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">Player Leaders</h3>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm w-[140px] text-left',
              'bg-white hover:bg-neutral-100 dark:hover:bg-neutral-900 dark:bg-black',
              'border border-neutral-200 dark:border-neutral-800',
              'text-neutral-800 dark:text-neutral-200',
              'focus:outline-hidden cursor-pointer'
            )}
          >
            Sort by {sortBy.label}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-neutral-700 dark:text-neutral-300">
              <ChevronDown className="size-4" />
            </div>
          </button>

          {isOpen && (
            <div className="absolute z-10 w-[140px] bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-md shadow-lg">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSortBy(option);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full px-3 py-1.5 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800',
                    option.value === sortBy.value && 'bg-neutral-100 dark:bg-neutral-800'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-2.5 pb-3 max-w-5xl mx-auto">
        {sortedPlayers.length === 0 ? (
          <div className="text-center py-8 text-neutral-600 dark:text-neutral-400">
            No player statistics available for this season.
          </div>
        ) : (
          sortedPlayers.map((player) => {
            const generalStats = player.statistics.find((stat) => stat.name === 'general');
            const offensiveStats = player.statistics.find((stat) => stat.name === 'offensive');
            const defensiveStats = player.statistics.find((stat) => stat.name === 'defensive');

            const minutes = generalStats?.stats.find((stat) => stat.name === 'avgMinutes')?.displayValue || '0';
            const points = offensiveStats?.stats.find((stat) => stat.name === 'avgPoints')?.displayValue || '0';
            const assists = offensiveStats?.stats.find((stat) => stat.name === 'avgAssists')?.displayValue || '0';
            const rebounds = generalStats?.stats.find((stat) => stat.name === 'avgRebounds')?.displayValue || '0';
            const gamesPlayed = generalStats?.stats.find((stat) => stat.name === 'gamesPlayed')?.displayValue || '0';

            const fgPercent = offensiveStats?.stats.find((stat) => stat.name === 'fieldGoalPct')?.displayValue || '0';
            const fgMade = offensiveStats?.stats.find((stat) => stat.name === 'fieldGoalsMade')?.displayValue || '0';
            const fgAttempts = offensiveStats?.stats.find((stat) => stat.name === 'fieldGoalsAttempted')?.displayValue || '0';

            const threePercent = offensiveStats?.stats.find((stat) => stat.name === 'threePointFieldGoalPct')?.displayValue || '0';
            const threeMade = offensiveStats?.stats.find((stat) => stat.name === 'threePointFieldGoalsMade')?.displayValue || '0';
            const threeAttempts = offensiveStats?.stats.find((stat) => stat.name === 'threePointFieldGoalsAttempted')?.displayValue || '0';

            const ftPercent = offensiveStats?.stats.find((stat) => stat.name === 'freeThrowPct')?.displayValue || '0';
            const ftMade = offensiveStats?.stats.find((stat) => stat.name === 'freeThrowsMade')?.displayValue || '0';
            const ftAttempts = offensiveStats?.stats.find((stat) => stat.name === 'freeThrowsAttempted')?.displayValue || '0';

            const steals = defensiveStats?.stats.find((stat) => stat.name === 'avgSteals')?.displayValue || '0';
            const blocks = defensiveStats?.stats.find((stat) => stat.name === 'avgBlocks')?.displayValue || '0';

            return (
              <div
                key={`${player.athlete.id}-${player.athlete.displayName}`}
                className={cn(
                  'flex items-start px-2 py-1 rounded-xl',
                  'bg-white dark:bg-neutral-900',
                  'border border-neutral-200 dark:border-neutral-800',
                  'shadow-xs hover:shadow-md transition-shadow'
                )}
              >
                <div className="flex items-center w-44 md:w-44 lg:w-48 2xl:w-56 shrink-0">
                  <div className="relative">
                    <div className="overflow-hidden size-12 lg:size-16 flex items-center justify-center">
                      {player?.athlete?.headshot?.href ? (
                        <Image
                          src={player.athlete.headshot.href}
                          alt={player.athlete.headshot.alt}
                          width={100}
                          height={100}
                          className="object-cover size-12 lg:size-16 rounded-full"
                          unoptimized
                        />
                      ) : (
                        <div className="relative size-10 lg:size-14 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
                          <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                            {player.athlete.displayName
                              .split(' ')
                              .map((name) => name[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ml-3 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {player.athlete.links?.find((link) => link.rel.includes('playercard'))?.href ? (
                        <Link
                          href={player.athlete.links.find((link) => link.rel.includes('playercard'))?.href || ''}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-sm flex-wrap dark:text-white max-w-[180px] hover:underline"
                        >
                          {player.athlete.displayName}
                        </Link>
                      ) : (
                        <span className="font-semibold text-sm flex-wrap dark:text-white max-w-[180px]">
                          {player.athlete.displayName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={cn('text-xs px-1.5 py-0.5 rounded-full', 'text-neutral-600 dark:text-neutral-400', 'bg-neutral-100 dark:bg-neutral-800')}>
                        {player.athlete.position.abbreviation}
                      </span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">{gamesPlayed} GP</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-5 xs:grid-cols-9 2xl:grid-cols-9 xs:gap-2 flex-1 self-center xs:pl-1">
                  {[
                    { label: 'PTS', value: points },
                    { label: 'AST', value: assists },
                    { label: 'REB', value: rebounds },
                    { label: 'MIN', value: minutes },
                    {
                      label: 'FG%',
                      value: fgPercent,
                      subValue: `${fgMade}/${fgAttempts}`,
                    },
                    {
                      label: '3P%',
                      value: threePercent,
                      subValue: `${threeMade}/${threeAttempts}`,
                    },
                    {
                      label: 'FT%',
                      value: ftPercent,
                      subValue: `${ftMade}/${ftAttempts}`,
                    },
                    { label: 'STL', value: steals },
                    { label: 'BLK', value: blocks },
                  ].map((stat) => (
                    <div key={stat.label} className="flex flex-col items-center">
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">{stat.label}</span>
                      <span className="font-semibold text-sm tabular-nums dark:text-white leading-tight">{stat.value}</span>
                      {stat.subValue && <span className="text-xs text-neutral-400 dark:text-neutral-500">{stat.subValue}</span>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
