"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layers, Mail, Lock, LogIn, UserPlus, AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [actionType, setActionType] = useState<'login' | 'signup' | null>(null);

  // Alerta vermelho de erro
  const [errorMessage, setErrorMessage] = useState('');
  // Toast verde de sucesso
  const [successMessage, setSuccessMessage] = useState('');

  const supabase = createSupabaseBrowserClient();

  // Handler: Entrar (Login)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Por favor, preencha o e-mail e a senha.');
      return;
    }

    try {
      setIsLoading(true);
      setActionType('login');
      setErrorMessage('');
      setSuccessMessage('');

      if (!isSupabaseConfigured()) {
        // Redirecionamento direto de teste quando em modo mock
        setSuccessMessage('Login efetuado com sucesso (Modo Demonstração)!');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(
          error.message === 'Invalid login credentials'
            ? 'E-mail ou senha incorretos. Por favor, verifique suas credenciais.'
            : error.message
        );
      } else if (data.session) {
        setSuccessMessage('Login realizado com sucesso! Redirecionando...');
        setTimeout(() => {
          router.push('/dashboard');
          router.refresh();
        }, 800);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || 'Falha ao autenticar no Supabase.');
    } finally {
      setIsLoading(false);
      setActionType(null);
    }
  };

  // Handler: Criar Conta (Sign Up)
  const handleSignUp = async () => {
    if (!email.trim() || !password) {
      setErrorMessage('Informe o e-mail e a senha para criar sua conta.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha precisa ter no mínimo 6 caracteres.');
      return;
    }

    try {
      setIsLoading(true);
      setActionType('signup');
      setErrorMessage('');
      setSuccessMessage('');

      if (!isSupabaseConfigured()) {
        setSuccessMessage('Conta de teste criada com sucesso! Redirecionando...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1200);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message);
      } else if (data.user) {
        if (data.session) {
          setSuccessMessage('Conta criada e autenticada! Entrando...');
          setTimeout(() => {
            router.push('/dashboard');
            router.refresh();
          }, 1000);
        } else {
          setSuccessMessage(
            'Conta criada com sucesso! Verifique a caixa de entrada do seu e-mail para confirmar a conta.'
          );
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || 'Falha ao criar conta no Supabase.');
    } finally {
      setIsLoading(false);
      setActionType(null);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-[#041A24] transition-colors">
      <div className="w-full max-w-md space-y-6">
        {/* Logotipo WCC e Apresentação Institucional */}
        <div className="text-center space-y-3">
          <div className="inline-flex flex-col items-center gap-1.5 mb-1">
            <div className="px-5 py-2.5 rounded-2xl bg-[#072B3B] text-white shadow-xl border border-[#00A3C4]/30 shadow-[#00A3C4]/10">
              <span className="text-3xl font-black tracking-widest">WCC</span>
            </div>
            <span className="text-xs font-black tracking-[0.25em] text-[#072B3B] dark:text-white uppercase">
              PARTICIPAÇÕES
            </span>
            <span className="text-[10px] font-bold tracking-[0.3em] text-[#00A3C4] uppercase">
              AURA | ELBRUS
            </span>
          </div>

          <div className="w-20 h-1 mx-auto rounded-full bg-gradient-to-r from-[#00A3C4] to-[#10B981]" />

          <h1 className="text-2xl font-black tracking-tight text-[#072B3B] dark:text-white">
            Gestão de Apontamentos BIM
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto font-medium">
            Há 14 anos transformando sonhos em projetos reais.
          </p>
        </div>

        {/* Card do Formulário */}
        <div className="bg-white dark:bg-[#072B3B] border border-slate-200/80 dark:border-[#0B384D] rounded-2xl p-6 sm:p-8 shadow-xl space-y-5">
          {/* Alerta Vermelho de Erro */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 text-xs flex items-start gap-2.5 border border-rose-200 dark:border-rose-800 animate-in fade-in-0 slide-in-from-top-2 duration-200">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span className="leading-relaxed font-semibold">{errorMessage}</span>
            </div>
          )}

          {/* Alerta Verde de Sucesso */}
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs flex items-start gap-2.5 border border-emerald-200 dark:border-emerald-800 animate-in fade-in-0 slide-in-from-top-2 duration-200">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <span className="leading-relaxed font-semibold">{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Campo E-mail */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold text-[#072B3B] dark:text-slate-300">
                E-mail Corporativo *
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="engenharia@wccparticipacoes.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 text-xs sm:text-sm h-11 rounded-xl"
                  required
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold text-[#072B3B] dark:text-slate-300">
                Senha de Acesso *
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-9 text-xs sm:text-sm h-11 rounded-xl"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#00A3C4]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Botões de Ação: Entrar e Criar Conta */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                type="submit"
                variant="wcc-gradient"
                className="h-11 font-bold text-xs sm:text-sm gap-2 cursor-pointer"
                disabled={isLoading}
              >
                {isLoading && actionType === 'login' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Entrando...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" /> Entrar
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleSignUp}
                className="h-11 font-bold text-xs sm:text-sm gap-2 border-slate-300 dark:border-[#0B384D] cursor-pointer"
                disabled={isLoading}
              >
                {isLoading && actionType === 'signup' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Criando...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 text-[#00A3C4]" /> Criar Conta
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Rodapé Informativo */}
        <div className="text-center text-xs text-slate-400 flex items-center justify-center gap-1 font-mono">
          <Sparkles className="h-3.5 w-3.5 text-[#00A3C4]" />
          <span>WCC Participações 2026 • www.wccparticipacoes.com.br</span>
        </div>
      </div>
    </main>
  );
}
