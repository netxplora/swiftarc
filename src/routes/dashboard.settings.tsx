import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { getMyProfile, updateProfile } from "@/lib/api.functions";
import { supabase } from "@/integrations/supabase/client";
import { Sun, Moon, Monitor, Shield, Lock, Mail, AlertTriangle, Loader2, Check, User } from "lucide-react";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({ meta: [{ title: "Settings — SwiftArc" }, { name: "robots", content: "noindex" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getMyProfile);
  const saveProfile = useServerFn(updateProfile);
  const { preference, setPreference } = useTheme();
  const { user } = useAuth();

  const profile = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });
  const [name, setName] = useState(profile.data?.display_name ?? "");

  // Password change state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  // Email change state
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // Populate defaults once profile loads
  useEffect(() => {
    if (profile.data) {
      setName(profile.data.display_name || "");
      setCompany(profile.data.company || "");
    }
  }, [profile.data]);

  const save = useMutation({
    mutationFn: (data: { display_name?: string; company?: string }) => saveProfile({ data }),
    onSuccess: () => { toast.success("Profile updated"); qc.invalidateQueries({ queryKey: ["profile"] }); },
    onError: () => toast.error("Could not update profile"),
  });

  const handlePasswordChange = async () => {
    if (newPw !== confirmPw) { toast.error("Passwords do not match"); return; }
    if (newPw.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setPwLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) throw error;
      toast.success("Password updated successfully");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update password");
    } finally {
      setPwLoading(false);
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail.includes("@")) { toast.error("Please enter a valid email"); return; }
    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast.success("Confirmation email sent to your new address");
      setNewEmail("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update email");
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your profile, security, and account preferences.</p>
      </div>

      {/* Profile */}
      <Card>
        <CardContent className="space-y-5 p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-navy-deep text-cream font-semibold text-sm">
              {(name || user?.email || "U").slice(0, 1).toUpperCase()}
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold">Profile</h2>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="display-name">Display name</Label>
              <Input
                id="display-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
          </div>
          <Button
            onClick={() => save.mutate({ display_name: name })}
            disabled={save.isPending}
            className="bg-navy-deep text-cream hover:bg-navy"
          >
            {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            Save changes
          </Button>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <Sun className="h-4 w-4" /> Appearance
          </h2>
          <p className="text-sm text-muted-foreground">Your theme preference syncs across devices.</p>
          <div className="grid grid-cols-3 gap-3 max-w-md">
            {([
              { v: "light", label: "Light", Icon: Sun },
              { v: "dark", label: "Dark", Icon: Moon },
              { v: "system", label: "System", Icon: Monitor },
            ] as const).map(({ v, label, Icon }) => (
              <button
                key={v}
                onClick={() => setPreference(v)}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                  preference === v ? "border-amber bg-amber/5" : "border-border hover:border-amber/50"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security — Password */}
      <Card>
        <CardContent className="space-y-5 p-6">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <Lock className="h-4 w-4" /> Password
          </h2>
          <p className="text-sm text-muted-foreground">Update your account password. You will remain signed in on this device.</p>
          <div className="grid gap-4 sm:grid-cols-2 max-w-lg">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="new-pw">New password</Label>
              <Input
                id="new-pw"
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="Minimum 8 characters"
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="confirm-pw">Confirm new password</Label>
              <Input
                id="confirm-pw"
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Re-enter new password"
              />
            </div>
          </div>
          <Button
            onClick={handlePasswordChange}
            disabled={pwLoading || !newPw || !confirmPw}
            variant="outline"
          >
            {pwLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
            Update password
          </Button>
        </CardContent>
      </Card>

      {/* Security — Email */}
      <Card>
        <CardContent className="space-y-5 p-6">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <Mail className="h-4 w-4" /> Email address
          </h2>
          <p className="text-sm text-muted-foreground">
            Currently signed in as <span className="font-mono text-xs bg-secondary px-1.5 py-0.5 rounded">{user?.email}</span>. 
            Changing your email requires confirmation at the new address.
          </p>
          <div className="grid gap-2 max-w-md">
            <Label htmlFor="new-email">New email address</Label>
            <Input
              id="new-email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="new-email@example.com"
            />
          </div>
          <Button
            onClick={handleEmailChange}
            disabled={emailLoading || !newEmail}
            variant="outline"
          >
            {emailLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
            Send confirmation
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardContent className="space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-4 w-4" /> Danger zone
          </h2>
          <p className="text-sm text-muted-foreground">
            Once your account is deleted, all of your data will be permanently removed and cannot be recovered. 
            Please be certain before proceeding.
          </p>
          <Button
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
            onClick={() => {
              toast.error("Please contact support@swiftarc.app to request account deletion.");
            }}
          >
            <AlertTriangle className="mr-2 h-4 w-4" /> Request account deletion
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
