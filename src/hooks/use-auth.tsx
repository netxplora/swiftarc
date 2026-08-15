/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
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
    refreshProfile: async () => {},
  });

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const [profileRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);

      // Detect expired/invalid sessions via HTTP status (401/403) or JWT error messages.
      // Note: error.code contains PostgreSQL codes (e.g. "PGRST301"), NOT HTTP status.
      // The HTTP status is on the response object's .status field.
      const isUnauthorized =
        profileRes.status === 401 ||
        rolesRes.status === 401 ||
        profileRes.status === 403 ||
        rolesRes.status === 403 ||
        profileRes.error?.message?.includes("JWT") ||
        rolesRes.error?.message?.includes("JWT");

      if (isUnauthorized) {
        console.warn("[Auth] Session expired or invalid — signing out.");
        await supabase.auth.signOut();
        setState((prev) => ({
          ...prev,
          user: null,
          profile: null,
          roles: [],
          signedIn: false,
          loading: false,
        }));
        return;
      }

      const profile = profileRes.data;
      let userRoles = (rolesRes.data ?? []).map((r) => r.role as string);

      // Fallback and aliasing logic based on KI
      if (userRoles.length === 0 && (profile as any)?.role) {
        userRoles = [(profile as any).role];
      }

      userRoles = userRoles.map((r) => (r === "partner" ? "business" : r));

      setState((prev) => ({ ...prev, profile, roles: userRoles }));
    } catch (error) {
      console.error("Failed to fetch user profile", error);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (state.user) {
      setState((prev) => ({ ...prev, loading: true }));
      await fetchUserProfile(state.user.id);
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [state.user, fetchUserProfile]);

  const initializeAuth = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const currentUser = session?.user ?? null;
      setState((prev) => ({ ...prev, user: currentUser, signedIn: !!currentUser }));

      if (currentUser) {
        await fetchUserProfile(currentUser.id);
      }
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    let mounted = true;
    initializeAuth();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      const currentUser = session?.user ?? null;

      if (event === "SIGNED_IN") {
        setState((prev) => ({
          ...prev,
          user: currentUser,
          signedIn: !!currentUser,
          loading: true,
        }));
        if (currentUser) await fetchUserProfile(currentUser.id);
        setState((prev) => ({ ...prev, loading: false }));
      } else if (event === "SIGNED_OUT") {
        setState((prev) => ({
          ...prev,
          user: null,
          profile: null,
          roles: [],
          signedIn: false,
          loading: false,
        }));
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [initializeAuth, fetchUserProfile]);

  const value = useMemo(() => ({ ...state, refreshProfile }), [state, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
