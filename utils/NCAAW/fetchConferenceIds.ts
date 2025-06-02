interface Conference {
  id: string;
  name: string;
  shortName: string;
}

export async function fetchAllConferenceIds(): Promise<Conference[]> {
  //   'use cache';
  //   cacheLife('hours');

  const response = await fetch(`${process.env.NCAAW_fetchConferenceIds}`, {
    next: {
      revalidate: 60 * 60 * 24 * 365, // 1 year
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch conference IDs: ${response.statusText}`);
  }

  const data = await response.json();
  const conferences: Conference[] = [];

  // Extract conference information
  data.standings.forEach((conference: any) => {
    conferences.push({
      id: conference.id,
      name: conference.name,
      shortName: conference.abbreviation,
    });
  });

  return conferences;
}
