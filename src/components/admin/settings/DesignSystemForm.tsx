import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminUpdatePlatformSettings } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Loader2, Save, Palette } from "lucide-react";
import { ThemePalette } from "@/hooks/usePlatformSettings";

const DEFAULT_LIGHT: ThemePalette = {
  primary: "#EA580C",
  primaryHover: "#C2410C",
  secondary: "#032D60",
  accent: "#2563EB",
  background: "#FFFFFF",
  foreground: "#032D60",
  card: "#FFFFFF",
  cardBorder: "#E2E8F0",
  mutedBackground: "#F8FAFC",
  mutedText: "#64748B",
  inputBackground: "#FFFFFF",
  inputBorder: "#CBD5E1",
  success: "#16A34A",
  warning: "#F59E0B",
  error: "#DC2626",
  info: "#2563EB",
};

const DEFAULT_DARK: ThemePalette = {
  primary: "#F97316",
  primaryHover: "#EA580C",
  secondary: "#021836",
  accent: "#60A5FA",
  background: "#020617",
  foreground: "#F8FAFC",
  card: "#0F172A",
  cardElevated: "#172033",
  cardBorder: "#1E293B",
  mutedBackground: "#0B1120",
  mutedText: "#94A3B8",
  inputBackground: "#0F172A",
  inputBorder: "#334155",
  success: "#22C55E",
  warning: "#FBBF24",
  error: "#F87171",
  info: "#60A5FA",
};

