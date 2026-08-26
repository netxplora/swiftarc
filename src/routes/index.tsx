import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, lazy, Suspense, useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import {
  ArrowRight,
  PackageSearch,
  Truck,
  Plane,
  Package,
  Ship,
  ShieldCheck,
  MapPin,
  Star,
  Smartphone,
  Warehouse,
  CheckCircle2,
  Phone,
  Mail,
  Globe,
  Clock,
  Headphones,
  Calculator,
  Shield,
  FileCheck2,
  Tag,
  Building2,
  Zap,
  TrendingUp,
  Award,
  BarChart3,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Counter } from "@/components/animated/Counter";
import { PartnerMarquee } from "@/components/home/PartnerMarquee";

const CoverageMap = lazy(() =>
  import("@/components/home/CoverageMap").then((m) => ({ default: m.CoverageMap })),
);

import heroBg1 from "@/assets/hero-bg1.jpg";
import heroArc from "@/assets/hero-bg.jpg";
import warehouse from "@/assets/warehouse.jpg";
import aircraft from "@/assets/aircraft.jpg";
import delivery from "@/assets/delivery.jpg";
import svcIntl from "@/assets/svc-intl.jpg";
import svcEcommerce from "@/assets/svc-ecommerce.jpg";
import svcWhiteglove from "@/assets/svc-whiteglove.jpg";
import appMockup from "@/assets/app-mockup-new.png";
import avatarMichael from "@/assets/customer-michael.jpg";
import avatarSarah from "@/assets/customer-sarah.jpg";
import avatarJames from "@/assets/customer-james.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SwiftArc — Global Logistics & Courier Delivery" },
      {
        name: "description",
        content:
          "Fast, secure and reliable shipping to over 220 countries. Track your parcel in real time from pickup to delivery.",
      },
      { property: "og:title", content: "SwiftArc — Global Logistics Solutions" },
      {
        property: "og:description",
        content: "International shipping, freight forwarding, and real-time tracking.",
      },
    ],
  }),
  component: Home,
});

/* ─── Stagger variants ─────────────────────────────────────────── */
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
// Using cubic-bezier tuple so TypeScript Easing type is satisfied
const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
};
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
};

/* ─── Home ─────────────────────────────────────────────────────── */
function Home() {
  return (
    <div className="bg-background text-foreground overflow-x-hidden">
      <Hero />
      <TrustStrip />
      <ServicesOverview />
      <WhyChooseUs />
      <ImpactSection />
      <HowItWorks />
      <CoverageSection />
      <Testimonials />
      <CtaBanner />
      <PartnerMarquee />
      <FAQ />
      <AppPromo />
    </div>
  );
}

