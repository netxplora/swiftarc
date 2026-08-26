import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex h-[24px] items-center rounded-[4px] border px-2 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-white",
        secondary: "border-border bg-muted text-foreground dark:bg-muted/80 dark:text-foreground",
        destructive: "border-error/30 bg-error/15 text-error dark:bg-error/25 dark:text-red-300",
        outline:
          "border-border bg-transparent text-foreground dark:border-white/20 dark:text-white",
        success:
          "border-success/30 bg-success/15 text-success dark:bg-success/25 dark:text-green-300",
        warning:
          "border-warning/30 bg-warning/15 text-warning dark:bg-warning/25 dark:text-amber-300",
        info: "border-accent/30 bg-accent/15 text-accent dark:bg-accent/25 dark:text-sky-300",
        purple: "border-purple-500/30 bg-purple-500/15 text-purple-600 dark:text-purple-300",
        amber: "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300",
        indigo: "border-indigo-500/30 bg-indigo-500/15 text-indigo-600 dark:text-indigo-300",
        cyan: "border-cyan-500/30 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
