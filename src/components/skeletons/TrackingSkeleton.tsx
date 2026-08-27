import { TrackingFlashScreen } from "@/components/tracking/TrackingFlashScreen";

export function TrackingSkeleton({ trackingCode }: { trackingCode?: string }) {
  return <TrackingFlashScreen trackingCode={trackingCode || "Shipment"} minDurationMs={1200} />;
}
