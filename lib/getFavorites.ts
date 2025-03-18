export default function getFavorites() {
  try {
    if (typeof window === 'undefined') {
      return {};
    }
    return JSON.parse(localStorage.getItem('favoriteTeams') || '{}');
  } catch (error) {
    console.error('Error reading favorites:', error);
    return {};
  }
}
