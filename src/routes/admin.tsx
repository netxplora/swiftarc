import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

import { AdminSkeleton } from "@/components/skeletons/AdminSkeleton";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/login", search: { redirect: location.pathname } });
    }
    return { user: data.user };
  },
  head: () => ({
    meta: [
      { title: "Admin — SwiftArc" },
      { name: "robots", content: "noindex" },
    ],
  }),
  pendingComponent: AdminSkeleton,
  pendingMs: 150,
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <SidebarProvider>
        <div className="flex min-h-dvh w-full">
          <DashboardSidebar />
          <SidebarInset className="flex flex-col flex-1 min-w-0">
            <DashboardHeader />
            <div className="flex-1 w-full p-4 sm:p-6 lg:p-8">
              <div className="mx-auto w-full max-w-7xl">
                <Outlet />
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
