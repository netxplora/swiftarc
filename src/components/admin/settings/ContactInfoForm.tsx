import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminUpdatePlatformSettings } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Loader2, Save, Building } from "lucide-react";

export function ContactInfoForm({ initialData }: { initialData: any }) {
  const [platformName, setPlatformName] = useState("");
  const [website, setWebsite] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [socialTwitter, setSocialTwitter] = useState("");
  const [socialLinkedin, setSocialLinkedin] = useState("");
  const [socialFacebook, setSocialFacebook] = useState("");

  useEffect(() => {
    if (initialData) {
      setPlatformName(initialData.platformName || "");
      setWebsite(initialData.website || "");
      setSupportEmail(initialData.supportEmail || "");
      setPhone(initialData.phone || "");
      setAddress(initialData.address || "");
      setWorkingHours(initialData.workingHours || "");
      setSocialTwitter(initialData?.socialLinks?.twitter || "");
      setSocialLinkedin(initialData?.socialLinks?.linkedin || "");
      setSocialFacebook(initialData?.socialLinks?.facebook || "");
    }
  }, [initialData]);

  const queryClient = useQueryClient();
  const updateSettings = useServerFn(adminUpdatePlatformSettings);

  const saveMut = useMutation({
    mutationFn: () =>
      updateSettings({
        data: {
          contact_info: {
            platformName,
            website,
            supportEmail,
            phone,
            address,
            workingHours,
            socialLinks: {
              twitter: socialTwitter,
              linkedin: socialLinkedin,
              facebook: socialFacebook,
            },
          },
        },
      }),
    onSuccess: () => {
      toast.success("Contact info updated successfully");
      queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update contact info");
    },
  });

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        saveMut.mutate();
      }}
    >
      <div>
        <h2 className="font-display text-lg font-bold flex items-center gap-2">
          <Building className="h-5 w-5 text-accent" /> Platform Identity & Contact Info
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage the public platform name and support contact details.
        </p>
      </div>

      <div className="rounded-[8px] border border-border dark:border-border bg-white dark:bg-card p-6 shadow-[0_2px_4px_rgba(0,0,0,0.07)]">
        <div className="grid gap-5 max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Platform Name
              </Label>
              <Input
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                placeholder="e.g. SwiftArc"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Primary Website URL
              </Label>
              <Input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Support Email
              </Label>
              <Input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="support@example.com"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Phone Number
              </Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Working Hours
            </Label>
            <Input
              value={workingHours}
              onChange={(e) => setWorkingHours(e.target.value)}
              placeholder="e.g. Mon-Fri 9:00 AM - 6:00 PM EST"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Business Address
            </Label>
            <Textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Logistics Way..."
              className="mt-1.5 min-h-[80px]"
            />
          </div>
        </div>
      </div>

      <div className="rounded-[8px] border border-border dark:border-border bg-white dark:bg-card p-6 shadow-[0_2px_4px_rgba(0,0,0,0.07)]">
        <h3 className="font-semibold text-base border-b pb-3 mb-5">Social Media Links</h3>
        <div className="grid gap-5 max-w-2xl">
          <div>
            <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              X (Twitter) URL
            </Label>
            <Input
              value={socialTwitter}
              onChange={(e) => setSocialTwitter(e.target.value)}
              placeholder="https://x.com/..."
              className="mt-1.5"
            />
          </div>
          <div>
            <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              LinkedIn URL
            </Label>
            <Input
              value={socialLinkedin}
              onChange={(e) => setSocialLinkedin(e.target.value)}
              placeholder="https://linkedin.com/company/..."
              className="mt-1.5"
            />
          </div>
          <div>
            <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Facebook URL
            </Label>
            <Input
              value={socialFacebook}
              onChange={(e) => setSocialFacebook(e.target.value)}
              placeholder="https://facebook.com/..."
              className="mt-1.5"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
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
          {saveMut.isPending ? "Saving…" : "Save Contact Info"}
        </Button>
      </div>
    </form>
  );
}
