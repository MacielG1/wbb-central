import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import GameDateTime from './GameDateTime';
import { Table } from '@/components/icons/Table';
import { ChartBar, List } from 'lucide-react';
import { DARK_COLORED_LOGOS } from '@/lib/consts';

interface GameStatsProps {
  league: string;
  data: {
    header: {
      id: string;
      links: Array<{
        rel: string[];
        href: string;
        text: string;
        shortText: string;
        isExternal: boolean;
        isPremium: boolean;
      }>;
      competitions: Array<{
        date: string;
        competitors: Array<{
          homeAway: string;
          team: {
            id: string;
            displayName: string;
            color: string;
            alternateColor: string;
            abbreviation?: string;
            logos: Array<{
              href: string;
              width: number;
              height: number;
              alt: string;
              rel: string[];
            }>;
          };
          record: Array<{
            type: string;
            summary: string;
          }>;
          rank?: number;
          linescores?: Array<{
            displayValue: string;
          }>;
        }>;
        status: {
          type: {
            name: string;
            state: string;
            completed: boolean;
            description: string;
            detail: string;
            shortDetail: string;
          };
        };
        broadcasts?: Array<{
          media: {
            shortName: string;
          };
        }>;
      }>;
    };
    boxscore: {
      teams?: Array<{
        team: {
          id: string;
          displayName: string;
          logo: string;
          color: string;
        };
        statistics: Array<{
          name: string;
          displayValue: string;
          label: string;
          abbreviation?: string;
        }>;
        homeAway: string;
      }>;
      players?: Array<{
        team: {
          id: string;
          displayName: string;
          logo: string;
        };
        statistics: [
          {
            names: string[];
            keys: string[];
            labels: string[];
            descriptions: string[];
            athletes: Array<PlayerData>;
            totals: string[];
          }
        ];
      }>;
    };
    format?: {
      regulation: {
        periods: number;
        displayName: string;
        slug: string;
        clock: number;
      };
      overtime: {
        clock: number;
      };
    };
    gameInfo: {
      venue: {
        fullName: string;
        address: {
          city: string;
          state: string;
        };
      };
      status: {
        type: {
          state: string;
          completed: boolean;
          description: string;
        };
        period: number;
        displayClock: string;
      };
      date: string;
      attendance: number;
      broadcast?: {
        network: string;
      };
    };
    predictor?: {
      header: string;
      awayTeam: {
        gameProjection: number;
      };
      homeTeam: {
        gameProjection: number;
      };
    };
    standings?: {
      groups: Array<{
        header: string;
        standings: {
          entries: Array<{
            id: string;
            team: string;
            logo?: Array<{
              href: string;
            }>;
            link: string;
            stats: Array<{
              type: string;
              summary?: string;
              displayValue?: string;
            }>;
          }>;
        };
      }>;
    };
  };
}

type PlayerData = {
  athlete: {
    id: string;
    displayName: string;
    shortName: string;
    headshot?: {
      href: string;
      alt: string;
    };
    jersey: string;
    position: {
      abbreviation: string;
    };
    links?: Array<{
      rel: string[];
      href: string;
    }>;
  };
  starter: boolean;
  didNotPlay: boolean;
  stats: string[];
};


const statAbbreviationMap: { [key: string]: string } = {
  MIN: 'minutes',
  PTS: 'points',
  AST: 'assists',
  REB: 'totalRebounds',
  OREB: 'offensiveRebounds',
  DREB: 'defensiveRebounds',
  STL: 'steals',
  BLK: 'blocks',
  TO: 'turnovers',
  PF: 'fouls',
  FG: 'fieldGoalsMade-fieldGoalsAttempted',
  'FG%': 'fieldGoalPct',
  '3PT': 'threePointFieldGoalsMade-threePointFieldGoalsAttempted',
  '3P%': 'threePointFieldGoalPct',
  FT: 'freeThrowsMade-freeThrowsAttempted',
  'FT%': 'freeThrowPct',
};

