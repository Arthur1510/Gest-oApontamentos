"use client";

import React from 'react';
import { Plus, ClipboardList, AlertCircle, CheckCircle2, Flame, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Apontamento, Projeto } from '@/types/apontamento';

interface ApontamentosHeaderProps {
  apontamentos: Apontamento[];
  totalRawCount?: number;
  selectedStatus?: string;
  selectedPrioridade?: string;
  selectedProjetos?: string[];
  projetosList?: Projeto[];
  onOpenNewModal: () => void;
  onFilterStatus?: (status: string) => void;
  onFilterPrioridade?: (prioridade: string) => void;
}

export function ApontamentosHeader({
  apontamentos,
  totalRawCount,
  selectedStatus = 'Todos',
  selectedPrioridade = 'Todas',
  selectedProjetos = [],
  projetosList = [],
  onOpenNewModal,
  onFilterStatus,
  onFilterPrioridade,
}: ApontamentosHeaderProps) {
  const totalCount = apontamentos.length;
  const abertosCount = apontamentos.filter((a) => a.status === 'Aberto').length;
  const resolvidosCount = apontamentos.filter((a) => a.status === 'Resolvido').length;
  const altaPrioridadeCount = apontamentos.filter((a) => a.prioridade === 'Alta').length;

  const isTotalActive = selectedStatus === 'Todos' && selectedPrioridade === 'Todas';
  const isAbertosActive = selectedStatus === 'Aberto';
  const isResolvidosActive = selectedStatus === 'Resolvido';
  const isAltaActive = selectedPrioridade === 'Alta';

  // Título dinâmico do projeto
  let textoProjetoDinamico = 'Todos os Projetos';
  if (selectedProjetos && selectedProjetos.length === 1 && projetosList) {
    const proj = projetosList.find((p) => p.id === selectedProjetos[0]);
    if (proj) textoProjetoDinamico = proj.nome;
  } else if (selectedProjetos && selectedProjetos.length > 1 && projetosList) {
    const nomes = projetosList
      .filter((p) => selectedProjetos.includes(p.id))
      .map((p) => p.nome);
    textoProjetoDinamico = nomes.length <= 2 ? nomes.join(' • ') : `${nomes.length} Projetos Selecionados`;
  }

  return (
    <div className="space-y-6">
      {/* Top Title Bar com Nome Dinâmico do Projeto */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-[#0B384D]">
        <div>
          <div className="flex items-center gap-2 text-[#00A3C4] dark:text-[#00C4EB] font-bold text-xs uppercase tracking-wider">
            <Layers className="h-4 w-4" /> WCC Participações
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#072B3B] dark:text-white mt-1">
            {textoProjetoDinamico}
          </h1>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wide">
            {selectedProjetos && selectedProjetos.length > 0 ? 'Gestão de Apontamentos do Empreendimento' : 'Gestão de Apontamentos • Todos os Empreendimentos'}
          </p>
        </div>

        <Button
          onClick={onOpenNewModal}
          variant="wcc"
          size="lg"
          className="shadow-lg shadow-[#00A3C4]/25 hover:scale-[1.02] active:scale-[0.98] transition-all gap-2 self-start sm:self-auto shrink-0 font-bold cursor-pointer"
        >
          <Plus className="h-5 w-5" /> Novo Apontamento
        </Button>
      </div>

      {/* Metrics Cards Clicáveis (Filtro Rápido Dinâmico) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div
          onClick={() => {
            onFilterStatus?.('Todos');
            onFilterPrioridade?.('Todas');
          }}
          className={`group rounded-xl border p-4 shadow-2xs hover:shadow-md cursor-pointer transition-all duration-200 ${
            isTotalActive
              ? 'border-[#00A3C4] bg-white dark:bg-[#072B3B] ring-2 ring-[#00A3C4]/20'
              : 'border-slate-200/80 bg-white dark:border-[#0B384D] dark:bg-[#072B3B]/90 hover:border-[#00A3C4]/60 dark:hover:border-[#00A3C4]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-hover:text-[#00A3C4] dark:group-hover:text-[#00C4EB] transition-colors">
              Total
            </span>
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-[#0B384D] text-[#072B3B] dark:text-slate-200 group-hover:bg-[#00A3C4]/15 group-hover:text-[#00A3C4] dark:group-hover:bg-[#00A3C4]/20 dark:group-hover:text-[#00C4EB] transition-colors">
              <ClipboardList className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#072B3B] dark:text-white">{totalCount}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {totalRawCount !== undefined && totalRawCount !== totalCount
                ? `de ${totalRawCount} total`
                : 'registros'}
            </span>
          </div>
        </div>

        {/* Abertos */}
        <div
          onClick={() => {
            if (isAbertosActive) {
              onFilterStatus?.('Todos');
            } else {
              onFilterStatus?.('Aberto');
            }
          }}
          className={`group rounded-xl border p-4 shadow-2xs hover:shadow-md cursor-pointer transition-all duration-200 ${
            isAbertosActive
              ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 ring-2 ring-amber-500/40 shadow-sm scale-[1.01]'
              : 'border-amber-500/20 bg-amber-50/40 dark:border-amber-800/30 dark:bg-amber-950/20 hover:border-amber-400 dark:hover:border-amber-700'
          }`}
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
          onClick={() => {
            if (isResolvidosActive) {
              onFilterStatus?.('Todos');
            } else {
              onFilterStatus?.('Resolvido');
            }
          }}
          className={`group rounded-xl border p-4 shadow-2xs hover:shadow-md cursor-pointer transition-all duration-200 ${
            isResolvidosActive
              ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 ring-2 ring-emerald-500/40 shadow-sm scale-[1.01]'
              : 'border-emerald-500/20 bg-emerald-50/40 dark:border-emerald-800/30 dark:bg-emerald-950/20 hover:border-emerald-400 dark:hover:border-emerald-700'
          }`}
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
          onClick={() => {
            if (isAltaActive) {
              onFilterPrioridade?.('Todas');
            } else {
              onFilterPrioridade?.('Alta');
            }
          }}
          className={`group rounded-xl border p-4 shadow-2xs hover:shadow-md cursor-pointer transition-all duration-200 ${
            isAltaActive
              ? 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 ring-2 ring-rose-500/40 shadow-sm scale-[1.01]'
              : 'border-rose-500/20 bg-rose-50/40 dark:border-rose-800/30 dark:bg-rose-950/20 hover:border-rose-400 dark:hover:border-rose-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
              Alto
            </span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:bg-rose-500/20 transition-colors">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-rose-900 dark:text-rose-200">{altaPrioridadeCount}</span>
            <span className="text-xs text-rose-700/70 dark:text-rose-400/70">críticos</span>
          </div>
        </div>
      </div>
    </div>
  );
}
