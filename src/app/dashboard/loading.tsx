import { StatCardSkeleton, TableSkeleton, AIInsightSkeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-8 font-body animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-10 w-64 bg-slate-200 animate-pulse rounded-lg" />
          <div className="h-4 w-96 bg-slate-100 animate-pulse rounded-lg" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-32 bg-slate-200 animate-pulse rounded-full" />
          <div className="h-10 w-32 bg-slate-200 animate-pulse rounded-full" />
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </section>

      {/* Main Layout Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <section className="lg:col-span-2">
          <TableSkeleton rows={8} />
        </section>

        <aside>
          <AIInsightSkeleton />
        </aside>
      </div>
    </div>
  );
}
