import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, Filter, Download, RefreshCw, Loader2, Printer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { listMyShipments } from "@/lib/api.functions";
import { statusLabels, type ShipmentStatus } from "@/lib/types";
import { generateShippingLabel } from "@/lib/pdf";

export const Route = createFileRoute("/dashboard/shipments")({
  component: ShipmentsPage,
});

const statusFilters: Array<ShipmentStatus | "all"> = [
  "all", "in_transit", "out_for_delivery", "delivered", "exception",
];

function formatRelative(iso: string, nowMs: number) {
  const diff = nowMs - new Date(iso).getTime();
  const s = Math.round(Math.abs(diff) / 1000);
  const past = diff >= 0;
  if (s < 60) return past ? `${s}s ago` : `in ${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return past ? `${m}m ago` : `in ${m}m`;
  const h = Math.round(m / 60);
  return past ? `${h}h ago` : `in ${h}h`;
}

function ShipmentsPage() {
  const fetchShipments = useServerFn(listMyShipments);
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ShipmentStatus | "all">("all");
  const [now, setNow] = useState<number | null>(null);

  const { data, isLoading, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ["shipments"],
    queryFn: () => fetchShipments(),
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter((s) => {
      if (filter !== "all" && s.status !== filter) return false;
      if (!q) return true;
      return s.trackingNumber.toLowerCase().includes(q)
        || s.recipient.toLowerCase().includes(q)
        || s.destination.toLowerCase().includes(q);
    });
  }, [data, query, filter]);

  const exportCsv = () => {
    const rows = [["Tracking", "Route", "Service", "Status", "ETA", "Confidence"]]
      .concat(list.map((s) => [
        s.trackingNumber, `${s.origin} -> ${s.destination}`, s.service,
        s.statusLabel, s.estimatedDelivery, `${s.onTimeConfidence}%`,
      ]));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `shipments-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const nextUpdateAt = data?.reduce<number | null>((min, s) => {
    const t = new Date(s.nextUpdateAt).getTime();
    return min == null || t < min ? t : min;
  }, null);
  const nextIn = nextUpdateAt && now !== null ? Math.max(0, Math.round((nextUpdateAt - now) / 1000)) : null;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Shipments</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading…" : `${list.length} of ${data?.length ?? 0} shown`}
            {dataUpdatedAt > 0 && now !== null && <> · updated {formatRelative(new Date(dataUpdatedAt).toISOString(), now)}</>}
            {nextIn != null && <> · next refresh {nextIn}s</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["shipments"] })}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm hover:bg-secondary"
            aria-label="Refresh now"
          >
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </button>
          <button onClick={exportCsv} className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm hover:bg-secondary">
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tracking, recipient, city" className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === s ? "border-navy-deep bg-navy-deep text-cream" : "border-border bg-card hover:bg-secondary"
            }`}>
              <Filter className="h-3 w-3" />
              {s === "all" ? "All" : statusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Tracking</th>
              <th className="px-4 py-3">Route</th>
              <th className="hidden px-4 py-3 md:table-cell">Service</th>
              <th className="hidden px-4 py-3 lg:table-cell">Last update</th>
              <th className="hidden px-4 py-3 lg:table-cell">Next update</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.map((s) => {
              const nextSec = now ? Math.max(0, Math.round((new Date(s.nextUpdateAt).getTime() - now) / 1000)) : null;
              return (
                <tr key={s.id} className="hover:bg-secondary/40">
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link to="/tracking/$trackingId" params={{ trackingId: s.trackingNumber }} className="hover:text-amber">
                      {s.trackingNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{s.origin} → {s.destination}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{s.service}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{now ? formatRelative(s.lastUpdate, now) : "—"}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                    {now !== null ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-amber" />
                        in {nextSec}s
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      s.status === "exception" ? "bg-destructive/10 text-destructive" :
                      s.status === "delivered" ? "bg-success/15 text-success" :
                      "bg-secondary"
                    }`}>{s.statusLabel}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => generateShippingLabel({
                        ...s,
                        tracking_number: s.trackingNumber,
                        origin: s.origin_raw,
                        destination: s.destination_raw
                      })}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-navy-deep"
                      title="Print Waybill"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {list.length === 0 && !isLoading && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">No shipments match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
