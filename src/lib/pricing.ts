/**
 * Dynamic Pricing & Routing Engine
 * All calculations originate server-side.
 */

export interface LocationCoords {
  lat: number;
  lng: number;
  city?: string;
  country_code?: string;
}

export interface PricingQuoteRequest {
  origin: LocationCoords;
  destination: LocationCoords;
  weight_kg: number;
  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
  pieces?: number;
  vehicle_type?: "bike" | "van" | "box_truck" | "freight_semi";
  delivery_type?: "instant" | "scheduled" | "express" | "overnight" | "ground" | "freight";
  declared_value?: number;
  insurance?: boolean;
  signature_required?: boolean;
  is_hazmat?: boolean;
  carbon_offset?: boolean;
  promo_code?: string;
}

export interface PricingQuoteBreakdown {
  distance_km: number;
  estimated_duration_mins: number;
  base_fare: number;
  distance_fee: number;
  weight_fee: number;
  volumetric_weight_kg: number;
  chargeable_weight_kg: number;
  vehicle_surcharge: number;
  surge_multiplier: number;
  insurance_fee: number;
  signature_fee: number;
  hazmat_fee: number;
  carbon_offset_fee: number;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  vehicle_info: {
    category: string;
    max_weight_kg: number;
    estimated_arrival_mins: number;
  };
}

/**
 * Calculates road network distance in km between two GPS coordinates using Great Circle / Haversine formula
 * with road tortuosity factor (1.3x multiplier for real road routing).
 */
