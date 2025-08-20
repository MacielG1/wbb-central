'use server';
import * as cheerio from 'cheerio';
import { unstable_cacheLife } from 'next/cache';

export interface WNBATeamStats {
  teamId: string;
  teamName: string;
  teamAbbr?: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winPct: number;
  gb?: number;
  minutes: number;
  points: number;
  fgMade: number;
  fgAttempted: number;
  fgPct: number;
  fg3Made: number;
  fg3Attempted: number;
  fg3Pct: number;
  ftMade: number;
  ftAttempted: number;
  ftPct: number;
  oreb: number;
  dreb: number;
  reb: number;
  ast: number;
  tov: number;
  stl: number;
  blk: number;
  pf: number;
  plusMinus: number;
  season: number;
}

const teamNameToAbbr: Record<string, string> = {
  'Atlanta Dream': 'ATL',
  'Chicago Sky': 'CHI',
  'Connecticut Sun': 'CON',
  'Dallas Wings': 'DAL',
  'Las Vegas Aces': 'LVA',
  'Los Angeles Sparks': 'LAS',
  'Minnesota Lynx': 'MIN',
  'New York Liberty': 'NYL',
  'Phoenix Mercury': 'PHO',
  'Seattle Storm': 'SEA',
  'Washington Mystics': 'WAS',
  'Indiana Fever': 'IND',
  'Golden State Valkyries': 'GSV',
};

function getNum(text: string | undefined): number {
  if (!text) return 0;
  const t = text.trim();
  if (t === '') return 0;
  const n = Number(t);
  return Number.isFinite(n) ? n : 0;
}

function getTable($: cheerio.CheerioAPI, tableId: string): any | null {
  const direct = $(`#${tableId}`);
  if (direct.length) return direct;

  const all = $(`#all_${tableId}`);
  if (!all.length) return null;
  const commentNode = all
    .contents()
    .filter((_, el) => el.type === 'comment')
    .first();
  if (!commentNode.length) return null;
  const innerHtml = (commentNode.get(0) as any)?.data as string | undefined;
  if (!innerHtml) return null;
  const $$ = cheerio.load(innerHtml);
  const table = $$('#' + tableId);
  return table.length ? table : null;
}

export async function fetchWNBAteamStats(
  season: number = new Date().getFullYear(),
  _seasonType: string = 'Regular Season'
): Promise<WNBATeamStats[]> {
  'use cache';
  unstable_cacheLife('minutes');
  try {
    const url = `${process.env.WNBA_fetchTeamStats}${season}.html`;
    const res = await fetch(url, { headers: { Accept: 'text/html' } });
    if (!res.ok) throw new Error(`Failed to load Basketball-Reference page: ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    const teamTable = getTable($, 'per_game-team');
    const oppTable = getTable($, 'per_game-opponent');
    if (!teamTable) throw new Error('per_game-team table not found');

    const teamStats = new Map<string, WNBATeamStats>();
    teamTable.find('tbody tr').each((_: number, el: any) => {
      const row = $(el);
      const teamLink = row.find('td[data-stat="team"] a');
      const teamName = teamLink.text().trim();
      const href = (teamLink.attr('href') || '').trim();
      const parts = href.split('/').filter(Boolean);
      const teamAbbr = parts[2] || teamNameToAbbr[teamName] || undefined;

      if (!teamName) return;

      const stats: WNBATeamStats = {
        teamId: teamAbbr || teamName,
        teamName,
        teamAbbr,
        gamesPlayed: getNum(row.find('td[data-stat="g"]').text()),
        wins: 0,
        losses: 0,
        winPct: 0,
        gb: 0,
        minutes: getNum(row.find('td[data-stat="mp"]').text()),
        points: getNum(row.find('td[data-stat="pts"]').text()),
        fgMade: getNum(row.find('td[data-stat="fg"]').text()),
        fgAttempted: getNum(row.find('td[data-stat="fga"]').text()),
        fgPct: getNum(row.find('td[data-stat="fg_pct"]').text()),
        fg3Made: getNum(row.find('td[data-stat="fg3"]').text()),
        fg3Attempted: getNum(row.find('td[data-stat="fg3a"]').text()),
        fg3Pct: getNum(row.find('td[data-stat="fg3_pct"]').text()),
        ftMade: getNum(row.find('td[data-stat="ft"]').text()),
        ftAttempted: getNum(row.find('td[data-stat="fta"]').text()),
        ftPct: getNum(row.find('td[data-stat="ft_pct"]').text()),
        oreb: getNum(row.find('td[data-stat="orb"]').text()),
        dreb: getNum(row.find('td[data-stat="drb"]').text()),
        reb: getNum(row.find('td[data-stat="trb"]').text()),
        ast: getNum(row.find('td[data-stat="ast"]').text()),
        tov: getNum(row.find('td[data-stat="tov"]').text()),
        stl: getNum(row.find('td[data-stat="stl"]').text()),
        blk: getNum(row.find('td[data-stat="blk"]').text()),
        pf: getNum(row.find('td[data-stat="pf"]').text()),
        plusMinus: 0,
        season,
      };

      teamStats.set(stats.teamId, stats);
    });

    const standingsTable = getTable($, 'wnba_standings');
    if (standingsTable) {
      standingsTable.find('tbody tr').each((_: number, el: any) => {
        const row = $(el);
        const teamLink = row.find('th[data-stat="team_name"] a');
        if (!teamLink.length) return;
        const href = (teamLink.attr('href') || '').trim();
        const parts = href.split('/').filter(Boolean);
        const teamAbbr = parts[2];
        const key = teamAbbr || teamLink.text().trim();
        const wins = getNum(row.find('td[data-stat="wins"]').text());
        const losses = getNum(row.find('td[data-stat="losses"]').text());
        const winLossPct = getNum(row.find('td[data-stat="win_loss_pct"]').text());
        const gbText = row.find('td[data-stat="gb"]').text().trim();
        const gb = gbText === '—' || gbText === '-' || gbText === '0' ? 0 : getNum(gbText);

        const cur = teamStats.get(key);
        if (cur) {
          cur.wins = wins;
          cur.losses = losses;
          cur.winPct = winLossPct;
          cur.gb = gb;
          if (!cur.gamesPlayed && (wins || losses)) {
            cur.gamesPlayed = wins + losses;
          }
          teamStats.set(key, cur);
        }
      });
    }

    if (oppTable) {
      oppTable.find('tbody tr').each((_: number, el: any) => {
        const row = $(el);
        const teamLink = row.find('td[data-stat="team"] a');
        const href = (teamLink.attr('href') || '').trim();
        const parts = href.split('/').filter(Boolean);
        const teamAbbr = parts[2];
        const key = teamAbbr || teamLink.text().trim();
        const oppPts = getNum(row.find('td[data-stat="opp_pts"]').text());
        const cur = teamStats.get(key);
        if (cur) {
          cur.plusMinus = Number((cur.points - oppPts).toFixed(2));
          teamStats.set(key, cur);
        }
      });
    }

    return Array.from(teamStats.values()).sort((a, b) => a.teamName.localeCompare(b.teamName));
  } catch (error) {
    console.error(`Error fetching WNBA team stats from Basketball-Reference for season ${season}:`, error);
    return [];
  }
}
