/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { Truck, Activity, Gauge, Search, Fuel, Loader2, Trash2, Edit, Plus, X } from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  adminListFleet,
  adminDeleteFleetVehicle,
  adminUpsertFleetVehicle,
  adminListDrivers,
} from "@/lib/admin.functions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/fleet")({
  head: () => ({ meta: [{ title: "Fleet Management — Admin SwiftArc" }] }),
  component: AdminFleetPage,
});

type VehicleForm = {
  model: string;
  type: string;
  status: string;
  driver_id: string;
  fuel_level: number;
  location: string;
  mileage: number;
  next_service_date: string;
};

const BLANK_FORM: VehicleForm = {
  model: "",
  type: "Van",
  status: "Active",
  driver_id: "",
  fuel_level: 80,
  location: "",
  mileage: 0,
  next_service_date: "",
};

const VEHICLE_TYPES = ["Bike", "Van", "Box Truck", "Freight Semi"];
const STATUSES = ["Active", "In Transit", "Maintenance", "Inactive"];

const getStatusVariant = (s: string) => {
  if (s === "Active")
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
  if (s === "In Transit") return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300";
  if (s === "Maintenance") return "bg-amber/10 text-amber";
  return "bg-secondary text-muted-foreground";
};

const fuelColor = (pct: number) => {
  if (pct >= 80) return "bg-emerald-500";
  if (pct >= 40) return "bg-amber";
  return "bg-destructive";
};

