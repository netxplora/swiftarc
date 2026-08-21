import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-[40px] w-full rounded-[4px] border border-border bg-white px-3 py-2 text-[14px] text-secondary shadow-sm transition-colors file:border-0 file:bg-transparent file:text-[13px] file:font-semibold file:text-secondary placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-[#00A1E0]/20 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-secondary dark:border-white/20 dark:text-white dark:placeholder:text-white/50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };

