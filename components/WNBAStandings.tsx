import { fetchWNBAStandings } from '@/utils/WNBA/fetchStandings';
import Image from 'next/image';
import Link from 'next/link';
// import { DARK_COLORED_LOGOS } from '@/lib/consts';

interface WNBAStandingsProps {
  currentTeam?: string;
  variant?: 'compact' | 'full';
}

export default async function WNBAStandings({ currentTeam, variant = 'compact' }: WNBAStandingsProps) {
  const { standings, season } = await fetchWNBAStandings();

  // Check if all teams have rank 0
  const allTeamsHaveZeroRank = standings.every((team) => team.rank === 0);

  // Calculate Games Behind for full variant
  const standingsWithGB =
    variant === 'full'
      ? standings.map((team, index) => {
          const leaderWins = standings[0]?.wins || 0;
          const leaderLosses = standings[0]?.losses || 0;
          const gb = index === 0 ? 0 : (leaderWins - team.wins + (team.losses - leaderLosses)) / 2;
          return { ...team, gamesBehind: gb === 0 ? '-' : gb.toFixed(1) };
        })
      : standings;

  const isCompact = variant === 'compact';

  return (
    <div className={`${isCompact ? 'w-[85%] sm:w-full mx-auto px-2 lg:px-0.5' : 'w-full max-w-5xl mx-auto'}`}>
      <h2
        className={`font-bold mb-${isCompact ? '2' : '4'} text-neutral-800 dark:text-neutral-200 ${isCompact ? 'text-xl' : 'text-2xl text-center'}`}
      >
        WNBA {season} Standings
      </h2>
      <div className="bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-md shadow-xs overflow-x-auto">
        <table className={`w-full ${isCompact ? 'table-fixed' : 'table-auto'}`}>
          <thead>
            <tr className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
              <th className={`${isCompact ? 'w-7 px-1 py-2' : 'px-2 py-3'} text-center text-neutral-600 dark:text-neutral-400 font-medium text-sm`}>
                {isCompact ? '#' : 'Rank'}
              </th>
              <th className={`${isCompact ? 'px-2 py-2' : 'px-1 py-3'} text-left text-neutral-600 dark:text-neutral-400 font-medium text-sm`}>
                Team
              </th>
              <th className={`${isCompact ? 'w-7 px-1 py-2' : 'px-1 py-3'} text-center text-neutral-600 dark:text-neutral-400 font-medium text-sm`}>
                W
              </th>
              <th className={`${isCompact ? 'w-7 px-1 py-2' : 'px-1 py-3'} text-center text-neutral-600 dark:text-neutral-400 font-medium text-sm`}>
                L
              </th>
              <th
                className={`${
                  isCompact ? 'w-11 px-1 py-2' : 'px-1 py-3'
                } text-center text-neutral-600 dark:text-neutral-400 font-medium text-sm whitespace-nowrap`}
              >
                PCT
              </th>
              {!isCompact && (
                <th className="px-1 py-3 text-center text-neutral-600 dark:text-neutral-400 font-medium text-sm whitespace-nowrap">GB</th>
              )}
            </tr>
          </thead>
          <tbody>
            {standingsWithGB.map((team, index) => {
              // const isDarkLogo = DARK_COLORED_LOGOS.includes(team.name);
              const isCurrentTeam = currentTeam && team.id === currentTeam;

              return (
                <tr
                  key={team.id}
                  className={`border-b border-neutral-200 dark:border-neutral-800 ${
                    isCurrentTeam ? (isCompact ? 'bg-blue-50 dark:bg-blue-950/20' : 'bg-neutral-700/70 hover:bg-neutral-700/70') : ''
                  }`}
                >
                  <td
                    className={`${isCompact ? 'px-1 py-2' : 'px-2 py-2'} text-center font-medium text-neutral-800 dark:text-neutral-200 ${
                      isCompact ? 'text-sm' : ''
                    }`}
                  >
                    {allTeamsHaveZeroRank ? index + 1 : team.rank}
                  </td>
                  <td className={`${isCompact ? 'px-2 py-2' : 'px-3 py-2'}`}>
                    {isCompact ? (
                      <Link href={`/wnba/${team.id}`} className="flex items-center gap-2">
                        <div className="rounded-full flex items-center justify-center w-6 h-6 overflow-hidden shrink-0 bg-neutral-100 dark:bg-neutral-900">
                          {team.logo && (
                            <Image src={team.logo} alt={team.name} className="size-4 object-contain" width={16} height={16} unoptimized />
                          )}
                        </div>
                        <span className="font-medium text-neutral-800 dark:text-neutral-200 text-sm">{team.name}</span>
                      </Link>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <div className="rounded-full flex items-center justify-center w-8 h-8 overflow-hidden shrink-0">
                          {team.logo && (
                            <Link href={`/wnba/${team.id}`}>
                              <Image src={team.logo} alt={team.name} className="size-8 object-contain" width={80} height={80} unoptimized />
                            </Link>
                          )}
                        </div>
                        <Link href={`/wnba/${team.id}`} className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                          {team.name}
                        </Link>
                      </div>
                    )}
                  </td>
                  <td
                    className={`${isCompact ? 'px-1 py-2' : 'px-1 py-2'} text-center text-neutral-700 dark:text-neutral-300 tabular-nums ${
                      isCompact ? 'text-sm' : ''
                    }`}
                  >
                    {team.wins}
                  </td>
                  <td
                    className={`${isCompact ? 'px-1 py-2' : 'px-1 py-2'} text-center text-neutral-700 dark:text-neutral-300 tabular-nums ${
                      isCompact ? 'text-sm' : ''
                    }`}
                  >
                    {team.losses}
                  </td>
                  <td
                    className={`${isCompact ? 'px-1 py-2' : 'px-1 py-2'} text-center text-neutral-700 dark:text-neutral-300 tabular-nums ${
                      isCompact ? 'text-sm' : ''
                    }`}
                  >
                    {team.winPct}
                  </td>
                  {!isCompact && (
                    <td className="px-2 py-2 text-center text-neutral-700 dark:text-neutral-300 tabular-nums">{(team as any).gamesBehind || '-'}</td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
