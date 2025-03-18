'use client';

import { useRouter } from 'next/navigation';
import { ChevronDown, Search } from 'lucide-react';
import Image from 'next/image';
import { useState, useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { DARK_COLORED_LOGOS } from '@/lib/consts';
import getFavorites from '@/lib/getFavorites';

export default function TeamSelector({
  allTeams,
  teamId,
  league,
  className,
  maxWidth,
}: {
  allTeams: any[];
  teamId?: string;
  league: string;
  className?: string;
  maxWidth?: string;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedTeam = teamId ? allTeams.find((team) => team.id === teamId) : null;
  const selectedTeamLogoIndex = selectedTeam && DARK_COLORED_LOGOS.includes(selectedTeam.displayName) ? 1 : 0;

  const favorites = getFavorites();

  const sortedTeams = useMemo(() => {
    const favoriteTeams = allTeams.filter((team) => favorites[team.id]);
    const nonFavoriteTeams = allTeams.filter((team) => !favorites[team.id]);
    return [...favoriteTeams, ...nonFavoriteTeams];
  }, [allTeams, favorites]);

  const filteredTeams = useMemo(() => sortedTeams.filter((team) => team.displayName.toLowerCase().includes(searchQuery.toLowerCase())), [sortedTeams, searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  function selectTeam(teamId: string) {
    router.push(`/${league}/${teamId}`);
    setIsOpen(false);
    setSearchQuery('');
  }

  return (
    <div className={cn('relative w-[280px]', maxWidth)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-[280px] bg-white cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-900 dark:bg-black text-neutral-800 dark:text-neutral-200 font-semibold px-3 py-1 pr-8 rounded-md border border-neutral-200 dark:border-neutral-800 focus:outline-hidden focus:border-neutral-400 dark:focus:border-neutral-600 font-sans flex items-center transition duration-100',
          maxWidth
        )}
      >
        <span className="mb-0.5">{selectedTeam ? selectedTeam.displayName : 'Select a team'}</span>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-neutral-700 dark:text-neutral-300">
          <ChevronDown className="size-4" />
        </div>
      </button>

      {isOpen && (
        <div
          className={cn(
            'w-[280px] absolute z-10 mt-1 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-md shadow-lg max-h-80 overflow-auto',
            maxWidth
          )}
        >
          <div className="sticky top-0 bg-white dark:bg-black p-2 border-b border-neutral-200 dark:border-neutral-800">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search teams..."
                className="w-full pl-8 pr-4 py-1 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md focus:outline-hidden focus:border-neutral-400 dark:focus:border-neutral-600"
              />
            </div>
          </div>

          {filteredTeams.map((team) => {
            const logoIndex = DARK_COLORED_LOGOS.includes(team.displayName) ? 1 : 0;
            return (
              <button
                key={team.id}
                onClick={() => selectTeam(team.id)}
                className={cn(
                  'w-full cursor-pointer px-2 py-2 flex items-center hover:bg-neutral-100 dark:hover:bg-neutral-900',
                  team.id === teamId && 'bg-neutral-100 dark:bg-neutral-900'
                )}
              >
                {team.logos?.[logoIndex]?.href && <Image src={team.logos[logoIndex].href} alt={''} width={24} height={24} className="mr-2 size-6" unoptimized />}
                <span className="text-sm">{team.displayName}</span>
              </button>
            );
          })}

          {filteredTeams.length === 0 && <div className="px-3 py-2 text-neutral-500 text-center">No teams found</div>}
        </div>
      )}
    </div>
  );
}
