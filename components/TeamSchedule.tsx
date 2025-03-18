import TeamScheduleRow from './TeamScheduleRow';

export default async function TeamSchedule({ data, league }: { data: any; league: string }) {
  return (
    <>
      {data.events.map((game: any, index: number) => {
        return <TeamScheduleRow key={game.id} game={game} isLast={index === data.events.length - 1} teamId={data.team.id} league={league} />;
      })}
    </>
  );
}
