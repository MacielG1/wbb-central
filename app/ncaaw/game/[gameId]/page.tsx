import GameStats from '@/components/GameStats';
import fetchGameId from '@/utils/NCAAW/fetchGameId';
import { Metadata } from 'next';

type paramsType = Promise<{ gameId: string; league: string }>;

interface Competitor {
  homeAway: string;
  team: {
    name: string;
  };
}

export async function generateMetadata(): Promise<Metadata> {

  return {
    title: `Game Details - NCAAW Basketball`,
    description: `Live basketball game stats and scores for NCAAW games.`,
    openGraph: {
      title: `Game Details - NCAAW Basketball`,
      description: `Live basketball game stats and scores for NCAAW games.`,
    },
  };
}

export default async function GamePage(props: { params: paramsType }) {
  const { gameId } = await props.params;
  const league = 'ncaaw';
  const game = await fetchGameId(gameId);

  return <GameStats data={game} league={league} />;
}
