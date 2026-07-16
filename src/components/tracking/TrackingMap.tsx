import { useEffect, useState } from "react";
import type { LatLngExpression } from "leaflet";
import type { Checkpoint } from "@/lib/mock-shipments";

interface Props {
  origin: [number, number];
  destination: [number, number];
  current: [number, number];
  checkpoints: Checkpoint[];
  height?: number;
}

export function TrackingMap({ origin, destination, current, checkpoints, height = 380 }: Props) {
  const [mods, setMods] = useState<null | typeof import("react-leaflet")>(null);

  useEffect(() => {
    let c = false;
    import("react-leaflet").then((m) => { if (!c) setMods(m); });
    return () => { c = true; };
  }, []);

  if (!mods) {
    return <div style={{ height }} className="w-full animate-pulse bg-navy/40" aria-hidden />;
  }

  const { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } = mods;
  const midLat = (origin[0] + destination[0]) / 2;
  const midLng = (origin[1] + destination[1]) / 2;
  const center: LatLngExpression = [midLat, midLng];

  const traveled: [number, number][] = [origin, ...checkpoints.map((c) => [c.lat, c.lng] as [number, number]), current];
  const remaining: [number, number][] = [current, destination];

  return (
    <div style={{ height }} className="w-full">
      <MapContainer center={center} zoom={3} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <Polyline positions={traveled} pathOptions={{ color: "#FFB020", weight: 3 }} />
        <Polyline positions={remaining} pathOptions={{ color: "#FFB020", weight: 2, dashArray: "6 8", opacity: 0.6 }} />
        <CircleMarker center={origin} radius={5} pathOptions={{ color: "#07162C", fillColor: "#07162C", fillOpacity: 1 }}>
          <Tooltip>Origin</Tooltip>
        </CircleMarker>
        <CircleMarker center={destination} radius={5} pathOptions={{ color: "#07162C", fillColor: "#07162C", fillOpacity: 1 }}>
          <Tooltip>Destination</Tooltip>
        </CircleMarker>
        {checkpoints.map((c) => (
          <CircleMarker key={c.id} center={[c.lat, c.lng]} radius={3} pathOptions={{ color: "#FFB020", fillColor: "#FFB020", fillOpacity: 0.8 }}>
            <Tooltip>{c.facility}</Tooltip>
          </CircleMarker>
        ))}
        <CircleMarker center={current} radius={9} pathOptions={{ color: "#FFB020", fillColor: "#FFB020", fillOpacity: 1, weight: 3 }}>
          <Tooltip permanent direction="top" offset={[0, -10]}>
            <span style={{ fontFamily: "Inter Variable, sans-serif", fontSize: 12, fontWeight: 600 }}>
              Current
            </span>
          </Tooltip>
        </CircleMarker>
      </MapContainer>
    </div>
  );
}
