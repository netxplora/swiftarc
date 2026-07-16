import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { Logo } from "@/components/brand/Logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const search = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/login")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Log in — SwiftArc" },
      { name: "description", content: "Access your SwiftArc account to ship, track, and manage business shipments." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Login,
});

function Login() {
  const { redirect } = useSearch({ from: "/login" });
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    nav({ to: (redirect as "/" | undefined) ?? "/dashboard" });
  };

  const google = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });
    if (error) toast.error(error.message);
  };

  const sendReset = async () => {
    if (!resetEmail) return;
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Reset email sent");
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-24 lg:px-8">
      <div className="hidden lg:block">
        <Logo />
        <h1 className="mt-8 font-display text-5xl font-bold tracking-tight">Welcome back to the arc.</h1>
        <p className="mt-4 text-muted-foreground">Access your dashboards, shipments, and business tools.</p>
        <div className="mt-10 rounded-2xl border border-border bg-navy-deep p-8 text-cream">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber">Live from the network</p>
          <p className="mt-3 font-display text-2xl">99.4% on-time delivery this quarter.</p>
          <p className="mt-2 text-sm text-cream/70">Across 15M daily parcels and 220+ countries.</p>
        </div>
      </div>

      <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h2 className="font-display text-3xl font-bold tracking-tight">Log in</h2>
        <p className="mt-1 text-sm text-muted-foreground">Enter your email and password.</p>

        <div className="mt-5">
          <Button type="button" variant="outline" className="h-11 w-full" onClick={google}>
            Continue with Google
          </Button>
        </div>
        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or with email <span className="h-px flex-1 bg-border" />
        </div>

        <div className="grid gap-4">
          <div>
            <Label>Email</Label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 h-11" autoComplete="email" />
          </div>
          <div>
            <Label>Password</Label>
            <div className="relative mt-1.5">
              <Input 
                type={showPassword ? "text" : "password"} 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="h-11 pr-10" 
                autoComplete="current-password" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <Button disabled={busy} type="submit" className="mt-6 h-11 w-full bg-navy-deep text-cream hover:bg-navy">
          {busy ? "Signing in…" : "Log in"}
        </Button>

        <div className="mt-4 flex items-center justify-between text-sm">
          <details className="group">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Forgot password?</summary>
            <div className="mt-2 flex gap-2">
              <Input placeholder="you@company.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
              <Button type="button" variant="outline" onClick={sendReset}>Send</Button>
            </div>
          </details>
          <Link to="/register" className="font-medium text-navy-deep underline">Open account</Link>
        </div>
      </form>
    </div>
  );
}
