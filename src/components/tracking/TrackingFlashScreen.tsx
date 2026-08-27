/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  PackageSearch,
  CheckCircle2,
  ShieldCheck,
  Radio,
  Clock,
  Navigation,
  Globe2,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";

interface TrackingFlashScreenProps {
  trackingCode?: string;
  isReady?: boolean;
  onFinish?: () => void;
  minDurationMs?: number;
  fullScreen?: boolean;
}

const SCAN_STEPS = [
  { id: 1, label: "Validating tracking code", icon: ShieldCheck },
  { id: 2, label: "Locating transit hub & route", icon: Globe2 },
  { id: 3, label: "Retrieving checkpoint timestamps", icon: Clock },
  { id: 4, label: "Synchronizing shipment details", icon: CheckCircle2 },
];

export function TrackingFlashScreen({
  trackingCode = "Shipment Query",
  isReady = true,
  onFinish,
  minDurationMs = 1400,
  fullScreen = true,
}: TrackingFlashScreenProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(15);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const stepInterval = minDurationMs / SCAN_STEPS.length;

    const intervalId = setInterval(() => {
      setCurrentStepIndex((prev) => {
        const next = prev + 1;
        if (next < SCAN_STEPS.length) {
          setProgress(Math.round(((next + 1) / SCAN_STEPS.length) * 90));
          return next;
        }
        return prev;
      });
    }, stepInterval);

    const finishTimeout = setTimeout(() => {
      setProgress(100);
      setCurrentStepIndex(SCAN_STEPS.length - 1);
      setTimeout(() => {
        setIsDone(true);
        if (onFinish) onFinish();
      }, 250);
    }, minDurationMs);

    return () => {
      clearInterval(intervalId);
      clearTimeout(finishTimeout);
    };
  }, [minDurationMs, onFinish]);

  return (
    <AnimatePresence>
      {!isDone && (
        <motion.div
          key="tracking-flash-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 0.98,
            filter: "blur(4px)",
            transition: { duration: 0.45, ease: "easeInOut" },
          }}
          className={`${
            fullScreen ? "fixed inset-0 z-50 min-h-screen" : "relative min-h-[550px] w-full"
          } flex flex-col items-center justify-center overflow-hidden bg-[#032D60] px-4 py-8 text-white select-none`}
        >
          {/* Ambient background glows */}
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-sky-500/15 blur-[110px] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(234,88,12,0.08)_0%,transparent_70%)] pointer-events-none" />

          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
              backgroundSize: "32px 32px",
            }}
          />

          {/* Concentric radar scan rings */}
          <div className="relative flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.35, 1.7], opacity: [0.35, 0.15, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
              className="absolute h-40 w-40 rounded-full border border-primary/40 pointer-events-none"
            />
            <motion.div
              animate={{ scale: [1, 1.4, 1.8], opacity: [0.25, 0.1, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: 0.8 }}
              className="absolute h-40 w-40 rounded-full border border-sky-400/30 pointer-events-none"
            />

            {/* Central Animated Badge Container */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative z-10 flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-3xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-2xl"
            >
              {/* Rotating conic accent border glow */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-[2px] rounded-3xl bg-gradient-to-r from-primary via-transparent to-sky-400 opacity-70 blur-[2px] -z-10"
              />

              {/* Central icon with pulse */}
              <motion.div
                animate={{ scale: [0.95, 1.05, 0.95] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className="flex items-center justify-center text-white"
              >
                <PackageSearch className="h-10 w-10 sm:h-12 sm:w-12 text-white drop-shadow-md" />
              </motion.div>

              {/* Status pulse beacon */}
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-primary border-2 border-[#032D60]" />
              </span>
            </motion.div>
          </div>

          {/* Branded Title and Information */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="mt-8 text-center max-w-md px-4"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-white/80 shadow-sm backdrop-blur-md mb-3">
              <Radio className="h-3 w-3 text-primary animate-pulse" />
              Live Shipment Tracking
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Locating Shipment
            </h2>

            {/* Tracking Code Chip */}
            <div className="mt-3 inline-flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-sm sm:text-base font-mono font-bold text-amber-300 shadow-inner backdrop-blur-md">
              <span className="text-white/60 font-sans text-xs uppercase tracking-wider font-semibold">
                Code:
              </span>
              <span className="tracking-wider">{trackingCode}</span>
            </div>
          </motion.div>

          {/* Scan Steps Progression Card */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="mt-6 w-full max-w-sm rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-lg shadow-xl"
          >
            <div className="space-y-2.5">
              {SCAN_STEPS.map((step, idx) => {
                const isPassed = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                const IconComponent = step.icon;

                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 rounded-lg px-2.5 py-1.5 transition-all duration-300 ${
                      isCurrent
                        ? "bg-white/10 border border-white/15 shadow-sm"
                        : isPassed
                          ? "opacity-85 text-white/90"
                          : "opacity-40 text-white/50"
                    }`}
                  >
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                        isPassed
                          ? "bg-emerald-500 text-white"
                          : isCurrent
                            ? "bg-primary text-white animate-pulse"
                            : "bg-white/10 text-white/60"
                      }`}
                    >
                      {isPassed ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <IconComponent className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <span className="text-xs font-medium tracking-normal flex-1 font-sans">
                      {step.label}
                    </span>
                    {isCurrent && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Glowing progress bar */}
            <div className="mt-4 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between text-[11px] font-semibold text-white/70 mb-1.5 font-sans">
                <span>Network Query</span>
                <span className="font-mono text-amber-300">{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10 p-[1px]">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary via-orange-500 to-amber-400 shadow-[0_0_12px_rgba(234,88,12,0.6)]"
                  initial={{ width: "10%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                />
              </div>
            </div>
          </motion.div>

          {/* SwiftArc Brand Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.65 }}
            transition={{ delay: 0.4 }}
            className="mt-8 flex items-center gap-2 text-xs text-white/70 font-sans"
          >
            <span>SwiftArc Global Logistics Service</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
