export interface WNBATeam {
  id: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  logo?: string;
  logos?: { href: string }[];
  color?: string;
  recordSummary: string;
  standingSummary: string;
  groups?: {
    id: string;
  };
}

export interface WNBAEvent {
  id: string;
  date: string;
  name: string;
  shortName: string;
  season: {
    year: number;
    displayName: string;
  };
  seasonType: {
    id: string;
    type: number;
    name: string;
    abbreviation: string;
  };
  status: {
    type: {
      completed: boolean;
      id?: string;
      description?: string;
      detail?: string;
    };
  };
  competitions: {
    id: string;
    date: string;
    attendance: number;
    timeValid: boolean;
    neutralSite: boolean;
    boxscoreAvailable: boolean;
    ticketsAvailable: boolean;
    competitors: {
      id: string;
      homeAway: string;
      team: {
        id: string;
        location: string;
        nickname: string;
        abbreviation: string;
        displayName: string;
        logos: Array<{
          href: string;
          width: number;
          height: number;
          alt: string;
          rel: string[];
        }>;
      };
      score?: { value: number; displayValue: string };
      winner?: boolean;
      curatedRank?: {
        current: number;
      };
    }[];
    status: {
      type: {
        id?: string;
        completed: boolean;
        description: string;
        detail: string;
      };
    };
  }[];
}

export interface WNBATeamScheduleData {
  team: WNBATeam;
  events: WNBAEvent[];
} 