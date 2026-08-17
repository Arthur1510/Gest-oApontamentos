import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#072B3B] text-white shadow dark:bg-white dark:text-[#072B3B]",
        secondary:
          "border-transparent bg-slate-100 text-[#072B3B] dark:bg-[#0B384D] dark:text-slate-100",
        destructive:
          "border-transparent bg-rose-600 text-white shadow dark:bg-rose-900 dark:text-white",
        outline: "text-[#072B3B] dark:text-slate-100 border-slate-200 dark:border-slate-800",
        
        // WCC Variants
        wcc: "border-transparent bg-[#00A3C4] text-white font-bold shadow-xs",
        cyan: "border-[#00A3C4]/40 bg-[#00A3C4]/15 text-[#008EA9] dark:bg-[#00A3C4]/20 dark:text-[#00C4EB] dark:border-[#00A3C4]/40",
        emerald: "border-[#10B981]/40 bg-[#10B981]/15 text-[#047857] dark:bg-[#10B981]/20 dark:text-[#34D399] dark:border-[#10B981]/40",
        gradient: "border-transparent bg-gradient-to-r from-[#00A3C4] to-[#10B981] text-white font-bold shadow-xs",

        // Custom domain status & priority badges
        aberto: "border-amber-500/40 bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700/50",
        resolvido: "border-[#10B981]/40 bg-emerald-50 text-[#047857] dark:bg-emerald-950/50 dark:text-[#34D399] dark:border-[#10B981]/50",
        
        alta: "border-rose-500/40 bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-700/50",
        media: "border-orange-500/40 bg-orange-50 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-700/50",
        baixa: "border-[#00A3C4]/40 bg-[#00A3C4]/10 text-[#008EA9] dark:bg-[#00A3C4]/20 dark:text-[#00C4EB] dark:border-[#00A3C4]/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
