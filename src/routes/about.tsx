import { motion } from "motion/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Shield,
  Globe,
  Clock,
  Award,
  ArrowRight,
  CheckCircle2,
  Users,
  Building,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-bg.jpg";
import aircraft from "@/assets/aircraft.jpg";
import { FadeInSection, StaggerGrid, StaggerItem } from "@/components/animated/FadeIn";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — SwiftArc Logistics" },
      {
        name: "description",
        content:
          "Learn about SwiftArc Logistics. We provide international shipping, freight transport, and supply chain solutions across 220+ countries worldwide.",
      },
      { property: "og:title", content: "About SwiftArc Logistics" },
      {
        property: "og:description",
        content:
          "SwiftArc is a global shipping and logistics provider connecting businesses and individuals to 220+ countries.",
      },
      {
        name: "keywords",
        content:
          "about swiftarc, logistics company, international freight, courier services, global shipping",
      },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

const values = [
  {
    icon: Shield,
    color: "bg-primary/10 text-primary",
    title: "Reliability & Security",
    desc: "Every package is handled with care and tracked at every milestone from origin to destination.",
  },
  {
    icon: Globe,
    color: "bg-sky-500/10 text-sky-600",
    title: "Global Reach",
    desc: "Direct access to over 220 countries and territories with established local delivery partners.",
  },
  {
    icon: Clock,
    color: "bg-emerald-500/10 text-emerald-600",
    title: "On-Time Commitment",
    desc: "We maintain a 99.4% on-time delivery rate across air, sea, and ground transport routes.",
  },
  {
    icon: Award,
    color: "bg-amber-500/10 text-amber-600",
    title: "Clear & Honest Service",
    desc: "No unexpected fees, accurate package weights, and straightforward tracking for complete peace of mind.",
  },
];

const stats = [
  { value: "220+", label: "Countries Served", icon: Globe },
  { value: "15M+", label: "Packages Delivered", icon: Building },
  { value: "99.4%", label: "On-Time Rate", icon: Clock },
  { value: "24/7", label: "Customer Support", icon: Users },
];

const team = [
  {
    name: "Michael R. Henderson",
    role: "Operations Director",
    desc: "Oversees global routing, hub coordination, and air freight logistics.",
  },
  {
    name: "Sarah L. Jenkins",
    role: "Head of Customer Experience",
    desc: "Leads our 24/7 client support and shipment tracking response teams.",
  },
  {
    name: "David K. Chen",
    role: "Logistics Network Manager",
    desc: "Manages ground transport fleets, partner hubs, and warehouse facilities.",
  },
];

