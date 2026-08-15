/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  adminListShipments,
  adminUpdateShipmentStatus,
  adminDeleteShipment,
  adminCreateShipment,
  adminUpdateShipment,
  adminListUsers,
  adminGetShipmentDetail,
  adminCreateShipmentEvent,
  adminUpdateShipmentEvent,
  adminDeleteShipmentEvent,
  adminRunAIPredictions,
  adminUpdateShipmentTelemetry,
  adminGetCustomsHolds,
  adminCreateCustomsHold,
  adminReleaseCustomsHold,
} from "@/lib/admin.functions";
import {
  Loader2,
  Trash2,
  Plus,
  Edit2,
  User,
  Search,
  AlertTriangle,
  BrainCircuit,
  Package,
  MapPin,
  Truck,
  Clock,
  FileText,
  Navigation,
  History,
  Settings,
  Save,
  PlusCircle,
  Download,
  CheckSquare,
  ShieldCheck,
  Unlock,
} from "lucide-react";
import { statusLabels } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

const STATUSES = [
  "created",
  "confirmed",
  "assigned",
  "picked_up",
  "in_transit",
  "near_destination",
  "delivered",
  "exception",
] as const;
const SERVICES = [
  "Standard",
  "Economy",
  "Priority Overnight",
  "Express International",
  "Ground Freight",
  "Ocean Freight",
  "Air Freight",
];

const getStatusVariant = (status: string) => {
  switch (status) {
    case "delivered":
    case "completed":
      return "success";
    case "exception":
      return "destructive";
    case "in_transit":
    case "near_destination":
    case "out_for_delivery":
      return "info";
    case "created":
    case "booking_created":
    case "confirmed":
    case "awaiting_confirmation":
      return "secondary";
    default:
      return "default";
  }
};

export const Route = createFileRoute("/admin/shipments")({
  head: () => ({ meta: [{ title: "Admin — Shipments" }, { name: "robots", content: "noindex" }] }),
  component: AdminShipments,
});

