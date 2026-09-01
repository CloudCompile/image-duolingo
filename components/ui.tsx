import { motion } from "framer-motion";
import { clsx } from "clsx";
import { PropsWithChildren } from "react";

export const Card = ({ className, children }: PropsWithChildren<{ className?: string }>) => (
  <div className={clsx("rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-lg shadow-black/30 backdrop-blur", className)}>{children}</div>
);

export const SectionTitle = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="mb-4">
    <h2 className="text-xl font-semibold text-white">{title}</h2>
    {subtitle ? <p className="text-sm text-slate-400">{subtitle}</p> : null}
  </div>
);

export const ProgressBar = ({ value, max = 100, className }: { value: number; max?: number; className?: string }) => {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={clsx("h-3 w-full rounded-full bg-slate-800", className)}>
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.45 }}
      />
    </div>
  );
};

export const Pill = ({ children, tone = "default" }: PropsWithChildren<{ tone?: "default" | "success" | "danger" | "warning" }>) => {
  const style = {
    default: "bg-slate-800 text-slate-200",
    success: "bg-emerald-500/15 text-emerald-300",
    danger: "bg-rose-500/15 text-rose-300",
    warning: "bg-amber-500/15 text-amber-300",
  }[tone];

  return <span className={clsx("inline-flex items-center rounded-full px-2 py-1 text-xs", style)}>{children}</span>;
};
