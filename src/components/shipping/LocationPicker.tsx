import { useState, useEffect, useRef, useCallback } from "react";
import { Search, LocateFixed, Loader2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface LocationData {
  contact_name: string;
  phone: string;
  email: string;
  country_code: string;
  region: string;
  city: string;
  line1: string;
  postal_code: string;
  lat: number | null;
  lng: number | null;
}

interface Props {
  value: LocationData;
  onChange: (patch: Partial<LocationData>) => void;
  role: "sender" | "receiver";
}

/* ------------------------------------------------------------------ */
/*  Nominatim helpers (OSM — free, no key required)                    */
/* ------------------------------------------------------------------ */

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    county?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
}

const nominatimSearch = async (q: string): Promise<NominatimResult[]> => {
  if (q.length < 3) return [];
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6`,
    { headers: { "Accept-Language": "en" } },
  );
  return res.json();
};

const reverseGeocode = async (lat: number, lng: number): Promise<NominatimResult | null> => {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
    { headers: { "Accept-Language": "en" } },
  );
  const data = await res.json();
  return data?.address ? data : null;
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function LocationPicker({ value, onChange, role }: Props) {
  const [mods, setMods] = useState<null | typeof import("react-leaflet")>(null);
  const [L, setL] = useState<null | typeof import("leaflet")>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Lazy-load Leaflet to avoid SSR issues
  useEffect(() => {
    let cancelled = false;
    Promise.all([import("react-leaflet"), import("leaflet")]).then(([m, leaflet]) => {
      if (!cancelled) {
        setMods(m);
        setL(leaflet);
      }
    });
    return () => { cancelled = true; };
  }, []);

  // Close results when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced autocomplete search
  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    clearTimeout(debounceRef.current);
    if (q.length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await nominatimSearch(q);
        setResults(r);
        setShowResults(r.length > 0);
      } catch {
        /* silent */
      } finally {
        setSearching(false);
      }
    }, 350);
  }, []);

  // Apply a Nominatim result to form fields
  const applyResult = useCallback((r: NominatimResult) => {
    const a = r.address;
    onChange({
      line1: a.road ? `${a.house_number || ""} ${a.road}`.trim() : value.line1,
      city: a.city || a.town || a.village || "",
      region: a.state || a.county || "",
      postal_code: a.postcode || "",
      country_code: (a.country_code || "").toUpperCase(),
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    });
    setQuery(r.display_name.slice(0, 60));
    setShowResults(false);
  }, [onChange, value.line1]);

  // Use GPS
  const useMyLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported by your browser.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const data = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          if (data) {
            applyResult(data);
            toast.success("Location applied.");
          } else {
            toast.error("Could not determine address.");
          }
        } catch {
          toast.error("Failed to reverse-geocode your location.");
        } finally {
          setLocating(false);
        }
      },
      () => {
        toast.error("Location access denied.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // Handle map click → reverse geocode
  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    try {
      const data = await reverseGeocode(lat, lng);
      if (data) {
        applyResult(data);
      }
    } catch {
      /* silent */
    }
  }, [applyResult]);

  const hasCoords = value.lat !== null && value.lng !== null;

  return (
    <div className="space-y-4">
      {/* Contact fields */}
      <h3 className="font-display text-lg">
        {role === "sender" ? "Sender information" : "Receiver information"}
      </h3>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={role === "sender" ? "Sender name" : "Receiver name"} v={value.contact_name} on={(x) => onChange({ contact_name: x })} required autoComplete="name" />
        <Field label="Phone number" v={value.phone} on={(x) => onChange({ phone: x })} type="tel" inputMode="tel" autoComplete="tel" />
        <Field label="Email address" v={value.email} on={(x) => onChange({ email: x })} type="email" inputMode="email" autoComplete="email" wide />
      </div>

      {/* Address search */}
      <div className="relative" ref={resultsRef}>
        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Search address</Label>
        <div className="relative mt-1.5">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Type an address, landmark, or place…"
            className="pl-9 pr-24"
            onFocus={() => results.length > 0 && setShowResults(true)}
          />
          <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 gap-1">
            {searching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <Button
              type="button" variant="ghost" size="sm"
              className="h-7 px-2 text-xs"
              onClick={useMyLocation}
              disabled={locating}
            >
              {locating
                ? <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                : <LocateFixed className="mr-1 h-3 w-3 text-amber" />}
              GPS
            </Button>
          </div>
        </div>

        {/* Autocomplete dropdown */}
        {showResults && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
            {results.map((r) => (
              <button
                key={r.place_id}
                type="button"
                className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-secondary transition-colors"
                onClick={() => applyResult(r)}
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
                <span className="line-clamp-2">{r.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Address detail fields */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Country (ISO-2)" v={value.country_code} on={(x) => onChange({ country_code: x.toUpperCase().slice(0, 2) })} required />
        <Field label="State / Province" v={value.region} on={(x) => onChange({ region: x })} />
        <Field label="City" v={value.city} on={(x) => onChange({ city: x })} required />
        <Field label="Postal code" v={value.postal_code} on={(x) => onChange({ postal_code: x })} />
        <Field label={role === "sender" ? "Pickup address" : "Delivery address"} v={value.line1} on={(x) => onChange({ line1: x })} required wide />
      </div>

      {/* Interactive map */}
      <div className="overflow-hidden rounded-xl border border-border">
        <LeafletMap
          mods={mods}
          L={L}
          lat={value.lat}
          lng={value.lng}
          onMapClick={handleMapClick}
        />
      </div>

      {hasCoords && (
        <p className="text-xs text-muted-foreground">
          📍 {value.lat!.toFixed(5)}, {value.lng!.toFixed(5)}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Leaflet map sub-component                                          */
/* ------------------------------------------------------------------ */

function LeafletMap({
  mods,
  L,
  lat,
  lng,
  onMapClick,
}: {
  mods: typeof import("react-leaflet") | null;
  L: typeof import("leaflet") | null;
  lat: number | null;
  lng: number | null;
  onMapClick: (lat: number, lng: number) => void;
}) {
  if (!mods || !L) {
    return <div className="h-52 w-full animate-pulse bg-secondary sm:h-64" aria-hidden />;
  }

  const { MapContainer, TileLayer, Marker, useMapEvents, useMap } = mods;
  const center: [number, number] = lat !== null && lng !== null ? [lat, lng] : [9.06, 7.49]; // default: Abuja
  const zoom = lat !== null ? 15 : 5;

  const pinIcon = L.divIcon({
    html: `<div class="grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-amber text-navy-deep shadow-md"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
    className: "bg-transparent border-none",
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });

  function ClickHandler() {
    useMapEvents({
      click(e) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  }

  function FlyTo({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    useEffect(() => {
      map.flyTo([lat, lng], 15, { duration: 0.8 });
    }, [lat, lng, map]);
    return null;
  }

  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} style={{ height: 220, width: "100%", zIndex: 1 }}>
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">Carto</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <ClickHandler />
      {lat !== null && lng !== null && (
        <>
          <Marker position={[lat, lng]} icon={pinIcon} />
          <FlyTo lat={lat} lng={lng} />
        </>
      )}
    </MapContainer>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared field helper                                                */
/* ------------------------------------------------------------------ */

function Field({
  label, v, on, required, type = "text", wide, inputMode, autoComplete,
}: {
  label: string; v: string; on: (x: string) => void;
  required?: boolean; type?: string; wide?: boolean;
  inputMode?: "tel" | "email" | "text" | "numeric";
  autoComplete?: string;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <Label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>
      <Input
        type={type}
        value={v}
        onChange={(e) => on(e.target.value)}
        required={required}
        className="mt-1.5 h-12 text-base sm:h-10 sm:text-sm"
        inputMode={inputMode}
        autoComplete={autoComplete}
      />
    </div>
  );
}
