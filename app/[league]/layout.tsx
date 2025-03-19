import NavbarSports from '@/components/NavbarSports';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col bg-neutral-950">
      <NavbarSports />
      <div className="flex-1 bg-neutral-950">{children}</div>
    </div>
  );
}
