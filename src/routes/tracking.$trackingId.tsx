/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  ArrowLeft,
  MapPin,
  Package,
  Bell,
  ClipboardCheck,
  User,
  Building,
  Phone,
  Mail,
  Box,
  Truck,
  CheckCircle2,
  Navigation,
  Info,
  Search,
  Copy,
  Ship,
  Maximize,
  Anchor,
  Layers,
  FileText,
  AlertCircle,
  Calendar,
  Hash,
  Headphones,
  AlertTriangle,
  ShieldAlert,
  BrainCircuit,
  Clock,
  Printer,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/hooks/use-locale";
import { Input } from "@/components/ui/input";
import { statusLabels } from "@/lib/types";
import { resolveTracking } from "@/lib/api.functions";
import { supabase } from "@/integrations/supabase/client";
import { TrackingSkeleton } from "@/components/skeletons/TrackingSkeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const TrackingMap = lazy(() =>
  import("@/components/tracking/TrackingMap").then((m) => ({ default: m.TrackingMap })),
);

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
          ? `Live status for shipment ${loaderData.shipment.trackingNumber}: ${statusLabels[loaderData.shipment.status as keyof typeof statusLabels] || loaderData.shipment.status} · ${(loaderData.shipment.origin as any)?.city ?? ""} → ${(loaderData.shipment.destination as any)?.city ?? ""}.`
          : "Tracking number not found.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  pendingComponent: TrackingSkeleton,
  pendingMs: 150,
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
        <Button asChild variant="outline">
          <Link to="/tracking">Try again</Link>
        </Button>
        <Button asChild className="bg-navy-deep text-cream hover:bg-navy">
          <Link to="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}

