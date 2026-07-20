import { Link, useRouterState } from "@tanstack/react-router";
import { 
  LayoutDashboard, Package2, BookUser, Receipt, Bell, Settings, LogOut, 
  Shield, Sun, Moon, Map, PlusCircle, Users, Truck, MessageSquare, CreditCard,
  Building2, Warehouse, Activity, BarChart
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const mainNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/dashboard/shipments", label: "Shipments", icon: Package2 },
  { to: "/tracking", label: "Tracking", icon: Map },
  { to: "/shipping", label: "Book Shipment", icon: PlusCircle },
  { to: "/dashboard/invoices", label: "Invoices", icon: Receipt },
];

const adminNav = [
  { to: "/admin", label: "Admin Overview", icon: Shield, end: true },
  { to: "/admin/map", label: "Global Map", icon: Map },
  { to: "/admin/shipments", label: "All Shipments", icon: Package2 },
  { to: "/admin/users", label: "Customers", icon: Users },
  { to: "/admin/pickups", label: "Couriers", icon: Truck },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/invoices", label: "All Invoices", icon: Receipt },
  { to: "/admin/broadcast", label: "Broadcasts", icon: MessageSquare },
];

const bottomNav = [
  { to: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { to: "/dashboard/api-keys", label: "Developer API", icon: Settings },
  { to: "/support", label: "Support", icon: MessageSquare },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, roles } = useAuth();
  const { theme, toggle } = useTheme();
  const isAdmin = roles.includes("admin");
  const nav = useNavigate();
  const qc = useQueryClient();

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    nav({ to: "/login", replace: true });
  };

  const initials = (user?.user_metadata?.display_name || user?.email || "A").slice(0, 1).toUpperCase();
  const name = user?.user_metadata?.display_name || user?.email;

  const isActive = (to: string, end?: boolean) => {
    if (to === "/tracking" || to === "/shipping" || to === "/support") {
      return pathname.startsWith(to); // Since these are technically public routes, we just highlight them if we are currently on them, although within the dashboard they will navigate away.
    }
    return end ? pathname === to : pathname.startsWith(to);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-3">
          <Logo />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map(({ to, label, icon: Icon, end }) => (
                <SidebarMenuItem key={to}>
                  <SidebarMenuButton asChild isActive={isActive(to, end)} tooltip={label}>
                    <Link to={to} className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin Control Center</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNav.map(({ to, label, icon: Icon, end }) => (
                  <SidebarMenuItem key={to}>
                    <SidebarMenuButton asChild isActive={isActive(to, end)} tooltip={label}>
                      <Link to={to} className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomNav.map(({ to, label, icon: Icon }) => (
                <SidebarMenuItem key={to}>
                  <SidebarMenuButton asChild isActive={isActive(to)} tooltip={label}>
                    <Link to={to} className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={toggle} tooltip={theme === "dark" ? "Light mode" : "Dark mode"}>
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={signOut} tooltip="Sign out">
                  <LogOut className="h-4 w-4 text-destructive" />
                  <span className="text-destructive">Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
