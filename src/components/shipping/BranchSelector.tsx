import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Building2, MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { adminListBranches } from "@/lib/admin.functions";
import type { LocationData } from "./LocationPicker";

interface Props {
  onSelect: (branch: any, locationData: Partial<LocationData>) => void;
}

export function BranchSelector({ onSelect }: Props) {
  const getBranches = useServerFn(adminListBranches);
  const { data: branches = [], isLoading } = useQuery({
    queryKey: ["admin-branches"],
    queryFn: () => getBranches(),
  });

  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query) return branches;
    const q = query.toLowerCase();
    return branches.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q) ||
        b.address?.toLowerCase().includes(q),
    );
  }, [branches, query]);

  if (isLoading) {
    return <div className="h-40 animate-pulse bg-secondary/50 rounded-xl" />;
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search branches or hubs..."
          className="pl-9 bg-background"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2">
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">No branches found.</p>
        ) : (
          filtered.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                onSelect(b, {
                  line1: b.address || "",
                  city: b.city,
                  region: b.state || "",
                  country_code: b.country,
                  postal_code: b.postal_code || "",
                  lat: b.lat ? Number(b.lat) : null,
                  lng: b.lng ? Number(b.lng) : null,
                });
              }}
              className="flex items-start text-left gap-3 p-3 rounded-lg border bg-card hover:bg-secondary/50 transition-colors"
            >
              <div className="bg-primary/10 p-2 rounded-full mt-0.5">
                <Building2 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm">{b.name}</h4>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  {b.address ? `${b.address}, ` : ""}
                  {b.city}, {b.country}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
