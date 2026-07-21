import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, Filter, Download, RefreshCw, Loader2, Printer,
  Package, Truck, CheckCircle2, AlertTriangle, MapPin,
  ArrowRight, Calendar, Clock, Eye, ChevronDown, BarChart3,
  FileText, MoreHorizontal
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { listMyShipments } from "@/lib/api.functions";
import { statusLabels, type ShipmentStatus } from "@/lib/types";
import {
  generateShippingLabel, generateCommercialInvoice, generateCustomsDeclaration,
  generateShippingReceipt, generateDeliveryConfirmation, generateShipmentCertificate
} from "@/lib/pdf";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/shipments")({
  component: ShipmentsPage,
});

const statusFilters: Array<ShipmentStatus | "all"> = [
  "all", "label_created", "picked_up", "in_transit", "out_for_delivery", "delivered", "exception",
];

const statusIcons: Record<string, typeof Package> = {
  label_created: FileText,
  picked_up: Package,
  in_transit: Truck,
  out_for_delivery: MapPin,
  delivered: CheckCircle2,
  exception: AlertTriangle,
};

const statusColors: Record<string, string> = {
  label_created: "bg-muted text-muted-foreground",
  picked_up: "bg-amber/15 text-amber",
  in_transit: "bg-sky-500/15 text-sky-600",
  out_for_delivery: "bg-violet-500/15 text-violet-600",
  delivered: "bg-success/15 text-success",
  exception: "bg-destructive/15 text-destructive",
};

const statusDotColors: Record<string, string> = {
  label_created: "bg-muted-foreground",
  picked_up: "bg-amber",
  in_transit: "bg-sky-500",
  out_for_delivery: "bg-violet-500",
  delivered: "bg-success",
  exception: "bg-destructive",
};

