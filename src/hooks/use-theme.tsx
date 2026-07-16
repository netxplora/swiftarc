import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

type Theme = "light" | "dark";
type Pref = "light" | "dark" | "system";

const KEY = "swiftarc-theme";

function systemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolve(pref: Pref): Theme {
  return pref === "system" ? systemTheme() : pref;
}

function apply(theme: Theme) {
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }
}

interface ThemeContextState {
  theme: Theme;
  preference: Pref;
  toggle: () => void;
  setPreference: (next: Pref) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextState | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [pref, setPref] = useState<Pref>("system");
  const [theme, setTheme] = useState<Theme>("light");

  // Initial local read + system listener + remote pull
  useEffect(() => {
    let cancelled = false;

    // 1. Load local immediately
    const stored = (typeof window !== "undefined" && (localStorage.getItem(KEY) as Pref | null)) || null;
    const initial: Pref = stored ?? "system";
    setPref(initial);
    const t = resolve(initial);
    setTheme(t); 
    apply(t);

    // 2. Set up system matcher
    const mq = typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    const onSystemChange = () => {
      const current = (localStorage.getItem(KEY) as Pref | null) ?? "system";
      if (current === "system") {
        const t2 = systemTheme();
        setTheme(t2); 
        apply(t2);
      }
    };
    mq?.addEventListener?.("change", onSystemChange);

    // 3. Pull remote
    async function pull() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data } = await supabase.from("profiles").select("theme").eq("id", user.id).maybeSingle();
      if (cancelled || !data?.theme) return;
      const p = data.theme as Pref;
      setPref(p);
      const tRemote = resolve(p);
      setTheme(tRemote); 
      apply(tRemote);
      try { localStorage.setItem(KEY, p); } catch { /* ignore */ }
    }
    pull();

    // 4. Listen to auth changes to pull again
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") pull();
    });

    return () => {
      cancelled = true;
      mq?.removeEventListener?.("change", onSystemChange);
      sub.subscription.unsubscribe();
    };
  }, []);

  const setPreference = useCallback(async (next: Pref) => {
    setPref(next);
    const t = resolve(next);
    setTheme(t); 
    apply(t);
    try { localStorage.setItem(KEY, next); } catch { /* ignore */ }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ theme: next }).eq("id", user.id);
    }
  }, []);

  const toggle = useCallback(() => {
    setPreference(theme === "dark" ? "light" : "dark");
  }, [theme, setPreference]);

  const value = useMemo(() => ({ theme, preference: pref, toggle, setPreference }), [theme, pref, toggle, setPreference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