function VehicleDialog({
  open,
  onClose,
  initial,
  drivers,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  initial?: any;
  drivers: any[];
  onSuccess: () => void;
}) {
  const upsert = useServerFn(adminUpsertFleetVehicle);
  const [form, setForm] = useState<VehicleForm>(
    initial
      ? {
          model: initial.model ?? "",
          type: initial.type ?? "Van",
          status: initial.status ?? "Active",
          driver_id: initial.driver_id ?? "",
          fuel_level: initial.fuel_level ?? 80,
          location: initial.location ?? "",
          mileage: initial.mileage ?? 0,
          next_service_date: initial.next_service_date ?? "",
        }
      : BLANK_FORM,
  );

  const mut = useMutation({
    mutationFn: () =>
      upsert({
        data: {
          ...(initial?.id ? { id: initial.id } : {}),
          ...form,
          fuel_level: Number(form.fuel_level),
          mileage: Number(form.mileage),
          driver_id: form.driver_id || null,
          next_service_date: form.next_service_date || null,
        } as any,
      }),
    onSuccess: () => {
      toast.success(initial ? "Vehicle updated" : "Vehicle added");
      onSuccess();
      onClose();
    },
    onError: (e: any) => toast.error(e.message || "Save failed"),
  });

  const set = (k: keyof VehicleForm, v: any) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Vehicle" : "Add Vehicle"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-2">
            <Label>Model / Name</Label>
            <Input
              value={form.model}
              onChange={(e) => set("model", e.target.value)}
              placeholder="e.g. Ford Transit 350"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Type</Label>
            <select
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
              className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {VEHICLE_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Status</Label>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <Label>Current Driver (optional)</Label>
            <select
              value={form.driver_id}
              onChange={(e) => set("driver_id", e.target.value)}
              className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Unassigned</option>
              {drivers.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Location</Label>
            <Input
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="e.g. London Hub"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Fuel Level (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={form.fuel_level}
              onChange={(e) => set("fuel_level", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Mileage (km)</Label>
            <Input
              type="number"
              min={0}
              value={form.mileage}
              onChange={(e) => set("mileage", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Next Service Date</Label>
            <Input
              type="date"
              value={form.next_service_date}
              onChange={(e) => set("next_service_date", e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending || !form.model}>
            {mut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initial ? "Save Changes" : "Add Vehicle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AdminFleetPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);

  const { data: fleet = [], isLoading } = useQuery({
    queryKey: ["admin_fleet"],
    queryFn: () => adminListFleet(),
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ["admin_drivers_for_fleet"],
    queryFn: () => adminListDrivers(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeleteFleetVehicle({ data: { id } }),
    onSuccess: () => {
      toast.success("Vehicle deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin_fleet"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete vehicle");
    },
  });

  const filtered = useMemo(() => {
    return fleet.filter((v) => {
      const matchSearch =
        v.model.toLowerCase().includes(search.toLowerCase()) ||
        v.id.toLowerCase().includes(search.toLowerCase()) ||
        (v.drivers?.name || "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "All" || v.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [fleet, search, statusFilter]);

  const totalActive = fleet.filter(
    (v) => v.status === "Active" || v.status === "In Transit",
  ).length;
  const inTransit = fleet.filter((v) => v.status === "In Transit").length;
  const inMaintenance = fleet.filter((v) => v.status === "Maintenance").length;
  const validFuelVehicles = fleet.filter((v) => (v.fuel_level || 0) > 0);
  const avgFuel =
    validFuelVehicles.length > 0
      ? Math.round(
          validFuelVehicles.reduce((s, v) => s + (v.fuel_level || 0), 0) / validFuelVehicles.length,
        )
      : 0;

  const handleDelete = (id: string, model: string) => {
    if (confirm(`Are you sure you want to remove ${model} from the fleet?`)) {
      deleteMutation.mutate(id);
    }
  };

  const openAdd = () => {
    setEditTarget(null);
    setDialogOpen(true);
  };
  const openEdit = (v: any) => {
    setEditTarget(v);
    setDialogOpen(true);
  };
  const onSaveSuccess = () => queryClient.invalidateQueries({ queryKey: ["admin_fleet"] });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Fleet Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor vehicles, fuel levels, maintenance schedules, and active routes.
          </p>
        </div>
        <Button className="bg-navy-deep text-cream hover:bg-navy font-medium" onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add Vehicle
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-widest">Total Active</span>
            <Truck className="h-5 w-5 text-primary" />
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-navy-deep dark:text-cream">
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalActive}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Operational vehicles</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-widest">In Transit</span>
            <Activity className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-navy-deep dark:text-cream">
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : inTransit}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Currently on delivery routes</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-widest">In Maintenance</span>
            <Gauge className="h-5 w-5 text-destructive" />
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-navy-deep dark:text-cream">
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : inMaintenance}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Undergoing repairs or service</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-widest">Avg Fuel Level</span>
            <Fuel className="h-5 w-5 text-blue-500" />
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-navy-deep dark:text-cream">
            {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `${avgFuel}%`}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Across operational fleet</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by vehicle ID, model, or driver..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 h-10 rounded-md border border-input bg-background text-sm"
            />
          </div>
          <div className="flex gap-2">
            {["All", "Active", "In Transit", "Maintenance"].map((s) => (
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
                  <th className="px-4 py-3 font-medium">Vehicle</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Current Driver</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Fuel / Mileage</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Loading fleet data...
                    </td>
                  </tr>
                )}
                {!isLoading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No vehicles found.
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  filtered.map((v) => (
                    <tr key={v.id} className="hover:bg-secondary/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-navy-deep dark:text-cream">{v.model}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-mono bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">
                            {v.id.substring(0, 8)}
                          </span>
                          <span className="text-xs text-muted-foreground">{v.type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusVariant(v.status)}`}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {v.drivers ? (
                          <div className="font-medium">{v.drivers.name}</div>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{v.location}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1.5 w-24">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium">{v.fuel_level}%</span>
                            <span className="text-muted-foreground">
                              {v.mileage?.toLocaleString()} km
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${fuelColor(v.fuel_level || 0)}`}
                              style={{ width: `${v.fuel_level}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5"
                            onClick={() => openEdit(v)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(v.id, v.model)}
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

      <VehicleDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        initial={editTarget}
        drivers={drivers as any[]}
        onSuccess={onSaveSuccess}
      />
    </div>
  );
}
