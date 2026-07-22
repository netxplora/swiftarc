import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminAnalytics } from "@/lib/admin.functions";
import { statusLabels } from "@/lib/types";
import { motion } from "motion/react";
import {
  DollarSign, Package2, Users, TrendingUp, AlertTriangle, CheckCircle2,
  MapPin, ArrowUpRight
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, PieChart, Pie
} from "recharts";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Admin — SwiftArc" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminAnalytics,
});

const COLORS = ["#1E293B", "#D4A843", "#10b981", "#6366f1", "#f43f5e", "#06b6d4", "#8b5cf6", "#f59e0b"];

function AdminAnalytics() {
  const fn = useServerFn(adminAnalytics);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => fn(),
    staleTime: 60_000,
  });

  const fmt = (n: number) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  const summary = data?.summary;

  const kpis = [
    { label: "Revenue (30d)", value: fmt(summary?.totalRevenue ?? 0), icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-500/10" },
    { label: "Shipments (30d)", value: (summary?.totalShipments ?? 0).toLocaleString(), icon: Package2, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Delivery Rate", value: `${summary?.deliveryRate ?? 0}%`, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Exceptions", value: (summary?.exceptionCount ?? 0).toLocaleString(), icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
    { label: "New Users (30d)", value: (summary?.newUserCount ?? 0).toLocaleString(), icon: Users, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-secondary rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-secondary" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-80 rounded-2xl bg-secondary" />
          <div className="h-80 rounded-2xl bg-secondary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          30-day performance overview across revenue, shipments, and growth.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-2xl border border-border bg-card p-5 hover:shadow-md transition-shadow relative overflow-hidden group"
          >
            <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full ${k.bg} transition-transform group-hover:scale-150`} />
            <k.icon className={`h-5 w-5 ${k.color} relative z-10`} />
            <p className="mt-4 font-display text-3xl font-bold text-navy-deep relative z-10">
              {k.value}
            </p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground relative z-10">
              {k.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart + Service Breakdown */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Revenue Trend */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Revenue Trend (30 Days)
            </h2>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.revenueByDay ?? []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  dy={10}
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickFormatter={(val) => `$${val}`}
                  width={50}
                />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                  labelFormatter={(label) => new Date(label).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#revGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Breakdown */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
            <Package2 className="h-5 w-5 text-navy-deep" />
            Service Mix
          </h2>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.byService ?? []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {(data?.byService ?? []).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0" }}
                  formatter={(value: number, name: string) => [`${value} shipments`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(data?.byService ?? []).map((s, i) => (
              <div key={s.name} className="flex items-center gap-2 text-xs">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-muted-foreground truncate">{s.name}</span>
                <span className="ml-auto font-semibold">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Breakdown + Top Destinations */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status Breakdown Bar Chart */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-bold mb-4">Status Breakdown</h2>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.byStatus ?? []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#475569" }}
                  width={110}
                  tickFormatter={(val) => (statusLabels as any)[val] || val}
                />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0" }}
                  formatter={(value: number, name: string) => [value, "Count"]}
                  labelFormatter={(label) => (statusLabels as any)[label] || label}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {(data?.byStatus ?? []).map((entry, index) => (
                    <Cell
                      key={index}
                      fill={
                        entry.name === "delivered" ? "#10b981" :
                        entry.name === "exception" ? "#ef4444" :
                        entry.name === "in_transit" ? "#D4A843" :
                        COLORS[index % COLORS.length]
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Destinations */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-amber" />
            Top Destinations
          </h2>
          <div className="space-y-3">
            {(data?.topDestinations ?? []).map((d, i) => {
              const maxCount = (data?.topDestinations ?? [])[0]?.count ?? 1;
              const pct = Math.round((d.count / maxCount) * 100);
              return (
                <div key={d.city} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-muted-foreground text-right">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-navy-deep truncate">{d.city}</span>
                      <span className="text-xs font-semibold text-muted-foreground">{d.count}</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-navy-deep to-amber rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.05, ease: [0.25, 1, 0.5, 1] }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            {(data?.topDestinations ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No destination data available yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* User Growth */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-500" />
            New User Registrations (14 Days)
          </h2>
        </div>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.usersByDay ?? []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                dy={10}
                tickFormatter={(val) => {
                  const d = new Date(val);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                width={30}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0" }}
                formatter={(value: number) => [value, "New users"]}
                labelFormatter={(label) => new Date(label).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
              />
              <Bar dataKey="users" radius={[4, 4, 0, 0]}>
                {(data?.usersByDay ?? []).map((_, index) => (
                  <Cell key={index} fill={index === (data?.usersByDay?.length ?? 1) - 1 ? "#6366f1" : "#1E293B"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
