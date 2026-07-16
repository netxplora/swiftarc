import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "motion/react";

export function Counter({ to, duration = 1.6 }: { to: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [val, setVal] = useState(0);
  const isFloat = !Number.isInteger(to);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setVal(v),
    });
    return () => controls.stop();
  }, [inView, to, duration]);

  return <span ref={ref}>{isFloat ? val.toFixed(1) : Math.round(val).toLocaleString()}</span>;
}
