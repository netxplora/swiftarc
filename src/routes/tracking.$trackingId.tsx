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
          ? `${loaderData.shipment.trackingNumber} â€” SwiftArc Tracking`
          : "Not found â€” SwiftArc",
      },
      {
        name: "description",
        content: loaderData
          ? `Live status for shipment ${loaderData.shipment.trackingNumber}: ${statusLabels[loaderData.shipment.status as keyof typeof statusLabels]} Â· ${(loaderData.shipment.origin as any)?.city ?? ""} â†’ ${(loaderData.shipment.destination as any)?.city ?? ""}.`
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
  };

  const [realtimeCheckpoints, setRealtimeCheckpoints] = useState(shipment.checkpoints);
  const [realtimeStatus, setRealtimeStatus] = useState(shipment.status);
  const [realtimeProgress, setRealtimeProgress] = useState(shipment.progress);
  const [notifOpen, setNotifOpen] = useState(false);

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
    <div className="min-h-screen bg-background text-foreground pb-16">
      {/* ========================================================== */}
      {/* PRINT WAYBILL â€” Only visible when printing                  */}
      {/* ========================================================== */}
      <div id="print-waybill">
        <div className="waybill-header">
          <div className="brand-block">
            <div className="brand-name">SwiftArc</div>
            <div className="brand-tagline">Global Logistics &amp; Freight Solutions</div>
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
            <p className="sub">{shipment.type} Â· {shipment.priority} Priority</p>
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
            <p className="sub">{shipment.weightKg} kg Â· {shipment.dimensions} Â· {shipment.pieces} pcs</p>
            {shipment.declaredValue > 0 && <p className="sub">Declared Value: ${shipment.declaredValue.toFixed(2)}{shipment.insurance ? " Â· Insured" : ""}</p>}
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
      {/* SCREEN VIEW                                                 */}
      {/* ========================================================== */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 no-print">
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-display font-bold">Track Shipment</h1>
            <span className="h-3 w-3 rounded-full bg-amber mt-1"></span>
          </div>
          <p className="text-muted-foreground text-sm hidden lg:block mr-auto ml-2">
            Real-time updates and live location of your shipment
          </p>
          <form onSubmit={onSearch} className="flex w-full md:w-[400px] gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter Tracking ID / Reference"
                className="pl-9 h-11 bg-card border-border rounded-lg shadow-sm"
                value={trackInput}
                onChange={(e) => setTrackInput(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="h-11 bg-amber text-navy-deep hover:bg-amber/90 font-bold px-6 shadow-sm rounded-lg"
            >
              Track
            </Button>
          </form>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-3 space-y-6">
            {/* Status Card */}
            <div className="bg-card text-card-foreground rounded-2xl p-6 shadow-sm border border-border">
              <div className="flex items-center justify-between mb-6">
                <Link
                  to="/"
                  className="inline-flex items-center text-sm font-medium text-amber hover:underline"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" /> Home
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Printer className="h-3.5 w-3.5" /> Print Waybill
                </Button>
              </div>

              <div className="mb-6">
                <p className="text-xs text-muted-foreground mb-1">Tracking ID</p>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold font-mono">{shipment.trackingNumber}</h2>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shipment.trackingNumber);
                      toast.success("Copied");
                    }}
                    className="text-muted-foreground hover:text-navy-deep"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 inline-block bg-amber/20 text-navy-deep font-bold text-xs px-3 py-1 rounded-full border border-amber/30">
                  {statusLabels[realtimeStatus] || "In Transit"}
                </div>
              </div>

              <div className="mb-6 pb-6 border-b border-border">
                <p className="text-xs text-muted-foreground mb-1">Estimated Delivery</p>
                <p className="text-lg font-bold text-amber mb-2">
                  {new Date(shipment.estimatedDelivery).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  Â·{" "}
                  {new Date(shipment.estimatedDelivery).toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <div className={`inline-flex items-center gap-1.5 text-xs font-semibold ${hasCustomsHold ? activeHold?.status === 'released' || activeHold?.payment_status === 'paid' ? 'text-emerald-600' : 'text-red-600' : 'text-emerald-600'}`}>
                  {hasCustomsHold && activeHold?.status !== 'released' && activeHold?.payment_status !== 'paid' ? <AlertCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  {hasCustomsHold ? activeHold?.status === 'released' || activeHold?.payment_status === 'paid' ? 'Released' : 'Exception' : 'On Time'}
                </div>
              </div>

              <div className="relative mb-6">
                <div className="absolute left-2.5 top-2 bottom-2 w-px bg-border border-dashed border-l-2"></div>

                <div className="relative flex gap-4 pb-6">
                  <div className="h-5 w-5 rounded-full border-4 border-card bg-amber shadow-sm shrink-0 z-10"></div>
                  <div>
                    <p className="font-bold text-sm">
                      {shipment.origin.city}, {shipment.origin.country}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(shipment.shipDate).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="relative flex gap-4">
                  <div className="h-5 w-5 rounded-full border-4 border-card bg-amber shadow-sm shrink-0 z-10"></div>
                  <div>
                    <p className="font-bold text-sm">
                      {shipment.destination.city}, {shipment.destination.country}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(shipment.estimatedDelivery).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <Button className="w-full bg-amber text-navy-deep hover:bg-amber/90 font-bold rounded-xl h-11">
                <Bell className="h-4 w-4 mr-2" /> Get Updates
              </Button>
            </div>

            {/* Customs Hold Alert */}
            {hasCustomsHold &&
              (() => {
                const isResolved =
                  activeHold?.status === "released" || activeHold?.payment_status === "paid";
                const alertStyle = isResolved
                  ? "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                  : "bg-red-50 text-red-900 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20";
                const iconBg = isResolved ? "bg-emerald-100 dark:bg-emerald-500/20" : "bg-red-100 dark:bg-red-500/20";
                const iconColor = isResolved ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400";
                const subText = isResolved ? "text-emerald-700/80 dark:text-emerald-400/80" : "text-red-700/80 dark:text-red-400/80";
                const innerBox = isResolved ? "border-emerald-100 dark:border-emerald-500/10 bg-white/60 dark:bg-black/20" : "border-red-100 dark:border-red-500/10 bg-white/60 dark:bg-black/20";

                return (
                  <div className={`${alertStyle} rounded-2xl p-6 shadow-sm border`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className={`h-10 w-10 ${iconBg} rounded-full flex items-center justify-center shrink-0`}
                      >
                        {isResolved ? (
                          <CheckCircle2 className={`h-5 w-5 ${iconColor}`} />
                        ) : (
                          <ShieldAlert className={`h-5 w-5 ${iconColor}`} />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg leading-tight">
                          {isResolved ? "Clearance Complete" : "Clearance Hold"}
                        </h3>
                        <p className={`text-sm ${subText}`}>
                          {isResolved ? "Shipment released" : "Action required"}
                        </p>
                      </div>
                    </div>

                    {!isResolved && (
                      <div className="space-y-3 mb-5 text-sm">
                        <div className={`rounded-lg p-3 border ${innerBox}`}>
                          <p className={`text-xs ${subText} mb-0.5`}>Reason</p>
                          <p className="font-medium">
                            {activeHold?.hold_reason || "Customs Inspection Required"}
                          </p>
                        </div>
                        {activeHold?.required_action && (
                          <div className={`rounded-lg p-3 border ${innerBox}`}>
                            <p className={`text-xs ${subText} mb-0.5`}>Required Document</p>
                            <p className="font-medium">{activeHold.required_action}</p>
                          </div>
                        )}
                        {(activeHold?.amount_due > 0 ||
                          activeHold?.status === "payment_required" ||
                          activeHold?.payment_status === "verification_required") && (
                          <div
                            className={`rounded-lg p-3 border ${innerBox} flex items-center justify-between`}
                          >
                            <div>
                              <p className={`text-xs ${subText} mb-0.5`}>Clearance Charges</p>
                              <p className="font-bold">
                                {activeHold?.currency || "USD"}{" "}
                                {Number(activeHold?.amount_due || 0).toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`text-xs ${subText} mb-0.5`}>Status</p>
                              <p className="font-bold capitalize">
                                {activeHold?.payment_status?.replace(/_/g, " ") || "Pending"}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeHold && ["payment_required", "open"].includes(activeHold.status) && (
                      <Button
                        asChild
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl h-11"
                      >
                        <Link to="/pay/$caseId" params={{ caseId: activeHold.id }}>
                          Resolve &amp; Proceed to Payment
                        </Link>
                      </Button>
                    )}

                    {activeHold?.payment_status === "verification_required" && (
                      <div className="text-center text-sm font-semibold text-amber-700 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-500/10 rounded-xl py-3 border border-amber-200 dark:border-amber-500/20 mt-5">
                        <Clock className="h-4 w-4 inline mr-1.5" />
                        Payment Verification Pending
                      </div>
                    )}
                  </div>
                );
              })()}

            {/* Shipment Timeline */}
            <div className="bg-card text-card-foreground rounded-2xl p-6 shadow-sm border border-border">
              <h3 className="font-bold text-lg mb-6">Shipment Timeline</h3>
              <div className="relative space-y-6">
                <div className="absolute left-3.5 top-2 bottom-2 w-px bg-border"></div>

                {[...realtimeCheckpoints].slice().reverse().map((c: any, i) => {
                  const isLatest = i === 0;

                  let Icon = isLatest ? Navigation : MapPin;
                  let bgClass = isLatest
                    ? "bg-emerald-500 text-white"
                    : "bg-border text-muted-foreground";
                  let textClass = isLatest ? "text-foreground" : "text-muted-foreground";

                  if (c.type === "hold_placed") {
                    Icon = ShieldAlert;
                    bgClass = "bg-red-500 text-white";
                    textClass = "text-red-700 font-bold";
                  } else if (c.type === "hold_released") {
                    Icon = CheckCircle2;
                    bgClass = "bg-green-500 text-white";
                    textClass = "text-green-700 font-bold";
                  }

                  return (
                    <div key={c.id} className="relative flex gap-4">
                      <div
                        className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 z-10 border-4 border-card ${bgClass}`}
                      >
                        <Icon className="h-3 w-3" />
                      </div>
                      <div>
                        <p className={`font-bold text-sm ${textClass}`}>{c.status}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{c.facility}</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {new Date(c.timestamp).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button variant="link" className="w-full mt-4 text-amber font-semibold">
                View Full History
              </Button>
            </div>

            {/* Need Help Card */}
            <div className="bg-card text-card-foreground rounded-2xl p-6 shadow-sm border border-border relative overflow-hidden">
              <div className="relative z-10 w-2/3">
                <h3 className="font-bold text-lg mb-2">Need Help?</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Our support team is here to help you
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-semibold rounded-full bg-card h-9 px-4 shadow-sm border-border"
                >
                  <Headphones className="h-3.5 w-3.5 mr-2" /> Contact Support
                </Button>
              </div>
              <div className="absolute -right-4 -bottom-4 h-32 w-32 bg-amber/10 rounded-full blur-2xl"></div>
              <Headphones className="absolute right-4 bottom-4 h-16 w-16 text-amber drop-shadow-xl" />
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-9 space-y-6 flex flex-col">

            {/* â”€â”€ SHIPMENT DETAILS â€” Moved to top â”€â”€ */}
            <div className="bg-card text-card-foreground rounded-2xl p-6 lg:p-8 shadow-sm border border-border">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg">Shipment Details</h3>
                <Button
                  variant="outline"
                  size="sm"
                  data-print-trigger
                  onClick={() => window.print()}
                  className="text-xs font-semibold rounded-lg h-9 px-4 gap-2 no-print"
                >
                  <Printer className="h-3.5 w-3.5" /> Print Waybill
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                {/* Sender */}
                <div className="flex gap-3">
                  <User className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Sender</p>
                    <p className="font-bold text-sm">{shipment.origin.contact}</p>
                    {shipment.origin.line1 && (
                      <p className="text-xs text-muted-foreground">{shipment.origin.line1}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {shipment.origin.city}
                      {shipment.origin.country ? `, ${shipment.origin.country}` : ""}
                      {shipment.origin.zip ? ` ${shipment.origin.zip}` : ""}
                    </p>
                    {shipment.origin.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" /> {shipment.origin.phone}
                      </p>
                    )}
                    {shipment.origin.email && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {shipment.origin.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Receiver */}
                <div className="flex gap-3">
                  <User className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Receiver</p>
                    <p className="font-bold text-sm">{shipment.destination.contact}</p>
                    {shipment.destination.line1 && (
                      <p className="text-xs text-muted-foreground">
                        {shipment.destination.line1}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {shipment.destination.city}
                      {shipment.destination.country ? `, ${shipment.destination.country}` : ""}
                      {shipment.destination.zip ? ` ${shipment.destination.zip}` : ""}
                    </p>
                    {shipment.destination.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3" /> {shipment.destination.phone}
                      </p>
                    )}
                    {shipment.destination.email && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {shipment.destination.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Service Type */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Service Type</p>
                  <p className="font-bold text-sm">{shipment.service}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {shipment.type} Â· {shipment.priority} Priority
                  </p>
                </div>

                {/* Package Info */}
                <div className="flex gap-3">
                  <ClipboardCheck className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Package Details</p>
                    {shipment.description && (
                      <p className="font-bold text-sm">{shipment.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {shipment.weightKg} kg Â· {shipment.dimensions} Â· {shipment.pieces} pcs
                    </p>
                    {shipment.declaredValue > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Declared Value: ${shipment.declaredValue.toFixed(2)}
                        {shipment.insurance && " Â· Insured"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Booking Date & Reference */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Reference No.</p>
                  <p className="font-bold text-sm">{shipment.referenceNumber}</p>

                  <p className="text-xs text-muted-foreground mt-4 mb-1">Booking Date</p>
                  <p className="font-bold text-sm">
                    {new Date(shipment.shipDate).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>

                {/* Route Info */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Route Distance</p>
                  <p className="font-bold text-sm">{shipment.distanceKm}</p>
                  <p className="text-xs text-muted-foreground mt-4 mb-1">Shipping Fee</p>
                  <p className="font-bold text-sm">{shipment.shippingFee}</p>
                </div>
              </div>
            </div>

            {/* Map Area */}
            <div className="relative h-[300px] sm:h-[380px] lg:h-[420px] w-full bg-muted rounded-3xl overflow-hidden shadow-sm border border-border">
              <Suspense fallback={<div className="h-full w-full bg-muted animate-pulse" />}>
                <TrackingMap
                  origin={[shipment.origin.lat, shipment.origin.lng]}
                  destination={[shipment.destination.lat, shipment.destination.lng]}
                  current={livePos}
                  checkpoints={realtimeCheckpoints}
                />
              </Suspense>

              {/* Live Tracking Chip */}
              <div className="absolute top-4 left-4 bg-background/90 backdrop-blur rounded-xl p-3 shadow-sm border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  <span className="font-bold text-sm">Live Tracking</span>
                </div>
                <p className="text-xs text-muted-foreground">Updated 1 min ago</p>
              </div>

              {/* View in Fullscreen Button */}
              <button className="absolute top-4 right-4 bg-background/90 text-foreground backdrop-blur rounded-full px-4 py-2 shadow-sm border border-border font-semibold text-xs flex items-center gap-2 hover:bg-card">
                <Maximize className="h-3.5 w-3.5" /> View in Fullscreen
              </button>
            </div>

            {/* Location & Delivery Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Current Location Card */}
              <div className="bg-card text-card-foreground rounded-2xl p-5 shadow-sm border border-border">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-3">
                  <Navigation className="h-3.5 w-3.5 text-blue-500" /> Current Location
                </p>
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-10 w-10 bg-amber/10 rounded-xl flex items-center justify-center text-amber shrink-0">
                    <Ship className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">
                      {shipment.currentLocation.label ||
                        `${shipment.origin.city} â†’ ${shipment.destination.city}`}
                    </h4>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {livePos[0].toFixed(4)}Â° {livePos[0] >= 0 ? "N" : "S"},{" "}
                      {Math.abs(livePos[1]).toFixed(4)}Â° {livePos[1] >= 0 ? "E" : "W"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-6 text-xs">
                  <div>
                    <span className="text-muted-foreground">Origin:</span>{" "}
                    <span className="font-semibold">
                      {shipment.origin.city}, {shipment.origin.country}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Destination:</span>{" "}
                    <span className="font-semibold">
                      {shipment.destination.city}, {shipment.destination.country}
                    </span>
                  </div>
                </div>
              </div>

              {/* Estimated Delivery Card */}
              <div className="bg-card text-card-foreground rounded-2xl p-5 shadow-sm border border-border">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-3">
                  <Calendar className="h-3.5 w-3.5 text-emerald-500" /> Estimated Delivery
                </p>
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <h3 className="font-display font-bold text-2xl mb-1">
                      {new Date(shipment.estimatedDelivery).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </h3>
                    <p className="text-sm font-semibold">
                      {new Date(shipment.estimatedDelivery).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      <span className="text-muted-foreground font-normal">
                        ({Intl.DateTimeFormat().resolvedOptions().timeZone})
                      </span>
                    </p>
                  </div>
                  <span
                    className={`font-bold text-[10px] px-2 py-1 rounded-md ${
                      hasCustomsHold
                        ? activeHold?.status === "released" || activeHold?.payment_status === "paid"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                        : "bg-amber/20 text-navy-deep"
                    }`}
                  >
                    {hasCustomsHold 
                      ? activeHold?.status === "released" || activeHold?.payment_status === "paid"
                        ? "Released"
                        : "On Hold"
                      : "On Time"}
                  </span>
                </div>
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-amber rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${realtimeProgress}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold">{realtimeProgress}%</span>
                </div>
                <div className="flex justify-between text-xs font-medium text-muted-foreground">
                  <span>{statusLabels[realtimeStatus] || "In Progress"}</span>
                  {shipment.estimatedTravelTime && shipment.estimatedTravelTime !== "N/A" && (
                    <span>Est. {shipment.estimatedTravelTime}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatBox icon={Truck} label="Service" value={shipment.service} />
              <StatBox icon={Navigation} label="Distance" value={shipment.distanceKm} />
              <StatBox icon={Clock} label="Travel Time" value={shipment.estimatedTravelTime} />
              <StatBox
                icon={Package}
                label="Package"
                value={`${shipment.weightKg} kg Â· ${shipment.pieces} pcs`}
              />
            </div>

            {/* Notifications */}
            <div className="bg-card text-card-foreground rounded-2xl p-6 shadow-sm border border-border flex flex-col">
              <h3 className="font-bold text-lg mb-6">Notifications</h3>
              <div className="space-y-4 flex-1">
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <div className="h-3 w-3 rounded-full border-2 border-emerald-500"></div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-sm">In Transit Update</p>
                      <span className="text-[10px] text-muted-foreground">1 min ago</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Your shipment is on the way
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-amber/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-amber" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-sm">Location Update</p>
                      <span className="text-[10px] text-muted-foreground">1 min ago</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">New location available</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-amber/10 flex items-center justify-center shrink-0">
                    <Bell className="h-4 w-4 text-amber" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <p className="font-semibold text-sm">ETA Update</p>
                      <span className="text-[10px] text-muted-foreground">2 hours ago</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Estimated delivery updated
                    </p>
                  </div>
                </div>
              </div>
              <Button onClick={() => setNotifOpen(true)} variant="link" className="w-full mt-4 text-amber font-semibold">
                View All Notifications
              </Button>
            </div>

            {/* Shipment Progress Horizontal Stepper */}
            <div className="bg-card text-card-foreground rounded-2xl p-6 sm:p-8 shadow-sm border border-border">
              <h3 className="font-bold text-lg mb-8">Shipment Progress</h3>
              <div className="relative overflow-x-auto hide-scrollbar pb-4 -mb-4">
                <div className="min-w-[700px] relative mt-2 px-2">
                  {/* Track background */}
                  <div className="absolute left-[5%] right-[5%] top-6 h-0.5 bg-muted"></div>
                  {/* Amber fill — width is % of the 90% track span */}
                  <div
                    className="absolute left-[5%] top-6 h-0.5 bg-amber transition-all duration-1000"
                    style={{ width: `calc(${realtimeProgress / 100} * 90%)` }}
                  ></div>

                  <div className="flex justify-between relative z-10">
                  <ProgressStep
                    icon={ClipboardCheck}
                    label="Booked"
                    date="May 18"
                    active={realtimeProgress >= 10}
                  />
                  <ProgressStep
                    icon={Package}
                    label="Picked Up"
                    date="May 19"
                    active={realtimeProgress >= 30}
                  />
                  <ProgressStep
                    icon={Anchor}
                    label="Arrived at Port"
                    date="May 20"
                    active={realtimeProgress >= 50}
                  />
                  <ProgressStep
                    icon={Ship}
                    label="Departed"
                    date="May 20"
                    active={realtimeProgress >= 60}
                  />
                  <ProgressStep
                    icon={Navigation}
                    label="In Transit"
                    date="May 21"
                    active={realtimeProgress >= 75}
                    current={realtimeProgress < 90 && realtimeProgress >= 75}
                  />
                  <ProgressStep
                    icon={MapPin}
                    label="Arriving at Destination"
                    date=""
                    active={realtimeProgress >= 90}
                  />
                  <ProgressStep
                    icon={CheckCircle2}
                    label="Delivered"
                    date=""
                    active={realtimeProgress === 100}
                  />
                </div>
              </div>
            </div>
          </div>

            {/* Bottom Banners */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="bg-card text-card-foreground rounded-2xl p-6 shadow-sm border border-border flex items-center justify-between overflow-hidden relative">
                <div className="z-10 w-2/3">
                  <h3 className="font-bold text-lg mb-1">
                    Track on the go with SwiftArc Mobile App
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Stay updated wherever you are. Track your shipments, receive delivery
                    notifications and follow your package in real time from your phone.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <div className="h-10 px-4 bg-foreground rounded-lg flex items-center justify-center text-background text-xs font-bold gap-2 cursor-not-allowed opacity-80">
                      <Search className="h-4 w-4" /> App Store
                    </div>
                    <div className="h-10 px-4 bg-foreground rounded-lg flex items-center justify-center text-background text-xs font-bold gap-2 cursor-not-allowed opacity-80">
                      <Search className="h-4 w-4" /> Google Play
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground/70 mt-2">Coming Soon</p>
                </div>
                <div className="absolute right-0 top-6 bottom-0 w-1/3 bg-muted rounded-tl-2xl border-t-4 border-l-4 border-border"></div>
              </div>

              <div className="bg-card text-card-foreground rounded-2xl p-6 shadow-sm border border-border flex items-center justify-between overflow-hidden relative">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 w-24 h-24 bg-amber/20 rounded-xl flex items-center justify-center">
                  <Box className="h-10 w-10 text-amber" />
                </div>
                <div className="z-10 ml-36">
                  <h3 className="font-bold text-lg mb-1">Need to ship something?</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Get a quote and book your shipment in minutes.
                  </p>
                  <Button className="bg-amber text-navy-deep hover:bg-amber/90 font-bold rounded-lg px-6 h-10">
                    Book a Shipment
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
        <DialogContent className="max-w-md bg-card text-foreground">
          <DialogHeader>
            <DialogTitle>All Notifications</DialogTitle>
          </DialogHeader>
          <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2 space-y-4">
            {realtimeCheckpoints.map((event: any, i: number) => (
              <div key={event.id || i} className="flex gap-4 p-3 rounded-lg border border-border bg-background shadow-sm">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                  event.type === 'hold_placed' ? 'bg-red-100 text-red-600' :
                  event.type === 'hold_released' ? 'bg-emerald-100 text-emerald-600' :
                  'bg-amber/10 text-amber'
                }`}>
                  {event.type === 'hold_placed' ? <ShieldAlert className="h-5 w-5" /> :
                   event.type === 'hold_released' ? <CheckCircle2 className="h-5 w-5" /> :
                   <MapPin className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <p className="font-semibold text-sm leading-tight text-foreground">{event.status}</p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap pt-0.5">
                      {new Date(event.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {event.facility}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                    {new Date(event.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {realtimeCheckpoints.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-3 opacity-20" />
                <p>No notifications yet</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


function StatBox({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-card text-card-foreground rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-border">
      <div className="h-10 w-10 bg-amber/10 rounded-xl flex items-center justify-center text-amber shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest truncate">
          {label}
        </p>
        <p className="font-bold text-sm truncate">{value}</p>
      </div>
    </div>
  );
}

function ProgressStep({
  icon: Icon,
  label,
  date,
  active,
  current,
}: {
  icon: any;
  label: string;
  date: string;
  active: boolean;
  current?: boolean;
}) {
  return (
    <div className="flex flex-col items-center w-16 text-center">
      <div
        className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-3 transition-colors ${current ? "bg-amber text-white shadow-lg shadow-amber/30 scale-110" : active ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-muted text-muted-foreground/50"}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p
        className={`text-[11px] font-bold leading-tight ${active ? "text-foreground" : "text-muted-foreground/50"}`}
      >
        {label}
      </p>
      {date && (
        <p
          className={`text-[10px] mt-1 ${active ? "text-muted-foreground" : "text-muted-foreground/30"}`}
        >
          {date}
        </p>
      )}
    </div>
  );
}
