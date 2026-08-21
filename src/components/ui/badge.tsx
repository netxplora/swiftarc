import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex h-[24px] items-center rounded-[4px] border px-2 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#00A1E0]",
  {
    variants: {
      variant: {
        default: "border-transparent bg-accent text-white",
        secondary: "border-transparent bg-border text-muted-foreground dark:bg-white/20 dark:text-white",
        destructive: "border-transparent bg-error/10 text-error dark:bg-error/25 dark:text-red-300",
        outline: "border-border bg-transparent text-secondary dark:border-white/20 dark:text-white",
        success: "border-transparent bg-success/10 text-success dark:bg-success/25 dark:text-green-300",
        warning: "border-transparent bg-primary/15 text-[#D97706] dark:bg-primary/25 dark:text-primary",
        info: "border-transparent bg-accent/10 text-accent dark:bg-accent/25 dark:text-sky-300",
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

