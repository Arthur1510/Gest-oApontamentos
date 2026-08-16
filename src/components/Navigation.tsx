"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ListFilter, FolderKanban, FileText, Presentation, LogOut, User as UserIcon, LogIn, Menu, X, ChevronRight, PanelLeftClose } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Estado do Menu Mobile (Drawer)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Estado do Menu Desktop (Recolher / Expandir no clique)
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const checkUser = async () => {
      if (isSupabaseConfigured()) {
        const { data: { session } } = await supabase.auth.getSession();
        setUserEmail(session?.user?.email || null);

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
          setUserEmail(session?.user?.email || null);
        });

        return () => {
          authListener.subscription.unsubscribe();
        };
      }
    };

    checkUser();
  }, [supabase.auth]);

  // Fechar menu mobile ao trocar de rota
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
      setUserEmail(null);
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Erro ao efetuar logout:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navLinks = [
    { href: '/projetos', label: 'Projetos', icon: FolderKanban },
    { href: '/', label: 'Apontamentos', icon: ListFilter },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/relatorios', label: 'Relatórios PDF', icon: FileText },
    { href: '/apresentacao', label: 'Resumo', icon: Presentation },
  ];

  const isLoginPage = pathname === '/login';
  const isPresentationPage = pathname === '/apresentacao';

  if (isLoginPage || isPresentationPage) return null;

  return (
    <>
      {/* 1. BARRA SUPERIOR MOBILE (Apenas em telas de celular < md) */}
      <header className="md:hidden sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Botão Hambúrguer Sólido no Mobile */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
            title="Abrir menu lateral"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/" className="font-bold text-lg text-slate-900 dark:text-slate-50">
            GestãoBIM
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      {/* 2. MENU LATERAL DESKTOP COM FUNÇÃO DE CLIQUE PARA OCULTAR / EXPANDIR */}
      <aside
        className={cn(
          "hidden md:flex flex-col h-screen sticky top-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 justify-between p-4 z-40 shrink-0 select-none transition-all duration-300",
          isDesktopCollapsed ? "w-20 items-center" : "w-64"
        )}
      >
        <div className="space-y-6 w-full">
          {/* Header do Menu Lateral Desktop com Botão de Esconder/Expandir no Clique */}
          <div className={cn("flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4", isDesktopCollapsed && "justify-center")}>
            <div className="flex items-center gap-3 overflow-hidden">
              {/* Botão Hambúrguer Sólido Clicável (Alterna entre Expandido e Recolhido) */}
              <button
                type="button"
                onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
                className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0"
                title={isDesktopCollapsed ? "Expandir menu lateral" : "Ocultar / Recolher menu lateral"}
              >
                <Menu className="h-5 w-5" />
              </button>

              {!isDesktopCollapsed && (
                <Link href="/" className="font-bold text-xl text-slate-900 dark:text-slate-50 tracking-tight truncate">
                  GestãoBIM
                </Link>
              )}
            </div>

            {!isDesktopCollapsed && (
              <button
                type="button"
                onClick={() => setIsDesktopCollapsed(true)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                title="Esconder menu"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Links de Navegação Lateral */}
          <nav className="space-y-1.5 w-full">
            {!isDesktopCollapsed && (
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2 px-3 truncate">
                Seções Principais
              </span>
            )}
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={`desktop-side-${link.href}`}
                  href={link.href}
                  title={isDesktopCollapsed ? link.label : undefined}
                  className={cn(
                    "flex items-center rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 relative group",
                    isDesktopCollapsed ? "justify-center p-3" : "justify-between px-3.5 py-2.5",
                    isActive
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 font-bold border border-indigo-200/80 dark:border-indigo-800/80 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400")} />
                    {!isDesktopCollapsed && <span className="truncate">{link.label}</span>}
                  </div>
                  {!isDesktopCollapsed && isActive && <ChevronRight className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}

                  {/* Tooltip flutuante quando o menu estiver recolhido */}
                  {isDesktopCollapsed && (
                    <div className="absolute left-full ml-3 px-2.5 py-1 rounded-md bg-slate-900 text-white text-xs font-semibold whitespace-nowrap shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                      {link.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Rodapé do Menu Lateral (User & Theme & Logout) */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3 w-full">
          {!isDesktopCollapsed && userEmail && (
            <div className="flex items-center gap-2 text-xs font-semibold px-3 py-2.5 rounded-xl bg-slate-100 text-slate-800 dark:bg-slate-800/90 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 shadow-2xs truncate">
              <UserIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="truncate" title={userEmail}>{userEmail}</span>
            </div>
          )}

          <div className={cn("flex items-center justify-between gap-2", isDesktopCollapsed && "justify-center")}>
            {!isDesktopCollapsed && <span className="text-xs text-slate-500 font-medium pl-1">Tema da Tela</span>}
            <ThemeToggle />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            title={isDesktopCollapsed ? "Encerrar sessão" : undefined}
            className={cn(
              "w-full text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-950/40 gap-2 h-9",
              isDesktopCollapsed && "justify-center px-0"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!isDesktopCollapsed && <span>Encerrar Sessão</span>}
          </Button>
        </div>
      </aside>

      {/* 3. DRAWER MOBILE (SLIDE OVER APENAS QUANDO ABERTO NO CELULAR) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in-0 duration-200">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div className="relative w-4/5 max-w-xs bg-white dark:bg-slate-900 h-full border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shadow-2xl z-10">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md">
                    <Menu className="h-5 w-5" />
                  </div>
                  <span className="font-bold text-lg text-slate-900 dark:text-white">
                    GestãoBIM
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="h-8 w-8 text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <nav className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-3">
                  Seções do Sistema
                </span>
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;

                  return (
                    <Link
                      key={`mobile-drawer-${link.href}`}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all",
                        isActive
                          ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={cn("h-4 w-4", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400")} />
                        <span>{link.label}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              {userEmail && (
                <div className="flex items-center gap-2 text-xs font-semibold px-3 py-2.5 rounded-xl bg-slate-100 text-slate-800 dark:bg-slate-800/90 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 shadow-2xs truncate">
                  <UserIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="truncate">{userEmail}</span>
                </div>
              )}
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full text-xs font-semibold text-red-600 border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/40 gap-2 h-10"
              >
                <LogOut className="h-4 w-4" /> Encerrar Sessão
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
