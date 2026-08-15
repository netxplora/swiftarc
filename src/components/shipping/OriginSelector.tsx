import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { LocateFixed, MapPin, Building2, Pencil, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocationPicker, type LocationData } from "./LocationPicker";
import { BranchSelector } from "./BranchSelector";

interface Props {
  value: LocationData;
  onChange: (patch: Partial<LocationData>) => void;
  onSourceChange: (
    source: "gps" | "branch" | "manual" | "map_adjustment",
    branchId?: string,
    accuracy?: number,
  ) => void;
}

export function OriginSelector({ value, onChange, onSourceChange }: Props) {
  const [mode, setMode] = useState<"choose" | "gps" | "branch" | "manual">("choose");
  const [confirmed, setConfirmed] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [source, setSource] = useState<"gps" | "branch" | "manual" | "map_adjustment">("manual");
  const [branchId, setBranchId] = useState<string | undefined>();

  const handleConfirm = () => {
    if (!value.city) {
      return toast.error("City is required for the origin.");
    }
    setConfirmed(true);
    onSourceChange(source, branchId, accuracy || undefined);
  };

  const handleEdit = () => {
    setConfirmed(false);
  };

  const startGps = useCallback(() => {
    setMode("gps");
    if (!navigator.geolocation) return toast.error("Geolocation not supported.");
    setDetecting(true);
    toast.info("Using location to identify pickup origin...", { duration: 3000 });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const acc = Math.round(pos.coords.accuracy);
          setAccuracy(acc);

          if (acc > 100) {
            toast.warning(`Low accuracy detected (±${acc}m). Please verify address.`);
          }

          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
          );
          const data = await res.json();
          const a = data?.address;
          if (a) {
            onChange({
              line1: a.road ? `${a.house_number || ""} ${a.road}`.trim() : "",
              city: a.city || a.town || a.village || "",
              region: a.state || a.county || "",
              postal_code: a.postcode || "",
              country_code: (a.country_code || "").toUpperCase(),
              lat,
              lng,
            });
            setSource("gps");
            setBranchId(undefined);
            toast.success(`Location detected (±${acc}m).`);
          } else {
            toast.error("Could not reverse-geocode coordinates.");
          }
        } catch {
          toast.error("Failed to detect address.");
        } finally {
          setDetecting(false);
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          toast.error("Location permission denied. Select branch or enter manually.");
        } else {
          toast.error("Unable to determine location.");
        }
        setDetecting(false);
        setMode("choose");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, [onChange]);

  if (confirmed) {
    return (
      <div className="bg-card border rounded-xl p-4 shadow-sm space-y-4 animate-in fade-in">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-primary font-medium">
            <CheckCircle2 className="w-5 h-5" />
            Origin Confirmed
          </div>
          <Button variant="ghost" size="sm" onClick={handleEdit} className="h-8 px-2 text-xs">
            <Pencil className="w-3 h-3 mr-1" /> Edit
          </Button>
        </div>

        <div className="bg-secondary/30 rounded-lg p-3 text-sm">
          <div className="flex gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">
                {source === "branch"
                  ? "SwiftArc Branch"
                  : source === "gps"
                    ? "GPS Location"
                    : "Manual Address"}
              </p>
              <p className="text-muted-foreground mt-0.5">
                {value.line1 && `${value.line1}, `}
                {value.city}, {value.region} {value.country_code} {value.postal_code}
              </p>
              {value.lat && (
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  {value.lat.toFixed(5)}, {value.lng?.toFixed(5)}{" "}
                  {accuracy ? `(±${accuracy}m)` : ""}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "choose") {
    return (
      <div className="grid sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={startGps}
          className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl hover:border-primary hover:bg-primary/5 transition-colors group"
        >
          <div className="bg-primary/10 p-3 rounded-full mb-3 group-hover:bg-primary/20 transition-colors">
            <LocateFixed className="w-6 h-6 text-primary" />
          </div>
          <span className="font-medium">Use My Location</span>
          <span className="text-xs text-muted-foreground text-center mt-1">Detect via GPS</span>
        </button>

        <button
          type="button"
          onClick={() => setMode("branch")}
          className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl hover:border-amber/50 hover:bg-amber/5 transition-colors group"
        >
          <div className="bg-amber/10 p-3 rounded-full mb-3 group-hover:bg-amber/20 transition-colors">
            <Building2 className="w-6 h-6 text-amber-600" />
          </div>
          <span className="font-medium">Select Branch</span>
          <span className="text-xs text-muted-foreground text-center mt-1">
            Pick a SwiftArc office
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMode("manual");
            setSource("manual");
          }}
          className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl hover:border-muted-foreground/50 hover:bg-secondary/50 transition-colors group"
        >
          <div className="bg-secondary p-3 rounded-full mb-3">
            <MapPin className="w-6 h-6 text-muted-foreground" />
          </div>
          <span className="font-medium">Enter Manually</span>
          <span className="text-xs text-muted-foreground text-center mt-1">Type the address</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-lg">
          {mode === "gps" && "GPS Detected Origin"}
          {mode === "branch" && "Select Branch Origin"}
          {mode === "manual" && "Manual Origin Entry"}
        </h3>
        <Button variant="ghost" size="sm" onClick={() => setMode("choose")}>
          Change Method
        </Button>
      </div>

      {mode === "gps" && detecting && (
        <div className="p-8 text-center border rounded-xl bg-secondary/20">
          <LocateFixed className="w-8 h-8 mx-auto text-primary animate-pulse mb-3" />
          <p className="font-medium animate-pulse">Detecting your location...</p>
        </div>
      )}

      {mode === "gps" && !detecting && (
        <div className="space-y-6">
          <LocationPicker value={value} onChange={onChange} role="sender" />
          <div className="flex justify-end">
            <Button onClick={handleConfirm}>Confirm GPS Origin</Button>
          </div>
        </div>
      )}

      {mode === "branch" && (
        <div className="space-y-6">
          <BranchSelector
            onSelect={(branch, data) => {
              onChange(data);
              setSource("branch");
              setBranchId(branch.id);
            }}
          />
          {source === "branch" && branchId && (
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleConfirm}>Confirm Branch Origin</Button>
            </div>
          )}
        </div>
      )}

      {mode === "manual" && (
        <div className="space-y-6">
          <LocationPicker value={value} onChange={onChange} role="sender" />
          <div className="flex justify-end">
            <Button onClick={handleConfirm}>Confirm Manual Origin</Button>
          </div>
        </div>
      )}
    </div>
  );
}
