import { motion } from "motion/react";

export function PageHero({
  eyebrow, title, subtitle, imageSrc, children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  imageSrc?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-navy-deep text-cream dark:bg-navy-deep">
      {imageSrc && (
        <>
          <img src={imageSrc} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/80 via-navy-deep/40 to-transparent" aria-hidden />
        </>
      )}
      <div className="absolute inset-0 arc-grid opacity-20" aria-hidden />
      <div className="absolute inset-x-0 -top-40 h-96 bg-[radial-gradient(closest-side,_var(--color-amber)_0%,_transparent_70%)] opacity-15" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-xs font-semibold uppercase tracking-widest text-amber"
        >
          {eyebrow}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="mt-3 max-w-3xl font-display text-5xl font-bold tracking-tight sm:text-6xl"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-5 max-w-2xl text-lg text-cream/70"
        >
          {subtitle}
        </motion.p>
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}
