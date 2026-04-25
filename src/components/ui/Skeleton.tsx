import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-slate-200/50 relative overflow-hidden",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        className
      )}
      {...props}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-surface p-6 rounded-3xl border border-black/5 shadow-sm space-y-4">
      <div className="flex justify-between items-start">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-12 w-32" />
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-surface rounded-[32px] border border-black/5 shadow-sm overflow-hidden">
      <div className="p-8 border-b border-black/5 bg-slate-50/30 flex justify-between items-center">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-12" />
      </div>
      <div className="p-8 space-y-6">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex justify-between items-center gap-8 py-2">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-2 w-1/2" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AIInsightSkeleton() {
  return (
    <div className="bg-primary p-8 rounded-[40px] shadow-2xl space-y-6">
      <Skeleton className="w-12 h-12 rounded-2xl bg-white/10" />
      <Skeleton className="h-16 w-full bg-white/10" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full bg-white/10" />
        <Skeleton className="h-4 w-3/4 bg-white/10" />
      </div>
      <Skeleton className="h-12 w-full rounded-full bg-white/20" />
    </div>
  );
}
