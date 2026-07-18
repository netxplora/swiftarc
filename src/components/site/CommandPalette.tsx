import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import {
  Home, PackageSearch, Calculator, MapPin, Building2, LifeBuoy,
  BookOpen, LogIn, UserPlus, Truck, Info, Mail,
} from "lucide-react";

const routes = [
  { to: "/", label: "Home", Icon: Home },
  { to: "/shipping", label: "Shipping services", Icon: Truck },
  { to: "/tracking", label: "Track a shipment", Icon: PackageSearch },
  { to: "/rates", label: "Rate calculator", Icon: Calculator },
  { to: "/locations", label: "Locations", Icon: MapPin },
  { to: "/business", label: "Business solutions", Icon: Building2 },
  { to: "/support", label: "Support", Icon: LifeBuoy },
  { to: "/resources", label: "Resources", Icon: BookOpen },
  { to: "/about", label: "About", Icon: Info },
  { to: "/contact", label: "Contact", Icon: Mail },
  { to: "/login", label: "Log in", Icon: LogIn },
  { to: "/register", label: "Open account", Icon: UserPlus },
] as const;

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isTrackingLike = /^SA[-\s]?/i.test(query.trim()) || /^\w{2,}-?\d/.test(query.trim());

  const go = (to: string) => {
    setOpen(false);
    navigate({ to: to as never });
  };

  const goTrack = (id: string) => {
    setOpen(false);
    navigate({ to: "/tracking/$trackingId", params: { trackingId: id } });
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search pages, or paste a tracking number…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        {isTrackingLike && query.trim().length >= 4 && (
          <>
            <CommandGroup heading="Track">
              <CommandItem onSelect={() => goTrack(query.trim())}>
                <PackageSearch className="mr-2 h-4 w-4" />
                Track shipment <span className="ml-1 font-mono text-amber">{query.trim()}</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
          </>
        )}
        <CommandGroup heading="Pages">
          {routes.map((r) => (
            <CommandItem key={r.to} onSelect={() => go(r.to)}>
              <r.Icon className="mr-2 h-4 w-4" />
              {r.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
