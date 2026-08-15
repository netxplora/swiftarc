/* eslint-disable @typescript-eslint/no-explicit-any */
export type ShipmentStatus =
  | "created"
  | "confirmed"
  | "assigned"
  | "picked_up"
  | "in_transit"
  | "near_destination"
  | "delivered"
  | "exception"
  // Legacy states for backwards compatibility
  | "booking_created"
  | "awaiting_confirmation"
  | "driver_assigned"
  | "driver_en_route"
  | "driver_arrived"
  | "package_picked_up"
  | "completed"
  | "label_created"
  | "out_for_delivery";

export const statusLabels: Record<ShipmentStatus | string, string> = {
  created: "Created",
  confirmed: "Confirmed",
  assigned: "Assigned",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  near_destination: "Near Destination",
  delivered: "Delivered",
  exception: "Exception",
  // Legacy mappings
  booking_created: "Created",
  awaiting_confirmation: "Pending",
  driver_assigned: "Assigned",
  driver_en_route: "Assigned",
  driver_arrived: "Assigned",
  package_picked_up: "Picked Up",
  label_created: "Created",
  out_for_delivery: "Near Destination",
  completed: "Delivered",
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
  driver?: {
    name: string;
    phone: string;
    vehicle: string;
    rating: number;
    lat: number;
    lng: number;
  };
  remainingDistanceKm?: number;
  remainingDurationMins?: number;
  onTimeConfidence: number;
  aiNote?: string;
  healthScore?: number;
  temperatureC?: number;
  shockEvents?: number;
}
