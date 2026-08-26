import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Ship,
  Truck,
  Plane,
  Package,
  Warehouse,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Globe,
  Calculator,
  ChevronRight,
  FileCheck2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-bg.jpg";
import warehouseImg from "@/assets/warehouse.jpg";
import aircraftImg from "@/assets/aircraft.jpg";
import deliveryImg from "@/assets/delivery.jpg";
import svcIntlImg from "@/assets/svc-intl.jpg";
import svcEcommerceImg from "@/assets/svc-ecommerce.jpg";
import svcWhitegloveImg from "@/assets/svc-whiteglove.jpg";
import { FadeInSection, StaggerGrid, StaggerItem } from "@/components/animated/FadeIn";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "Shipping Services — SwiftArc Logistics" },
      {
        name: "description",
        content:
          "Explore SwiftArc shipping services: Sea Freight, Air Freight, Road Transport, Warehousing, Packaging, and Diplomatic Courier across 220+ countries.",
      },
      { property: "og:title", content: "Shipping Services — SwiftArc Logistics" },
      {
        property: "og:description",
        content: "Reliable freight and parcel shipping worldwide. Track your shipment in real time.",
      },
    ],
    links: [{ rel: "canonical", href: "/shipping" }],
  }),
  component: ShippingPage,
});

const services = [
  {
    icon: Ship,
    iconBg: "bg-blue-500/15 text-blue-600",
    accent: "from-blue-50 to-blue-100/30",
    hoverGlow: "hover:shadow-blue-100",
    title: "Sea / Ocean Freight",
    slug: "sea-freight",
    image: svcIntlImg,
    desc: "Full container load (FCL) and less-than-container-load (LCL) shipping across all major global trade routes. Ideal for large or heavy cargo where transit time is flexible.",
    features: ["FCL & LCL options", "Port-to-port and door-to-door", "Customs clearance included", "Reefer containers available"],
  },
  {
    icon: Truck,
    iconBg: "bg-primary/15 text-primary",
    accent: "from-orange-50 to-orange-100/30",
    hoverGlow: "hover:shadow-orange-100",
    title: "Road Transportation",
    slug: "road",
    image: deliveryImg,
    desc: "Scheduled and on-demand ground transport covering regional and cross-border routes. Our fleet handles everything from parcels to full truck loads.",
    features: ["Scheduled & express options", "Cross-border clearance", "Real-time GPS tracking", "Tail-lift delivery available"],
  },
  {
    icon: Plane,
    iconBg: "bg-sky-500/15 text-sky-600",
    accent: "from-sky-50 to-sky-100/30",
    hoverGlow: "hover:shadow-sky-100",
    title: "Air Freight",
    slug: "air-freight",
    image: aircraftImg,
    desc: "Time-critical air cargo services to 190+ destinations. Choose between next-day express, priority air, and economy freight options.",
    features: ["Next-day express available", "190+ destinations", "Dangerous goods certified", "Temperature-sensitive cargo"],
  },
  {
    icon: Warehouse,
    iconBg: "bg-emerald-500/15 text-emerald-600",
    accent: "from-emerald-50 to-emerald-100/30",
    hoverGlow: "hover:shadow-emerald-100",
    title: "Warehousing & Fulfillment",
    slug: "warehousing",
    image: warehouseImg,
    desc: "Secure, climate-controlled storage with flexible lease terms. Pick-and-pack, inventory management, and order fulfillment across global hubs.",
    features: ["Climate-controlled storage", "Pick-and-pack fulfillment", "Inventory management", "Bonded warehouse options"],
  },
  {
    icon: Package,
    iconBg: "bg-purple-500/15 text-purple-600",
    accent: "from-purple-50 to-purple-100/30",
    hoverGlow: "hover:shadow-purple-100",
    title: "Packaging & Parcel Services",
    slug: "packaging",
    image: svcEcommerceImg,
    desc: "Professional packaging solutions for fragile, oversized, and high-value items. Short-term and long-term storage available at every major hub.",
    features: ["Custom crating and wrapping", "Fragile item handling", "Short & long-term storage", "Export-compliant packing"],
  },
  {
    icon: ShieldCheck,
    iconBg: "bg-amber-500/15 text-amber-600",
    accent: "from-amber-50 to-amber-100/30",
    hoverGlow: "hover:shadow-amber-100",
    title: "Diplomatic & Secure Courier",
    slug: "diplomatic",
    image: svcWhitegloveImg,
    desc: "Specialist handling for diplomatic pouches, government cargo, and high-value assets with full chain-of-custody documentation.",
    features: ["Diplomatic pouch handling", "High-value asset transport", "Full chain-of-custody", "Dedicated escort service"],
  },
];

