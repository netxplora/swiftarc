import { useEffect } from "react";
import { createFileRoute, Outlet, useNavigate, useRouterState, redirect } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export const Route = createFileRoute("/dashboard")({
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
      { title: "Dashboard — SwiftArc" },
      { name: "description", content: "Manage shipments, address book, invoices, and account notifications." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardLayout,
});

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

function DashboardLayout() {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="flex min-h-[calc(100dvh-4rem)] w-full">
          <DashboardSidebar />
          <SidebarInset>
            <div className="sticky top-16 z-20 flex h-12 items-center gap-2 border-b border-border/60 bg-background/80 px-4 backdrop-blur">
              <SidebarTrigger />
              <span className="text-xs text-muted-foreground">Workspace</span>
            </div>
            <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
