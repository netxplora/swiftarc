import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Checkpoint {
  id: string;
  timestamp: string;
  facility: string;
  city: string;
  country: string;
  status: string;
  lat: number;
  lng: number;
}

interface Props {
  origin: [number, number];
  destination: [number, number];
  current: [number, number];
  checkpoints: Checkpoint[];
  height?: number | string;
  driverName?: string;
}

// ── Icons ──────────────────────────────────────────────────────────────────
const createDotIcon = (color: string, size = 16) =>
  L.divIcon({
    className: "custom-div-icon",
    html: `<div style="background-color:${color};width:${size}px;height:${size}px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

const createCurrentIcon = () =>
  L.divIcon({
    className: "custom-div-icon",
    html: `
      <div style="position:relative;width:22px;height:22px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;width:22px;height:22px;border-radius:50%;background:rgba(59,130,246,0.25);animation:sw-pulse 2s infinite;"></div>
        <div style="width:12px;height:12px;border-radius:50%;background:#3b82f6;border:2.5px solid white;box-shadow:0 2px 8px rgba(59,130,246,0.6);position:relative;z-index:1;"></div>
      </div>
      <style>@keyframes sw-pulse{0%,100%{transform:scale(1);opacity:0.5}50%{transform:scale(1.8);opacity:0.1}}</style>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

const originIcon = createDotIcon("#1e293b", 18); // navy
const destIcon = createDotIcon("#f59e0b", 18); // amber
const checkpointIcon = createDotIcon("#94a3b8", 11); // slate

// ── Great-circle arc ───────────────────────────────────────────────────────
function getArcPoints(
  start: [number, number],
  end: [number, number],
  segments = 80,
): [number, number][] {
  const toRad = (d: number) => d * (Math.PI / 180);
  const toDeg = (r: number) => r * (180 / Math.PI);
  const lat1 = toRad(start[0]),
    lon1 = toRad(start[1]);
  const lat2 = toRad(end[0]),
    lon2 = toRad(end[1]);
  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.pow(Math.sin((lat1 - lat2) / 2), 2) +
          Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lon1 - lon2) / 2), 2),
      ),
    );
  if (d === 0) return [start, end];
  const pts: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const f = i / segments;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);
    pts.push([toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))), toDeg(Math.atan2(y, x))]);
  }
  return pts;
}

// ── Auto-fit bounds ────────────────────────────────────────────────────────
function MapBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points), { padding: [60, 60], animate: true });
    }
  }, [map, points]);
  return null;
}

// ── Component ──────────────────────────────────────────────────────────────
export function TrackingMap({
  origin,
  destination,
  current,
  checkpoints,
  height = "100%",
  driverName = "Driver",
}: Props) {
  const [mounted, setMounted] = useState(false);
  // memoised so the icon object isn't recreated each render
  const currentIcon = useMemo(() => createCurrentIcon(), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const hasOrigin = origin[0] !== 0 || origin[1] !== 0;
  const hasDest = destination[0] !== 0 || destination[1] !== 0;
  const hasCurrent = current[0] !== 0 || current[1] !== 0;

  /** Full planned-route arc — dashed grey */
  const fullArc = useMemo(
    () => (hasOrigin && hasDest ? getArcPoints(origin, destination) : []),
    [origin, destination, hasOrigin, hasDest],
  );

  /** Travelled arc — solid amber, origin → current */
  const travelledArc = useMemo(
    () => (hasOrigin && hasCurrent ? getArcPoints(origin, current) : []),
    [origin, current, hasOrigin, hasCurrent],
  );

  const allPoints = useMemo(() => {
    const pts: [number, number][] = [];
    if (hasOrigin) pts.push(origin);
    if (hasDest) pts.push(destination);
    if (hasCurrent) pts.push(current);
    checkpoints.forEach((c) => {
      if (c.lat !== 0 || c.lng !== 0) pts.push([c.lat, c.lng]);
    });
    return pts;
  }, [origin, destination, current, checkpoints, hasOrigin, hasDest, hasCurrent]);

  if (!mounted) {
    return (
      <div
        style={{ height }}
        className="w-full animate-pulse rounded-2xl bg-secondary"
        aria-hidden
      />
    );
  }

  return (
    <div
      style={{ height }}
      className="w-full overflow-hidden rounded-2xl border border-border bg-secondary relative z-0"
    >
      <MapContainer
        center={hasOrigin ? origin : [20, 0]}
        zoom={2}
        scrollWheelZoom
        style={{ width: "100%", height: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <MapBounds points={allPoints} />

        {/* Full planned route — light dashed */}
        {fullArc.length > 0 && (
          <Polyline positions={fullArc} color="#d1d5db" weight={2} dashArray="8,10" opacity={0.7} />
        )}

        {/* Travelled portion — solid amber */}
        {travelledArc.length > 0 && (
          <Polyline positions={travelledArc} color="#f59e0b" weight={3.5} opacity={0.95} />
        )}

        {/* Origin */}
        {hasOrigin && (
          <Marker position={origin} icon={originIcon}>
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              <span className="text-sm font-semibold">Origin</span>
            </Tooltip>
          </Marker>
        )}

        {/* Destination */}
        {hasDest && (
          <Marker position={destination} icon={destIcon}>
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              <span className="text-sm font-semibold">Destination</span>
            </Tooltip>
          </Marker>
        )}

        {/* Current location — pulsing blue */}
        {hasCurrent && (
          <Marker position={current} icon={currentIcon} zIndexOffset={1000}>
            <Tooltip direction="top" offset={[0, -14]} opacity={1} permanent>
              <span className="text-sm font-semibold">Current Location</span>
              {driverName !== "Driver" && (
                <div className="text-xs text-muted-foreground">{driverName}</div>
              )}
            </Tooltip>
          </Marker>
        )}

        {/* Past checkpoints */}
        {checkpoints.map(
          (cp) =>
            (cp.lat !== 0 || cp.lng !== 0) && (
              <Marker key={cp.id} position={[cp.lat, cp.lng]} icon={checkpointIcon}>
                <Tooltip direction="top" offset={[0, -8]}>
                  <div className="text-xs font-semibold">{cp.facility || cp.city}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {new Date(cp.timestamp).toLocaleString()}
                  </div>
                </Tooltip>
              </Marker>
            ),
        )}
      </MapContainer>
    </div>
  );
}