function AboutPage() {
  return (
    <div className="bg-background text-foreground overflow-x-hidden">
      {/* ── Premium Glassmorphic Hero ── */}
      <section
        className="relative min-h-[68vh] flex items-center overflow-hidden pt-12 pb-16"
        style={{ background: "linear-gradient(145deg, #f0f6ff 0%, #ffffff 55%, #f5f0ff 100%)" }}
      >
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#032D60 1.2px, transparent 1.2px)",
            backgroundSize: "26px 26px",
          }}
          aria-hidden
        />
        {/* Glow orbs */}
        <div className="absolute -top-20 right-0 w-[480px] h-[480px] rounded-full bg-primary/[0.06] blur-[130px] pointer-events-none" />
        <div className="absolute bottom-0 -left-16 w-[380px] h-[380px] rounded-full bg-sky-400/[0.06] blur-[110px] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid gap-14 lg:grid-cols-12 lg:items-center">
            {/* Left copy */}
            <div className="lg:col-span-7 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 backdrop-blur-sm px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-primary shadow-sm">
                  <Globe className="h-3 w-3" />
                  About SwiftArc Logistics
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.08 }}
                className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#032D60] leading-[1.1]"
              >
                Connecting the World Through{" "}
                <span className="relative">
                  <span className="text-primary">Reliable Logistics</span>
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
                SwiftArc is an international shipping and courier company dedicated to safe,
                transparent, and dependable package delivery across 220+ countries and territories.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.22 }}
                className="flex flex-wrap gap-4"
              >
                <Link to="/shipping">
                  <Button
                    size="lg"
                    className="group bg-primary text-white hover:bg-primary-hover font-bold px-7 h-12 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/35 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                  >
                    View Shipping Services{" "}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/locations">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-[#032D60]/20 text-[#032D60] hover:border-primary hover:text-primary hover:bg-primary/5 font-bold px-7 h-12 rounded-xl bg-white/60 backdrop-blur-sm hover:-translate-y-0.5 transition-all"
                  >
                    <MapPin className="mr-2 h-4 w-4 text-primary" /> Find Nearest Office
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
                {["Founded 2008", "220+ Countries", "ISO 9001 Certified", "24/7 Support"].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-white/80 border border-slate-200 rounded-full px-3 py-1 backdrop-blur-sm"
                    >
                      <CheckCircle2 className="h-3 w-3 text-primary" /> {tag}
                    </span>
                  ),
                )}
              </motion.div>
            </div>

            {/* Right image with glass frame */}
            <div className="lg:col-span-5">
              <motion.div
                initial={{ opacity: 0, x: 30, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.75, delay: 0.2 }}
                className="relative"
              >
                <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/25 backdrop-blur-md p-2 shadow-2xl shadow-[#032D60]/12">
                  <img
                    src={heroImg}
                    alt="SwiftArc Global Logistics"
                    className="w-full h-72 sm:h-80 lg:h-96 rounded-2xl object-cover"
                  />
                  <div className="absolute inset-2 rounded-2xl bg-gradient-to-tr from-primary/8 via-transparent to-sky-400/5 pointer-events-none" />
                </div>
                {/* Floating glass stat */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.75 }}
                  className="absolute -bottom-5 left-4 right-4 sm:left-6 sm:right-6 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/70 shadow-xl p-3 grid grid-cols-3 gap-3 text-center"
                >
                  {[
                    { v: "220+", l: "Countries" },
                    { v: "15M+", l: "Parcels" },
                    { v: "99.4%", l: "On-Time" },
                  ].map(({ v, l }) => (
                    <div key={l}>
                      <div className="font-display text-lg font-bold text-primary">{v}</div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        {l}
                      </div>
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Company Overview ── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <FadeInSection direction="left">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-primary mb-4">
              OUR STORY
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#032D60] leading-tight mb-6">
              Built on dependable delivery and clear communication
            </h2>
            <div className="space-y-4 text-slate-500 leading-relaxed text-sm sm:text-base">
              <p>
                SwiftArc was founded to provide individuals and businesses with a direct,
                trustworthy way to ship cargo and parcels globally. We believe shipping should be
                straightforward: accurate quotes, clear tracking, and on-time arrival.
              </p>
              <p>
                Our network links regional road transport, commercial air routes, ocean shipping,
                and bonded warehouses into a single coordinated system. Each package is inspected,
                measured, and tracked from our local offices directly to the recipient.
              </p>
              <p>
                Today, thousands of senders trust SwiftArc daily for critical shipments, commercial
                freight, and personal packages.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/shipping">
                <Button className="bg-primary text-white hover:bg-primary-hover font-bold rounded-xl h-11 px-6 shadow-md hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all">
                  View Shipping Services <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/locations">
                <Button
                  variant="outline"
                  className="border-2 font-bold rounded-xl h-11 px-6 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                >
                  Find Nearest Office
                </Button>
              </Link>
            </div>
          </FadeInSection>

          <FadeInSection direction="right">
            <div className="relative overflow-hidden rounded-3xl shadow-2xl shadow-[#032D60]/10">
              <img
                src={aircraft}
                alt="SwiftArc air cargo transport"
                loading="lazy"
                className="h-full w-full object-cover aspect-[4/3] transition-transform duration-500 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#032D60]/15 to-transparent pointer-events-none rounded-3xl" />
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ── Stats Strip ── */}
      <section className="border-y border-[#032D60]/20 bg-[#032D60] py-14 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#EA580C 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
          aria-hidden
        />
        <div className="absolute -top-20 right-1/4 w-80 h-80 rounded-full bg-primary/20 blur-[100px] pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 text-center">
            {stats.map((s, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="space-y-2"
              >
                <div className="flex justify-center mb-2">
                  <div className="h-10 w-10 rounded-xl bg-primary/20 grid place-items-center">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="font-display text-4xl sm:text-5xl font-bold text-primary">
                  {s.value}
                </div>
                <div className="text-xs uppercase tracking-wider text-white/70 font-semibold">
                  {s.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Core Values ── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <FadeInSection className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-primary mb-4">
            OUR PRINCIPLES
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#032D60]">
            What We Stand For
          </h2>
          <div className="w-14 h-1 bg-primary rounded-full mx-auto mt-4 mb-4" />
          <p className="text-slate-500 text-sm sm:text-base">
            Our operational standards ensure your package arrives safely and on schedule.
          </p>
        </FadeInSection>

        <StaggerGrid className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => (
            <StaggerItem key={v.title}>
              <div className="group h-full rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-xl hover:-translate-y-2 hover:border-primary/15 transition-all duration-400">
                <div
                  className={`h-12 w-12 rounded-xl ${v.color} grid place-items-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-bold text-[#032D60] mb-2 group-hover:text-primary transition-colors">
                  {v.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">{v.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGrid>
      </section>

      {/* ── Team ── */}
      <section className="bg-gradient-to-b from-slate-50/80 to-white border-y border-slate-100 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInSection className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-primary mb-4">
              OPERATIONS
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#032D60]">
              Dedicated Logistics Management
            </h2>
            <div className="w-14 h-1 bg-primary rounded-full mx-auto mt-4 mb-4" />
            <p className="text-slate-500 text-sm sm:text-base">
              Experienced professionals coordinating shipments across global routes every day.
            </p>
          </FadeInSection>

          <StaggerGrid className="grid gap-6 md:grid-cols-3">
            {team.map((p) => (
              <StaggerItem key={p.name}>
                <div className="group h-full rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-primary/15 transition-all duration-400">
                  {/* Avatar */}
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 grid place-items-center font-display text-lg font-bold text-primary mb-4 group-hover:bg-primary/15 transition-colors">
                    {p.name
                      .split(" ")
                      .map((s) => s[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#032D60] group-hover:text-primary transition-colors">
                    {p.name}
                  </h3>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-primary mt-1 mb-3">
                    {p.role}
                  </p>
                  <p className="text-sm text-slate-500 leading-relaxed">{p.desc}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* ── CTA ── */}
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
              Have questions about shipping with SwiftArc?
            </h2>
            <p className="text-white/75 max-w-xl mx-auto leading-relaxed">
              Our team is available 24/7 to help you choose the right shipping option or track an
              active package.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <Link to="/contact">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary-hover text-white font-bold px-8 h-12 rounded-xl shadow-lg shadow-primary/30 hover:-translate-y-0.5 hover:shadow-primary/50 hover:shadow-xl transition-all"
                >
                  Contact Our Team <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/tracking">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/25 text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 font-bold px-8 h-12 rounded-xl hover:-translate-y-0.5 transition-all"
                >
                  Track a Shipment
                </Button>
              </Link>
            </div>
          </FadeInSection>
        </div>
      </section>
    </div>
  );
}
