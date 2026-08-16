"use client";

import React from 'react';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SelectNative } from '@/components/ui/select-native';
import { DISCIPLINAS_OPCOES, Projeto, TIPOS_CONFLITO_OPCOES } from '@/types/apontamento';

interface ApontamentosFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedPrioridade: string;
  onPrioridadeChange: (prioridade: string) => void;
  selectedDisciplina: string;
  onDisciplinaChange: (disciplina: string) => void;
  selectedTipoConflito: string;
  onTipoConflitoChange: (tipo: string) => void;
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
  selectedTipoConflito,
  onTipoConflitoChange,
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
    selectedTipoConflito !== 'Todos' ||
    selectedProjeto !== 'Todos';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-2xs space-y-4">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Campo de Busca por Título */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por título..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 text-xs sm:text-sm h-10 rounded-xl"
          />
        </div>

        {/* Filtro por Projeto */}
        <div>
          <SelectNative
            variant="indigo"
            value={selectedProjeto}
            onChange={(e) => onProjetoChange(e.target.value)}
          >
            <option value="Todos">Projeto: Todos</option>
            {projetosList.map((p) => (
              <option key={`filter-proj-${p.id}`} value={p.id}>
                {p.nome}
              </option>
            ))}
          </SelectNative>
        </div>

        {/* Filtro de Tipo de Apontamento */}
        <div>
          <SelectNative
            variant="amber"
            value={selectedTipoConflito}
            onChange={(e) => onTipoConflitoChange(e.target.value)}
          >
            <option value="Todos">Tipo de Apontamento: Todos</option>
            {TIPOS_CONFLITO_OPCOES.map((tc) => (
              <option key={`filter-tc-${tc}`} value={tc}>
                {tc}
              </option>
            ))}
          </SelectNative>
        </div>

        {/* Filtro de Status */}
        <div>
          <SelectNative
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <option value="Todos">Status: Todos</option>
            <option value="Aberto">Aberto</option>
            <option value="Resolvido">Resolvido</option>
          </SelectNative>
        </div>

        {/* Filtro de Prioridade */}
        <div>
          <SelectNative
            value={selectedPrioridade}
            onChange={(e) => onPrioridadeChange(e.target.value)}
          >
            <option value="Todas">Prioridade: Todas</option>
            <option value="Baixa">Baixa</option>
            <option value="Média">Média</option>
            <option value="Alta">Alta</option>
          </SelectNative>
        </div>

        {/* Filtro por Disciplina */}
        <div>
          <SelectNative
            value={selectedDisciplina}
            onChange={(e) => onDisciplinaChange(e.target.value)}
          >
            <option value="Todas">Disciplina: Todas</option>
            {DISCIPLINAS_OPCOES.map((d) => (
              <option key={`filter-${d}`} value={d}>
                {d}
              </option>
            ))}
          </SelectNative>
        </div>
      </div>
    </div>
  );
}
