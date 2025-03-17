interface Team {
  displayName: string;
}

export async function fetchAllTeamIds() {
  const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/basketball/womens-college-basketball/teams?limit=500', {
    next: {
      revalidate: 60 * 60 * 24 * 365, // 1 year
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch team IDs: ${response.statusText}`);
  }

  const data = await response.json();
  const teams = data.sports[0].leagues[0].teams.map((team: any) => team.team);

  return teams.sort((a: Team, b: Team) => a.displayName.localeCompare(b.displayName));
}
