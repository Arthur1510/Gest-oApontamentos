"use client";

import React, { useState } from 'react';
import { Database, AlertTriangle, Copy, Check, ExternalLink, TestTube2 } from 'lucide-react';
import { isSupabaseConfigured, isForceMockMode } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export function SupabaseStatusBanner() {
  const configured = isSupabaseConfigured();
  const forceMock = isForceMockMode();
  const [copied, setCopied] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const copySqlInstruction = () => {
    const sql = `-- Script SQL Idempotente (pode rodar quantas vezes quiser sem erro):
CREATE TABLE IF NOT EXISTS public.apontamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    disciplina_origem VARCHAR(100) NOT NULL,
    disciplina_destino VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Aberto' CHECK (status IN ('Aberto', 'Resolvido')),
    prioridade VARCHAR(20) NOT NULL DEFAULT 'Média' CHECK (prioridade IN ('Baixa', 'Média', 'Alta')),
    url_imagem TEXT
);
ALTER TABLE public.apontamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura pública" ON public.apontamentos;
DROP POLICY IF EXISTS "Permitir inserção pública" ON public.apontamentos;
DROP POLICY IF EXISTS "Permitir atualização pública" ON public.apontamentos;
DROP POLICY IF EXISTS "Permitir exclusão pública" ON public.apontamentos;

CREATE POLICY "Permitir leitura pública" ON public.apontamentos FOR SELECT USING (true);
CREATE POLICY "Permitir inserção pública" ON public.apontamentos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização pública" ON public.apontamentos FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão pública" ON public.apontamentos FOR DELETE USING (true);

INSERT INTO storage.buckets (id, name, public) VALUES ('clashes', 'clashes', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Permitir leitura pública de imagens no bucket clashes" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload público no bucket clashes" ON storage.objects;
DROP POLICY IF EXISTS "Permitir exclusão pública no bucket clashes" ON storage.objects;

CREATE POLICY "Permitir leitura pública de imagens no bucket clashes" ON storage.objects FOR SELECT USING (bucket_id = 'clashes');
CREATE POLICY "Permitir upload público no bucket clashes" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'clashes');
CREATE POLICY "Permitir exclusão pública no bucket clashes" ON storage.objects FOR DELETE USING (bucket_id = 'clashes');`;

    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="w-full mb-8">
      {forceMock ? (
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-50/70 p-4 dark:bg-indigo-950/30 dark:border-indigo-800/40 flex items-center justify-between text-xs sm:text-sm text-indigo-900 dark:text-indigo-200 shadow-sm">
          <div className="flex items-center gap-2.5">
            <TestTube2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <div>
              <span className="font-semibold">Modo de Testes com Dados Fictícios Ativo</span>
              <span className="hidden sm:inline text-indigo-700/80 dark:text-indigo-300/80"> | Iniciado via <code className="bg-indigo-200/60 dark:bg-indigo-900/60 px-1.5 py-0.5 rounded font-mono text-[11px]">npm run dev:mock</code></span>
            </div>
          </div>
          <span className="text-[11px] font-mono bg-indigo-200/60 dark:bg-indigo-900/60 px-2 py-1 rounded text-indigo-800 dark:text-indigo-200 shrink-0">
            Mock Mode
          </span>
        </div>
      ) : configured ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/50 p-4 dark:bg-emerald-950/20 dark:border-emerald-800/30 flex items-center justify-between text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <Database className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium">Supabase Conectado</span>
            <span className="hidden sm:inline text-emerald-600/80 dark:text-emerald-400/80">| Tabela e Upload para o bucket <strong>clashes</strong> habilitados.</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={copySqlInstruction}
            className="text-xs text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 gap-1.5"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'SQL Copiado!' : 'Copiar SQL (Tabela + Bucket)'}
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-500/30 bg-amber-50/80 p-4 dark:bg-amber-950/30 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 shadow-sm transition-all duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-sm flex items-center gap-2">
                  Modo Demonstrativo Ativo (Supabase Pendente)
                </div>
                <p className="text-xs text-amber-700/90 dark:text-amber-300/80 mt-0.5">
                  Adicione suas credenciais no arquivo <code className="bg-amber-200/60 dark:bg-amber-900/60 px-1.5 py-0.5 rounded font-mono text-[11px]">.env.local</code> para salvar no seu banco Supabase.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInstructions(!showInstructions)}
                className="text-xs border-amber-300 bg-white/80 hover:bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:border-amber-700 dark:text-amber-200"
              >
                {showInstructions ? 'Ocultar Instruções' : 'Como Configurar'}
              </Button>
              <Button
                variant="indigo"
                size="sm"
                onClick={copySqlInstruction}
                className="text-xs gap-1.5"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'SQL Copiado!' : 'Copiar SQL (Tabela + Storage)'}
              </Button>
            </div>
          </div>

          {showInstructions && (
            <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-800/60 text-xs space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/60 dark:bg-slate-900/60 p-3 rounded-lg border border-amber-200/60 dark:border-amber-800/40">
                  <h4 className="font-semibold text-amber-950 dark:text-amber-100 flex items-center gap-1.5 mb-1.5">
                    1. Criar Tabela e Bucket "clashes"
                  </h4>
                  <p className="text-amber-800 dark:text-amber-300 mb-2">
                    Acesse o seu dashboard no Supabase ➔ <strong>SQL Editor</strong> ➔ Clique no botão <strong>Copiar SQL</strong> acima e execute o script.
                  </p>
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                  >
                    Abrir Dashboard Supabase <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="bg-white/60 dark:bg-slate-900/60 p-3 rounded-lg border border-amber-200/60 dark:border-amber-800/40">
                  <h4 className="font-semibold text-amber-950 dark:text-amber-100 mb-1.5">
                    2. Configurar Variáveis de Ambiente
                  </h4>
                  <p className="text-amber-800 dark:text-amber-300">
                    No seu projeto, edite o arquivo <code className="bg-amber-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">.env.local</code>:
                  </p>
                  <pre className="mt-2 bg-slate-900 text-slate-100 p-2 rounded text-[11px] overflow-x-auto font-mono">
NEXT_PUBLIC_SUPABASE_URL=https://sua-url.supabase.co&#10;NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
