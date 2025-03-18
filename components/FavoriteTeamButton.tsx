'use client';

import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FavoriteTeamButtonProps {
  teamId: string;
  teamName: string;
}

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem('favoriteTeams') || '{}');
  } catch (error) {
    console.error('Error reading favorites:', error);
    return {};
  }
}

export default function FavoriteTeamButton({ teamId, teamName }: FavoriteTeamButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const favorites = getFavorites();
    setIsFavorite(!!favorites[teamId]);
  }, [teamId]);

  function toggleFavorite() {
    try {
      const favorites = getFavorites();

      if (isFavorite) {
        delete favorites[teamId];
      } else {
        favorites[teamId] = {
          name: teamName,
          addedAt: new Date().toISOString(),
        };
      }

      localStorage.setItem('favoriteTeams', JSON.stringify(favorites));
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error updating favorites:', error);
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
