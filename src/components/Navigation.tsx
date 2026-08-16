"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, LayoutDashboard, ListFilter, FolderKanban, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';

export function Navigation() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/projetos', label: 'Projetos', icon: FolderKanban },
    { href: '/', label: 'Apontamentos', icon: ListFilter },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/relatorios', label: 'Relatórios PDF', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-700 via-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform duration-200">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-1.5">
              GestãoBIM 
              <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80">
                PRO
              </span>
            </span>
          </div>
        </Link>

        {/* Links de Navegação + Toggle de Tema */}
        <div className="flex items-center gap-2 sm:gap-4">
          <nav className="flex items-center gap-1 sm:gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 relative",
                    isActive
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 font-semibold shadow-2xs border border-indigo-200/60 dark:border-indigo-800/60"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-900"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400")} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          {/* Toggle de Tema Claro/Escuro */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
