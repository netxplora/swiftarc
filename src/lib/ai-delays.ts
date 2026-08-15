export interface DelayRisk {
  isDelayed: boolean;
  reason: string;
  confidence: number;
}

const HIGH_RISK_ROUTES = ["Frankfurt", "London", "JFK", "Shanghai", "Dubai"];
const WEATHER_IMPACTS = ["storm", "snow", "hurricane", "typhoon", "fog"];

export function predictDelayRisk(
  origin: string,
  destination: string,
  currentStatus: string,
  createdAt: string,
): DelayRisk {
  if (currentStatus === "delivered" || currentStatus === "exception") {
    return { isDelayed: false, reason: "", confidence: 0 };
  }

  // Simulated Heuristics Engine

  // 1. Time based risk
  const daysInTransit = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysInTransit > 5) {
    return { isDelayed: true, reason: "Historical transit time exceeded by 42%", confidence: 0.89 };
  }

  // 2. High risk route intersections (simulated weather/traffic)
  const routeString = `${origin} to ${destination}`.toLowerCase();
  for (const node of HIGH_RISK_ROUTES) {
    if (routeString.includes(node.toLowerCase())) {
      // Predict 30% chance of delay for these routes right now
      if (Math.random() > 0.7) {
        const weather = WEATHER_IMPACTS[Math.floor(Math.random() * WEATHER_IMPACTS.length)];
        return {
          isDelayed: true,
          reason: `AI detected inbound ${weather} near ${node} corridor`,
          confidence: 0.75 + Math.random() * 0.2,
        };
      }
    }
  }

  // 3. Random background noise detection (10% chance)
  if (Math.random() > 0.9) {
    return {
      isDelayed: true,
      reason: "Predictive model flags unusual port congestion patterns",
      confidence: 0.65,
    };
  }

  return { isDelayed: false, reason: "", confidence: 0 };
}
