import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Logo } from "@/components/brand/Logo";

const columns: { title: string; links: { label: string; to: string }[] }[] = [
  {
    title: "Ship",
    links: [
      { label: "Create a shipment", to: "/shipping" },
      { label: "Rates & transit", to: "/rates" },
      { label: "Schedule pickup", to: "/shipping" },
      { label: "Packaging supplies", to: "/resources" },
    ],
  },
  {
    title: "Track",
    links: [
      { label: "Track a shipment", to: "/tracking" },
      { label: "Delivery alerts", to: "/tracking" },
      { label: "Signature options", to: "/support" },
      { label: "Claim center", to: "/support" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About SwiftArc", to: "/about" },
      { label: "Newsroom", to: "/resources" },
      { label: "Careers", to: "/about" },
      { label: "Sustainability", to: "/about" },
    ],
  },
  {
    title: "Business",
    links: [
      { label: "Business solutions", to: "/business" },
      { label: "Locations", to: "/locations" },
      { label: "Developer APIs", to: "/resources" },
      { label: "Contact sales", to: "/contact" },
    ],
  },
];

export function SiteFooter() {
  return (
    <motion.footer 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6 }}
      className="mt-24 bg-navy-deep text-cream"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Logo tone="light" />
            <p className="mt-4 max-w-sm text-sm text-cream/70">
              An engineered logistics network moving priority freight and parcels
              across 220+ countries and territories, with real-time visibility at
              every stop.
            </p>
            <div className="mt-6 grid max-w-sm grid-cols-3 gap-3 text-center text-xs uppercase tracking-widest text-cream/60">
              <div>
                <div className="font-display text-2xl text-amber">220+</div>
                Countries
              </div>
              <div>
                <div className="font-display text-2xl text-amber">15M</div>
                Daily parcels
              </div>
              <div>
                <div className="font-display text-2xl text-amber">99.4%</div>
                On-time
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-amber">
                  {col.title}
                </h3>
                <ul className="mt-4 space-y-2 text-sm text-cream/80">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link to={l.to} className="transition-colors hover:text-amber">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-cream/10 pt-6 text-xs text-cream/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} SwiftArc Global Logistics. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <Link to="/privacy" className="hover:text-amber">Privacy</Link>
            <Link to="/terms" className="hover:text-amber">Terms</Link>
            <Link to="/accessibility" className="hover:text-amber">Accessibility</Link>
            <Link to="/contact" className="hover:text-amber">Contact</Link>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
