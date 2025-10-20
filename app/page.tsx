import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function Home() {
  await headers();
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentDay = currentDate.getDate();

  const isWNBASeason =
    (currentMonth === 3 && currentDay >= 15) || // After mid-April
    (currentMonth > 3 && currentMonth < 9) || // May through September
    (currentMonth === 9 && currentDay <= 15); // Before end of October

  if (isWNBASeason) {
    redirect('/wnba');
  } else {
    redirect('/ncaaw');
  }
}
