import { createContext, useContext, useEffect, useState, useMemo } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthState {
  user: User | null;
  loading: boolean;
  signedIn: boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true, signedIn: false });

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setState({ user: data.session?.user ?? null, loading: false, signedIn: !!data.session?.user });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, loading: false, signedIn: !!session?.user });
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => state, [state.user, state.loading, state.signedIn]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    // Fallback for components rendered outside the provider (though they shouldn't be)
    // Actually, throwing is better to catch bugs:
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
