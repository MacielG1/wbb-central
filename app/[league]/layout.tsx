import NavbarSports from '@/components/NavbarSports';
import { Suspense } from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col bg-neutral-950">
      {/* <Suspense fallback={<div>Loading...</div>}> */}
      <NavbarSports />
      {/* </Suspense> */}
      <div className="flex-1 bg-neutral-950">{children}</div>
    </div>
  );
}
