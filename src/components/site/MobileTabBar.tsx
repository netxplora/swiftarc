import { Link, useRouterState } from "@tanstack/react-router";
import { Home, PackageSearch, Calculator, MapPin, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const baseTabs = [
  { to: "/", label: "Home", Icon: Home },
  { to: "/tracking", label: "Track", Icon: PackageSearch },
  { to: "/rates", label: "Rates", Icon: Calculator },
  { to: "/locations", label: "Places", Icon: MapPin },
] as const;

export function MobileTabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { signedIn } = useAuth();

  const tabs = [
    ...baseTabs,
    { to: signedIn ? "/dashboard" : "/login", label: "Account", Icon: User },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {tabs.map(({ to, label, Icon }) => {
          const active = pathname === to || (to !== "/" && pathname.startsWith(to));
          return (
            <li key={to}>
              <Link
                to={to}
                className={cn(
                  "flex min-h-11 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium",
                  active ? "text-navy-deep" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "relative grid h-8 w-8 place-items-center rounded-full transition-colors",
                    active && "bg-amber text-navy-deep",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
