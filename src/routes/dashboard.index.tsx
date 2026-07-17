import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "motion/react";
import { Package, TrendingUp, Clock, DollarSign, ArrowUpRight, Truck, Loader2 } from "lucide-react";
import { statusLabels } from "@/lib/mock-shipments";
import { Counter } from "@/components/animated/Counter";
import { listMyShipments, listInvoices, getMyProfile } from "@/lib/api.functions";

export const Route = createFileRoute("/dashboard/")({
  component: Overview,
});

function Overview() {
  const fetchShipments = useServerFn(listMyShipments);
  const fetchInvoices = useServerFn(listInvoices);
  const fetchProfile = useServerFn(getMyProfile);

  const { data: list = [], isLoading } = useQuery({ queryKey: ["my-shipments"], queryFn: () => fetchShipments() });
  const { data: invoices = [] } = useQuery({ queryKey: ["my-invoices"], queryFn: () => fetchInvoices() });
  const { data: profile } = useQuery({ queryKey: ["my-profile"], queryFn: () => fetchProfile() });

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
    { label: "Active shipments", value: active, suffix: "", icon: Package, delta: "Live Data" },
    { label: "On-time rate", value: onTimeRate, suffix: "%", icon: TrendingUp, delta: "Live Data" },
    { label: "Avg transit", value: avgTransit, suffix: "h", icon: Clock, delta: "Live Data" },
    { label: "Spend MTD", value: spend, suffix: " USD", icon: DollarSign, delta: "Live Data" },
  ];
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber">Overview</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome back, {profile?.display_name ?? "User"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Here's what's moving on your network today.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/pickup" className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-medium hover:bg-secondary">
            Schedule pickup
          </Link>
          <Link to="/shipping" className="inline-flex h-10 items-center rounded-md bg-navy-deep px-4 text-sm font-medium text-cream hover:bg-navy">
            New shipment
          </Link>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs uppercase tracking-widest">{k.label}</span>
              <k.icon className="h-4 w-4 text-amber" />
            </div>
            <div className="mt-3 font-display text-3xl font-bold text-navy-deep">
              <Counter to={k.value} />{k.suffix}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{k.delta}</p>
          </motion.div>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="font-display text-xl">Recent shipments</h2>
            <p className="text-xs text-muted-foreground">Latest activity across your account</p>
          </div>
          <Link to="/dashboard/shipments" className="inline-flex items-center gap-1 text-sm font-medium text-amber hover:underline">
            View all <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <ul className="divide-y divide-border">
          {list.slice(0, 4).map((s) => (
            <li key={s.id} className="flex items-center gap-4 p-5">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-navy-deep">
                <Truck className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <Link
                    to="/tracking/$trackingId"
                    params={{ trackingId: s.trackingNumber }}
                    className="font-mono text-sm hover:text-amber"
                  >
                    {s.trackingNumber}
                  </Link>
                  <span className="text-xs text-muted-foreground">· {s.service}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {s.origin} → {s.destination}
                </p>
              </div>
              <span className="hidden text-xs text-muted-foreground sm:block">
                ETA {new Date(s.estimatedDelivery).toLocaleDateString()}
              </span>
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold">
                {statusLabels[s.status]}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
