import { useEffect, useState } from "react";

function fmt(ms: number) {
  if (ms <= 0) return { d: 0, h: 0, m: 0, s: 0, past: true };
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / (1000 * 60)) % 60;
  const h = Math.floor(ms / (1000 * 60 * 60)) % 24;
  const d = Math.floor(ms / (1000 * 60 * 60 * 24));
  return { d, h, m, s, past: false };
}

export function EtaCountdown({ iso }: { iso: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  
  if (now === null) {
    return (
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-xl border border-border bg-card animate-pulse" />
        ))}
      </div>
    );
  }

  const target = new Date(iso).getTime();
  const t = fmt(target - now);

  if (t.past) {
    return (
      <div className="rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success">
        Delivered {new Date(iso).toLocaleString()}
      </div>
    );
  }

  const cells = [
    { v: t.d, l: "Days" },
    { v: t.h, l: "Hours" },
    { v: t.m, l: "Min" },
    { v: t.s, l: "Sec" },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {cells.map((c) => (
        <div key={c.l} className="rounded-xl border border-border bg-card px-3 py-3 text-center">
          <div className="font-display text-2xl font-bold tabular-nums text-navy-deep sm:text-3xl">
            {String(c.v).padStart(2, "0")}
          </div>
          <div className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">{c.l}</div>
        </div>
      ))}
    </div>
  );
}
