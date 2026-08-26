import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminUpdatePlatformSettings } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Loader2, Save, Image as ImageIcon } from "lucide-react";

export function VisualAssetsForm({ initialData }: { initialData: any }) {
  const [primaryLogo, setPrimaryLogo] = useState("");
  const [logoLight, setLogoLight] = useState("");
  const [logoDark, setLogoDark] = useState("");
  const [favicon, setFavicon] = useState("");
  const [appIcon, setAppIcon] = useState("");
  const [socialImage, setSocialImage] = useState("");
  const [emailLogo, setEmailLogo] = useState("");
  const [documentLogo, setDocumentLogo] = useState("");

  useEffect(() => {
    if (initialData) {
      setPrimaryLogo(initialData.primaryLogo || "");
      setLogoLight(initialData.logoLight || "");
      setLogoDark(initialData.logoDark || "");
      setFavicon(initialData.favicon || "");
      setAppIcon(initialData.appIcon || "");
      setSocialImage(initialData.socialImage || "");
      setEmailLogo(initialData.emailLogo || "");
      setDocumentLogo(initialData.documentLogo || "");
    }
  }, [initialData]);

  const queryClient = useQueryClient();
  const updateSettings = useServerFn(adminUpdatePlatformSettings);

  const saveMut = useMutation({
    mutationFn: () =>
      updateSettings({
        data: {
          visual_assets: {
            primaryLogo,
            logoLight,
            logoDark,
            favicon,
            appIcon,
            socialImage,
            emailLogo,
            documentLogo,
          },
        },
      }),
    onSuccess: () => {
      toast.success("Visual assets updated successfully");
      queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update visual assets");
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
          <ImageIcon className="h-5 w-5 text-accent" /> Visual Assets
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage platform logos and imagery. SVG format is recommended for logos.
        </p>
      </div>

      <div className="rounded-[8px] border border-border dark:border-border bg-white dark:bg-card p-6 shadow-[0_2px_4px_rgba(0,0,0,0.07)]">
        <div className="grid gap-5 max-w-2xl">
          <div>
            <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Primary Logo URL (Default)
            </Label>
            <Input
              value={primaryLogo}
              onChange={(e) => setPrimaryLogo(e.target.value)}
              placeholder="https://..."
              className="mt-1.5"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Light Mode Logo URL
              </Label>
              <Input
                value={logoLight}
                onChange={(e) => setLogoLight(e.target.value)}
                placeholder="https://..."
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Dark Mode Logo URL
              </Label>
              <Input
                value={logoDark}
                onChange={(e) => setLogoDark(e.target.value)}
                placeholder="https://..."
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Favicon URL (.ico or .png)
              </Label>
              <Input
                value={favicon}
                onChange={(e) => setFavicon(e.target.value)}
                placeholder="https://..."
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                App Icon (PWA / Mobile)
              </Label>
              <Input
                value={appIcon}
                onChange={(e) => setAppIcon(e.target.value)}
                placeholder="https://..."
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Social Sharing Image (OG:Image)
            </Label>
            <Input
              value={socialImage}
              onChange={(e) => setSocialImage(e.target.value)}
              placeholder="https://..."
              className="mt-1.5"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Email Template Logo URL
              </Label>
              <Input
                value={emailLogo}
                onChange={(e) => setEmailLogo(e.target.value)}
                placeholder="https://..."
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Documents/Invoices Logo URL
              </Label>
              <Input
                value={documentLogo}
                onChange={(e) => setDocumentLogo(e.target.value)}
                placeholder="https://..."
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
          {saveMut.isPending ? "Saving…" : "Save Assets"}
        </Button>
      </div>
    </form>
  );
}
