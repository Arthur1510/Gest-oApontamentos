"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Layers, LayoutDashboard, ListFilter, FolderKanban, FileText, LogOut, User as UserIcon, LogIn } from 'lucide-react';
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
  ];

  // Esconder links de navegação na tela de login para manter a tela limpa e focada
  const isLoginPage = pathname === '/login';

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

        {/* Links de Navegação */}
        {!isLoginPage && (
          <nav className="hidden md:flex items-center gap-1 sm:gap-1.5">
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
        )}

        {/* Ações do Usuário & Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Toggle de Tema Claro/Escuro */}
          <ThemeToggle />

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          {/* Botão de Logout ("Sair") ou Login com E-mail Responsivo */}
          {!isLoginPage ? (
            <div className="flex items-center gap-2">
              {userEmail && (
                <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-700 dark:text-indigo-300 bg-slate-100 dark:bg-indigo-950/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-indigo-800/60 shadow-2xs font-semibold">
                  <UserIcon className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="truncate max-w-[160px]">{userEmail}</span>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
                title="Encerrar sessão"
                className="text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-950/40 gap-1.5 h-9"
              >
                <LogOut className="h-4 w-4 text-slate-500 hover:text-red-600" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button variant="indigo" size="sm" className="text-xs gap-1.5 h-9 font-semibold">
                <LogIn className="h-4 w-4" /> Entrar
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
