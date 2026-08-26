import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useServerFn } from "@tanstack/react-start";
import { adminUpdatePlatformSettings } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Save, Loader2, Bell } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface NotificationsAlertsFormProps {
  initialData?: {
    systemNotifications?: boolean;
    shipmentNotifications?: boolean;
    paymentNotifications?: boolean;
    accountNotifications?: boolean;
    securityNotifications?: boolean;
    maintenanceAlerts?: boolean;
  };
}

export function NotificationsAlertsForm({ initialData }: NotificationsAlertsFormProps) {
  const [formData, setFormData] = useState({
    systemNotifications: initialData?.systemNotifications ?? true,
    shipmentNotifications: initialData?.shipmentNotifications ?? true,
    paymentNotifications: initialData?.paymentNotifications ?? true,
    accountNotifications: initialData?.accountNotifications ?? true,
    securityNotifications: initialData?.securityNotifications ?? true,
    maintenanceAlerts: initialData?.maintenanceAlerts ?? true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const updateSettings = useServerFn(adminUpdatePlatformSettings);
  const qc = useQueryClient();

  const handleToggle = (key: keyof typeof formData) => {
    setFormData((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateSettings({ data: { notifications_alerts: formData } });
      toast.success("Notification settings updated successfully");
      qc.invalidateQueries({ queryKey: ["platform-settings"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to update notification settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-secondary dark:text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-accent" />
            Notifications & Alerts
          </h2>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
            Configure system-wide notification defaults and alert behaviors.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-secondary text-white hover:bg-secondary/90"
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid gap-6">
        <div className="p-5 border border-border dark:border-border rounded-xl bg-white dark:bg-card shadow-sm space-y-6">
          <h3 className="font-semibold text-lg border-b pb-2">Global Notifications</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">System Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive critical system-level updates.
                </p>
              </div>
              <Switch
                checked={formData.systemNotifications}
                onCheckedChange={() => handleToggle("systemNotifications")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Shipment Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Status updates for active shipments.
                </p>
              </div>
              <Switch
                checked={formData.shipmentNotifications}
                onCheckedChange={() => handleToggle("shipmentNotifications")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Payment Notifications</Label>
                <p className="text-sm text-muted-foreground">Alerts for invoices and receipts.</p>
              </div>
              <Switch
                checked={formData.paymentNotifications}
                onCheckedChange={() => handleToggle("paymentNotifications")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Account Notifications</Label>
                <p className="text-sm text-muted-foreground">Updates regarding user accounts.</p>
              </div>
              <Switch
                checked={formData.accountNotifications}
                onCheckedChange={() => handleToggle("accountNotifications")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Security Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Alerts for suspicious logins or changes.
                </p>
              </div>
              <Switch
                checked={formData.securityNotifications}
                onCheckedChange={() => handleToggle("securityNotifications")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Maintenance Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Broadcast scheduled maintenance to all users.
                </p>
              </div>
              <Switch
                checked={formData.maintenanceAlerts}
                onCheckedChange={() => handleToggle("maintenanceAlerts")}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
