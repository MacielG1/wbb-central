import GameStats from '@/components/GameStats';
import WNBAGameStats from '@/components/WNBAGameStats';
import fetchWNBAGameId from '@/utils/WNBA/fetchGameId';
import { Metadata } from 'next';

type paramsType = Promise<{ gameId: string; league: string }>;

export async function generateMetadata(): Promise<Metadata> {

  return {
    title: `Game Details - WNBA Basketball`,
    description: `Live basketball game stats and scores for WNBA games.`,
    openGraph: {
      title: `Game Details - WNBA Basketball`,
      description: `Live basketball game stats and scores for WNBA games.`,
    },
  };
}

export default async function GamePage(props: { params: paramsType }) {
  const { gameId } = await props.params;
  const league = 'wnba';
  const game = await fetchWNBAGameId(gameId);

  return <WNBAGameStats data={game} league={league} />;
}
