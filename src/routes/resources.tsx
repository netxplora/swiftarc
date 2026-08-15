import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { PageHero } from "@/components/site/PageHero";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Code2, BookOpen, ArrowRight, Clock, Tag } from "lucide-react";
import { posts } from "@/lib/data/news";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "Newsroom & Resources — SwiftArc" },
      {
        name: "description",
        content:
          "Explore the latest news, product updates, sustainability reports, and logistics guides from the SwiftArc team.",
      },
      { property: "og:title", content: "Newsroom — SwiftArc" },
    ],
  }),
  component: Resources,
});

const resources = [
  {
    title: "Developer API",
    desc: "Integrate SwiftArc's rating, booking, label generation, tracking, and webhook capabilities directly into your WMS, OMS, or storefront. Full REST and GraphQL documentation with SDKs for Node.js, Python, Go, and Java.",
    icon: Code2,
    links: [
      "REST API Reference",
      "GraphQL API",
      "Webhook Events",
      "Authentication & Rate Limits",
      "Postman Collection",
    ],
  },
  {
    title: "Knowledge Base",
    desc: "Detailed operational guides on international shipping compliance, customs clearance procedures, dangerous goods handling, cold-chain packaging standards, and claims resolution.",
    icon: BookOpen,
    links: [
      "Customs & Duties Guide",
      "Packaging Standards",
      "Dangerous Goods (IATA DG)",
      "Claims & Insurance Process",
      "Country-Specific Restrictions",
    ],
  },
  {
    title: "Case Studies",
    desc: "See how global businesses use the SwiftArc network to reduce transit times, cut logistics costs, and improve customer delivery experience.",
    icon: FileText,
    links: [
      "Automotive Just-in-Time",
      "Healthcare Cold Chain",
      "DTC E-commerce Scale",
      "High-value Asset Transport",
      "Cross-border B2B Freight",
    ],
  },
];

function Resources() {
  return (
    <>
      <PageHero
        eyebrow="Newsroom & Resources"
        title="News, guides, and insights from SwiftArc."
        subtitle="Product updates, network expansion announcements, sustainability reports, and practical guides for logistics professionals."
        imageSrc="/images/hero_business_1784188675121.png"
      />

      {/* --- Featured Article --- */}
      <section className="mx-auto max-w-7xl px-4 pt-20 pb-12 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber mb-8">
          Latest Stories
        </p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="group grid gap-0 overflow-hidden rounded-3xl border border-border bg-card shadow-lg cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 lg:grid-cols-[1.4fr_1fr]"
        >
          <div className="aspect-[16/10] overflow-hidden lg:aspect-auto">
            <img
              src={posts[0].img}
              alt={posts[0].title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
          <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-12">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber">
                <Tag className="h-3 w-3" /> {posts[0].tag}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> {posts[0].readTime}
              </span>
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold leading-snug text-foreground sm:text-3xl">
              {posts[0].title}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{posts[0].excerpt}</p>
            <p className="mt-6 text-xs text-muted-foreground">
              {posts[0].date} · {posts[0].author}
            </p>
            <Link to="/resources/$slug" params={{ slug: posts[0].slug }}>
              <Button className="mt-6 w-fit bg-amber text-navy-deep hover:bg-amber-soft font-bold">
                Read full story <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* --- Article Grid --- */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2">
          {posts.slice(1).map((post, i) => (
            <motion.article
              key={post.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group overflow-hidden rounded-2xl border border-border bg-card cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src={post.img}
                  alt={post.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber">
                    <Tag className="h-2.5 w-2.5" /> {post.tag}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" /> {post.readTime}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-xl font-bold leading-snug text-foreground">
                  {post.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="mt-6 flex items-center justify-between text-sm">
                  <span className="text-xs text-muted-foreground">
                    {post.date} · {post.author}
                  </span>
                  <Link
                    to="/resources/$slug"
                    params={{ slug: post.slug }}
                    className="inline-flex items-center gap-1 font-semibold text-amber text-sm group-hover:text-amber-soft"
                  >
                    Read more{" "}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* --- Resource Centers --- */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber">Resources</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Documentation & Guides
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Everything you need to integrate SwiftArc into your tech stack, understand international
            shipping requirements, and learn from how other businesses use the network.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {resources.map((cat) => (
            <Card
              key={cat.title}
              className="flex flex-col border-border transition-colors hover:border-amber/50 hover:shadow-md"
            >
              <CardContent className="p-8 flex-1">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-navy-deep text-amber">
                  <cat.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 font-display text-2xl font-bold">{cat.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{cat.desc}</p>
                <ul className="mt-8 space-y-3">
                  {cat.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="group flex items-center gap-2 text-sm font-medium text-foreground hover:text-amber"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-border group-hover:bg-amber transition-colors shrink-0" />
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <div className="border-t border-border p-4 bg-secondary/30">
                <a
                  href="#"
                  className="flex items-center justify-center gap-2 text-sm font-semibold text-foreground hover:text-amber"
                >
                  Explore {cat.title} <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* --- Newsletter CTA --- */}
      <section className="bg-navy-deep text-cream">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-amber">
                Stay informed
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold">
                Get SwiftArc updates in your inbox.
              </h2>
              <p className="mt-3 max-w-lg text-cream/70 text-sm">
                Network announcements, product releases, and logistics industry insights. No
                marketing noise — just the updates that matter to shippers.
              </p>
            </div>
            <Link
              to="/contact"
              className="inline-flex h-11 items-center justify-center rounded-md bg-amber px-6 text-sm font-bold text-navy-deep hover:bg-amber-soft transition-colors shrink-0"
            >
              Subscribe to newsletter
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
