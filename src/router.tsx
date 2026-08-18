import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 15, // 15 minutes
        refetchOnWindowFocus: false, // Prevent refresh when minimizing/focusing
        refetchOnReconnect: false,
        refetchOnMount: false, // Prevents duplicate fetches on rapid navigation
      },
    },
  });

  // Enable session-based cache persistence only in the browser
  if (typeof window !== "undefined") {
    const sessionStoragePersister = createSyncStoragePersister({
      storage: window.sessionStorage,
      key: "swiftarc-session-cache",
    });

    persistQueryClient({
      queryClient: queryClient as any,
      persister: sessionStoragePersister,
      maxAge: 1000 * 60 * 60 * 12, // Persist for up to 12 hours in the session
      hydrateOptions: {},
      dehydrateOptions: {
        shouldDehydrateQuery: (query) => {
          // Persist only successful queries
          return query.state.status === "success";
        },
      },
    });
  }

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
  });

  return router;
};
