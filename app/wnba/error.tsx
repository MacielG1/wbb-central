'use client';

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-100">Could not load WNBA scores</h1>
        <p className="mt-2 text-sm text-neutral-400">Scores service may be unavailable. Try again in a moment.</p>
      </div>
      <button
        onClick={reset}
        className="rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-100 transition-colors hover:bg-neutral-900"
      >
        Try again
      </button>
    </main>
  );
}
