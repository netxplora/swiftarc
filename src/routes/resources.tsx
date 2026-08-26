import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { PageHero } from "@/components/site/PageHero";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Code2, BookOpen, ArrowRight, Clock, Tag } from "lucide-react";
import { posts } from "@/lib/data/news";
import heroImg from "@/assets/hero-bg.jpg";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "Logistics Guides, News & Resources — SwiftArc" },
      {
        name: "description",
        content:
          "Read logistics guides, international shipping updates, customs documentation tips, and operational news from the SwiftArc team.",
      },
      { property: "og:title", content: "Resources & News — SwiftArc Logistics" },
      {
        property: "og:description",
        content: "Practical guides and operational insights for international shipping and freight logistics.",
      },
      { name: "keywords", content: "logistics guides, customs tips, freight news, supply chain articles, shipping resources" },
    ],
    links: [{ rel: "canonical", href: "/resources" }],
  }),
  component: ResourcesPage,
});

const resourceCategories = [
  {
    title: "Shipping Documentation",
    desc: "Guides on commercial invoices, packing lists, airway bills, customs declarations, and export compliance protocols.",
    icon: BookOpen,
    links: [
      "Commercial Invoice Preparation",
      "Customs Clearance Checklist",
      "Dangerous Goods Guidelines",
      "Cargo Insurance Coverage Terms",
      "Country Tariff Regulations",
    ],
  },
  {
    title: "Packaging & Cargo Standards",
    desc: "Best practices for protecting goods in transit, dimensional weight calculations, pallet wrapping, and fragile cargo packaging.",
    icon: FileText,
    links: [
      "Pallet Securing Standards",
      "Dimensional Weight Guide",
      "Temperature-Controlled Packaging",
      "Labeling & Barcoding Best Practices",
      "Fragile Goods Protection",
    ],
  },
  {
    title: "Developer & Integration Docs",
    desc: "Technical documentation for tracking webhooks, status APIs, and integrating freight event notifications.",
    icon: Code2,
    links: [
      "Tracking Event Webhooks",
      "Shipment Status API Reference",
      "Authentication & Access Keys",
      "Postman API Collection",
      "Error Handling & Rate Limits",
    ],
  },
];

function ResourcesPage() {
  return (
    <>
      {/* Hero Header */}
      <section className="relative overflow-hidden text-white" style={{ minHeight: "48vh" }}>
        <img src={heroImg} alt="SwiftArc logistics resources" className="absolute inset-0 h-full w-full object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, rgba(3,45,96,0.94) 0%, rgba(3,45,96,0.82) 60%, rgba(3,45,96,0.68) 100%)",
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(3,45,96,0.95) 0%, transparent 50%)" }}
          aria-hidden
        />

        <div className="relative mx-auto max-w-7xl px-4 pt-20 pb-20 sm:px-6 lg:px-8 flex flex-col justify-center" style={{ minHeight: "48vh" }}>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-xs font-semibold uppercase tracking-widest text-primary mb-3"
          >
            Guides & Knowledge
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-3xl font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            Logistics Resources & Articles
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 max-w-2xl text-base text-white/80 leading-relaxed"
          >
            Browse operational guides, customs tips, packaging standards, and technical documentation to streamline your shipments.
          </motion.p>
        </div>
      </section>

      {/* Featured Story */}
      {posts && posts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-16 pb-8 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-6">
            Featured Update
          </p>
          <div className="group grid gap-0 overflow-hidden rounded-3xl border border-border bg-card shadow-md transition-all duration-300 hover:shadow-xl lg:grid-cols-12">
            <div className="lg:col-span-7 aspect-[16/10] overflow-hidden lg:aspect-auto">
              <img
                src={posts[0].img}
                alt={posts[0].title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="lg:col-span-5 flex flex-col justify-center p-8 sm:p-10">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                  {posts[0].tag}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> {posts[0].readTime}
                </span>
              </div>
              <h2 className="mt-4 font-display text-2xl font-bold leading-snug text-foreground sm:text-3xl">
                {posts[0].title}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{posts[0].excerpt}</p>
              <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-4">
                <span>{posts[0].date}</span>
                <span>By {posts[0].author}</span>
              </div>
              <div className="mt-6">
                <Link to="/resources/$slug" params={{ slug: posts[0].slug }}>
                  <Button className="bg-primary text-white hover:bg-primary-hover font-semibold">
                    Read Full Article <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Article Grid */}
      {posts && posts.length > 1 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2">
            {posts.slice(1).map((post) => (
              <Card key={post.title} className="group overflow-hidden border-border bg-card hover:shadow-md transition-shadow">
                <div className="aspect-[16/9] overflow-hidden">
                  <img
                    src={post.img}
                    alt={post.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <CardContent className="p-6 sm:p-8">
                  <div className="flex items-center gap-3">
                    <span className="rounded-md bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                      {post.tag}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {post.readTime}
                    </span>
                  </div>
                  <h3 className="mt-3 font-display text-xl font-bold text-foreground">{post.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4">
                    <span className="text-xs text-muted-foreground">{post.date}</span>
                    <Link
                      to="/resources/$slug"
                      params={{ slug: post.slug }}
                      className="inline-flex items-center text-sm font-semibold text-primary hover:underline"
                    >
                      Read Article <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Resource Sections */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-t border-border">
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Guides & Reference</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Operational Documentation
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Clear, practical guides to assist with cargo preparation, customs documents, and technical integrations.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {resourceCategories.map((cat) => (
            <Card key={cat.title} className="border-border bg-card hover:border-primary/40 transition-all flex flex-col justify-between">
              <CardContent className="p-8">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary mb-5">
                  <cat.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-2xl font-bold text-foreground mb-3">{cat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">{cat.desc}</p>
                <ul className="space-y-2.5 border-t border-border/60 pt-5">
                  {cat.links.map((link) => (
                    <li key={link} className="flex items-center gap-2 text-xs font-medium text-foreground/80">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span>{link}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Box */}
      <section className="relative overflow-hidden py-16" style={{ backgroundColor: "#032D60" }}>
        <div className="relative mx-auto max-w-3xl px-4 text-center text-white">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Need specialized advice on your shipment?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-white/80 leading-relaxed">
            Our logistics support team is ready to guide you through dangerous goods regulations, temperature control, or international customs paperwork.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to="/contact">
              <Button size="lg" className="bg-primary text-white hover:bg-primary-hover font-bold shadow-lg px-8">
                Contact Our Support Team <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/support">
              <Button size="lg" variant="outline" className="border-white/30 text-white bg-white/10 hover:bg-white/20 font-semibold px-8">
                Visit Help Center
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
