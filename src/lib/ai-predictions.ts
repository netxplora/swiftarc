import { statusLabels } from "./mock-shipments";

/**
 * AI heuristics engine that evaluates shipments for potential delays.
 * In a real application, this would interface with a weather API (e.g. OpenWeatherMap),
 * traffic API (e.g. Google Distance Matrix), and historical ML models.
 */
export async function evaluateShipmentRisk(shipment: any) {
  // 1. Simulate data gathering
  const originStr = shipment.origin?.city?.toLowerCase() ?? "";
  const destStr = shipment.destination?.city?.toLowerCase() ?? "";
  
  // 2. Simple Heuristics (Rule-based ML stand-in)
  let onTimeConfidence = 96;
  let aiNote = "Route is clear. Expected to arrive on time.";
  let delayMinutes = 0;

  // Weather triggers
  if (originStr.includes("chicago") || destStr.includes("chicago") || originStr.includes("denver")) {
    onTimeConfidence -= 15;
    aiNote = "Blizzard warning in routing area. Delay likely.";
    delayMinutes += 2880; // 48 hours
  } else if (originStr.includes("miami") || destStr.includes("miami") || originStr.includes("houston")) {
    onTimeConfidence -= 10;
    aiNote = "Severe thunderstorms reported. Minor delays expected.";
    delayMinutes += 720; // 12 hours
  }

  // Traffic / Hub congestion triggers
  if (destStr.includes("los angeles") || destStr.includes("new york")) {
    onTimeConfidence -= 5;
    aiNote = "High volume at destination hub.";
    delayMinutes += 240; // 4 hours
  }

  // Shock/Temperature telemetry triggers (if IoT data exists)
  if (shipment.telemetry) {
    if (shipment.telemetry.shockEvents > 2) {
      onTimeConfidence -= 10;
      aiNote = "Multiple shock events detected. Inspection may delay delivery.";
      delayMinutes += 1440; // 24 hours
    }
    if (shipment.telemetry.temperatureC > 30) {
      aiNote = "Temperature threshold exceeded. Package flagged.";
    }
  }

  // 3. Status-based baseline
  if (shipment.status === "exception") {
    onTimeConfidence = 25;
    aiNote = "Exception logged. Requires manual intervention.";
  } else if (shipment.status === "delivered") {
    onTimeConfidence = 100;
    aiNote = "Shipment completed successfully.";
    delayMinutes = 0;
  }

  // 4. Calculate new ETA
  const originalEta = new Date(shipment.estimated_delivery ?? Date.now() + 3 * 86400000);
  const adjustedEta = new Date(originalEta.getTime() + delayMinutes * 60000);

  return {
    onTimeConfidence: Math.max(0, Math.min(100, onTimeConfidence)),
    aiNote,
    adjustedEstimatedDelivery: adjustedEta.toISOString(),
  };
}
