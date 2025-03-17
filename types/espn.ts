export interface Event {
  id: string;
  uid: string;
  date: string;
  name: string;
  shortName: string;
  competitions: Competition[];
  links?: {
    language: string;
    rel: string[];
    href: string;
    text: string;
    shortText: string;
    isExternal: boolean;
    isPremium: boolean;
  }[];
  status: {
    clock: number;
    displayClock: string;
    period: number;
    type: {
      id: string;
      name: string;
      state: string;
      completed: boolean;
      description: string;
      detail: string;
      shortDetail: string;
    };
  };
}

export interface Competition {
  id: string;
  uid: string;
  date: string;
  attendance: number;
  type: {
    id: string;
    abbreviation: string;
  };
  timeValid: boolean;
  neutralSite: boolean;
  conferenceCompetition: boolean;
  playByPlayAvailable: boolean;
  recent: boolean;
  venue: {
    id: string;
    fullName: string;
    address: {
      city: string;
      state: string;
    };
  };
  competitors: Competitor[];
  status: {
    clock: number;
    displayClock: string;
    period: number;
    type: {
      id: string;
      name: string;
      state: string;
      completed: boolean;
      description: string;
      detail: string;
      shortDetail: string;
    };
  };
  broadcasts?: Broadcast[];
}

export interface Competitor {
  id: string;
  uid: string;
  type: string;
  order: number;
  homeAway: string;
  team: {
    id: string;
    uid: string;
    location: string;
    name: string;
    abbreviation: string;
    displayName: string;
    shortDisplayName: string;
    color: string;
    alternateColor: string;
    logo: string;
  };
  score?: string;
  linescores?: { value: number }[];
  statistics?: {
    name: string;
    abbreviation: string;
    displayValue: string;
  }[];
  records?: {
    type: string;
    summary: string;
  }[];
  curatedRank?: {
    current: number;
  };
}

export interface League {
  id: string;
  name: string;
  abbreviation: string;
  calendar: string[];
  calendarStartDate: string;
  calendarEndDate: string;
}

export interface APIResponse {
  events: Event[];
  leagues: League[];
}

interface Broadcast {
  names: string[];
}
