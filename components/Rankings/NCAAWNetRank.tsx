'use client';

import Image from 'next/image';
import Link from 'next/link';
import allTeamsData from '@/utils/NCAAW/allTeamsData.json';
import { DARK_COLORED_LOGOS } from '@/lib/consts';
import getFavorites from '@/lib/getFavorites';
import { useEffect, useState } from 'react';

const specialCases: { [key: string]: string } = {
  'southern california': 'usc',
  "st. john's (ny)": "st john's",
  'south fla.': 'south florida',
  'lamar university': 'lamar',
  sfa: 'samford',
  'southeastern la.': 'se louisiana',
  'miami (fl)': 'miami',
  'col. of charleston': 'charleston',
  hawaii: "hawai'i rainbow wahine",
  ulm: 'ul monroe',
  'eastern ky.': 'e kentucky',
  'n.c. a&t': 'nc a&t',
  'fla. atlantic': 'fau',
  fdu: 'fair dickinson',
  'army west point': 'army',
  "saint mary's (ca)": "saint mary's",
  uiw: 'incarnate word',
  utrgv: 'ut rio grande',
  'lmu (ca)': 'lmu',
  'northern ky.': 'n kentucky',
  umes: 'md eastern',
  niu: 'n illinois',
  'west ga.': 'west georgia',
};

function findTeamData(rankingName: string) {
  const rankingNameLower = rankingName.toLowerCase();

  if (specialCases[rankingNameLower]) {
    return allTeamsData.find((t) => t.displayName.toLowerCase() === specialCases[rankingNameLower] || t.nickname.toLowerCase() === specialCases[rankingNameLower]);
  }

  const nicknameMatch = allTeamsData.find((t) => t.nickname.toLowerCase() === rankingNameLower);
  if (nicknameMatch) return nicknameMatch;

  const displayMatch = allTeamsData.find((t) => t.displayName.toLowerCase() === rankingNameLower);
  if (displayMatch) return displayMatch;

  const nameParts = rankingNameLower.split(' ').filter(Boolean);
  return allTeamsData.find((t) => {
    const displayNameParts = t.displayName.toLowerCase().split(' ');
    const nicknameParts = t.nickname.toLowerCase().split(' ');

    return nameParts.every(
      (part) => displayNameParts.some((namePart) => namePart.startsWith(part.replace('.', ''))) || nicknameParts.some((namePart) => namePart.startsWith(part.replace('.', '')))
    );
  });
}

interface NCAAWNetRankProps {
  rankings: any[];
  lastUpdated: string;
}

export default function NCAAWNetRank({ rankings, lastUpdated }: NCAAWNetRankProps) {
  const [favorites, setFavorites] = useState<Record<string, any>>({});

  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  // Don't render anything if there are no rankings
  if (!rankings || rankings.length === 0) {
    return null;
  }

  return (
    <div className="rankings-section col-span-4">
      {lastUpdated && (
        <div className="flex flex-col items-center -mt-1 mb-1">
          <span className="text-xs font-normal text-neutral-500">Through Games {new Date(lastUpdated).toLocaleDateString()}</span>
        </div>
      )}
      {rankings.map((team) => {
        const teamData = findTeamData(team.name);
        const isFavorite = teamData ? favorites[teamData.id] : false;

        return (
          <div
            key={team.name + team.rank}
            className={`px-2.5 grid grid-cols-[auto_1fr_auto] gap-2 items-center w-full py-1 [&+&]:border-t [&+&]:border-neutral-700 ${isFavorite ? 'bg-favorite/10' : ''}`}
          >
            <div className="text-white min-w-4 text-xs">{team.rank}.</div>

            <div className="flex items-center gap-1">
              {teamData && (
                <Link href={`/ncaaw/${teamData.id}`} className="flex items-center gap-1">
                  {teamData.logos && (
                    <Image
                      src={DARK_COLORED_LOGOS.includes(teamData.displayName) ? teamData.logos[1].href : teamData.logos[0].href}
                      alt={''}
                      width={20}
                      height={20}
                      className="w-5 h-5"
                      unoptimized
                    />
                  )}
                  <span className="text-indigo-300 hover:text-indigo-200 cursor-pointer text-xs">{teamData.nickname}</span>
                </Link>
              )}
              {!teamData && <span className="text-indigo-300 text-xs">{team.name}</span>}
            </div>

            <div className="text-white text-right text-xs">{team.record || '-'}</div>
          </div>
        );
      })}
    </div>
  );
}
