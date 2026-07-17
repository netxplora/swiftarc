import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Route as RouteIcon } from "lucide-react";
import type { LatLngExpression } from "leaflet";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Props {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  height?: number;
}

interface OsrmRoute {
  distance: number; // metres
  duration: number; // seconds
  geometry: string; // polyline6
}

/* ------------------------------------------------------------------ */
/*  OSRM fetch (free, public, no key)                                  */
/* ------------------------------------------------------------------ */

async function fetchRoute(
  oLat: number, oLng: number, dLat: number, dLng: number,
): Promise<OsrmRoute | null> {
  const url = `https://router.project-osrm.org/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=full&geometries=polyline`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.code !== "Ok" || !data.routes?.[0]) return null;
  const r = data.routes[0];
  return { distance: r.distance, duration: r.duration, geometry: r.geometry };
}

/* ------------------------------------------------------------------ */
/*  Polyline decoder (Google Polyline Algorithm)                        */
/* ------------------------------------------------------------------ */

function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function RoutePreview({ origin, destination, height = 300 }: Props) {
  const [mods, setMods] = useState<null | typeof import("react-leaflet")>(null);
  const [L, setL] = useState<null | typeof import("leaflet")>(null);

  // Lazy-load Leaflet (SSR-safe)
  useEffect(() => {
    let cancelled = false;
    Promise.all([import("react-leaflet"), import("leaflet")]).then(([m, leaflet]) => {
      if (!cancelled) { setMods(m); setL(leaflet); }
    });
    return () => { cancelled = true; };
  }, []);

  // Fetch route with react-query caching
  const { data: route, isLoading } = useQuery({
    queryKey: ["osrm-route", origin.lat, origin.lng, destination.lat, destination.lng],
    queryFn: () => fetchRoute(origin.lat, origin.lng, destination.lat, destination.lng),
    staleTime: 5 * 60_000, // cache for 5 minutes
    retry: 1,
  });

  if (!mods || !L) {
    return <div style={{ height }} className="w-full animate-pulse rounded-2xl bg-secondary" aria-hidden />;
  }

  const { MapContainer, TileLayer, Polyline, Marker, Tooltip, useMap } = mods;

  const midLat = (origin.lat + destination.lat) / 2;
  const midLng = (origin.lng + destination.lng) / 2;
  const center: LatLngExpression = [midLat, midLng];

  const originIcon = L.divIcon({
    html: `<div class="grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-navy-deep text-[10px] font-bold text-cream shadow-md">P</div>`,
    className: "bg-transparent border-none",
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });

  const destIcon = L.divIcon({
    html: `<div class="grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-amber text-[10px] font-bold text-navy-deep shadow-md">D</div>`,
    className: "bg-transparent border-none",
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });

  const routePoints = route ? decodePolyline(route.geometry) : [];

  const distKm = route ? (route.distance / 1000).toFixed(1) : null;
  const durHrs = route ? Math.floor(route.duration / 3600) : 0;
  const durMin = route ? Math.round((route.duration % 3600) / 60) : 0;

  function FitBounds() {
    const map = useMap();
    useEffect(() => {
      const bounds = L!.latLngBounds([
        [origin.lat, origin.lng],
        [destination.lat, destination.lng],
      ]);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }, [map]);
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-border" style={{ height }}>
        <MapContainer center={center} zoom={6} scrollWheelZoom={false} style={{ height: "100%", width: "100%", zIndex: 1 }}>
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">Carto</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <FitBounds />
          {routePoints.length > 0 && (
            <Polyline
              positions={routePoints}
              pathOptions={{ color: "#FFB020", weight: 4, lineCap: "round", lineJoin: "round" }}
            />
          )}
          <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
            <Tooltip direction="bottom" offset={[0, 6]} opacity={1}>Pickup</Tooltip>
          </Marker>
          <Marker position={[destination.lat, destination.lng]} icon={destIcon}>
            <Tooltip direction="bottom" offset={[0, 6]} opacity={1}>Delivery</Tooltip>
          </Marker>
        </MapContainer>
      </div>

      {/* Route stats */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <RouteIcon className="h-5 w-5 text-amber" />
        {isLoading ? (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Calculating route…
          </span>
        ) : route ? (
          <div className="text-sm">
            <span className="font-semibold">{distKm} km</span>
            <span className="mx-2 text-muted-foreground">·</span>
            <span className="text-muted-foreground">
              Est. drive {durHrs > 0 ? `${durHrs}h ` : ""}{durMin}min
            </span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Route unavailable for these locations.</span>
        )}
      </div>
    </div>
  );
}