export function DesignSystemForm({ initialData }: { initialData: any }) {
  const [lightMode, setLightMode] = useState<ThemePalette>(DEFAULT_LIGHT);
  const [darkMode, setDarkMode] = useState<ThemePalette>(DEFAULT_DARK);
  const [borderRadius, setBorderRadius] = useState("0.5rem");
  const [cardRadius, setCardRadius] = useState("0.75rem");

  useEffect(() => {
    if (initialData) {
      if (initialData.lightMode) setLightMode(initialData.lightMode);
      if (initialData.darkMode) setDarkMode(initialData.darkMode);
      if (initialData.borderRadius) setBorderRadius(initialData.borderRadius);
      if (initialData.cardRadius) setCardRadius(initialData.cardRadius);
    }
  }, [initialData]);

  const queryClient = useQueryClient();
  const updateSettings = useServerFn(adminUpdatePlatformSettings);

  const saveMut = useMutation({
    mutationFn: () =>
      updateSettings({
        data: {
          design_system: { lightMode, darkMode, borderRadius, cardRadius },
        },
      }),
    onSuccess: () => {
      toast.success("Design system updated successfully");
      queryClient.invalidateQueries({ queryKey: ["platform-settings"] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update design system");
    },
  });

  const handleLightChange = (key: keyof ThemePalette, value: string) => {
    setLightMode((prev) => ({ ...prev, [key]: value }));
  };

  const handleDarkChange = (key: keyof ThemePalette, value: string) => {
    setDarkMode((prev) => ({ ...prev, [key]: value }));
  };

  const ColorInput = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: string;
    onChange: (val: string) => void;
  }) => (
    <div>
      <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </Label>
      <div className="flex items-center gap-3 mt-1.5">
        <Input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 p-1 cursor-pointer shrink-0"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 font-mono uppercase text-xs"
        />
      </div>
    </div>
  );

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        saveMut.mutate();
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <Palette className="h-5 w-5 text-accent" /> Design System
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure the core branding tokens and styling variables for the platform.
          </p>
        </div>
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
          {saveMut.isPending ? "Saving…" : "Save Design Tokens"}
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-[8px] border border-border dark:border-border bg-white dark:bg-card p-6 shadow-[0_2px_4px_rgba(0,0,0,0.07)]">
          <h3 className="font-semibold text-base border-b pb-3 mb-5">Light Mode Palette</h3>
          <div className="grid grid-cols-2 gap-4">
            <ColorInput label="Primary" value={lightMode.primary} onChange={(v) => handleLightChange("primary", v)} />
            <ColorInput label="Primary Hover" value={lightMode.primaryHover} onChange={(v) => handleLightChange("primaryHover", v)} />
            <ColorInput label="Secondary" value={lightMode.secondary} onChange={(v) => handleLightChange("secondary", v)} />
            <ColorInput label="Accent" value={lightMode.accent} onChange={(v) => handleLightChange("accent", v)} />
            <div className="col-span-2 my-2 border-t border-dashed" />
            <ColorInput label="Background" value={lightMode.background} onChange={(v) => handleLightChange("background", v)} />
            <ColorInput label="Foreground" value={lightMode.foreground} onChange={(v) => handleLightChange("foreground", v)} />
            <ColorInput label="Card bg" value={lightMode.card} onChange={(v) => handleLightChange("card", v)} />
            <ColorInput label="Card Border" value={lightMode.cardBorder} onChange={(v) => handleLightChange("cardBorder", v)} />
            <div className="col-span-2 my-2 border-t border-dashed" />
            <ColorInput label="Muted Bg" value={lightMode.mutedBackground} onChange={(v) => handleLightChange("mutedBackground", v)} />
            <ColorInput label="Muted Text" value={lightMode.mutedText} onChange={(v) => handleLightChange("mutedText", v)} />
            <ColorInput label="Input Bg" value={lightMode.inputBackground} onChange={(v) => handleLightChange("inputBackground", v)} />
            <ColorInput label="Input Border" value={lightMode.inputBorder} onChange={(v) => handleLightChange("inputBorder", v)} />
            <div className="col-span-2 my-2 border-t border-dashed" />
            <ColorInput label="Success" value={lightMode.success} onChange={(v) => handleLightChange("success", v)} />
            <ColorInput label="Warning" value={lightMode.warning} onChange={(v) => handleLightChange("warning", v)} />
            <ColorInput label="Error" value={lightMode.error} onChange={(v) => handleLightChange("error", v)} />
            <ColorInput label="Info" value={lightMode.info} onChange={(v) => handleLightChange("info", v)} />
          </div>
        </div>

        <div className="rounded-[8px] border border-border dark:border-border bg-white dark:bg-card p-6 shadow-[0_2px_4px_rgba(0,0,0,0.07)]">
          <h3 className="font-semibold text-base border-b pb-3 mb-5">Dark Mode Palette</h3>
          <div className="grid grid-cols-2 gap-4">
            <ColorInput label="Primary" value={darkMode.primary} onChange={(v) => handleDarkChange("primary", v)} />
            <ColorInput label="Primary Hover" value={darkMode.primaryHover} onChange={(v) => handleDarkChange("primaryHover", v)} />
            <ColorInput label="Secondary" value={darkMode.secondary} onChange={(v) => handleDarkChange("secondary", v)} />
            <ColorInput label="Accent" value={darkMode.accent} onChange={(v) => handleDarkChange("accent", v)} />
            <div className="col-span-2 my-2 border-t border-dashed" />
            <ColorInput label="Background" value={darkMode.background} onChange={(v) => handleDarkChange("background", v)} />
            <ColorInput label="Foreground" value={darkMode.foreground} onChange={(v) => handleDarkChange("foreground", v)} />
            <ColorInput label="Card bg" value={darkMode.card} onChange={(v) => handleDarkChange("card", v)} />
            <ColorInput label="Card Border" value={darkMode.cardBorder} onChange={(v) => handleDarkChange("cardBorder", v)} />
            <div className="col-span-2 my-2 border-t border-dashed" />
            <ColorInput label="Muted Bg" value={darkMode.mutedBackground} onChange={(v) => handleDarkChange("mutedBackground", v)} />
            <ColorInput label="Muted Text" value={darkMode.mutedText} onChange={(v) => handleDarkChange("mutedText", v)} />
            <ColorInput label="Input Bg" value={darkMode.inputBackground} onChange={(v) => handleDarkChange("inputBackground", v)} />
            <ColorInput label="Input Border" value={darkMode.inputBorder} onChange={(v) => handleDarkChange("inputBorder", v)} />
            <div className="col-span-2 my-2 border-t border-dashed" />
            <ColorInput label="Success" value={darkMode.success} onChange={(v) => handleDarkChange("success", v)} />
            <ColorInput label="Warning" value={darkMode.warning} onChange={(v) => handleDarkChange("warning", v)} />
            <ColorInput label="Error" value={darkMode.error} onChange={(v) => handleDarkChange("error", v)} />
            <ColorInput label="Info" value={darkMode.info} onChange={(v) => handleDarkChange("info", v)} />
          </div>
        </div>
      </div>

      <div className="rounded-[8px] border border-border dark:border-border bg-white dark:bg-card p-6 shadow-[0_2px_4px_rgba(0,0,0,0.07)]">
        <h3 className="font-semibold text-base border-b pb-3 mb-5">Structural Tokens</h3>
        <div className="grid grid-cols-2 gap-6 max-w-xl">
          <div>
            <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Global Border Radius
            </Label>
            <Input
              value={borderRadius}
              onChange={(e) => setBorderRadius(e.target.value)}
              placeholder="0.5rem"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Card Radius
            </Label>
            <Input
              value={cardRadius}
              onChange={(e) => setCardRadius(e.target.value)}
              placeholder="0.75rem"
              className="mt-1.5"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
