import LoadingSpinner from '@/components/LoadingSpinner';

export default function Loading() {
  return (
    <div className="w-screen h-screen justify-center bg-neutral-950">
      <div className="w-full h-[45vh] flex items-center">
        <LoadingSpinner />
      </div>
    </div>
  );
}
