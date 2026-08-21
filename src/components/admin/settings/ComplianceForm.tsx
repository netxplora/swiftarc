import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminUpdatePlatformSettings } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Loader2, Save, ShieldCheck } from "lucide-react";

export function ComplianceForm({ initialData }: { initialData: any }) {
  const [termsUrl, setTermsUrl] = useState("");
  const [privacyUrl, setPrivacyUrl] = useState("");
  const [shippingPolicy, setShippingPolicy] = useState("");
  const [cookiePolicy, setCookiePolicy] = useState("");
  const [refundPolicy, setRefundPolicy] = useState("");
  const [otherLegal, setOtherLegal] = useState("");

  useEffect(() => {
    if (initialData) {
      setTermsUrl(initialData.termsUrl || "");
      setPrivacyUrl(initialData.privacyUrl || "");
      setShippingPolicy(initialData.shippingPolicy || "");
      setCookiePolicy(initialData.cookiePolicy || "");
      setRefundPolicy(initialData.refundPolicy || "");
      setOtherLegal(initialData.otherLegal || "");
    }
  }, [initialData]);

  const queryClient = useQueryClient();
  const updateSettings = useServerFn(adminUpdatePlatformSettings);

  const saveMut = useMutation({
    mutationFn: () =>
      updateSettings({
        data: {
          compliance_legal: { termsUrl, privacyUrl, shippingPolicy, cookiePolicy, refundPolicy, otherLegal },
        },
      }),
    onSuccess: () => {
      toast.success("Compliance settings updated successfully");
      queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update compliance settings");
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
          <ShieldCheck className="h-5 w-5 text-accent" /> Compliance & Legal
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage links to legal documents displayed across the platform.
        </p>
      </div>

      <div className="rounded-[8px] border border-border dark:border-border bg-white dark:bg-card p-6 shadow-[0_2px_4px_rgba(0,0,0,0.07)]">
        <div className="grid gap-5 max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Terms of Service URL
              </Label>
              <Input
                value={termsUrl}
                onChange={(e) => setTermsUrl(e.target.value)}
                placeholder="/terms"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Privacy Policy URL
              </Label>
              <Input
                value={privacyUrl}
                onChange={(e) => setPrivacyUrl(e.target.value)}
                placeholder="/privacy"
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Shipping Policy URL
              </Label>
              <Input
                value={shippingPolicy}
                onChange={(e) => setShippingPolicy(e.target.value)}
                placeholder="/shipping"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Cookie Policy URL
              </Label>
              <Input
                value={cookiePolicy}
                onChange={(e) => setCookiePolicy(e.target.value)}
                placeholder="/cookies"
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Refund Policy URL
              </Label>
              <Input
                value={refundPolicy}
                onChange={(e) => setRefundPolicy(e.target.value)}
                placeholder="/refunds"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Other Legal Document URL
              </Label>
              <Input
                value={otherLegal}
                onChange={(e) => setOtherLegal(e.target.value)}
                placeholder="/legal"
                className="mt-1.5"
              />
            </div>
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
          {saveMut.isPending ? "Saving…" : "Save Compliance Settings"}
        </Button>
      </div>
    </form>
  );
}
