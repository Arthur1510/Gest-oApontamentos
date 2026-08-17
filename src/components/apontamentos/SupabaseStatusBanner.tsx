"use client";

import React, { useState } from 'react';
import { AlertTriangle, Copy, Check, ExternalLink, TestTube2 } from 'lucide-react';
import { isSupabaseConfigured, isForceMockMode } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export function SupabaseStatusBanner() {
  const configured = isSupabaseConfigured();
  const forceMock = isForceMockMode();
  const [copied, setCopied] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const copySqlInstruction = () => {
    const sql = `-- Script SQL Idempotente para Supabase:
CREATE TABLE IF NOT EXISTS public.projetos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo'))
);

CREATE TABLE IF NOT EXISTS public.apontamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    disciplina_origem VARCHAR(100) NOT NULL,
    disciplina_destino VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Aberto' CHECK (status IN ('Aberto', 'Resolvido')),
    prioridade VARCHAR(20) NOT NULL DEFAULT 'Média' CHECK (prioridade IN ('Baixa', 'Média', 'Alta')),
    url_imagem TEXT,
    projeto_id UUID REFERENCES public.projetos(id) ON DELETE CASCADE
);`;

    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Se o Supabase estiver configurado e conectado com sucesso, não exibe nenhum card
  if (configured && !forceMock) {
    return null;
  }

  return (
    <div className="w-full mb-6">
      {forceMock ? (
        <div className="rounded-xl border border-[#00A3C4]/30 bg-cyan-50/70 p-4 dark:bg-[#072B3B] dark:border-[#0B384D] flex items-center justify-between text-xs sm:text-sm text-[#072B3B] dark:text-slate-100 shadow-sm">
          <div className="flex items-center gap-2.5">
            <TestTube2 className="h-5 w-5 text-[#00A3C4] dark:text-[#00C4EB] shrink-0" />
            <div>
              <span className="font-bold">WCC • Modo de Demonstração com Dados Fictícios Ativo</span>
              <span className="hidden sm:inline text-slate-600 dark:text-slate-400"> | Dados carregados do modelo 2026</span>
            </div>
          </div>
          <span className="text-[11px] font-mono bg-[#00A3C4]/15 dark:bg-[#00A3C4]/25 px-2 py-1 rounded text-[#008EA9] dark:text-[#00C4EB] font-bold shrink-0">
            Mock Mode
          </span>
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
                  Adicione suas credenciais no arquivo <code className="bg-amber-200/60 dark:bg-amber-900/60 px-1.5 py-0.5 rounded font-mono text-[11px]">.env.local</code> para conectar ao Supabase.
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
                variant="wcc"
                size="sm"
                onClick={copySqlInstruction}
                className="text-xs gap-1.5 font-bold cursor-pointer"
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
                    1. Criar Tabelas e Bucket "clashes"
                  </h4>
                  <p className="text-amber-800 dark:text-amber-300 mb-2">
                    Acesse o seu dashboard no Supabase ➔ <strong>SQL Editor</strong> ➔ Execute o script SQL.
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