const steps = [
  { step: "01", title: "Visit Your Nearest Office", icon: MapPin, color: "bg-sky-500", desc: "Bring your package to any SwiftArc courier office. Our staff will inspect, weigh, and measure it on certified scales." },
  { step: "02", title: "We Process Your Shipment", icon: FileCheck2, color: "bg-primary", desc: "An agent creates your shipment record, prepares customs documentation, and issues your tracking receipt immediately." },
  { step: "03", title: "Track Every Milestone", icon: Zap, color: "bg-emerald-500", desc: "Your shipment is scanned at each network node. You receive live status updates from dispatch to delivery." },
];

function ShippingPage() {
  return (
    <div className="bg-background text-foreground overflow-x-hidden">

      {/* ── Cinematic Hero ── */}
      <section
        className="relative min-h-[72vh] flex items-center overflow-hidden pt-12 pb-16"
        style={{ background: "linear-gradient(145deg, #f0f6ff 0%, #ffffff 55%, #f5f0ff 100%)" }}
      >
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(#032D60 1.2px, transparent 1.2px)", backgroundSize: "26px 26px" }}
          aria-hidden
        />
        {/* Glow orbs */}
        <div className="absolute -top-24 right-0 w-[500px] h-[500px] rounded-full bg-primary/[0.07] blur-[130px] pointer-events-none" />
        <div className="absolute bottom-0 -left-20 w-[400px] h-[400px] rounded-full bg-sky-400/[0.06] blur-[110px] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid gap-14 lg:grid-cols-12 lg:items-center">

            {/* ── Left copy ── */}
            <div className="lg:col-span-7 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 backdrop-blur-sm px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-primary shadow-sm">
                  <Globe className="h-3 w-3 animate-spin" style={{ animationDuration: "8s" }} />
                  Global Shipping & Freight
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.08 }}
                className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#032D60] leading-[1.1]"
              >
                Shipping Services for{" "}
                <span className="relative">
                  <span className="text-primary">Every Need</span>
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
                Whether you're sending a single parcel or managing recurring international freight,
                SwiftArc delivers across 220+ countries with end-to-end tracking and insured handling.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.22 }}
                className="flex flex-wrap gap-4"
              >
                <Link to="/locations">
                  <Button size="lg" className="group bg-primary text-white hover:bg-primary-hover font-bold px-7 h-12 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/35 hover:shadow-xl hover:-translate-y-0.5 transition-all">
                    Find Nearest Branch <MapPin className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/rates">
                  <Button size="lg" variant="outline" className="border-2 border-[#032D60]/20 text-[#032D60] hover:border-primary hover:text-primary hover:bg-primary/5 font-bold px-7 h-12 rounded-xl bg-white/60 backdrop-blur-sm hover:-translate-y-0.5 transition-all">
                    <Calculator className="mr-2 h-4 w-4 text-primary" /> Calculate Rates
                  </Button>
                </Link>
              </motion.div>

              {/* Trust tags */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="flex flex-wrap gap-3 pt-2"
              >
                {["100% Insured", "220+ Countries", "Real-time Tracking", "24/7 Support"].map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-white/80 border border-slate-200 rounded-full px-3 py-1 backdrop-blur-sm">
                    <CheckCircle2 className="h-3 w-3 text-primary" /> {tag}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* ── Right visual ── */}
            <div className="lg:col-span-5">
              <motion.div
                initial={{ opacity: 0, x: 30, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.75, delay: 0.2 }}
                className="relative"
              >
                {/* Glass frame */}
                <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/25 backdrop-blur-md p-2 shadow-2xl shadow-[#032D60]/12">
                  <img
                    src={heroImg}
                    alt="SwiftArc Shipping Services"
                    className="w-full h-72 sm:h-80 lg:h-96 rounded-2xl object-cover"
                  />
                  <div className="absolute inset-2 rounded-2xl bg-gradient-to-tr from-primary/8 via-transparent to-sky-400/5 pointer-events-none" />
                </div>

                {/* Floating glass stat — bottom */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.75 }}
                  className="absolute -bottom-5 left-4 right-4 sm:left-6 sm:right-6 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/70 shadow-xl p-3 grid grid-cols-3 gap-3 text-center"
                >
                  {[{ v: "220+", l: "Countries" }, { v: "99.7%", l: "On-Time" }, { v: "24/7", l: "Support" }].map(({ v, l }) => (
                    <div key={l}>
                      <div className="font-display text-lg font-bold text-primary">{v}</div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{l}</div>
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Info banner ── */}
      <div className="bg-[#032D60]/95 backdrop-blur-sm border-y border-white/10 py-3.5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold">i</span>
            <span className="font-semibold text-white">How to ship with SwiftArc:</span>
            <span className="text-white/70 text-xs sm:text-sm">
              Bring your package to any branch office — our staff will handle weighing, documentation, and dispatch.
            </span>
            <Link to="/locations" className="ml-auto shrink-0 font-bold text-primary hover:underline text-xs sm:text-sm inline-flex items-center gap-1">
              Find a branch <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Service Cards ── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <FadeInSection className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-primary mb-4">
            WHAT WE OFFER
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#032D60]">
            Six Comprehensive Ways to Ship
          </h2>
          <div className="w-14 h-1 bg-primary rounded-full mx-auto mt-4 mb-4" />
          <p className="text-slate-500 text-sm sm:text-base">
            Every service includes real-time GPS tracking, insured handling, and dedicated support.
          </p>
        </FadeInSection>

        <StaggerGrid className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <StaggerItem key={s.title}>
              <div
                id={s.slug}
                className={`group h-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md transition-all duration-400 hover:shadow-2xl hover:-translate-y-2 hover:border-primary/15 ${s.hoverGlow} flex flex-col`}
              >
                {/* Image with glass badge overlay */}
                <div className={`relative h-52 overflow-hidden bg-gradient-to-br ${s.accent} to-white`}>
                  <img
                    src={s.image}
                    alt={s.title}
                    className="h-full w-full object-cover transition-transform duration-600 group-hover:scale-105"
                  />
                  {/* Glass badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${s.iconBg} bg-white/80 backdrop-blur-md shadow-md border border-white/60`}>
                      <s.icon className="h-3.5 w-3.5" />
                      {s.title}
                    </span>
                  </div>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#032D60]/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="font-display text-xl font-bold text-[#032D60] leading-snug mb-2 group-hover:text-primary transition-colors">
                    {s.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4 flex-1">{s.desc}</p>

                  <ul className="space-y-1.5 border-t border-slate-100 pt-4 mb-5">
                    {s.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link to="/rates">
                    <Button
                      variant="outline"
                      className="w-full border-slate-200 hover:border-primary hover:text-primary font-bold text-xs h-10 rounded-xl transition-all group-hover:bg-primary/5"
                    >
                      Calculate Rates <ChevronRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </section>

      {/* ── 3-Step Process ── */}
      <section className="bg-gradient-to-b from-slate-50/80 to-white border-y border-slate-100 py-20 sm:py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-primary/[0.04] blur-[100px] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInSection className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-primary mb-4">
              HOW IT WORKS
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#032D60]">
              In-Person Drop-Off &amp; Processing
            </h2>
            <div className="w-14 h-1 bg-primary rounded-full mx-auto mt-4 mb-4" />
            <p className="text-slate-500 text-sm sm:text-base">
              Simple 3-step physical branch process from hand-off to live tracking.
            </p>
          </FadeInSection>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {steps.map((st, i) => (
              <motion.div
                key={st.step}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                whileHover={{ y: -5 }}
                className="group relative rounded-2xl border border-slate-100 bg-white p-7 shadow-sm hover:shadow-xl transition-all duration-400 text-center overflow-hidden"
              >
                {/* Watermark step number */}
                <div className="absolute -right-3 -top-3 font-display text-8xl font-black text-slate-50 select-none pointer-events-none leading-none">
                  {st.step}
                </div>
                {/* Accent bottom line */}
                <div className={`absolute bottom-0 left-0 right-0 h-[3px] ${st.color} scale-x-0 group-hover:scale-x-100 transition-transform duration-400 origin-left rounded-b-2xl`} />

                <div className={`relative h-14 w-14 rounded-2xl ${st.color} text-white grid place-items-center mx-auto mb-5 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <st.icon className="h-6 w-6" />
                </div>
                <div className="relative text-xs font-bold text-primary uppercase tracking-widest mb-1">Step {st.step}</div>
                <h3 className="relative font-display text-lg font-bold text-[#032D60] mb-2">{st.title}</h3>
                <p className="relative text-sm text-slate-500 leading-relaxed">{st.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="relative overflow-hidden py-20 bg-[#032D60] text-white">
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(#EA580C 1px, transparent 1px)", backgroundSize: "22px 22px" }}
          aria-hidden
        />
        <div className="absolute -top-20 right-1/4 w-80 h-80 rounded-full bg-primary/25 blur-[100px] pointer-events-none" />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <FadeInSection className="space-y-6">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">
              Ready to Dispatch Your Shipment?
            </h2>
            <p className="text-base text-white/75 max-w-xl mx-auto">
              Locate a nearby courier branch or use our instant transit calculator.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <Link to="/locations">
                <Button size="lg" className="group bg-primary hover:bg-primary-hover text-white font-bold px-8 h-12 rounded-xl shadow-lg shadow-primary/30 hover:-translate-y-0.5 hover:shadow-primary/50 hover:shadow-xl transition-all">
                  Find a Branch <MapPin className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button size="lg" variant="outline" className="border-2 border-white/25 text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 font-bold px-8 h-12 rounded-xl hover:-translate-y-0.5 transition-all">
                  Contact Support
                </Button>
              </Link>
            </div>
          </FadeInSection>
        </div>
      </section>
    </div>
  );
}
