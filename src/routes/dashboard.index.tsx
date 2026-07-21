import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "motion/react";
import { Package, TrendingUp, Clock, DollarSign, ArrowUpRight, Truck, PlusCircle, AlertCircle, Receipt, Search, CalendarPlus } from "lucide-react";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, subDays, startOfDay, isSameDay } from "date-fns";
import { statusLabels } from "@/lib/types";
import { Counter } from "@/components/animated/Counter";
import { listMyShipments, listInvoices, getMyProfile, listPickups } from "@/lib/api.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/")({
  component: Overview,
});

function Overview() {
  const fetchShipments = useServerFn(listMyShipments);
  const fetchInvoices = useServerFn(listInvoices);
  const fetchPickups = useServerFn(listPickups);
  const fetchProfile = useServerFn(getMyProfile);

  const { data: list = [] } = useQuery({ queryKey: ["my-shipments"], queryFn: () => fetchShipments(), staleTime: Infinity });
  const { data: invoices = [] } = useQuery({ queryKey: ["my-invoices"], queryFn: () => fetchInvoices(), staleTime: Infinity });
  const { data: pickups = [] } = useQuery({ queryKey: ["my-pickups"], queryFn: () => fetchPickups(), staleTime: Infinity });
  const { data: profile } = useQuery({ queryKey: ["my-profile"], queryFn: () => fetchProfile(), staleTime: Infinity });

  const qc = useQueryClient();
  useEffect(() => {
    // Sync Shipments
    const shipChannel = supabase
      .channel('schema-db-changes-shipments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments' }, () => qc.invalidateQueries({ queryKey: ["my-shipments"] }))
      .subscribe();

    // Sync Invoices
    const invChannel = supabase
      .channel('schema-db-changes-invoices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => qc.invalidateQueries({ queryKey: ["my-invoices"] }))
      .subscribe();

    // Sync Pickups
    const puChannel = supabase
      .channel('schema-db-changes-pickups')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pickups' }, () => qc.invalidateQueries({ queryKey: ["my-pickups"] }))
      .subscribe();

    return () => {
      supabase.removeChannel(shipChannel);
      supabase.removeChannel(invChannel);
      supabase.removeChannel(puChannel);
    };
  }, [qc]);

  const active = list.filter((s) => s.status !== "delivered").length;
  const spend = invoices.reduce((sum, inv) => sum + (inv.status !== "void" ? inv.total : 0), 0);
  
  const delivered = list.filter(s => s.status === "delivered");
  const onTimeRate = list.length === 0 ? 100 : Math.round(((list.length - list.filter(s => s.status === "exception").length) / list.length) * 100);
  const avgTransit = delivered.length === 0 ? 0 : Math.round(delivered.reduce((sum, s) => {
    const start = new Date((s as any).created_at || s.lastUpdate || Date.now()).getTime();
    const end = new Date(s.lastUpdate || Date.now()).getTime();
    return sum + Math.max(1, (end - start) / (1000 * 60 * 60));
  }, 0) / delivered.length);

  const kpis = [
    { label: "Active shipments", value: active, suffix: "", icon: Package, delta: "Live Tracker" },
    { label: "On-time rate", value: onTimeRate, suffix: "%", icon: TrendingUp, delta: "Live Tracker" },
    { label: "Avg transit", value: avgTransit, suffix: "h", icon: Clock, delta: "Live Tracker" },
    { label: "Spend MTD", value: spend, suffix: " USD", icon: DollarSign, delta: "Live Tracker" },
  ];

  // Generate chart data for the last 7 days
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = startOfDay(subDays(new Date(), 6 - i));
    const count = list.filter((s) => isSameDay(new Date((s as any).created_at || s.lastUpdate), d)).length;
    return { date: format(d, "MMM dd"), volume: count };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome back, {profile?.display_name ?? "User"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Here's what's moving on your network today.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/shipping" className="inline-flex h-10 items-center gap-2 rounded-md bg-navy-deep px-4 text-sm font-medium text-cream hover:bg-navy transition-colors">
            <PlusCircle className="h-4 w-4" /> Book Shipment
          </Link>
        </div>
      </header>

      {/* Alerts & Exceptions */}
      {(list.some(s => s.status === 'exception') || invoices.some(i => i.status !== 'paid' && i.status !== 'void')) && (
        <div className="flex flex-col gap-3">
          {list.filter(s => s.status === 'exception').length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-red-800">Action Required: Shipment Exceptions</h3>
                <p className="text-sm text-red-700 mt-1">
                  You have {list.filter(s => s.status === 'exception').length} shipment(s) currently experiencing an exception. Please review them immediately.
                </p>
                <div className="mt-2">
                  <Link to="/dashboard/shipments" className="text-sm font-medium text-red-800 hover:underline">
                    View exceptions &rarr;
                  </Link>
                </div>
              </div>
            </div>
          )}
          {invoices.filter(i => i.status !== 'paid' && i.status !== 'void').length > 0 && (
            <div className="rounded-lg border border-amber/30 bg-amber/10 p-4 flex items-start gap-3">
              <Receipt className="h-5 w-5 text-amber-deep shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-amber-deep">Unpaid Invoices</h3>
                <p className="text-sm text-amber-900/80 mt-1">
                  You have {invoices.filter(i => i.status !== 'paid' && i.status !== 'void').length} unpaid invoice(s) requiring your attention.
                </p>
                <div className="mt-2">
                  <Link to="/dashboard/invoices" className="text-sm font-medium text-amber-deep hover:underline">
                    View billing &rarr;
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link to="/shipping" className="rounded-xl border border-border bg-card p-4 hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-2 group">
          <div className="h-10 w-10 rounded-full bg-navy-deep/10 text-navy-deep grid place-items-center group-hover:scale-110 transition-transform"><PlusCircle className="h-5 w-5" /></div>
          <span className="text-sm font-semibold">Book Shipment</span>
        </Link>
        <Link to="/pickup" className="rounded-xl border border-border bg-card p-4 hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-2 group">
          <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-600 grid place-items-center group-hover:scale-110 transition-transform"><CalendarPlus className="h-5 w-5" /></div>
          <span className="text-sm font-semibold">Schedule Pickup</span>
        </Link>
        <Link to="/tracking" className="rounded-xl border border-border bg-card p-4 hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-2 group">
          <div className="h-10 w-10 rounded-full bg-amber/10 text-amber-deep grid place-items-center group-hover:scale-110 transition-transform"><Search className="h-5 w-5" /></div>
          <span className="text-sm font-semibold">Track Package</span>
        </Link>
        <Link to="/dashboard/invoices" className="rounded-xl border border-border bg-card p-4 hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-2 group">
          <div className="h-10 w-10 rounded-full bg-purple-500/10 text-purple-600 grid place-items-center group-hover:scale-110 transition-transform"><Receipt className="h-5 w-5" /></div>
          <span className="text-sm font-semibold">View Invoices</span>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border bg-card p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs uppercase tracking-widest">{k.label}</span>
              <k.icon className="h-4 w-4 text-amber" />
            </div>
            <div className="mt-3 font-display text-3xl font-bold text-navy-deep">
              <Counter to={k.value} />{k.suffix}
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.delta}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-5">
            <div>
              <h2 className="font-display text-lg font-bold">Recent Shipments</h2>
              <p className="text-xs text-muted-foreground">Latest tracking activity across your account</p>
            </div>
            <Link to="/dashboard/shipments" className="inline-flex items-center gap-1 text-sm font-medium text-amber hover:underline">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-xs uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Tracking</th>
                  <th className="px-5 py-3 font-medium">Service</th>
                  <th className="px-5 py-3 font-medium">Route</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">
                      No recent shipments found.
                    </td>
                  </tr>
                ) : (
                  list.slice(0, 5).map((s) => (
                    <tr key={s.id} className="hover:bg-secondary/50 transition-colors group">
                      <td className="px-5 py-3">
                        <Link to="/tracking/$trackingId" params={{ trackingId: s.trackingNumber }} className="font-mono font-medium text-navy-deep group-hover:text-amber">
                          {s.trackingNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{s.service}</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        <span className="truncate max-w-[150px] inline-block">{s.origin}</span>
                        <span className="mx-2 text-border">→</span>
                        <span className="truncate max-w-[150px] inline-block">{s.destination}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' : s.status === 'exception' ? 'bg-red-100 text-red-800' : 'bg-amber/10 text-amber'}`}>
                          {statusLabels[s.status]}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border p-5">
              <div>
                <h2 className="font-display text-lg font-bold">Recent Invoices</h2>
              </div>
              <Link to="/dashboard/invoices" className="inline-flex items-center gap-1 text-sm font-medium text-amber hover:underline">
                All billing <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/50 text-xs uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-medium">Invoice</th>
                    <th className="px-5 py-3 font-medium text-right">Amount</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-6 text-center text-muted-foreground">
                        No invoices found.
                      </td>
                    </tr>
                  ) : (
                    invoices.slice(0, 4).map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-secondary/50 transition-colors">
                        <td className="px-5 py-3 font-mono font-medium text-navy-deep">{inv.number}</td>
                        <td className="px-5 py-3 text-right font-medium">{new Intl.NumberFormat(undefined, { style: "currency", currency: inv.currency }).format(inv.total)}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : inv.status === 'void' ? 'bg-secondary text-muted-foreground' : 'bg-amber/10 text-amber'}`}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display text-lg font-bold mb-4">Volume (7 Days)</h2>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1E293B" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#1E293B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#1E293B', fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="volume" stroke="#1E293B" strokeWidth={2} fillOpacity={1} fill="url(#colorVolume)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between items-center text-center">
            <div>
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-secondary">
                <Truck className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">Schedule a Pickup</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Need a driver to collect your packages? Schedule a pickup from your location.
              </p>
            </div>
            <Link to="/pickup" className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-navy-deep px-4 text-sm font-medium text-cream hover:bg-navy w-full transition-colors">
              Schedule Pickup
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
