import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useTheme } from "@/hooks/use-theme";
import { getMyProfile, updateProfile } from "@/lib/api.functions";
import { Sun, Moon, Monitor } from "lucide-react";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({ meta: [{ title: "Settings — SwiftArc" }, { name: "robots", content: "noindex" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getMyProfile);
  const saveProfile = useServerFn(updateProfile);
  const { preference, setPreference } = useTheme();

  const profile = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });
  const [name, setName] = useState("");

  const save = useMutation({
    mutationFn: (n: string) => saveProfile({ data: { display_name: n } }),
    onSuccess: () => { toast.success("Profile updated"); qc.invalidateQueries({ queryKey: ["profile"] }); },
    onError: () => toast.error("Could not update profile"),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your profile, appearance, and account preferences.</p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="font-display text-lg">Profile</h2>
          <div className="grid gap-2">
            <Label>Display name</Label>
            <Input
              defaultValue={profile.data?.display_name ?? ""}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="max-w-md"
            />
          </div>
          <Button
            onClick={() => save.mutate(name || profile.data?.display_name || "")}
            disabled={save.isPending}
            className="bg-navy-deep text-cream hover:bg-navy"
          >
            Save changes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="font-display text-lg">Appearance</h2>
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
    </div>
  );
}
