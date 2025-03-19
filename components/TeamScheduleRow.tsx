'use client';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { DARK_COLORED_LOGOS } from '@/lib/consts';
import { useRouter } from 'next/navigation';
import { useState, useLayoutEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';

interface ScheduleRowProps {
  game: {
    id: string;
    date: string;
    name: string;
    shortName: string;
    season: {
      year: number;
      displayName: string;
    };
    seasonType: {
      id: string;
      type: number;
      name: string;
      abbreviation: string;
    };
    competitions: Array<{
      id: string;
      date: string;
      attendance: number;
      timeValid: boolean;
      neutralSite: boolean;
      boxscoreAvailable: boolean;
      ticketsAvailable: boolean;
      competitors: Array<{
        id: string;
        homeAway: string;
        team: {
          id: string;
          location: string;
          nickname: string;
          abbreviation: string;
          displayName: string;
          logos: Array<{
            href: string;
            width: number;
            height: number;
            alt: string;
            rel: string[];
          }>;
        };
        score?: { value: number; displayValue: string };
        winner?: boolean;
        curatedRank?: {
          current: number;
        };
      }>;
      status: {
        type: {
          id?: string;
          completed: boolean;
          description: string;
          detail: string;
        };
      };
    }>;
  };
  isLast: boolean;
  teamId: string;
  league: string;
}

// Format date outside of component to avoid recalculation
function formatGameDate(dateString: string) {
  const gameDate = new Date(dateString);
  
  const shortDate = gameDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedDate = gameDate
    .toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
    .replace(/,/g, '')
    .replace(/(\d{1,2})(?=:)/, (match) => {
      // Convert 24-hour format to 12-hour
      const hour = parseInt(match);
      const hour12 = hour % 12 || 12;
      return `${hour12}`;
    })
    .replace(/(\d{1,2})(?=\s\d{1,2}:)/, '$1 -');

  return { formattedDate, shortDate };
}

export default function ScheduleRow({ game, isLast, teamId, league }: ScheduleRowProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const logoRef = useRef<HTMLDivElement>(null);
  const teamRef = useRef<HTMLDivElement>(null);

  const { 
    competition, 
    currentTeam, 
    opponent, 
    currentScore, 
    opponentScore, 
    isCompleted, 
    isPostponed, 
    isWinner, 
    isNeutralSite, 
    opponentLogo,
    dateInfo
  } = useMemo(() => {
    const competition = game.competitions[0];
    const currentTeam = competition.competitors.find((team) => team.team.id === teamId);
    const opponent = competition.competitors.find((team) => team.team.id !== teamId);

    if (!opponent || !currentTeam) return { competition: null };

    const currentScore = currentTeam.score?.value;
    const opponentScore = opponent.score?.value;
    const isCompleted = competition.status?.type?.completed ?? false;
    const isPostponed = competition.status?.type?.id === '6';
    const isWinner = currentTeam.winner ?? false;
    const isNeutralSite = competition.neutralSite ?? false;

    const logoIndex = DARK_COLORED_LOGOS.includes(opponent.team.displayName) ? 1 : 0;
    const opponentLogo = opponent.team.logos?.[logoIndex]?.href;
    
    const dateInfo = formatGameDate(game.date);

    return { 
      competition, 
      currentTeam, 
      opponent, 
      currentScore, 
      opponentScore, 
      isCompleted, 
      isPostponed, 
      isWinner, 
      isNeutralSite, 
      opponentLogo,
      dateInfo
    };
  }, [game, teamId]);

  // Early return if data is not available
  if (!competition || !currentTeam || !opponent) return null;

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  const getLocationText = () => {
    if (isNeutralSite) return 'N';
    return currentTeam.homeAway === 'home' ? 'VS' : 'AT';
  };

  const TeamLogo = () => (
    <Link href={`/${league}/${opponent.team.id}`} className="hover:opacity-80 cursor-pointer" onClick={(e) => e.stopPropagation()}>
      <Image src={opponentLogo} alt={''} width={20} height={20} className="size-5" priority unoptimized />
    </Link>
  );

  const TeamName = () => (
    <Link
      href={`/${league}/${opponent.team.id}`}
      className="min-w-0 leading-tight flex items-center text-left hover:opacity-80 cursor-pointer"
      onClick={(e) => e.stopPropagation()}
    >
      <span
        className={cn('text-xs font-semibold w-3 text-center shrink-0 mr-[0.45rem]', {
          'text-[#BC945C]': opponent.curatedRank?.current && opponent.curatedRank.current !== 99,
          invisible: !opponent.curatedRank?.current || opponent.curatedRank.current === 99,
        })}
      >
        {opponent.curatedRank?.current && opponent.curatedRank.current !== 99 ? opponent.curatedRank.current : '0'}
      </span>
      <div>
        <span className="font-semibold break-words">{opponent.team.location}</span>{' '}
        <span className="font-normal text-neutral-500 dark:text-neutral-400 break-words">{opponent.team.displayName.replace(opponent.team.location, '').trim()}</span>
      </div>
    </Link>
  );

  const handleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    router.push(`/${league}/game/${game.id}`);
  };

  return (
    <>
      <Link
        href={`/${league}/game/${game.id}`}
        onClick={handleClick}
        className="block hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer"
      >
        <div
          className={cn(
            'flex flex-col min-[450px]:flex-row justify-between px-0 min-[450px]:px-3 xl:p-x4 py-2 gap-2',
            !isLast && 'border-b border-neutral-200 dark:border-neutral-800'
          )}
        >
          <div className="flex items-start min-[450px]:items-center flex-1 min-w-0">
            <span className="text-neutral-500 font-extralight text-[0.65rem] dark:text-neutral-400 mr-1.5 min-w-[1.5rem] text-center mt-0.5 min-[450px]:mt-0">
              {getLocationText()}
            </span>
            <div ref={logoRef} className="size-5">
              {!mounted && opponentLogo && <Image src={opponentLogo} alt={''} width={20} height={20} className="size-5" priority unoptimized />}
            </div>
            <div ref={teamRef} className="ml-[0.45rem] min-w-0 leading-tight flex items-center flex-1">
              {!mounted && (
                <>
                  <span
                    className={cn('text-xs font-semibold w-3 text-center shrink-0 mr-[0.45rem]', {
                      'text-[#BC945C]': opponent.curatedRank?.current && opponent.curatedRank.current !== 99,
                      invisible: !opponent.curatedRank?.current || opponent.curatedRank.current === 99,
                    })}
                  >
                    {opponent.curatedRank?.current && opponent.curatedRank.current !== 99 ? opponent.curatedRank.current : '0'}
                  </span>
                  <div>
                    <span className="font-semibold break-words">{opponent.team.location}</span>{' '}
                    <span className="font-normal text-neutral-500 dark:text-neutral-400 break-words">{opponent.team.displayName.replace(opponent.team.location, '').trim()}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-row-reverse justify-end min-[450px]:flex-row items-center shrink-0 gap-3">
            {dateInfo && isCompleted && (
              <span className="text-neutral-500 dark:text-neutral-400 text-xs mr-3 tabular-nums">
                {dateInfo.shortDate}
              </span>
            )}
            {isCompleted ? (
              <>
                {currentScore !== undefined && opponentScore !== undefined && (
                  <p className="text-neutral-700 dark:text-neutral-300 tabular-nums">
                    {currentTeam.homeAway === 'home' ? `${currentScore}-${opponentScore}` : `${opponentScore}-${currentScore}`}
                  </p>
                )}
                {isWinner ? (
                  <p className="font-semibold text-green-700 dark:text-green-500 ml-0 min-[450px]:ml-2 w-5 mr-4 min-[450px]:mr-0 text-center">W</p>
                ) : (
                  <p className="font-semibold text-red-700 dark:text-red-500 ml-0 min-[450px]:ml-2 w-5 mr-4 min-[450px]:mr-0 text-center">L</p>
                )}
              </>
            ) : isPostponed ? (
              <p className="text-neutral-600 dark:text-neutral-400 font-medium">Postponed</p>
            ) : (
              <p className="text-neutral-700 dark:text-neutral-300">
                {dateInfo?.formattedDate}
              </p>
            )}
          </div>
        </div>
      </Link>
      {mounted && logoRef.current && opponentLogo && createPortal(<TeamLogo />, logoRef.current)}
      {mounted && teamRef.current && createPortal(<TeamName />, teamRef.current)}
    </>
  );
}
