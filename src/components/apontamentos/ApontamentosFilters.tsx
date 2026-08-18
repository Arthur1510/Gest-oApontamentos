"use client";

import React from 'react';
import { Search, Filter, RefreshCw, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MultiSelectFilter, MultiSelectOption } from '@/components/ui/multi-select-filter';
import { SelectNative } from '@/components/ui/select-native';
import { DISCIPLINAS_OPCOES, Projeto, TIPOS_CONFLITO_OPCOES } from '@/types/apontamento';
import { SortCriteria, SORT_OPTIONS } from '@/lib/sorting';

interface ApontamentosFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedStatus: string[];
  onStatusChange: (status: string[]) => void;
  selectedPrioridades: string[];
  onPrioridadesChange: (prioridades: string[]) => void;
  selectedDisciplinas: string[];
  onDisciplinasChange: (disciplinas: string[]) => void;
  selectedTiposConflito: string[];
  onTiposConflitoChange: (tipos: string[]) => void;
  selectedProjetos: string[];
  onProjetosChange: (projetosIds: string[]) => void;
  projetosList: Projeto[];
  onResetFilters: () => void;
  sortCriteria?: SortCriteria;
  onSortCriteriaChange?: (criteria: SortCriteria) => void;
}

export function ApontamentosFilters({
  searchTerm,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedPrioridades,
  onPrioridadesChange,
  selectedDisciplinas,
  onDisciplinasChange,
  selectedTiposConflito,
  onTiposConflitoChange,
  selectedProjetos,
  onProjetosChange,
  projetosList,
  onResetFilters,
  sortCriteria = 'data_desc',
  onSortCriteriaChange,
}: ApontamentosFiltersProps) {
  const hasActiveFilters =
    Boolean(searchTerm) ||
    selectedStatus.length > 0 ||
    selectedPrioridades.length > 0 ||
    selectedDisciplinas.length > 0 ||
    selectedTiposConflito.length > 0 ||
    selectedProjetos.length > 0;

  const projetoOptions: MultiSelectOption[] = projetosList.map((p) => ({
    value: p.id,
    label: p.nome,
  }));

  const tipoConflitoOptions: MultiSelectOption[] = TIPOS_CONFLITO_OPCOES.map((tc) => ({
    value: tc,
    label: tc,
  }));

  const statusOptions: MultiSelectOption[] = [
    { value: 'Aberto', label: 'Aberto' },
    { value: 'Resolvido', label: 'Resolvido' },
  ];

  const prioridadeOptions: MultiSelectOption[] = [
    { value: 'Alta', label: 'Alto' },
    { value: 'Média', label: 'Médio' },
    { value: 'Baixa', label: 'Baixo' },
  ];

  const disciplinaOptions: MultiSelectOption[] = DISCIPLINAS_OPCOES.map((d) => ({
    value: d,
    label: d,
  }));

  return (
    <div className="bg-white dark:bg-[#072B3B]/90 border border-slate-200/80 dark:border-[#0B384D] rounded-2xl p-4 shadow-2xs space-y-3.5">
      {/* Cabeçalho do Bloco de Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 text-xs font-extrabold text-[#072B3B] dark:text-slate-100 uppercase tracking-wider">
          <Filter className="h-3.5 w-3.5 text-[#00A3C4] dark:text-[#00C4EB]" /> Filtros Dinâmicos (Multi-Seleção)
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {onSortCriteriaChange && (
            <div className="flex items-center gap-1.5 text-xs">
              <label htmlFor="filter-sort" className="font-bold text-slate-500 text-[10.5px] uppercase tracking-wider shrink-0">
                Ordenar:
              </label>
              <div className="w-48 sm:w-56">
                <SelectNative
                  id="filter-sort"
                  value={sortCriteria}
                  onChange={(e) => onSortCriteriaChange(e.target.value as SortCriteria)}
                  className="h-8 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-[#041A24] border-slate-200 dark:border-[#0B384D]"
                >
                  {SORT_OPTIONS.filter((o) => o.value !== 'manual').map((opt) => (
                    <option key={`opt-filter-${opt.value}`} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </SelectNative>
              </div>
            </div>
          )}

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="text-xs font-semibold text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 h-8 gap-1 shrink-0"
            >
              <RefreshCw className="h-3 w-3" /> Limpar Filtros
            </Button>
          )}
        </div>
      </div>

      {/* Grid de Controles Multi-Select */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Campo de Busca Textual */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por texto..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 text-xs sm:text-sm h-10 rounded-xl"
          />
        </div>

        {/* Multi-Select de Projetos */}
        <MultiSelectFilter
          label="Projeto"
          placeholder="Todos"
          options={projetoOptions}
          selectedValues={selectedProjetos}
          onChange={onProjetosChange}
          variant="wcc"
          searchable
        />

        {/* Multi-Select de Tipo de Apontamento */}
        <MultiSelectFilter
          label="Tipo"
          placeholder="Todos"
          options={tipoConflitoOptions}
          selectedValues={selectedTiposConflito}
          onChange={onTiposConflitoChange}
          variant="amber"
          searchable
        />

        {/* Multi-Select de Status */}
        <MultiSelectFilter
          label="Status"
          placeholder="Todos"
          options={statusOptions}
          selectedValues={selectedStatus}
          onChange={onStatusChange}
          variant="emerald"
        />

        {/* Multi-Select de Prioridade */}
        <MultiSelectFilter
          label="Prioridade"
          placeholder="Todas"
          options={prioridadeOptions}
          selectedValues={selectedPrioridades}
          onChange={onPrioridadesChange}
          variant="default"
        />

        {/* Multi-Select de Disciplinas */}
        <MultiSelectFilter
          label="Disciplina"
          placeholder="Todas"
          options={disciplinaOptions}
          selectedValues={selectedDisciplinas}
          onChange={onDisciplinasChange}
          variant="default"
          searchable
        />
      </div>

      {/* Chips / Tags de Filtros Ativos (Removíveis com 1 clique) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-[#0B384D] text-xs">
          <span className="text-[11px] font-bold text-slate-400 mr-1">Filtros ativos:</span>

          {searchTerm && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#0B384D] text-[#072B3B] dark:text-slate-200 text-[11px] font-medium border border-slate-200 dark:border-slate-700">
              Busca: &quot;{searchTerm}&quot;
              <button type="button" onClick={() => onSearchChange('')} className="hover:text-rose-500">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {selectedProjetos.map((projId) => {
            const name = projetosList.find((p) => p.id === projId)?.nome || projId;
            return (
              <span key={`chip-proj-${projId}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00A3C4]/15 text-[#008EA9] dark:text-[#00C4EB] text-[11px] font-bold border border-[#00A3C4]/30">
                Proj: {name}
                <button type="button" onClick={() => onProjetosChange(selectedProjetos.filter((id) => id !== projId))} className="hover:text-rose-500">
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}

          {selectedTiposConflito.map((tipo) => (
            <span key={`chip-tc-${tipo}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px] font-bold border border-amber-300 dark:border-amber-800">
              {tipo}
              <button type="button" onClick={() => onTiposConflitoChange(selectedTiposConflito.filter((t) => t !== tipo))} className="hover:text-rose-500">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}

          {selectedStatus.map((st) => (
            <span key={`chip-st-${st}`} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${st === 'Aberto' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 border-amber-300 dark:border-amber-800' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 border-emerald-300 dark:border-emerald-800'}`}>
              Status: {st}
              <button type="button" onClick={() => onStatusChange(selectedStatus.filter((s) => s !== st))} className="hover:text-rose-500">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}

          {selectedPrioridades.map((prio) => (
            <span key={`chip-prio-${prio}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#0B384D] text-[#072B3B] dark:text-slate-200 text-[11px] font-bold border border-slate-200 dark:border-slate-700">
              Prio: {prio}
              <button type="button" onClick={() => onPrioridadesChange(selectedPrioridades.filter((p) => p !== prio))} className="hover:text-rose-500">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}

          {selectedDisciplinas.map((disc) => (
            <span key={`chip-disc-${disc}`} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-[#00A3C4]/15 text-[#008EA9] dark:text-[#00C4EB] text-[11px] font-bold border border-[#00A3C4]/30">
              Disc: {disc}
              <button type="button" onClick={() => onDisciplinasChange(selectedDisciplinas.filter((d) => d !== disc))} className="hover:text-rose-500">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
