import GameStats from '@/components/GameStats';
import fetchGameId from '@/utils/fetchGameId';
import { Metadata } from 'next';

type paramsType = Promise<{ gameId: string; league: string }>;

interface Competitor {
  homeAway: string;
  team: {
    name: string;
  };
}

export async function generateMetadata({ params }: { params: paramsType }): Promise<Metadata> {
  const { league } = await params;
  const leagueName = league.toUpperCase();

  return {
    title: `Game Details - ${leagueName} Basketball`,
    description: `Live basketball game stats and scores for ${leagueName} games.`,
    openGraph: {
      title: `Game Details - ${leagueName} Basketball`,
      description: `Live basketball game stats and scores for ${leagueName} games.`,
    },
  };
}

export default async function GamePage(props: { params: paramsType }) {
  const { gameId, league } = await props.params;
  const game = await fetchGameId(gameId);

  return <GameStats data={game} league={league} />;
}
