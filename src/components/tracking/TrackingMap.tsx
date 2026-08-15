import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon path issues
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
  height?: number;
  driverName?: string;
}

// Custom Icons
const createIcon = (color: string) => {
  return L.divIcon({
    className: "custom-div-icon",
    html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

const originIcon = createIcon("#1e293b"); // Navy
const destIcon = createIcon("#f59e0b"); // Amber
const currentIcon = createIcon("#3b82f6"); // Blue pulse
const checkpointIcon = createIcon("#94a3b8"); // Slate

// Generate a great circle arc between two points
function getArcPoints(start: [number, number], end: [number, number], segments = 100): [number, number][] {
  const points: [number, number][] = [];
  const lat1 = start[0] * (Math.PI / 180);
  const lon1 = start[1] * (Math.PI / 180);
  const lat2 = end[0] * (Math.PI / 180);
  const lon2 = end[1] * (Math.PI / 180);
  const d = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin((lat1 - lat2) / 2), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lon1 - lon2) / 2), 2)));
  
  if (d === 0) return [start, end];

  for (let i = 0; i <= segments; i++) {
    const f = i / segments;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);
    const lat = Math.atan2(z, Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)));
    const lon = Math.atan2(y, x);
    points.push([lat * (180 / Math.PI), lon * (180 / Math.PI)]);
  }
  return points;
}

// Component to handle auto-fitting bounds based on points
function MapBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    }
  }, [map, points]);
  return null;
}

export function TrackingMap({
  origin,
  destination,
  current,
  checkpoints,
  height = 380,
  driverName = "Driver",
}: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const arcPoints = useMemo(() => {
    // Only draw arc if valid coordinates
    if (origin[0] === 0 && origin[1] === 0) return [];
    if (destination[0] === 0 && destination[1] === 0) return [];
    return getArcPoints(origin, destination);
  }, [origin, destination]);

  const allPoints = useMemo(() => {
    const pts = [origin, destination, current, ...checkpoints.map(c => [c.lat, c.lng] as [number, number])];
    return pts.filter(p => p[0] !== 0 || p[1] !== 0);
  }, [origin, destination, current, checkpoints]);

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
    <div style={{ height }} className="w-full overflow-hidden rounded-2xl border border-border bg-secondary relative z-0">
      <MapContainer 
        center={origin[0] !== 0 ? origin : [20, 0]} 
        zoom={2} 
        scrollWheelZoom={true}
        style={{ width: "100%", height: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {/* Bounds management */}
        <MapBounds points={allPoints} />

        {/* Route Arc */}
        {arcPoints.length > 0 && (
          <Polyline 
            positions={arcPoints} 
            color="#f59e0b" // Amber color for route
            weight={3}
            dashArray="10, 10"
            opacity={0.8}
            className="animate-pulse"
          />
        )}

        {/* Origin Marker */}
        {origin[0] !== 0 && (
          <Marker position={origin} icon={originIcon}>
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              <div className="text-sm font-semibold">Origin</div>
            </Tooltip>
          </Marker>
        )}

        {/* Destination Marker */}
        {destination[0] !== 0 && (
          <Marker position={destination} icon={destIcon}>
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              <div className="text-sm font-semibold">Destination</div>
            </Tooltip>
          </Marker>
        )}

        {/* Current Location Marker */}
        {current[0] !== 0 && (
          <Marker position={current} icon={currentIcon} zIndexOffset={1000}>
            <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent>
              <div className="text-sm font-semibold">Current Location</div>
              {driverName !== "Driver" && <div className="text-xs text-muted-foreground">{driverName}</div>}
            </Tooltip>
          </Marker>
        )}

        {/* Past Checkpoints */}
        {checkpoints.map((cp) => (
          (cp.lat !== 0 && cp.lng !== 0) && (
            <Marker key={cp.id} position={[cp.lat, cp.lng]} icon={checkpointIcon}>
              <Tooltip direction="top" offset={[0, -10]}>
                <div className="text-xs font-semibold">{cp.facility || cp.city}</div>
                <div className="text-[10px] text-muted-foreground">{new Date(cp.timestamp).toLocaleString()}</div>
              </Tooltip>
            </Marker>
          )
        ))}
      </MapContainer>
    </div>
  );
}
