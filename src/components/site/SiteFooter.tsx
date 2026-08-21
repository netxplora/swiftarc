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
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
      className="mt-20 border-t border-border bg-muted text-secondary"
    >
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Logo tone="auto" />
            <p className="mt-4 max-w-sm text-[14px] text-muted-foreground leading-relaxed">
              Global logistics and parcel delivery network operating across 220+ countries and
              territories, with real-time shipment status tracking.
            </p>
            <div className="mt-6 grid max-w-sm grid-cols-3 gap-3 text-center text-[12px] uppercase tracking-wider text-muted-foreground">
              <div>
                <div className="font-display text-[24px] font-bold text-accent">220+</div>
                Countries
              </div>
              <div>
                <div className="font-display text-[24px] font-bold text-accent">15M</div>
                Daily parcels
              </div>
              <div>
                <div className="font-display text-[24px] font-bold text-accent">99.4%</div>
                On-time
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="text-[12px] font-bold uppercase tracking-[0.05em] text-secondary">
                  {col.title}
                </h3>
                <ul className="mt-4 space-y-2.5 text-[14px] text-muted-foreground">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link to={l.to} className="transition-colors hover:text-accent">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-6 text-[13px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} SwiftArc Global Logistics. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <Link to="/privacy" className="hover:text-accent transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-accent transition-colors">
              Terms
            </Link>
            <Link to="/accessibility" className="hover:text-accent transition-colors">
              Accessibility
            </Link>
            <Link to="/contact" className="hover:text-accent transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}

