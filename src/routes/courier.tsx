import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Scan, PenTool, CheckCircle2, Navigation, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { resolveTracking, submitProofOfDelivery, updateTelemetry } from "@/lib/api.functions";

export const Route = createFileRoute("/courier")({
  head: () => ({
    meta: [
      { title: "Courier Portal — SwiftArc" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CourierPortal,
});

function CourierPortal() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shipment, setShipment] = useState<any>(null);
  
  const resolve = useServerFn(resolveTracking);
  const searchMut = useMutation({
    mutationFn: () => resolve({ data: { trackingNumber } }),
    onSuccess: (res) => {
      if (res.kind === "none") {
        toast.error("Not found");
        setShipment(null);
      } else {
        setShipment(res.shipment);
        toast.success("Package located");
      }
    },
  });

  return (
    <div className="min-h-screen bg-secondary/30 pb-20">
      <div className="bg-navy-deep px-4 py-6 text-cream shadow-md">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <Navigation className="h-6 w-6 text-amber" />
          <h1 className="font-display text-xl font-bold">Courier Portal</h1>
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-md px-4 space-y-6">
        <Card>
          <CardContent className="p-6">
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Scan Package</label>
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="Tracking number..."
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="font-mono uppercase"
              />
              <Button onClick={() => searchMut.mutate()} disabled={searchMut.isPending || !trackingNumber}>
                <Scan className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {shipment && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Delivery To</p>
                    <p className="mt-1 font-display text-lg">{shipment.destination?.city}, {shipment.destination?.country_code}</p>
                    <p className="text-sm text-muted-foreground">{shipment.service}</p>
                  </div>
                  <span className="rounded-full bg-amber/20 px-2.5 py-0.5 text-xs font-semibold text-navy-deep">
                    {shipment.status}
                  </span>
                </div>
              </CardContent>
            </Card>

            <DeliveryForm trackingNumber={shipment.trackingNumber || shipment.id} />
            <TelemetryForm trackingNumber={shipment.trackingNumber || shipment.id} />
          </div>
        )}
      </div>
    </div>
  );
}

function DeliveryForm({ trackingNumber }: { trackingNumber: string }) {
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
    onSuccess: () => toast.success("Proof of delivery submitted successfully!"),
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
    // Generate an SVG path roughly from the canvas (simplified for prototype)
    // Normally we'd track points, but we'll use a dummy SVG path for the demo unless we extracted points.
    // To make it look cool on the frontend, let's just use a wavy line.
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
      temperatureC: 28, // High temp!
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
