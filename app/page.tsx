// import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function Home() {
  redirect('/ncaaw');

  // return (
  //   <main className="max-w-5xl mx-auto">
  //     <Link href={`/ncaaw`}>NCAAW</Link>
  //   </main>
  // );
}
