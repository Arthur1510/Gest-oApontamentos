"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, LayoutDashboard, ListFilter, FolderKanban, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navigation() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-1.5">
              GestãoBIM <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">Apontamentos</span>
            </span>
          </div>
        </Link>

        {/* Links de Navegação */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/projetos"
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors",
              pathname === "/projetos"
                ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50 font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-900"
            )}
          >
            <FolderKanban className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Projetos</span>
          </Link>

          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors",
              pathname === "/"
                ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50 font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-900"
            )}
          >
            <ListFilter className="h-4 w-4" />
            <span>Apontamentos</span>
          </Link>

          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors",
              pathname === "/dashboard"
                ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50 font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-900"
            )}
          >
            <LayoutDashboard className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/relatorios"
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors",
              pathname === "/relatorios"
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold border border-indigo-200/60 dark:border-indigo-800/60 shadow-2xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-900"
            )}
          >
            <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span>Relatórios PDF</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
