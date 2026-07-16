import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { adminListPickups, adminSetPickupStatus, adminCreatePickup, adminUpdatePickup, adminDeletePickup } from "@/lib/admin.functions";
import { Loader2, Trash2, Edit2, Plus } from "lucide-react";

const STATUSES = ["pending","confirmed","completed","cancelled"] as const;

export const Route = createFileRoute("/admin/pickups")({
  head: () => ({ meta: [{ title: "Admin — Pickups" }, { name: "robots", content: "noindex" }] }),
  component: AdminPickups,
});

function AdminPickups() {
  const qc = useQueryClient();
  const list = useServerFn(adminListPickups);
  const setStatus = useServerFn(adminSetPickupStatus);
  const q = useQuery({ queryKey: ["admin-pickups"], queryFn: () => list() });

  const mut = useMutation({
    mutationFn: (v: { id: string; status: typeof STATUSES[number] }) => setStatus({ data: v }),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-pickups"] }); },
    onError: () => toast.error("Update failed"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Pickups</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage network pickups.</p>
        </div>
        <PickupForm mode="create" onSuccess={() => qc.invalidateQueries({ queryKey: ["admin-pickups"] })} />
      </div>

      <Card><CardContent className="p-0">
        {q.isLoading ? (
          <div className="p-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="p-3">Date</th>
                  <th className="p-3">Slot</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(q.data ?? []).map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="p-3">{p.pickup_date}</td>
                    <td className="p-3 font-mono text-xs">{p.slot}</td>
                    <td className="p-3">
                      <p>{p.contact_name}</p>
                      <p className="text-xs text-muted-foreground">{p.company ?? p.reference}</p>
                    </td>
                    <td className="p-3">
                      <select
                        value={p.status ?? "pending"}
                        onChange={(e) => mut.mutate({ id: p.id, status: e.target.value as typeof STATUSES[number] })}
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <PickupForm mode="edit" initial={p} onSuccess={() => qc.invalidateQueries({ queryKey: ["admin-pickups"] })} />
                        <Button size="sm" variant="ghost" onClick={async () => {
                          if (confirm("Delete pickup?")) {
                            const del = (await import("@/lib/admin.functions")).adminDeletePickup;
                            del({ data: { id: p.id } }).then(() => qc.invalidateQueries({ queryKey: ["admin-pickups"] }));
                          }
                        }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(q.data ?? []).length === 0 && <tr><td colSpan={5} className="p-10 text-center text-xs text-muted-foreground">No pickups.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </CardContent></Card>
    </div>
  );
}

function PickupForm({ mode, initial, onSuccess }: { mode: "create" | "edit"; initial?: any; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const createMut = useServerFn(adminCreatePickup);
  const updateMut = useServerFn(adminUpdatePickup);
  const [contact, setContact] = useState(initial?.contact_name ?? "");
  const [company, setCompany] = useState(initial?.company ?? "");
  const [date, setDate] = useState(initial?.pickup_date ?? "");
  const [slot, setSlot] = useState(initial?.slot ?? "Morning");
  const [status, setStatus] = useState(initial?.status ?? "pending");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "create") {
        await createMut({ data: { contact_name: contact, company, pickup_date: date, slot, status } });
      } else {
        await updateMut({ data: { id: initial.id, contact_name: contact, company, pickup_date: date, slot, status } });
      }
      toast.success(`Pickup ${mode}d`);
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
          <Button className="bg-navy-deep text-cream hover:bg-navy"><Plus className="mr-2 h-4 w-4" /> New Pickup</Button>
        ) : (
          <Button size="sm" variant="ghost"><Edit2 className="h-3 w-3" /></Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader><DialogTitle>{mode === "create" ? "Create Pickup" : "Edit Pickup"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Contact Name</label>
            <Input required value={contact} onChange={e => setContact(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Company (Optional)</label>
            <Input value={company} onChange={e => setCompany(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date (YYYY-MM-DD)</label>
              <Input required type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Slot</label>
              <Input required value={slot} onChange={e => setSlot(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
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