function TrackingDetail() {
  const data = Route.useLoaderData();
  const { format } = useLocale();
  const navigate = useNavigate();
  const [trackInput, setTrackInput] = useState("");

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackInput.trim()) {
      navigate({ to: "/tracking/$trackingId", params: { trackingId: trackInput.trim() } });
    }
  };

  const s = data.shipment as any;
  const sender = s.senderInfo || {};
  const receiver = s.receiverInfo || {};
  const originLoc = s.origin || {};
  const destLoc = s.destination || {};
  const pkg = s.package || {};

  const shipment = {
    id: s.id ?? s.trackingNumber,
    trackingNumber: s.trackingNumber,
    referenceNumber: s.reference ?? s.trackingNumber,
    service: s.service || "Standard",
    priority: s.service === "Priority Overnight" ? "High" : "Standard",
    type: originLoc.country !== destLoc.country ? "International" : "Domestic",
    status: s.status as any,
    progress:
      s.status === "completed" || s.status === "delivered"
        ? 100
        : s.status === "near_destination" || s.status === "out_for_delivery"
          ? 90
          : s.status === "in_transit"
            ? 75
            : s.status === "package_picked_up" || s.status === "picked_up"
              ? 60
              : s.status === "driver_arrived"
                ? 50
                : s.status === "driver_en_route" || s.status === "assigned"
                  ? 40
                  : s.status === "driver_assigned"
                    ? 30
                    : s.status === "awaiting_confirmation" || s.status === "confirmed"
                      ? 20
                      : 10,
    origin: {
      city: originLoc.city ?? "Origin",
      country: originLoc.country ?? originLoc.country_code ?? "",
      lat: Number(originLoc.lat ?? 0),
      lng: Number(originLoc.lng ?? 0),
      contact: sender.name ?? originLoc.contact_name ?? "Sender",
      phone: sender.phone ?? originLoc.phone ?? "",
      email: sender.email ?? originLoc.email ?? "",
      line1: sender.address ?? originLoc.line1 ?? originLoc.address ?? "",
      zip: originLoc.postal_code ?? "",
    },
    destination: {
      city: destLoc.city ?? "Destination",
      country: destLoc.country ?? destLoc.country_code ?? "",
      lat: Number(destLoc.lat ?? 0),
      lng: Number(destLoc.lng ?? 0),
      contact: receiver.name ?? destLoc.contact_name ?? "Recipient",
      phone: receiver.phone ?? destLoc.phone ?? "",
      email: receiver.email ?? destLoc.email ?? "",
      line1: receiver.address ?? destLoc.line1 ?? destLoc.address ?? "",
      zip: destLoc.postal_code ?? "",
    },
    currentLocation: {
      lat: (data as any).events?.[0]?.lat ?? Number(destLoc.lat ?? 0),
      lng: (data as any).events?.[0]?.lng ?? Number(destLoc.lng ?? 0),
      label: (data as any).events?.[0]?.location ?? "Processing",
    },
    weightKg: pkg.weight_kg ?? 0,
    dimensions:
      pkg.length_cm && pkg.width_cm && pkg.height_cm
        ? `${pkg.length_cm} Ã— ${pkg.width_cm} Ã— ${pkg.height_cm} cm`
        : "N/A",
    pieces: pkg.pieces ?? pkg.quantity ?? 1,
    packageType: pkg.type ?? "Parcel",
    description: pkg.description ?? pkg.contents ?? "",
    declaredValue: s.declaredValue ?? 0,
    insurance: s.insurance ?? false,
    shipDate: s.createdAt ?? s.created_at ?? new Date().toISOString(),
    estimatedDelivery:
      s.estimatedDelivery ??
      s.estimated_delivery ??
      new Date(Date.now() + 3 * 86400_000).toISOString(),
    checkpoints: (() => {
      const standardEvents = ((data as any).events ?? []).map((e: any) => ({
        id: e.id,
        timestamp: e.occurred_at,
        facility: e.location ?? "Facility",
        city: "",
        country: "",
        status: e.description,
        lat: 0,
        lng: 0,
        type: "standard",
      }));

      const holdEvents: any[] = [];
      (s.customsHolds ?? []).forEach((hold: any) => {
        holdEvents.push({
          id: `hold-${hold.id}`,
          timestamp: hold.hold_date ?? hold.created_at ?? new Date().toISOString(),
          facility: hold.customs_authority || "Customs Authority",
          city: "",
          country: "",
          status: `Customs Hold: ${hold.hold_reason}`,
          lat: 0,
          lng: 0,
          type: "hold_placed",
        });

        if (hold.status === "released" || hold.payment_status === "paid") {
          holdEvents.push({
            id: `release-${hold.id}`,
            timestamp: hold.released_at ?? hold.updated_at ?? new Date().toISOString(),
            facility: hold.customs_authority || "Customs Authority",
            city: "",
            country: "",
            status:
              hold.status === "released"
                ? "Customs Clearance Released"
                : "Payment Verified - Clearance in Progress",
            lat: 0,
            lng: 0,
            type: "hold_released",
          });
        }
      });

      return [...standardEvents, ...holdEvents].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );
    })(),
    customsHolds: s.customsHolds ?? [],
    distanceKm: s.distanceKm ? `${Number(s.distanceKm).toFixed(0)} km` : "N/A",
    estimatedTravelTime: s.estimatedTravelTime ?? "N/A",
    shippingFee: s.shippingFee ? `$${Number(s.shippingFee).toFixed(2)}` : "N/A",
    packageImage: s.packageImage ?? null,
  };

  const [realtimeCheckpoints, setRealtimeCheckpoints] = useState(shipment.checkpoints);
  const [realtimeStatus, setRealtimeStatus] = useState(shipment.status);
  const [realtimeProgress, setRealtimeProgress] = useState(shipment.progress);
  const [notifOpen, setNotifOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  useEffect(() => {
    if (data.kind !== "db") return;
    const shipId = (data.shipment as any).id;
    if (!shipId) return;

    const chEvents = supabase
      .channel(`tracking_events_${shipId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "shipment_events",
          filter: `shipment_id=eq.${shipId}`,
        },
        (payload) => {
          const e = payload.new as any;
          setRealtimeCheckpoints((prev: any[]) => [
            {
              id: e.id,
              timestamp: e.occurred_at,
              facility: e.location ?? "Facility",
              city: "",
              country: "",
              status: e.description,
              lat: 0,
              lng: 0,
            },
            ...prev,
          ]);
          toast.info("New tracking update available!");
        },
      )
      .subscribe();

    const chShipment = supabase
      .channel(`tracking_shipment_${shipId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "shipments", filter: `id=eq.${shipId}` },
        (payload) => {
          const s = payload.new as any;
          if (s.status) {
            setRealtimeStatus(s.status);
            const p =
              s.status === "completed" || s.status === "delivered"
                ? 100
                : s.status === "near_destination" || s.status === "out_for_delivery"
                  ? 90
                  : s.status === "in_transit"
                    ? 75
                    : s.status === "package_picked_up" || s.status === "picked_up"
                      ? 60
                      : s.status === "driver_arrived"
                        ? 50
                        : s.status === "driver_en_route" || s.status === "assigned"
                          ? 40
                          : s.status === "driver_assigned"
                            ? 30
                            : s.status === "awaiting_confirmation" || s.status === "confirmed"
                              ? 20
                              : 10;

            setRealtimeProgress(p);
            toast.success(`Shipment status updated to: ${statusLabels[s.status] || s.status}`);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chEvents);
      supabase.removeChannel(chShipment);
    };
  }, [data]);

  const [livePos, setLivePos] = useState<[number, number]>([
    shipment.currentLocation.lat,
    shipment.currentLocation.lng,
  ]);

  useEffect(() => {
    if (realtimeStatus === "delivered" || realtimeStatus === "exception") return;
    const dest: [number, number] = [shipment.destination.lat, shipment.destination.lng];
    const t = setInterval(() => {
      setLivePos(([lat, lng]) => [lat + (dest[0] - lat) * 0.015, lng + (dest[1] - lng) * 0.015]);
    }, 4000);
    return () => clearInterval(t);
  }, [realtimeStatus, shipment.destination.lat, shipment.destination.lng]);

  const activeHold = shipment.customsHolds[0];
  const hasCustomsHold = realtimeStatus === "customs_hold" || activeHold;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* ========================================================== */}
      {/* PRINT WAYBILL (Visually hidden)                             */}
      {/* ========================================================== */}
      <div id="print-waybill" className="hidden print:block">
        <div className="waybill-header">
          <div className="brand-block">
            <div className="brand-name">SwiftArc</div>
            <div className="brand-tagline">Global Logistics & Freight Solutions</div>
          </div>
          <div className="doc-type-block">
            <div className="doc-type">Shipment Waybill</div>
            <div className="doc-date">Printed: {new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</div>
          </div>
        </div>

        <div className="tracking-band">
          <div>
            <div className="tn-label">Tracking Number</div>
            <div className="tn-value">{shipment.trackingNumber}</div>
          </div>
          <div className="status-pill">{statusLabels[realtimeStatus] || "In Transit"}</div>
        </div>

        <div className="waybill-grid">
          <div className="waybill-section">
            <h4>Sender</h4>
            <p>{shipment.origin.contact}</p>
            {shipment.origin.line1 && <p className="sub">{shipment.origin.line1}</p>}
            <p className="sub">{shipment.origin.city}{shipment.origin.country ? `, ${shipment.origin.country}` : ""}{shipment.origin.zip ? ` ${shipment.origin.zip}` : ""}</p>
            {shipment.origin.phone && <p className="sub">Tel: {shipment.origin.phone}</p>}
            {shipment.origin.email && <p className="sub">{shipment.origin.email}</p>}
          </div>
          <div className="waybill-section">
            <h4>Recipient</h4>
            <p>{shipment.destination.contact}</p>
            {shipment.destination.line1 && <p className="sub">{shipment.destination.line1}</p>}
            <p className="sub">{shipment.destination.city}{shipment.destination.country ? `, ${shipment.destination.country}` : ""}{shipment.destination.zip ? ` ${shipment.destination.zip}` : ""}</p>
            {shipment.destination.phone && <p className="sub">Tel: {shipment.destination.phone}</p>}
            {shipment.destination.email && <p className="sub">{shipment.destination.email}</p>}
          </div>
          <div className="waybill-section">
            <h4>Service Type</h4>
            <p>{shipment.service}</p>
            <p className="sub">{shipment.type} · {shipment.priority} Priority</p>
          </div>
          <div className="waybill-section">
            <h4>Reference No.</h4>
            <p>{shipment.referenceNumber}</p>
          </div>
          <div className="waybill-section">
            <h4>Origin</h4>
            <p>{shipment.origin.city}, {shipment.origin.country}</p>
          </div>
          <div className="waybill-section">
            <h4>Destination</h4>
            <p>{shipment.destination.city}, {shipment.destination.country}</p>
          </div>
          <div className="waybill-section">
            <h4>Booking Date</h4>
            <p>{new Date(shipment.shipDate).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</p>
          </div>
          <div className="waybill-section">
            <h4>Estimated Delivery</h4>
            <p>{new Date(shipment.estimatedDelivery).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</p>
          </div>
          <div className="waybill-section">
            <h4>Package Details</h4>
            {shipment.description && <p>{shipment.description}</p>}
            <p className="sub">{shipment.weightKg} kg · {shipment.dimensions} · {shipment.pieces} pcs</p>
            {shipment.declaredValue > 0 && <p className="sub">Declared Value: ${shipment.declaredValue.toFixed(2)}{shipment.insurance ? " · Insured" : ""}</p>}
          </div>
          <div className="waybill-section">
            <h4>Shipping Charges</h4>
            <p>{shipment.shippingFee}</p>
            {shipment.distanceKm !== "N/A" && <p className="sub">Distance: {shipment.distanceKm}</p>}
          </div>
        </div>

        <div className="waybill-footer">
          <div className="disclaimer">
            This document is an official shipment record issued by SwiftArc Logistics. Please retain this document for your records. For queries, contact support@swiftarc.com
          </div>
          <div className="brand-small">SWIFTARC</div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* SCREEN VIEW (Redesigned)                                    */}
      {/* ========================================================== */}
      <div className="no-print">
        {/* Minimal Nav / Search Bar */}
        <div className="border-b border-border/40 bg-card/50 backdrop-blur-md sticky top-16 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <Link to="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Home
            </Link>
            <form onSubmit={onSearch} className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Track another..."
                  className="pl-9 h-9 w-full sm:w-64 bg-background border-border rounded-full text-sm shadow-sm focus-visible:ring-amber focus-visible:border-amber"
                  value={trackInput}
                  onChange={(e) => setTrackInput(e.target.value)}
                />
              </div>
            </form>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
          
          {/* 1. TRACKING HERO (Tracking ID & Big Status) */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <p className="text-sm font-bold uppercase tracking-widest text-amber mb-2">Tracking ID</p>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl sm:text-5xl font-display font-extrabold tracking-tight">
                  {shipment.trackingNumber}
                </h1>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shipment.trackingNumber);
                    toast.success("Copied");
                  }}
                  className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Copy Tracking Number"
                >
                  <Copy className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-left md:text-right">
              <p className="text-sm text-muted-foreground mb-1">Estimated Delivery</p>
              <h2 className="text-2xl sm:text-3xl font-bold">
                {new Date(shipment.estimatedDelivery).toLocaleDateString(undefined, {
                  weekday: 'short', month: "short", day: "numeric"
                })}
              </h2>
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber/10 border border-amber/20 text-amber font-bold text-sm shadow-inner shadow-amber/5">
                <div className="h-2 w-2 rounded-full bg-amber animate-pulse" />
                {statusLabels[realtimeStatus] || "In Transit"}
              </div>
            </motion.div>
          </div>

          {/* 2. CUSTOMS HOLD ALERT (If any) */}
          {hasCustomsHold &&
            (() => {
              const isResolved = activeHold?.status === "released" || activeHold?.payment_status === "paid";
              return (
                <div className={`${isResolved ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"} dark:bg-card dark:border-border rounded-3xl p-6 shadow-sm border`}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${isResolved ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20" : "bg-red-100 text-red-600 dark:bg-red-500/20"}`}>
                        {isResolved ? <CheckCircle2 className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-xl leading-tight">
                          {isResolved ? "Clearance Complete" : "Customs Hold Requires Action"}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {isResolved ? "Shipment has been released for delivery." : activeHold?.hold_reason || "Customs inspection required."}
                        </p>
                      </div>
                    </div>
                    {!isResolved && activeHold && ["payment_required", "open"].includes(activeHold.status) && (
                      <Button asChild className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl h-12 px-6">
                        <Link to="/pay/$caseId" params={{ caseId: activeHold.id }}>
                          Resolve & Pay Fees
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })()}

          {/* 3. MAP HERO */}
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.5 }} className="relative h-[300px] sm:h-[400px] lg:h-[500px] w-full bg-muted rounded-3xl overflow-hidden shadow-2xl border border-border/50">
            <Suspense fallback={<div className="h-full w-full bg-muted animate-pulse" />}>
              <TrackingMap
                origin={[shipment.origin.lat, shipment.origin.lng]}
                destination={[shipment.destination.lat, shipment.destination.lng]}
                current={livePos}
                checkpoints={realtimeCheckpoints}
              />
            </Suspense>

            {/* Live Tracking overlay */}
            <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-md rounded-2xl p-3 sm:p-4 shadow-lg border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
                <span className="font-bold text-sm sm:text-base">Live Position</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {livePos[0].toFixed(4)}°, {livePos[1].toFixed(4)}°
              </p>
            </div>
            
            <button className="absolute top-4 right-4 bg-background/80 text-foreground backdrop-blur-md rounded-full px-4 py-2.5 shadow-lg border border-white/10 font-bold text-xs flex items-center gap-2 hover:bg-background transition-colors">
              <Maximize className="h-4 w-4" /> <span className="hidden sm:inline">Fullscreen</span>
            </button>
          </motion.div>

          {/* 4. DETAILS ROW (Timeline + Package Info) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left: Checkpoint Timeline (Occupies 2 columns on lg) */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="font-display font-bold text-2xl">Tracking History</h3>
              <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="relative space-y-8">
                  <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border rounded-full"></div>

                  {[...realtimeCheckpoints].slice().reverse().map((c: any, i) => {
                    const isLatest = i === 0;

                    let Icon = isLatest ? Navigation : MapPin;
                    let bgClass = isLatest ? "bg-amber text-navy-deep border-amber/20" : "bg-card text-muted-foreground border-border";
                    let textClass = isLatest ? "text-foreground font-bold" : "text-muted-foreground font-medium";

                    if (c.type === "hold_placed") {
                      Icon = ShieldAlert; bgClass = "bg-red-500 text-white border-red-500/20"; textClass = "text-red-600 font-bold dark:text-red-400";
                    } else if (c.type === "hold_released") {
                      Icon = CheckCircle2; bgClass = "bg-emerald-500 text-white border-emerald-500/20"; textClass = "text-emerald-600 font-bold dark:text-emerald-400";
                    }

                    return (
                      <div key={c.id} className="relative flex gap-5">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 z-10 border-[3px] shadow-sm ${bgClass}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="pt-0.5 pb-2">
                          <p className={`text-base ${textClass}`}>{c.status}</p>
                          <p className="text-sm text-muted-foreground mt-1">{c.facility}</p>
                          <p className="text-xs text-muted-foreground/60 mt-1.5 font-mono">
                            {new Date(c.timestamp).toLocaleString(undefined, {
                              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Shipment Overview (Minimal) */}
            <div className="lg:col-span-1 space-y-6">
              <div className="flex items-center justify-between">
                 <h3 className="font-display font-bold text-2xl">Overview</h3>
                 <Button variant="ghost" size="sm" className="h-8 gap-2 text-muted-foreground hover:text-foreground no-print" onClick={() => window.print()}>
                   <Printer className="h-4 w-4" /> Print
                 </Button>
              </div>
              
              <div className="bg-card/40 backdrop-blur-md border border-border/50 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
                
                {/* Route */}
                <div className="relative">
                  <div className="absolute left-2.5 top-3 bottom-3 w-px bg-border border-dashed border-l-2"></div>
                  <div className="flex gap-4 pb-6 relative">
                    <div className="h-5 w-5 rounded-full border-4 border-card bg-amber shadow-sm shrink-0 z-10"></div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Origin</p>
                      <p className="font-bold">{shipment.origin.city}</p>
                      <p className="text-xs text-muted-foreground">{shipment.origin.country}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 relative">
                    <div className="h-5 w-5 rounded-full border-4 border-card bg-amber shadow-sm shrink-0 z-10"></div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Destination</p>
                      <p className="font-bold">{shipment.destination.city}</p>
                      <p className="text-xs text-muted-foreground">{shipment.destination.country}</p>
                    </div>
                  </div>
                </div>
                
                <hr className="border-border/60" />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Service</p>
                    <p className="font-bold text-sm">{shipment.service}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Weight</p>
                    <p className="font-bold text-sm">{shipment.weightKg} kg</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Pieces</p>
                    <p className="font-bold text-sm">{shipment.pieces}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Distance</p>
                    <p className="font-bold text-sm">{shipment.distanceKm}</p>
                  </div>
                </div>

                {shipment.packageImage && (
                  <>
                    <hr className="border-border/60" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Package Photo</p>
                      <button
                        onClick={() => setImageModalOpen(true)}
                        className="w-full rounded-2xl overflow-hidden border border-border hover:opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-amber focus:ring-offset-2 bg-muted/50"
                      >
                        <img 
                          src={supabase.storage.from("shipment-package-images").getPublicUrl(shipment.packageImage).data.publicUrl} 
                          alt="Package Photo" 
                          className="h-32 w-full object-contain"
                        />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-3xl bg-background text-foreground border-none shadow-2xl p-0 overflow-hidden">
          <div className="relative w-full h-[80vh] flex items-center justify-center bg-black/5">
            {shipment.packageImage && (
              <img 
                src={supabase.storage.from("shipment-package-images").getPublicUrl(shipment.packageImage).data.publicUrl}
                alt="Package Photo Full View"
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
