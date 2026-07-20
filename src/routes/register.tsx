import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Open an Account — SwiftArc" },
      { name: "description", content: "Create a SwiftArc account to book, track, and manage shipments across our global network." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Register,
});

const perks = [
  "Volume-based pricing", "Bulk labels & manifests", "Returns portal",
  "API & webhook access", "24/7 support", "AI ETAs on every shipment",
];

function scorePassword(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^\w\s]/.test(p)) s++;
  return Math.min(4, s);
}
const strengthLabels = ["Too weak", "Weak", "Fair", "Strong", "Excellent"];
const strengthColors = ["bg-destructive", "bg-destructive", "bg-amber", "bg-success", "bg-success"];

function Register() {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"create" | "join">("create");
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const score = useMemo(() => scorePassword(pw), [pw]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (score < 2) return toast.error("Please choose a stronger password");
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email, password: pw,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { display_name: `${first} ${last}`.trim(), company },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    
    if (!data.session) {
      toast.success("Account created! Please check your email to verify your account.");
    } else {
      toast.success("Account created");
      nav({ to: "/dashboard" });
    }
  };

  const google = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-24 lg:px-8">
      <div className="rounded-3xl bg-navy-deep p-8 text-cream sm:p-10">
        <Logo tone="light" />
        <h1 className="mt-8 font-display text-5xl font-bold tracking-tight">Ship smarter, from day one.</h1>
        <p className="mt-4 text-cream/70">Business account with everything you need to run global logistics.</p>
        <ul className="mt-8 space-y-3">
          {perks.map((p) => (
            <li key={p} className="flex items-center gap-3 text-cream/90">
              <CheckCircle2 className="h-5 w-5 text-amber" /> {p}
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h2 className="font-display text-3xl font-bold tracking-tight">Open an account</h2>
        <p className="mt-1 text-sm text-muted-foreground">Ready in under 60 seconds.</p>

        <div className="mt-5">
          <Button type="button" variant="outline" className="h-11 w-full" onClick={google}>
            Continue with Google
          </Button>
        </div>
        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or with email <span className="h-px flex-1 bg-border" />
        </div>

        <div className="flex gap-2 mb-6 p-1 bg-secondary/50 rounded-lg">
          <button type="button" onClick={() => setMode("create")} className={cn("flex-1 text-sm font-medium py-2 px-3 rounded-md transition-all", mode === "create" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}>Create Workspace</button>
          <button type="button" onClick={() => setMode("join")} className={cn("flex-1 text-sm font-medium py-2 px-3 rounded-md transition-all", mode === "join" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}>Join Team</button>
        </div>

        {mode === "join" && (
          <div className="mb-6 space-y-4 rounded-xl border border-amber/20 bg-amber/5 p-4">
            <h3 className="font-semibold text-amber-deep">Got an invite?</h3>
            <p className="text-sm text-amber-deep/80">Enter your company's secure invite code to automatically link your account to their workspace.</p>
            <div className="space-y-2">
              <Label>Invite Code</Label>
              <Input placeholder="e.g. SWIFT-8X92-AL" className="font-mono uppercase bg-background" />
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="first">First name</Label>
            <Input id="first" required value={first} onChange={e=>setFirst(e.target.value)} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last">Last name</Label>
            <Input id="last" required value={last} onChange={e=>setLast(e.target.value)} className="h-11" />
          </div>
        </div>
        
        {mode === "create" && (
          <div className="mt-4 space-y-2">
            <Label htmlFor="company">Company / Workspace Name</Label>
            <Input id="company" placeholder="Acme Logistics Corp" required value={company} onChange={e=>setCompany(e.target.value)} className="h-11" />
          </div>
        )}

        <div className="mt-4 space-y-2">
          <Label htmlFor="email">Work Email</Label>
          <Input id="email" type="email" placeholder="you@company.com" required value={email} onChange={e=>setEmail(e.target.value)} className="h-11" />
        </div>

        <div className="mt-4 space-y-2">
          <Label>Password</Label>
          <div className="relative">
            <Input 
              type={showPassword ? "text" : "password"} 
              required 
              value={pw} 
              onChange={(e) => setPw(e.target.value)} 
              className="h-11 pr-10" 
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
          {pw && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className={`h-1.5 flex-1 rounded-full ${i < score ? strengthColors[score] : "bg-secondary"}`} />
                ))}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Password strength: <span className="font-medium text-foreground">{strengthLabels[score]}</span>
              </p>
            </div>
          )}
        </div>

        <Button disabled={busy || score < 2} type="submit" className="mt-6 h-11 w-full bg-amber text-navy-deep hover:bg-amber-soft disabled:opacity-60">
          {busy ? "Creating account…" : "Open account"}
        </Button>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/login" className="font-medium text-navy-deep underline">Log in</Link>
        </p>
      </form>
    </div>
  );
}
