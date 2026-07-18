export type ShipmentStatus =
  | "label_created"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "exception";

export const statusLabels: Record<ShipmentStatus | string, string> = {
  label_created: "Label created",
  picked_up: "Picked up",
  in_transit: "In transit",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  exception: "Exception",
};

export interface LocationSnapshot {
  city: string;
  country: string;
  lat: number;
  lng: number;
  contact_name?: string;
  phone?: string;
  line1?: string;
}

export interface LiveShipmentData {
  kind: "live";
  id: string;
  trackingNumber: string;
  service: string;
  status: string;
  progress: number;
  origin: LocationSnapshot;
  destination: LocationSnapshot;
  currentLocation: { lat: number; lng: number; label: string };
  weightKg: number;
  dimensions: string;
  pieces: number;
  shipDate: string;
  estimatedDelivery: string;
  recipient: string;
  sender: string;
  reference: string;
  checkpoints: any[];
  // AI fields
  onTimeConfidence: number;
  aiNote?: string;
  healthScore?: number;
  temperatureC?: number;
  shockEvents?: number;
}
