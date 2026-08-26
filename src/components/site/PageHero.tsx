import { motion } from "motion/react";
import { Globe } from "lucide-react";

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
    <section
      className="relative overflow-hidden pt-14 pb-16 sm:pt-16 sm:pb-20 border-b border-border/40"
      style={{ background: "linear-gradient(145deg, #f8faff 0%, #ffffff 55%, #f0f4ff 100%)" }}
    >
      {/* Animated dot grid */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#032D60 1.2px, transparent 1.2px)",
          backgroundSize: "24px 24px",
        }}
        aria-hidden
      />

      {/* Glow orbs */}
      <div className="absolute -top-20 right-0 w-96 h-96 rounded-full bg-primary/[0.07] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-sky-400/[0.05] blur-[90px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className={`${imageSrc ? "lg:col-span-7" : "lg:col-span-12"}`}>
            {/* Eyebrow badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 backdrop-blur-sm px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-primary mb-5 shadow-sm"
            >
              <Globe className="h-3 w-3" />
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              {eyebrow}
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#032D60] dark:text-white leading-[1.12]"
            >
              {title}
            </motion.h1>

            {/* Accent line */}
            <motion.div
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="w-14 h-1 bg-primary rounded-full mt-4 mb-5"
            />

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.15 }}
              className="max-w-2xl text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300"
            >
              {subtitle}
            </motion.p>

            {children && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="mt-8"
              >
                {children}
              </motion.div>
            )}
          </div>

          {imageSrc && (
            <motion.div
              initial={{ opacity: 0, x: 30, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.18 }}
              className="hidden lg:col-span-5 lg:block"
            >
              {/* Glass frame around image */}
              <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/30 backdrop-blur-md p-2 shadow-2xl shadow-[#032D60]/10">
                <img
                  src={imageSrc}
                  alt={title}
                  className="h-72 w-full rounded-2xl object-cover"
                />
                {/* Subtle gradient overlay */}
                <div className="absolute inset-2 rounded-2xl bg-gradient-to-tr from-primary/8 via-transparent to-transparent pointer-events-none" />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
