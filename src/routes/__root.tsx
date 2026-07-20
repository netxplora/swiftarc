import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import React, { useEffect, type ReactNode, Suspense } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { MobileTabBar } from "@/components/site/MobileTabBar";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";

const CommandPalette = React.lazy(() =>
  import("@/components/site/CommandPalette").then((m) => ({ default: m.CommandPalette }))
);
const ChatWidget = React.lazy(() =>
  import("@/components/chat/ChatWidget").then((m) => ({ default: m.ChatWidget }))
);

function NotFoundComponent() {
  return (
    <>
      <SiteHeader />
      <main className="flex min-h-[60vh] items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber">
            404 — Off route
          </p>
          <h1 className="mt-3 font-display text-6xl font-bold tracking-tight text-foreground">
            This shipment took a detour.
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            The page you're looking for isn't on our network. Head back to the dispatch center.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/"
              className="inline-flex h-11 items-center justify-center rounded-md bg-navy-deep px-5 text-sm font-medium text-cream transition-colors hover:bg-navy"
            >
              Return home
            </Link>
            <Link
              to="/tracking"
              className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-medium hover:bg-secondary"
            >
              Track a shipment
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
      <MobileTabBar />
    </>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          A rerouting hiccup.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. Try again or head back to home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex h-11 items-center justify-center rounded-md bg-navy-deep px-5 text-sm font-medium text-cream hover:bg-navy"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-background px-5 text-sm font-medium hover:bg-secondary"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" },
      { name: "theme-color", content: "#07162C" },
      { title: "SwiftArc — Global Logistics & Shipment Tracking" },
      {
        name: "description",
        content: "Enterprise-grade logistics and shipment tracking platform.",
      },
      { property: "og:title", content: "SwiftArc — Engineered Global Logistics" },
      {
        property: "og:description",
        content: "Enterprise-grade shipping, real-time tracking, and AI-powered delivery intelligence.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/favicon.ico" },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "SwiftArc",
          url: "/",
          description: "Global logistics and shipment tracking across 220+ countries.",
          sameAs: [],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  // Force Vite cache invalidation to resolve tsd-source hydration mismatch
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function GlobalLoading() {
  const isNavigating = useRouterState({ select: (s) => s.status === "pending" });

  return (
    <AnimatePresence>
      {isNavigating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed left-0 top-0 z-[100] h-1 w-full overflow-hidden bg-navy/20"
        >
          <motion.div
            className="h-full w-1/2 bg-amber"
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{
              repeat: Infinity,
              duration: 1,
              ease: "linear",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    // Lazy import so SSR doesn't hit the client module at module scope
    import("@/integrations/supabase/client").then(({ supabase }) => {
      const { data: sub } = supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
          if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
        }
      });
      return () => sub.subscription.unsubscribe();
    });
  }, [queryClient]);

  const isDashboard = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
  const isAdmin = pathname.startsWith("/admin");

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <div suppressHydrationWarning className={`flex min-h-dvh flex-col bg-background ${isDashboard ? "" : "pb-16 lg:pb-0"}`}>
            <GlobalLoading />
            {!isDashboard && <SiteHeader />}
            <main className="flex-1 flex flex-col">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="flex-1 flex flex-col"
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </main>
            {!isDashboard && <SiteFooter />}
            {!isDashboard && <MobileTabBar />}
            <Suspense fallback={null}>
              <CommandPalette />
              {!isAdmin && <ChatWidget />}
            </Suspense>
            <Toaster richColors position="top-right" />
          </div>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
