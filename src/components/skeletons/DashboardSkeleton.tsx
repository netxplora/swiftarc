import { Skeleton } from "@/components/ui/skeleton";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

export function DashboardSkeleton() {
  return (
    <SidebarProvider>
      <div className="flex min-h-[calc(100dvh-4rem)] w-full">
        {/* Mock Sidebar (Desktop) */}
        <aside className="hidden w-64 flex-col gap-4 border-r border-border bg-sidebar p-4 md:flex">
          <div className="flex items-center gap-2 px-2 py-4">
            <Skeleton className="h-6 w-6 rounded-md" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="space-y-2 mt-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-md" />
            ))}
          </div>
          <div className="mt-auto space-y-2">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        </aside>

        <SidebarInset>
          <div className="sticky top-16 z-20 flex h-12 items-center gap-2 border-b border-border/60 bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <span className="text-xs text-muted-foreground">Workspace</span>
          </div>
          <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-72" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-6">
                  <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4 rounded-full" />
                  </div>
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <div className="rounded-xl border border-border bg-card lg:col-span-4 h-96 p-6">
                <Skeleton className="h-full w-full" />
              </div>
              <div className="rounded-xl border border-border bg-card lg:col-span-3 h-96 p-6">
                <Skeleton className="h-full w-full" />
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
