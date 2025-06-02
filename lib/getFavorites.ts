interface TeamInfo {
  name: string;
  league: string;
  addedAt: string;
}

interface FavoritesRecord {
  [teamId: string]: TeamInfo;
}

export default function getFavorites(league = 'all'): FavoritesRecord {
  try {
    if (typeof window === 'undefined') {
      return {};
    }
    
    const allFavorites = JSON.parse(localStorage.getItem('favoriteTeams') || '{}') as FavoritesRecord;
    
    if (league === 'all') {
      return allFavorites;
    }
    
    const leagueFavorites: FavoritesRecord = {};
    
    Object.entries(allFavorites).forEach(([teamId, teamInfo]) => {
      if (teamInfo.league === league) {
        leagueFavorites[teamId] = teamInfo;
      }
    });
    
    return leagueFavorites;
  } catch (error) {
    console.error('Error reading favorites:', error);
    return {};
  }
}

export function saveFavorite(teamId: string, teamName: string, league: string, isFavorite: boolean): boolean {
  try {
    const allFavorites = getFavorites('all');
    
    if (!isFavorite) {
      delete allFavorites[teamId];
    } else {
      allFavorites[teamId] = {
        name: teamName,
        league: league,
        addedAt: new Date().toISOString(),
      };
    }
    
    localStorage.setItem('favoriteTeams', JSON.stringify(allFavorites));
    return true;
  } catch (error) {
    console.error('Error updating favorites:', error);
    return false;
  }
}
