import { useEffect, useState, useCallback } from "react";
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

export function useTheme() {
  const [pref, setPref] = useState<Pref>("system");
  const [theme, setTheme] = useState<Theme>("light");

  // Initial local read + system listener
  useEffect(() => {
    const stored = (typeof window !== "undefined" && (localStorage.getItem(KEY) as Pref | null)) || null;
    const initial: Pref = stored ?? "system";
    setPref(initial);
    const t = resolve(initial);
    setTheme(t); apply(t);

    const mq = typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    const onChange = () => {
      const current = (localStorage.getItem(KEY) as Pref | null) ?? "system";
      if (current === "system") {
        const t2 = systemTheme();
        setTheme(t2); apply(t2);
      }
    };
    mq?.addEventListener?.("change", onChange);
    return () => mq?.removeEventListener?.("change", onChange);
  }, []);

  // Cross-device sync: pull theme from profile when user is signed in
  useEffect(() => {
    let cancelled = false;
    async function pull() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data } = await supabase.from("profiles").select("theme").eq("id", user.id).maybeSingle();
      if (cancelled || !data?.theme) return;
      const p = data.theme as Pref;
      // Only override local if user hasn't explicitly picked on this device recently, OR remote differs
      setPref(p);
      const t = resolve(p);
      setTheme(t); apply(t);
      try { localStorage.setItem(KEY, p); } catch { /* ignore */ }
    }
    pull();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") pull();
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  const setPreference = useCallback(async (next: Pref) => {
    setPref(next);
    const t = resolve(next);
    setTheme(t); apply(t);
    try { localStorage.setItem(KEY, next); } catch { /* ignore */ }
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ theme: next }).eq("id", user.id);
    }
  }, []);

  const toggle = useCallback(() => {
    setPreference(theme === "dark" ? "light" : "dark");
  }, [theme, setPreference]);

  return { theme, preference: pref, toggle, setPreference };
}
