import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  MapPin,
  Clock,
  Phone,
  Search,
  Building2,
  Globe2,
  ArrowRight,
  CheckCircle2,
  Globe,
} from "lucide-react";
import { CoverageMap } from "@/components/home/CoverageMap";
import { FadeInSection, StaggerGrid, StaggerItem } from "@/components/animated/FadeIn";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-bg.jpg";

export const Route = createFileRoute("/locations")({
  head: () => ({
    meta: [
      { title: "Branch & Office Locations — SwiftArc Logistics" },
      {
        name: "description",
        content:
          "Find SwiftArc courier branches, air cargo gateways, and service centers worldwide. Drop off packages, process shipping, and get on-site assistance.",
      },
      { property: "og:title", content: "Branch Locations — SwiftArc Logistics" },
      {
        property: "og:description",
        content:
          "Locate your nearest SwiftArc office for package drop-off, physical weighing, and shipment processing.",
      },
      {
        name: "keywords",
        content:
          "swiftarc locations, courier drop off, shipping office, freight terminal, parcel branches",
      },
    ],
    links: [{ rel: "canonical", href: "/locations" }],
  }),
  component: LocationsPage,
});

type FacilityType = "Air Gateway" | "Distribution Center" | "Sort Hub" | "Courier Office";

interface Center {
  name: string;
  type: FacilityType;
  country: string;
  city: string;
  addr: string;
  hours: string;
  phone: string;
  services: string[];
  open: boolean;
}

const centers: Center[] = [
  {
    name: "London Canary Wharf Office",
    type: "Courier Office",
    country: "United Kingdom",
    city: "London",
    addr: "1 Canada Square, Canary Wharf, London E14 5AB",
    hours: "Mon - Sat: 08:00 - 20:00",
    phone: "+44 20 7946 0958",
    services: ["Parcel Drop-off", "Shipment Creation", "Weight & Inspection", "Packaging Support"],
    open: true,
  },
  {
    name: "New York World Trade Center Office",
    type: "Courier Office",
    country: "United States",
    city: "New York",
    addr: "One World Trade Center, Suite 4500, NY 10007",
    hours: "Mon - Sat: 08:00 - 20:00",
    phone: "+1 212 555 0198",
    services: ["Parcel Drop-off", "Shipment Creation", "Weight & Inspection", "Express Air"],
    open: true,
  },
  {
    name: "Singapore Asia Square Center",
    type: "Courier Office",
    country: "Singapore",
    city: "Singapore",
    addr: "8 Marina View, Asia Square Tower 1, Singapore 018960",
    hours: "Mon - Sat: 08:00 - 20:00",
    phone: "+65 6555 0122",
    services: ["Parcel Drop-off", "Shipment Creation", "Freight Consultation", "Packaging"],
    open: true,
  },
  {
    name: "Frankfurt Cargo Gateway",
    type: "Air Gateway",
    country: "Germany",
    city: "Frankfurt",
    addr: "Cargo City Süd, Geb. 554, Frankfurt Airport",
    hours: "Open 24/7",
    phone: "+49 69 555 0120",
    services: ["Air Freight Cargo", "Customs Clearance", "Bulk Pallets", "Dangerous Goods"],
    open: true,
  },
  {
    name: "Rotterdam Port Terminal Hub",
    type: "Distribution Center",
    country: "Netherlands",
    city: "Rotterdam",
    addr: "Waalhaven Z.z. 32, 3088 HJ Rotterdam",
    hours: "Open 24/7",
    phone: "+31 10 555 0100",
    services: ["Sea Freight LCL/FCL", "Warehousing", "Customs Bond", "Container Loading"],
    open: true,
  },
  {
    name: "Milan Logistics Hub",
    type: "Distribution Center",
    country: "Italy",
    city: "Milan",
    addr: "Via Ripamonti 200, 20141 Milan",
    hours: "Mon - Sat: 06:00 - 22:00",
    phone: "+39 02 555 0110",
    services: ["Regional Road Fleet", "Cross-Border Transit", "Sort & Storage"],
    open: true,
  },
  {
    name: "Austin Central Sorting Facility",
    type: "Sort Hub",
    country: "United States",
    city: "Austin, TX",
    addr: "5000 Burnet Rd, Austin, TX 78756",
    hours: "Mon - Fri: 06:00 - 22:00",
    phone: "+1 512 555 0130",
    services: ["Regional Ground Sort", "Package Routing", "Pallet Distribution"],
    open: true,
  },
  {
    name: "Tokyo Shibuya Service Point",
    type: "Courier Office",
    country: "Japan",
    city: "Tokyo",
    addr: "1-2 Dogenzaka, Shibuya-ku, Tokyo 150-0043",
    hours: "Mon - Sun: 09:00 - 21:00",
    phone: "+81 3 5555 0170",
    services: ["Parcel Drop-off", "International Express", "Weight & Measure"],
    open: true,
  },
];

