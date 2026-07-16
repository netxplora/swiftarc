const partners = [
  "Northlight", "Marché & Vine", "Toriha", "Halyard & Sons", "Loom & Warp",
  "Merlion Components", "North Sea Optics", "Studio Farina", "Terraline", "Kestrel Labs",
];

export function PartnerMarquee() {
  return (
    <section aria-label="Partners" className="border-y border-border bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Trusted by shipping teams at
        </p>
        <div className="relative mt-6 overflow-hidden">
          <div className="flex marquee whitespace-nowrap gap-14">
            {[...partners, ...partners].map((p, i) => (
              <span key={i} className="font-display text-2xl font-semibold tracking-tight text-muted-foreground/70">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
