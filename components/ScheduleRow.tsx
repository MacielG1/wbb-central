'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import type { Event, Competitor } from '@/types/espn';
import { useEffect, useState } from 'react';
import getFavorites from '@/lib/getFavorites';
import fetchTeamData from '@/utils/fetchTeamData';
import { useRouter } from 'next/navigation';
import { StarIcon } from 'lucide-react';

interface ScheduleRowProps {
  game: Event;
  league: string;
  showOnlyTop25?: boolean;
  tRankMap?: Record<string, number>;
}

interface TeamDisplayProps {
  team: {
    id: string;
    displayName: string;
    shortDisplayName: string;
    location: string;
    name: string;
    color?: string;
  };
  logo: string;
  rank?: number;
  score?: string;
  isHome?: boolean;
  statistics?: { name: string; displayValue: string }[];
  competitor: Competitor;
  isCompleted: boolean;
  isInProgress: boolean;
  otherTeamScore: string | undefined;
  league: string;
  isFavorite?: boolean;
}

function TeamDisplay({ team, logo, rank, score, competitor, isCompleted, isInProgress, otherTeamScore, league, isFavorite }: TeamDisplayProps) {
  const getRecord = (competitor: Competitor) => {
    const record = competitor.records?.find((r) => r.type === 'total');
    return record?.summary || '0-0';
  };

  return (
    <div className="grid grid-cols-[1fr_auto] items-center w-full">
      <div className="flex items-center gap-1.5 min-w-0">
        <Link href={`/${league}/${team.id}`} className="z-[100]" onClick={(e) => e.stopPropagation()}>
          <div className="size-6 shrink-0">
            {logo ? (
              <Image
                src={logo}
                alt={''}
                width={24}
                height={24}
                className={cn('size-6 hover:scale-105 transition-all', {
                  'dark:invert': team.color === '000000',
                })}
                unoptimized
              />
            ) : (
              <div className="size-6 bg-transparent rounded-full" />
            )}
          </div>
        </Link>
        <span
          className={cn('text-xs font-semibold min-w-3.5 text-center shrink-0', {
            'text-white': rank && rank !== 99 && !isFavorite,
            invisible: !rank || rank === 99,
          })}
        >
          {rank && rank !== 99 ? rank : ''}
        </span>
        <div className="flex items-center min-w-0">
          <Link
            href={`/${league}/${team.id}`}
            className="truncate z-50 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors group"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="font-semibold group-hover:text-neutral-700 dark:group-hover:text-neutral-300">{team.location}</span>
            <span className="font-normal text-neutral-500 dark:text-neutral-400 ml-1 group-hover:text-neutral-600 dark:group-hover:text-neutral-300/60">{team.name}</span>
          </Link>
          <div className="flex items-center">
            <span className="text-xs text-neutral-500 ml-2 whitespace-nowrap pt-[1px]">{getRecord(competitor)}</span>
            {isFavorite && <StarIcon className="w-3.5 h-3.5 ml-2 text-[#bc7200] fill-current" />}
          </div>
        </div>
        
      </div>

      {isCompleted || isInProgress ? (
        <span
          className={cn('tabular-nums ml-4', {
            'font-semibold text-2xl': isCompleted || isInProgress,
            'text-green-600 dark:text-green-500': isCompleted && Number(score) > Number(otherTeamScore),
          })}
        >
          {score}
        </span>
      ) : (
        <></>
      )}
    </div>
  );
}

