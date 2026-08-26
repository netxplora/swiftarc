import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { PhoneCall, Mail, HelpCircle, Search, CheckCircle2, ArrowRight, ShieldCheck, MapPin, Globe } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import heroImg from "@/assets/hero-bg.jpg";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Customer Support & FAQs — SwiftArc Logistics" },
      {
        name: "description",
        content:
          "Find answers to frequently asked questions about SwiftArc shipping, tracking, customs, package drop-off, and customer service.",
      },
      { property: "og:title", content: "Customer Support — SwiftArc Logistics" },
      {
        property: "og:description",
        content: "24/7 help center and answers for all your shipping and tracking inquiries.",
      },
      { name: "keywords", content: "logistics help center, shipment FAQ, track parcel, courier assistance, shipping support" },
    ],
    links: [{ rel: "canonical", href: "/support" }],
  }),
  component: SupportPage,
});

const faqs = [
  {
    cat: "Tracking",
    q: "How do I track my package?",
    a: "Enter your tracking ID (e.g., SA-7241-9032-11) into the search bar on our homepage or tracking page. You will see real-time scan events, transit status, and estimated delivery dates.",
  },
  {
    cat: "Tracking",
    q: "Why has my tracking status not updated recently?",
    a: "Tracking updates when a package is scanned at sorting hubs, customs checkpoints, or distribution centers. During long-haul flights or sea transit, status may remain unchanged for 24 to 48 hours until arriving at the next facility.",
  },
  {
    cat: "Shipping",
    q: "How do I create and send a shipment with SwiftArc?",
    a: "To ensure package compliance, accurate weighing, and direct physical verification, all shipments are processed at SwiftArc courier offices. Simply bring your package to your nearest office where an agent will weigh, label, and process your delivery.",
  },
  {
    cat: "Shipping",
    q: "What items are prohibited from shipping?",
    a: "Prohibited items include hazardous chemicals, explosives, illegal substances, unregistered firearms, and perishable goods without cold-chain booking. Contact support for specific regional restrictions.",
  },
  {
    cat: "Delivery",
    q: "What happens if I miss my scheduled delivery?",
    a: "Our local courier will make up to two additional delivery attempts or leave a notice with collection instructions at your nearest local service point.",
  },
  {
    cat: "Customs & Clearance",
    q: "Who handles international customs clearance?",
    a: "SwiftArc manages customs documentation and standard clearance on international routes. If duties or local taxes apply, our team or customs authority will notify you directly with payment details.",
  },
  {
    cat: "Insurance & Claims",
    q: "Is my shipment covered by insurance?",
    a: "All standard shipments include basic carrier liability protection. High-value cargo coverage is available upon request during shipment creation at our branch offices.",
  },
  {
    cat: "Account & Billing",
    q: "How do business shipping accounts work?",
    a: "Business accounts offer volume discounts, consolidated monthly invoicing, and priority support. You can register online or speak with an account manager at any office.",
  },
];

const serviceStatuses = [
  { name: "International Air Freight Network", status: "operational" },
  { name: "Ground Courier & Regional Fleets", status: "operational" },
  { name: "Real-Time Tracking System", status: "operational" },
  { name: "Customs Clearance Processing", status: "operational" },
  { name: "Customer Service Channels", status: "operational" },
];

