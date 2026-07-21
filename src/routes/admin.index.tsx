import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminOverview } from "@/lib/admin.functions";
import { Users, Package2, Truck, Receipt, MessageSquare, ArrowUpRight, ArrowDownRight, CreditCard, Activity, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { statusLabels } from "@/lib/types";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin overview — SwiftArc" }, { name: "robots", content: "noindex" }] }),
  component: AdminOverview,
});

function AdminOverview() {
  const fn = useServerFn(adminOverview);
  const { data: adminData, isLoading } = useQuery({ queryKey: ["admin-overview"], queryFn: () => fn(), staleTime: Infinity });
  const qc = useQueryClient();

  useEffect(() => {
    // Monitor all major tables for admin level live sync
    const tables = ['shipments', 'pickups', 'invoices', 'profiles', 'payment_transactions', 'chat_conversations'];
    
    const channels = tables.map(table => 
      supabase
        .channel(`admin-db-changes-${table}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          () => qc.invalidateQueries({ queryKey: ["admin-overview"] })
        )
        .subscribe()
    );

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [qc]);

  const fmt = (n: number) => new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);

  const stats = [
    { label: "Gross Revenue", value: fmt(adminData?.revenue.gross ?? 0), Icon: Activity, color: "text-emerald-600", bg: "bg-emerald-500/10" },
    { label: "Outstanding", value: fmt(adminData?.revenue.outstanding ?? 0), Icon: CreditCard, color: "text-amber", bg: "bg-amber/10" },
    { label: "Total Users", value: (adminData?.counts.users ?? 0).toLocaleString(), Icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Active Shipments", value: (adminData?.counts.shipments ?? 0).toLocaleString(), Icon: Package2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Live Chats", value: (adminData?.counts.openChats ?? 0).toLocaleString(), Icon: MessageSquare, color: "text-red-500", bg: "bg-red-500/10" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Admin Control Center</h1>
          <p className="mt-1 text-sm text-muted-foreground flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            System-wide activity synced in real-time
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/admin/invoices" className="inline-flex h-9 items-center justify-center rounded-md bg-secondary px-3 text-sm font-medium hover:bg-secondary/80">
            <Receipt className="mr-2 h-4 w-4" /> Issue Invoice
          </Link>
          <Link to="/admin/broadcast" className="inline-flex h-9 items-center justify-center rounded-md bg-secondary px-3 text-sm font-medium hover:bg-secondary/80">
            <MessageSquare className="mr-2 h-4 w-4" /> Broadcast
          </Link>
          <Link to="/admin/shipments" className="inline-flex h-9 items-center justify-center rounded-md bg-navy-deep px-3 text-sm font-medium text-cream hover:bg-navy transition-colors">
            <Package2 className="mr-2 h-4 w-4" /> All Shipments
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s, i) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full ${s.bg} transition-transform group-hover:scale-150`}></div>
            <s.Icon className={`h-5 w-5 ${s.color} relative z-10`} />
            <p className="mt-4 font-display text-4xl font-bold text-navy-deep relative z-10">
              {s.value.toLocaleString()}
            </p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground relative z-10">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-bold mb-4">Volume Overview</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={adminData?.volumeByDay ?? []} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} 
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return `${d.getMonth()+1}/${d.getDate()}`;
                  }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#1E293B', fontWeight: 600 }}
                  cursor={{ fill: '#F1F5F9' }}
                />
                <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
                  {(adminData?.volumeByDay ?? []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 6 ? '#10b981' : '#1E293B'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card flex flex-col">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <h2 className="font-display text-lg font-bold flex items-center gap-2">
                <Activity className="h-5 w-5 text-amber" />
                Live Network Feed
              </h2>
            </div>
            <Link to="/admin/shipments" className="inline-flex items-center gap-1 text-sm font-medium text-amber hover:underline">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Tracking</th>
                  <th className="px-5 py-3 font-medium">Service</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(adminData?.recentShipments ?? []).length === 0 ? (
                   <tr><td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">No recent network activity.</td></tr>
                ) : (
                  (adminData?.recentShipments ?? []).map((r) => (
                    <tr key={r.id} className="hover:bg-secondary/50 transition-colors">
                      <td className="px-5 py-3 font-mono font-medium text-navy-deep">{r.tracking_number}</td>
                      <td className="px-5 py-3 text-muted-foreground">{r.service}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${r.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber/10 text-amber'}`}>
                          {statusLabels[r.status] || r.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-muted-foreground text-xs">{new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {(adminData?.criticalExceptions ?? []).length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Critical Exceptions
            </h2>
            <Link to="/admin/shipments" className="inline-flex items-center gap-1 text-sm font-medium text-red-700 hover:underline">
              Resolve issues <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase tracking-widest text-red-800/60 border-b border-red-200">
                <tr>
                  <th className="px-5 py-3 font-medium">Tracking</th>
                  <th className="px-5 py-3 font-medium">Service</th>
                  <th className="px-5 py-3 font-medium text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-200">
                {(adminData?.criticalExceptions ?? []).map((r: any) => (
                  <tr key={r.id} className="hover:bg-red-100/50 transition-colors">
                    <td className="px-5 py-3 font-mono font-medium text-red-900">{r.tracking_number}</td>
                    <td className="px-5 py-3 text-red-800">{r.service}</td>
                    <td className="px-5 py-3 text-right text-red-800 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <Truck className="h-5 w-5 text-navy-deep" />
            Courier Performance (SLA)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/50 text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium rounded-l-lg">Courier</th>
                <th className="px-5 py-3 font-medium">Deliveries (7d)</th>
                <th className="px-5 py-3 font-medium">SLA Compliance</th>
                <th className="px-5 py-3 font-medium rounded-r-lg text-right">Avg Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(adminData?.courierPerformance ?? []).map((c: any) => (
                <tr key={c.name}>
                  <td className="px-5 py-4 font-medium text-navy-deep">{c.name}</td>
                  <td className="px-5 py-4 text-muted-foreground">{c.deliveries}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                        <div className={`h-full ${c.sla >= 98 ? 'bg-success' : 'bg-warning'}`} style={{ width: `${c.sla}%` }} />
                      </div>
                      <span className="text-xs font-semibold">{c.sla}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right text-muted-foreground">{c.avgTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
