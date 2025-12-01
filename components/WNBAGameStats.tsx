import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import GameDateTime from './GameDateTime';
import { Table } from '@/components/icons/Table';
import { ChartBar, List } from 'lucide-react';
import { DARK_COLORED_LOGOS } from '@/lib/consts';

interface WNBAGameStatsProps {
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
          score?: string;
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
          logo?: string;
          color?: string;
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
          logo?: string;
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
      status?: {
        type: {
          state: string;
          completed: boolean;
          description: string;
        };
        period: number;
        displayClock: string;
      };
      date: string;
      attendance?: number;
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
    injuries?: Array<{
      team: {
        id: string;
        displayName: string;
        logo: string;
      };
      injuries: Array<{
        status: string;
        athlete: {
          id: string;
          displayName: string;
          position: {
            abbreviation: string;
          };
          headshot?: {
            href: string;
          };
        };
        details: {
          type: string;
          detail?: string;
          side?: string;
          returnDate?: string;
        };
      }>;
    }>;
    seasonseries?: Array<{
      summary: string;
      events: Array<{
        id: string;
        date: string;
        broadcasts?: Array<{
          media: {
            shortName: string;
          };
        }>;
        competitors: Array<{
          homeAway: string;
          team: {
            id: string;
            displayName: string;
            abbreviation: string;
            logos?: Array<{
              href: string;
            }>;
            color?: string;
          };
          score: string;
        }>;
      }>;
    }>;
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

const statDisplayOrder = [
  { name: 'minutes', label: 'MIN', fullLabel: 'Minutes' },
  { name: 'points', label: 'PTS', fullLabel: 'Points' },
  { name: 'assists', label: 'AST', fullLabel: 'Assists' },
  { name: 'totalRebounds', label: 'REB', fullLabel: 'Rebounds' },
  { name: 'offensiveRebounds', label: 'OREB', fullLabel: 'Offensive Rebounds' },
  { name: 'defensiveRebounds', label: 'DREB', fullLabel: 'Defensive Rebounds' },
  { name: 'steals', label: 'STL', fullLabel: 'Steals' },
  { name: 'blocks', label: 'BLK', fullLabel: 'Blocks' },
  { name: 'turnovers', label: 'TO', fullLabel: 'Turnovers' },
  { name: 'fouls', label: 'PF', fullLabel: 'Personal Fouls' },
  { name: 'fieldGoalsMade-fieldGoalsAttempted', label: 'FG', fullLabel: 'Field Goals' },
  { name: 'fieldGoalPct', label: 'FG%', fullLabel: 'Field Goal %' },
  { name: 'threePointFieldGoalsMade-threePointFieldGoalsAttempted', label: '3PT', fullLabel: '3-Point FG' },
  { name: 'threePointFieldGoalPct', label: '3P%', fullLabel: '3-Point %' },
  { name: 'freeThrowsMade-freeThrowsAttempted', label: 'FT', fullLabel: 'Free Throws' },
  { name: 'freeThrowPct', label: 'FT%', fullLabel: 'Free Throw %' },
];

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

export default function WNBAGameStats({ data, league }: WNBAGameStatsProps) {
  const homeTeam = data?.boxscore?.teams?.find((team) => team.homeAway === 'home');
  const awayTeam = data?.boxscore?.teams?.find((team) => team.homeAway === 'away');
  const awayPlayers = data?.boxscore?.players?.find((team) => team.team.id === awayTeam?.team.id);
  const homePlayers = data?.boxscore?.players?.find((team) => team.team.id === homeTeam?.team.id);

  const isPreGame = !homeTeam || !awayTeam || Object.keys(data.boxscore).length === 0 || data.header.competitions[0].status.type.state === 'pre';

  // Get teams from header for pregame state
  const headerHomeTeam = data.header.competitions[0].competitors.find((team) => team.homeAway === 'home');
  const headerAwayTeam = data.header.competitions[0].competitors.find((team) => team.homeAway === 'away');

  // Helper function to safely get team logo URL
  const getTeamLogoUrl = (team: any) => {
    if (team?.team?.logo) return team.team.logo;
    if (team?.team?.logos && team.team.logos.length > 0) return team.team.logos[0].href;
    return undefined;
  };

  // Helper function to get team initial for fallback
  const getTeamInitial = (team: any) => {
    if (team?.team?.abbreviation) return team.team.abbreviation.charAt(0);
    if (team?.team?.displayName) return team.team.displayName.charAt(0);
    return '?';
  };

  // Function to reorder stats based on our desired order
  const reorderStats = (stats: string[], headers: string[]) => {
    // Change the order to match ESPN layout with MIN at end
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

    const headerCompetitor = data.header.competitions[0].competitors.find(
      (c) => c.team.id === team.team.id
    );
    if (headerCompetitor?.score) {
      return headerCompetitor.score;
    }

    if (headerCompetitor?.linescores && headerCompetitor.linescores.length > 0) {
      const totalFromLinescores = headerCompetitor.linescores.reduce((sum, period) => {
        const periodScore = parseInt(period.displayValue || '0', 10);
        return sum + (isNaN(periodScore) ? 0 : periodScore);
      }, 0);
      if (totalFromLinescores > 0) {
        return totalFromLinescores.toString();
      }
    }

    const points = team.statistics.find((stat) => stat.name === 'points');
    if (points?.displayValue) {
      return points.displayValue;
    }

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

  // Render game header
  const renderGameHeader = () => (
    <div className="flex flex-col items-center justify-center gap-1 mb-0">
      <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-[1600px] px-4 gap-3 md:gap-0">
        {/* Away Team */}
        <div className="flex-1 flex flex-col md:flex-row items-center gap-2 md:gap-4 md:justify-end">
          <div className="order-1 md:order-1">
            <Link href={`/${league}/${headerAwayTeam?.team.id}`} className="block">
              {isPreGame
                ? (getTeamLogoUrl(headerAwayTeam) ? (
                    <Image
                      src={getTeamLogoUrl(headerAwayTeam)}
                      alt={headerAwayTeam?.team.displayName || ''}
                      width={64}
                      height={64}
                      className={cn('size-14 md:size-16', {
                        'dark:invert': headerAwayTeam?.team.color === '000000',
                      })}
                      unoptimized
                    />
                  ) : (
                    <div className="size-14 md:size-16 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center text-neutral-800 dark:text-neutral-200 font-bold">
                      {getTeamInitial(headerAwayTeam)}
                    </div>
                  ))
                : (getTeamLogoUrl(awayTeam) ? (
                    <Image
                      src={getTeamLogoUrl(awayTeam)}
                      alt={awayTeam?.team.displayName || ''}
                      width={64}
                      height={64}
                      className={cn('size-14 md:size-16', {
                        'dark:invert': awayTeam?.team.color === '000000',
                      })}
                      unoptimized
                    />
                  ) : (
                    <div className="size-14 md:size-16 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center text-neutral-800 dark:text-neutral-200 font-bold">
                      {getTeamInitial(awayTeam || headerAwayTeam)}
                    </div>
                  ))}
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
                {headerAwayTeam.record.find((r) => r.type === 'total')?.summary}
                {headerAwayTeam.record.find((r) => r.type === 'vsconf')?.summary && ` • ${headerAwayTeam.record.find((r) => r.type === 'vsconf')?.summary}`}
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
                {headerHomeTeam.record.find((r) => r.type === 'total')?.summary}
                {headerHomeTeam.record.find((r) => r.type === 'vsconf')?.summary && ` • ${headerHomeTeam.record.find((r) => r.type === 'vsconf')?.summary}`}
              </div>
            )}
          </div>
          <div className="order-1 md:order-3">
            <Link href={`/${league}/${headerHomeTeam?.team.id}`} className="block">
              {isPreGame
                ? (getTeamLogoUrl(headerHomeTeam) ? (
                    <Image
                      src={getTeamLogoUrl(headerHomeTeam)}
                      alt={headerHomeTeam?.team.displayName || ''}
                      width={64}
                      height={64}
                      className={cn('size-14 md:size-16', {
                        'dark:invert': headerHomeTeam?.team.color === '000000',
                      })}
                      unoptimized
                    />
                  ) : (
                    <div className="size-14 md:size-16 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center text-neutral-800 dark:text-neutral-200 font-bold">
                      {getTeamInitial(headerHomeTeam)}
                    </div>
                  ))
                : (getTeamLogoUrl(homeTeam) ? (
                    <Image
                      src={getTeamLogoUrl(homeTeam)}
                      alt={homeTeam?.team.displayName || ''}
                      width={64}
                      height={64}
                      className={cn('size-14 md:size-16', {
                        'dark:invert': homeTeam?.team.color === '000000',
                      })}
                      unoptimized
                    />
                  ) : (
                    <div className="size-14 md:size-16 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center text-neutral-800 dark:text-neutral-200 font-bold">
                      {getTeamInitial(homeTeam || headerHomeTeam)}
                    </div>
                  ))}
            </Link>
          </div>
        </div>
      </div>

      {/* Game Info */}
      <div className="text-center mt-1 md:mt-0">
        <GameDateTime gameDate={data.header.competitions[0].date} status={data.header.competitions[0].status} />
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          <span>
            {data.gameInfo.venue.fullName} • {data.gameInfo.venue.address.city}, {data.gameInfo.venue.address.state}
          </span>
        </div>

        {data.header.competitions[0].broadcasts?.[0] && <span className="text-xs text-neutral-400">{data.header.competitions[0].broadcasts[0].media.shortName}</span>}
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
              {getTeamLogoUrl(headerAwayTeam) ? (
                <Image
                  src={getTeamLogoUrl(headerAwayTeam)}
                  alt={headerAwayTeam?.team.displayName || ''}
                  width={24}
                  height={24}
                  className={cn('size-6', {
                    'dark:invert': headerAwayTeam?.team.color === '000000',
                  })}
                  unoptimized
                />
              ) : (
                <div className="size-6 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center text-[10px] text-neutral-800 dark:text-neutral-200 font-medium">
                  {getTeamInitial(headerAwayTeam)}
                </div>
              )}
              <span className="font-medium">{headerAwayTeam?.team.displayName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{headerHomeTeam?.team.displayName}</span>
              {getTeamLogoUrl(headerHomeTeam) ? (
                <Image
                  src={getTeamLogoUrl(headerHomeTeam)}
                  alt={headerHomeTeam?.team.displayName || ''}
                  width={24}
                  height={24}
                  className={cn('size-6', {
                    'dark:invert': headerHomeTeam?.team.color === '000000',
                  })}
                  unoptimized
                />
              ) : (
                <div className="size-6 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center text-[10px] text-neutral-800 dark:text-neutral-200 font-medium">
                  {getTeamInitial(headerHomeTeam)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Injuries Section for Pre-Game */}
      {isPreGame && data.injuries && data.injuries.length > 0 && (
        <div className="w-full max-w-5xl mt-4 p-3 border border-neutral-200 dark:border-neutral-800 rounded-xl">
          <h3 className="text-center text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-3">Injuries & Roster Notes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.injuries.map((teamInjuries, idx) => {
              const isAwayTeam = teamInjuries.team.id === headerAwayTeam?.team.id;
              const isHomeTeam = teamInjuries.team.id === headerHomeTeam?.team.id;
              
              if (!isAwayTeam && !isHomeTeam) return null;
              
              // Get team logo safely
              let teamLogoUrl: string | undefined = undefined;
              if (teamInjuries.team.logo) {
                teamLogoUrl = teamInjuries.team.logo;
              } else if (isAwayTeam && headerAwayTeam?.team.logos?.[0]?.href) {
                teamLogoUrl = headerAwayTeam.team.logos[0].href;
              } else if (isHomeTeam && headerHomeTeam?.team.logos?.[0]?.href) {
                teamLogoUrl = headerHomeTeam.team.logos[0].href;
              }
              
              return (
                <div key={idx} className="flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    {teamLogoUrl ? (
                      <Image
                        src={teamLogoUrl}
                        alt={teamInjuries.team.displayName}
                        width={24}
                        height={24}
                        className={cn('size-6', {
                          'dark:invert': isAwayTeam 
                            ? headerAwayTeam?.team.color === '000000'
                            : headerHomeTeam?.team.color === '000000',
                        })}
                        unoptimized
                      />
                    ) : (
                      <div className="size-6 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center text-[10px] text-neutral-800 dark:text-neutral-200 font-medium">
                        {isAwayTeam ? getTeamInitial(headerAwayTeam) : getTeamInitial(headerHomeTeam)}
                      </div>
                    )}
                    <h4 className="font-medium text-neutral-800 dark:text-neutral-200">{teamInjuries.team.displayName}</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    {teamInjuries.injuries.map((injury, injuryIdx) => (
                      <div key={injuryIdx} className="flex items-start gap-2 pb-2 border-b border-neutral-200 dark:border-neutral-800 last:border-0">
                        <div className="w-8 h-8 relative rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-800 flex-shrink-0">
                          {injury.athlete.headshot?.href ? (
                            <Image
                              src={injury.athlete.headshot.href}
                              alt={injury.athlete.displayName}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] text-neutral-600 dark:text-neutral-400">
                              {injury.athlete.displayName.split(' ').map(n => n[0]).join('')}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between">
                            <span className="font-medium text-neutral-800 dark:text-neutral-200">{injury.athlete.displayName}</span>
                            <span className={cn('text-xs px-1.5 py-0.5 rounded-full', {
                              'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300': injury.status === 'Out',
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300': injury.status === 'Day-To-Day',
                              'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300': injury.status === 'Questionable',
                              'bg-neutral-100 text-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-300': !['Out', 'Day-To-Day', 'Questionable'].includes(injury.status),
                            })}>
                              {injury.status}
                            </span>
                          </div>
                          <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                            <span>{injury.athlete.position.abbreviation} - </span>
                            <span>{injury.details.type}</span>
                            {injury.details.detail && ` (${injury.details.detail})`}
                            {injury.details.side && ` ${injury.details.side}`}
                            {injury.details.returnDate && ` - Expected Return: ${new Date(injury.details.returnDate).toLocaleDateString()}`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Season Series Section for Pre-Game */}
      {isPreGame && data.seasonseries && data.seasonseries.length > 0 && (
        <div className="w-full max-w-xl mt-4 p-3 border border-neutral-200 dark:border-neutral-800 rounded-xl">
          <h3 className="text-center text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-3">Season Series</h3>
          <div className="text-center text-sm text-neutral-700 dark:text-neutral-300 mb-2">{data.seasonseries[0].summary}</div>
          
          <div className="space-y-2">
            {data.seasonseries[0].events.map((event, eventIdx) => {
              const homeTeam = event.competitors.find(c => c.homeAway === 'home');
              const awayTeam = event.competitors.find(c => c.homeAway === 'away');
              const eventDate = new Date(event.date);
              const isPastGame = eventDate < new Date();
              
              const formattedDate = eventDate.toLocaleDateString(undefined, { 
                month: 'short', 
                day: 'numeric',
                year: eventDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
              });
              
              return (
                <div key={eventIdx} className="flex items-center p-2 bg-neutral-50 dark:bg-neutral-900 rounded-md border border-neutral-200 dark:border-neutral-800">
                  {/* Date and Broadcast (Keep on left) */}
                  <div className="w-1/4 text-sm text-left text-neutral-600 dark:text-neutral-400 flex-shrink-0">
                    {formattedDate}
                    {event.broadcasts && event.broadcasts[0] && (
                      <div className="text-xs text-neutral-500 dark:text-neutral-500">{event.broadcasts[0].media.shortName}</div>
                    )}
                  </div>

                  {/* Team, '@', and Score/Time Section */}
                  <div className="flex-1 flex items-center justify-center gap-2 text-sm">

                    {/* Away Team */}
                    <div className="flex items-center gap-1 flex-1 justify-end">
                      {getTeamLogoUrl(awayTeam) ? (
                        <Image
                          src={getTeamLogoUrl(awayTeam)}
                          alt={awayTeam?.team.displayName || ''}
                          width={16}
                          height={16}
                          className={cn('size-4', {
                            'dark:invert': headerAwayTeam?.team.color === '000000',
                          })}
                          unoptimized
                        />
                      ) : (
                        <div className="size-4 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center text-[8px] text-neutral-800 dark:text-neutral-200 font-medium">
                          {(awayTeam?.team.abbreviation || '?').charAt(0)}
                        </div>
                      )}
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">{awayTeam?.team.abbreviation}</span>
                    </div>

                    {/* '@' Symbol */}
                    <div className="text-neutral-500 dark:text-neutral-400 px-1">@</div>

                    {/* Home Team */}
                    <div className="flex items-center gap-1 flex-1 justify-start">
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">{homeTeam?.team.abbreviation}</span>
                      {getTeamLogoUrl(homeTeam) ? (
                        <Image
                          src={getTeamLogoUrl(homeTeam)}
                          alt={homeTeam?.team.displayName || ''}
                          width={16}
                          height={16}
                          className={cn('size-4', {
                            'dark:invert': headerHomeTeam?.team.color === '000000',
                          })}
                          unoptimized
                        />
                      ) : (
                        <div className="size-4 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center text-[8px] text-neutral-800 dark:text-neutral-200 font-medium">
                          {(homeTeam?.team.abbreviation || '?').charAt(0)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Score or Time (Move to far right) */}
                  <div className="text-right tabular-nums w-1/4 text-sm flex-shrink-0">
                    {isPastGame ? (
                      <div className="font-medium text-neutral-900 dark:text-neutral-100">
                        {awayTeam?.score} - {homeTeam?.score}
                      </div>
                    ) : (
                      <div className="text-neutral-500 dark:text-neutral-500">
                        {new Date(event.date).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quarter by Quarter Scoreboard */}
      {(data.header.competitions[0].status.type.completed || data.header.competitions[0].status.type.state === 'in') &&
        headerHomeTeam &&
        headerAwayTeam &&
        headerHomeTeam.linescores &&
        headerAwayTeam.linescores && (
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
                    {headerHomeTeam.linescores &&
                      headerHomeTeam.linescores.length > 4 &&
                      Array.from({ length: headerHomeTeam.linescores.length - 4 }).map((_, i) => (
                        <th key={`ot${i}`} className="py-1 px-1 text-center font-medium text-neutral-600 dark:text-neutral-400 w-6">
                          OT{i + 1}
                        </th>
                      ))}
                    <th className="py-1 px-1 text-center font-medium text-neutral-600 dark:text-neutral-400 w-7 border-l border-neutral-200 dark:border-neutral-800">T</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-xs">
                  {/* Away Team */}
                  <tr>
                    <td className="py-1 px-2 font-medium text-neutral-900 dark:text-neutral-100">
                      <div className="flex items-center gap-1">
                        {getTeamLogoUrl(awayTeam) ? (
                          <Image
                            src={getTeamLogoUrl(awayTeam)}
                            alt={headerAwayTeam.team.displayName}
                            width={16}
                            height={16}
                            className={cn('size-4', {
                              'dark:invert': headerAwayTeam.team.color === '000000',
                            })}
                            unoptimized
                          />
                        ) : (
                          <div className="size-4 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center text-[8px] text-neutral-800 dark:text-neutral-200">
                            {getTeamInitial(awayTeam || headerAwayTeam)}
                          </div>
                        )}
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
                        {getTeamLogoUrl(homeTeam) ? (
                          <Image
                            src={getTeamLogoUrl(homeTeam)}
                            alt={headerHomeTeam.team.displayName}
                            width={16}
                            height={16}
                            className={cn('size-4', {
                              'dark:invert': headerHomeTeam.team.color === '000000',
                            })}
                            unoptimized
                          />
                        ) : (
                          <div className="size-4 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center text-[8px] text-neutral-800 dark:text-neutral-200">
                            {getTeamInitial(homeTeam || headerHomeTeam)}
                          </div>
                        )}
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
        <td
          className={cn(
            'sticky left-0 bg-white dark:bg-neutral-900 group-hover:bg-neutral-50 dark:group-hover:bg-neutral-800/50',
            {
              'py-0.5 pl-2 pr-3': !isInactive && !isDNP,
              'py-0 pl-2 pr-3': isInactive || isDNP,
            }
          )}
        >
          <div className="flex items-center gap-1 sm:gap-2">
            <div
              className={cn('relative shrink-0', {
                'w-6 xs:w-7 sm:w-8 md:w-10 h-6 xs:h-7 sm:h-8 md:h-10': !isInactive && !isDNP,
                'w-4 xs:w-5 sm:w-6 h-4 xs:h-5 sm:h-6': isInactive || isDNP,
              })}
            >
              {player.athlete.headshot?.href ? (
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
                    className={cn('text-neutral-900 dark:text-neutral-100 truncate no-underline hover:text-neutral-600 dark:hover:text-neutral-300', {
                      'font-medium text-[10px] xs:text-xs sm:text-sm': !isInactive && !isDNP,
                      'font-normal text-[9px] xs:text-[10px] sm:text-xs': isInactive || isDNP,
                    })}
                  >
                    {player.athlete.displayName}
                  </Link>
                ) : (
                  <span
                    className={cn('text-neutral-900 dark:text-neutral-100 truncate', {
                      'font-medium text-[10px] xs:text-xs sm:text-sm': !isInactive && !isDNP,
                      'font-normal text-[9px] xs:text-[10px] sm:text-xs': isInactive || isDNP,
                    })}
                  >
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
                className="py-0 px-2 text-center text-[10px] xs:text-[11px] sm:text-xs xl:text-[10px] 2xl:text-xs tabular-nums text-neutral-800 dark:text-neutral-200 group-hover:bg-neutral-50 dark:group-hover:bg-neutral-800/50"
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
      <div className="w-full">
        <div
          className={cn('flex items-center gap-1 mb-1', {
            'justify-end': isHome,
          })}
        >
          {!isHome && (
            <Image
              src={team.team.logo || ''}
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
              src={team.team.logo || ''}
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

        <div className={cn('rounded', 'bg-white dark:bg-neutral-900', 'border border-neutral-200 dark:border-neutral-800', 'w-full overflow-x-auto')}>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-neutral-100 dark:bg-neutral-800">
                <th className="py-1 pl-2 pr-3 text-left font-medium text-[10px] xs:text-[11px] sm:text-xs text-neutral-600 dark:text-neutral-400 sticky left-0 bg-neutral-100 dark:bg-neutral-800">
                  STARTERS
                </th>
                {reorderStats([], statHeaders).reorderedHeaders.map((header, index) => {
                  if (header.includes('%')) return null;
                  return (
                    <th
                      key={header}
                      className="py-0 px-2 text-center font-medium text-[10px] xs:text-[11px] sm:text-xs xl:text-[10px] 2xl:text-xs text-neutral-600 dark:text-neutral-400"
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
                  if (header.includes('%')) return null;
                  const statName = statAbbreviationMap[header];
                  
                  // For points, use the totals array from players statistics
                  if (header === 'PTS') {
                    const totals = players.statistics[0].totals;
                    return (
                      <td
                        key={header}
                        className="py-2 text-center text-sm tabular-nums text-neutral-900 dark:text-neutral-100 font-bold px-2"
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

      {/* Box Score Content */}
      <div className="grid min-[1450px]:grid-cols-2 gap-4 py-1 w-full">
        <div className="w-full mb-8 min-[1450px]:mb-0">{renderTeamSection(awayPlayers, awayTeam, false)}</div>
        <div className="w-full">{renderTeamSection(homePlayers, homeTeam, true)}</div>
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