/* ─── Hero ──────────────────────────────────────────────────────── */
function Hero() {
  const navigate = useNavigate();
  const [tn, setTn] = useState("");
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section
      ref={heroRef}
      className="relative min-h-[100svh] flex flex-col justify-end overflow-hidden"
    >
      {/* ── Full-bleed parallax background photo ── */}
      <motion.div className="absolute inset-0 z-0" style={{ y: bgY }}>
        <img
          src={heroBg1}
          alt=""
          aria-hidden
          className="w-full h-full object-cover object-center"
        />
      </motion.div>

      {/* ── Gradient overlays for legibility ── */}
      {/* Strong bottom-up scrim so copy is always readable */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-[#032D60] via-[#032D60]/60 to-[#032D60]/10 pointer-events-none" />
      {/* Left-side fade on large screens to deepen copy area */}
      <div className="absolute inset-0 z-[1] hidden lg:block bg-gradient-to-r from-[#032D60]/75 via-[#032D60]/15 to-transparent pointer-events-none" />
      {/* Warm orange glow at the very bottom */}
      <div className="absolute bottom-0 inset-x-0 h-40 z-[1] bg-gradient-to-t from-primary/15 to-transparent pointer-events-none" />

      {/* ── Floating stat pills — sm+ only (hidden on mobile to avoid overlap) ── */}
      <motion.div
        className="absolute top-[5.5rem] right-4 sm:right-8 lg:right-14 z-10 hidden sm:flex flex-col gap-2.5"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.65, delay: 1.0 }}
      >
        <div className="flex items-center gap-2.5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 px-3 py-2 shadow-xl">
          <div className="h-7 w-7 rounded-lg bg-primary/80 grid place-items-center shrink-0">
            <Globe className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <div className="font-display text-[13px] font-bold text-white leading-tight">
              220+ Countries
            </div>
            <div className="text-[10px] text-white/55 leading-tight">Global Network</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 px-3 py-2 shadow-xl">
          <div className="h-7 w-7 rounded-lg bg-emerald-500/80 grid place-items-center shrink-0">
            <TrendingUp className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <div className="font-display text-[13px] font-bold text-white leading-tight">
              99.7% On-Time
            </div>
            <div className="text-[10px] text-white/55 leading-tight">Delivery Rate</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15 px-3 py-2 shadow-xl">
          <div className="h-7 w-7 rounded-lg bg-sky-500/80 grid place-items-center shrink-0">
            <ShieldCheck className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <div className="font-display text-[13px] font-bold text-white leading-tight">
              100% Insured
            </div>
            <div className="text-[10px] text-white/55 leading-tight">Every Shipment</div>
          </div>
        </div>
      </motion.div>

      {/* ── Copy + tracking widget (bottom-anchored) ── */}
      <motion.div
        className="relative z-10 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 pb-10 sm:pb-14 lg:pb-20 pt-24 sm:pt-36"
        style={{ opacity: textOpacity }}
      >
        {/* Copy block */}
        <motion.div
          className="max-w-2xl space-y-5"
          initial="hidden"
          animate="show"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants}>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white/85 shadow-sm">
              <Globe className="h-3 w-3 animate-spin" style={{ animationDuration: "8s" }} />
              Ship to Any Country · Deliver to Any Location
            </span>
          </motion.div>

          {/* Mobile-only horizontal trust badges (replace floating pills) */}
          <motion.div
            variants={itemVariants}
            className="flex sm:hidden flex-wrap items-center gap-3 pb-1"
          >
            {[
              { icon: Globe, label: "220+ Countries", color: "bg-primary/80" },
              { icon: TrendingUp, label: "99.7% On-Time", color: "bg-emerald-500/80" },
              { icon: ShieldCheck, label: "100% Insured", color: "bg-sky-500/80" },
            ].map(({ icon: Icon, label, color }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 backdrop-blur-sm px-2.5 py-1"
              >
                <div className={`h-4 w-4 rounded-full ${color} grid place-items-center shrink-0`}>
                  <Icon className="h-2.5 w-2.5 text-white" />
                </div>
                <span className="text-[10px] font-bold text-white/80">{label}</span>
              </div>
            ))}
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="font-display text-[2rem] sm:text-5xl lg:text-[3.75rem] font-extrabold tracking-tight text-white leading-[1.1]"
          >
            We Ship What Matters{" "}
            <span className="relative inline-block">
              <span className="text-primary">Anywhere</span>
              <motion.span
                className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-primary/70"
                initial={{ scaleX: 0, originX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.7, delay: 0.95, ease: "easeOut" }}
              />
            </span>{" "}
            in the World.
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-base sm:text-lg text-white/70 leading-relaxed max-w-xl"
          >
            Fast, secure and reliable shipping to over 220 countries. Real-time tracking, insured
            handling, and dedicated support at every step.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-4 pt-1">
            <Link to="/shipping">
              <Button
                size="lg"
                className="group bg-primary text-white hover:bg-primary-hover font-bold px-8 h-12 rounded-xl shadow-lg shadow-primary/30 text-[15px] transition-all duration-300 hover:shadow-primary/50 hover:shadow-xl hover:-translate-y-0.5"
              >
                Ship Now
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/rates">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/25 text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 hover:border-white/40 font-bold px-7 h-12 rounded-xl text-[15px] transition-all duration-300"
              >
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Rates
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* ── Tracking widget ── */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.65 }}
          className="mt-8 sm:mt-10"
        >
          <div className="relative rounded-2xl border border-white/15 bg-white/8 backdrop-blur-xl p-4 sm:p-5 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/10 via-transparent to-sky-500/5 pointer-events-none" />

            <div className="relative flex items-center gap-3 shrink-0">
              <div className="h-11 w-11 rounded-xl bg-white/12 border border-white/20 text-white grid place-items-center shadow-md">
                <PackageSearch className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-white leading-tight">
                  Track Your Parcel
                </h3>
                <p className="text-[11px] text-white/55">Enter your tracking number below.</p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (tn.trim())
                  navigate({ to: "/tracking/$trackingId", params: { trackingId: tn.trim() } });
              }}
              className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full"
            >
              <input
                value={tn}
                onChange={(e) => setTn(e.target.value)}
                placeholder="e.g. SA-7241-9032-11"
                className="w-full h-11 rounded-xl border border-white/20 bg-white/12 backdrop-blur-sm px-4 text-sm font-medium text-white outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-white/35"
              />
              <Button
                type="submit"
                className="h-11 shrink-0 bg-primary hover:bg-primary-hover text-white font-bold px-6 rounded-xl shadow-md transition-all text-sm hover:-translate-y-0.5"
              >
                Track Now <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </form>
          </div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          className="mt-8 flex justify-start"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
        >
          <motion.div
            animate={{ y: [0, 7, 0] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
            className="flex flex-col items-center gap-1 text-white/35"
          >
            <span className="text-[9px] font-bold uppercase tracking-[0.18em]">Scroll</span>
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ─── Trust Strip ───────────────────────────────────────────────── */
function TrustStrip() {
  const stats = [
    { value: 220, suffix: "+", label: "Countries Served", icon: Globe, color: "text-primary" },
    { value: 50000, suffix: "+", label: "Monthly Parcels", icon: Package, color: "text-sky-600" },
    { value: 99.7, suffix: "%", label: "On-Time Delivery", icon: Clock, color: "text-emerald-600" },
    {
      value: 15000000,
      suffix: "+",
      label: "Total Deliveries",
      icon: TrendingUp,
      color: "text-amber-600",
    },
  ];

  return (
    <section className="relative z-10 -mt-px bg-[#032D60] text-white overflow-hidden">
      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#EA580C 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {stats.map(({ value, suffix, label, icon: Icon, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="flex justify-center mb-1">
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div className={`font-display text-2xl sm:text-3xl font-extrabold ${color}`}>
                <Counter to={value} duration={2} />
                {suffix}
              </div>
              <div className="text-xs text-white/60 font-semibold uppercase tracking-wider mt-1">
                {label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Services Overview ─────────────────────────────────────────── */
function ServicesOverview() {
  const services = [
    {
      title: "Air Freight",
      desc: "Fast, time-sensitive air cargo to 190+ destinations worldwide.",
      image: aircraft,
      icon: Plane,
      iconBg: "bg-sky-500/20 text-sky-600",
      href: "/shipping",
      accent: "from-sky-500/20",
    },
    {
      title: "Sea Freight",
      desc: "Cost-effective FCL & LCL ocean freight across all major global routes.",
      image: svcIntl,
      icon: Ship,
      iconBg: "bg-blue-500/20 text-blue-600",
      href: "/shipping",
      accent: "from-blue-500/20",
    },
    {
      title: "Road Freight",
      desc: "Reliable overland transport and trucking solutions for local and cross-border deliveries.",
      image: delivery,
      icon: Truck,
      iconBg: "bg-primary/20 text-primary",
      href: "/shipping",
      accent: "from-orange-500/20",
    },
    {
      title: "Parcel Services",
      desc: "Secure parcel shipping for documents, packages, and retail goods.",
      image: svcEcommerce,
      icon: Package,
      iconBg: "bg-purple-500/20 text-purple-600",
      href: "/shipping",
      accent: "from-purple-500/20",
    },
    {
      title: "Customs Clearance",
      desc: "Expert customs handling to keep shipments moving without delays.",
      image: svcWhiteglove,
      icon: FileCheck2,
      iconBg: "bg-amber-500/20 text-amber-600",
      href: "/customs",
      accent: "from-amber-500/20",
    },
    {
      title: "Warehousing",
      desc: "Secure climate-controlled storage with pick-and-pack fulfillment.",
      image: warehouse,
      icon: Warehouse,
      iconBg: "bg-emerald-500/20 text-emerald-600",
      href: "/shipping",
      accent: "from-emerald-500/20",
    },
  ];

  return (
    <section className="py-24 sm:py-28 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary/[0.03] blur-[140px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center mb-16">
          <motion.div
            className="lg:col-span-5"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={containerVariants}
          >
            <motion.div variants={itemVariants}>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-primary mb-4">
                <Package className="h-3 w-3" /> OUR SERVICES
              </span>
            </motion.div>
            <motion.h2
              variants={itemVariants}
              className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#032D60] leading-tight"
            >
              Shipping Solutions <span className="text-primary">Built Around You</span>
            </motion.h2>
            <motion.div
              variants={itemVariants}
              className="w-14 h-1 bg-primary rounded-full mt-4 mb-5"
            />
            <motion.p variants={itemVariants} className="text-base text-slate-600 leading-relaxed">
              From air and sea freight to door-to-door delivery, we provide end-to-end shipping
              solutions tailored to your business and personal needs.
            </motion.p>
            <motion.div variants={itemVariants} className="mt-6">
              <Link to="/shipping">
                <Button className="group bg-[#032D60] hover:bg-[#032D60]/90 text-white font-bold px-6 h-12 rounded-xl shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg">
                  Explore All Services
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative rounded-3xl overflow-hidden border border-border shadow-2xl"
            >
              <img
                src={heroArc}
                alt="SwiftArc Global Logistics"
                className="w-full h-64 sm:h-72 object-cover"
              />
              {/* Glassmorphism stats overlay */}
              <div className="absolute top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-6 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/70 shadow-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                {[
                  { v: "220+", l: "Countries" },
                  { v: "50K+", l: "Delivered" },
                  { v: "99.7%", l: "On-Time" },
                  { v: "100%", l: "Secure" },
                ].map(({ v, l }) => (
                  <div key={l}>
                    <div className="text-primary font-display text-2xl font-bold">{v}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {l}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Service cards grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.55, delay: i * 0.09 }}
            >
              <Link to={s.href} className="group block h-full">
                <div className="h-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md transition-all duration-400 hover:shadow-xl hover:-translate-y-2 hover:border-primary/20 flex flex-col">
                  {/* Image */}
                  <div
                    className={`relative h-48 w-full overflow-hidden bg-gradient-to-br ${s.accent} to-slate-50`}
                  >
                    <img
                      src={s.image}
                      alt={s.title}
                      className="h-full w-full object-cover transition-transform duration-600 group-hover:scale-108"
                    />
                    {/* Glass label badge */}
                    <div className="absolute top-3 left-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${s.iconBg} bg-white/80 backdrop-blur-md shadow-sm border border-white/60`}
                      >
                        <s.icon className="h-3.5 w-3.5" />
                        {s.title}
                      </span>
                    </div>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-[#032D60]/0 group-hover:bg-[#032D60]/10 transition-colors duration-400" />
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="font-display text-xl font-bold text-[#032D60] leading-snug mb-2 group-hover:text-primary transition-colors duration-200">
                      {s.title}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed mb-6 flex-1">{s.desc}</p>
                    <div className="inline-flex items-center gap-1.5 text-sm font-bold text-primary">
                      Learn more{" "}
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1.5" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Why Choose Us ────────────────────────────────────────────── */
function WhyChooseUs() {
  const benefits = [
    {
      title: "Reliable & Secure",
      desc: "Verified security protocols and careful physical handling at every checkpoint.",
      icon: Shield,
      gradient: "from-blue-50 to-blue-100/50",
      iconBg: "bg-blue-500/15 text-blue-600",
    },
    {
      title: "On-Time Delivery",
      desc: "We prioritize punctuality across every route, ensuring timely arrival.",
      icon: Clock,
      gradient: "from-amber-50 to-amber-100/50",
      iconBg: "bg-amber-500/15 text-amber-600",
    },
    {
      title: "Global Network",
      desc: "Deliver to over 220 countries with our extensive international logistics hub network.",
      icon: Globe,
      gradient: "from-emerald-50 to-emerald-100/50",
      iconBg: "bg-emerald-500/15 text-emerald-600",
    },
    {
      title: "Real-time Tracking",
      desc: "Follow every milestone with live GPS status updates and instant notifications.",
      icon: MapPin,
      gradient: "from-purple-50 to-purple-100/50",
      iconBg: "bg-purple-500/15 text-purple-600",
    },
    {
      title: "24/7 Support",
      desc: "Our dedicated operations team is always available to assist you anytime.",
      icon: Headphones,
      gradient: "from-orange-50 to-orange-100/50",
      iconBg: "bg-primary/15 text-primary",
    },
    {
      title: "Competitive Pricing",
      desc: "Transparent rates, no hidden fees, and clear volume discounts.",
      icon: Tag,
      gradient: "from-cyan-50 to-cyan-100/50",
      iconBg: "bg-cyan-500/15 text-cyan-600",
    },
  ];

  return (
    <section className="py-24 sm:py-28 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-sky-400/[0.04] blur-[120px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-12 lg:items-center">
          {/* Left */}
          <div className="lg:col-span-6">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              variants={containerVariants}
              className="space-y-4"
            >
              <motion.div variants={itemVariants}>
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-primary">
                  <Star className="h-3 w-3" /> WHY CHOOSE US
                </span>
              </motion.div>
              <motion.h2
                variants={itemVariants}
                className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#032D60] leading-tight"
              >
                Your Trusted Shipping Partner <span className="text-primary">Worldwide</span>
              </motion.h2>
              <motion.div variants={itemVariants} className="w-14 h-1 bg-primary rounded-full" />
              <motion.p
                variants={itemVariants}
                className="text-base text-slate-600 leading-relaxed max-w-xl"
              >
                At SwiftArc, we combine technology, reliability, and physical branch networks to
                deliver a shipping experience that is fast, secure, and hassle-free.
              </motion.p>
            </motion.div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {benefits.map((b, i) => (
                <motion.div
                  key={b.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.08 }}
                  whileHover={{ y: -3, scale: 1.01 }}
                  className={`rounded-2xl border border-slate-100 bg-gradient-to-br ${b.gradient} p-5 shadow-sm hover:shadow-md transition-all duration-300 cursor-default`}
                >
                  <div className={`h-10 w-10 rounded-xl grid place-items-center mb-3 ${b.iconBg}`}>
                    <b.icon className="h-5 w-5" />
                  </div>
                  <h4 className="font-display text-sm font-bold text-[#032D60] mb-1">{b.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{b.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right — delivery photo with glass stats */}
          <div className="lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative overflow-hidden rounded-3xl border border-slate-100 shadow-2xl"
            >
              <img
                src={delivery}
                alt="SwiftArc Courier Delivery"
                className="w-full h-[520px] object-cover"
              />
              {/* Bottom glassmorphism stats bar */}
              <div className="absolute bottom-0 inset-x-0 bg-white/20 backdrop-blur-xl border-t border-white/30 p-4 sm:p-5 grid grid-cols-4 gap-3 text-center">
                {[
                  { v: "220+", l: "Countries", c: "text-primary" },
                  { v: "50K+", l: "Monthly", c: "text-white" },
                  { v: "99.7%", l: "On-Time", c: "text-white" },
                  { v: "100%", l: "Safe", c: "text-primary" },
                ].map(({ v, l, c }) => (
                  <div key={l}>
                    <div className={`font-display text-lg font-bold ${c}`}>{v}</div>
                    <div className="text-[10px] text-white/80 font-semibold">{l}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Impact Section ───────────────────────────────────────────── */
function ImpactSection() {
  return (
    <section className="py-20 bg-white relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7 }}
          className="relative rounded-3xl bg-[#032D60] text-white overflow-hidden shadow-2xl"
        >
          {/* Animated dot grid */}
          <div
            className="absolute inset-0 opacity-[0.08] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#EA580C 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
            aria-hidden
          />
          {/* Glowing orbs inside card */}
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-primary/20 blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-sky-500/15 blur-[80px] pointer-events-none" />

          <div className="relative grid gap-10 lg:grid-cols-12 lg:items-center p-8 sm:p-12 lg:p-16">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                <Award className="h-3.5 w-3.5" /> OUR IMPACT &amp; ACHIEVEMENTS
              </div>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight">
                Delivering Impact. <span className="text-primary">Building Connections.</span>
              </h2>
              <p className="text-base sm:text-lg text-white/75 leading-relaxed max-w-xl">
                At SwiftArc, every shipment represents trust, responsibility, and real-world impact.
                We measure our success by the connections we build across the globe.
              </p>

              <div className="grid grid-cols-3 gap-5 pt-5 border-t border-white/15">
                {[
                  { v: 15, suffix: "M+", l: "Parcels Delivered" },
                  { v: 99.4, suffix: "%", l: "Success Rating" },
                  { v: 220, suffix: "+", l: "Global Countries" },
                ].map(({ v, suffix, l }) => (
                  <div key={l}>
                    <div className="font-display text-3xl font-bold text-primary">
                      <Counter to={v} duration={2.2} />
                      {suffix}
                    </div>
                    <div className="text-xs text-white/60 mt-1 font-medium">{l}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl">
                <img
                  src={heroBg1}
                  alt="SwiftArc Global Freight Impact"
                  className="w-full h-72 sm:h-80 object-cover"
                />
                {/* Glass overlay on image */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#032D60]/30 via-transparent to-primary/10" />

                {/* Floating glass card on image */}
                <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-white/15 backdrop-blur-xl border border-white/20 p-3 flex items-center gap-3 shadow-lg">
                  <div className="h-9 w-9 rounded-lg bg-primary/80 grid place-items-center shrink-0">
                    <BarChart3 className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">
                      15M+ packages delivered in 2025
                    </div>
                    <div className="text-[10px] text-white/65">
                      across 220 countries and territories
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── How It Works ──────────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Visit Nearest Branch",
      desc: "Bring your package to any local branch or schedule a collection. Our agents assist with destination routing.",
      icon: MapPin,
      color: "bg-sky-500",
    },
    {
      step: "02",
      title: "Inspection & Safe Packing",
      desc: "Your shipment is securely weighed and packed per international carrier safety standards.",
      icon: ShieldCheck,
      color: "bg-primary",
    },
    {
      step: "03",
      title: "Live Real-Time Transit",
      desc: "Follow your shipment milestone by milestone with live GPS checkpoints and instant notifications.",
      icon: Zap,
      color: "bg-purple-500",
    },
    {
      step: "04",
      title: "Doorstep Delivery",
      desc: "Our verified local courier delivers directly to your recipient with digital proof-of-delivery.",
      icon: CheckCircle2,
      color: "bg-emerald-500",
    },
  ];

  return (
    <section className="py-24 sm:py-28 bg-gradient-to-b from-slate-50/80 to-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[400px] h-[400px] rounded-full bg-primary/[0.04] blur-[100px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-primary mb-4"
          >
            HOW IT WORKS
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-display text-3xl sm:text-4xl font-bold text-[#032D60]"
          >
            Simple 4-Step Shipping Workflow
          </motion.h2>
          <div className="w-14 h-1 bg-primary rounded-full mx-auto mt-4 mb-4" />
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-600 text-sm sm:text-base"
          >
            From initial drop-off to final doorstep delivery, every step is clear, transparent, and
            reliable.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              whileHover={{ y: -5 }}
              className="group relative rounded-2xl border border-slate-100 bg-white p-7 shadow-sm hover:shadow-xl transition-all duration-400 overflow-hidden"
            >
              {/* Step number background watermark */}
              <div className="absolute -right-3 -top-3 font-display text-8xl font-black text-slate-50 select-none pointer-events-none leading-none">
                {s.step}
              </div>

              {/* Hover accent line */}
              <div
                className={`absolute bottom-0 left-0 right-0 h-[3px] ${s.color} scale-x-0 group-hover:scale-x-100 transition-transform duration-400 origin-left rounded-b-2xl`}
              />

              <div
                className={`relative h-12 w-12 rounded-xl ${s.color} text-white grid place-items-center mb-5 shadow-md group-hover:scale-110 transition-transform duration-300`}
              >
                <s.icon className="h-5 w-5" />
              </div>
              <div className="relative text-xs font-bold text-primary uppercase tracking-widest mb-1">
                Step {s.step}
              </div>
              <h3 className="relative font-display text-lg font-bold text-[#032D60] mb-2">
                {s.title}
              </h3>
              <p className="relative text-xs sm:text-sm text-slate-500 leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link to="/shipping">
            <Button className="bg-primary hover:bg-primary-hover text-white font-bold px-8 h-12 rounded-xl shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all">
              Start Your Shipment <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Coverage Section ──────────────────────────────────────────── */
function CoverageSection() {
  return (
    <section className="py-24 sm:py-28 bg-white relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-[1fr_1.4fr] lg:items-center">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={containerVariants}
            className="space-y-5"
          >
            <motion.span
              variants={itemVariants}
              className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-primary"
            >
              GLOBAL COVERAGE
            </motion.span>
            <motion.h2
              variants={itemVariants}
              className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#032D60]"
            >
              220+ Countries. <span className="text-primary">One Integrated Network.</span>
            </motion.h2>
            <motion.div variants={itemVariants} className="w-14 h-1 bg-primary rounded-full" />
            <motion.p
              variants={itemVariants}
              className="text-slate-600 leading-relaxed text-sm sm:text-base"
            >
              An interconnected web of ground fleets, regional air gateways, and verified last-mile
              partners — coordinated from pickup to proof of delivery.
            </motion.p>

            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 mt-4">
              {[
                { label: "Air Gateways", value: "72" },
                { label: "Ground Hubs", value: "1,240" },
                { label: "Regional Partners", value: "3,800" },
                { label: "GPS Checkpoints", value: "Real-time" },
              ].map(({ label, value }) => (
                <motion.div
                  key={label}
                  whileHover={{ y: -2, scale: 1.02 }}
                  className="rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm hover:shadow-md transition-all cursor-default"
                >
                  <div className="font-display text-2xl font-bold text-[#032D60]">{value}</div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                    {label}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div variants={itemVariants}>
              <Link to="/locations">
                <Button className="h-12 bg-primary text-white hover:bg-primary-hover font-bold px-7 rounded-xl shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all">
                  Find a Branch Location <MapPin className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          <div className="flex flex-col gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="overflow-hidden rounded-3xl border border-slate-100 shadow-2xl bg-card"
            >
              <Suspense
                fallback={
                  <div className="h-[400px] w-full animate-pulse rounded-3xl bg-slate-100" />
                }
              >
                <CoverageMap />
              </Suspense>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonials ──────────────────────────────────────────────── */
function Testimonials() {
  const items = [
    {
      quote:
        "SwiftArc consolidated our entire international supply chain. We went from guessing to knowing every shipment, every hub, every status update in real time.",
      name: "Michael R. Callahan",
      role: "Head of Operations, Northlight Retail",
      avatar: avatarMichael,
      location: "London, UK",
    },
    {
      quote:
        "The delay risk forecasting flagged a weather disruption six hours before our regional carrier was aware. We rerouted our freight and kept our delivery on schedule.",
      name: "Sarah D. Thompson",
      role: "Director of Fulfillment, Brightpath Commerce",
      avatar: avatarSarah,
      location: "New York, USA",
    },
    {
      quote:
        "Transparent pricing, dedicated account managers, and reliable physical branch support across Europe and Asia make SwiftArc our go-to carrier.",
      name: "James A. Rivera",
      role: "COO, Meridian Supply Group",
      avatar: avatarJames,
      location: "Singapore",
    },
  ];

  return (
    <section
      className="py-24 sm:py-28 relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #f8f9ff 0%, #ffffff 50%, #f0f4ff 100%)" }}
    >
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/[0.04] blur-[120px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-primary mb-4"
          >
            WHAT OUR CLIENTS SAY
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-display text-3xl sm:text-4xl font-bold text-[#032D60]"
          >
            Trusted by Businesses <span className="text-primary">Worldwide</span>
          </motion.h2>
          <div className="w-14 h-1 bg-primary rounded-full mx-auto mt-4 mb-4" />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {items.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: i * 0.12 }}
              whileHover={{ y: -5 }}
              className="rounded-2xl border border-white/80 bg-white/70 backdrop-blur-md p-6 sm:p-8 shadow-md hover:shadow-xl transition-all duration-400 flex flex-col justify-between"
            >
              <div>
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <Star key={k} className="h-4 w-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <blockquote className="text-sm leading-relaxed text-slate-700 italic mb-6">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
              </div>
              <figcaption className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="h-11 w-11 rounded-full object-cover border-2 border-primary/20 shrink-0"
                />
                <div>
                  <div className="text-sm font-bold text-[#032D60]">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.role}</div>
                  <div className="text-[11px] font-bold text-primary mt-0.5">{t.location}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA Banner ───────────────────────────────────────────────── */
function CtaBanner() {
  return (
    <section className="relative overflow-hidden py-24 bg-[#032D60] text-white">
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#EA580C 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
        aria-hidden
      />
      {/* Glowing orbs */}
      <div className="absolute -top-20 left-1/4 w-80 h-80 rounded-full bg-primary/25 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-20 right-1/4 w-80 h-80 rounded-full bg-sky-400/15 blur-[100px] pointer-events-none" />

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={containerVariants}
          className="space-y-6"
        >
          <motion.span
            variants={itemVariants}
            className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 backdrop-blur-sm px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-primary"
          >
            START SHIPPING TODAY
          </motion.span>

          <motion.h2
            variants={itemVariants}
            className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight"
          >
            Ready to Ship Your Next Package?
          </motion.h2>

          <motion.p
            variants={itemVariants}
            className="text-base sm:text-lg text-white/75 max-w-2xl mx-auto leading-relaxed"
          >
            Join thousands of businesses and individuals who trust SwiftArc for reliable,
            transparent logistics across 220+ countries.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center justify-center gap-4 pt-2"
          >
            <Link to="/shipping">
              <Button
                size="lg"
                className="group bg-primary text-white hover:bg-primary-hover font-bold px-8 h-13 rounded-xl shadow-lg shadow-primary/30 text-base hover:-translate-y-0.5 hover:shadow-primary/50 hover:shadow-xl transition-all"
              >
                Get a Free Quote{" "}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/tracking">
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/25 text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 font-bold px-8 h-13 rounded-xl text-base hover:-translate-y-0.5 transition-all"
              >
                Track a Shipment
              </Button>
            </Link>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center justify-center gap-8 text-xs sm:text-sm text-white/60 pt-4"
          >
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <span>+1 (800) 947-9382</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <span>support@swiftarc.com</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <span>220+ Global Gateways</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── FAQ ───────────────────────────────────────────────────────── */
function FAQ() {
  const items = [
    {
      q: "How does shipment tracking work?",
      a: "Once your shipment is booked and dropped off at a courier branch, every scan checkpoint is updated live. You and your recipient receive notifications at each milestone with digital proof-of-delivery.",
    },
    {
      q: "How are shipping weights and dimensions verified?",
      a: "All shipments are inspected and weighed on certified branch scales before dispatch to ensure precise rate calculation and regulatory compliance.",
    },
    {
      q: "What international customs documents are needed?",
      a: "For international shipments, a commercial invoice and customs declaration form are required. Our customs portal helps you generate and verify all paperwork before dispatch.",
    },
    {
      q: "What happens if a delivery exception occurs?",
      a: "Our network operations team actively monitors transit risks. If an exception or customs inspection arises, real-time alerts are issued and support coordinates swift resolution.",
    },
  ];

  return (
    <section className="py-24 sm:py-28 bg-white border-t border-slate-100">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-primary mb-4"
          >
            FAQ
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-display text-3xl sm:text-4xl font-bold text-[#032D60]"
          >
            Frequently Asked Questions
          </motion.h2>
          <div className="w-14 h-1 bg-primary rounded-full mx-auto mt-4 mb-4" />
          <p className="text-slate-500 text-sm">
            Have a question?{" "}
            <Link to="/contact" className="text-primary hover:underline font-bold">
              Contact our 24/7 support
            </Link>
            .
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-3">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <AccordionItem
                value={`item-${i}`}
                className="border border-slate-100 rounded-2xl px-2 bg-slate-50/80 shadow-sm hover:border-primary/20 transition-colors"
              >
                <AccordionTrigger className="text-[#032D60] font-bold px-4 py-4 hover:no-underline text-left text-sm sm:text-base hover:text-primary transition-colors">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-slate-600 px-4 pb-4 leading-relaxed text-sm">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

/* ─── App Promo ─────────────────────────────────────────────────── */
function AppPromo() {
  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative rounded-3xl bg-[#032D60] text-white overflow-hidden p-8 sm:p-12 lg:p-16 shadow-2xl"
        >
          {/* Dot grid */}
          <div
            className="absolute inset-0 opacity-[0.06] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#EA580C 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
            aria-hidden
          />
          {/* Glow orbs */}
          <div className="absolute top-0 right-1/3 w-64 h-64 rounded-full bg-primary/20 blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-sky-400/10 blur-[80px] pointer-events-none" />

          <div className="relative grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                <Smartphone className="h-3.5 w-3.5" /> MOBILE APP
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
                Manage Shipments on the Go
              </h2>
              <p className="text-base text-white/75 leading-relaxed max-w-xl">
                Get real-time notifications, scan barcodes, and track packages directly from your
                mobile phone with the SwiftArc mobile application.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Button className="group bg-white text-[#032D60] hover:bg-white/90 font-bold px-6 h-12 rounded-xl shadow-md hover:-translate-y-0.5 transition-all">
                  <Smartphone className="mr-2 h-4 w-4" /> Download for iOS
                </Button>
                <Button
                  variant="outline"
                  className="group border-white/25 text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 font-bold px-6 h-12 rounded-xl hover:-translate-y-0.5 transition-all"
                >
                  <Smartphone className="mr-2 h-4 w-4" /> Download for Android
                </Button>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <motion.img
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                src={appMockup}
                alt="SwiftArc Mobile Application"
                className="max-h-80 w-auto object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
