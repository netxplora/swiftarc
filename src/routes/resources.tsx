import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { BookOpen, FileText, Code2, Newspaper, ArrowRight, Sparkles } from "lucide-react";
import { PageHero } from "@/components/site/PageHero";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "Resources — SwiftArc" },
      { name: "description", content: "Guides, API docs, whitepapers, and the SwiftArc newsroom." },
      { property: "og:title", content: "Resources — SwiftArc" },
      { property: "og:description", content: "Guides, docs, and stories from the arc." },
      { property: "og:url", content: "/resources" },
    ],
    links: [{ rel: "canonical", href: "/resources" }],
  }),
  component: Resources,
});

const sections = [
  { id: "guides", Icon: BookOpen, title: "Guides", items: ["Packing best practices", "Cross-border customs made simple", "Choosing the right service level"] },
  { id: "dev", Icon: Code2, title: "Developer", items: ["REST API reference", "Webhooks & event types", "SDKs (Node, Python, Go)"] },
  { id: "papers", Icon: FileText, title: "Whitepapers", items: ["State of Global Logistics 2026", "AI in cold-chain visibility", "Sustainability at scale"] },
  { id: "news", Icon: Newspaper, title: "Newsroom", items: ["Frankfurt gateway opens", "EU fleet electrification hits 80%", "AI ETAs land on freight lanes"] },
];

function Resources() {
  const [filter, setFilter] = useState<string>("all");
  const shown = filter === "all" ? sections : sections.filter((s) => s.id === filter);
  const [email, setEmail] = useState("");

  return (
    <>
      <PageHero
        eyebrow="Resources"
        title="Everything you need to ship smarter."
        subtitle="Guides, APIs, case studies, and customs documentation to help you optimize your logistics network."
        imageSrc="/images/hero_business_1784188675121.png"
      />

      <section className="mx-auto max-w-7xl px-4 pb-8 pt-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 rounded-2xl border border-amber/30 bg-amber/10 p-6 sm:p-10 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-navy-deep">
              <Sparkles className="h-3.5 w-3.5" /> Featured guide
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              State of Global Logistics 2026.
            </h2>
            <p className="mt-3 max-w-xl text-navy-deep/80">
              A 48-page report on capacity, AI, sustainability, and the routes reshaping global trade.
            </p>
          </div>
          <Button className="h-12 bg-navy-deep px-6 text-cream hover:bg-navy">
            Read the report <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-2">
          {[{ id: "all", label: "All" }, ...sections.map((s) => ({ id: s.id, label: s.title }))].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`h-9 rounded-full border px-4 text-sm font-medium transition-colors ${
                filter === f.id
                  ? "border-navy-deep bg-navy-deep text-cream"
                  : "border-border bg-card hover:bg-secondary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {shown.map((s) => (
            <Card key={s.title} className="border-border">
              <CardContent className="p-8">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber text-navy-deep">
                    <s.Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-2xl">{s.title}</h3>
                </div>
                <ul className="mt-6 divide-y divide-border">
                  {s.items.map((i) => (
                    <li key={i} className="group flex cursor-pointer items-center justify-between py-3 text-sm">
                      <span>{i}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-navy-deep text-cream">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber">Newsletter</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              The Arc — a weekly logistics briefing.
            </h2>
            <p className="mt-3 max-w-lg text-cream/70">
              Route economics, capacity data, and the tech behind global shipping. Four minutes, every Wednesday.
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!email) return;
              toast.success("Subscribed", { description: "Welcome aboard the Arc." });
              setEmail("");
            }}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="h-12 bg-cream text-navy-deep placeholder:text-navy-deep/50"
            />
            <Button className="h-12 bg-amber px-6 text-navy-deep hover:bg-amber-soft">Subscribe</Button>
          </form>
        </div>
      </section>
    </>
  );
}
