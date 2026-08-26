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
import { usePlatformSettings, usePlatformFees } from "@/hooks/usePlatformSettings";
import { VisualAssetsForm } from "@/components/admin/settings/VisualAssetsForm";
import { DesignSystemForm } from "@/components/admin/settings/DesignSystemForm";
import { ContactInfoForm } from "@/components/admin/settings/ContactInfoForm";
import { ComplianceForm } from "@/components/admin/settings/ComplianceForm";
import { SEOForm } from "@/components/admin/settings/SEOForm";
import { FeesForm } from "@/components/admin/settings/FeesForm";
import { AuditLogs } from "@/components/admin/settings/AuditLogs";
import { NotificationsAlertsForm } from "@/components/admin/settings/NotificationsAlertsForm";
import { Palette, BookOpen, ShieldCheck, Search, DollarSign, History } from "lucide-react";

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

  const { data: platformSettings, isLoading: loadingPlatform } = usePlatformSettings();
  const { data: platformFees, isLoading: loadingFees } = usePlatformFees();

  const [activeTab, setActiveTab] = useState("system");

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

  if (isLoading || loadingPlatform || loadingFees) {
    return (
      <div className="space-y-6 max-w-5xl">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-6">
          <Skeleton className="h-96 w-48 shrink-0 rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const TABS = [
    { id: "system", label: "System Config", icon: Server },
    { id: "visual", label: "Visual Assets", icon: Palette },
    { id: "design", label: "Design System", icon: Palette },
    { id: "contact", label: "Contact Info", icon: BookOpen },
    { id: "compliance", label: "Compliance & Legal", icon: ShieldCheck },
    { id: "seo", label: "Global SEO", icon: Search },
    { id: "notifications", label: "Notifications & Alerts", icon: Bell },
    { id: "fees", label: "Platform Fees", icon: DollarSign },
    { id: "audit", label: "Audit Logs", icon: History },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Platform Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure platform parameters, brand identity, compliance, and fees. All changes are
          persisted to the database.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Nav */}
        <div className="w-full md:w-56 shrink-0">
          <nav className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-accent text-white shadow-sm"
                      : "text-muted-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-secondary hover:text-secondary dark:hover:text-foreground"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {activeTab === "system" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveMut.mutate();
              }}
              className="space-y-8"
            >
              {/* Security & Access */}
              <div className="rounded-[8px] border border-border dark:border-border bg-white dark:bg-card p-6 shadow-[0_2px_4px_rgba(0,0,0,0.07)]">
                <h2 className="font-display text-lg font-bold flex items-center gap-2 border-b border-border dark:border-border pb-4">
                  <Lock className="h-5 w-5 text-primary" /> Security & Access Control
                </h2>
                <div className="grid gap-5 sm:grid-cols-2 mt-5">
                  <div>
                    <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
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
                    <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
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
                    <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Enforce Two-Factor Authentication
                    </Label>
                    <button
                      type="button"
                      onClick={() => setEnforce2FA(!enforce2FA)}
                      className={`mt-1.5 flex items-center gap-2 rounded-[4px] border px-4 py-2.5 text-sm font-medium transition-colors w-full ${enforce2FA ? "border-success bg-success/10 text-success" : "border-border bg-secondary/50 text-muted-foreground"}`}
                    >
                      <ToggleLeft className="h-4 w-4" />
                      {enforce2FA
                        ? "Enabled — Required for all admin accounts"
                        : "Disabled — Optional for users"}
                    </button>
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      IP Allowlist (comma separated)
                    </Label>
                    <Input
                      value={ipAllowlist}
                      onChange={(e) => setIpAllowlist(e.target.value)}
                      placeholder="e.g. 192.168.1.0/24, 10.0.0.1"
                      className="mt-1.5"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Leave empty to allow all IPs
                    </p>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="rounded-[8px] border border-border dark:border-border bg-white dark:bg-card p-6 shadow-[0_2px_4px_rgba(0,0,0,0.07)]">
                <h2 className="font-display text-lg font-bold flex items-center gap-2 border-b border-border dark:border-border pb-4">
                  <Bell className="h-5 w-5 text-primary" /> Notifications & Webhooks
                </h2>
                <div className="grid gap-5 sm:grid-cols-2 mt-5">
                  <div>
                    <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
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
                    <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
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
                    <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
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
              <div className="rounded-[8px] border border-border dark:border-border bg-white dark:bg-card p-6 shadow-[0_2px_4px_rgba(0,0,0,0.07)]">
                <h2 className="font-display text-lg font-bold flex items-center gap-2 border-b border-border dark:border-border pb-4">
                  <Globe className="h-5 w-5 text-primary" /> Platform Configuration
                </h2>
                <div className="grid gap-5 sm:grid-cols-3 mt-5">
                  <div>
                    <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Maintenance Mode
                    </Label>
                    <button
                      type="button"
                      onClick={() => setMaintenanceMode(!maintenanceMode)}
                      className={`mt-1.5 flex items-center gap-2 rounded-[4px] border px-4 py-2.5 text-sm font-medium transition-colors w-full ${maintenanceMode ? "border-error bg-error/10 text-error" : "border-border bg-secondary/50 text-muted-foreground"}`}
                    >
                      <Server className="h-4 w-4" />
                      {maintenanceMode ? "Active — Site offline" : "Inactive — Site live"}
                    </button>
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Default Currency
                    </Label>
                    <select
                      value={defaultCurrency}
                      onChange={(e) => setDefaultCurrency(e.target.value)}
                      className="mt-1.5 w-full rounded-[4px] border border-border dark:border-input bg-background px-3 py-2.5 text-sm"
                    >
                      <option value="USD">USD — US Dollar</option>
                      <option value="EUR">EUR — Euro</option>
                      <option value="GBP">GBP — British Pound</option>
                      <option value="NGN">NGN — Nigerian Naira</option>
                      <option value="CAD">CAD — Canadian Dollar</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      System Timezone
                    </Label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="mt-1.5 w-full rounded-[4px] border border-border dark:border-input bg-background px-3 py-2.5 text-sm"
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
              <div className="rounded-[8px] border border-border dark:border-border bg-white dark:bg-card p-6 shadow-[0_2px_4px_rgba(0,0,0,0.07)]">
                <h2 className="font-display text-lg font-bold flex items-center gap-2 border-b border-border dark:border-border pb-4">
                  <Key className="h-5 w-5 text-primary" /> Integration Status
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
                      className="rounded-[4px] border border-border dark:border-border p-4 flex items-center gap-3"
                    >
                      <div
                        className={`h-10 w-10 rounded-[4px] grid place-items-center ${int.ok ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground"}`}
                      >
                        <int.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{int.name}</p>
                        <p
                          className={`text-xs ${int.ok ? "text-success" : "text-muted-foreground"}`}
                        >
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
                  className="bg-secondary text-white hover:bg-secondary/90 font-medium h-10 px-6 rounded-[4px]"
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
          )}

          {activeTab === "visual" && (
            <VisualAssetsForm initialData={platformSettings?.visual_assets} />
          )}
          {activeTab === "design" && (
            <DesignSystemForm initialData={platformSettings?.design_system} />
          )}
          {activeTab === "contact" && (
            <ContactInfoForm initialData={platformSettings?.contact_info} />
          )}
          {activeTab === "compliance" && (
            <ComplianceForm initialData={platformSettings?.compliance_legal} />
          )}
          {activeTab === "seo" && <SEOForm initialData={platformSettings?.global_seo} />}
          {activeTab === "notifications" && (
            <NotificationsAlertsForm initialData={platformSettings?.notifications_alerts} />
          )}
          {activeTab === "fees" && <FeesForm initialData={platformFees || []} />}
          {activeTab === "audit" && <AuditLogs />}
        </div>
      </div>
    </div>
  );
}
