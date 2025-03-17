import { LoaderCircle } from 'lucide-react';

export default function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center min-h-[2rem] w-full">
      <LoaderCircle size={24} className="text-indigo-500 animate-spin" />
    </div>
  );
}
