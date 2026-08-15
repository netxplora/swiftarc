/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAdminShipments } from "@/lib/admin.functions";
import { Package2, Search, Filter, ArrowUpRight, Truck, CheckCircle2, Clock } from "lucide-react";
import { useState } from "react";
import { statusLabels } from "@/lib/types";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({ meta: [{ title: "Orders Management — Admin SwiftArc" }] }),
  component: AdminOrdersPage,
});

function AdminOrdersPage() {
  const fetchShipments = useServerFn(listAdminShipments);
  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => fetchShipments(),
  });

  const [search, setSearch] = useState("");
  const filtered = shipments.filter(
    (s) =>
      s.tracking_number.toLowerCase().includes(search.toLowerCase()) ||
      s.service.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Orders Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor order status, dispatch assignments, and operational compliance.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter orders by tracking number or service..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 h-10 rounded-md border border-input bg-background text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/50 text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Tracking #</th>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Origin → Destination</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No orders matching query.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-foreground">
                      {s.tracking_number}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{s.service}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {(s.origin as any)?.city || "Origin"} →{" "}
                      {(s.destination as any)?.city || "Destination"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.status === "delivered" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-amber/10 text-amber"}`}
                      >
                        {statusLabels[s.status as keyof typeof statusLabels] || s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
