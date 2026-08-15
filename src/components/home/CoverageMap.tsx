/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useRef, useState } from "react";
import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoWindow } from "@react-google-maps/api";

const hubs: { name: string; pos: { lat: number; lng: number }; region: string }[] = [
  { name: "Rotterdam", pos: { lat: 51.92, lng: 4.48 }, region: "EMEA" },
  { name: "Frankfurt", pos: { lat: 50.03, lng: 8.56 }, region: "EMEA" },
  { name: "Milan", pos: { lat: 45.46, lng: 9.19 }, region: "EMEA" },
  { name: "Dubai", pos: { lat: 25.2, lng: 55.27 }, region: "MEA" },
  { name: "Singapore", pos: { lat: 1.35, lng: 103.82 }, region: "APAC" },
  { name: "Tokyo", pos: { lat: 35.68, lng: 139.76 }, region: "APAC" },
  { name: "Sydney", pos: { lat: -33.87, lng: 151.21 }, region: "APAC" },
  { name: "London", pos: { lat: 51.5, lng: -0.13 }, region: "EMEA" },
  { name: "New York", pos: { lat: 40.71, lng: -74.0 }, region: "AMER" },
  { name: "Austin", pos: { lat: 30.27, lng: -97.74 }, region: "AMER" },
  { name: "Denver", pos: { lat: 39.74, lng: -104.99 }, region: "AMER" },
  { name: "São Paulo", pos: { lat: -23.55, lng: -46.63 }, region: "AMER" },
  { name: "Lagos", pos: { lat: 6.52, lng: 3.38 }, region: "MEA" },
];

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const darkStyles: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0b1220" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b1220" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "road", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f1d32" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  {
    featureType: "administrative.country",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1e293b" }],
  },
  { featureType: "administrative.province", stylers: [{ visibility: "off" }] },
];

const containerStyle = { width: "100%", height: "100%" };

export function CoverageMap() {
  const { isLoaded, loadError } = useJsApiLoader({ googleMapsApiKey: GOOGLE_MAPS_KEY });
  const mapRef = useRef<google.maps.Map | null>(null);
  const [selected, setSelected] = useState<(typeof hubs)[0] | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  if (!GOOGLE_MAPS_KEY || loadError) {
    return (
      <div className="h-[420px] w-full bg-[#0b1220] rounded-2xl flex items-center justify-center">
        <p className="text-sm text-slate-500">Map unavailable — API key not configured.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return <div className="h-[420px] w-full bg-[#0b1220] animate-pulse rounded-2xl" aria-hidden />;
  }

  return (
    <div className="h-[420px] w-full overflow-hidden rounded-2xl border border-border">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={{ lat: 30, lng: 15 }}
        zoom={2}
        onLoad={onLoad}
        options={{
          styles: darkStyles,
          disableDefaultUI: true,
          zoomControl: true,
          minZoom: 2,
          maxZoom: 6,
          backgroundColor: "#0b1220",
        }}
      >
        {/* Connection lines from Rotterdam to other major hubs */}
        {hubs.slice(1, 5).map((hub, i) => (
          <Polyline
            key={`line-${i}`}
            path={[hubs[0].pos, hub.pos]}
            options={{
              strokeColor: "#f59e0b",
              strokeWeight: 1,
              strokeOpacity: 0.5,
              icons: [
                {
                  icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 2 },
                  offset: "0",
                  repeat: "12px",
                },
              ],
            }}
          />
        ))}

        {/* Hub markers */}
        {hubs.map((hub, i) => {
          const isMajor = i < 3;
          return (
            <Marker
              key={hub.name}
              position={hub.pos}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: isMajor ? 8 : 5,
                fillColor: "#0b1220",
                fillOpacity: 1,
                strokeColor: "#f59e0b",
                strokeWeight: isMajor ? 3 : 2,
              }}
              onClick={() => setSelected(hub)}
              title={`${hub.name} Hub`}
            />
          );
        })}

        {/* Hub InfoWindow */}
        {selected && (
          <InfoWindow position={selected.pos} onCloseClick={() => setSelected(null)}>
            <div className="p-1 bg-[#0b1220] text-white rounded">
              <p className="font-bold text-sm">{selected.name} Hub</p>
              <p className="text-xs text-amber-400 uppercase tracking-widest mt-0.5">
                {selected.region} • {hubs.indexOf(selected) < 3 ? "Gateway" : "Regional"}
              </p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
