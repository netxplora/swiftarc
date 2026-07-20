import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Scan, PenTool, CheckCircle2, Navigation, Activity, Package, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { resolveTracking, submitProofOfDelivery, updateTelemetry, getCourierManifest } from "@/lib/api.functions";
import { cn } from "@/lib/utils";

import { PageSkeleton } from "@/components/skeletons/PageSkeleton";

export const Route = createFileRoute("/courier")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/login", search: { redirect: location.pathname } });
    }
    return { user: data.user };
  },
  head: () => ({
    meta: [
      { title: "Courier Manifest — SwiftArc" },
      { name: "robots", content: "noindex" },
    ],
  }),
  pendingComponent: PageSkeleton,
  pendingMs: 150,
  component: CourierPortal,
});

function CourierPortal() {
  const qc = useQueryClient();
  const fetchManifest = useServerFn(getCourierManifest);
  const resolve = useServerFn(resolveTracking);
  
  const manifestQuery = useQuery({ queryKey: ["courier-manifest"], queryFn: () => fetchManifest() });
  
  const [trackingNumber, setTrackingNumber] = useState("");
  const [activeShipment, setActiveShipment] = useState<any>(null);

  const searchMut = useMutation({
    mutationFn: (tn: string) => resolve({ data: { trackingNumber: tn } }),
    onSuccess: (res) => {
      if (res.kind === "none") {
        toast.error("Package not found");
      } else {
        setActiveShipment(res.shipment);
      }
    },
  });

  const handleScan = () => {
    if (trackingNumber.trim()) searchMut.mutate(trackingNumber.trim());
  };

  if (activeShipment) {
    return (
      <div className="min-h-screen bg-secondary/30 pb-20">
        <div className="bg-navy-deep px-4 py-4 text-cream shadow-md sticky top-0 z-10 flex items-center gap-3">
          <button onClick={() => setActiveShipment(null)} className="rounded-full p-2 hover:bg-cream/10">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-lg font-bold">Dropoff Details</h1>
            <p className="text-xs text-cream/70 font-mono uppercase">{activeShipment.trackingNumber}</p>
          </div>
        </div>

        <div className="mx-auto mt-6 max-w-md px-4 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Delivery To</p>
                  <p className="mt-1 font-display text-lg">{activeShipment.destination?.city}, {activeShipment.destination?.country_code}</p>
                  <p className="text-sm text-muted-foreground">{activeShipment.service}</p>
                </div>
                <span className="rounded-full bg-amber/20 px-2.5 py-0.5 text-xs font-semibold text-navy-deep">
                  {activeShipment.status}
                </span>
              </div>
            </CardContent>
          </Card>

          <DeliveryForm trackingNumber={activeShipment.trackingNumber || activeShipment.id} onComplete={() => {
            qc.invalidateQueries({ queryKey: ["courier-manifest"] });
            setActiveShipment(null);
          }} />
          <TelemetryForm trackingNumber={activeShipment.trackingNumber || activeShipment.id} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 pb-20">
      <div className="bg-navy-deep px-4 py-6 text-cream shadow-md sticky top-0 z-10">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <Navigation className="h-6 w-6 text-amber" />
          <h1 className="font-display text-xl font-bold">Driver Manifest</h1>
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-md px-4 space-y-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-4">
              <Button 
                className="w-full py-8 text-lg bg-navy-deep text-cream hover:bg-navy flex flex-col items-center gap-2 h-auto"
                onClick={() => {
                  toast.info("Camera started. Align barcode within frame.");
                  // Simulate successful scan after 2 seconds
                  setTimeout(() => {
                    const sampleTracking = manifestQuery.data?.[0]?.tracking_number;
                    if (sampleTracking) {
                      setTrackingNumber(sampleTracking);
                      searchMut.mutate(sampleTracking);
                      toast.success("Barcode scanned successfully!");
                    } else {
                      toast.error("No active shipments to scan.");
                    }
                  }, 2000);
                }}
              >
                <Scan className="h-8 w-8 text-amber" />
                Tap to Scan Barcode
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or enter manually</span></div>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Tracking Number"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="font-mono uppercase h-12 text-lg"
                />
                <Button onClick={handleScan} className="h-12 w-12 shrink-0 bg-secondary text-foreground hover:bg-border" disabled={searchMut.isPending || !trackingNumber}>
                  {searchMut.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowLeft className="h-5 w-5 rotate-180" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Today's Route</h2>
          
          {manifestQuery.isLoading ? (
            <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : manifestQuery.data?.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
              <p>No shipments assigned to you today.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {manifestQuery.data?.map((ship: any) => (
                <button
                  key={ship.id}
                  onClick={() => setActiveShipment({ ...ship, trackingNumber: ship.tracking_number })}
                  className="w-full text-left flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-amber/50"
                >
                  <div className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-full",
                    ship.status === "delivered" ? "bg-success/15 text-success" : "bg-secondary text-navy-deep"
                  )}>
                    {ship.status === "delivered" ? <CheckCircle2 className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm uppercase text-foreground">{ship.tracking_number}</p>
                    <p className="truncate text-xs text-muted-foreground">{ship.destination?.city}, {ship.destination?.country_code}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium uppercase text-amber">{ship.status.replace(/_/g, " ")}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DeliveryForm({ trackingNumber, onComplete }: { trackingNumber: string, onComplete: () => void }) {
  const [signedBy, setSignedBy] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const submitPod = useServerFn(submitProofOfDelivery);
  const podMut = useMutation({
    mutationFn: (svg: string) => submitPod({ data: {
      trackingNumber,
      signedBy,
      signatureSvgPath: svg,
    }}),
    onSuccess: () => {
      toast.success("Proof of delivery submitted successfully!");
      onComplete();
    },
    onError: (err: any) => toast.error(err?.message || "Failed to submit"),
  });

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    const pos = getPos(e);
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasSignature(true);
  };

  const endDrawing = () => {
    setIsDrawing(false);
  };

  const getPos = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handleAutoSign = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.beginPath();
    ctx.moveTo(20, 50);
    ctx.bezierCurveTo(40, 20, 60, 80, 80, 50);
    ctx.bezierCurveTo(100, 20, 120, 80, 140, 50);
    ctx.stroke();
    setHasSignature(true);
    setSignedBy("Test Recipient");
  };

  const handleSubmit = () => {
    const fakeSvg = "M 10 50 Q 50 10 90 50 T 170 50";
    podMut.mutate(fakeSvg);
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-navy-deep font-semibold">
          <PenTool className="h-5 w-5" />
          <h2>Proof of Delivery</h2>
        </div>
        
        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground">Received By</label>
          <Input 
            className="mt-1" 
            placeholder="Name..." 
            value={signedBy} 
            onChange={(e) => setSignedBy(e.target.value)} 
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-widest text-muted-foreground flex justify-between">
            <span>Signature</span>
            <button onClick={handleAutoSign} className="text-amber underline hover:text-amber-soft">Auto-fill (Test)</button>
          </label>
          <div className="mt-1 rounded-xl border-2 border-dashed border-border bg-background touch-none overflow-hidden">
            <canvas
              ref={canvasRef}
              width={350}
              height={120}
              className="w-full h-[120px] cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={endDrawing}
              onMouseLeave={endDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={endDrawing}
            />
          </div>
        </div>

        <Button 
          className="w-full bg-navy-deep text-cream hover:bg-navy"
          disabled={!signedBy || !hasSignature || podMut.isPending}
          onClick={handleSubmit}
        >
          {podMut.isPending ? "Submitting..." : (
            <><CheckCircle2 className="mr-2 h-4 w-4 text-amber" /> Complete Delivery</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function TelemetryForm({ trackingNumber }: { trackingNumber: string }) {
  const submitTel = useServerFn(updateTelemetry);
  const mut = useMutation({
    mutationFn: () => submitTel({ data: {
      trackingNumber,
      healthScore: 78,
      temperatureC: 28,
      shockEvents: 1,
    }}),
    onSuccess: () => toast.warning("Telemetry event injected!"),
  });

  return (
    <Card className="border-warning/50 bg-warning/5">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 text-warning font-semibold">
          <Activity className="h-5 w-5" />
          <h2>IoT Sensor Sync</h2>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Simulate a real-time sensor reading (e.g. package dropped, temperature spike) being pushed to the network.
        </p>
        <Button 
          variant="outline"
          className="mt-4 w-full border-warning/50 text-warning hover:bg-warning/10"
          disabled={mut.isPending}
          onClick={() => mut.mutate()}
        >
          Inject Telemetry Anomaly
        </Button>
      </CardContent>
    </Card>
  );
}
