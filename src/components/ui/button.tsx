import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[#072B3B] text-white hover:bg-[#0B384D] shadow-sm dark:bg-white dark:text-[#072B3B] dark:hover:bg-slate-100",
        destructive:
          "bg-rose-600 text-white hover:bg-rose-700 shadow-sm dark:bg-rose-900 dark:text-white dark:hover:bg-rose-800",
        outline:
          "border border-slate-200 bg-white hover:bg-slate-50 hover:text-[#072B3B] dark:border-slate-800 dark:bg-[#072B3B]/40 dark:hover:bg-[#072B3B] dark:hover:text-white",
        secondary:
          "bg-slate-100 text-[#072B3B] hover:bg-slate-200 dark:bg-[#0B384D] dark:text-slate-100 dark:hover:bg-[#0F4761]",
        ghost:
          "hover:bg-slate-100 hover:text-[#072B3B] dark:hover:bg-[#0B384D]/50 dark:hover:text-white",
        link: "text-[#00A3C4] underline-offset-4 hover:underline dark:text-[#00A3C4]",
        wcc: "bg-[#00A3C4] text-white hover:bg-[#008EA9] shadow-md shadow-[#00A3C4]/25 font-semibold",
        "wcc-gradient": "bg-gradient-to-r from-[#00A3C4] to-[#10B981] text-white hover:opacity-95 shadow-md shadow-[#00A3C4]/20 font-bold",
        indigo: "bg-[#00A3C4] text-white hover:bg-[#008EA9] shadow-md shadow-[#00A3C4]/25 dark:bg-[#00A3C4] dark:hover:bg-[#008EA9]",
        emerald: "bg-[#10B981] text-white hover:bg-[#059669] shadow-md shadow-[#10B981]/25 dark:bg-[#10B981] dark:hover:bg-[#059669]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-8 text-base",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
