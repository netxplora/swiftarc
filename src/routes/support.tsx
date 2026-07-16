import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { PhoneCall, Mail, MessageSquare, HelpCircle, Search, CheckCircle2 } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support — SwiftArc" },
      { name: "description", content: "Help center, FAQs, and 24/7 contact options for SwiftArc shipments and business accounts." },
      { property: "og:title", content: "Support — SwiftArc" },
      { property: "og:description", content: "We're here 24/7 to help move your shipments." },
      { property: "og:url", content: "/support" },
    ],
    links: [{ rel: "canonical", href: "/support" }],
  }),
  component: Support,
});

const faqs = [
  { cat: "Tracking", q: "How do I track a shipment?", a: "Enter your tracking number on the Tracking page. You'll see live status, AI ETA, and a live map." },
  { cat: "Tracking", q: "What if my package is late?", a: "Our AI ETA flags delays before they happen. You can enable notifications, request a reroute, or open a claim from the tracking page." },
  { cat: "Delivery", q: "Do you deliver to PO boxes?", a: "Yes — for Standard Ground service in most regions. Priority services require a physical address." },
  { cat: "Claims", q: "How do I file a claim?", a: "Use the Claim Center in your account dashboard, or contact support with your tracking number." },
  { cat: "Shipping", q: "Can I schedule a pickup?", a: "Yes — from the homepage Quick Actions, choose Pickup and pick a date and window." },
  { cat: "Shipping", q: "Is my package insured?", a: "All shipments include standard coverage. SwiftArc CarePlus is available for high-value goods." },
  { cat: "Account", q: "How do I get volume pricing?", a: "Open a business account and volume tiers apply automatically. Enterprise customers get custom pricing." },
  { cat: "Account", q: "How do I add teammates?", a: "In Settings → Team, invite by email and assign a role. SSO is available on Enterprise plans." },
];

const services = [
  { name: "Network — Air", status: "operational" as const },
  { name: "Network — Ground", status: "operational" as const },
  { name: "Tracking API", status: "operational" as const },
  { name: "Web dashboard", status: "operational" as const },
  { name: "HK gateway", status: "degraded" as const },
];

function Support() {
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () => faqs.filter((f) =>
      (f.q + " " + f.a + " " + f.cat).toLowerCase().includes(q.toLowerCase().trim()),
    ),
    [q],
  );

  return (
    <>
      <PageHero
        eyebrow="Support Center"
        title="We're here to keep you moving."
        subtitle="Get help with active shipments, claims, billing, and account management from our 24/7 global support team."
        imageSrc="/images/hero_support_1784188703374.png"
      >
        <form onSubmit={(e) => e.preventDefault()} className="flex max-w-lg gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-md bg-cream px-3 text-navy-deep">
            <Search className="h-4 w-4 text-navy-deep/60" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search the help center"
              className="h-12 border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
          </div>
        </form>
      </PageHero>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { Icon: MessageSquare, t: "Live chat", d: "Median response 42 seconds.", cta: "Open chat" },
            { Icon: PhoneCall, t: "Call us", d: "24/7 in 18 languages.", cta: "See numbers" },
            { Icon: Mail, t: "Email", d: "Reply within 4 hours, always.", cta: "support@swiftarc.example" },
          ].map((c, i) => (
            <motion.div
              key={c.t}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="group rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-amber/50 hover:shadow-md hover:-translate-y-1"
            >
              <c.Icon className="h-5 w-5 text-amber transition-transform duration-300 group-hover:scale-110" />
              <h3 className="mt-3 font-display text-lg">{c.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
              <Button asChild variant="link" className="mt-2 px-0 text-navy-deep group-hover:text-amber transition-colors">
                <Link to="/contact">{c.cta} →</Link>
              </Button>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="flex items-center gap-2 font-display text-3xl font-bold tracking-tight">
              <HelpCircle className="h-6 w-6 text-amber" /> Frequently asked
            </h2>
            {filtered.length === 0 ? (
              <p className="mt-6 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
                No answers found. Try different keywords or <Link to="/contact" className="text-navy-deep underline">contact support</Link>.
              </p>
            ) : (
              <Accordion type="single" collapsible className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
                {filtered.map((f, i) => (
                  <AccordionItem key={i} value={`f-${i}`} className="border-none px-6">
                    <AccordionTrigger className="text-left text-base font-semibold">
                      <span>
                        <span className="mr-2 inline-block rounded-full bg-secondary px-2 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{f.cat}</span>
                        {f.q}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>

          <aside className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg">Network status</h3>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Live</span>
            </div>
            <ul className="mt-4 divide-y divide-border">
              {services.map((s) => (
                <li key={s.name} className="flex items-center justify-between py-3">
                  <span className="text-sm">{s.name}</span>
                  {s.status === "operational" ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success">
                      <CheckCircle2 className="h-4 w-4" /> Operational
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-deep">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber" /> Degraded
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              Overall: mostly operational · updated {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}
