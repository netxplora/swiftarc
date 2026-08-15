import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package2,
  BookUser,
  Receipt,
  Bell,
  Settings,
  LogOut,
  Shield,
  Sun,
  Moon,
  Map,
  PlusCircle,
  Users,
  Truck,
  MessageSquare,
  CreditCard,
  Building2,
  Warehouse,
  Activity,
  BarChart,
  ShieldAlert,
  BadgeDollarSign,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Main nav removed for admin-only structure

const adminNav = [
  { to: "/admin", label: "Admin Overview", icon: Shield, end: true },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart },
  { to: "/admin/map", label: "Global Map", icon: Map },
  { to: "/admin/shipments", label: "All Shipments", icon: Package2 },
  { to: "/admin/users", label: "Customers", icon: Users },
  { to: "/admin/pickups", label: "Couriers", icon: Truck },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/payments-config", label: "Payment Config", icon: Settings },
  { to: "/admin/clearance", label: "Clearance Payments", icon: ShieldAlert },
  { to: "/admin/invoices", label: "All Invoices", icon: Receipt },
  { to: "/admin/support", label: "Support Tickets", icon: MessageSquare },
  { to: "/admin/broadcast", label: "Broadcasts", icon: Activity },
];

const bottomNav = [{ to: "/support", label: "Support", icon: MessageSquare }];

export function DashboardSidebar() {
  const { state, setOpenMobile, isMobile } = useSidebar();
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

  const initials = (user?.user_metadata?.display_name || user?.email || "A")
    .slice(0, 1)
    .toUpperCase();
  const name = user?.user_metadata?.display_name || user?.email;

  const isActive = (to: string, end?: boolean) => {
    if (to === "/tracking" || to === "/shipping" || to === "/support") {
      return pathname.startsWith(to); // Since these are technically public routes, we just highlight them if we are currently on them, although within the dashboard they will navigate away.
    }
    return end ? pathname === to : pathname.startsWith(to);
  };

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/" className="flex items-center gap-2 px-2 py-3">
          <Logo />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin Controls</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNav.map(({ to, label, icon: Icon, end }) => (
                <SidebarMenuItem key={to}>
                  <SidebarMenuButton asChild isActive={isActive(to, end)} tooltip={label}>
                    <Link to={to} className="flex items-center gap-2" onClick={handleLinkClick}>
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomNav.map(({ to, label, icon: Icon }) => (
                <SidebarMenuItem key={to}>
                  <SidebarMenuButton asChild isActive={isActive(to)} tooltip={label}>
                    <Link to={to} className="flex items-center gap-2" onClick={handleLinkClick}>
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={toggle}
                  tooltip={theme === "dark" ? "Light mode" : "Dark mode"}
                >
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
