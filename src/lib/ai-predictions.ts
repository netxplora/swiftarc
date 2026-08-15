/* eslint-disable @typescript-eslint/no-explicit-any */
import { statusLabels } from "./types";

/**
 * AI heuristics engine that evaluates shipments for potential delays.
 * In a real application, this would interface with a weather API (e.g. OpenWeatherMap),
 * traffic API (e.g. Google Distance Matrix), and historical ML models.
 */
export async function evaluateShipmentRisk(shipment: any) {
  // 1. Extract routing data
  const originStr = shipment.origin?.city?.toLowerCase() ?? "";
  const destStr = shipment.destination?.city?.toLowerCase() ?? "";

  // 2. Base ML Risk Profile
  let riskScore = 0.05; // Base 5% risk of delay
  let reasons: string[] = [];
  let delayMinutes = 0;

  // Weather Event Simulation
  if (
    originStr.includes("chicago") ||
    destStr.includes("chicago") ||
    originStr.includes("denver")
  ) {
    riskScore += 0.45;
    reasons.push("Severe Winter Storm Warning in routing area.");
    delayMinutes += 2880; // 48 hours
  } else if (
    originStr.includes("miami") ||
    destStr.includes("miami") ||
    originStr.includes("houston")
  ) {
    riskScore += 0.35;
    reasons.push("Tropical Storm / Hurricane conditions affecting logistics lines.");
    delayMinutes += 1440; // 24 hours
  } else if (originStr.includes("seattle") || destStr.includes("seattle")) {
    riskScore += 0.15;
    reasons.push("Heavy rainfall slowing ground transport.");
    delayMinutes += 180;
  }

  // Traffic & Hub Congestion Simulation
  if (
    destStr.includes("los angeles") ||
    destStr.includes("new york") ||
    destStr.includes("london")
  ) {
    riskScore += 0.2;
    reasons.push("Elevated congestion at destination terminal hub.");
    delayMinutes += 360; // 6 hours
  }

  // IoT Telemetry Trigger Simulation
  if (shipment.telemetry) {
    if (shipment.telemetry.shockEvents > 2) {
      riskScore += 0.3;
      reasons.push("Multiple shock events detected via IoT. QA inspection required.");
      delayMinutes += 1440; // 24 hours
    }
    if (shipment.telemetry.temperatureC > 30) {
      riskScore += 0.5;
      reasons.push("Temperature threshold exceeded. Regulatory hold pending.");
      delayMinutes += 2880;
    }
  }

  // Status Overrides
  if (shipment.status === "exception") {
    riskScore = 0.95;
    if (reasons.length === 0) reasons.push("Exception logged requiring manual intervention.");
  } else if (shipment.status === "delivered") {
    riskScore = 0.0;
    reasons = ["Shipment completed successfully."];
    delayMinutes = 0;
  }

  // Bound the risk score
  riskScore = Math.max(0, Math.min(1.0, riskScore));

  let finalReason = null;
  if (riskScore > 0.3) {
    finalReason = reasons.join(" ");
  }

  // 3. Calculate new ETA if needed
  const originalEta = new Date(shipment.estimated_delivery ?? Date.now() + 3 * 86400000);
  const adjustedEta = new Date(originalEta.getTime() + delayMinutes * 60000);

  return {
    ai_delay_risk: riskScore,
    ai_delay_reason: finalReason,
    adjustedEstimatedDelivery: adjustedEta.toISOString(),
  };
}
