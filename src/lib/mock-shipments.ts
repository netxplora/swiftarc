export type ShipmentStatus =
  | "label_created"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "exception";

export interface Checkpoint {
  id: string;
  timestamp: string; // ISO
  facility: string;
  city: string;
  country: string;
  status: string;
  lat: number;
  lng: number;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  service: string;
  status: ShipmentStatus;
  progress: number; // 0-100
  origin: { city: string; country: string; lat: number; lng: number };
  destination: { city: string; country: string; lat: number; lng: number };
  currentLocation: { lat: number; lng: number; label: string };
  weightKg: number;
  dimensions: string;
  pieces: number;
  shipDate: string;
  estimatedDelivery: string; // ISO
  recipient: string;
  sender: string;
  reference: string;
  onTimeConfidence: number; // 0-100
  aiNote: string;
  healthScore: number; // 0-100
  temperatureC: number;
  shockEvents: number;
  proofOfDelivery?: {
    signedBy: string;
    signatureSvgPath: string;
    photoNote: string;
  };
  checkpoints: Checkpoint[];
  exceptionNote?: string;
}

const now = Date.now();
const iso = (offsetMinutes: number) =>
  new Date(now + offsetMinutes * 60_000).toISOString();

export const shipments: Record<string, Shipment> = {
  "SA-7241-9032-11": {
    id: "SA-7241-9032-11",
    trackingNumber: "SA-7241-9032-11",
    service: "SwiftArc Priority Overnight",
    status: "out_for_delivery",
    progress: 78,
    origin: { city: "Rotterdam", country: "NL", lat: 51.9244, lng: 4.4777 },
    destination: { city: "Milan", country: "IT", lat: 45.4642, lng: 9.19 },
    currentLocation: { lat: 46.5197, lng: 8.5, label: "Gotthard Corridor, CH" },
    weightKg: 4.2,
    dimensions: "40 × 30 × 18 cm",
    pieces: 1,
    shipDate: iso(-60 * 26),
    estimatedDelivery: iso(60 * 4),
    recipient: "Studio Farina, Milan",
    sender: "North Sea Optics BV",
    reference: "PO-88421",
    onTimeConfidence: 94,
    aiNote:
      "Weather clear along Alpine corridor. Milan hub is running 6 minutes ahead of schedule. High confidence for pre-noon delivery.",
    healthScore: 98,
    temperatureC: 7.4,
    shockEvents: 0,
    checkpoints: [
      { id: "c1", timestamp: iso(-60 * 26), facility: "Rotterdam Origin Hub", city: "Rotterdam", country: "NL", status: "Picked up from shipper", lat: 51.9244, lng: 4.4777 },
      { id: "c2", timestamp: iso(-60 * 22), facility: "Rotterdam Sort Center", city: "Rotterdam", country: "NL", status: "Departed origin facility", lat: 51.95, lng: 4.5 },
      { id: "c3", timestamp: iso(-60 * 14), facility: "Frankfurt Air Gateway", city: "Frankfurt", country: "DE", status: "Arrived at regional hub", lat: 50.03, lng: 8.56 },
      { id: "c4", timestamp: iso(-60 * 9), facility: "Zurich Line-Haul", city: "Zurich", country: "CH", status: "In transit — road segment", lat: 47.38, lng: 8.54 },
      { id: "c5", timestamp: iso(-60 * 2), facility: "Milan Distribution Hub", city: "Milan", country: "IT", status: "Out for delivery", lat: 45.5, lng: 9.15 },
    ],
  },
  "SA-3319-4400-02": {
    id: "SA-3319-4400-02",
    trackingNumber: "SA-3319-4400-02",
    service: "SwiftArc International Economy",
    status: "in_transit",
    progress: 42,
    origin: { city: "Singapore", country: "SG", lat: 1.3521, lng: 103.8198 },
    destination: { city: "London", country: "GB", lat: 51.5074, lng: -0.1278 },
    currentLocation: { lat: 25.2048, lng: 55.2708, label: "Dubai Gateway" },
    weightKg: 12.8,
    dimensions: "60 × 40 × 30 cm",
    pieces: 2,
    shipDate: iso(-60 * 48),
    estimatedDelivery: iso(60 * 60),
    recipient: "Halyard & Sons Ltd.",
    sender: "Merlion Components Pte.",
    reference: "INV-72311",
    onTimeConfidence: 87,
    aiNote:
      "Minor congestion at Heathrow customs is expected on arrival. AI model estimates 2h buffer remaining.",
    healthScore: 92,
    temperatureC: 22.1,
    shockEvents: 1,
    checkpoints: [
      { id: "c1", timestamp: iso(-60 * 48), facility: "Changi Cargo Terminal", city: "Singapore", country: "SG", status: "Picked up", lat: 1.3644, lng: 103.9915 },
      { id: "c2", timestamp: iso(-60 * 40), facility: "Changi Air Gateway", city: "Singapore", country: "SG", status: "Departed origin country", lat: 1.36, lng: 104.0 },
      { id: "c3", timestamp: iso(-60 * 22), facility: "Dubai World Central", city: "Dubai", country: "AE", status: "Arrived at transit hub", lat: 25.2048, lng: 55.2708 },
    ],
  },
  "SA-0058-1122-77": {
    id: "SA-0058-1122-77",
    trackingNumber: "SA-0058-1122-77",
    service: "SwiftArc Standard Ground",
    status: "delivered",
    progress: 100,
    origin: { city: "Austin", country: "US", lat: 30.2672, lng: -97.7431 },
    destination: { city: "Denver", country: "US", lat: 39.7392, lng: -104.9903 },
    currentLocation: { lat: 39.7392, lng: -104.9903, label: "Delivered" },
    weightKg: 2.1,
    dimensions: "25 × 20 × 10 cm",
    pieces: 1,
    shipDate: iso(-60 * 72),
    estimatedDelivery: iso(-60 * 4),
    recipient: "Ada Whitmore",
    sender: "Loom & Warp Studio",
    reference: "SO-4419",
    onTimeConfidence: 100,
    aiNote: "Delivered 3h ahead of estimate. No exceptions logged.",
    healthScore: 100,
    temperatureC: 19.6,
    shockEvents: 0,
    proofOfDelivery: {
      signedBy: "A. Whitmore",
      signatureSvgPath:
        "M5 50 C 20 20, 35 80, 55 40 S 90 20, 120 55 S 170 30, 195 60",
      photoNote: "Package left at front door, signature captured on handheld.",
    },
    checkpoints: [
      { id: "c1", timestamp: iso(-60 * 72), facility: "Austin Origin Hub", city: "Austin", country: "US", status: "Picked up", lat: 30.2672, lng: -97.7431 },
      { id: "c2", timestamp: iso(-60 * 60), facility: "Amarillo Sort Center", city: "Amarillo", country: "US", status: "In transit", lat: 35.222, lng: -101.831 },
      { id: "c3", timestamp: iso(-60 * 30), facility: "Denver Distribution", city: "Denver", country: "US", status: "Out for delivery", lat: 39.75, lng: -104.99 },
      { id: "c4", timestamp: iso(-60 * 4), facility: "Recipient Address", city: "Denver", country: "US", status: "Delivered", lat: 39.7392, lng: -104.9903 },
    ],
  },
  "SA-6612-8891-05": {
    id: "SA-6612-8891-05",
    trackingNumber: "SA-6612-8891-05",
    service: "SwiftArc Express",
    status: "exception",
    progress: 55,
    origin: { city: "Tokyo", country: "JP", lat: 35.6762, lng: 139.6503 },
    destination: { city: "Sydney", country: "AU", lat: -33.8688, lng: 151.2093 },
    currentLocation: { lat: 22.3193, lng: 114.1694, label: "Hong Kong Hub — Weather hold" },
    weightKg: 8.6,
    dimensions: "50 × 35 × 25 cm",
    pieces: 1,
    shipDate: iso(-60 * 36),
    estimatedDelivery: iso(60 * 36),
    recipient: "Harbour & Kite Pty.",
    sender: "Sakura Optics Co.",
    reference: "PO-55129",
    onTimeConfidence: 41,
    aiNote:
      "Typhoon advisory over the South China Sea has grounded outbound flights at HKG. AI recommends rerouting via Manila (+6h).",
    healthScore: 88,
    temperatureC: 24.6,
    shockEvents: 2,
    exceptionNote:
      "Weather hold at Hong Kong hub. Outbound flights delayed 4–8 hours. Alternate routing under review.",
    checkpoints: [
      { id: "c1", timestamp: iso(-60 * 36), facility: "Narita Cargo", city: "Tokyo", country: "JP", status: "Picked up", lat: 35.7719, lng: 140.3928 },
      { id: "c2", timestamp: iso(-60 * 28), facility: "Narita Air Gateway", city: "Tokyo", country: "JP", status: "Departed origin country", lat: 35.77, lng: 140.4 },
      { id: "c3", timestamp: iso(-60 * 12), facility: "Hong Kong Hub", city: "Hong Kong", country: "HK", status: "Weather hold — awaiting rerouting", lat: 22.3193, lng: 114.1694 },
    ],
  },
};

export const sampleTrackingIds = Object.keys(shipments);

export function getShipment(id: string): Shipment | undefined {
  const normalized = id.trim().toUpperCase();
  return (
    shipments[normalized] ??
    Object.values(shipments).find(
      (s) => s.trackingNumber.toUpperCase() === normalized,
    )
  );
}

export const statusLabels: Record<ShipmentStatus, string> = {
  label_created: "Label created",
  picked_up: "Picked up",
  in_transit: "In transit",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  exception: "Exception",
};
