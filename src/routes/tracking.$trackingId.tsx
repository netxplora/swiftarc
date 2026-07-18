import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState, Suspense, lazy } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  ArrowLeft, MapPin, Package, ShieldCheck, Thermometer, Activity,
  Sparkles, Bell, RotateCcw, ClipboardCheck, ImageIcon, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { TrackingTimeline } from "@/components/tracking/TrackingTimeline";
import { EtaCountdown } from "@/components/tracking/EtaCountdown";
import { ShareDialog } from "@/components/tracking/ShareDialog";
import { statusLabels } from "@/lib/types";
import { resolveTracking } from "@/lib/api.functions";
import { supabase } from "@/integrations/supabase/client";
import { generateShippingLabel } from "@/lib/pdf";

const TrackingMap = lazy(() => import("@/components/tracking/TrackingMap").then((m) => ({ default: m.TrackingMap })));

export const Route = createFileRoute("/tracking/$trackingId")({
  loader: async ({ params }) => {
    const res = await resolveTracking({ data: { trackingNumber: params.trackingId } });
    if (res.kind === "none") throw notFound();
    return res;
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `${loaderData.shipment.trackingNumber} — SwiftArc Tracking`
          : "Not found — SwiftArc",
      },
      {
        name: "description",
        content: loaderData
          ? `Live status for shipment ${loaderData.shipment.trackingNumber}: ${statusLabels[loaderData.shipment.status as keyof typeof statusLabels]} · ${loaderData.shipment.origin?.city ?? ""} → ${loaderData.shipment.destination?.city ?? ""}.`
          : "Tracking number not found.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  notFoundComponent: NotFound,
  component: TrackingDetail,
});

function NotFound() {
  const { trackingId } = Route.useParams();
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-amber">Not on network</p>
      <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">
        We couldn't find <span className="font-mono text-navy-deep">{trackingId}</span>
      </h1>
      <p className="mt-4 text-muted-foreground">
        Double-check the number, or try one of our sample shipments.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Button asChild variant="outline"><Link to="/tracking">Try again</Link></Button>
        <Button asChild className="bg-navy-deep text-cream hover:bg-navy"><Link to="/">Home</Link></Button>
      </div>
    </div>
  );
}

