import { createContext, useContext, useEffect, useState, useMemo } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthState {
  user: User | null;
  profile: any | null;
  roles: string[];
  loading: boolean;
  signedIn: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ 
    user: null, 
    profile: null,
    roles: [],
    loading: true, 
    signedIn: false,
    refreshProfile: async () => {} 
  });

  const fetchUserProfile = async (userId: string) => {
    try {
      const [profileRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId)
      ]);
      
      const profile = profileRes.data;
      let userRoles = (rolesRes.data ?? []).map((r) => r.role as string);
      
      // Fallback and aliasing logic based on KI
      if (userRoles.length === 0 && (profile as any)?.role) {
        userRoles = [(profile as any).role];
      }
      
      userRoles = userRoles.map(r => r === "partner" ? "business" : r);

      setState(prev => ({ ...prev, profile, roles: userRoles }));
    } catch (error) {
      console.error("Failed to fetch user profile", error);
    }
  };

  const refreshProfile = async () => {
    if (state.user) {
      setState(prev => ({ ...prev, loading: true }));
      await fetchUserProfile(state.user.id);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const initializeAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setState(prev => ({ ...prev, user: currentUser, signedIn: !!currentUser }));

      if (currentUser) {
        await fetchUserProfile(currentUser.id);
      }
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    let mounted = true;
    initializeAuth();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      const currentUser = session?.user ?? null;
      
      if (event === "SIGNED_IN") {
        setState(prev => ({ ...prev, user: currentUser, signedIn: !!currentUser, loading: true }));
        if (currentUser) await fetchUserProfile(currentUser.id);
        setState(prev => ({ ...prev, loading: false }));
      } else if (event === "SIGNED_OUT") {
        setState(prev => ({ ...prev, user: null, profile: null, roles: [], signedIn: false, loading: false }));
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ ...state, refreshProfile }), [state.user, state.profile, state.roles, state.loading, state.signedIn]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
