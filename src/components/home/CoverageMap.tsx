import { useEffect, useState } from "react";
import type { LatLngExpression } from "leaflet";

const hubs: { name: string; pos: [number, number]; region: string }[] = [
  { name: "Rotterdam", pos: [51.92, 4.48], region: "EMEA" },
  { name: "Frankfurt", pos: [50.03, 8.56], region: "EMEA" },
  { name: "Milan", pos: [45.46, 9.19], region: "EMEA" },
  { name: "Dubai", pos: [25.2, 55.27], region: "MEA" },
  { name: "Singapore", pos: [1.35, 103.82], region: "APAC" },
  { name: "Tokyo", pos: [35.68, 139.76], region: "APAC" },
  { name: "Sydney", pos: [-33.87, 151.21], region: "APAC" },
  { name: "London", pos: [51.5, -0.13], region: "EMEA" },
  { name: "New York", pos: [40.71, -74.0], region: "AMER" },
  { name: "Austin", pos: [30.27, -97.74], region: "AMER" },
  { name: "Denver", pos: [39.74, -104.99], region: "AMER" },
  { name: "São Paulo", pos: [-23.55, -46.63], region: "AMER" },
  { name: "Lagos", pos: [6.52, 3.38], region: "MEA" },
];

export function CoverageMap() {
  const [mounted, setMounted] = useState(false);
  const [mods, setMods] = useState<null | typeof import("react-leaflet")>(null);
  const [L, setL] = useState<null | typeof import("leaflet")>(null);

  useEffect(() => {
    let cancel = false;
    Promise.all([import("react-leaflet"), import("leaflet")]).then(([rl, l]) => {
      if (cancel) return;
      setMods(rl);
      setL(l);
      setMounted(true);
    });
    return () => { cancel = true; };
  }, []);

  if (!mounted || !mods || !L) {
    return <div className="h-[420px] w-full bg-navy" aria-hidden />;
  }

  const { MapContainer, TileLayer, CircleMarker, Tooltip } = mods;
  const center: LatLngExpression = [30, 15];

  return (
    <div className="h-[420px] w-full">
      <MapContainer
        center={center}
        zoom={2}
        minZoom={2}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
        worldCopyJump
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {hubs.map((h) => (
          <CircleMarker
            key={h.name}
            center={h.pos}
            radius={6}
            pathOptions={{ color: "#07162C", fillColor: "#07162C", fillOpacity: 1, weight: 2 }}
          >
            <Tooltip direction="top" offset={[0, -6]} opacity={1}>
              <span style={{ fontFamily: "Inter Variable, sans-serif", fontSize: 12 }}>
                {h.name} · {h.region}
              </span>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