function TrackingDetail() {
  const data = Route.useLoaderData();
  const s = data.shipment as any;
  const shipment = {
    id: s.id ?? s.trackingNumber,
    trackingNumber: s.trackingNumber,
    service: s.service,
    status: s.status as any,
    progress: s.status === "delivered" ? 100 : s.status === "out_for_delivery" ? 88 : s.status === "in_transit" ? 55 : s.status === "picked_up" ? 25 : 8,
    origin: { city: s.origin?.city ?? "Origin", country: s.origin?.country_code ?? s.origin?.country ?? "", lat: s.origin?.lat ?? 0, lng: s.origin?.lng ?? 0 },
    destination: { city: s.destination?.city ?? "Destination", country: s.destination?.country_code ?? s.destination?.country ?? "", lat: s.destination?.lat ?? 0, lng: s.destination?.lng ?? 0 },
    currentLocation: { lat: (data as any).events?.[0]?.lat ?? s.destination?.lat ?? 0, lng: (data as any).events?.[0]?.lng ?? s.destination?.lng ?? 0, label: (data as any).events?.[0]?.location ?? "Processing" },
    weightKg: s.package?.weight_kg ?? 0,
    dimensions: `${s.package?.length_cm ?? 0} × ${s.package?.width_cm ?? 0} × ${s.package?.height_cm ?? 0} cm`,
    pieces: s.package?.pieces ?? 1,
    shipDate: s.createdAt ?? s.created_at ?? new Date().toISOString(),
    estimatedDelivery: s.estimatedDelivery ?? s.estimated_delivery ?? new Date(Date.now() + 3 * 86400_000).toISOString(),
    recipient: s.destination?.contact_name ?? "Recipient",
    sender: s.origin?.contact_name ?? "Sender",
    reference: "-",
    onTimeConfidence: s.onTimeConfidence ?? 90,
    aiNote: s.aiNote ?? "Route analysis in progress.",
    healthScore: s.telemetry?.healthScore ?? 100,
    temperatureC: s.telemetry?.temperatureC ?? 20,
    shockEvents: s.telemetry?.shockEvents ?? 0,
    proofOfDelivery: s.proof_of_delivery ?? s.proofOfDelivery,
    exceptionNote: s.exceptionNote,
    checkpoints: ((data as any).events ?? []).map((e: any) => ({
      id: e.id, timestamp: e.occurred_at, facility: e.location ?? "Facility", city: "", country: "", status: e.description, lat: 0, lng: 0
    })),
  };

  const [realtimeCheckpoints, setRealtimeCheckpoints] = useState(shipment.checkpoints);

  useEffect(() => {
    if (data.kind !== "db") return;
    const shipId = (data.shipment as any).id;
    if (!shipId) return;
    const ch = supabase.channel(`tracking_${shipId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "shipment_events", filter: `shipment_id=eq.${shipId}` },
        (payload) => {
          const e = payload.new as any;
          setRealtimeCheckpoints((prev: any[]) => [
            { id: e.id, timestamp: e.occurred_at, facility: e.location ?? "Facility", city: "", country: "", status: e.description, lat: 0, lng: 0 },
            ...prev,
          ]);
          toast.info("New tracking update available!");
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [data]);

  // Simulated live position: interpolate toward destination every 4s (for in_transit / out_for_delivery)
  const [livePos, setLivePos] = useState<[number, number]>([
    shipment.currentLocation.lat,
    shipment.currentLocation.lng,
  ]);
  const [lastPing, setLastPing] = useState<number | null>(null);

  useEffect(() => {
    setLastPing(Date.now());
    if (shipment.status === "delivered" || shipment.status === "exception") return;
    const dest: [number, number] = [shipment.destination.lat, shipment.destination.lng];
    const t = setInterval(() => {
      setLivePos(([lat, lng]) => [
        lat + (dest[0] - lat) * 0.015,
        lng + (dest[1] - lng) * 0.015,
      ]);
      setLastPing(Date.now());
    }, 4000);
    return () => clearInterval(t);
  }, [shipment.status, shipment.destination.lat, shipment.destination.lng]);

  return (
    <div>
      {/* Sticky header */}
      <div className="sticky top-16 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-6 lg:px-8">
          <div className="min-w-0">
            <Link to="/tracking" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3 w-3" /> All tracking
            </Link>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="font-mono text-sm text-muted-foreground">{shipment.trackingNumber}</p>
              <StatusChip status={shipment.status} />
              <HealthChip score={shipment.healthScore} />
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber">
                <span className="relative flex h-2 w-2 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber" />
                </span>
                {lastPing !== null ? `Live · pinged ${timeAgo(lastPing)}` : "Live · locating..."}
              </div>
            </div>
            <h1 className="mt-1 truncate font-display text-2xl font-bold tracking-tight sm:text-3xl">
              {shipment.origin.city} <span className="text-amber">→</span> {shipment.destination.city}
            </h1>
            <p className="text-xs text-muted-foreground">{shipment.service}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ShareDialog trackingNumber={shipment.trackingNumber} />
            <Button variant="outline" size="sm" onClick={() => {
              generateShippingLabel({
                trackingNumber: shipment.trackingNumber,
                service: shipment.service,
                weightKg: shipment.weightKg,
                origin: { city: shipment.origin.city, country: shipment.origin.country },
                destination: { city: shipment.destination.city, country: shipment.destination.country },
                recipient: shipment.recipient
              });
              toast.success("Label generated");
            }}>
              <Package className="mr-1 h-4 w-4" /> Label
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.success("Notifications on for this shipment")}>
              <Bell className="mr-1 h-4 w-4" /> Notify me
            </Button>
            <Button size="sm" className="bg-navy-deep text-cream hover:bg-navy" onClick={() => toast("Reroute request submitted", { description: "We'll contact the courier." })}>
              <RotateCcw className="mr-1 h-4 w-4" /> Reroute
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {shipment.status === "exception" && shipment.exceptionNote && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">Shipment exception</p>
              <p className="mt-1 text-sm text-foreground/80">{shipment.exceptionNote}</p>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <TrackingTimeline status={shipment.status} progress={shipment.progress} />

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="overflow-hidden rounded-2xl border border-border min-h-[400px]"
            >
              <Suspense fallback={<div className="h-[400px] w-full bg-secondary animate-pulse" />}>
                <TrackingMap
                  origin={[shipment.origin.lat, shipment.origin.lng]}
                  destination={[shipment.destination.lat, shipment.destination.lng]}
                  current={livePos}
                  checkpoints={realtimeCheckpoints}
                />
              </Suspense>
            </motion.div>

            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-xl">Facility checkpoints</h2>
              <ol className="mt-6 space-y-6">
                {[...realtimeCheckpoints].reverse().map((c, i) => (
                  <motion.li
                    key={c.id}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="relative grid grid-cols-[auto_1fr] gap-4"
                  >
                    <div className="relative flex flex-col items-center">
                      <span className={`grid h-8 w-8 place-items-center rounded-full ${i === 0 ? "bg-amber text-navy-deep" : "bg-secondary text-muted-foreground"}`}>
                        <MapPin className="h-4 w-4" />
                      </span>
                      {i < realtimeCheckpoints.length - 1 && (
                        <span className="mt-1 h-full w-px flex-1 bg-border" />
                      )}
                    </div>
                    <div className="pb-2">
                      <p className="text-sm font-semibold">{c.status}</p>
                      <p className="text-sm text-muted-foreground">{c.facility} · {c.city}, {c.country}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{new Date(c.timestamp).toLocaleString()}</p>
                    </div>
                  </motion.li>
                ))}
              </ol>
            </section>

            {shipment.proofOfDelivery && (
              <section className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-display text-xl">Proof of delivery</h2>
                <div className="mt-4 grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Signed by</p>
                    <p className="mt-1 font-display text-lg">{shipment.proofOfDelivery.signedBy}</p>
                    <div className="mt-4 rounded-xl border border-border bg-secondary/60 p-4">
                      <svg viewBox="0 0 200 80" className="h-20 w-full" aria-label="Recipient signature">
                        <motion.path
                          d={shipment.proofOfDelivery.signatureSvgPath}
                          stroke="var(--color-navy-deep)"
                          strokeWidth={2.5}
                          fill="none"
                          strokeLinecap="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 2, ease: "easeInOut" }}
                        />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Delivery photo</p>
                    <div className="mt-1 grid aspect-video place-items-center rounded-xl border border-border bg-navy-deep text-cream/60">
                      <div className="text-center">
                        <ImageIcon className="mx-auto h-8 w-8 text-amber" />
                        <p className="mt-2 text-xs">{shipment.proofOfDelivery.photoNote}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-xl">Delivery preferences</h2>
              <p className="mt-1 text-sm text-muted-foreground">Prototype — actions confirm with a toast.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Hold at nearest location", desc: "We'll route to a SwiftArc pickup point." },
                  { label: "Signature release", desc: "Leave without a signature (residential)." },
                  { label: "Reschedule window", desc: "Pick a 2-hour window that works." },
                  { label: "Update recipient contact", desc: "Add SMS + email for door alerts." },
                ].map((p) => (
                  <button
                    key={p.label}
                    onClick={() => toast.success(`Saved: ${p.label}`)}
                    className="rounded-xl border border-border bg-secondary/40 p-4 text-left transition-colors hover:bg-secondary"
                  >
                    <p className="text-sm font-semibold">{p.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{p.desc}</p>
                  </button>
                ))}
              </div>
            </section>

            <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card px-6">
              <AccordionItem value="history" className="border-none">
                <AccordionTrigger className="text-base font-semibold">Package history & documents</AccordionTrigger>
                <AccordionContent>
                  <ul className="grid gap-2 text-sm text-muted-foreground">
                    <li>Commercial invoice — INV-{shipment.reference}</li>
                    <li>Airway bill — AWB-{shipment.trackingNumber.slice(-6)}</li>
                    <li>Customs cleared — {realtimeCheckpoints[Math.min(2, realtimeCheckpoints.length - 1)]?.city || "Gateway"}</li>
                    <li>Insurance certificate — SwiftArc CarePlus</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Estimated delivery
              </h2>
              <p className="mt-2 font-display text-2xl font-bold text-navy-deep">
                {new Date(shipment.estimatedDelivery).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
              <div className="mt-4">
                <EtaCountdown iso={shipment.estimatedDelivery} />
              </div>
            </section>

            <section className="rounded-2xl border border-amber/40 bg-amber/10 p-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-navy-deep">
                <Sparkles className="h-4 w-4" /> AI Prediction
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-4xl font-bold text-navy-deep">{shipment.onTimeConfidence}%</span>
                <span className="text-sm text-navy-deep/70">on-time confidence</span>
              </div>
              <p className="mt-3 text-sm text-navy-deep/80">{shipment.aiNote}</p>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Package
              </h2>
              <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <Detail label="Weight" value={`${shipment.weightKg} kg`} />
                <Detail label="Dimensions" value={shipment.dimensions} />
                <Detail label="Pieces" value={String(shipment.pieces)} />
                <Detail label="Reference" value={shipment.reference} />
                <Detail label="Sender" value={shipment.sender} />
                <Detail label="Recipient" value={shipment.recipient} />
              </dl>
            </section>

            <section className="rounded-2xl border border-border bg-navy-deep p-6 text-cream">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-amber">Condition</h2>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <SensorTile Icon={ShieldCheck} label="Health" value={`${shipment.healthScore}`} />
                <SensorTile Icon={Thermometer} label="Temp" value={`${shipment.temperatureC}°C`} />
                <SensorTile Icon={Activity} label="Shocks" value={String(shipment.shockEvents)} />
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <ClipboardCheck className="h-4 w-4" /> Chain of custody
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Every handoff is signed, timestamped, and cryptographically logged.
                Available for download after delivery.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function timeAgo(ms: number) {
  const s = Math.max(1, Math.round((Date.now() - ms) / 1000));
  if (s < 60) return `${s}s ago`;
  return `${Math.round(s / 60)}m ago`;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}

function SensorTile({ Icon, label, value }: { Icon: typeof Package; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-navy p-3">
      <Icon className="mx-auto h-4 w-4 text-amber" />
      <div className="mt-2 font-display text-lg">{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-cream/60">{label}</div>
    </div>
  );
}

function StatusChip({ status }: { status: keyof typeof statusLabels }) {
  const tone: Record<string, string> = {
    delivered: "bg-success/20 text-success",
    out_for_delivery: "bg-amber/20 text-navy-deep",
    in_transit: "bg-secondary text-navy-deep",
    picked_up: "bg-secondary text-navy-deep",
    label_created: "bg-muted text-muted-foreground",
    exception: "bg-destructive/20 text-destructive",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone[status] ?? "bg-secondary"}`}>
      <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabels[status]}
    </span>
  );
}

function HealthChip({ score }: { score: number }) {
  const good = score >= 90;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${good ? "bg-success/15 text-success" : "bg-warning/20 text-navy-deep"}`}>
      Health {score}
    </span>
  );
}
