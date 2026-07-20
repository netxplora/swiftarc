import { Skeleton } from "@/components/ui/skeleton";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminSkeleton() {
  return (
    <div>
      <div className="flex items-center gap-4 border-b border-border bg-card p-4 lg:hidden">
        <Button variant="ghost" size="icon" disabled><Menu className="h-5 w-5" /></Button>
        <span className="font-display font-semibold">Admin Panel</span>
      </div>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8">
        <aside className="hidden lg:sticky lg:top-24 lg:h-fit lg:block">
          <div className="rounded-2xl border border-border bg-card p-3">
            <div className="mb-3 flex items-center gap-2 px-2">
              <Skeleton className="h-4 w-4 rounded-sm" />
              <Skeleton className="h-4 w-24" />
            </div>
            <nav className="grid gap-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full rounded-lg" />
              ))}
            </nav>
            <div className="mt-3 border-t border-border pt-3">
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
          </div>
        </aside>
        <section className="min-w-0">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-40 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-28" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-border bg-card">
            <div className="p-6 border-b border-border">
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="p-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between border-b border-border p-4 last:border-0">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-20 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
