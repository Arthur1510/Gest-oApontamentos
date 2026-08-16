"use client";

import React, { SelectHTMLAttributes, forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectNativeProps extends SelectHTMLAttributes<HTMLSelectElement> {
  variant?: 'default' | 'indigo' | 'amber';
}

export const SelectNative = forwardRef<HTMLSelectElement, SelectNativeProps>(
  ({ className, children, variant = 'default', ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        <select
          ref={ref}
          className={cn(
            "appearance-none h-10 w-full rounded-xl px-3.5 pr-9 text-xs sm:text-sm font-medium transition-all duration-200 outline-none cursor-pointer",
            "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border shadow-2xs",
            "border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600",
            "focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 dark:focus:border-indigo-500",
            variant === 'indigo' && "border-indigo-300 dark:border-indigo-800/80 bg-indigo-50/30 dark:bg-indigo-950/30 text-indigo-950 dark:text-indigo-200",
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
