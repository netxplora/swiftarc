import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Key, Webhook, Plus, Trash2, Copy, Eye, Loader2, AlertTriangle } from "lucide-react";
import { listApiKeys, createApiKey, deleteApiKey, listWebhooks, createWebhook, deleteWebhook } from "@/lib/developer.functions";

export const Route = createFileRoute("/dashboard/api-keys")({
  head: () => ({ meta: [{ title: "Developer API & Webhooks — SwiftArc" }] }),
  component: DeveloperPortal,
});

function DeveloperPortal() {
  const [tab, setTab] = useState<"keys" | "webhooks">("keys");

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Developer Portal</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage API keys and configure Webhooks for your integrations.</p>
      </div>

      <div className="flex gap-2 border-b border-border pb-4">
        <button
          onClick={() => setTab("keys")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === "keys" ? "bg-navy-deep text-cream" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
        >
          <Key className="h-4 w-4" /> API Keys
        </button>
        <button
          onClick={() => setTab("webhooks")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === "webhooks" ? "bg-navy-deep text-cream" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
        >
          <Webhook className="h-4 w-4" /> Webhooks
        </button>
      </div>

      {tab === "keys" ? <ApiKeysTab /> : <WebhooksTab />}
    </div>
  );
}

function ApiKeysTab() {
  const qc = useQueryClient();
  const fetchKeys = useServerFn(listApiKeys);
  const q = useQuery({ queryKey: ["api-keys"], queryFn: () => fetchKeys() });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);

  const createMut = useServerFn(createApiKey);
  const deleteMut = useServerFn(deleteApiKey);

  const create = useMutation({
    mutationFn: () => createMut({ data: { name } }),
    onSuccess: (data: any) => {
      setNewKey(data.full_key);
      qc.invalidateQueries({ queryKey: ["api-keys"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to create API key"),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteMut({ data: { id } }),
    onSuccess: () => {
      toast.success("API Key revoked");
      qc.invalidateQueries({ queryKey: ["api-keys"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to revoke API key"),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Secret API Keys</CardTitle>
          <CardDescription>Use these keys to authenticate your API requests. Do not share them in publicly accessible areas.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setNewKey(null); setName(""); } }}>
          <DialogTrigger asChild>
            <Button className="bg-navy-deep text-cream hover:bg-navy"><Plus className="mr-2 h-4 w-4" /> Create new secret key</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
            </DialogHeader>
            {newKey ? (
              <div className="space-y-4 pt-4">
                <div className="rounded-md border border-amber/50 bg-amber/10 p-3 text-sm text-amber-deep flex gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>Please copy this key and save it somewhere safe. For security reasons, <strong>we cannot show it to you again</strong>.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input readOnly value={newKey} className="font-mono" />
                  <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(newKey); toast.success("Copied to clipboard"); }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Button className="w-full bg-navy-deep text-cream hover:bg-navy" onClick={() => setOpen(false)}>Done</Button>
              </div>
            ) : (
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input placeholder="e.g. Production ERP Integration" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <Button className="w-full bg-amber text-navy-deep hover:bg-amber-soft" disabled={!name || create.isPending} onClick={() => create.mutate()}>
                  {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate Key"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
        {q.isLoading ? (
          <div className="p-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Secret Key</th>
                  <th className="px-6 py-3 font-medium">Created</th>
                  <th className="px-6 py-3 font-medium">Last Used</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(q.data ?? []).map((k: any) => (
                  <tr key={k.id} className="hover:bg-secondary/20">
                    <td className="px-6 py-4 font-medium">{k.name}</td>
                    <td className="px-6 py-4 font-mono text-muted-foreground">{k.key_preview}</td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">{new Date(k.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">{k.last_used ? new Date(k.last_used).toLocaleDateString() : "Never"}</td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => { if (confirm("Revoke this key immediately?")) del.mutate(k.id); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {(q.data ?? []).length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No API keys generated.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WebhooksTab() {
  const qc = useQueryClient();
  const fetchWebhooks = useServerFn(listWebhooks);
  const q = useQuery({ queryKey: ["webhooks"], queryFn: () => fetchWebhooks() });

  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  
  const createMut = useServerFn(createWebhook);
  const deleteMut = useServerFn(deleteWebhook);

  const create = useMutation({
    mutationFn: () => createMut({ data: { url, events: ["shipment.status_updated", "shipment.exception"] } }),
    onSuccess: () => {
      toast.success("Webhook endpoint added");
      setOpen(false);
      setUrl("");
      qc.invalidateQueries({ queryKey: ["webhooks"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to add webhook"),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteMut({ data: { id } }),
    onSuccess: () => {
      toast.success("Webhook endpoint deleted");
      qc.invalidateQueries({ queryKey: ["webhooks"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to delete webhook"),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Webhook Endpoints</CardTitle>
          <CardDescription>Receive real-time HTTP POST requests when events occur in your account.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-navy-deep text-cream hover:bg-navy"><Plus className="mr-2 h-4 w-4" /> Add Endpoint</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Webhook Endpoint</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Endpoint URL</label>
                <Input placeholder="https://api.yourdomain.com/webhooks/swiftarc" value={url} onChange={e => setUrl(e.target.value)} type="url" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Events</label>
                <div className="rounded-md border border-border bg-secondary/50 p-3 text-sm text-muted-foreground">
                  Subscribing to: <span className="font-mono text-xs">shipment.*</span>
                </div>
              </div>
              <Button className="w-full bg-amber text-navy-deep hover:bg-amber-soft" disabled={!url || create.isPending} onClick={() => create.mutate()}>
                {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Endpoint"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
        {q.isLoading ? (
          <div className="p-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-medium">URL</th>
                  <th className="px-6 py-3 font-medium">Signing Secret</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(q.data ?? []).map((w: any) => (
                  <tr key={w.id} className="hover:bg-secondary/20">
                    <td className="px-6 py-4 font-mono text-xs">{w.url}</td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span>{w.secret.substring(0, 8)}...</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(w.secret); toast.success("Copied secret"); }}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
                        <span className="h-1.5 w-1.5 rounded-full bg-success"></span> Active
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => { if (confirm("Delete this webhook endpoint?")) del.mutate(w.id); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {(q.data ?? []).length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">No webhooks configured.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
