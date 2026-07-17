import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — SwiftArc" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    // First check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session) setSessionChecked(true);
    });

    // Listen for the hash fragment parsing event
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "SIGNED_IN" || event === "PASSWORD_RECOVERY") {
        setSessionChecked(true);
      }
    });

    // Fallback timeout in case no session is ever found
    const timer = setTimeout(() => {
      if (mounted && !sessionChecked) {
        setSessionChecked(true);
        toast.error("Invalid or expired password reset link.");
        nav({ to: "/login" });
      }
    }, 2500);

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [nav, sessionChecked]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Choose at least 8 characters");
    if (password !== confirmPassword) return toast.error("Passwords do not match");
    
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password successfully updated. You can now log in.");
      nav({ to: "/login" });
    }
  };

  if (!sessionChecked) return null;

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4">
      <form onSubmit={submit} className="w-full rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h1 className="font-display text-3xl font-bold tracking-tight">Set a new password</h1>
        <p className="mt-1 text-sm text-muted-foreground">Use 8+ characters with a mix of cases and numbers.</p>
        
        <div className="mt-6 grid gap-4">
          <div>
            <Label>New password</Label>
            <div className="relative mt-1.5">
              <Input 
                type={showPassword ? "text" : "password"} 
                required 
                minLength={8} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
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
          </div>
          <div>
            <Label>Confirm password</Label>
            <div className="relative mt-1.5">
              <Input 
                type={showPassword ? "text" : "password"} 
                required 
                minLength={8} 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
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
          </div>
        </div>

        <Button disabled={busy} type="submit" className="mt-6 h-11 w-full bg-navy-deep text-cream hover:bg-navy">
          {busy ? "Saving…" : "Update password"}
        </Button>
      </form>
    </div>
  );
}
