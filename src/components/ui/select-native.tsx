"use client";

import React, { SelectHTMLAttributes, forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectNativeProps extends SelectHTMLAttributes<HTMLSelectElement> {
  variant?: 'default' | 'wcc' | 'indigo' | 'amber' | 'emerald';
}

export const SelectNative = forwardRef<HTMLSelectElement, SelectNativeProps>(
  ({ className, children, variant = 'default', ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        <select
          ref={ref}
          className={cn(
            "appearance-none h-10 w-full rounded-xl px-3.5 pr-9 text-xs sm:text-sm font-medium transition-all duration-200 outline-none cursor-pointer",
            "bg-white dark:bg-[#072B3B]/80 text-[#072B3B] dark:text-slate-100 border shadow-2xs",
            "border-slate-200 dark:border-slate-800 hover:border-[#00A3C4] dark:hover:border-[#00A3C4]",
            "focus:ring-2 focus:ring-[#00A3C4]/20 focus:border-[#00A3C4] dark:focus:border-[#00A3C4]",
            (variant === 'wcc' || variant === 'indigo') && "border-[#00A3C4]/40 dark:border-[#00A3C4]/40 bg-[#00A3C4]/5 dark:bg-[#00A3C4]/10 text-[#072B3B] dark:text-[#00C4EB]",
            variant === 'emerald' && "border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/30 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200",
            variant === 'amber' && "border-amber-300 dark:border-amber-800/80 bg-amber-50/30 dark:bg-amber-950/30 text-amber-950 dark:text-amber-200",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none transition-transform" />
      </div>
    );
  }
);

SelectNative.displayName = 'SelectNative';
