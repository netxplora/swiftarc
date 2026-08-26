import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Logo } from "@/components/brand/Logo";
import { Globe, Phone, Mail, MapPin, ArrowRight } from "lucide-react";

const columns: { title: string; links: { label: string; to: string }[] }[] = [
  {
    title: "Ship",
    links: [
      { label: "Create a shipment", to: "/shipping" },
      { label: "Rates & transit", to: "/rates" },
      { label: "Schedule pickup", to: "/pickup" },
      { label: "Packaging supplies", to: "/resources" },
    ],
  },
  {
    title: "Track",
    links: [
      { label: "Track a shipment", to: "/tracking" },
      { label: "Delivery alerts", to: "/tracking" },
      { label: "Customs calculator", to: "/customs" },
      { label: "Claim centre", to: "/support" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About SwiftArc", to: "/about" },
      { label: "Newsroom", to: "/resources" },
      { label: "Branch locations", to: "/locations" },
      { label: "Contact us", to: "/contact" },
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
      className="border-t border-slate-100 dark:border-slate-800 bg-[#f9fafb] dark:bg-card text-foreground"
    >
      {/* Top accent strip */}
      <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-sky-400" />

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {/* Main grid */}
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
          {/* Brand column */}
          <div>
            <Logo tone="auto" />
            <p className="mt-4 max-w-sm text-[14px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Global logistics and parcel delivery network operating across 220+ countries and
              territories, with real-time shipment tracking at every step.
            </p>

            {/* Contact info */}
            <div className="mt-6 space-y-2 text-[13px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                +1 (800) 947-9382
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                support@swiftarc.com
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
                220+ Countries served globally
              </div>
            </div>

            {/* Stats row */}
            <div className="mt-8 grid grid-cols-3 gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
              {[
                { value: "220+", label: "Countries" },
                { value: "15M+", label: "Deliveries" },
                { value: "99.4%", label: "On-time" },
              ].map(({ value, label }) => (
                <div key={label} className="text-center">
                  <div className="font-display text-xl font-extrabold text-primary">{value}</div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-400 mt-0.5">
                    {label}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-6">
              <Link to="/tracking">
                <button
                  type="button"
                  className="group inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-primary text-white text-[13px] font-bold hover:bg-primary/90 transition-all hover:-translate-y-px hover:shadow-md hover:shadow-primary/20"
                >
                  Track a Shipment
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </Link>
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#032D60] dark:text-white mb-4">
                  {col.title}
                </h3>
                <ul className="space-y-2.5 text-[14px] text-slate-500 dark:text-slate-400">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        to={l.to}
                        className="transition-colors hover:text-primary hover:translate-x-0.5 inline-block"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col gap-4 border-t border-slate-200 dark:border-slate-700 pt-6 text-[13px] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} SwiftArc Global Logistics. All rights reserved.</p>
          <div className="flex flex-wrap gap-5">
            {[
              { label: "Privacy", to: "/privacy" },
              { label: "Terms", to: "/terms" },
              { label: "Contact", to: "/contact" },
            ].map(({ label, to }) => (
              <Link key={label} to={to} className="hover:text-primary transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
