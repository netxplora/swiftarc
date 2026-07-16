import { useEffect } from "react";
import { createFileRoute, Outlet, Link, useRouterState, useNavigate, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Shield, Users, Package2, Truck, Receipt, MessageSquare, ArrowLeft, Headphones } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-role";
import { cn } from "@/lib/utils";

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
  component: AdminLayout,
});

const nav: ReadonlyArray<{ to: "/admin" | "/admin/users" | "/admin/shipments" | "/admin/pickups" | "/admin/invoices" | "/admin/broadcast" | "/admin/support"; label: string; icon: any; end?: boolean }> = [
  { to: "/admin", label: "Overview", icon: Shield, end: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/shipments", label: "Shipments", icon: Package2 },
  { to: "/admin/pickups", label: "Pickups", icon: Truck },
  { to: "/admin/invoices", label: "Invoices", icon: Receipt },
  { to: "/admin/broadcast", label: "Broadcast", icon: MessageSquare },
  { to: "/admin/support", label: "Live Support", icon: Headphones },
];

function AdminLayout() {
  const { user, loading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const nv = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Query check via has_role (extra safety)
  useQuery({
    queryKey: ["admin-check", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" });
      return !!data;
    },
  });

  useEffect(() => {
    if (loading || roleLoading) return;
    if (!user) { nv({ to: "/login", replace: true }); return; }
    if (!isAdmin) { nv({ to: "/dashboard", replace: true }); }
  }, [user, loading, roleLoading, isAdmin, nv]);

  if (loading || roleLoading || !user || !isAdmin) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8">
      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <div className="rounded-2xl border border-border bg-card p-3">
          <div className="mb-3 flex items-center gap-2 px-2">
            <Shield className="h-4 w-4 text-amber" />
            <span className="font-display text-sm">Admin Panel</span>
          </div>
          <nav className="grid gap-1" aria-label="Admin">
            {nav.map(({ to, label, icon: Icon, end }) => {
              const active = end ? pathname === to : pathname.startsWith(to);
              return (
                <Link key={to} to={to} className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-navy-deep text-cream" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}>
                  <Icon className="h-4 w-4" /> {label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-3 border-t border-border pt-3">
            <Link to="/dashboard" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-secondary">
              <ArrowLeft className="h-3 w-3" /> Back to dashboard
            </Link>
          </div>
        </div>
      </aside>
      <section className="min-w-0"><Outlet /></section>
    </div>
  );
}
