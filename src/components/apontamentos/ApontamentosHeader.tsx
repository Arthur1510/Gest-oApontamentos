"use client";

import React from 'react';
import { Plus, ClipboardList, AlertCircle, CheckCircle2, Flame, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Apontamento } from '@/types/apontamento';

interface ApontamentosHeaderProps {
  apontamentos: Apontamento[];
  onOpenNewModal: () => void;
  onFilterStatus?: (status: string) => void;
  onFilterPrioridade?: (prioridade: string) => void;
}

export function ApontamentosHeader({
  apontamentos,
  onOpenNewModal,
  onFilterStatus,
  onFilterPrioridade,
}: ApontamentosHeaderProps) {
  const totalCount = apontamentos.length;
  const abertosCount = apontamentos.filter((a) => a.status === 'Aberto').length;
  const resolvidosCount = apontamentos.filter((a) => a.status === 'Resolvido').length;
  const altaPrioridadeCount = apontamentos.filter((a) => a.prioridade === 'Alta' && a.status === 'Aberto').length;

  return (
    <div className="space-y-6">
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs uppercase tracking-wider">
            <Layers className="h-4 w-4" /> Plataforma Integrada de Compatibilização
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mt-1">
            Gestão de Apontamentos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Controle interativo de interferências, revisões e compatibilização entre disciplinas técnicas.
          </p>
        </div>

        <Button
          onClick={onOpenNewModal}
          variant="indigo"
          size="lg"
          className="shadow-lg shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all gap-2 self-start sm:self-auto shrink-0 font-semibold"
        >
          <Plus className="h-5 w-5" /> Novo Apontamento
        </Button>
      </div>

      {/* Metrics Cards Cliváveis (Filtro Rápido) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div
          onClick={() => onFilterStatus && onFilterStatus('Todos')}
          className="group rounded-xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/90 shadow-2xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 cursor-pointer transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Total
            </span>
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/60 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              <ClipboardList className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50">{totalCount}</span>
            <span className="text-xs text-slate-500">registros</span>
          </div>
        </div>

        {/* Abertos */}
        <div
          onClick={() => onFilterStatus && onFilterStatus('Aberto')}
          className="group rounded-xl border border-amber-500/20 bg-amber-50/40 p-4 dark:border-amber-800/30 dark:bg-amber-950/20 shadow-2xs hover:shadow-md hover:border-amber-400 dark:hover:border-amber-700 cursor-pointer transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
              Abertos
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500/20 transition-colors">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-amber-900 dark:text-amber-200">{abertosCount}</span>
            <span className="text-xs text-amber-700/70 dark:text-amber-400/70">pendentes</span>
          </div>
        </div>

        {/* Resolvidos */}
        <div
          onClick={() => onFilterStatus && onFilterStatus('Resolvido')}
          className="group rounded-xl border border-emerald-500/20 bg-emerald-50/40 p-4 dark:border-emerald-800/30 dark:bg-emerald-950/20 shadow-2xs hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-700 cursor-pointer transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
              Resolvidos
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-900 dark:text-emerald-200">{resolvidosCount}</span>
            <span className="text-xs text-emerald-700/70 dark:text-emerald-400/70">concluídos</span>
          </div>
        </div>

        {/* Alta Prioridade */}
        <div
          onClick={() => onFilterPrioridade && onFilterPrioridade('Alta')}
          className="group rounded-xl border border-rose-500/20 bg-rose-50/40 p-4 dark:border-rose-800/30 dark:bg-rose-950/20 shadow-2xs hover:shadow-md hover:border-rose-400 dark:hover:border-rose-700 cursor-pointer transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
              Alta Prioridade
            </span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:bg-rose-500/20 transition-colors">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-rose-900 dark:text-rose-200">{altaPrioridadeCount}</span>
            <span className="text-xs text-rose-700/70 dark:text-rose-400/70">críticos abertos</span>
          </div>
        </div>
      </div>
    </div>
  );
}