export default function GameStats({ data, league }: GameStatsProps) {
  const homeTeam = data?.boxscore?.teams?.find((team) => team.homeAway === 'home');
  const awayTeam = data?.boxscore?.teams?.find((team) => team.homeAway === 'away');
  const awayPlayers = data?.boxscore?.players?.find((team) => team.team.id === awayTeam?.team.id);
  const homePlayers = data?.boxscore?.players?.find((team) => team.team.id === homeTeam?.team.id);

  const isPreGame = !homeTeam || !awayTeam || Object.keys(data.boxscore).length === 0;

  // Get teams from header for pregame state
  const headerHomeTeam = data.header.competitions[0].competitors.find((team) => team.homeAway === 'home');
  const headerAwayTeam = data.header.competitions[0].competitors.find((team) => team.homeAway === 'away');

  // Function to reorder stats based on our desired order
  const reorderStats = (stats: string[], headers: string[]) => {
    const desiredOrder = ['PTS', 'AST', 'REB', 'OREB', 'DREB', 'STL', 'BLK', 'TO', 'PF', 'FG', '3PT', 'FT', 'MIN'];
    const reorderedStats: string[] = [];
    const reorderedHeaders: string[] = [];

    // Get the arrays from the API data
    const names = awayPlayers?.statistics[0].names || [];

    desiredOrder.forEach((header) => {
      const nameIndex = names.indexOf(header);
      if (nameIndex !== -1) {
        reorderedStats.push(stats[nameIndex]);
        reorderedHeaders.push(headers[nameIndex]);
      }
    });

    return { reorderedStats, reorderedHeaders };
  };

  const getTeamScore = (team: typeof homeTeam) => {
    if (!team) return '0';

    // First try to find points directly
    const points = team.statistics.find((stat) => stat.name === 'points');
    if (points?.displayValue) return points.displayValue;

    // If not found, look for total points in the last stat of totals
    const teamPlayers = data.boxscore.players?.find((p) => p.team.id === team.team.id);
    if (teamPlayers) {
      const totals = teamPlayers.statistics[0].totals;
      return totals[totals.length - 1] || '0';
    }

    return '0';
  };

  const homeScore = getTeamScore(homeTeam);
  const awayScore = getTeamScore(awayTeam);
  const isHomeWinner = Number(homeScore) > Number(awayScore);
  const isAwayWinner = Number(awayScore) > Number(homeScore);

  // Add a default placeholder image at the top of the component
  const defaultTeamLogo = "/images/default-team-logo.png"; // You can create and use a default logo image

  // Render game header
  const renderGameHeader = () => (
    <div className="flex flex-col items-center justify-center gap-1 mb-0">
      <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-[1600px] px-4 gap-3 md:gap-0">
        {/* Away Team */}
        <div className="flex-1 flex flex-col md:flex-row items-center gap-2 md:gap-4 md:justify-end">
          <div className="order-1 md:order-1">
            <Link href={`/${league}/${headerAwayTeam?.team.id}`} className="block">
              {isPreGame 
                ? (headerAwayTeam?.team.logos && headerAwayTeam.team.logos.length > 0 && (
                    <Image
                      src={headerAwayTeam.team.logos[0].href}
                      alt={headerAwayTeam?.team.displayName || ''}
                      width={64}
                      height={64}
                      className={cn('size-14 md:size-16', {
                        'dark:invert': headerAwayTeam?.team.color === '000000',
                      })}
                      unoptimized
                    />
                  ))
                : awayTeam?.team.logo && (
                    <Image
                      src={awayTeam.team.logo}
                      alt={awayTeam?.team.displayName || ''}
                      width={64}
                      height={64}
                      className={cn('size-14 md:size-16', {
                        'dark:invert': awayTeam?.team.color === '000000',
                      })}
                      unoptimized
                    />
                  )
              }
            </Link>
          </div>
          <div className="order-2 md:order-2 flex flex-col items-center md:items-end gap-0.5">
            <div className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100 text-center md:text-right flex items-baseline gap-1">
              {headerAwayTeam?.rank && <span className="font-extralight text-sm leading-none">{headerAwayTeam.rank}</span>}
              <Link href={`/${league}/${headerAwayTeam?.team.id}`} className="inline-block">
                {isPreGame ? headerAwayTeam?.team.displayName : awayTeam?.team.displayName}
              </Link>
            </div>
            {headerAwayTeam?.record && (
              <div className="text-xs text-neutral-600 dark:text-neutral-400 text-center md:text-right">
                {headerAwayTeam.record.find((r) => r.type === 'total')?.summary} • {headerAwayTeam.record.find((r) => r.type === 'vsconf')?.summary}
              </div>
            )}
          </div>
          {!isPreGame && (
            <div
              className={cn('order-3 md:order-3 text-3xl md:text-4xl tabular-nums', {
                'font-bold': isAwayWinner,
                'font-normal': !isAwayWinner,
              })}
            >
              {awayScore}
            </div>
          )}
        </div>

        <div className="text-lg md:text-xl font-medium text-neutral-500 px-2 md:px-8 py-1 md:py-0 shrink-0">@</div>

        {/* Home Team */}
        <div className="flex-1 flex flex-col md:flex-row items-center gap-2 md:gap-4 md:justify-start">
          {!isPreGame && (
            <div
              className={cn('order-3 md:order-1 text-3xl md:text-4xl tabular-nums', {
                'font-bold': isHomeWinner,
                'font-normal': !isHomeWinner,
              })}
            >
              {homeScore}
            </div>
          )}
          <div className="order-2 md:order-2 flex flex-col items-center md:items-start gap-0.5">
            <div className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100 text-center md:text-left flex items-baseline gap-1">
              {headerHomeTeam?.rank && <span className="font-extralight text-sm leading-none">{headerHomeTeam.rank}</span>}
              <Link href={`/${league}/${headerHomeTeam?.team.id}`} className="inline-block">
                {isPreGame ? headerHomeTeam?.team.displayName : homeTeam?.team.displayName}
              </Link>
            </div>
            {headerHomeTeam?.record && (
              <div className="text-xs text-neutral-600 dark:text-neutral-400 text-center md:text-left">
                {headerHomeTeam.record.find((r) => r.type === 'total')?.summary} • {headerHomeTeam.record.find((r) => r.type === 'vsconf')?.summary}
              </div>
            )}
          </div>
          <div className="order-1 md:order-3">
            <Link href={`/${league}/${headerHomeTeam?.team.id}`} className="block">
              {isPreGame 
                ? (headerHomeTeam?.team.logos && headerHomeTeam.team.logos.length > 0 && (
                    <Image
                      src={headerHomeTeam.team.logos[0].href}
                      alt={headerHomeTeam?.team.displayName || ''}
                      width={64}
                      height={64}
                      className={cn('size-14 md:size-16', {
                        'dark:invert': headerHomeTeam?.team.color === '000000',
                      })}
                      unoptimized
                    />
                  ))
                : homeTeam?.team.logo && (
                    <Image
                      src={homeTeam.team.logo}
                      alt={homeTeam?.team.displayName || ''}
                      width={64}
                      height={64}
                      className={cn('size-14 md:size-16', {
                        'dark:invert': homeTeam?.team.color === '000000',
                      })}
                      unoptimized
                    />
                  )
              }
            </Link>
          </div>
        </div>
      </div>

      {/* Game Info */}
      <div className="text-center mt-1 md:mt-0">
        <GameDateTime gameDate={data.header.competitions[0].date} status={data.header.competitions[0].status} />
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          <span>{data.gameInfo.venue.fullName} • {data.gameInfo.venue.address.city}, {data.gameInfo.venue.address.state}</span>
        </div>

        {data.header.competitions[0].broadcasts?.[0] && (
            <span className="text-xs text-neutral-400">{data.header.competitions[0].broadcasts[0].media.shortName}</span>
          )}
      </div>

      {/* Predictor Graph for Pre-Game */}
      {isPreGame && data.predictor && (
        <div className="w-full max-w-xl mt-3 p-3 border border-neutral-200 dark:border-neutral-800 rounded-xl">
          <h3 className="text-center text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-3">{data.predictor.header}</h3>
          <div className="flex flex-col gap-1">
            <div className="relative h-10 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden border border-neutral-300 dark:border-neutral-700">
              <div
                className="absolute left-0 top-0 h-full transition-all duration-300"
                style={{
                  width: `${data.predictor.awayTeam.gameProjection}%`,
                  backgroundColor: `#${headerAwayTeam?.team.color || '000000'}`,
                }}
              />
              <div
                className="absolute right-0 top-0 h-full transition-all duration-300"
                style={{
                  width: `${data.predictor.homeTeam.gameProjection}%`,
                  backgroundColor: `#${headerHomeTeam?.team.color || '000000'}`,
                }}
              />
            </div>
            <div className="flex justify-between text-sm font-medium text-neutral-900 dark:text-neutral-100">
              <span>{Number(data.predictor.awayTeam.gameProjection).toFixed(1)}%</span>
              <span>{Number(data.predictor.homeTeam.gameProjection).toFixed(1)}%</span>
            </div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-neutral-900 dark:text-neutral-100">
            <div className="flex items-center gap-2">
              <Image
                src={headerAwayTeam?.team.logos[0].href || ''}
                alt={headerAwayTeam?.team.displayName || ''}
                width={24}
                height={24}
                className={cn('size-6', {
                  'dark:invert': headerAwayTeam?.team.color === '000000',
                })}
                unoptimized
              />
              <span className="font-medium">{headerAwayTeam?.team.displayName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{headerHomeTeam?.team.displayName}</span>
              <Image
                src={headerHomeTeam?.team.logos[0].href || ''}
                alt={headerHomeTeam?.team.displayName || ''}
                width={24}
                height={24}
                className={cn('size-6', {
                  'dark:invert': headerHomeTeam?.team.color === '000000',
                })}
                unoptimized
              />
            </div>
          </div>
        </div>
      )}

      {/* Conference Standings for Pre-Game */}
      {isPreGame && data.standings && (
        <div className="w-full mt-4 mb-6 flex flex-wrap justify-center gap-8">
          {data.standings.groups.map((group, index) => {
            const entries = group.standings.entries;
            const hasTeam = entries.some(
              (entry) =>
                [headerHomeTeam?.team.displayName, headerAwayTeam?.team.displayName].includes(entry.team) || [headerHomeTeam?.team.id, headerAwayTeam?.team.id].includes(entry.id)
            );

            if (!hasTeam) return null;

            // Simplify conference header text by removing just "Conference" word
            const simplifiedHeader = group.header.replace(/\sConference\s?/, ' ').replace(/(\d{4}-\d{2})\s+(\w+)/, '$1 $2');

            return (
              <div key={index} className="w-full max-w-lg flex-1 min-w-[400px]">
                <h3 className="text-base font-semibold mb-2 text-neutral-800 dark:text-neutral-200">{simplifiedHeader}</h3>
                <div className="overflow-x-auto bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md">
                  <table className="w-full table-auto text-sm">
                    <thead>
                      <tr className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
                        <th className="w-6 py-1.5 text-center text-neutral-600 dark:text-neutral-400 font-medium">#</th>
                        <th className="px-2 py-1.5 text-left text-neutral-600 dark:text-neutral-400 font-medium">Team</th>
                        <th className="w-16 py-1.5 text-center text-neutral-600 dark:text-neutral-400 font-medium">CONF</th>
                        <th className="w-12 py-1.5 text-center text-neutral-600 dark:text-neutral-400 font-medium">GB</th>
                        <th className="w-16 py-1.5 text-center text-neutral-600 dark:text-neutral-400 font-medium">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {entries.map((entry, idx) => {
                        const confRecord = entry.stats.find((s) => s.type === 'vsconf')?.summary || '0-0';
                        const totalRecord = entry.stats.find((s) => s.type === 'total')?.summary || '0-0';
                        const gamesBehind = entry.stats.find((s) => s.type === 'vsconf_gamesbehind')?.displayValue || '-';
                        const isCurrentTeam =
                          entry.team === headerHomeTeam?.team.displayName ||
                          entry.team === headerAwayTeam?.team.displayName ||
                          entry.id === headerHomeTeam?.team.id ||
                          entry.id === headerAwayTeam?.team.id;
                        
                        const isDarkLogo = DARK_COLORED_LOGOS.some(darkTeam => entry.team && darkTeam.includes(entry.team));
                        const logoIndex = isDarkLogo ? 1 : 0;

                        return (
                          <tr
                            key={entry.id}
                            className={cn('border-b border-neutral-200 dark:border-neutral-800', {
                              'bg-neutral-50/80 dark:bg-neutral-800 border-l-2  border-neutral-500 dark:border-neutral-950 dark:border-l-neutral-400': isCurrentTeam,
                            })}
                          >
                            <td className="py-1.5 text-center font-medium text-neutral-800 dark:text-neutral-200">{idx + 1}</td>
                            <td className="px-2 py-1.5">
                              <div className="flex items-center gap-2">
                                <div className="rounded-full flex items-center justify-center w-6 h-6 overflow-hidden shrink-0">
                                  {entry.logo && entry.logo[0] && (
                                    <Link href={`/${league}/${entry.id}`}>
                                      <Image
                                        src={entry.logo[logoIndex]?.href || entry.logo[0].href}
                                        alt={entry.team}
                                        className="size-6 object-contain"
                                        width={24}
                                        height={24}
                                        unoptimized
                                      />
                                    </Link>
                                  )}
                                </div>
                                <Link href={`/${league}/${entry.id}`} className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                                  {entry.team}
                                </Link>
                              </div>
                            </td>
                            <td className="py-1.5 text-center text-neutral-700 dark:text-neutral-300 tabular-nums">{confRecord}</td>
                            <td className="py-1.5 text-center text-neutral-700 dark:text-neutral-300 tabular-nums">{gamesBehind}</td>
                            <td className="py-1.5 text-center text-neutral-700 dark:text-neutral-300 tabular-nums">{totalRecord}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quarter by Quarter Scoreboard */}
      {(data.header.competitions[0].status.type.completed || data.header.competitions[0].status.type.state === 'in') && headerHomeTeam && headerAwayTeam && headerHomeTeam.linescores && headerAwayTeam.linescores && (
        <div className="w-full max-w-4xl mt-2 overflow-x-auto mb-1 md:mb-0">
          <div className="flex justify-center">
            <table className="w-auto border-collapse bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-neutral-100 dark:bg-neutral-800 text-xs">
                  <th className="py-1 px-2 text-left font-medium text-neutral-600 dark:text-neutral-400 w-[100px]">Team</th>
                  {/* Regular quarters (always show up to 4) */}
                  {Array.from({ length: Math.min(4, headerHomeTeam.linescores?.length || 4) }).map((_, i) => (
                    <th key={i} className="py-1 px-1 text-center font-medium text-neutral-600 dark:text-neutral-400 w-6">
                      {i + 1}
                    </th>
                  ))}
                  {/* Add OT columns if they exist */}
                  {headerHomeTeam.linescores && headerHomeTeam.linescores.length > 4 && (
                    Array.from({ length: headerHomeTeam.linescores.length - 4 }).map((_, i) => (
                      <th key={`ot${i}`} className="py-1 px-1 text-center font-medium text-neutral-600 dark:text-neutral-400 w-6">
                        OT{i + 1}
                      </th>
                    ))
                  )}
                  <th className="py-1 px-1 text-center font-medium text-neutral-600 dark:text-neutral-400 w-7 border-l border-neutral-200 dark:border-neutral-800">T</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-xs">
                {/* Away Team */}
                <tr>
                  <td className="py-1 px-2 font-medium text-neutral-900 dark:text-neutral-100">
                    <div className="flex items-center gap-1">
                      <Image
                        src={awayTeam?.team.logo || headerAwayTeam.team.logos[0].href}
                        alt={headerAwayTeam.team.displayName}
                        width={16}
                        height={16}
                        className={cn('size-4', {
                          'dark:invert': headerAwayTeam.team.color === '000000',
                        })}
                        unoptimized
                      />
                      <span className="text-xs">{headerAwayTeam.team.abbreviation || headerAwayTeam.team.displayName.split(' ')[0]}</span>
                    </div>
                  </td>
                  {headerAwayTeam.linescores?.map((score, i) => (
                    <td key={i} className="py-1 px-1 text-center text-neutral-900 dark:text-neutral-100 tabular-nums font-medium text-xs">
                      {score.displayValue || '0'}
                    </td>
                  ))}
                  <td
                    className={cn('py-1 px-1 text-center text-neutral-900 dark:text-neutral-100 tabular-nums text-xs border-l border-neutral-200 dark:border-neutral-800', {
                      'font-extrabold': isAwayWinner,
                      'font-normal': !isAwayWinner,
                    })}
                  >
                    {awayScore}
                  </td>
                </tr>
                {/* Home Team */}
                <tr>
                  <td className="py-1 px-2 font-medium text-neutral-900 dark:text-neutral-100">
                    <div className="flex items-center gap-1">
                      <Image
                        src={homeTeam?.team.logo || headerHomeTeam.team.logos[0].href}
                        alt={headerHomeTeam.team.displayName}
                        width={16}
                        height={16}
                        className={cn('size-4', {
                          'dark:invert': headerHomeTeam.team.color === '000000',
                        })}
                        unoptimized
                      />
                      <span className="text-xs">{headerHomeTeam.team.abbreviation || headerHomeTeam.team.displayName.split(' ')[0]}</span>
                    </div>
                  </td>
                  {headerHomeTeam.linescores?.map((score, i) => (
                    <td key={i} className="py-1 px-1 text-center text-neutral-900 dark:text-neutral-100 tabular-nums font-medium text-xs">
                      {score.displayValue || '0'}
                    </td>
                  ))}
                  <td
                    className={cn('py-1 px-1 text-center text-neutral-900 dark:text-neutral-100 tabular-nums text-xs border-l border-neutral-200 dark:border-neutral-800', {
                      'font-extrabold': isHomeWinner,
                      'font-normal': !isHomeWinner,
                    })}
                  >
                    {homeScore}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  if (isPreGame) {
    return <div className="max-w-[1800px] mx-auto px-2">{renderGameHeader()}</div>;
  }

  if (!homePlayers || !awayPlayers) {
    return (
      <div className="max-w-[1800px] mx-auto px-2">
        {renderGameHeader()}
        <div className="text-center text-sm text-neutral-500">No stats available</div>
      </div>
    );
  }

  const statHeaders = awayPlayers.statistics[0].labels;
  const statDescriptions = awayPlayers.statistics[0].descriptions;

  // Calculate max active players for padding
  const homeActiveStarters = homePlayers.statistics[0].athletes.filter((p) => p.starter && !p.stats.every((s) => s === '--')).length;
  const awayActiveStarters = awayPlayers.statistics[0].athletes.filter((p) => p.starter && !p.stats.every((s) => s === '--')).length;
  const homeActiveBench = homePlayers.statistics[0].athletes.filter((p) => !p.starter && !p.didNotPlay && !p.stats.every((s) => s === '--')).length;
  const awayActiveBench = awayPlayers.statistics[0].athletes.filter((p) => !p.starter && !p.didNotPlay && !p.stats.every((s) => s === '--')).length;

  const maxStarters = Math.max(homeActiveStarters, awayActiveStarters);
  const maxBench = Math.max(homeActiveBench, awayActiveBench);

  const renderPlayer = (player: PlayerData, isHome: boolean) => {
    const isInactive = player.stats.every((stat: string) => stat === '--');
    const isDNP = player.didNotPlay;

    // Get initials for placeholder
    const getInitials = (name: string) => {
      return name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    const { reorderedStats } = reorderStats(player.stats, awayPlayers.statistics[0].names);
    const { reorderedHeaders } = reorderStats(awayPlayers.statistics[0].names, awayPlayers.statistics[0].names);

    const renderStat = (stat: string, header: string, index: number) => {
      if (stat === '--') return stat;

      // For FG, 3PT, and FT, show percentage
      if (header === 'FG' || header === '3PT' || header === 'FT') {
        const nextHeader = reorderedHeaders[index + 1];
        const nextStat = reorderedStats[index + 1];
        if (nextHeader?.includes('%') && nextStat) {
          return (
            <div className="flex flex-col leading-none">
              <span className="text-[9px] xs:text-[10px] sm:text-xs xl:text-[9px] 2xl:text-xs">{stat}</span>
              <span className="text-[7px] xs:text-[8px] sm:text-[9px] xl:text-[7px] 2xl:text-xs text-neutral-500">{nextStat}</span>
            </div>
          );
        }
      }
      // Skip percentage columns as they're now shown with their corresponding stats
      if (header.includes('%')) {
        return null;
      }

      return stat;
    };

    return (
      <tr
        key={player.athlete.id}
        className={cn('group hover:bg-neutral-50 dark:hover:bg-neutral-800/50', {
          'h-[32px]': isInactive || isDNP,
        })}
      >
        <td className={cn("sticky left-0 bg-white dark:bg-neutral-900 group-hover:bg-neutral-50 dark:group-hover:bg-neutral-800/50 w-[100px] xs:w-[120px] sm:w-[140px] lg:w-[160px] xl:w-[110px] 2xl:w-[180px]", {
          "py-0.5 pl-1.5 xs:pl-2 sm:pl-3 pr-1": !isInactive && !isDNP,
          "py-0 pl-1.5 xs:pl-2 sm:pl-3 pr-1": isInactive || isDNP,
        })}>
          <div className="flex items-center gap-1 sm:gap-2">
            <div
              className={cn('relative shrink-0', {
                'w-6 xs:w-7 sm:w-8 md:w-10 h-6 xs:h-7 sm:h-8 md:h-10': !isInactive && !isDNP,
                'w-4 xs:w-5 sm:w-6 h-4 xs:h-5 sm:h-6': isInactive || isDNP,
              })}
            >
              {player.athlete.headshot ? (
                player.athlete.links?.[0]?.href ? (
                  <Link href={player.athlete.links[0].href} target="_blank" className="block">
                    <Image src={player.athlete.headshot.href} alt={player.athlete.displayName} fill className="rounded-full object-cover" unoptimized />
                  </Link>
                ) : (
                  <Image src={player.athlete.headshot.href} alt={player.athlete.displayName} fill className="rounded-full object-cover" unoptimized />
                )
              ) : (
                <div
                  className={cn(
                    'w-[85%] h-[85%] rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center',
                    'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
                    {
                      'text-[8px] xs:text-[10px] sm:text-xs font-medium text-neutral-600 dark:text-neutral-400': !isInactive && !isDNP,
                      'text-[8px] xs:text-[9px] sm:text-[10px] font-medium text-neutral-600 dark:text-neutral-400': isInactive || isDNP,
                    }
                  )}
                >
                  {getInitials(player.athlete.displayName)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center">
                {player.athlete.links?.[0]?.href ? (
                  <Link
                    href={player.athlete.links[0].href}
                    target="_blank"
                    className={cn("text-neutral-900 dark:text-neutral-100 truncate no-underline hover:text-neutral-600 dark:hover:text-neutral-300", {
                      "font-medium text-[10px] xs:text-xs sm:text-sm": !isInactive && !isDNP,
                      "font-normal text-[9px] xs:text-[10px] sm:text-xs": isInactive || isDNP,
                    })}
                  >
                    {player.athlete.displayName}
                  </Link>
                ) : (
                  <span className={cn("text-neutral-900 dark:text-neutral-100 truncate", {
                    "font-medium text-[10px] xs:text-xs sm:text-sm": !isInactive && !isDNP,
                    "font-normal text-[9px] xs:text-[10px] sm:text-xs": isInactive || isDNP,
                  })}>
                    {player.athlete.displayName}
                  </span>
                )}
              </div>
              {!isInactive && !isDNP ? (
                <div className="flex gap-0.5 xs:gap-1 items-center text-[9px] xs:text-[10px] sm:text-[11px] text-neutral-500">
                  <span>#{player.athlete.jersey}</span>
                  <span>{player.athlete.position.abbreviation}</span>
                </div>
              ) : (
                <div className="flex gap-0.5 xs:gap-1 items-center text-[7px] xs:text-[8px] sm:text-[9px] text-neutral-500 leading-none">
                  <span>#{player.athlete.jersey}</span>
                  <span>{player.athlete.position.abbreviation}</span>
                </div>
              )}
            </div>
          </div>
        </td>
        {isInactive || isDNP ? (
          <td colSpan={statHeaders.length} className="text-xs text-neutral-500 text-left pl-2 group-hover:bg-neutral-50 dark:group-hover:bg-neutral-800/50">
            {isDNP ? 'DNP' : 'Inactive'}
          </td>
        ) : (
          reorderedStats.map((stat, index) => {
            const content = renderStat(stat, reorderedHeaders[index], index);
            if (content === null) return null;
            return (
              <td
                key={index}
                className="py-0 w-[22px] xs:w-[25px] sm:w-[28px] lg:w-[32px] xl:w-[10px] 2xl:w-[20px] text-center text-[10px] xs:text-[11px] sm:text-xs xl:text-[10px] 2xl:text-xs tabular-nums text-neutral-800 dark:text-neutral-200 group-hover:bg-neutral-50 dark:group-hover:bg-neutral-800/50 px-0.5 xl:-mx-0.5 2xl:mx-0"
              >
                {content}
              </td>
            );
          })
        )}
      </tr>
    );
  };

  const renderTeamSection = (players: typeof homePlayers, team: typeof homeTeam, isHome: boolean) => {
    const isGameOver = data.header.competitions[0].status.type.completed;

    // Sort function for players by points, then assists, then rebounds
    const sortPlayersByPoints = (a: PlayerData, b: PlayerData) => {
      // Get stats indices from the statHeaders array
      const pointsIndex = statHeaders.findIndex((header) => header === 'PTS');
      const assistsIndex = statHeaders.findIndex((header) => header === 'AST');
      const reboundsIndex = statHeaders.findIndex((header) => header === 'REB');

      // Compare points first
      const aPoints = parseInt(a.stats[pointsIndex]) || 0;
      const bPoints = parseInt(b.stats[pointsIndex]) || 0;
      if (aPoints !== bPoints) {
        return bPoints - aPoints; // Sort points in descending order
      }

      // If points are tied, compare assists
      const aAssists = parseInt(a.stats[assistsIndex]) || 0;
      const bAssists = parseInt(b.stats[assistsIndex]) || 0;
      if (aAssists !== bAssists) {
        return bAssists - aAssists; // Sort assists in descending order
      }

      // If assists are tied, compare rebounds
      const aRebounds = parseInt(a.stats[reboundsIndex]) || 0;
      const bRebounds = parseInt(b.stats[reboundsIndex]) || 0;
      return bRebounds - aRebounds; // Sort rebounds in descending order
    };

    // Sort and filter players
    const activeStarters = players.statistics[0].athletes.filter((p) => p.starter && !p.stats.every((s) => s === '--')).sort(sortPlayersByPoints);
    const activeBench = players.statistics[0].athletes.filter((p) => !p.starter && !p.didNotPlay && !p.stats.every((s) => s === '--')).sort(sortPlayersByPoints);

    // Handle inactive and DNP players based on game status
    const inactivePlayers = isGameOver
      ? players.statistics[0].athletes.filter((p) => p.stats.every((s) => s === '--') && !p.didNotPlay)
      : players.statistics[0].athletes.filter((p) => p.stats.every((s) => s === '--'));

    // Only show DNP players after game is over
    const dnpPlayers = isGameOver ? players.statistics[0].athletes.filter((p) => p.didNotPlay) : [];

    // Calculate needed spacers
    const starterSpacers = maxStarters - activeStarters.length;
    const benchSpacers = maxBench - activeBench.length;

    return (
      <div className={cn('lg:' + (isHome ? 'pl-1' : 'pr-1'))}>
        <div
          className={cn('flex items-center gap-1 mb-1', {
            'justify-end': isHome,
          })}
        >
          {!isHome && (
            <Image
              src={team.team.logo}
              alt={team.team.displayName}
              width={20}
              height={20}
              className={cn('size-7', {
                'dark:invert': team.team.color === '000000',
              })}
              unoptimized
            />
          )}
          <h3 className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">{team.team.displayName}</h3>
          {isHome && (
            <Image
              src={team.team.logo}
              alt={team.team.displayName}
              width={20}
              height={20}
              className={cn('size-7', {
                'dark:invert': team.team.color === '000000',
              })}
              unoptimized
            />
          )}
        </div>

        <div className={cn('rounded', 'bg-white dark:bg-neutral-900', 'border border-neutral-200 dark:border-neutral-800')}>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-neutral-100 dark:bg-neutral-800">
                <th className="py-1 px-1.5 text-left font-medium text-[10px] xs:text-[11px] sm:text-xs text-neutral-600 dark:text-neutral-400 sticky left-0 bg-neutral-100 dark:bg-neutral-800 w-[100px] xs:w-[120px] sm:w-[140px] lg:w-[160px] xl:w-[110px] 2xl:w-[180px]">
                  STARTERS
                </th>
                {reorderStats([], statHeaders).reorderedHeaders.map((header, index) => {
                  if (header.includes('%')) return null;
                  return (
                    <th
                      key={header}
                      className="py-0 w-[22px] xs:w-[25px] sm:w-[28px] lg:w-[32px] xl:w-[10px] 2xl:w-[10px] text-center font-medium text-[10px] xs:text-[11px] sm:text-xs xl:text-[10px] 2xl:text-xs text-neutral-600 dark:text-neutral-400 px-0.5 xl:-mx-0.5 2xl:mx-0"
                      title={statDescriptions[statHeaders.indexOf(header)]}
                    >
                      {header}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {/* Active Starters */}
              {activeStarters.map((player) => renderPlayer(player, isHome))}
              {/* Add spacers for starters if needed */}
              {Array.from({ length: starterSpacers }).map((_, i) => (
                <tr key={`starter-spacer-${i}`}>
                  <td colSpan={statHeaders.length + 1} className="h-[37px]"></td>
                </tr>
              ))}

              {/* Bench Header */}
              <tr>
                <td
                  colSpan={statHeaders.length + 1}
                  className="py-1 px-2 text-left font-medium text-xs text-neutral-600 dark:text-neutral-400 sticky left-0 bg-neutral-100 dark:bg-neutral-800"
                >
                  BENCH
                </td>
              </tr>

              {/* Active Bench */}
              {activeBench.map((player) => renderPlayer(player, isHome))}
              {/* Add spacers for bench if needed */}
              {Array.from({ length: benchSpacers }).map((_, i) => (
                <tr key={`bench-spacer-${i}`} className="h-[37px]">
                  <td className="sticky left-0 bg-white dark:bg-neutral-900 py-0.5 pl-3 pr-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 shrink-0"></div>
                      <div className="min-w-0 flex-1">
                        <div className="h-4"></div>
                        <div className="h-3"></div>
                      </div>
                    </div>
                  </td>
                  {Array.from({ length: statHeaders.length }).map((_, j) => (
                    <td key={j}></td>
                  ))}
                </tr>
              ))}

              {/* Team Totals */}
              <tr className="bg-neutral-100 dark:bg-neutral-800 font-medium border-t-2 border-neutral-300 dark:border-neutral-700">
                <td className="py-2 px-2 text-left text-sm text-neutral-900 dark:text-neutral-100 sticky left-0 bg-neutral-100 dark:bg-neutral-800 font-bold">TOTALS</td>
                {reorderStats([], statHeaders).reorderedHeaders.map((header, index) => {
                  const statName = statAbbreviationMap[header];
                  // For points, use the totals array from players statistics
                  if (header === 'PTS') {
                    const totals = players.statistics[0].totals;
                    return (
                      <td
                        key={header}
                        className="py-2 w-[40px] min-w-[40px] max-w-[40px] text-center text-sm tabular-nums text-neutral-900 dark:text-neutral-100 font-bold px-0.5 overflow-hidden"
                      >
                        {totals[totals.length - 1] || ''}
                      </td>
                    );
                  }
                  const stat = team.statistics.find((s) => s.name === statName);
                  return (
                    <td
                      key={header}
                      className="py-2 w-[40px] min-w-[40px] max-w-[40px] text-center text-sm tabular-nums text-neutral-900 dark:text-neutral-100 font-bold px-0.5 overflow-hidden"
                    >
                      {stat?.displayValue || ''}
                    </td>
                  );
                })}
              </tr>

              {/* Gap after totals */}
              <tr>
                <td colSpan={statHeaders.length + 1} className="h-0 border-t-2 border-neutral-300 dark:border-neutral-700"></td>
              </tr>

              {/* Inactive Players */}
              {inactivePlayers.length > 0 && (
                <>
                  <tr>
                    <td
                      colSpan={statHeaders.length + 1}
                      className="py-1 px-2 text-left font-medium text-xs text-neutral-600 dark:text-neutral-400 sticky left-0 bg-neutral-100 dark:bg-neutral-800"
                    >
                      INACTIVE
                    </td>
                  </tr>
                  {inactivePlayers.map((player) => renderPlayer(player, isHome))}
                </>
              )}

              {/* DNP Players */}
              {dnpPlayers.length > 0 && (
                <>
                  <tr>
                    <td
                      colSpan={statHeaders.length + 1}
                      className="py-1 px-2 text-left font-medium text-xs text-neutral-600 dark:text-neutral-400 sticky left-0 bg-neutral-100 dark:bg-neutral-800"
                    >
                      DID NOT PLAY
                    </td>
                  </tr>
                  {dnpPlayers.map((player) => renderPlayer(player, isHome))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-[1800px] mx-auto px-2 mb-5">
      {renderGameHeader()}

      {/* Box Score Header */}

      {/* Box Score Content */}
      <div className="xl:grid min-[1450px]:grid-cols-2 gap-4 xl:gap-0 2xl:gap-12 py-1">
        <div className="mb-8 xl:mb-0 xl:pr-1 2xl:pr-0">
          {renderTeamSection(awayPlayers, awayTeam, false)}
        </div>
        <div className="xl:pl-1 2xl:pl-0">
          {renderTeamSection(homePlayers, homeTeam, true)}
        </div>
      </div>

      {/* Box Score Link */}
      {(data.header.competitions[0].status.type.completed || data.header.competitions[0].status.type.state === 'in') && (
        <div className="mt-4 flex justify-center gap-6">
          <Link
            href={data.header.links.find((link) => link.rel.includes('boxscore'))?.href || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-400 transition-colors z-50 flex items-center gap-2"
          >
            <Table size={14} />
            <span className="text-sm">Box Score</span>
          </Link>
          <Link
            href={data.header.links.find((link) => link.rel.includes('teamstats'))?.href || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-400 transition-colors z-50 flex items-center gap-2"
          >
            <ChartBar size={14} />
            <span className="text-sm">Team Stats</span>
          </Link>
          <Link
            href={data.header.links.find((link) => link.rel.includes('pbp'))?.href || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-400 transition-colors z-50 flex items-center gap-2"
          >
            <List size={14} />
            <span className="text-sm">Play-by-Play</span>
          </Link>
        </div>
      )}
    </div>
  );
}
