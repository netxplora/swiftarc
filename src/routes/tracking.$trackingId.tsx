import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState, Suspense, lazy } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  ArrowLeft, MapPin, Package, ShieldCheck, Thermometer, Activity,
  Sparkles, Bell, RotateCcw, ClipboardCheck, ImageIcon, AlertTriangle,
  User, Building, Phone, Mail, Hash, Scale, Box, Truck, CheckCircle2,
  Calendar, Clock, FileText, Download, Navigation, MoreHorizontal, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareDialog } from "@/components/tracking/ShareDialog";
import { statusLabels } from "@/lib/types";
import { resolveTracking } from "@/lib/api.functions";
import { supabase } from "@/integrations/supabase/client";
import { generateShippingLabel } from "@/lib/pdf";
import { TrackingSkeleton } from "@/components/skeletons/TrackingSkeleton";

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
    referenceNumber: s.reference ?? `REF-${Math.floor(Math.random() * 90000) + 10000}`,
    service: s.service,
    priority: s.service === "Priority Overnight" ? "High" : "Standard",
    type: s.origin?.country_code !== s.destination?.country_code ? "International" : "Domestic",
    status: s.status as any,
    progress: s.status === "delivered" ? 100 : s.status === "out_for_delivery" ? 88 : s.status === "in_transit" ? 55 : s.status === "picked_up" ? 25 : 8,
    origin: { 
      city: s.origin?.city ?? "Origin", 
      country: s.origin?.country_code ?? s.origin?.country ?? "", 
      lat: s.origin?.lat ?? 0, 
      lng: s.origin?.lng ?? 0,
      contact: s.origin?.contact_name ?? "Sender Info Unavailable",
      phone: s.origin?.phone ?? "+1 (555) 010-0000",
      email: s.origin?.email ?? "contact@sender.com",
      line1: s.origin?.line1 ?? "123 Origin St",
      zip: s.origin?.postal_code ?? "00000"
    },
    destination: { 
      city: s.destination?.city ?? "Destination", 
      country: s.destination?.country_code ?? s.destination?.country ?? "", 
      lat: s.destination?.lat ?? 0, 
      lng: s.destination?.lng ?? 0,
      contact: s.destination?.contact_name ?? "Recipient Info Unavailable",
      phone: s.destination?.phone ?? "+1 (555) 011-1111",
      email: s.destination?.email ?? "contact@recipient.com",
      line1: s.destination?.line1 ?? "456 Destination Ave",
      zip: s.destination?.postal_code ?? "99999"
    },
    currentLocation: { lat: (data as any).events?.[0]?.lat ?? s.destination?.lat ?? 0, lng: (data as any).events?.[0]?.lng ?? s.destination?.lng ?? 0, label: (data as any).events?.[0]?.location ?? "Processing" },
    weightKg: s.package?.weight_kg ?? 0,
    dimensions: `${s.package?.length_cm ?? 0} × ${s.package?.width_cm ?? 0} × ${s.package?.height_cm ?? 0} cm`,
    pieces: s.package?.pieces ?? 1,
    declaredValue: s.declaredValue ?? 0,
    insurance: s.insurance ?? false,
    fragile: true,
    dangerousGoods: s.is_hazmat ?? false,
    shipDate: s.createdAt ?? s.created_at ?? new Date().toISOString(),
    estimatedDelivery: s.estimatedDelivery ?? s.estimated_delivery ?? new Date(Date.now() + 3 * 86400_000).toISOString(),
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

  const holdsAndExceptions = realtimeCheckpoints.filter((c: any) => 
    c.status.toLowerCase().includes("delay") || 
    c.status.toLowerCase().includes("hold") || 
    c.status.toLowerCase().includes("exception") || 
    c.status.toLowerCase().includes("inspection")
  );

  return (
    <div className="bg-secondary/20 pb-20">
      {/* Sticky Enterprise Header */}
      <div className="sticky top-16 z-30 border-b border-border bg-background/95 backdrop-blur shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link to="/tracking" className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:bg-secondary">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-mono text-2xl font-bold uppercase tracking-tight">{shipment.trackingNumber}</h1>
                <StatusBadge status={shipment.status} />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ref: {shipment.referenceNumber} · {shipment.service} ({shipment.type})
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ShareDialog trackingNumber={shipment.trackingNumber} />
            <Button variant="outline" size="sm" className="hidden sm:flex" onClick={() => {
              generateShippingLabel({
                trackingNumber: shipment.trackingNumber,
                service: shipment.service,
                weightKg: shipment.weightKg,
                origin: { city: shipment.origin.city, country: shipment.origin.country },
                destination: { city: shipment.destination.city, country: shipment.destination.country },
                recipient: shipment.destination.contact
              });
              toast.success("Label generated");
            }}>
              <Package className="mr-2 h-4 w-4" /> Print Label
            </Button>
            <Button size="sm" className="bg-navy-deep text-cream hover:bg-navy" onClick={() => toast.success("Notifications enabled")}>
              <Bell className="mr-2 h-4 w-4" /> Subscribe
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        
        {/* Progress Bar Overview */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/30 to-transparent pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 relative z-10">
            <div>
              <h2 className="font-display text-xl font-bold">Shipment Progress</h2>
              <p className="text-sm text-muted-foreground mt-1">Live updates on your delivery</p>
            </div>
            <div className="text-left sm:text-right mt-4 sm:mt-0">
              <div className="flex items-baseline gap-2 sm:justify-end">
                <span className="font-display text-3xl font-bold text-navy-deep">{shipment.progress}%</span>
                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Complete</span>
              </div>
              {shipment.status !== 'delivered' && (
                <p className="text-sm text-amber font-medium mt-1">ETA: {new Date(shipment.estimatedDelivery).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
              )}
            </div>
          </div>
          
          <div className="relative z-10 w-full">
            {/* The animated track */}
            <div className="relative h-3 w-full rounded-full bg-secondary overflow-hidden shadow-inner">
              <motion.div
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-amber to-amber/80 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${shipment.progress}%` }}
                transition={{ duration: 1.5, ease: [0.25, 1, 0.5, 1] }}
              >
                <motion.div
                  className="absolute inset-0 bg-white/30"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                />
              </motion.div>
            </div>
            
            {/* Steps - Mobile optimized (hidden on very small screens, or scrollable) */}
            <div className="mt-6 grid grid-cols-4 gap-2 text-center relative z-10">
              {[
                { label: "Created", th: 0, icon: FileText },
                { label: "Picked Up", th: 25, icon: Package },
                { label: "In Transit", th: 55, icon: Truck },
                { label: "Delivered", th: 100, icon: CheckCircle2 }
              ].map((step, i) => {
                const active = shipment.progress >= step.th;
                return (
                  <div key={step.label} className="flex flex-col items-center">
                    <div className={`mb-2 grid h-8 w-8 sm:h-10 sm:w-10 place-items-center rounded-full border-2 transition-colors duration-500 ${active ? "border-amber bg-amber/10 text-amber shadow-sm" : "border-border bg-card text-muted-foreground"}`}>
                      <step.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <span className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider transition-colors duration-500 ${active ? "text-navy-deep" : "text-muted-foreground"}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Holds and Exceptions Alerts */}
        {holdsAndExceptions.length > 0 && (
          <div className="rounded-xl border border-warning/50 bg-warning/10 p-6">
            <div className="flex items-center gap-2 text-warning mb-4">
              <AlertTriangle className="h-5 w-5" />
              <h2 className="font-semibold text-lg">Transit Interruptions & Holds</h2>
            </div>
            <div className="space-y-4">
              {holdsAndExceptions.map((c: any) => (
                <div key={c.id} className="flex flex-col sm:flex-row sm:justify-between bg-card p-4 rounded-lg border border-warning/20">
                  <div>
                    <p className="font-medium">{c.status}</p>
                    <p className="text-sm text-muted-foreground mt-1">{c.facility}</p>
                  </div>
                  <div className="mt-2 sm:mt-0 text-sm font-mono text-muted-foreground text-left sm:text-right">
                    {new Date(c.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          
          <div className="space-y-8 lg:col-span-2">
            {/* Interactive Map */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="overflow-hidden rounded-xl border border-border min-h-[400px] shadow-sm bg-card relative"
            >
              <div className="absolute top-4 left-4 z-20 flex gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-xs font-semibold backdrop-blur shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber" />
                  </span>
                  GPS Active Sync
                </span>
              </div>
              <Suspense fallback={<div className="h-[400px] w-full bg-secondary animate-pulse" />}>
                <TrackingMap
                  origin={[shipment.origin.lat, shipment.origin.lng]}
                  destination={[shipment.destination.lat, shipment.destination.lng]}
                  current={livePos}
                  checkpoints={realtimeCheckpoints}
                />
              </Suspense>
            </motion.div>

            {/* Detailed History Timeline */}
            <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="font-display text-xl mb-6">Shipment Route & Transit History</h2>
              <div className="relative border-l-2 border-secondary ml-4 space-y-8">
                {[...realtimeCheckpoints].reverse().map((c: any, i) => {
                  const isLatest = i === realtimeCheckpoints.length - 1;
                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                      className="relative pl-6"
                    >
                      <span className={`absolute -left-[17px] top-1 flex h-8 w-8 items-center justify-center rounded-full border-4 border-card ${isLatest ? "bg-amber text-navy-deep" : "bg-secondary text-muted-foreground"}`}>
                        {isLatest ? <Navigation className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                      </span>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <div>
                          <p className={`font-semibold ${isLatest ? "text-navy-deep" : ""}`}>{c.status}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">{c.facility}</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-sm font-medium">{new Date(c.timestamp).toLocaleDateString()}</p>
                          <p className="text-xs text-muted-foreground">{new Date(c.timestamp).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </section>

            {/* Delivery Confirmation */}
            {shipment.proofOfDelivery && (
              <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                  <h2 className="font-display text-xl">Delivery Confirmation</h2>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <Label>Signed by</Label>
                    <p className="mt-1 font-display text-2xl">{shipment.proofOfDelivery.signedBy}</p>
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
                    <Label>Delivery Photo</Label>
                    <div className="mt-1 grid aspect-video place-items-center rounded-xl border border-border bg-secondary/60 text-muted-foreground">
                      <div className="text-center">
                        <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground/50" />
                        <p className="mt-2 text-xs">{shipment.proofOfDelivery.photoNote}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* Right Sidebar: Details Grid */}
          <aside className="space-y-6">
            
            {/* Commercial Invoice / Documents */}
            <section className="rounded-xl border border-border bg-card p-6 shadow-sm overflow-hidden relative group">
              <div className="absolute inset-0 bg-navy-deep opacity-0 group-hover:opacity-5 transition-opacity" />
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-amber" />
                <h3 className="font-semibold text-lg">Documents & Invoices</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Access official commercial invoices and customs documentation for this shipment.
              </p>
              <div className="flex flex-col gap-2">
                <Button 
                  className="w-full justify-between border-navy-deep/20 hover:bg-navy-deep hover:text-cream transition-colors" 
                  variant="outline"
                  onClick={async () => {
                    const { jsPDF } = await import("jspdf");
                    const doc = new jsPDF({ unit: "pt", format: "a4" });
                    doc.setFont("helvetica", "bold").setFontSize(22).text("SwiftArc Commercial Invoice", 40, 60);
                    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor("#64748b").text(`Tracking: ${shipment.trackingNumber}`, 40, 78);
                    
                    doc.setTextColor("#0b1220").setFontSize(14).setFont("helvetica", "bold").text("Billed to:", 40, 120);
                    doc.setFontSize(10).setFont("helvetica", "normal").setTextColor("#475569");
                    doc.text(`${shipment.origin.contact}`, 40, 140);
                    doc.text(`${shipment.origin.line1}`, 40, 156);
                    doc.text(`${shipment.origin.city}, ${shipment.origin.zip}, ${shipment.origin.country}`, 40, 172);
                    doc.text(`Phone: ${shipment.origin.phone}`, 40, 188);
                    
                    doc.setTextColor("#0b1220").setFontSize(14).setFont("helvetica", "bold").text("Shipped to:", 300, 120);
                    doc.setFontSize(10).setFont("helvetica", "normal").setTextColor("#475569");
                    doc.text(`${shipment.destination.contact}`, 300, 140);
                    doc.text(`${shipment.destination.line1}`, 300, 156);
                    doc.text(`${shipment.destination.city}, ${shipment.destination.zip}, ${shipment.destination.country}`, 300, 172);
                    doc.text(`Phone: ${shipment.destination.phone}`, 300, 188);

                    doc.setDrawColor("#e2e8f0").line(40, 220, 555, 220);
                    doc.setTextColor("#0b1220").setFontSize(11).setFont("helvetica", "bold");
                    doc.text("Description", 40, 240); 
                    doc.text("Qty", 350, 240); 
                    doc.text("Unit Price", 410, 240); 
                    doc.text("Amount", 500, 240);
                    
                    doc.setDrawColor("#e2e8f0").line(40, 250, 555, 250);
                    
                    doc.setFont("helvetica", "normal").setFontSize(10);
                    doc.text(`Logistics Services - ${shipment.service}`, 40, 270);
                    doc.text(`Weight: ${shipment.weightKg}kg | Dimensions: ${shipment.dimensions}`, 40, 285);
                    doc.text(`${shipment.pieces}`, 350, 270);
                    
                    const unitPrice = (shipment.declaredValue * 0.05).toFixed(2);
                    const amount = (shipment.declaredValue * 0.05 * shipment.pieces).toFixed(2);
                    
                    doc.text(`$${unitPrice}`, 410, 270);
                    doc.text(`$${amount}`, 500, 270);
                    
                    doc.setDrawColor("#cbd5e1").line(350, 310, 555, 310);
                    doc.setFont("helvetica", "bold").setFontSize(12).setTextColor("#0b1220");
                    doc.text("Total:", 410, 330);
                    doc.text(`$${amount}`, 500, 330);
                    
                    doc.setFontSize(8).setFont("helvetica", "normal").setTextColor("#94a3b8");
                    doc.text("Thank you for shipping with SwiftArc. Please retain this invoice for your records.", 40, 780);

                    doc.save(`invoice_${shipment.trackingNumber}.pdf`);
                    toast.success("Invoice downloaded successfully");
                  }}
                >
                  <span className="flex items-center gap-2"><Download className="h-4 w-4" /> Commercial Invoice</span>
                  <span className="text-xs font-mono text-muted-foreground group-hover:text-cream/70">PDF</span>
                </Button>
                <Button 
                  className="w-full justify-between border-navy-deep/20 hover:bg-navy-deep hover:text-cream transition-colors" 
                  variant="ghost" 
                  onClick={async () => {
                    const { jsPDF } = await import("jspdf");
                    const doc = new jsPDF({ unit: "pt", format: "a4" });
                    doc.setFont("helvetica", "bold").setFontSize(22).text("Customs Declaration", 40, 60);
                    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor("#64748b").text(`Tracking: ${shipment.trackingNumber} | Date: ${new Date().toLocaleDateString()}`, 40, 78);
                    
                    doc.setTextColor("#0b1220").setFontSize(12).setFont("helvetica", "bold").text("Sender (Exporter):", 40, 120);
                    doc.setFontSize(10).setFont("helvetica", "normal").setTextColor("#475569");
                    doc.text(`${shipment.origin.contact}\n${shipment.origin.line1}\n${shipment.origin.city}, ${shipment.origin.zip}, ${shipment.origin.country}`, 40, 140);
                    
                    doc.setTextColor("#0b1220").setFontSize(12).setFont("helvetica", "bold").text("Receiver (Importer):", 300, 120);
                    doc.setFontSize(10).setFont("helvetica", "normal").setTextColor("#475569");
                    doc.text(`${shipment.destination.contact}\n${shipment.destination.line1}\n${shipment.destination.city}, ${shipment.destination.zip}, ${shipment.destination.country}`, 300, 140);
                    
                    doc.setDrawColor("#e2e8f0").line(40, 200, 555, 200);
                    
                    doc.setTextColor("#0b1220").setFontSize(11).setFont("helvetica", "bold");
                    doc.text("Item Description", 40, 220); 
                    doc.text("Weight", 250, 220); 
                    doc.text("Quantity", 350, 220); 
                    doc.text("Value", 450, 220);
                    doc.setDrawColor("#e2e8f0").line(40, 235, 555, 235);
                    
                    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor("#475569");
                    doc.text(`Commercial Goods - General`, 40, 255);
                    doc.text(`${shipment.weightKg} kg`, 250, 255);
                    doc.text(`${shipment.pieces}`, 350, 255);
                    doc.text(`$${shipment.declaredValue.toFixed(2)}`, 450, 255);
                    
                    doc.setDrawColor("#e2e8f0").line(40, 275, 555, 275);
                    
                    doc.setTextColor("#0b1220").setFontSize(10).setFont("helvetica", "bold");
                    doc.text("Certification:", 40, 310);
                    doc.setFont("helvetica", "normal").setTextColor("#475569");
                    doc.text("I certify that the particulars given in this customs declaration are correct and that this item\ndoes not contain any dangerous article or articles prohibited by legislation or by postal or\ncustoms regulations.", 40, 330);
                    
                    doc.setDrawColor("#0b1220").line(40, 400, 250, 400);
                    doc.text("Signature of Sender", 40, 415);
                    
                    doc.save(`customs_declaration_${shipment.trackingNumber}.pdf`);
                    toast.success("Customs docs downloaded");
                  }}
                >
                  <span className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4" /> Customs Declaration</span>
                  <span className="text-xs font-mono text-muted-foreground group-hover:text-cream/70">PDF</span>
                </Button>
              </div>
            </section>

            {/* Sender & Receiver Cards (Redesigned) */}
            <div className="grid gap-4">
              <section className="rounded-xl border border-border bg-card p-0 shadow-sm overflow-hidden flex flex-col">
                <div className="bg-secondary/50 p-4 border-b border-border flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-background border border-border grid place-items-center text-navy-deep shadow-sm shrink-0">
                    <Building className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground">Sender</h3>
                    <p className="font-display font-bold text-lg leading-tight">{shipment.origin.contact}</p>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex gap-3 items-start">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{shipment.origin.line1}</p>
                      <p className="text-sm text-muted-foreground">{shipment.origin.city}, {shipment.origin.zip}</p>
                      <p className="text-sm text-muted-foreground">{shipment.origin.country}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-center">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <p className="text-sm font-medium">{shipment.origin.phone}</p>
                  </div>
                  <div className="flex gap-3 items-center">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <p className="text-sm font-medium text-amber hover:underline cursor-pointer">{shipment.origin.email}</p>
                  </div>
                </div>
              </section>

              <div className="flex justify-center -my-3 relative z-10">
                <div className="h-8 w-8 rounded-full bg-background border border-border grid place-items-center shadow-sm text-muted-foreground">
                  <ArrowLeft className="h-4 w-4 -rotate-90" />
                </div>
              </div>

              <section className="rounded-xl border border-border bg-card p-0 shadow-sm overflow-hidden flex flex-col">
                <div className="bg-secondary/50 p-4 border-b border-border flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-background border border-border grid place-items-center text-navy-deep shadow-sm shrink-0">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground">Receiver</h3>
                    <p className="font-display font-bold text-lg leading-tight">{shipment.destination.contact}</p>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="flex gap-3 items-start">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{shipment.destination.line1}</p>
                      <p className="text-sm text-muted-foreground">{shipment.destination.city}, {shipment.destination.zip}</p>
                      <p className="text-sm text-muted-foreground">{shipment.destination.country}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-center">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <p className="text-sm font-medium">{shipment.destination.phone}</p>
                  </div>
                  <div className="flex gap-3 items-center">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <p className="text-sm font-medium text-amber hover:underline cursor-pointer">{shipment.destination.email}</p>
                  </div>
                </div>
              </section>
            </div>

            {/* Package Info Card */}
            <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Box className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Package Information</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <DataPoint label="Weight" value={`${shipment.weightKg} kg`} />
                <DataPoint label="Pieces" value={String(shipment.pieces)} />
                <DataPoint label="Dimensions" value={shipment.dimensions} className="col-span-2" />
                <DataPoint label="Declared Value" value={`$${shipment.declaredValue.toLocaleString()}`} />
                <DataPoint label="Insurance" value={shipment.insurance ? "Active" : "None"} />
              </div>
              
              <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-2">
                {shipment.fragile && <Badge tone="warning">Fragile</Badge>}
                {shipment.dangerousGoods && <Badge tone="destructive">Dangerous Goods</Badge>}
                <Badge tone="default">Handle with care</Badge>
              </div>
            </section>

            {/* AI Logistics Analysis */}
            <section className="rounded-xl border border-amber/30 bg-amber/5 p-6">
              <div className="flex items-center gap-2 text-navy-deep mb-3">
                <Sparkles className="h-4 w-4 text-amber" />
                <h3 className="text-xs font-semibold uppercase tracking-widest">AI Logistics Analysis</h3>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-display text-3xl font-bold text-navy-deep">{shipment.onTimeConfidence}%</span>
                <span className="text-sm text-navy-deep/70">confidence</span>
              </div>
              <p className="text-sm text-navy-deep/80">{shipment.aiNote}</p>
            </section>

            {/* Condition Sensors */}
            <section className="rounded-xl border border-border bg-navy-deep p-6 text-cream shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-amber mb-4">Live Condition Sync</h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-navy p-3">
                  <ShieldCheck className="mx-auto h-4 w-4 text-amber mb-2" />
                  <div className="font-display text-lg">{shipment.healthScore}</div>
                  <div className="text-[10px] uppercase tracking-widest text-cream/60">Health</div>
                </div>
                <div className="rounded-lg bg-navy p-3">
                  <Thermometer className="mx-auto h-4 w-4 text-amber mb-2" />
                  <div className="font-display text-lg">{shipment.temperatureC}°C</div>
                  <div className="text-[10px] uppercase tracking-widest text-cream/60">Temp</div>
                </div>
                <div className="rounded-lg bg-navy p-3">
                  <Activity className="mx-auto h-4 w-4 text-amber mb-2" />
                  <div className="font-display text-lg">{shipment.shockEvents}</div>
                  <div className="text-[10px] uppercase tracking-widest text-cream/60">Shocks</div>
                </div>
              </div>
            </section>

          </aside>
        </div>
      </div>
    </div>
  );
}

function ContactRow({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <span className="text-sm">{text}</span>
    </div>
  );
}

function DataPoint({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      <p className="mt-0.5 font-medium text-sm">{value}</p>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{children}</p>;
}

function Badge({ children, tone }: { children: React.ReactNode; tone: "default" | "warning" | "destructive" }) {
  const tones = {
    default: "bg-secondary text-foreground border-border",
    warning: "bg-warning/20 text-warning-foreground border-warning/30",
    destructive: "bg-destructive/15 text-destructive border-destructive/30"
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tones[tone]}`}>
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: keyof typeof statusLabels }) {
  const tone: Record<string, string> = {
    delivered: "bg-success/20 text-success border-success/30",
    out_for_delivery: "bg-amber/20 text-navy-deep border-amber/30",
    in_transit: "bg-secondary text-foreground border-border",
    picked_up: "bg-secondary text-foreground border-border",
    label_created: "bg-muted text-muted-foreground border-transparent",
    exception: "bg-destructive/20 text-destructive border-destructive/30",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${tone[status] ?? "bg-secondary"}`}>
      {status === 'in_transit' || status === 'out_for_delivery' ? (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
        </span>
      ) : (
        <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-current" />
      )}
      {statusLabels[status]}
    </span>
  );
}
