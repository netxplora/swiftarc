import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHero } from "@/components/site/PageHero";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Code2, BookOpen, ArrowRight, Video, Newspaper } from "lucide-react";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "Resources & API — SwiftArc" },
      { name: "description", content: "Explore case studies, developer APIs, and logistics knowledge base." },
      { property: "og:title", content: "Resources — SwiftArc" },
    ],
  }),
  component: Resources,
});

function Resources() {
  const categories = [
    {
      title: "Developer API",
      desc: "Integrate SwiftArc's rating, shipping, and tracking capabilities directly into your WMS or storefront.",
      icon: Code2,
      links: ["API Documentation", "Webhooks", "Authentication", "Rate limits"],
    },
    {
      title: "Knowledge Base",
      desc: "Detailed guides on international shipping compliance, customs clearance, and cold-chain packaging.",
      icon: BookOpen,
      links: ["Customs & Duties", "Packaging Guidelines", "Dangerous Goods (Hazmat)", "Claims Process"],
    },
    {
      title: "Case Studies",
      desc: "See how global enterprises use the SwiftArc network to reduce transit times and lower costs.",
      icon: FileText,
      links: ["Automotive Just-in-Time", "Healthcare Cold Chain", "DTC E-commerce", "High-value Asset Transport"],
    },
  ];

  const recentArticles = [
    { type: "Video", icon: Video, title: "Optimizing your palletized freight for air transit", date: "Jul 12, 2026" },
    { type: "Article", icon: Newspaper, title: "Navigating the new EU customs framework", date: "Jun 28, 2026" },
    { type: "Guide", icon: BookOpen, title: "Best practices for temperature-controlled pharma", date: "Jun 15, 2026" },
  ];

  return (
    <>
      <PageHero
        eyebrow="Resources"
        title="Knowledge to scale your supply chain."
        subtitle="Developer documentation, logistics guides, and success stories from the SwiftArc network."
        imageSrc="/images/hero_business_1784188675121.png"
      />

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber">Explore</p>
            <h2 className="mt-2 max-w-2xl font-display text-4xl font-bold tracking-tight sm:text-5xl">Resource Centers</h2>
          </div>
        </div>
        
        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {categories.map((cat) => (
            <Card key={cat.title} className="flex flex-col border-border transition-colors hover:border-amber/50 hover:shadow-md">
              <CardContent className="p-8 flex-1">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-navy-deep text-amber">
                  <cat.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 font-display text-2xl font-bold">{cat.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground">{cat.desc}</p>
                
                <ul className="mt-8 space-y-3">
                  {cat.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="group flex items-center gap-2 text-sm font-medium text-navy-deep hover:text-amber">
                        <span className="h-1.5 w-1.5 rounded-full bg-border group-hover:bg-amber transition-colors" />
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <div className="border-t border-border p-4 bg-secondary/30">
                <a href="#" className="flex items-center justify-center gap-2 text-sm font-semibold text-navy-deep hover:text-amber">
                  Explore {cat.title} <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-navy-deep text-cream">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-amber">Latest</p>
              <h2 className="mt-2 font-display text-3xl font-bold">New & Noteworthy</h2>
            </div>
            <Link to="/contact" className="inline-flex h-10 items-center justify-center rounded-md bg-amber px-6 text-sm font-medium text-navy-deep hover:bg-amber-soft transition-colors">
              Subscribe to newsletter
            </Link>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {recentArticles.map((article) => (
              <div key={article.title} className="group cursor-pointer rounded-2xl border border-cream/10 bg-cream/5 p-6 transition-colors hover:bg-cream/10">
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-amber">
                  <article.icon className="h-4 w-4" />
                  {article.type}
                </div>
                <h3 className="mt-4 font-display text-xl leading-snug">{article.title}</h3>
                <p className="mt-4 text-sm text-cream/50">{article.date}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
