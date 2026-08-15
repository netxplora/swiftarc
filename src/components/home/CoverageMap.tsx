import { useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const hubs: { name: string; pos: [number, number]; region: string; major?: boolean }[] = [
  { name: "Rotterdam", pos: [51.92, 4.48], region: "EMEA", major: true },
  { name: "Frankfurt", pos: [50.03, 8.56], region: "EMEA", major: true },
  { name: "Milan", pos: [45.46, 9.19], region: "EMEA" },
  { name: "Dubai", pos: [25.2, 55.27], region: "MEA", major: true },
  { name: "Singapore", pos: [1.35, 103.82], region: "APAC", major: true },
  { name: "Tokyo", pos: [35.68, 139.76], region: "APAC" },
  { name: "Sydney", pos: [-33.87, 151.21], region: "APAC" },
  { name: "London", pos: [51.5, -0.13], region: "EMEA", major: true },
  { name: "New York", pos: [40.71, -74.0], region: "AMER", major: true },
  { name: "Austin", pos: [30.27, -97.74], region: "AMER" },
  { name: "Denver", pos: [39.74, -104.99], region: "AMER" },
  { name: "São Paulo", pos: [-23.55, -46.63], region: "AMER" },
  { name: "Lagos", pos: [6.52, 3.38], region: "MEA" },
];

// Create custom hub markers
const createHubIcon = (major: boolean) =>
  L.divIcon({
    className: "",
    html: `
      <div style="
        background-color: ${major ? "#f59e0b" : "#fff"};
        border: ${major ? "3px solid #1e293b" : "2px solid #f59e0b"};
        width: ${major ? "14px" : "10px"};
        height: ${major ? "14px" : "10px"};
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [major ? 14 : 10, major ? 14 : 10],
    iconAnchor: [major ? 7 : 5, major ? 7 : 5],
  });

const majorHubIcon = createHubIcon(true);
const minorHubIcon = createHubIcon(false);

// Hub connections — draw arcs from Rotterdam to major hubs
const connections = hubs
  .filter((h) => h.major && h.name !== "Rotterdam")
  .map((h) => [hubs[0].pos, h.pos] as [[number, number], [number, number]]);

export function CoverageMap() {
  const [selected, setSelected] = useState<(typeof hubs)[0] | null>(null);

  return (
    <div className="h-[300px] sm:h-[380px] lg:h-[420px] w-full overflow-hidden rounded-2xl border border-border">
      <MapContainer
        center={[30, 15]}
        zoom={2}
        minZoom={2}
        maxZoom={5}
        zoomControl={false}
        attributionControl={false}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom={false}
      >
        {/* Full-color, realistic OpenStreetMap tile layer */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* Connection lines between major hubs */}
        {connections.map(([start, end], i) => (
          <Polyline
            key={`line-${i}`}
            positions={[start, end]}
            pathOptions={{
              color: "#f59e0b",
              weight: 1.5,
              opacity: 0.7,
              dashArray: "6 4",
            }}
          />
        ))}

        {/* Hub markers */}
        {hubs.map((hub) => (
          <Marker
            key={hub.name}
            position={hub.pos}
            icon={hub.major ? majorHubIcon : minorHubIcon}
            eventHandlers={{
              click: () => setSelected(hub),
            }}
          >
            <Tooltip
              direction="top"
              offset={[0, -8]}
              permanent={false}
              className="leaflet-hub-tooltip"
            >
              <div className="text-xs font-bold">{hub.name}</div>
              <div className="text-[10px] text-amber-600 uppercase tracking-widest">
                {hub.region} · {hub.major ? "Gateway" : "Regional"}
              </div>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
