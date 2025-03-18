'use client';

import Link from 'next/link';
import NCAA from './icons/NCAA';
// import { usePathname } from 'next/navigation';

export default function NavbarSports() {
  // const pathname = usePathname();

  const sports = [
    {
      name: 'NCAAW',
      path: '/ncaaw',
      logo: <NCAA className="size-5" />
    },
  ];

  return (
    <nav className="bg-neutral-950">
      <div className="max-w-[1400px] flex items-center justify-center">
        <ul className="flex">
          {sports.map((sport) => (
            <li key={sport.name}>
              <Link href={sport.path} className={'px-6 py-1.5 text-sm font-medium transition-colors flex items-center gap-2 hover:bg-neutral-900 text-white'}>
                  {sport.logo}
                <span className="pt-0.5">{sport.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