function SupportPage() {
  const [q, setQ] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", "Tracking", "Shipping", "Delivery", "Customs & Clearance", "Insurance & Claims"];

  const filtered = useMemo(() => {
    return faqs.filter((f) => {
      const matchesSearch =
        !q.trim() ||
        (f.q + " " + f.a + " " + f.cat).toLowerCase().includes(q.toLowerCase().trim());
      const matchesCategory = activeCategory === "All" || f.cat === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [q, activeCategory]);

  return (
    <>
      {/* Premium Glassmorphic Hero */}
      <section
        className="relative overflow-hidden pt-12 pb-20 sm:pt-14 sm:pb-24 border-b border-slate-100"
        style={{ background: "linear-gradient(145deg, #f0f6ff 0%, #ffffff 55%, #f5f0ff 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(#032D60 1.2px, transparent 1.2px)", backgroundSize: "26px 26px" }}
          aria-hidden
        />
        <div className="absolute -top-20 right-0 w-[460px] h-[460px] rounded-full bg-primary/[0.06] blur-[130px] pointer-events-none" />
        <div className="absolute bottom-0 -left-16 w-[360px] h-[360px] rounded-full bg-sky-400/[0.06] blur-[110px] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7 space-y-6">
              <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 backdrop-blur-sm px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-primary shadow-sm">
                  <Globe className="h-3 w-3" />
                  Help & Knowledge Center
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.08 }}
                className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#032D60] leading-[1.1]"
              >
                How Can We{" "}
                <span className="relative">
                  <span className="text-primary">Assist You</span>
                  <motion.span className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-primary/40" initial={{ scaleX: 0, originX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.7, delay: 0.8 }} />
                </span>{" "}
                Today?
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed"
              >
                Find fast answers regarding tracking, office drop-offs, customs clearance, and delivery procedures across our global network.
              </motion.p>

              {/* Search Bar */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="relative max-w-xl"
              >
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search questions, tracking guides, customs..."
                  className="pl-12 h-12 bg-white/90 backdrop-blur-sm border-slate-200 focus:border-primary/40 focus:ring-1 focus:ring-primary/20 text-sm rounded-xl shadow-md"
                />
              </motion.div>
            </div>

            <div className="hidden lg:col-span-5 lg:block">
              <motion.div
                initial={{ opacity: 0, x: 30, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.75, delay: 0.2 }}
              >
                <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/25 backdrop-blur-md p-2 shadow-2xl shadow-[#032D60]/12">
                  <img src={heroImg} alt="SwiftArc Support Center" className="w-full h-72 sm:h-80 rounded-2xl object-cover" />
                  <div className="absolute inset-2 rounded-2xl bg-gradient-to-tr from-primary/8 via-transparent to-transparent pointer-events-none" />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Support Channels */}
      <section className="py-10 border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              { icon: PhoneCall, color: "bg-primary/10 text-primary", title: "Call Support", desc: "Speak directly with a representative 24/7.", link: <a href="tel:+18009479382" className="mt-4 inline-flex items-center text-sm font-semibold text-primary hover:underline">+1 (800) 947-9382 <ArrowRight className="ml-1 h-3.5 w-3.5" /></a> },
              { icon: Mail, color: "bg-sky-500/10 text-sky-600", title: "Email Inquiry", desc: "Send a message and get a reply in a few hours.", link: <a href="mailto:support@swiftarc.com" className="mt-4 inline-flex items-center text-sm font-semibold text-primary hover:underline">support@swiftarc.com <ArrowRight className="ml-1 h-3.5 w-3.5" /></a> },
              { icon: MapPin, color: "bg-emerald-500/10 text-emerald-600", title: "Visit an Office", desc: "Find your nearest physical branch for direct service.", link: <Link to="/locations" className="mt-4 inline-flex items-center text-sm font-semibold text-primary hover:underline">View Office Locations <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link> },
            ].map(({ icon: Icon, color, title, desc, link }) => (
              <div key={title} className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-primary/15 transition-all duration-300">
                <div className={`h-12 w-12 rounded-xl ${color} grid place-items-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-display font-bold text-[#032D60] text-lg">{title}</h3>
                <p className="text-sm text-slate-500 mt-1">{desc}</p>
                {link}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main FAQ + Status */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* FAQ Column */}
          <div className="lg:col-span-8">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Questions & Answers</p>
                <h2 className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">
                  Frequently Asked Questions
                </h2>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2 mb-8">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                    activeCategory === cat
                      ? "bg-primary text-white"
                      : "bg-secondary/40 text-foreground/80 hover:bg-secondary border border-border"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <Card className="border-border bg-card p-8 text-center">
                <HelpCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-display font-bold text-foreground">No matching questions found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Try searching with different terms or contact our support team directly.
                </p>
                <Link to="/contact" className="mt-4 inline-block">
                  <Button className="bg-primary text-white hover:bg-primary-hover">Contact Support</Button>
                </Link>
              </Card>
            ) : (
              <Accordion type="single" collapsible className="space-y-4">
                {filtered.map((item, idx) => (
                  <AccordionItem
                    key={idx}
                    value={`faq-${idx}`}
                    className="border border-border rounded-xl bg-card px-6 py-1 data-[state=open]:border-primary/40 transition-colors"
                  >
                    <AccordionTrigger className="text-left font-display font-bold text-base text-foreground hover:no-underline py-4">
                      <span>
                        <span className="mr-2.5 inline-block rounded-md bg-primary/10 px-2 py-0.5 align-middle text-[11px] font-semibold text-primary">
                          {item.cat}
                        </span>
                        {item.q}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed pt-1 pb-4">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>

          {/* Sidebar: System Status & Office Reminder */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <h3 className="font-display font-bold text-foreground text-base">Network Operational Status</h3>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    All Normal
                  </span>
                </div>
                <ul className="divide-y divide-border/60 mt-2">
                  {serviceStatuses.map((s, i) => (
                    <li key={i} className="py-3 flex items-center justify-between text-xs">
                      <span className="text-foreground/90 font-medium">{s.name}</span>
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Operational
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <div className="rounded-2xl p-6 text-white" style={{ backgroundColor: "#032D60" }}>
              <ShieldCheck className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-display font-bold text-lg">Need Further Assistance?</h3>
              <p className="mt-2 text-xs text-white/80 leading-relaxed">
                If you have a complex claim, customized freight requirement, or urgent package query, our team is ready to help.
              </p>
              <div className="mt-5">
                <Link to="/contact">
                  <Button className="w-full bg-primary text-white hover:bg-primary-hover font-semibold">
                    Submit a Ticket <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
