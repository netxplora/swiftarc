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
import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { MobileTabBar } from "@/components/site/MobileTabBar";
import { CommandPalette } from "@/components/site/CommandPalette";
import { ChatWidget } from "@/components/chat/ChatWidget";

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
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/favicon.ico" },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      { name: "theme-color", content: "#0B1220" },
      { property: "og:title", content: "SwiftArc — Engineered Global Logistics" },
      {
        property: "og:description",
        content: "Enterprise-grade shipping, real-time tracking, and AI-powered delivery intelligence.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
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

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-dvh flex-col bg-background pb-16 lg:pb-0">
        <SiteHeader />
        <main className="flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
        <SiteFooter />
        <MobileTabBar />
        <CommandPalette />
        <ChatWidget />
        <Toaster richColors position="top-right" />
      </div>
    </QueryClientProvider>
  );
}
