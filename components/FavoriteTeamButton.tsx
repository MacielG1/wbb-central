'use client';

import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import getFavorites, { saveFavorite } from '@/lib/getFavorites';

interface FavoriteTeamButtonProps {
  teamId: string;
  teamName: string;
  league: string;
}

export default function FavoriteTeamButton({ teamId, teamName, league }: FavoriteTeamButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const favorites = getFavorites(league);
    setIsFavorite(!!favorites[teamId]);
  }, [teamId, league]);

  function toggleFavorite() {
    const newFavoriteStatus = !isFavorite;
    const success = saveFavorite(teamId, teamName, league, newFavoriteStatus);
    
    if (success) {
      setIsFavorite(newFavoriteStatus);
    }
  }

  return (
    <button
      onClick={toggleFavorite}
      className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Star className={`size-5 ${isFavorite ? 'fill-yellow-500 text-yellow-500' : 'fill-none text-neutral-400'}`} />
    </button>
  );
}