export function calculateRouteDistance(
  origin: LocationCoords,
  destination: LocationCoords,
): { distanceKm: number; durationMins: number } {
  if (!origin.lat || !origin.lng || !destination.lat || !destination.lng) {
    return { distanceKm: 15.0, durationMins: 35 }; // Default fallback if coordinates missing
  }

  const R = 6371; // Earth radius in km
  const dLat = ((destination.lat - origin.lat) * Math.PI) / 180;
  const dLng = ((destination.lng - origin.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((origin.lat * Math.PI) / 180) *
      Math.cos((destination.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLineKm = R * c;

  // Road tortuosity factor (typically 1.25 to 1.35x straight line distance in urban/intercity routing)
  const distanceKm = Math.max(1, Math.round(straightLineKm * 1.3 * 10) / 10);

  // Average speed based on distance: urban (35 km/h) vs highway (80 km/h)
  const avgSpeedKmh = distanceKm > 50 ? 75 : 35;
  const durationMins = Math.max(10, Math.round((distanceKm / avgSpeedKmh) * 60 + 15)); // +15 mins handling time

  return { distanceKm, durationMins };
}

/**
 * Executes full dynamic pricing engine rules.
 */
export function computePricingQuote(req: PricingQuoteRequest): PricingQuoteBreakdown {
  const { distanceKm, durationMins } = calculateRouteDistance(req.origin, req.destination);

  // Volumetric weight calculation: (L * W * H) / 5000
  let volWt = 0;
  if (req.length_cm && req.width_cm && req.height_cm) {
    volWt = Math.round(((req.length_cm * req.width_cm * req.height_cm) / 5000) * 10) / 10;
  }
  const actualWt = Math.max(0.5, req.weight_kg || 1);
  const chargeableWt = Math.max(actualWt, volWt);
  const pieces = Math.max(1, req.pieces || 1);

  // Vehicle category rates & limits
  const vehicle =
    req.vehicle_type ||
    (chargeableWt > 500
      ? "freight_semi"
      : chargeableWt > 100
        ? "box_truck"
        : chargeableWt > 25
          ? "van"
          : "bike");
  const vehicleConfig = {
    bike: { category: "Courier Bike", base: 12.0, perKm: 1.2, perKg: 1.0, maxWt: 25, etaMins: 25 },
    van: { category: "Cargo Van", base: 28.0, perKm: 1.8, perKg: 1.5, maxWt: 500, etaMins: 40 },
    box_truck: {
      category: "Box Truck",
      base: 75.0,
      perKm: 2.8,
      perKg: 2.2,
      maxWt: 2500,
      etaMins: 60,
    },
    freight_semi: {
      category: "Freight Semi-Trailer",
      base: 180.0,
      perKm: 4.5,
      perKg: 3.0,
      maxWt: 20000,
      etaMins: 90,
    },
  }[vehicle];

  const base_fare = vehicleConfig.base;
  const distance_fee = Math.round(distanceKm * vehicleConfig.perKm * 100) / 100;
  const weight_fee = Math.round(chargeableWt * vehicleConfig.perKg * 100) / 100;
  const vehicle_surcharge = (pieces - 1) * (vehicle === "freight_semi" ? 35 : 10);

  // Dynamic peak / surge pricing rule (e.g. rush hours or high demand area)
  const currentHour = new Date().getHours();
  const isPeakHour =
    (currentHour >= 8 && currentHour <= 10) || (currentHour >= 17 && currentHour <= 19);
  const surge_multiplier = isPeakHour ? 1.15 : 1.0;

  // Ancillary services
  const insurance_fee = req.insurance
    ? Math.max(8.0, Math.round((req.declared_value || 100) * 0.008 * 100) / 100)
    : 0;
  const signature_fee = req.signature_required ? 4.5 : 0;
  const hazmat_fee = req.is_hazmat ? 35.0 : 0;

  // Carbon offset fee: ~$0.001 per km per kg (minimum $1.50 if enabled)
  const carbon_offset_fee = req.carbon_offset
    ? Math.max(1.5, Math.round(distanceKm * chargeableWt * 0.001 * 100) / 100)
    : 0;

  // Promo code validation
  let discount = 0;
  if (req.promo_code && req.promo_code.trim().toUpperCase() === "SWIFT15") {
    discount = Math.round((base_fare + distance_fee + weight_fee) * 0.15 * 100) / 100;
  }

  const subtotalBeforeSurge =
    base_fare +
    distance_fee +
    weight_fee +
    vehicle_surcharge +
    insurance_fee +
    signature_fee +
    hazmat_fee +
    carbon_offset_fee -
    discount;
  const subtotal = Math.round(subtotalBeforeSurge * surge_multiplier * 100) / 100;
  const tax = Math.round(subtotal * 0.08 * 100) / 100; // 8% sales tax / VAT
  const total = Math.round((subtotal + tax) * 100) / 100;

  return {
    distance_km: distanceKm,
    estimated_duration_mins: durationMins,
    base_fare,
    distance_fee,
    weight_fee,
    volumetric_weight_kg: volWt,
    chargeable_weight_kg: chargeableWt,
    vehicle_surcharge,
    surge_multiplier,
    insurance_fee,
    signature_fee,
    hazmat_fee,
    carbon_offset_fee,
    subtotal,
    tax,
    discount,
    total,
    vehicle_info: {
      category: vehicleConfig.category,
      max_weight_kg: vehicleConfig.maxWt,
      estimated_arrival_mins: vehicleConfig.etaMins + durationMins,
    },
  };
}

export interface ServiceOption {
  id: string;
  eta: string;
  iconName: string;
  quote: PricingQuoteBreakdown;
}

/**
 * Generates an array of available services and their dynamic quotes based on shipment parameters.
 */
export function computeAvailableServices(req: PricingQuoteRequest): ServiceOption[] {
  // Determine if weight requires freight
  const chargeableWt = Math.max(
    req.weight_kg || 1,
    ((req.length_cm || 0) * (req.width_cm || 0) * (req.height_cm || 0)) / 5000,
  );

  if (chargeableWt > 100) {
    return [
      {
        id: "Freight LTL",
        eta: "2–7 days",
        iconName: "Boxes",
        quote: computePricingQuote({
          ...req,
          delivery_type: "freight",
          vehicle_type: "freight_semi",
        }),
      },
      {
        id: "Dedicated Truck",
        eta: "1–3 days",
        iconName: "Truck",
        quote: computePricingQuote({ ...req, delivery_type: "express", vehicle_type: "box_truck" }),
      },
    ];
  }

  // Standard parcel services
  return [
    {
      id: "Priority Overnight",
      eta: "Next morning",
      iconName: "Plane",
      quote: computePricingQuote({ ...req, delivery_type: "overnight", vehicle_type: "van" }),
    },
    {
      id: "Express",
      eta: "1–2 days",
      iconName: "Zap",
      quote: computePricingQuote({ ...req, delivery_type: "express", vehicle_type: "van" }),
    },
    {
      id: "Standard Ground",
      eta: "1–5 days",
      iconName: "Truck",
      quote: computePricingQuote({ ...req, delivery_type: "ground", vehicle_type: "box_truck" }),
    },
  ];
}
