export default function RankingsDisplaySkeleton() {
  return (
    <div className="w-full max-w-[26rem] lg:max-w-[14rem] xl:max-w-[18rem] bg-neutral-900 overflow-hidden mb-4 lg:mb-1 mx-auto">
      <div className="grid grid-cols-[auto_1fr_auto_auto] gap-0.5 text-xs">
        <div className="col-span-4">
          <div className="h-8 flex items-center">
            <div className="w-[24px]" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-neutral-800 rounded animate-pulse mx-auto" />
            </div>
            <div className="w-[24px]" />
          </div>
          <div className="text-center">
            <div className="h-3 w-24 bg-neutral-800 rounded animate-pulse mx-auto mt-1" />
          </div>
        </div>

        {Array.from({ length: 25 }).map((_, index) => (
          <div key={index} className="col-span-4 px-2.5 grid grid-cols-[auto_1fr_auto_auto] gap-2 items-center w-full py-1 [&+&]:border-t [&+&]:border-neutral-700">
            <div className="h-3 w-4 bg-neutral-800 rounded animate-pulse" />
            <div className="flex items-center gap-1">
              <div className="h-5 w-5 bg-neutral-800 rounded animate-pulse" />
              <div className="h-3 w-20 bg-neutral-800 rounded animate-pulse" />
            </div>
            <div className="h-3 w-8 bg-neutral-800 rounded animate-pulse" />
            <div className="h-3 w-6 bg-neutral-800 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