function AdminShipments() {
  const qc = useQueryClient();
  const list = useServerFn(adminListShipments);
  const del = useServerFn(adminDeleteShipment);
  const runAI = useServerFn(adminRunAIPredictions);
  const listUsers = useServerFn(adminListUsers);
  const updateStatus = useServerFn(adminUpdateShipmentStatus);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const q = useQuery({ queryKey: ["admin-shipments"], queryFn: () => list() });
  const usersQ = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => listUsers(),
  });

  useEffect(() => {
    const channel = supabase
      .channel("admin-shipments-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "shipments" }, () => {
        qc.invalidateQueries({ queryKey: ["admin-shipments"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Shipment deleted");
      qc.invalidateQueries({ queryKey: ["admin-shipments"] });
    },
    onError: () => toast.error("Delete failed"),
  });

  const aiMut = useMutation({
    mutationFn: () => runAI(),
    onSuccess: (res) => {
      toast.success(`AI Analysis complete. Processed ${res.processed} shipments.`);
      qc.invalidateQueries({ queryKey: ["admin-shipments"] });
    },
    onError: () => toast.error("AI Analysis failed"),
  });

  const rows = useMemo(() => {
    return (q.data ?? []).filter((r) => {
      const matchSearch = r.tracking_number?.toLowerCase().includes(search.toLowerCase()) || false;
      const matchStatus = filter === "all" || r.status === filter;
      return matchSearch && matchStatus;
    });
  }, [q.data, search, filter]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(rows.map((r) => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleBulkUpdate = async () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    setIsBulkUpdating(true);
    let successCount = 0;
    try {
      for (const id of selectedIds) {
        await updateStatus({ data: { id, status: bulkStatus, notify: false } });
        successCount++;
      }
      toast.success(`Updated ${successCount} shipments to ${bulkStatus}`);
      setSelectedIds(new Set());
      setBulkStatus("");
      qc.invalidateQueries({ queryKey: ["admin-shipments"] });
    } catch {
      toast.error(`Bulk update failed after ${successCount} updates.`);
    }
    setIsBulkUpdating(false);
  };

  const exportToCSV = () => {
    if (rows.length === 0) return toast.info("No data to export");
    const headers = ["Tracking Number", "Status", "Service", "Origin", "Destination", "Created At"];
    const csvRows = [headers.join(",")];

    rows.forEach((r) => {
      const origin = r.origin as any;
      const dest = r.destination as any;
      const row = [
        r.tracking_number,
        r.status,
        r.service,
        `"${origin?.city || ""} ${origin?.country || ""}"`,
        `"${dest?.city || ""} ${dest?.country || ""}"`,
        new Date(r.created_at).toISOString(),
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shipments_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Shipments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage network shipments, routes, and tracking events.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => aiMut.mutate()}
            disabled={aiMut.isPending}
            className="border-amber/50 text-amber hover:bg-amber/10"
          >
            {aiMut.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <BrainCircuit className="mr-2 h-4 w-4" />
            )}
            Run AI Analysis
          </Button>
          <Link to="/admin/shipments/create">
            <Button className="bg-navy text-cream hover:bg-navy-deep">New Shipment</Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tracking..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${filter === "all" ? "bg-navy-deep text-cream shadow-sm" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}
          >
            All
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${filter === s ? "bg-navy-deep text-cream shadow-sm" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}
            >
              {statusLabels[s] || s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-muted/30 p-2 rounded-lg border border-border/50">
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 ? (
            <>
              <span className="text-sm font-medium text-muted-foreground px-2">
                {selectedIds.size} selected
              </span>
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs"
              >
                <option value="">Set Status...</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {statusLabels[s] || s}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="secondary"
                disabled={!bulkStatus || isBulkUpdating}
                onClick={handleBulkUpdate}
                className="h-8 text-xs bg-navy-deep text-white hover:bg-navy"
              >
                {isBulkUpdating ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <CheckSquare className="h-3 w-3 mr-1" />
                )}{" "}
                Apply
              </Button>
            </>
          ) : (
            <span className="text-sm text-muted-foreground px-2">
              Select rows to apply bulk actions
            </span>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={exportToCSV} className="h-8 text-xs">
          <Download className="h-3 w-3 mr-1.5" /> Export CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {q.isLoading ? (
            <div className="p-4 space-y-4">
              <div className="flex items-center space-x-4 mb-4">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
              </div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px] pl-4">
                    <input
                      type="checkbox"
                      checked={rows.length > 0 && selectedIds.size === rows.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-input h-4 w-4 text-navy-deep focus:ring-navy-deep accent-amber"
                    />
                  </TableHead>
                  <TableHead>Tracking</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Courier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const origin = r.origin as any;
                  const dest = r.destination as any;
                  return (
                    <TableRow key={r.id} className={selectedIds.has(r.id) ? "bg-amber/5" : ""}>
                      <TableCell className="pl-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(r.id)}
                          onChange={(e) => {
                            const newSet = new Set(selectedIds);
                            if (e.target.checked) newSet.add(r.id);
                            else newSet.delete(r.id);
                            setSelectedIds(newSet);
                          }}
                          className="rounded border-input h-4 w-4 text-navy-deep focus:ring-navy-deep accent-amber"
                        />
                      </TableCell>
                      <TableCell className="font-mono font-medium text-navy-deep">
                        <div className="flex items-center gap-2">
                          {r.tracking_number}
                          {(r.ai_delay_risk ?? 0) > 0.5 && (
                            <div
                              className="flex items-center gap-1 text-[10px] bg-amber/10 text-amber px-1.5 py-0.5 rounded-full font-bold"
                              title={r.ai_delay_reason || "AI Delay Risk"}
                            >
                              <BrainCircuit className="h-3 w-3" />
                              Risk
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
                        {origin?.city || "—"} → {dest?.city || "—"}
                      </TableCell>
                      <TableCell className="text-sm">{r.service}</TableCell>
                      <TableCell>
                        {r.assigned_courier_id ? (
                          <span className="inline-flex items-center gap-1 text-xs text-navy-deep bg-navy/10 px-2 py-1 rounded-full">
                            <User className="h-3 w-3" />{" "}
                            {(usersQ.data ?? []).find((u: any) => u.id === r.assigned_courier_id)
                              ?.displayName ?? "Assigned"}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-2">
                          <Badge variant={getStatusVariant(r.status ?? "")}>
                            {statusLabels[r.status ?? ""] || r.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(r.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <ShipmentEditDialog
                            shipmentId={r.id}
                            users={usersQ.data ?? []}
                            onSuccess={() =>
                              qc.invalidateQueries({ queryKey: ["admin-shipments"] })
                            }
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => {
                              if (confirm("Delete shipment?")) delMut.mutate(r.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No shipments found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ================================================================ */
/*  Create Shipment (simple)                                        */
/* ================================================================ */

function CreateShipmentDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const createFn = useServerFn(adminCreateShipment);
  const [tracking, setTracking] = useState("");
  const [service, setService] = useState("Standard");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createFn({
        data: {
          tracking_number: tracking,
          service,
          status: "label_created",
          origin: {},
          destination: {},
          package: {
            weight_kg: 1,
            length_cm: 10,
            width_cm: 10,
            height_cm: 10,
            pieces: 1,
            description: "Standard package",
          },
        },
      });
      toast.success("Shipment created");
      setOpen(false);
      setTracking("");
      onSuccess();
    } catch {
      toast.error("Create failed");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-navy-deep text-cream hover:bg-navy">
          <Plus className="mr-2 h-4 w-4" /> New Shipment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Shipment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tracking Number</label>
            <Input
              required
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="SA1234567890"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Service</label>
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {SERVICES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="submit"
            className="w-full bg-amber text-navy-deep hover:bg-amber-soft"
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Create Shipment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ================================================================ */
/*  Full Edit Dialog (tabbed)                                       */
/* ================================================================ */

function ShipmentEditDialog({
  shipmentId,
  users,
  onSuccess,
}: {
  shipmentId: string;
  users: any[];
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <Edit2 className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[720px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" /> Edit Shipment
          </DialogTitle>
        </DialogHeader>
        {open && (
          <ShipmentEditTabs
            shipmentId={shipmentId}
            users={users}
            onSuccess={() => {
              onSuccess();
              setOpen(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ShipmentEditTabs({
  shipmentId,
  users,
  onSuccess,
}: {
  shipmentId: string;
  users: any[];
  onSuccess: () => void;
}) {
  const getDetail = useServerFn(adminGetShipmentDetail);
  const updateFnBase = useServerFn(adminUpdateShipment);
  const createEventFn = useServerFn(adminCreateShipmentEvent);
  const deleteEventFn = useServerFn(adminDeleteShipmentEvent);
  const qc = useQueryClient();

  const updateMut = useMutation({
    mutationFn: (data: Parameters<typeof updateFnBase>[0]) => updateFnBase(data),
    onMutate: async (newShip: any) => {
      await qc.cancelQueries({ queryKey: ["admin-shipments"] });
      await qc.cancelQueries({ queryKey: ["admin-shipment-detail", shipmentId] });

      const previousShipments = qc.getQueryData(["admin-shipments"]);
      const previousDetail = qc.getQueryData(["admin-shipment-detail", shipmentId]);

      qc.setQueryData(["admin-shipments"], (old: any) =>
        old?.map((s: any) => (s.id === newShip?.data?.id ? { ...s, ...(newShip?.data || {}) } : s)),
      );

      qc.setQueryData(["admin-shipment-detail", shipmentId], (old: any) => ({
        ...old,
        shipment: { ...old?.shipment, ...(newShip?.data || {}) },
      }));

      return { previousShipments, previousDetail };
    },
    onError: (_err, _newShip, context) => {
      if (context?.previousShipments)
        qc.setQueryData(["admin-shipments"], context.previousShipments);
      if (context?.previousDetail)
        qc.setQueryData(["admin-shipment-detail", shipmentId], context.previousDetail);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin-shipments"] });
      qc.invalidateQueries({ queryKey: ["admin-shipment-detail", shipmentId] });
    },
  });

  const updateFn = updateMut.mutateAsync;

  const detailQ = useQuery({
    queryKey: ["admin-shipment-detail", shipmentId],
    queryFn: () => getDetail({ data: { id: shipmentId } }),
    enabled: !!shipmentId,
  });

  const [saving, setSaving] = useState(false);

  if (detailQ.isLoading)
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  if (!detailQ.data)
    return <p className="py-8 text-center text-muted-foreground">Could not load shipment.</p>;

  const ship = detailQ.data.shipment as any;
  const events = detailQ.data.events as any[];

  return (
    <Tabs defaultValue="details" className="mt-2">
      <TabsList className="grid w-full grid-cols-6 h-auto">
        <TabsTrigger value="details" className="text-xs">
          <Settings className="h-3.5 w-3.5 mr-1.5" /> Details
        </TabsTrigger>
        <TabsTrigger value="locations" className="text-xs">
          <MapPin className="h-3.5 w-3.5 mr-1.5" /> Locations
        </TabsTrigger>
        <TabsTrigger value="package" className="text-xs">
          <Package className="h-3.5 w-3.5 mr-1.5" /> Package
        </TabsTrigger>
        <TabsTrigger value="events" className="text-xs">
          <History className="h-3.5 w-3.5 mr-1.5" /> History
        </TabsTrigger>
        <TabsTrigger value="telemetry" className="text-xs">
          <Navigation className="h-3.5 w-3.5 mr-1.5" /> Live Map
        </TabsTrigger>
        <TabsTrigger value="ai_risk" className="text-xs relative">
          <BrainCircuit className="h-3.5 w-3.5 mr-1.5" /> AI Risk
          {ship.ai_delay_risk > 0.5 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive animate-pulse" />
          )}
        </TabsTrigger>
        <TabsTrigger value="holds" className="text-xs">
          <ShieldCheck className="h-3.5 w-3.5 mr-1.5" /> Holds
        </TabsTrigger>
      </TabsList>

      {/* Tab 1: Details */}
      <TabsContent value="details">
        <DetailsTab ship={ship} users={users} updateFn={updateFn} onSuccess={onSuccess} />
      </TabsContent>

      {/* Tab 2: Locations */}
      <TabsContent value="locations">
        <LocationsTab ship={ship} updateFn={updateFn} onSuccess={onSuccess} />
      </TabsContent>

      {/* Tab 3: Package */}
      <TabsContent value="package">
        <PackageTab ship={ship} updateFn={updateFn} onSuccess={onSuccess} />
      </TabsContent>

      {/* Tab 4: Route History / Events */}
      <TabsContent value="events">
        <EventsTab
          shipmentId={shipmentId}
          events={events}
          createEventFn={createEventFn}
          deleteEventFn={deleteEventFn}
          onRefresh={() => detailQ.refetch()}
        />
      </TabsContent>

      {/* Tab 5: Telemetry / Live Map */}
      <TabsContent value="telemetry">
        <TelemetryTab ship={ship} onRefresh={() => detailQ.refetch()} />
      </TabsContent>

      {/* Tab 6: AI Risk */}
      <TabsContent value="ai_risk">
        <AIRiskTab ship={ship} updateFn={updateFn} onSuccess={onSuccess} />
      </TabsContent>

      {/* Tab 7: Holds */}
      <TabsContent value="holds">
        <HoldsTab shipmentId={shipmentId} trackingNumber={ship.tracking_number ?? ""} />
      </TabsContent>
    </Tabs>
  );
}

/* ---- Details Tab ---- */
function DetailsTab({
  ship,
  users,
  updateFn,
  onSuccess,
}: {
  ship: any;
  users: any[];
  updateFn: any;
  onSuccess: () => void;
}) {
  const [tracking, setTracking] = useState(ship.tracking_number ?? "");
  const [service, setService] = useState(ship.service ?? "Standard");
  const [status, setStatus] = useState(ship.status ?? "created");
  const [courier, setCourier] = useState(ship.assigned_courier_id ?? "");
  const [estDelivery, setEstDelivery] = useState(ship.estimated_delivery?.split("T")[0] ?? "");
  const [declaredValue, setDeclaredValue] = useState(ship.declared_value?.toString() ?? "0");
  const [insurance, setInsurance] = useState(ship.insurance ?? false);
  const [hazmat, setHazmat] = useState(ship.is_hazmat ?? false);
  const [sigRequired, setSigRequired] = useState(ship.signature_required ?? false);
  const [notes, setNotes] = useState(ship.notes ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await updateFn({
        data: {
          id: ship.id,
          tracking_number: tracking,
          service,
          status,
          assigned_courier_id: courier || null,
          estimated_delivery: estDelivery ? new Date(estDelivery).toISOString() : null,
          declared_value: parseFloat(declaredValue) || 0,
          insurance,
          is_hazmat: hazmat,
          signature_required: sigRequired,
          notes: notes || null,
        },
      });
      toast.success("Shipment details saved");
      onSuccess();
    } catch {
      toast.error("Save failed");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Tracking Number" value={tracking} onChange={setTracking} />
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Service
          </label>
          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {SERVICES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabels[s] || s}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Assigned Courier
          </label>
          <select
            value={courier}
            onChange={(e) => setCourier(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">-- Unassigned --</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.displayName} ({u.id.substring(0, 8)})
              </option>
            ))}
          </select>
        </div>
        <FormField
          label="Estimated Delivery"
          value={estDelivery}
          onChange={setEstDelivery}
          type="date"
        />
        <FormField
          label="Declared Value ($)"
          value={declaredValue}
          onChange={setDeclaredValue}
          type="number"
        />
      </div>

      <div className="flex flex-wrap gap-6 pt-2">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={insurance}
            onChange={(e) => setInsurance(e.target.checked)}
            className="rounded border-border"
          />{" "}
          Insurance
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={hazmat}
            onChange={(e) => setHazmat(e.target.checked)}
            className="rounded border-border"
          />{" "}
          Hazardous Material
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={sigRequired}
            onChange={(e) => setSigRequired(e.target.checked)}
            className="rounded border-border"
          />{" "}
          Signature Required
        </label>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Internal Notes
        </label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Admin-only notes..."
        />
      </div>

      <Button
        onClick={save}
        disabled={saving}
        className="w-full bg-amber text-navy-deep hover:bg-amber-soft"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}{" "}
        Save Details
      </Button>
    </div>
  );
}

/* ---- AI Risk Tab ---- */
function AIRiskTab({
  ship,
  updateFn,
  onSuccess,
}: {
  ship: any;
  updateFn: any;
  onSuccess: () => void;
}) {
  const [saving, setSaving] = useState(false);

  const handleAcknowledge = async () => {
    setSaving(true);
    try {
      await updateFn({ data: { id: ship.id, ai_delay_risk: 0, ai_delay_reason: null } });
      toast.success("Risk acknowledged and cleared");
      onSuccess();
    } catch {
      toast.error("Failed to clear risk");
    }
    setSaving(false);
  };

  const handleReroute = async () => {
    setSaving(true);
    try {
      await updateFn({
        data: {
          id: ship.id,
          ai_delay_risk: 0,
          ai_delay_reason: "Rerouted successfully",
          notes: (ship.notes || "") + "\nAI Risk detected, shipment rerouted manually.",
        },
      });
      toast.success("Shipment rerouted. Risk mitigated.");
      onSuccess();
    } catch {
      toast.error("Failed to reroute");
    }
    setSaving(false);
  };

  const risk = ship.ai_delay_risk ?? 0;

  return (
    <div className="space-y-6 pt-4">
      <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4 items-center text-center">
        <div
          className={`p-4 rounded-full ${risk > 0.5 ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}
        >
          <BrainCircuit className="h-10 w-10" />
        </div>
        <div>
          <h3 className="font-display text-xl font-bold">
            {risk > 0.5 ? "Elevated Delay Risk" : "No Active Risk Detected"}
          </h3>
          <p className="text-muted-foreground mt-2 text-sm max-w-md mx-auto">
            {ship.ai_delay_reason ||
              "The AI prediction engine indicates a clear route ahead with high confidence of on-time delivery."}
          </p>
        </div>

        {risk > 0.5 && (
          <div className="flex items-center gap-3 mt-4">
            <Button
              variant="outline"
              onClick={handleAcknowledge}
              disabled={saving}
              className="border-border"
            >
              Acknowledge (Clear)
            </Button>
            <Button
              onClick={handleReroute}
              disabled={saving}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {saving ? (
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <MapPin className="h-4 w-4 mr-2" />
              )}
              Initiate Reroute
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-secondary/50 p-4 border border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
            Risk Confidence
          </p>
          <p className="text-2xl font-mono">{(risk * 100).toFixed(1)}%</p>
        </div>
        <div className="rounded-xl bg-secondary/50 p-4 border border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
            Last Analysis
          </p>
          <p className="text-sm font-medium">{new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

/* ---- Locations Tab ---- */
function LocationsTab({
  ship,
  updateFn,
  onSuccess,
}: {
  ship: any;
  updateFn: any;
  onSuccess: () => void;
}) {
  const origin = (ship.origin ?? {}) as any;
  const dest = (ship.destination ?? {}) as any;

  const [oCity, setOCity] = useState(origin.city ?? "");
  const [oCountry, setOCountry] = useState(origin.country_code ?? "");
  const [oLine1, setOLine1] = useState(origin.line1 ?? "");
  const [oRegion, setORegion] = useState(origin.region ?? "");
  const [oPostal, setOPostal] = useState(origin.postal_code ?? "");
  const [oContact, setOContact] = useState(origin.contact_name ?? "");
  const [oPhone, setOPhone] = useState(origin.phone ?? "");
  const [oEmail, setOEmail] = useState(origin.email ?? "");

  const [dCity, setDCity] = useState(dest.city ?? "");
  const [dCountry, setDCountry] = useState(dest.country_code ?? "");
  const [dLine1, setDLine1] = useState(dest.line1 ?? "");
  const [dRegion, setDRegion] = useState(dest.region ?? "");
  const [dPostal, setDPostal] = useState(dest.postal_code ?? "");
  const [dContact, setDContact] = useState(dest.contact_name ?? "");
  const [dPhone, setDPhone] = useState(dest.phone ?? "");
  const [dEmail, setDEmail] = useState(dest.email ?? "");

  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await updateFn({
        data: {
          id: ship.id,
          origin: {
            ...origin,
            city: oCity,
            country_code: oCountry,
            line1: oLine1,
            region: oRegion,
            postal_code: oPostal,
            contact_name: oContact,
            phone: oPhone,
            email: oEmail,
          },
          destination: {
            ...dest,
            city: dCity,
            country_code: dCountry,
            line1: dLine1,
            region: dRegion,
            postal_code: dPostal,
            contact_name: dContact,
            phone: dPhone,
            email: dEmail,
          },
        },
      });
      toast.success("Locations saved");
      onSuccess();
    } catch {
      toast.error("Save failed");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 pt-4">
      <div>
        <h3 className="font-display font-bold text-base flex items-center gap-2 mb-3">
          <Navigation className="h-4 w-4 text-amber" /> Origin
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Contact Name" value={oContact} onChange={setOContact} />
          <FormField label="Phone" value={oPhone} onChange={setOPhone} />
          <FormField label="Email" value={oEmail} onChange={setOEmail} wide />
          <FormField label="Address Line 1" value={oLine1} onChange={setOLine1} wide />
          <FormField label="City" value={oCity} onChange={setOCity} />
          <FormField
            label="Country (ISO-2)"
            value={oCountry}
            onChange={(v) => setOCountry(v.toUpperCase().slice(0, 2))}
          />
          <FormField label="State / Region" value={oRegion} onChange={setORegion} />
          <FormField label="Postal Code" value={oPostal} onChange={setOPostal} />
        </div>
      </div>

      <hr className="border-border" />

      <div>
        <h3 className="font-display font-bold text-base flex items-center gap-2 mb-3">
          <MapPin className="h-4 w-4 text-amber" /> Destination
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Contact Name" value={dContact} onChange={setDContact} />
          <FormField label="Phone" value={dPhone} onChange={setDPhone} />
          <FormField label="Email" value={dEmail} onChange={setDEmail} wide />
          <FormField label="Address Line 1" value={dLine1} onChange={setDLine1} wide />
          <FormField label="City" value={dCity} onChange={setDCity} />
          <FormField
            label="Country (ISO-2)"
            value={dCountry}
            onChange={(v) => setDCountry(v.toUpperCase().slice(0, 2))}
          />
          <FormField label="State / Region" value={dRegion} onChange={setDRegion} />
          <FormField label="Postal Code" value={dPostal} onChange={setDPostal} />
        </div>
      </div>

      <Button
        onClick={save}
        disabled={saving}
        className="w-full bg-amber text-navy-deep hover:bg-amber-soft"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}{" "}
        Save Locations
      </Button>
    </div>
  );
}

/* ---- Package Tab ---- */
function PackageTab({
  ship,
  updateFn,
  onSuccess,
}: {
  ship: any;
  updateFn: any;
  onSuccess: () => void;
}) {
  const pkg = (ship.package ?? {}) as any;

  const [weight, setWeight] = useState(pkg.weight_kg?.toString() ?? "0");
  const [length, setLength] = useState(pkg.length_cm?.toString() ?? "0");
  const [width, setWidth] = useState(pkg.width_cm?.toString() ?? "0");
  const [height, setHeight] = useState(pkg.height_cm?.toString() ?? "0");
  const [pieces, setPieces] = useState(pkg.pieces?.toString() ?? "1");
  const [contents, setContents] = useState(pkg.contents ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await updateFn({
        data: {
          id: ship.id,
          package: {
            ...pkg,
            weight_kg: parseFloat(weight) || 0,
            length_cm: parseFloat(length) || 0,
            width_cm: parseFloat(width) || 0,
            height_cm: parseFloat(height) || 0,
            pieces: parseInt(pieces) || 1,
            contents,
          },
        },
      });
      toast.success("Package details saved");
      onSuccess();
    } catch {
      toast.error("Save failed");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Weight (kg)" value={weight} onChange={setWeight} type="number" />
        <FormField label="Pieces" value={pieces} onChange={setPieces} type="number" />
        <FormField label="Length (cm)" value={length} onChange={setLength} type="number" />
        <FormField label="Width (cm)" value={width} onChange={setWidth} type="number" />
        <FormField label="Height (cm)" value={height} onChange={setHeight} type="number" />
        <FormField label="Contents Description" value={contents} onChange={setContents} />
      </div>

      <div className="rounded-lg bg-secondary/50 p-3 text-sm text-muted-foreground">
        <p>
          <strong>Volumetric Weight:</strong>{" "}
          {(
            ((parseFloat(length) || 0) * (parseFloat(width) || 0) * (parseFloat(height) || 0)) /
            5000
          ).toFixed(2)}{" "}
          kg
        </p>
        <p>
          <strong>Chargeable Weight:</strong>{" "}
          {Math.max(
            parseFloat(weight) || 0,
            ((parseFloat(length) || 0) * (parseFloat(width) || 0) * (parseFloat(height) || 0)) /
              5000,
          ).toFixed(2)}{" "}
          kg
        </p>
      </div>

      <Button
        onClick={save}
        disabled={saving}
        className="w-full bg-amber text-navy-deep hover:bg-amber-soft"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}{" "}
        Save Package
      </Button>
    </div>
  );
}

/* ---- Events/Route History Tab ---- */
function EventsTab({
  shipmentId,
  events,
  createEventFn,
  deleteEventFn,
  onRefresh,
}: {
  shipmentId: string;
  events: any[];
  createEventFn: any;
  deleteEventFn: any;
  onRefresh: () => void;
}) {
  const [newStatus, setNewStatus] = useState("in_transit");
  const [newDesc, setNewDesc] = useState("");
  const [newLoc, setNewLoc] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 16));
  const [adding, setAdding] = useState(false);

  const addEvent = async () => {
    if (!newDesc.trim()) {
      toast.error("Description is required");
      return;
    }
    setAdding(true);
    try {
      await createEventFn({
        data: {
          shipment_id: shipmentId,
          status: newStatus,
          description: newDesc,
          location: newLoc || null,
          occurred_at: new Date(newDate).toISOString(),
        },
      });
      toast.success("Event added");
      setNewDesc("");
      setNewLoc("");
      onRefresh();
    } catch {
      toast.error("Failed to add event");
    }
    setAdding(false);
  };

  const removeEvent = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    try {
      await deleteEventFn({ data: { id } });
      toast.success("Event deleted");
      onRefresh();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-5 pt-4">
      {/* Add new event form */}
      <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
        <h4 className="text-sm font-bold flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Route Stop / Event
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabels[s] || s}
                </option>
              ))}
            </select>
          </div>
          <FormField label="Location / Facility" value={newLoc} onChange={setNewLoc} />
          <FormField label="Description" value={newDesc} onChange={setNewDesc} wide />
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Date &amp; Time
            </label>
            <Input
              type="datetime-local"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </div>
        </div>
        <Button
          onClick={addEvent}
          disabled={adding}
          size="sm"
          className="bg-navy-deep text-cream hover:bg-navy"
        >
          {adding ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}{" "}
          Add Event
        </Button>
      </div>

      {/* Events list */}
      <div className="space-y-1">
        <h4 className="text-sm font-bold mb-3">Route History ({events.length} events)</h4>
        {events.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">No events recorded yet.</p>
        )}
        <div className="relative border-l-2 border-border ml-3 space-y-4">
          {events.map((ev, i) => (
            <div key={ev.id} className="relative pl-6 group">
              <span
                className={`absolute -left-[9px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-background ${i === 0 ? "bg-amber" : "bg-muted-foreground/30"}`}
              />
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{ev.description}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <Badge variant="secondary" className="text-[10px] h-5">
                      {statusLabels[ev.status] || ev.status}
                    </Badge>
                    {ev.location && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {ev.location}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(ev.occurred_at).toLocaleString()}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={() => removeEvent(ev.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---- Shared Form Field ---- */
function FormField({
  label,
  value,
  onChange,
  type = "text",
  wide,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  wide?: boolean;
}) {
  return (
    <div className={`space-y-1.5 ${wide ? "col-span-2" : ""}`}>
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
        {label}
      </label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10"
      />
    </div>
  );
}

/* ---- Telemetry Tab ---- */
function TelemetryTab({ ship, onRefresh }: { ship: any; onRefresh: () => void }) {
  const [lat, setLat] = useState(ship.telemetry?.lat?.toString() ?? "");
  const [lng, setLng] = useState(ship.telemetry?.lng?.toString() ?? "");
  const [speed, setSpeed] = useState(ship.telemetry?.speed?.toString() ?? "");
  const [heading, setHeading] = useState(ship.telemetry?.heading ?? "");
  const [saving, setSaving] = useState(false);

  const updateTelemetryFn = useServerFn(adminUpdateShipmentTelemetry);

  const save = async () => {
    if (!lat || !lng) {
      toast.error("Latitude and Longitude are required.");
      return;
    }
    setSaving(true);
    try {
      await updateTelemetryFn({
        data: {
          shipment_id: ship.id,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          speed: speed ? parseFloat(speed) : undefined,
          heading: heading || undefined,
        },
      });
      toast.success("Telemetry updated.");
      onRefresh();
    } catch {
      toast.error("Failed to update telemetry.");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Latitude" type="number" value={lat} onChange={setLat} />
        <FormField label="Longitude" type="number" value={lng} onChange={setLng} />
        <FormField label="Speed (km/h)" type="number" value={speed} onChange={setSpeed} />
        <FormField label="Heading" value={heading} onChange={setHeading} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button onClick={save} disabled={saving} className="min-w-32">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Navigation className="h-4 w-4 mr-2" />
          )}
          Update Live Location
        </Button>
      </div>

      <div className="mt-6 rounded-md bg-muted p-4 border border-border">
        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-amber" /> What does this do?
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Updating these coordinates will move the live tracking marker for customers viewing this
          shipment's tracking page. If you leave <strong>Speed</strong> and <strong>Heading</strong>{" "}
          empty, the map will use default animations between points.
        </p>
      </div>
    </div>
  );
}

const HOLD_REASONS = [
  "Customs Inspection Required",
  "Missing Commercial Invoice",
  "Restricted/Prohibited Goods",
  "Tax/Duty Unpaid",
  "Incomplete Declaration",
  "Security Screening",
  "Other",
];

const REQUIRED_DOCUMENTS = [
  "Commercial Invoice",
  "Certificate of Origin",
  "Packing List",
  "Import License",
  "Tax Identification Number (TIN)",
  "Proof of Payment",
  "Other",
];

/* ---- Holds Tab ---- */
function HoldsTab({ shipmentId, trackingNumber }: { shipmentId: string; trackingNumber: string }) {
  const getHolds = useServerFn(adminGetCustomsHolds);
  const createHold = useServerFn(adminCreateCustomsHold);
  const releaseHold = useServerFn(adminReleaseCustomsHold);
  const qc = useQueryClient();

  const holdsQ = useQuery({
    queryKey: ["admin-shipment-holds", shipmentId],
    queryFn: () => getHolds({ data: { shipment_id: shipmentId } }),
  });

  const [reason, setReason] = useState("");
  const [authority, setAuthority] = useState("");
  const [requiredAction, setRequiredAction] = useState("");
  const [chargeCat, setChargeCat] = useState("other");
  const [amount, setAmount] = useState("0");
  const [currency, setCurrency] = useState("USD");
  const [releaseConfirmId, setReleaseConfirmId] = useState<string | null>(null);

  const addHoldMut = useMutation({
    mutationFn: (data: Parameters<typeof createHold>[0]) => createHold(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-shipment-holds", shipmentId] });
      qc.invalidateQueries({ queryKey: ["admin-shipment-detail", shipmentId] });
      qc.invalidateQueries({ queryKey: ["admin-shipments"] });
      setReason("");
      setAuthority("");
      setRequiredAction("");
      setAmount("0");
      toast.success("Shipment placed on hold — status updated to Exception");
    },
    onError: (err: any) => toast.error(err?.message || "Failed to place hold"),
  });

  const releaseMut = useMutation({
    mutationFn: (data: Parameters<typeof releaseHold>[0]) => releaseHold(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-shipment-holds", shipmentId] });
      qc.invalidateQueries({ queryKey: ["admin-shipment-detail", shipmentId] });
      qc.invalidateQueries({ queryKey: ["admin-shipments"] });
      setReleaseConfirmId(null);
      toast.success("Hold released — shipment returned to In Transit");
    },
    onError: (err: any) => toast.error(err?.message || "Failed to release hold"),
  });

  if (holdsQ.isLoading)
    return (
      <div className="py-8 text-center text-muted-foreground">
        <Loader2 className="animate-spin inline mr-2 h-4 w-4" /> Loading holds...
      </div>
    );

  if (holdsQ.isError)
    return (
      <div className="py-8 text-center text-destructive text-sm">
        Failed to load holds. Check your connection.
      </div>
    );

  const holds = holdsQ.data || [];
  const activeHolds = holds.filter((h: any) => h.status === "open" || h.status === "payment_required");

  return (
    <div className="space-y-6 pt-4">
      {/* Active holds banner */}
      {activeHolds.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
          <ShieldCheck className="h-5 w-5 text-red-500 shrink-0" />
          <span>
            <strong>{activeHolds.length} active hold{activeHolds.length > 1 ? "s" : ""}</strong> on this shipment.
            {trackingNumber && ` Tracking: ${trackingNumber}`}
          </span>
        </div>
      )}

      {/* Place Hold Form */}
      <div className="border border-border rounded-xl p-5 bg-secondary/20">
        <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-destructive" /> Place Shipment on Hold
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Reason for Hold <span className="text-destructive">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="" disabled>Select reason</option>
              {HOLD_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Customs Authority <span className="text-destructive">*</span>
            </label>
            <input
              value={authority}
              onChange={(e) => setAuthority(e.target.value)}
              placeholder="e.g. HMRC, CBP, SON"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Charge Category
            </label>
            <select
              value={chargeCat}
              onChange={(e) => setChargeCat(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="other">Other</option>
              <option value="customs_clearance">Customs Clearance</option>
              <option value="customs_duty">Customs Duty</option>
              <option value="inspection_fee">Inspection Fee</option>
              <option value="storage_fee">Storage Fee</option>
              <option value="vat">VAT</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
              <option value="EUR">EUR</option>
              <option value="NGN">NGN</option>
              <option value="GHS">GHS</option>
            </select>
          </div>

          <FormField
            label="Amount Due"
            type="number"
            value={amount}
            onChange={setAmount}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Required Documents
            </label>
            <select
              value={requiredAction}
              onChange={(e) => setRequiredAction(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">None / N/A</option>
              {REQUIRED_DOCUMENTS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            className="bg-amber text-navy-deep hover:bg-amber-soft"
            disabled={addHoldMut.isPending || !reason || !authority}
            onClick={() => {
              addHoldMut.mutate({
                data: {
                  shipment_id: shipmentId,
                  customs_authority: authority,
                  hold_reason: reason,
                  required_action: requiredAction || undefined,
                  charge_category: chargeCat as any,
                  amount_due: parseFloat(amount) || 0,
                  currency,
                },
              });
            }}
          >
            {addHoldMut.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="mr-2 h-4 w-4" />
            )}
            Place Hold
          </Button>
        </div>
      </div>

      {/* Holds List */}
      <div>
        <h4 className="font-semibold text-sm mb-4">
          Active &amp; Past Holds
          {holds.length > 0 && (
            <span className="ml-2 text-xs text-muted-foreground font-normal">
              ({holds.length} total)
            </span>
          )}
        </h4>
        {holds.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8 border border-dashed border-border rounded-xl">
            No holds on record for this shipment.
          </div>
        ) : (
          <div className="space-y-3">
            {holds.map((h: any) => (
              <div
                key={h.id}
                className="border border-border rounded-xl p-4 bg-card shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge
                        variant={h.status === "open" || h.status === "payment_required" ? "destructive" : "outline"}
                        className="text-[10px] uppercase shrink-0"
                      >
                        {h.status?.replace(/_/g, " ")}
                      </Badge>
                      <span className="font-semibold text-sm">{h.hold_reason}</span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      {h.customs_authority && (
                        <div>Authority: <span className="font-medium text-foreground">{h.customs_authority}</span></div>
                      )}
                      {(h.amount_due > 0) && (
                        <div>
                          Charge: <span className="font-medium text-foreground">
                            {h.currency} {Number(h.amount_due).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                          {h.charge_category && ` (${h.charge_category.replace(/_/g, " ")})`}
                        </div>
                      )}
                      {h.required_action && (
                        <div>Required: <span className="font-medium text-foreground">{h.required_action}</span></div>
                      )}
                      {h.payment_status && h.payment_status !== "pending" && (
                        <div>Payment: <span className="font-medium text-foreground capitalize">{h.payment_status.replace(/_/g, " ")}</span></div>
                      )}
                      <div className="text-[10px] text-muted-foreground mt-1">
                        Created: {new Date(h.created_at).toLocaleString()}
                        {h.released_at && ` · Released: ${new Date(h.released_at).toLocaleString()}`}
                      </div>
                    </div>
                  </div>

                  {(h.status === "open" || h.status === "payment_required") && (
                    <div className="shrink-0">
                      {releaseConfirmId === h.id ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={releaseMut.isPending}
                            onClick={() =>
                              releaseMut.mutate({ data: { hold_id: h.id, shipment_id: shipmentId } })
                            }
                          >
                            {releaseMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirm"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setReleaseConfirmId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={releaseMut.isPending}
                          onClick={() => setReleaseConfirmId(h.id)}
                        >
                          <Unlock className="mr-2 h-4 w-4" /> Release
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