function formatRelative(iso: string, nowMs: number) {
  const diff = nowMs - new Date(iso).getTime();
  const s = Math.round(Math.abs(diff) / 1000);
  const past = diff >= 0;
  if (s < 60) return past ? `${s}s ago` : `in ${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return past ? `${m}m ago` : `in ${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return past ? `${h}h ago` : `in ${h}h`;
  const d = Math.round(h / 24);
  return past ? `${d}d ago` : `in ${d}d`;
}

function buildPdfInput(s: any) {
  const o = s.origin_raw ?? {};
  const d = s.destination_raw ?? {};
  return {
    trackingNumber: s.trackingNumber,
    service: s.service,
    pieces: s.package?.pieces ?? 1,
    weightKg: s.package?.weight_kg ?? 0,
    dimensions: `${s.package?.length_cm ?? 0} × ${s.package?.width_cm ?? 0} × ${s.package?.height_cm ?? 0} cm`,
    declaredValue: 0,
    origin: {
      contact: o.contact_name ?? "Sender",
      line1: o.line1 ?? "",
      city: o.city ?? "",
      zip: o.postal_code ?? "",
      country: o.country_code ?? o.country ?? "",
      phone: o.phone ?? "",
      email: o.email,
    },
    destination: {
      contact: d.contact_name ?? "Receiver",
      line1: d.line1 ?? "",
      city: d.city ?? "",
      zip: d.postal_code ?? "",
      country: d.country_code ?? d.country ?? "",
      phone: d.phone ?? "",
      email: d.email,
    },
  };
}

function ShipmentsPage() {
  const fetchShipments = useServerFn(listMyShipments);
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ShipmentStatus | "all">("all");
  const [now, setNow] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  const { data, isLoading, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ["shipments"],
    queryFn: () => fetchShipments(),
    staleTime: Infinity,
  });

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 30_000);

    const channel = supabase
      .channel("schema-db-changes-shipments-page")
      .on("postgres_changes", { event: "*", schema: "public", table: "shipments" }, () =>
        qc.invalidateQueries({ queryKey: ["shipments"] })
      )
      .subscribe();

    return () => {
      clearInterval(id);
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter((s) => {
      if (filter !== "all" && s.status !== filter) return false;
      if (!q) return true;
      return (
        s.trackingNumber.toLowerCase().includes(q) ||
        s.recipient.toLowerCase().includes(q) ||
        s.destination.toLowerCase().includes(q) ||
        s.origin.toLowerCase().includes(q) ||
        s.service.toLowerCase().includes(q)
      );
    });
  }, [data, query, filter]);

  // Status breakdown counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (data ?? []).forEach((s) => {
      counts[s.status] = (counts[s.status] ?? 0) + 1;
    });
    return counts;
  }, [data]);

  const exportCsv = () => {
    const rows = [["Tracking", "Route", "Recipient", "Service", "Status", "ETA", "Created"]].concat(
      list.map((s) => [
        s.trackingNumber,
        `${s.origin} -> ${s.destination}`,
        s.recipient,
        s.service,
        s.statusLabel,
        s.estimatedDelivery,
        new Date(s.lastUpdate).toLocaleDateString(),
      ])
    );
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `shipments-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const activeCount = (data ?? []).filter(
    (s) => s.status !== "delivered" && s.status !== "exception"
  ).length;
  const deliveredCount = statusCounts["delivered"] ?? 0;
  const exceptionCount = statusCounts["exception"] ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Shipments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading
              ? "Loading shipments…"
              : `${list.length} of ${data?.length ?? 0} shipments`}
            {dataUpdatedAt > 0 && now !== null && (
              <>
                {" "}
                · updated {formatRelative(new Date(dataUpdatedAt).toISOString(), now)}
              </>
            )}
            {isFetching && !isLoading && (
              <span className="ml-2 inline-flex items-center gap-1 text-amber text-xs">
                <Loader2 className="h-3 w-3 animate-spin" /> syncing
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => qc.invalidateQueries({ queryKey: ["shipments"] })}
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <div className="hidden sm:flex border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-2 text-xs font-medium transition-colors ${viewMode === "table" ? "bg-navy-deep text-cream" : "bg-card hover:bg-secondary"}`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`px-3 py-2 text-xs font-medium transition-colors ${viewMode === "cards" ? "bg-navy-deep text-cream" : "bg-card hover:bg-secondary"}`}
            >
              <Package className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Package className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-widest">Total</span>
          </div>
          <p className="font-display text-2xl font-bold">{data?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">All shipments</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 text-sky-600 mb-2">
            <Truck className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-widest">Active</span>
          </div>
          <p className="font-display text-2xl font-bold">{activeCount}</p>
          <p className="text-xs text-muted-foreground mt-1">In progress</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 text-success mb-2">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-widest">Delivered</span>
          </div>
          <p className="font-display text-2xl font-bold">{deliveredCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Completed</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 text-destructive mb-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-widest">Exceptions</span>
          </div>
          <p className="font-display text-2xl font-bold">{exceptionCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
        </motion.div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tracking, recipient, city, or service…"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {statusFilters.map((s) => {
            const count = s === "all" ? (data?.length ?? 0) : (statusCounts[s] ?? 0);
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                  filter === s
                    ? "border-navy-deep bg-navy-deep text-cream shadow-sm"
                    : "border-border bg-card hover:bg-secondary"
                }`}
              >
                {s !== "all" && (
                  <span className={`h-2 w-2 rounded-full ${statusDotColors[s] ?? "bg-muted-foreground"}`} />
                )}
                {s === "all" ? "All" : statusLabels[s]}
                <span className={`ml-0.5 text-[10px] rounded-full px-1.5 py-0.5 ${
                  filter === s ? "bg-cream/20 text-cream" : "bg-secondary text-muted-foreground"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table View */}
      {viewMode === "table" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tracking</th>
                  <th className="px-4 py-3 font-semibold">Route</th>
                  <th className="hidden px-4 py-3 font-semibold md:table-cell">Service</th>
                  <th className="hidden px-4 py-3 font-semibold lg:table-cell">ETA</th>
                  <th className="px-4 py-3 font-semibold">Progress</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <AnimatePresence>
                  {list.map((s, i) => {
                    const Icon = statusIcons[s.status] ?? Package;
                    return (
                      <motion.tr
                        key={s.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="group hover:bg-secondary/40 transition-colors"
                      >
                        <td className="px-4 py-3.5">
                          <Link
                            to="/tracking/$trackingId"
                            params={{ trackingId: s.trackingNumber }}
                            className="inline-flex flex-col gap-0.5 group/link"
                          >
                            <span className="font-mono text-xs font-semibold text-navy-deep group-hover/link:text-amber transition-colors">
                              {s.trackingNumber}
                            </span>
                            {s.recipient && (
                              <span className="text-[11px] text-muted-foreground">
                                {s.recipient}
                              </span>
                            )}
                          </Link>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="truncate max-w-[80px] sm:max-w-[120px]">{s.origin}</span>
                            <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                            <span className="truncate max-w-[80px] sm:max-w-[120px]">{s.destination}</span>
                          </div>
                        </td>
                        <td className="hidden px-4 py-3.5 md:table-cell">
                          <span className="text-sm text-muted-foreground">{s.service}</span>
                        </td>
                        <td className="hidden px-4 py-3.5 lg:table-cell">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                            <span>{new Date(s.estimatedDelivery).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3 min-w-[100px]">
                            <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                              <motion.div
                                className={`h-full rounded-full ${
                                  s.status === "exception" ? "bg-destructive" :
                                  s.status === "delivered" ? "bg-success" :
                                  "bg-amber"
                                }`}
                                initial={{ width: 0 }}
                                animate={{ width: `${s.progress}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                              />
                            </div>
                            <span className="text-[11px] font-mono text-muted-foreground w-8 text-right">
                              {s.progress}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              statusColors[s.status] ?? "bg-secondary"
                            }`}
                          >
                            <Icon className="h-3 w-3" />
                            {s.statusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              to="/tracking/$trackingId"
                              params={{ trackingId: s.trackingNumber }}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-navy-deep transition-colors"
                              title="View Details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Link>
                            <button
                              onClick={() => {
                                generateCommercialInvoice(buildPdfInput(s));
                                toast.success("Invoice downloaded");
                              }}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-amber transition-colors"
                              title="Download Invoice"
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                generateShippingLabel({
                                  ...s,
                                  tracking_number: s.trackingNumber,
                                  origin: s.origin_raw,
                                  destination: s.destination_raw,
                                })
                              }
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-navy-deep transition-colors"
                              title="Print Waybill"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </button>
                            <Popover>
                              <PopoverTrigger asChild>
                                <button
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-navy-deep transition-colors"
                                  title="More Documents"
                                >
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent align="end" className="w-48 p-1">
                                <button onClick={() => { generateShippingReceipt({ ...s, tracking_number: s.trackingNumber, origin: s.origin_raw, destination: s.destination_raw }); toast.success("Shipping receipt downloaded"); }} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-secondary">Shipping Receipt</button>
                                <button onClick={() => { generateDeliveryConfirmation({ ...s, tracking_number: s.trackingNumber, destination: s.destination_raw }); toast.success("Delivery confirmation downloaded"); }} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-secondary">Delivery Confirmation</button>
                                <button onClick={() => { generateCustomsDeclaration({ trackingNumber: s.trackingNumber, weightKg: s.package?.weight_kg ?? 1, pieces: s.package?.pieces ?? 1, declaredValue: 0, origin: buildPdfInput(s).origin, destination: buildPdfInput(s).destination }); toast.success("Customs declaration downloaded"); }} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-secondary">Customs Declaration</button>
                                <button onClick={() => { generateShipmentCertificate({ ...s, tracking_number: s.trackingNumber, origin: s.origin_raw, destination: s.destination_raw }); toast.success("Certificate downloaded"); }} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-secondary">Shipment Certificate</button>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
                {list.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <Package className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">No shipments match your filters</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Try adjusting your search or clearing the filter
                      </p>
                      {filter !== "all" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-3"
                          onClick={() => {
                            setFilter("all");
                            setQuery("");
                          }}
                        >
                          Clear Filters
                        </Button>
                      )}
                    </td>
                  </tr>
                )}
                {isLoading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Loading your shipments…</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Cards View (mobile-first) */}
      {viewMode === "cards" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <AnimatePresence>
            {list.map((s, i) => {
              const Icon = statusIcons[s.status] ?? Package;
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow group"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <Link
                        to="/tracking/$trackingId"
                        params={{ trackingId: s.trackingNumber }}
                        className="font-mono text-sm font-bold text-navy-deep hover:text-amber transition-colors"
                      >
                        {s.trackingNumber}
                      </Link>
                      {s.recipient && (
                        <p className="text-xs text-muted-foreground mt-0.5">{s.recipient}</p>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        statusColors[s.status] ?? "bg-secondary"
                      }`}
                    >
                      <Icon className="h-3 w-3" />
                      {s.statusLabel}
                    </span>
                  </div>

                  {/* Route */}
                  <div className="flex items-center gap-2 text-sm mb-4">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{s.origin}</span>
                    <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <span className="truncate">{s.destination}</span>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">{s.service}</span>
                      <span className="font-mono font-semibold">{s.progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          s.status === "exception" ? "bg-destructive" :
                          s.status === "delivered" ? "bg-success" :
                          "bg-amber"
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${s.progress}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      ETA {new Date(s.estimatedDelivery).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Link
                        to="/tracking/$trackingId"
                        params={{ trackingId: s.trackingNumber }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-navy-deep transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={() => {
                          generateCommercialInvoice(buildPdfInput(s));
                          toast.success("Invoice downloaded");
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-amber transition-colors"
                        title="Download Invoice"
                      >
                        <FileText className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          generateShippingLabel({
                            ...s,
                            tracking_number: s.trackingNumber,
                            origin: s.origin_raw,
                            destination: s.destination_raw,
                          })
                        }
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-navy-deep transition-colors"
                        title="Print Waybill"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </button>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-navy-deep transition-colors"
                            title="More Documents"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-48 p-1">
                          <button onClick={() => { generateShippingReceipt({ ...s, tracking_number: s.trackingNumber, origin: s.origin_raw, destination: s.destination_raw }); toast.success("Shipping receipt downloaded"); }} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-secondary">Shipping Receipt</button>
                          <button onClick={() => { generateDeliveryConfirmation({ ...s, tracking_number: s.trackingNumber, destination: s.destination_raw }); toast.success("Delivery confirmation downloaded"); }} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-secondary">Delivery Confirmation</button>
                          <button onClick={() => { generateCustomsDeclaration({ trackingNumber: s.trackingNumber, weightKg: s.package?.weight_kg ?? 1, pieces: s.package?.pieces ?? 1, declaredValue: 0, origin: buildPdfInput(s).origin, destination: buildPdfInput(s).destination }); toast.success("Customs declaration downloaded"); }} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-secondary">Customs Declaration</button>
                          <button onClick={() => { generateShipmentCertificate({ ...s, tracking_number: s.trackingNumber, origin: s.origin_raw, destination: s.destination_raw }); toast.success("Certificate downloaded"); }} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-secondary">Shipment Certificate</button>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {list.length === 0 && !isLoading && (
            <div className="col-span-full py-16 text-center">
              <Package className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No shipments match your filters</p>
              {filter !== "all" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setFilter("all");
                    setQuery("");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Mobile: always show cards on small screens */}
      <div className="sm:hidden">
        {viewMode === "table" && list.length > 0 && (
          <p className="text-center text-xs text-muted-foreground py-2">
            Scroll the table horizontally, or{" "}
            <button onClick={() => setViewMode("cards")} className="text-amber hover:underline font-medium">
              switch to card view
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
