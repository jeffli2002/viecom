import { cn } from './utils';

interface GenerationProgressBarProps {
  value: number;
  className?: string;
}

export function GenerationProgressBar({ value, className }: GenerationProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));

  return (
    <div
      className={cn(
        'h-2 w-full overflow-hidden rounded-full bg-teal-100 dark:bg-teal-900/30/70 shadow-inner',
        className
      )}
    >
      <div
        className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 animate-progress-shimmer shadow-[0_0_12px_rgba(168,85,247,0.45)] transition-[width] duration-700 ease-out"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}
