import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

export function TrackingSkeleton() {
  return (
    <div>
      {/* Sticky header skeleton */}
      <div className="sticky top-16 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-6 lg:px-8">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowLeft className="h-3 w-3" /> All tracking
            </div>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="mt-1 flex items-center gap-2">
              <Skeleton className="h-8 w-40" />
              <span className="text-amber">→</span>
              <Skeleton className="h-8 w-40" />
            </div>
            <Skeleton className="mt-1 h-3 w-32" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Timeline Skeleton */}
            <div className="mb-8 relative flex w-full items-center justify-between">
              <div className="absolute left-0 top-1/2 -z-10 h-1 w-full -translate-y-1/2 bg-secondary" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>

            {/* Map Skeleton */}
            <div className="overflow-hidden rounded-2xl border border-border min-h-[400px]">
              <Skeleton className="h-[400px] w-full" />
            </div>

            {/* Checkpoints Skeleton */}
            <section className="rounded-2xl border border-border bg-card p-6">
              <Skeleton className="h-7 w-48 mb-6" />
              <ol className="space-y-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <li key={i} className="relative grid grid-cols-[auto_1fr] gap-4">
                    <div className="relative flex flex-col items-center">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      {i < 2 && <span className="mt-1 h-full w-px flex-1 bg-border" />}
                    </div>
                    <div className="pb-2">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-48 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <aside className="space-y-6">
            {/* Estimated Delivery Skeleton */}
            <section className="rounded-2xl border border-border bg-card p-6">
              <Skeleton className="h-3 w-32 mb-2" />
              <Skeleton className="h-8 w-48 mb-4" />
              <div className="grid grid-cols-4 gap-2">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            </section>

            {/* AI Prediction Skeleton */}
            <section className="rounded-2xl border border-amber/40 bg-amber/10 p-6">
              <Skeleton className="h-4 w-32 mb-3" />
              <Skeleton className="h-10 w-48 mb-3" />
              <Skeleton className="h-4 w-full" />
            </section>

            {/* Package Details Skeleton */}
            <section className="rounded-2xl border border-border bg-card p-6">
              <Skeleton className="h-3 w-24 mb-4" />
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-2 w-16 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
