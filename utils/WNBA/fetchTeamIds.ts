

interface Team {
  displayName: string;
}

export async function fetchWNBATeamIds(): Promise<Team[]> {
  try {
    const response = await fetch(
      "https://site.web.api.espn.com/apis/site/v2/sports/basketball/wnba/teams",
      { next: { revalidate: 86400 } }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch WNBA team IDs: ${response.status}`);
    }
    
    const data = await response.json();
    
    const teams = data.sports[0].leagues[0].teams.map((team: any) => team.team);

    return teams.sort((a: Team, b: Team) => a.displayName.localeCompare(b.displayName));
  } catch (error) {
    console.error("Error fetching WNBA team IDs:", error);
    return [];
  }
} 