import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListShipments } from "@/lib/admin.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertTriangle } from "lucide-react";
import type { LatLngExpression } from "leaflet";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/map")({
  head: () => ({ meta: [{ title: "Global Fleet Map — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminGlobalMap,
});

function AdminGlobalMap() {
  const fetchShipments = useServerFn(adminListShipments);
  const q = useQuery({ queryKey: ["admin-shipments-map"], queryFn: () => fetchShipments(), refetchInterval: 10000 });

  const [mods, setMods] = useState<null | typeof import("react-leaflet")>(null);
  const [L, setL] = useState<null | typeof import("leaflet")>(null);

  useEffect(() => {
    let c = false;
    Promise.all([import("react-leaflet"), import("leaflet")]).then(([m, leaflet]) => {
      if (!c) {
        setMods(m);
        setL(leaflet);
      }
    });
    return () => { c = true; };
  }, []);

  if (!mods || !L) {
    return <div className="grid h-[70vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const { MapContainer, TileLayer, Marker, Tooltip } = mods;
  const center: LatLngExpression = [20, 0]; // Global view

  // Filter only active shipments that have destination coordinates
  const activeShipments = (q.data ?? []).filter((s: any) => s.status !== "delivered" && s.status !== "exception" && s.destination?.lat && s.destination?.lng);

  const createIcon = (html: string) => L.divIcon({ html, className: "bg-transparent border-none", iconSize: [24, 24], iconAnchor: [12, 12] });

  const normalIcon = createIcon(`
    <div class="relative flex h-6 w-6 items-center justify-center">
      <div class="absolute h-full w-full animate-pulse rounded-full bg-amber opacity-50"></div>
      <div class="relative h-3 w-3 rounded-full border-2 border-background bg-amber shadow-sm"></div>
    </div>
  `);

  const warningIcon = createIcon(`
    <div class="relative flex h-6 w-6 items-center justify-center">
      <div class="absolute h-full w-full animate-ping rounded-full bg-destructive opacity-75"></div>
      <div class="relative h-4 w-4 rounded-full border-2 border-background bg-destructive shadow-md flex items-center justify-center text-[8px] font-bold text-white">!</div>
    </div>
  `);

  const anomalyCount = activeShipments.filter((s: any) => s.telemetry?.shockEvents > 0 || s.telemetry?.healthScore < 80).length;

  const [couriers, setCouriers] = useState([
    { id: "c1", name: "David Kim", lat: 34.0522, lng: -118.2437 },
    { id: "c2", name: "Sarah Chen", lat: 40.7128, lng: -74.0060 },
    { id: "c3", name: "Marcus Johnson", lat: 51.5074, lng: -0.1278 },
    { id: "c4", name: "Alex Rivera", lat: -33.8688, lng: 151.2093 },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCouriers(prev => prev.map(c => ({
        ...c,
        lat: c.lat + (Math.random() - 0.5) * 0.05,
        lng: c.lng + (Math.random() - 0.5) * 0.05
      })));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const truckIcon = createIcon(`
    <div class="relative flex h-8 w-8 items-center justify-center">
      <div class="absolute h-full w-full rounded-full bg-blue-500 opacity-30 animate-ping"></div>
      <div class="relative h-6 w-6 rounded-full border-2 border-background bg-blue-500 shadow-md flex items-center justify-center text-white">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"/><path d="M14 17h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
      </div>
    </div>
  `);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Global Operations Map</h1>
          <p className="mt-1 text-sm text-muted-foreground">Real-time telemetry and network tracking.</p>
        </div>
        <div className="flex gap-4">
          <Card className="bg-secondary border-none">
            <CardContent className="p-3 py-2 flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-amber animate-pulse" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground">ACTIVE ROUTES</p>
                <p className="font-display text-lg font-bold leading-none">{activeShipments.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-destructive/10 border-destructive/20">
            <CardContent className="p-3 py-2 flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-destructive animate-ping" />
              <div>
                <p className="text-xs font-semibold text-destructive">ANOMALIES</p>
                <p className="font-display text-lg font-bold leading-none text-destructive">{anomalyCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="h-[70vh] w-full overflow-hidden rounded-2xl border border-border bg-secondary relative z-0">
        <MapContainer center={center} zoom={2} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">Carto</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {activeShipments.map((s: any) => {
            const hasAnomaly = s.telemetry?.shockEvents > 0 || s.telemetry?.healthScore < 80;
            return (
              <Marker key={s.id} position={[s.destination.lat, s.destination.lng]} icon={hasAnomaly ? warningIcon : normalIcon}>
                <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                  <div className="space-y-1 p-1">
                    <p className="font-mono text-xs font-bold">{s.tracking_number}</p>
                    <p className="text-[10px] text-muted-foreground">{s.destination.city}, {s.destination.country}</p>
                    {hasAnomaly && (
                      <Badge variant="destructive" className="mt-1 text-[8px] h-4 py-0 px-1 uppercase tracking-widest flex items-center gap-1">
                        <AlertTriangle className="h-2 w-2" /> Telemetry Warning
                      </Badge>
                    )}
                  </div>
                </Tooltip>
              </Marker>
            );
          })}
          
          {couriers.map(c => (
            <Marker key={c.id} position={[c.lat, c.lng]} icon={truckIcon}>
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                <div className="space-y-1 p-1">
                  <p className="text-xs font-bold text-navy-deep">{c.name}</p>
                  <p className="text-[10px] text-muted-foreground text-center">Active Courier (GPS)</p>
                </div>
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
