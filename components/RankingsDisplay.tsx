'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Suspense, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DARK_COLORED_LOGOS } from '@/lib/consts';
import getFavorites from '@/lib/getFavorites';
import LoadingSpinner from '@/components/LoadingSpinner';

type RankingsDisplayProps = {
  rankings: any[];
  netRank: React.ReactNode;
  hasNetRankings?: boolean;
};

export default function RankingsDisplay({ rankings, netRank, hasNetRankings = false }: RankingsDisplayProps) {
  const [currentPollIndex, setCurrentPollIndex] = useState(0);
  const [showNetRank, setShowNetRank] = useState(false);
  const [favorites, setFavorites] = useState<Record<string, any>>({});
  const [formattedDate, setFormattedDate] = useState<string>('');
  const currentPoll = rankings[currentPollIndex];
  const pollRankings = currentPoll?.ranks || [];
  const othersReceivingVotes = currentPoll?.others || [];

  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  useEffect(() => {
    if (currentPoll?.lastUpdated) {
      setFormattedDate(new Date(currentPoll.lastUpdated).toLocaleDateString());
    }
  }, [currentPoll?.lastUpdated]);

  function handleNext() {
    if (currentPollIndex < rankings.length - 1) {
      setCurrentPollIndex((prev) => prev + 1);
    } else if (!showNetRank && hasNetRankings) {
      setShowNetRank(true);
    }
  }

  function handlePrevious() {
    if (showNetRank) {
      setShowNetRank(false);
      setCurrentPollIndex(rankings.length - 1);
    } else if (currentPollIndex > 0) {
      setCurrentPollIndex((prev) => prev - 1);
    }
  }

  return (
    <div className="w-full max-w-[26rem] lg:max-w-[14rem] xl:max-w-[18rem] bg-neutral-900 overflow-hidden mb-4 lg:mb-1 mx-auto">
      <div className="grid grid-cols-[auto_1fr_auto_auto] gap-0.5 text-xs">
        <div className="col-span-4">
          <div className="h-8 flex items-center">
            <div className="w-[24px]">
              {(currentPollIndex > 0 || showNetRank) && (
                <button onClick={handlePrevious} className="text-white opacity-60 hover:opacity-100 p-0.5 cursor-pointer">
                  <ChevronLeft size={16} />
                </button>
              )}
            </div>
            <div className="flex-1 text-base font-bold text-white text-center">
              {showNetRank ? 'NET Rankings' : currentPoll?.name || 'National Rankings'}
            </div>
            <div className="w-[24px]">
              {(currentPollIndex < rankings.length - 1 || (!showNetRank && hasNetRankings)) && (
                <button onClick={handleNext} className="text-white opacity-60 hover:opacity-100 p-0.5 cursor-pointer">
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
          <div className="relative px-2.5">
            <div className="text-center lg:text-left xl:text-center">
              {!formattedDate && !showNetRank && <span className="text-xs font-normal text-neutral-500 invisible">Updated Daily</span>}
              {!showNetRank && formattedDate && <span className="text-xs font-normal text-neutral-500">Updated {formattedDate}</span>}
            </div>
            <div className="absolute right-2.5 top-0 flex gap-2">
              <div className="text-white opacity-60 text-xs text-right">W/L</div>
              {!showNetRank && <div className="text-white opacity-60 text-xs text-right">PTS</div>}
            </div>
          </div>
        </div>

        <div className="text-white opacity-60"></div>
        <div className="text-white opacity-60"></div>

        {showNetRank ? (
          <div className="col-span-4">
            <Suspense fallback={<LoadingSpinner />}>{netRank}</Suspense>
          </div>
        ) : (
          <>
            <div className="rankings-section col-span-4">
              {pollRankings.map((team: any) => {
                const logoIndex = DARK_COLORED_LOGOS.includes(`${team?.team?.nickname} ${team?.team?.name}`) ? 1 : 0;
                const isFavorite = favorites[team.team.id];

                return (
                  <div
                    key={team.team.id}
                    className={`grid px-2.5 grid-cols-[auto_1fr_auto_auto] gap-2 items-center w-full py-1 
                      [&+&]:border-t [&+&]:border-neutral-700
                      ${isFavorite ? 'bg-favorite/10' : ''}`}
                  >
                    <div className="text-white min-w-4 text-xs">{team.current}.</div>

                    <Link href={`/ncaaw/${team.team.id}`} className="flex items-center gap-1">
                      {team.team.logos?.[logoIndex]?.href && (
                        <Image src={team.team.logos[logoIndex].href} alt={``} width={20} height={20} className="w-5 h-5" unoptimized />
                      )}
                      <span className="text-indigo-300 hover:text-indigo-200 cursor-pointer text-xs">{team.team.nickname || team.team.name}</span>
                    </Link>

                    <div className="text-white text-right text-xs">{team.recordSummary || team.records?.[0]?.summary || '-'}</div>

                    <div className="text-white text-right text-xs">{team.points || '-'}</div>
                  </div>
                );
              })}
            </div>

            {othersReceivingVotes.length > 0 && (
              <>
                <div className="col-span-4 text-xs font-semibold text-neutral-400 pl-2 mt-2 mb-0.5">Others Receiving Votes</div>
                {othersReceivingVotes.map((team: any) => {
                  const logoIndex = DARK_COLORED_LOGOS.includes(`${team?.team?.nickname} ${team?.team?.name}`) ? 1 : 0;
                  const isFavorite = favorites[team.team.id];

                  return (
                    <div
                      key={team.team.id}
                      className={`px-2.5 col-span-4 grid grid-cols-[1fr_auto] gap-2 items-center w-full py-1 
                        not-last:border-b not-last:border-neutral-700
                        ${isFavorite ? 'bg-favorite/10' : ''}`}
                    >
                      <div className="flex items-center gap-1">
                        {team.team.logos?.[0]?.href && (
                          <Image src={team.team.logos[logoIndex].href} alt={``} width={16} height={16} className="w-4 h-4" unoptimized />
                        )}
                        <Link href={`/ncaaw/${team.team.id}`}>
                          <span className="text-indigo-300 hover:text-indigo-200 cursor-pointer text-xs">{team.team.nickname || team.team.name}</span>
                        </Link>
                      </div>

                      <div className="text-white text-right text-xs">{team.points}</div>
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
