import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { adminBroadcastNotification } from "@/lib/admin.functions";
import { Send } from "lucide-react";

export const Route = createFileRoute("/admin/broadcast")({
  head: () => ({ meta: [{ title: "Admin — Broadcast" }, { name: "robots", content: "noindex" }] }),
  component: AdminBroadcast,
});

function AdminBroadcast() {
  const fn = useServerFn(adminBroadcastNotification);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tone, setTone] = useState<"default"|"success"|"warning"|"danger">("default");

  const mut = useMutation({
    mutationFn: () => fn({ data: { title, body, tone, category: "announcement" } }),
    onSuccess: (r) => { toast.success(`Sent to ${r.sent} user${r.sent === 1 ? "" : "s"}`); setTitle(""); setBody(""); },
    onError: () => toast.error("Broadcast failed"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Broadcast notification</h1>
        <p className="mt-1 text-sm text-muted-foreground">Send an in-app announcement to every SwiftArc user.</p>
      </div>

      <Card><CardContent className="space-y-4 p-6">
        <div className="grid gap-2">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Service update" />
        </div>
        <div className="grid gap-2">
          <Label>Message</Label>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Your message…" rows={5} />
        </div>
        <div className="grid gap-2">
          <Label>Tone</Label>
          <select value={tone} onChange={(e) => setTone(e.target.value as typeof tone)} className="w-40 rounded-md border border-border bg-background px-3 py-2 text-sm">
            <option value="default">Default</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="danger">Danger</option>
          </select>
        </div>
        <Button
          onClick={() => mut.mutate()}
          disabled={!title.trim() || !body.trim() || mut.isPending}
          className="bg-navy-deep text-cream hover:bg-navy"
        >
          <Send className="mr-2 h-4 w-4" /> Send broadcast
        </Button>
      </CardContent></Card>
    </div>
  );
}