const facilityTypes: Array<FacilityType | "All"> = [
  "All",
  "Courier Office",
  "Air Gateway",
  "Distribution Center",
  "Sort Hub",
];

function LocationsPage() {
  const [q, setQ] = useState("");
  const [selectedType, setSelectedType] = useState<FacilityType | "All">("All");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return centers.filter((c) => {
      const matchType = selectedType === "All" || c.type === selectedType;
      const matchQuery =
        !needle ||
        (c.name + " " + c.addr + " " + c.city + " " + c.country).toLowerCase().includes(needle);
      return matchType && matchQuery;
    });
  }, [q, selectedType]);

  return (
    <>
      <section
        className="relative overflow-hidden pt-12 pb-20 sm:pt-14 sm:pb-24 border-b border-slate-100"
        style={{ background: "linear-gradient(145deg, #f0f6ff 0%, #ffffff 55%, #f5f0ff 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#032D60 1.2px, transparent 1.2px)",
            backgroundSize: "26px 26px",
          }}
          aria-hidden
        />
        <div className="absolute -top-20 right-0 w-[460px] h-[460px] rounded-full bg-primary/[0.06] blur-[130px] pointer-events-none" />
        <div className="absolute bottom-0 -left-16 w-[360px] h-[360px] rounded-full bg-sky-400/[0.06] blur-[110px] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 backdrop-blur-sm px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-primary shadow-sm">
                  <Globe2 className="h-3 w-3" />
                  Global Branch Directory
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.08 }}
                className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#032D60] leading-[1.1]"
              >
                Find a SwiftArc{" "}
                <span className="relative">
                  <span className="text-primary">Branch or Facility</span>
                  <motion.span
                    className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-primary/40"
                    initial={{ scaleX: 0, originX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.7, delay: 0.8 }}
                  />
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed"
              >
                Locate your nearest courier office for package drop-off, physical weighing, and
                shipping support — or discover our commercial freight hubs.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.22 }}
                className="flex flex-wrap items-center gap-3"
              >
                <div className="flex items-center gap-2 text-sm text-slate-500 bg-white/70 backdrop-blur-sm border border-slate-200 rounded-full px-4 py-1.5 font-medium">
                  <Building2 className="h-4 w-4 text-primary" /> {centers.length} facilities
                  globally
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500 bg-white/70 backdrop-blur-sm border border-slate-200 rounded-full px-4 py-1.5 font-medium">
                  <Globe2 className="h-4 w-4 text-primary" /> 220+ countries served
                </div>
              </motion.div>
            </div>

            <div className="hidden lg:col-span-5 lg:block">
              <motion.div
                initial={{ opacity: 0, x: 30, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.75, delay: 0.2 }}
              >
                <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/25 backdrop-blur-md p-2 shadow-2xl shadow-[#032D60]/12">
                  <img
                    src={heroImg}
                    alt="SwiftArc Global Locations"
                    className="w-full h-72 sm:h-80 rounded-2xl object-cover"
                  />
                  <div className="absolute inset-2 rounded-2xl bg-gradient-to-tr from-primary/8 via-transparent to-transparent pointer-events-none" />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Notice Banner */}
      <section className="bg-primary/10 border-b border-primary/20 py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 text-sm text-foreground">
            <Building2 className="h-4 w-4 text-primary shrink-0" />
            <span className="font-semibold">In-Branch Shipping:</span>
            <span className="text-muted-foreground">
              Please visit any of our Courier Offices listed below to send a package. Our team will
              weigh, measure, and process your shipment on-site.
            </span>
          </div>
        </div>
      </section>

      {/* Global Interactive Coverage Map */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <FadeInSection className="mb-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-primary mb-4">
            WORLDWIDE COVERAGE
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#032D60]">
            Live Global Route Network
          </h2>
          <div className="w-14 h-1 bg-primary rounded-full mx-auto mt-4" />
        </FadeInSection>
        <FadeInSection className="overflow-hidden rounded-3xl border border-slate-100 shadow-2xl shadow-[#032D60]/10">
          <CoverageMap />
        </FadeInSection>
      </section>

      {/* Facilities Directory */}
      <section className="bg-slate-50 border-y border-slate-100 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <FadeInSection direction="left">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-primary mb-4">
                FACILITY DIRECTORY
              </span>
              <h2 className="font-display text-3xl font-bold tracking-tight text-[#032D60]">
                Our Offices and Transport Hubs
              </h2>
            </FadeInSection>

            {/* Filter Pills and Search */}
            <FadeInSection direction="right" className="flex flex-col sm:flex-row gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search location..."
                  className="pl-9 h-10 bg-white border-slate-200 focus:border-primary/40 focus:ring-1 focus:ring-primary/20 text-sm rounded-xl shadow-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {facilityTypes.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedType(t)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                      selectedType === t
                        ? "bg-primary text-white shadow-md shadow-primary/20"
                        : "bg-white text-slate-500 hover:text-primary hover:bg-primary/5 border border-slate-200 shadow-sm"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </FadeInSection>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center shadow-sm">
              <MapPin className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-display font-bold text-[#032D60] text-xl">No facilities found</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                No branch matches your current search term or filter. Try a broader search.
              </p>
              <Button
                onClick={() => {
                  setQ("");
                  setSelectedType("All");
                }}
                variant="outline"
                className="mt-6 font-bold border-2 rounded-xl"
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <StaggerGrid className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c) => (
                <StaggerItem key={c.name}>
                  <div className="group h-full flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-xl hover:-translate-y-1.5 hover:border-primary/15 transition-all duration-400">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="inline-block rounded-md bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                          {c.type}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                          {c.open ? "Open" : "Closed"}
                        </span>
                      </div>

                      <h3 className="font-display font-bold text-[#032D60] text-lg mb-1 group-hover:text-primary transition-colors">
                        {c.name}
                      </h3>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-5">
                        {c.city}, {c.country}
                      </p>

                      <div className="space-y-3 text-xs text-slate-500 mb-6 border-t border-slate-100 pt-4">
                        <div className="flex items-start gap-2.5">
                          <MapPin className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                          <span className="leading-relaxed">{c.addr}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Clock className="h-4 w-4 shrink-0 text-primary" />
                          <span className="font-medium">{c.hours}</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Phone className="h-4 w-4 shrink-0 text-primary" />
                          <span className="font-medium">{c.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-[#032D60] uppercase tracking-wider mb-2.5">
                        Available Services
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {c.services.map((svc) => (
                          <span
                            key={svc}
                            className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-600 border border-slate-100 group-hover:border-primary/10 transition-colors"
                          >
                            <CheckCircle2 className="h-3 w-3 text-primary" />
                            {svc}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGrid>
          )}
        </div>
      </section>

      {/* CTA Box */}
      <section className="relative overflow-hidden py-20 bg-[#032D60] text-white">
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#EA580C 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
          aria-hidden
        />
        <div className="absolute -top-20 right-1/4 w-80 h-80 rounded-full bg-primary/25 blur-[100px] pointer-events-none" />

        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <FadeInSection className="space-y-6">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">
              Need directions or specialized freight booking?
            </h2>
            <p className="text-white/75 max-w-xl mx-auto leading-relaxed">
              Contact our central coordination team for customized quotes, dangerous goods
              transport, or bulk container bookings.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <Link to="/contact">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary-hover text-white font-bold px-8 h-12 rounded-xl shadow-lg shadow-primary/30 hover:-translate-y-0.5 hover:shadow-primary/50 hover:shadow-xl transition-all"
                >
                  Contact Support <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/shipping">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/25 text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 font-bold px-8 h-12 rounded-xl hover:-translate-y-0.5 transition-all"
                >
                  Explore Shipping Services
                </Button>
              </Link>
            </div>
          </FadeInSection>
        </div>
      </section>
    </>
  );
}
