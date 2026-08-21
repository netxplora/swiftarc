import { motion } from "motion/react";

export function PageHero({
  eyebrow,
  title,
  subtitle,
  imageSrc,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  imageSrc?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-secondary text-white">
      {imageSrc && (
        <>
          <img
            src={imageSrc}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-60"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#032D60] via-[#032D60]/50 to-transparent"
            aria-hidden
          />
        </>
      )}
      <div className="absolute inset-0 arc-grid opacity-10" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-[12px] font-bold uppercase tracking-[0.05em] text-accent"
        >
          {eyebrow}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mt-3 max-w-3xl font-display text-[40px] font-bold leading-tight tracking-tight sm:text-[48px]"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="mt-4 max-w-2xl text-[16px] leading-relaxed text-white/80"
        >
          {subtitle}
        </motion.p>
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}

