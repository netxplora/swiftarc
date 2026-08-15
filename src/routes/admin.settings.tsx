/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import {
  Shield,
  Bell,
  Lock,
  Save,
  Globe,
  Mail,
  Key,
  ToggleLeft,
  Server,
  CreditCard,
  Clock,
  Wifi,
  Database,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminGetSettings, adminUpdateSettings } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "System Settings — Admin SwiftArc" }] }),
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const qc = useQueryClient();
  const getSettings = useServerFn(adminGetSettings);
  const updateSettings = useServerFn(adminUpdateSettings);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => getSettings(),
  });

  const [rateLimit, setRateLimit] = useState("120");
  const [sessionTimeout, setSessionTimeout] = useState("60");
  const [enforce2FA, setEnforce2FA] = useState(false);
  const [ipAllowlist, setIpAllowlist] = useState("");
  const [emailSender, setEmailSender] = useState("noreply@swiftarc.com");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [alertThreshold, setAlertThreshold] = useState("95");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [timezone, setTimezone] = useState("UTC");

  // Sync form state when data loads
  useEffect(() => {
    if (!settings) return;
    setRateLimit(settings.rate_limit || "120");
    setSessionTimeout(settings.session_timeout || "60");
    setEnforce2FA(settings.enforce_2fa === "true");
    setIpAllowlist(settings.ip_allowlist || "");
    setEmailSender(settings.email_sender || "noreply@swiftarc.com");
    setWebhookUrl(settings.webhook_url || "");
    setAlertThreshold(settings.alert_threshold || "95");
    setMaintenanceMode(settings.maintenance_mode === "true");
    setDefaultCurrency(settings.default_currency || "USD");
    setTimezone(settings.timezone || "UTC");
  }, [settings]);

  const saveMut = useMutation({
    mutationFn: () =>
      updateSettings({
        data: {
          rate_limit: rateLimit,
          session_timeout: sessionTimeout,
          enforce_2fa: String(enforce2FA),
          ip_allowlist: ipAllowlist,
          email_sender: emailSender,
          webhook_url: webhookUrl,
          alert_threshold: alertThreshold,
          maintenance_mode: String(maintenanceMode),
          default_currency: defaultCurrency,
          timezone: timezone,
        },
      }),
    onSuccess: () => {
      toast.success("System configurations saved to database.");
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
    },
    onError: () => toast.error("Failed to save settings."),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-52 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure platform parameters, security policies, integrations, and notifications. All
          changes are persisted to the database.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveMut.mutate();
        }}
        className="space-y-8"
      >
        {/* Security & Access */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold flex items-center gap-2 border-b border-border pb-4">
            <Lock className="h-5 w-5 text-amber" /> Security & Access Control
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 mt-5">
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Max API Calls / Minute
              </Label>
              <Input
                value={rateLimit}
                onChange={(e) => setRateLimit(e.target.value)}
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Rate limit per authenticated client
              </p>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Session Expiry (Minutes)
              </Label>
              <Input
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Idle session timeout before forced re-authentication
              </p>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Enforce Two-Factor Authentication
              </Label>
              <button
                type="button"
                onClick={() => setEnforce2FA(!enforce2FA)}
                className={`mt-1.5 flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${enforce2FA ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-border bg-secondary/50 text-muted-foreground"}`}
              >
                <ToggleLeft className="h-4 w-4" />
                {enforce2FA
                  ? "Enabled — Required for all admin accounts"
                  : "Disabled — Optional for users"}
              </button>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                IP Allowlist (comma separated)
              </Label>
              <Input
                value={ipAllowlist}
                onChange={(e) => setIpAllowlist(e.target.value)}
                placeholder="e.g. 192.168.1.0/24, 10.0.0.1"
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-muted-foreground">Leave empty to allow all IPs</p>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold flex items-center gap-2 border-b border-border pb-4">
            <Bell className="h-5 w-5 text-amber" /> Notifications & Webhooks
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 mt-5">
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                System Email Sender
              </Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={emailSender}
                  onChange={(e) => setEmailSender(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Webhook Endpoint URL
              </Label>
              <div className="relative mt-1.5">
                <Wifi className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://hooks.example.com/events"
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                SLA Alert Threshold (%)
              </Label>
              <Input
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(e.target.value)}
                className="mt-1.5"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Trigger alert when SLA drops below this value
              </p>
            </div>
          </div>
        </div>

        {/* Platform Config */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold flex items-center gap-2 border-b border-border pb-4">
            <Globe className="h-5 w-5 text-amber" /> Platform Configuration
          </h2>
          <div className="grid gap-5 sm:grid-cols-3 mt-5">
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Maintenance Mode
              </Label>
              <button
                type="button"
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`mt-1.5 flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors w-full ${maintenanceMode ? "border-red-500 bg-red-50 text-red-700" : "border-border bg-secondary/50 text-muted-foreground"}`}
              >
                <Server className="h-4 w-4" />
                {maintenanceMode ? "Active — Site is offline for users" : "Inactive — Site is live"}
              </button>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                Default Currency
              </Label>
              <select
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm"
              >
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="NGN">NGN — Nigerian Naira</option>
                <option value="CAD">CAD — Canadian Dollar</option>
              </select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                System Timezone
              </Label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">US Eastern (ET)</option>
                <option value="America/Chicago">US Central (CT)</option>
                <option value="America/Los_Angeles">US Pacific (PT)</option>
                <option value="Europe/London">UK (GMT/BST)</option>
                <option value="Africa/Lagos">West Africa (WAT)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Integrations Status */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-display text-lg font-bold flex items-center gap-2 border-b border-border pb-4">
            <Key className="h-5 w-5 text-amber" /> Integration Status
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-5">
            {[
              { name: "Stripe Payments", icon: CreditCard, status: "Connected", ok: true },
              { name: "Supabase Auth", icon: Database, status: "Active", ok: true },
              {
                name: "Email Provider",
                icon: Mail,
                status: emailSender ? "Configured" : "Not Set",
                ok: !!emailSender,
              },
              {
                name: "Webhook Relay",
                icon: Wifi,
                status: webhookUrl ? "Connected" : "Not Configured",
                ok: !!webhookUrl,
              },
            ].map((int) => (
              <div
                key={int.name}
                className="rounded-xl border border-border p-4 flex items-center gap-3"
              >
                <div
                  className={`h-10 w-10 rounded-lg grid place-items-center ${int.ok ? "bg-emerald-50 text-emerald-600" : "bg-secondary text-muted-foreground"}`}
                >
                  <int.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">{int.name}</p>
                  <p className={`text-xs ${int.ok ? "text-emerald-600" : "text-muted-foreground"}`}>
                    {int.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={saveMut.isPending}
            className="bg-navy-deep text-cream hover:bg-navy font-medium"
          >
            {saveMut.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saveMut.isPending ? "Saving…" : "Save All Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
