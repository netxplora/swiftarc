import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminUpdatePlatformSettings } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Loader2, Save, Search } from "lucide-react";

export function SEOForm({ initialData }: { initialData: any }) {
  const [defaultTitle, setDefaultTitle] = useState("");
  const [defaultDescription, setDefaultDescription] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [robotsConfig, setRobotsConfig] = useState("");
  const [sitemapConfig, setSitemapConfig] = useState("");

  useEffect(() => {
    if (initialData) {
      setDefaultTitle(initialData.defaultTitle || "");
      setDefaultDescription(initialData.defaultDescription || "");
      setCanonicalUrl(initialData.canonicalUrl || "");
      setOgTitle(initialData.ogTitle || "");
      setOgDescription(initialData.ogDescription || "");
      setOgImage(initialData.ogImage || "");
      setRobotsConfig(initialData.robotsConfig || "");
      setSitemapConfig(initialData.sitemapConfig || "");
    }
  }, [initialData]);

  const queryClient = useQueryClient();
  const updateSettings = useServerFn(adminUpdatePlatformSettings);

  const saveMut = useMutation({
    mutationFn: () =>
      updateSettings({
        data: {
          global_seo: { defaultTitle, defaultDescription, canonicalUrl, ogTitle, ogDescription, ogImage, robotsConfig, sitemapConfig },
        },
      }),
    onSuccess: () => {
      toast.success("SEO settings updated successfully");
      queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update SEO settings");
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
          <Search className="h-5 w-5 text-accent" /> Global SEO
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure default meta tags used across all platform pages.
        </p>
      </div>

      <div className="rounded-[8px] border border-border dark:border-border bg-white dark:bg-card p-6 shadow-[0_2px_4px_rgba(0,0,0,0.07)]">
        <div className="grid gap-5 max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Default Page Title
              </Label>
              <Input
                value={defaultTitle}
                onChange={(e) => setDefaultTitle(e.target.value)}
                placeholder="SwiftArc — Logistics Platform"
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Used as the &lt;title&gt; tag fallback when pages don&apos;t set their own.
              </p>
            </div>

            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Canonical Base URL
              </Label>
              <Input
                value={canonicalUrl}
                onChange={(e) => setCanonicalUrl(e.target.value)}
                placeholder="https://swiftarc.com"
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Default Meta Description
            </Label>
            <Textarea
              value={defaultDescription}
              onChange={(e) => setDefaultDescription(e.target.value)}
              placeholder="A reliable logistics platform for shipment management and tracking."
              className="mt-1.5 min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Used as the &lt;meta name=&quot;description&quot;&gt; fallback. Keep between 50–160 characters for best results.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[8px] border border-border dark:border-border bg-white dark:bg-card p-6 shadow-[0_2px_4px_rgba(0,0,0,0.07)]">
        <h3 className="font-semibold text-base border-b pb-3 mb-5">Open Graph (Social Sharing)</h3>
        <div className="grid gap-5 max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">OG:Title Fallback</Label>
              <Input value={ogTitle} onChange={(e) => setOgTitle(e.target.value)} placeholder="SwiftArc" className="mt-1.5" />
            </div>
            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">OG:Image URL</Label>
              <Input value={ogImage} onChange={(e) => setOgImage(e.target.value)} placeholder="https://..." className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">OG:Description</Label>
            <Textarea value={ogDescription} onChange={(e) => setOgDescription(e.target.value)} className="mt-1.5 min-h-[80px]" />
          </div>
        </div>
      </div>

      <div className="rounded-[8px] border border-border dark:border-border bg-white dark:bg-card p-6 shadow-[0_2px_4px_rgba(0,0,0,0.07)]">
        <h3 className="font-semibold text-base border-b pb-3 mb-5">Crawlers & Bots</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl">
          <div>
            <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Robots Configuration</Label>
            <Input value={robotsConfig} onChange={(e) => setRobotsConfig(e.target.value)} placeholder="index, follow" className="mt-1.5" />
          </div>
          <div>
            <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Sitemap Path</Label>
            <Input value={sitemapConfig} onChange={(e) => setSitemapConfig(e.target.value)} placeholder="/sitemap.xml" className="mt-1.5" />
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
          {saveMut.isPending ? "Saving…" : "Save SEO Settings"}
        </Button>
      </div>
    </form>
  );
}
