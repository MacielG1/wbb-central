'use client';

import { DARK_COLORED_LOGOS } from '@/lib/consts';
import Link from 'next/dist/client/link';
import Image from 'next/image';

interface ConferenceStandingsProps {
  conference: string;
  league: string;
  currentTeam: string;
  standings: {
    team: {
      id: string;
      displayName: string;
      logos?: { href: string }[];
    };
    stats: {
      name: string;
      displayName: string;
      type: string;
      value: number;
      displayValue: string;
      summary?: string;
    }[];
  }[];
}

export default function ConferenceStandings({ conference, standings, league, currentTeam }: ConferenceStandingsProps) {
  const sortedStandings = standings.sort((a, b) => {
    const aConfGames = a.stats.find((s) => s.type === 'vsconf')?.summary?.split('-') || ['0', '0'];
    const bConfGames = b.stats.find((s) => s.type === 'vsconf')?.summary?.split('-') || ['0', '0'];

    const aWins = parseInt(aConfGames[0]);
    const aLosses = parseInt(aConfGames[1]);
    const bWins = parseInt(bConfGames[0]);
    const bLosses = parseInt(bConfGames[1]);

    const aWinPct = aWins / (aWins + aLosses) || 0;
    const bWinPct = bWins / (bWins + bLosses) || 0;

    if (Math.abs(bWinPct - aWinPct) < 0.001) {
      // If win percentages are equal, team with more wins should be ranked higher
      return bWins - aWins;
    }
    return bWinPct - aWinPct;
  });

  // Find the leader's record for GB calculation
  const leaderGames = sortedStandings[0]?.stats.find((s) => s.type === 'vsconf')?.summary?.split('-') || ['0', '0'];
  const leaderWins = parseInt(leaderGames[0]);
  const leaderLosses = parseInt(leaderGames[1]);

  // Update the GB values
  sortedStandings.forEach((team) => {
    const games = team.stats.find((s) => s.type === 'vsconf')?.summary?.split('-') || ['0', '0'];
    const wins = parseInt(games[0]);
    const losses = parseInt(games[1]);

    const gb = (leaderWins - wins + (losses - leaderLosses)) / 2;
    const gbStat = team.stats.find((s) => s.type === 'vsconf_gamesbehind');
    if (gbStat) {
      gbStat.displayValue = gb === 0 ? '-' : gb.toFixed(1);
    }
  });

  return (
    <div className="w-full max-w-5xl mx-auto">
      <h2 className="text-2xl  text-center font-bold mb-4 text-neutral-800 dark:text-neutral-200">{conference}</h2>
      <div className="overflow-x-auto bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-md shadow-xs">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
              <th className=" px-2 py-3 text-center text-neutral-600 dark:text-neutral-400 font-medium text-sm">Rank</th>
              <th className="px-1 py-3 text-left text-neutral-600 dark:text-neutral-400 font-medium text-sm">Team</th>
              <th className=" px-1 py-3 text-center text-neutral-600 dark:text-neutral-400 font-medium text-sm whitespace-nowrap">CONF</th>
              <th className=" px-1 py-3 text-center text-neutral-600 dark:text-neutral-400 font-medium text-sm whitespace-nowrap">PCT</th>
              <th className=" px-1 py-3 text-center text-neutral-600 dark:text-neutral-400 font-medium text-sm whitespace-nowrap">GB</th>
              <th className=" px-1 py-3 text-center text-neutral-600 dark:text-neutral-400 font-medium text-sm whitespace-nowrap">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {sortedStandings.map((team, index) => {
              const confRecord = team.stats.find((s) => s.type === 'vsconf')?.summary || '0-0';
              const totalRecord = team.stats.find((s) => s.type === 'total')?.summary || '0-0';
              const confWinPct = team.stats.find((s) => s.type === 'vsconf_winpercent')?.displayValue || '.000';
              const confGamesBack = team.stats.find((s) => s.type === 'vsconf_gamesbehind')?.displayValue || '-';

              const logoIndex = DARK_COLORED_LOGOS.includes(team.team.displayName) ? 1 : 0;
              const isCurrentTeam = team.team.id === currentTeam;

              return (
                <tr key={team.team.id} className={`border-b border-neutral-200 dark:border-neutral-800  ${isCurrentTeam ? 'bg-neutral-700/70' : ''}`}>
                  <td className="px-2 py-2 text-center font-medium text-neutral-800 dark:text-neutral-200">{index + 1}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center space-x-3">
                      <div className="rounded-full flex items-center justify-center w-8 h-8 overflow-hidden shrink-0">
                        {team.team.logos && team.team.logos[logoIndex] && (
                          <Link href={`/${league}/${team.team.id}`}>
                            <Image src={team.team.logos[logoIndex].href} alt={''} className="size-8 object-contain" width={80} height={80} unoptimized />
                          </Link>
                        )}
                      </div>
                      <Link href={`/${league}/${team.team.id}`} className="font-medium text-neutral-800 dark:text-neutral-200  truncate">
                        {team.team.displayName}
                      </Link>
                    </div>
                  </td>
                  <td className="px-1 py-2 text-center text-neutral-700 dark:text-neutral-300 tabular-nums">{confRecord}</td>
                  <td className="px-1 py-2 text-center text-neutral-700 dark:text-neutral-300 tabular-nums">{confWinPct}</td>
                  <td className="px-2  py-2 text-center text-neutral-700 dark:text-neutral-300 tabular-nums">{confGamesBack}</td>
                  <td className="px-1 py-2 text-center text-neutral-700 dark:text-neutral-300 tabular-nums">{totalRecord}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
