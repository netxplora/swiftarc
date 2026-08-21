/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  adminListPickups,
  adminSetPickupStatus,
  adminCreatePickup,
  adminUpdatePickup,
  adminDeletePickup,
} from "@/lib/admin.functions";
import {
  Loader2,
  Trash2,
  Edit2,
  Plus,
  Download,
  CalendarClock,
  CheckCircle2,
  XCircle,
  Clock,
  Package,
  Search,
  Filter,
  MapPin,
  User,
} from "lucide-react";

const STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

const SLOTS = ["09:00 – 12:00", "12:00 – 15:00", "15:00 – 18:00", "18:00 – 20:00"];

const STATUS_CONFIG: Record<Status, { label: string; color: string; icon: React.ReactNode }> = {
  pending: {
    label: "Pending",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    icon: <Clock className="h-3 w-3" />,
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  completed: {
    label: "Completed",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: <XCircle className="h-3 w-3" />,
  },
};

export const Route = createFileRoute("/admin/pickups")({
  head: () => ({ meta: [{ title: "Admin — Pickups" }, { name: "robots", content: "noindex" }] }),
  component: AdminPickups,
});

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as Status] ?? {
    label: status,
    color: "bg-muted text-muted-foreground border-border",
    icon: null,
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function AdminPickups() {
  const qc = useQueryClient();
  const list = useServerFn(adminListPickups);
  const setStatus = useServerFn(adminSetPickupStatus);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");

  const q = useQuery({ queryKey: ["admin-pickups"], queryFn: () => list() });

  const statusMut = useMutation({
    mutationFn: (v: { id: string; status: Status }) => setStatus({ data: v }),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: ["admin-pickups"] });
      const prev = qc.getQueryData(["admin-pickups"]);
      qc.setQueryData(["admin-pickups"], (old: any[]) =>
        old?.map((p) => (p.id === v.id ? { ...p, status: v.status } : p))
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["admin-pickups"], ctx.prev);
      toast.error("Status update failed");
    },
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["admin-pickups"] });
    },
  });

  const exportCSV = () => {
    if (filtered.length === 0) return toast.info("No data to export");
    const rows = [
      ["Reference", "Date", "Slot", "Contact", "Company", "Address", "City", "Postal", "Packages", "Status"].join(","),
      ...filtered.map((p: any) =>
        [
          p.reference ?? "",
          p.pickup_date,
          p.slot,
          `"${p.contact_name ?? ""}"`,
          `"${p.company ?? ""}"`,
          `"${p.address ?? ""}"`,
          p.city ?? "",
          p.postal_code ?? "",
          p.package_count ?? 1,
          p.status,
        ].join(",")
      ),
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pickups_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pickups = q.data ?? [];

  // Summary stats
  const stats = useMemo(() => ({
    total: pickups.length,
    pending: pickups.filter((p: any) => p.status === "pending").length,
    confirmed: pickups.filter((p: any) => p.status === "confirmed").length,
    completed: pickups.filter((p: any) => p.status === "completed").length,
    cancelled: pickups.filter((p: any) => p.status === "cancelled").length,
    today: pickups.filter((p: any) => p.pickup_date === new Date().toISOString().slice(0, 10)).length,
  }), [pickups]);

  // Filtered list
  const filtered = useMemo(() => {
    return pickups.filter((p: any) => {
      const matchesSearch =
        !search ||
        p.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.company?.toLowerCase().includes(search.toLowerCase()) ||
        p.reference?.toLowerCase().includes(search.toLowerCase()) ||
        p.city?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = filterStatus === "all" || p.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [pickups, search, filterStatus]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl">Pickups</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage courier pickup requests from customers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportCSV} className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <PickupForm
            mode="create"
            onSuccess={() => qc.invalidateQueries({ queryKey: ["admin-pickups"] })}
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Total", value: stats.total, icon: <Package className="h-4 w-4" />, color: "text-secondary", bg: "bg-secondary/10 dark:bg-white/10 dark:text-white" },
          { label: "Today", value: stats.today, icon: <CalendarClock className="h-4 w-4" />, color: "text-accent", bg: "bg-accent/10" },
          { label: "Pending", value: stats.pending, icon: <Clock className="h-4 w-4" />, color: "text-primary", bg: "bg-primary/10" },
          { label: "Confirmed", value: stats.confirmed, icon: <CheckCircle2 className="h-4 w-4" />, color: "text-accent-hover", bg: "bg-accent-hover/10" },
          { label: "Completed", value: stats.completed, icon: <CheckCircle2 className="h-4 w-4" />, color: "text-success", bg: "bg-success/10" },
          { label: "Cancelled", value: stats.cancelled, icon: <XCircle className="h-4 w-4" />, color: "text-error", bg: "bg-error/10" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-[6px] ${s.bg} ${s.color}`}>
                {s.icon}
              </span>
              <div>
                <p className="text-xl font-bold leading-none">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, company, reference or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as Status | "all")}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_CONFIG[s].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {q.isLoading ? (
            <div className="p-10 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">Loading pickups...</p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[700px] text-sm">
                <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground border-b border-border">
                  <tr>
                    <th className="p-3 pl-4">Reference</th>
                    <th className="p-3">Date & Slot</th>
                    <th className="p-3">Contact</th>
                    <th className="p-3">Address</th>
                    <th className="p-3">Packages</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p: any) => (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-3 pl-4">
                        <span className="font-mono text-xs font-semibold text-primary">
                          {p.reference ?? "—"}
                        </span>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(p.created_at).toLocaleDateString(undefined, {
                            month: "short", day: "numeric", year: "numeric",
                          })}
                        </p>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">{p.pickup_date}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{p.slot}</p>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="font-medium truncate max-w-[140px]">{p.contact_name}</span>
                        </div>
                        {p.company && (
                          <p className="text-xs text-muted-foreground mt-0.5 pl-5">{p.company}</p>
                        )}
                      </td>
                      <td className="p-3">
                        {p.address && p.city ? (
                          <div className="flex items-start gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                            <div>
                              <p className="truncate max-w-[160px] text-xs">{p.address}</p>
                              <p className="text-xs text-muted-foreground">{p.city} {p.postal_code}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <Package className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{p.package_count ?? 1}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <select
                          value={p.status ?? "pending"}
                          onChange={(e) =>
                            statusMut.mutate({
                              id: p.id,
                              status: e.target.value as Status,
                            })
                          }
                          className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_CONFIG[s].label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 pr-4 text-right">
                        <div className="flex justify-end gap-2">
                          <PickupForm
                            mode="edit"
                            initial={p}
                            onSuccess={() =>
                              qc.invalidateQueries({ queryKey: ["admin-pickups"] })
                            }
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={async () => {
                              if (confirm(`Delete pickup ${p.reference}?`)) {
                                const del = (await import("@/lib/admin.functions")).adminDeletePickup;
                                await del({ data: { id: p.id } });
                                qc.invalidateQueries({ queryKey: ["admin-pickups"] });
                                toast.success("Pickup deleted");
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-sm text-muted-foreground">
                        {search || filterStatus !== "all"
                          ? "No pickups match your search or filter."
                          : "No pickups yet."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PickupForm({
  mode,
  initial,
  onSuccess,
}: {
  mode: "create" | "edit";
  initial?: any;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const createFn = useServerFn(adminCreatePickup);
  const updateFn = useServerFn(adminUpdatePickup);

  const [contact, setContact] = useState(initial?.contact_name ?? "");
  const [company, setCompany] = useState(initial?.company ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [postalCode, setPostalCode] = useState(initial?.postal_code ?? "");
  const [date, setDate] = useState(initial?.pickup_date ?? new Date().toISOString().slice(0, 10));
  const [slot, setSlot] = useState(initial?.slot ?? SLOTS[0]);
  const [status, setStatus] = useState<Status>(initial?.status ?? "pending");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "create") {
        await createFn({
          data: {
            contact_name: contact,
            company: company || undefined,
            address: address || "TBD", // Fallback if empty but API requires it
            city: city || "TBD",
            postal_code: postalCode || "00000",
            pickup_date: date,
            slot,
            status,
          },
        });
      } else {
        await updateFn({
          data: {
            id: initial.id,
            contact_name: contact,
            company: company || undefined,
            address: address || undefined,
            city: city || undefined,
            postal_code: postalCode || undefined,
            pickup_date: date,
            slot,
            status,
          },
        });
      }
      toast.success(mode === "create" ? "Pickup created" : "Pickup updated");
      setOpen(false);
      onSuccess();
    } catch {
      toast.error("Operation failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "create" ? (
          <Button className="bg-navy-deep text-cream hover:bg-navy">
            <Plus className="mr-2 h-4 w-4" /> New Pickup
          </Button>
        ) : (
          <Button size="sm" variant="ghost">
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create Pickup" : "Edit Pickup"}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {mode === "create"
              ? "Manually create a pickup request on behalf of a customer."
              : "Update the details for this pickup request."}
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Contact Name *</label>
            <Input required value={contact} onChange={(e) => setContact(e.target.value)} placeholder="John Smith" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Company (Optional)</label>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Ltd." />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Address *</label>
            <Input required value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">City *</label>
              <Input required value={city} onChange={(e) => setCity(e.target.value)} placeholder="London" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Postal Code *</label>
              <Input required value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="SW1A 1AA" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pickup Date *</label>
              <Input
                required
                type="date"
                value={date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Slot *</label>
              <select
                required
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {SLOTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_CONFIG[s].label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-amber text-navy-deep hover:bg-amber-soft"
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin h-4 w-4" /> : mode === "create" ? "Create Pickup" : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
