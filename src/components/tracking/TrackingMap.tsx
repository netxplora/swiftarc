import { useEffect, useState } from "react";
import type { LatLngExpression } from "leaflet";

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
}

export function TrackingMap({ origin, destination, current, checkpoints, height = 380 }: Props) {
  const [mods, setMods] = useState<null | typeof import("react-leaflet")>(null);
  const [L, setL] = useState<null | typeof import("leaflet")>(null);

  useEffect(() => {
    let c = false;
    Promise.all([
      import("react-leaflet"),
      import("leaflet")
    ]).then(([m, leaflet]) => {
      if (!c) {
        setMods(m);
        setL(leaflet);
      }
    });
    return () => { c = true; };
  }, []);

  if (!mods || !L) {
    return <div style={{ height }} className="w-full animate-pulse rounded-2xl bg-secondary" aria-hidden />;
  }

  const { MapContainer, TileLayer, Polyline, Tooltip, Marker } = mods;
  const midLat = (origin[0] + destination[0]) / 2;
  const midLng = (origin[1] + destination[1]) / 2;
  const center: LatLngExpression = [midLat, midLng];

  const traveled: [number, number][] = [origin, ...checkpoints.map((c) => [c.lat, c.lng] as [number, number]), current];
  const remaining: [number, number][] = [current, destination];

  const createIcon = (html: string) => L.divIcon({ html, className: "bg-transparent border-none", iconSize: [24, 24], iconAnchor: [12, 12] });

  const originIcon = createIcon(`<div class="grid h-6 w-6 place-items-center rounded-full border-2 border-background bg-navy-deep text-[10px] font-bold text-cream shadow-sm">O</div>`);
  const destIcon = createIcon(`<div class="grid h-6 w-6 place-items-center rounded-full border-2 border-background bg-navy-deep text-[10px] font-bold text-cream shadow-sm">D</div>`);
  const checkpointIcon = createIcon(`<div class="h-3 w-3 rounded-full border-2 border-background bg-amber shadow-sm"></div>`);
  const currentIcon = createIcon(`
    <div class="relative flex h-6 w-6 items-center justify-center">
      <div class="absolute h-full w-full animate-ping rounded-full bg-amber opacity-75"></div>
      <div class="relative h-4 w-4 rounded-full border-2 border-navy-deep bg-amber shadow-md"></div>
    </div>
  `);

  return (
    <div style={{ height }} className="w-full overflow-hidden rounded-2xl">
      <MapContainer center={center} zoom={4} scrollWheelZoom={false} style={{ height: "100%", width: "100%", zIndex: 1 }}>
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">Carto</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <Polyline positions={traveled} pathOptions={{ color: "#FFB020", weight: 4, lineCap: "round", lineJoin: "round" }} />
        <Polyline positions={remaining} pathOptions={{ color: "#07162C", weight: 3, dashArray: "6 8", opacity: 0.4, lineCap: "round", lineJoin: "round" }} />
        
        <Marker position={origin} icon={originIcon}>
          <Tooltip direction="bottom" offset={[0, 10]} opacity={1}>Origin</Tooltip>
        </Marker>
        
        <Marker position={destination} icon={destIcon}>
          <Tooltip direction="bottom" offset={[0, 10]} opacity={1}>Destination</Tooltip>
        </Marker>
        
        {checkpoints.map((c) => (
          <Marker key={c.id} position={[c.lat, c.lng]} icon={checkpointIcon}>
            <Tooltip direction="top" offset={[0, -5]} opacity={1}>{c.facility}</Tooltip>
          </Marker>
        ))}
        
        <Marker position={current} icon={currentIcon}>
          <Tooltip permanent direction="top" offset={[0, -12]} className="font-semibold" opacity={1}>
            Live
          </Tooltip>
        </Marker>
      </MapContainer>
    </div>
  );
}
