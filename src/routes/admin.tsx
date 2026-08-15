import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { supabase } from "@/integrations/supabase/client";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Admin — SwiftArc" }, { name: "robots", content: "noindex" }],
  }),
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
            <div className="flex-1 w-full p-4 sm:p-6 lg:p-8 relative">
              <div className="mx-auto w-full max-w-7xl">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={useRouterState({ select: (s) => s.location.pathname })}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                  >
                    <Outlet />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