export default function ScheduleRow({ game, league, showOnlyTop25 = false}: ScheduleRowProps) {
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const competition = game.competitions[0];
  const homeTeam = competition.competitors.find((team: Competitor) => team.homeAway === 'home');
  const awayTeam = competition.competitors.find((team: Competitor) => team.homeAway === 'away');
  const router = useRouter();

  useEffect(() => {
    const favs = getFavorites();
    setFavorites(favs);
    const homeTeamId = homeTeam?.team?.id;
    const awayTeamId = awayTeam?.team?.id;
    const isHomeTeamFavorite = homeTeamId ? favs[homeTeamId] : false;
    const isAwayTeamFavorite = awayTeamId ? favs[awayTeamId] : false;

    // Prefetch favorite teams' data
    if (isHomeTeamFavorite || isAwayTeamFavorite) {
      const teamsToFetch = [];
      if (isHomeTeamFavorite && homeTeamId) teamsToFetch.push(homeTeamId);
      if (isAwayTeamFavorite && awayTeamId) teamsToFetch.push(awayTeamId);

      Promise.all(teamsToFetch.map((id) => fetchTeamData(id))).catch((error) => console.error('Error prefetching favorite teams:', error));
    }
  }, [homeTeam?.team?.id, awayTeam?.team?.id]);

  if (!homeTeam || !awayTeam) return null;

  // Filter for Top 25 matchups if showOnlyTop25 is true
  if (showOnlyTop25) {
    const homeTeamRank = homeTeam.curatedRank?.current;
    const awayTeamRank = awayTeam.curatedRank?.current;
    const isTop25Game = (homeTeamRank && homeTeamRank <= 25) || (awayTeamRank && awayTeamRank <= 25);
    const isAnyTeamFavorite = favorites[homeTeam.team.id] || favorites[awayTeam.team.id];
    if (!isTop25Game && !isAnyTeamFavorite) return null;
  }

  const isCompleted = game.status.type.completed;
  const isInProgress = game.status.type.state === 'in';
  const isPostponed = game.status.type.id === '6';

  const homeTeamLogo = homeTeam.team.logo;
  const awayTeamLogo = awayTeam.team.logo;

  const homeTeamRank = homeTeam.curatedRank?.current;
  const awayTeamRank = awayTeam.curatedRank?.current;

  const formattedTime = new Date(game.date)
    .toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
    .replace(/(\d{1,2})(?=:)/, (match) => {
      const hour = parseInt(match);
      const hour12 = hour % 12 || 12;
      return `${hour12}`;
    });

  // Get broadcast info
  const broadcast = competition.broadcasts?.[0]?.names?.[0];

  // Get box score link
  function goToGame() {
    router.push(`/${league}/game/${game.id}`);
  }

  return (
    <div
      onClick={goToGame}
      className={cn(
        'relative w-full text-left flex flex-col cursor-pointer px-3 sm:px-4 py-2 transition-colors border-b border-t border-neutral-200 dark:border-neutral-800 min-w-0 hover:bg-neutral-50 dark:hover:bg-neutral-900/35',
        'sm:nth-[2n]:border-l sm:odd:border-l sm:even:border-r',
        {
          '[&]:border-yellow-400 dark:[&]:border-yellow-600/50 [&]:border-t [&]:border-l [&]:border-r sm:[&]:border-r': favorites[homeTeam.team.id] || favorites[awayTeam.team.id],
          'first:border-neutral-200 dark:first:border-neutral-800': !favorites[homeTeam.team.id] && !favorites[awayTeam.team.id],
          'sm:last:odd:border-r sm:last:odd:w-[calc(100%+1px)]': !favorites[homeTeam.team.id] && !favorites[awayTeam.team.id],
        }
      )}
    >
      <a
        href={`/${league}/game/${game.id}`}
        className="absolute inset-0 z-0"
        onClick={(e) => {
          e.preventDefault();
          goToGame();
        }}
        role="button"
        aria-label={`View game details for ${awayTeam.team.name} vs ${homeTeam.team.name}`}
      />
      <div className="grid grid-cols-[1fr_auto]">
        <div className="col-start-2 mb-0.5 flex items-center gap-2">
          {isInProgress ? (
            <div className="text-sm text-red-600 dark:text-red-400 font-medium text-right">{game.status.type.shortDetail}</div>
          ) : isCompleted ? (
            <div className="text-sm text-neutral-500 dark:text-neutral-400 text-right">Final</div>
          ) : isPostponed ? (
            <div className="text-sm text-neutral-600 dark:text-neutral-400 font-medium text-right">Postponed</div>
          ) : (
            <div className="text-base text-neutral-500 dark:text-neutral-400 text-right">{formattedTime}</div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        <TeamDisplay
          team={awayTeam.team}
          logo={awayTeamLogo}
          rank={awayTeamRank}
          score={isPostponed ? undefined : awayTeam.score}
          statistics={awayTeam.statistics}
          competitor={awayTeam}
          isCompleted={isCompleted}
          isInProgress={isInProgress}
          otherTeamScore={isPostponed ? undefined : homeTeam.score || '0'}
          league={league}
          isFavorite={favorites[awayTeam.team.id]}
        />
        <TeamDisplay
          team={homeTeam.team}
          logo={homeTeamLogo}
          rank={homeTeamRank}
          score={isPostponed ? undefined : homeTeam.score}
          isHome={true}
          statistics={homeTeam.statistics}
          competitor={homeTeam}
          isCompleted={isCompleted}
          isInProgress={isInProgress}
          otherTeamScore={isPostponed ? undefined : awayTeam.score || '0'}
          league={league}
          isFavorite={favorites[homeTeam.team.id]}
        />
      </div>

      {(competition.venue?.address || broadcast) && (
        <div className="flex justify-end mt-1">
          <div className="text-xs text-neutral-500 truncate">
            {competition.venue?.address && (
              <span className="text-neutral-400">
                {competition.venue.address.city}
                {competition.venue.address.state && `, ${competition.venue.address.state}`}
              </span>
            )}
            {broadcast && (
              <span className="text-neutral-400">
                <span className="font-extralight text-sm mx-1">•</span>
                {broadcast}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
