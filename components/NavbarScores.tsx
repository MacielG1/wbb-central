'use client';
import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import getFavorites from '@/lib/getFavorites';

interface Competitor {
  id: string;
  homeAway: string;
  team: {
    id: string;
    name: string;
    abbreviation: string;
    displayName: string;
    logo: string;
    record?: string;
    standingSummary?: string;
    color?: string;
    shortDisplayName?: string;
  };
  score?: string;
  winner?: boolean;
  records?: {
    summary: string;
  }[];
  curatedRank?: {
    current: number;
  };
}

interface Competition {
  id: string;
  date: string;
  competitors: Competitor[];
  status: {
    type: {
      state: string;
      completed: boolean;
      description: string;
    };
    displayClock: string;
    period: number;
  };
}

interface Event {
  id: string;
  name: string;
  shortName: string;
  competitions: Competition[];
  status: {
    type: {
      state: string;
      completed: boolean;
    };
  };
}

interface Props {
  data: {
    events: Event[];
  };
}

export default function NavbarScores({ data }: Props) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [favorites, setFavorites] = useState<Record<string, any>>({});

  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', checkScroll);
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', checkScroll);
      }
    };
  }, [data]);

  function scroll(direction: 'left' | 'right') {
    if (scrollContainerRef.current) {
      const scrollAmount = 480;
      const newScrollPosition = scrollContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      scrollContainerRef.current.scrollTo({
        left: newScrollPosition,
        behavior: 'smooth',
      });

      // Check scroll state after animation completes
      setTimeout(checkScroll, 500);
    }
  }

  function formatGameTime(date: string) {
    const gameDate = new Date(date);
    return gameDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  function getGameStatus(competition: Competition) {
    const { status } = competition;

    if (status.type.completed) {
      return 'Final';
    }

    if (status.type.state === 'in') {
      return `${status.period}Q ${status.displayClock}`;
    }

    return formatGameTime(competition.date);
  }

  function renderScore(competitor: Competitor, gameStatus: string) {
    if (gameStatus === 'pre') {
      const record = competitor.records?.[0]?.summary || '0-0';
      return <span className="text-xs text-neutral-400 text-right w-16 ">{record}</span>;
    }

    return <span className={`text-sm text-right w-8 ${gameStatus === 'post' && competitor.winner ? 'font-bold' : 'font-[50]'}`}>{competitor.score}</span>;
  }

  return (
    <TooltipProvider>
      <div className="w-full text-white">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-3">
          {/* Left scroll button */}
          <button
            onClick={() => scroll('left')}
            className={cn('bg-neutral-900 hover:bg-neutral-800 p-1 rounded-full transition duration-200 cursor-pointer', !canScrollLeft && 'opacity-0 pointer-events-none')}
          >
            <ChevronLeft className="text-white size-5 pr-0.5" />
          </button>

          {/* Games container */}
          <div ref={scrollContainerRef} className="flex overflow-x-auto scrollbar-hide scroll-smooth">
            {data.events.map((event) => {
              const competition = event.competitions[0];
              const homeTeam = competition.competitors.find((c) => c.homeAway === 'home');
              const awayTeam = competition.competitors.find((c) => c.homeAway === 'away');

              if (!homeTeam || !awayTeam) return null;

              const gameStatus = getGameStatus(competition);
              const isHomeTeamFavorite = homeTeam.team.id ? favorites[homeTeam.team.id] : false;
              const isAwayTeamFavorite = awayTeam.team.id ? favorites[awayTeam.team.id] : false;

              return (
                <div key={event.id} className={cn('flex flex-col border-r border-neutral-700 first:pl-0 px-3 py-0.5 min-w-[180px]')}>
                  <div className="text-xs text-neutral-400 mb-1 text-center">{gameStatus}</div>

                  <div className="flex justify-between items-start">
                    {/* Teams Column */}
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      {/* Away Team */}
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {awayTeam.team.logo ? (
                              <Tooltip>
                                <TooltipTrigger asChild className="cursor-pointer">
                                  <div className="size-6 shrink-0">
                                    <Image
                                      src={awayTeam.team.logo}
                                      alt={''}
                                      width={18}
                                      height={18}
                                      className={cn('min-w-[1.1rem] mr-2', {
                                        'dark:invert': awayTeam.team.color === '000000',
                                      })}
                                      unoptimized
                                    />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="p-1 text-sm">
                                  <p>{awayTeam.team.displayName}</p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <div className="size-6 bg-transparent rounded-full" />
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild className="cursor-pointer">
                                <span className="text-sm flex gap-1 break-words min-w-0">
                                  <span className={cn('font-semibold text-neutral-400 text-[0.7rem] shrink-0', isAwayTeamFavorite && 'text-[#bc7200]')}>
                                    {awayTeam.curatedRank?.current && awayTeam.curatedRank.current !== 99 ? `${awayTeam.curatedRank.current} ` : ''}
                                  </span>
                                  <span className={cn('break-all text-[0.8rem] truncate', isAwayTeamFavorite && 'text-[#bc7200]')}>{awayTeam.team.shortDisplayName}</span>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="p-1 text-sm">
                                <p>{awayTeam.team.displayName}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="ml-2 shrink-0 -mt-1">{renderScore(awayTeam, competition.status.type.state)}</div>
                        </div>
                      </div>

                      {/* Home Team */}
                      <div className="flex flex-col">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start">
                            {homeTeam.team.logo ? (
                              <Tooltip>
                                <TooltipTrigger asChild className="cursor-pointer">
                                  <div className="size-6 shrink-0">
                                    <Image
                                      src={homeTeam.team.logo}
                                      alt={''}
                                      width={18}
                                      height={18}
                                      className={cn('min-w-[1.1rem] mr-2', {
                                        'dark:invert': homeTeam.team.color === '000000',
                                      })}
                                      unoptimized
                                    />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="p-1 text-sm">
                                  <p>{homeTeam.team.displayName}</p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <div className="size-6 bg-transparent rounded-full" />
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild className="cursor-pointer">
                                <span className="text-sm flex gap-1 break-words min-w-0">
                                  <span className={cn('font-semibold text-neutral-400 text-[0.7rem] shrink-0', isHomeTeamFavorite && 'text-[#bc7200]')}>
                                    {homeTeam.curatedRank?.current && homeTeam.curatedRank.current !== 99 ? `${homeTeam.curatedRank.current} ` : ''}
                                  </span>
                                  <span className={cn('break-all text-[0.8rem] truncate', isHomeTeamFavorite && 'text-[#bc7200]')}>{homeTeam.team.shortDisplayName}</span>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="p-1 text-sm">
                                <p>{homeTeam.team.displayName}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <div className="ml-2 shrink-0 -mt-1">{renderScore(homeTeam, competition.status.type.state)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Right scroll button */}
          <button
            onClick={() => scroll('right')}
            className={cn('bg-neutral-900 hover:bg-neutral-800 p-1 rounded-full transition duration-200 cursor-pointer', !canScrollRight && 'opacity-0 pointer-events-none')}
          >
            <ChevronRight className="text-white size-5 pl-0.5" />
          </button>
        </div>
      </div>
    </TooltipProvider>
  );
}
