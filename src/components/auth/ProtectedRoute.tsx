import { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // If omitted, any authenticated user can access
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, roles, loading } = useAuth();
  const nav = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (loading || hasRedirected) return;

    if (!user) {
      setHasRedirected(true);
      nav({ to: "/login", search: { redirect: pathname }, replace: true });
      return;
    }

    if (allowedRoles && allowedRoles.length > 0) {
      const hasAccess = allowedRoles.some((role) => roles.includes(role));
      if (!hasAccess) {
        setHasRedirected(true);
        // Priority-based redirect calculation
        const bestRedirect = getRedirectForRole(roles);
        nav({ to: bestRedirect, replace: true });
      }
    }
  }, [loading, user, roles, allowedRoles, nav, pathname, hasRedirected]);

  const getRedirectForRole = (userRoles: string[]): string => {
    if (userRoles.includes("admin")) return "/admin";
    if (userRoles.includes("rider")) return "/rider";
    if (userRoles.includes("business") || userRoles.includes("partner")) return "/business";
    return "/dashboard";
  };

  // Block rendering until fully verified to prevent layout flashing
  if (loading || hasRedirected || !user) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasAccess = allowedRoles.some((role) => roles.includes(role));
    if (!hasAccess) return null;
  }

  return <>{children}</>;
}
