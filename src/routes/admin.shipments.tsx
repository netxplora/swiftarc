import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { adminListShipments, adminUpdateShipmentStatus, adminDeleteShipment, adminCreateShipment, adminUpdateShipment } from "@/lib/admin.functions";
import { Loader2, Trash2, Plus, Edit2 } from "lucide-react";

const STATUSES = ["label_created","picked_up","in_transit","out_for_delivery","delivered","exception"] as const;

export const Route = createFileRoute("/admin/shipments")({
  head: () => ({ meta: [{ title: "Admin — Shipments" }, { name: "robots", content: "noindex" }] }),
  component: AdminShipments,
});

function AdminShipments() {
  const qc = useQueryClient();
  const list = useServerFn(adminListShipments);
  const update = useServerFn(adminUpdateShipmentStatus);
  const del = useServerFn(adminDeleteShipment);
  const [filter, setFilter] = useState<string>("all");

  const q = useQuery({ queryKey: ["admin-shipments"], queryFn: () => list() });

  const updateMut = useMutation({
    mutationFn: (v: { id: string; status: string }) => update({ data: v }),
    onSuccess: () => { toast.success("Status updated"); qc.invalidateQueries({ queryKey: ["admin-shipments"] }); },
    onError: () => toast.error("Update failed"),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Shipment deleted"); qc.invalidateQueries({ queryKey: ["admin-shipments"] }); },
    onError: () => toast.error("Delete failed"),
  });

  const rows = (q.data ?? []).filter((r) => filter === "all" || r.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Shipments</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage network shipments.</p>
        </div>
        <ShipmentForm mode="create" onSuccess={() => qc.invalidateQueries({ queryKey: ["admin-shipments"] })} />
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter("all")} className={`rounded-full px-3 py-1 text-xs font-medium ${filter==="all"?"bg-navy-deep text-cream":"bg-secondary"}`}>All</button>
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-full px-3 py-1 text-xs font-medium ${filter===s?"bg-navy-deep text-cream":"bg-secondary"}`}>{s}</button>
        ))}
      </div>

      <Card><CardContent className="p-0">
        {q.isLoading ? (
          <div className="p-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="p-3">Tracking</th>
                  <th className="p-3">Service</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Created</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="p-3 font-mono text-xs">{r.tracking_number}</td>
                    <td className="p-3">{r.service}</td>
                    <td className="p-3">
                      <select
                        value={r.status ?? ""}
                        onChange={(e) => updateMut.mutate({ id: r.id, status: e.target.value })}
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <ShipmentForm mode="edit" initial={r} onSuccess={() => qc.invalidateQueries({ queryKey: ["admin-shipments"] })} />
                        <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete shipment?")) delMut.mutate(r.id); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-xs text-muted-foreground">No shipments.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </CardContent></Card>
    </div>
  );
}

function ShipmentForm({ mode, initial, onSuccess }: { mode: "create" | "edit"; initial?: any; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const createMut = useServerFn(adminCreateShipment);
  const updateMut = useServerFn(adminUpdateShipment);
  const [tracking, setTracking] = useState(initial?.tracking_number ?? "");
  const [service, setService] = useState(initial?.service ?? "Standard");
  const [status, setStatus] = useState(initial?.status ?? "label_created");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "create") {
        await createMut({ data: { tracking_number: tracking, service, status, origin: {}, destination: {} } });
      } else {
        await updateMut({ data: { id: initial.id, tracking_number: tracking, service, status } });
      }
      toast.success(`Shipment ${mode}d`);
      setOpen(false);
      onSuccess();
    } catch (err) {
      toast.error("Operation failed");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "create" ? (
          <Button className="bg-navy-deep text-cream hover:bg-navy"><Plus className="mr-2 h-4 w-4" /> New Shipment</Button>
        ) : (
          <Button size="sm" variant="ghost"><Edit2 className="h-3 w-3" /></Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader><DialogTitle>{mode === "create" ? "Create Shipment" : "Edit Shipment"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tracking Number</label>
            <Input required value={tracking} onChange={e => setTracking(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Service</label>
            <Input required value={service} onChange={e => setService(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <Button type="submit" className="w-full bg-amber text-navy-deep hover:bg-amber-soft" disabled={loading}>
            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
