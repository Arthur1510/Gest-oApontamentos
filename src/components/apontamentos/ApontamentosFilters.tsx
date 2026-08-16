"use client";

import React from 'react';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DISCIPLINAS_OPCOES, Projeto } from '@/types/apontamento';

interface ApontamentosFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedPrioridade: string;
  onPrioridadeChange: (prioridade: string) => void;
  selectedDisciplina: string;
  onDisciplinaChange: (disciplina: string) => void;
  selectedProjeto: string;
  onProjetoChange: (projetoId: string) => void;
  projetosList: Projeto[];
  onResetFilters: () => void;
}

export function ApontamentosFilters({
  searchTerm,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedPrioridade,
  onPrioridadeChange,
  selectedDisciplina,
  onDisciplinaChange,
  selectedProjeto,
  onProjetoChange,
  projetosList,
  onResetFilters,
}: ApontamentosFiltersProps) {
  const hasActiveFilters =
    searchTerm ||
    selectedStatus !== 'Todos' ||
    selectedPrioridade !== 'Todas' ||
    selectedDisciplina !== 'Todas' ||
    selectedProjeto !== 'Todos';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          <Filter className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" /> Filtros e Busca
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 h-7 gap-1"
          >
            <RefreshCw className="h-3 w-3" /> Limpar Filtros
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Filtro por Projeto */}
        <div>
          <select
            value={selectedProjeto}
            onChange={(e) => onProjetoChange(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/40 dark:border-indigo-800 px-3 py-2 text-xs sm:text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 text-indigo-900 dark:text-indigo-200"
          >
            <option value="Todos">Projeto: Todos</option>
            {projetosList.map((p) => (
              <option key={`filter-proj-${p.id}`} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Campo de Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por título..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 text-xs sm:text-sm"
          />
        </div>

        {/* Filtro de Status */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
          >
            <option value="Todos">Status: Todos</option>
            <option value="Aberto">Aberto</option>
            <option value="Resolvido">Resolvido</option>
          </select>
        </div>

        {/* Filtro de Prioridade */}
        <div>
          <select
            value={selectedPrioridade}
            onChange={(e) => onPrioridadeChange(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
          >
            <option value="Todas">Prioridade: Todas</option>
            <option value="Baixa">Baixa</option>
            <option value="Média">Média</option>
            <option value="Alta">Alta</option>
          </select>
        </div>

        {/* Filtro por Disciplina */}
        <div>
          <select
            value={selectedDisciplina}
            onChange={(e) => onDisciplinaChange(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
          >
            <option value="Todas">Disciplina: Todas</option>
            {DISCIPLINAS_OPCOES.map((d) => (
              <option key={`filter-${d}`} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
