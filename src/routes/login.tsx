import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Package } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
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
      {
        name: "description",
        content: "Access your SwiftArc account to ship, track, and manage business shipments.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Login,
});

function Login() {
  const { redirect } = useSearch({ from: "/login" });
  const nav = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  // Automatically redirect once AuthContext recognizes the session
  useEffect(() => {
    if (user) {
      nav({ to: (redirect as "/" | undefined) ?? "/admin/shipments" });
    }
  }, [user, nav, redirect]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
  };

  const google = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) toast.error(error.message);
  };

  const apple = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo: window.location.origin },
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
    <div className="flex min-h-screen">
      {/* Left panel - Image Accent */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="/auth-accent.jpg"
          alt="Global Logistics Network"
        />
        {/* Sleek dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/90 via-navy-deep/50 to-transparent mix-blend-multiply" />
        <div className="absolute inset-0 bg-navy-deep/20 backdrop-blur-[2px]" />
        
        {/* Content over image */}
        <div className="absolute inset-0 flex flex-col justify-between p-12 lg:p-16 xl:p-24">
          <div>
            <Logo className="text-white drop-shadow-md" />
          </div>
          <div className="max-w-md text-white">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-white backdrop-blur-md">
              <Package className="h-3.5 w-3.5" />
              Enterprise Logistics
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Powering global supply chains.
            </h1>
            <p className="mt-6 text-lg text-white/80">
              Access your real-time tracking, analytics, and dispatch network from anywhere in the world.
            </p>
          </div>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:w-[32rem] xl:w-[36rem] lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-full">
          <div className="lg:hidden mb-8">
            <Logo />
          </div>
          
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to your SwiftArc account to continue.
            </p>
          </div>

          <div className="mt-8">
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" className="h-11 w-full font-normal shadow-sm hover:bg-muted/50" onClick={google}>
                <svg className="mr-2 h-4 w-4" aria-hidden="true" viewBox="0 0 24 24">
                  <path
                    d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                    fill="#EA4335"
                  />
                  <path
                    d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                    fill="#34A853"
                  />
                </svg>
                Google
              </Button>
              <Button type="button" variant="outline" className="h-11 w-full font-normal shadow-sm hover:bg-muted/50" onClick={apple}>
                <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM15.42 16.59C14.77 17.53 14.07 18.5 12.98 18.5C11.91 18.5 11.53 17.84 10.28 17.84C9.05 17.84 8.61 18.5 7.6 18.5C6.54 18.5 5.76 17.43 5.11 16.5C3.78 14.59 2.8 11.4 4.16 9.27C4.83 8.21 5.91 7.54 7.05 7.52C8.1 7.5 8.86 8.2 9.48 8.2C10.11 8.2 11.05 7.42 12.3 7.46C12.83 7.48 14.34 7.68 15.34 9.15C15.26 9.2 13.54 10.21 13.56 12.2C13.58 14.55 15.65 15.4 15.7 15.42C15.66 15.54 15.31 16.74 15.42 16.59ZM12.28 6.13C12.83 5.47 13.21 4.54 13.11 3.6C12.3 3.63 11.31 4.14 10.74 4.82C10.24 5.41 9.79 6.36 9.91 7.28C10.8 7.35 11.72 6.79 12.28 6.13Z" />
                </svg>
                Apple
              </Button>
            </div>

            <div className="relative mt-8 mb-6">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm font-medium leading-6">
                <span className="bg-background px-4 text-muted-foreground uppercase tracking-wider text-[11px]">
                  Or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={submit} className="space-y-5">
              <div>
                <Label htmlFor="email" className="text-muted-foreground font-medium">Email address</Label>
                <div className="mt-1.5">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 shadow-sm transition-all focus-visible:ring-amber focus-visible:border-amber"
                    autoComplete="email"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="text-muted-foreground font-medium">Password</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pr-10 shadow-sm transition-all focus-visible:ring-amber focus-visible:border-amber"
                    autoComplete="current-password"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <details className="group relative">
                  <summary className="text-sm font-medium text-primary hover:underline cursor-pointer list-none transition-colors">
                    Forgot your password?
                  </summary>
                  <div className="absolute right-0 top-full mt-2 w-72 rounded-lg border border-border bg-card p-4 shadow-xl z-50">
                    <p className="mb-3 text-xs text-muted-foreground">Enter your email to reset password.</p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="you@company.com"
                        value={resetEmail}
                        className="h-9 text-sm"
                        onChange={(e) => setResetEmail(e.target.value)}
                      />
                      <Button type="button" size="sm" onClick={sendReset}>
                        Send
                      </Button>
                    </div>
                  </div>
                </details>
              </div>

              <div>
                <Button
                  disabled={busy}
                  type="submit"
                  className="w-full h-11 bg-primary text-white shadow-md hover:bg-primary-hover hover:shadow-lg transition-all font-semibold text-base"
                >
                  {busy ? "Signing in…" : "Sign in"}
                </Button>
              </div>
            </form>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Not a member?{" "}
              <Link to="/register" className="font-medium text-primary hover:underline transition-all">
                Open a business account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
