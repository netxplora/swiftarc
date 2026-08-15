/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { Users, Star, Truck, Search, UserCheck, Loader2, Trash2, Edit } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminListDrivers, adminDeleteDriver, adminUpsertDriver } from "@/lib/admin.functions";
import { useServerFn } from "@tanstack/react-start";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/drivers")({
  head: () => ({ meta: [{ title: "Driver Management — Admin SwiftArc" }] }),
  component: AdminDriversPage,
});

type DriverForm = {
  id?: string;
  name: string;
  email: string;
  status: string;
  zone: string;
};

const BLANK_DRIVER: DriverForm = {
  name: "",
  email: "",
  status: "Off Duty",
  zone: "Unassigned",
};

function DriverDialog({
  open,
  onClose,
  initial,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  initial?: any;
  onSuccess: () => void;
}) {
  const upsert = useServerFn(adminUpsertDriver);
  const [form, setForm] = useState<DriverForm>(
    initial
      ? {
          id: initial.id,
          name: initial.name,
          email: initial.email,
          status: initial.status,
          zone: initial.zone,
        }
      : BLANK_DRIVER,
  );

  const mut = useMutation({
    mutationFn: () => upsert({ data: form as any }),
    onSuccess: () => {
      toast.success(initial ? "Driver updated" : "Driver created");
      onSuccess();
      onClose();
    },
    onError: (err) => toast.error(err.message || "Failed to save driver"),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Driver" : "Add Driver"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Status</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {["On Duty", "In Transit", "Off Duty"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Zone</Label>
              <Input
                value={form.zone}
                onChange={(e) => setForm({ ...form, zone: e.target.value })}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-navy-deep text-cream hover:bg-navy"
            disabled={!form.name || !form.email || mut.isPending}
            onClick={() => mut.mutate()}
          >
            {mut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const statusColor = (s: string) => {
  if (s === "On Duty")
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
  if (s === "In Transit") return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
  return "bg-secondary text-muted-foreground";
};

function AdminDriversPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any>(null);

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ["admin_drivers"],
    queryFn: () => adminListDrivers(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeleteDriver({ data: { id } }),
    onSuccess: () => {
      toast.success("Driver deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin_drivers"] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete driver");
    },
  });

  const filtered = drivers.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalDrivers = drivers.length;
  const onDuty = drivers.filter((d) => d.status === "On Duty").length;
  const inTransit = drivers.filter((d) => d.status === "In Transit").length;
  const avgRating =
    totalDrivers > 0
      ? (drivers.reduce((s, d) => s + (d.rating || 5), 0) / totalDrivers).toFixed(2)
      : "0.00";

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove ${name} from the system?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Driver Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage courier profiles, performance ratings, duty statuses, and shift assignments.
          </p>
        </div>
        <Button
          className="bg-navy-deep text-cream hover:bg-navy font-medium"
          onClick={() => {
            setEditingDriver(null);
            setDialogOpen(true);
          }}
        >
          Add Driver
        </Button>
      </div>

      {dialogOpen && (
        <DriverDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          initial={editingDriver}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["admin_drivers"] })}
        />
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-widest">Total Drivers</span>
            <Users className="h-5 w-5 text-amber" />
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-navy-deep dark:text-cream">
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalDrivers}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Registered couriers</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-widest">On Duty</span>
            <UserCheck className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-navy-deep dark:text-cream">
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : onDuty}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Available for dispatch</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-widest">In Transit</span>
            <Truck className="h-5 w-5 text-blue-500" />
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-navy-deep dark:text-cream">
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : inTransit}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Currently on delivery routes</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-widest">Average Rating</span>
            <Star className="h-5 w-5 text-amber fill-amber" />
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-navy-deep dark:text-cream">
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : avgRating}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Across all drivers</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or driver code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 h-10 rounded-md border border-input bg-background text-sm"
            />
          </div>
          <div className="flex gap-2">
            {["All", "On Duty", "In Transit", "Off Duty"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === s ? "bg-navy-deep text-cream" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="overflow-x-auto w-full pb-4">
            <table className="w-full min-w-[600px] text-sm text-left">
              <thead className="bg-secondary/50 text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Driver</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Vehicle</th>
                  <th className="px-4 py-3 font-medium">Zone</th>
                  <th className="px-4 py-3 font-medium">Performance</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Loading drivers...
                    </td>
                  </tr>
                )}
                {!isLoading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No drivers found.
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  filtered.map((d) => (
                    <tr key={d.id} className="hover:bg-secondary/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center font-bold text-muted-foreground">
                            {d.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{d.name}</div>
                            <div className="text-xs text-muted-foreground">{d.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor(d.status)}`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-muted-foreground">
                        {d.fleet_vehicles?.[0] ? d.fleet_vehicles[0].model : "Unassigned"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{d.zone}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <Star className="h-3.5 w-3.5 text-amber fill-amber" />
                          <span>{d.rating?.toFixed(2)}</span>
                          <span className="text-muted-foreground ml-1">
                            ({d.deliveries?.toLocaleString()} del.)
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5"
                            onClick={() => {
                              setEditingDriver(d);
                              setDialogOpen(true);
                            }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(d.id, d.name)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
