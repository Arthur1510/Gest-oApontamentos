"use client";

import React, { useState, useMemo } from 'react';
import {
  ItemOrcamento,
  Obra,
  Contrato,
  StatusOrcamento,
  STATUS_ORCAMENTO_OPCOES,
  STATUS_ORCAMENTO_COLORS,
} from '@/types/orcamento';
import { formatCurrency, formatPercent } from '@/lib/orcamento-utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Plus,
  Filter,
  DollarSign,
  FileSpreadsheet,
  Edit2,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Building,
} from 'lucide-react';

interface OrcamentoBaseTableProps {
  orcamentos: ItemOrcamento[];
  contratos?: Contrato[];
  obras: Obra[];
  filtroObra: string;
  setFiltroObra: (obra: string) => void;
  onNovoItem: () => void;
  onEditarItem: (item: ItemOrcamento) => void;
  onExcluirItem: (id: string) => void;
  onMudarStatusItem?: (item: ItemOrcamento, novoStatus: StatusOrcamento) => void;
}

type SortField =
  | 'obra'
  | 'categoria'
  | 'disciplina'
  | 'subdisciplina'
  | 'orcamento_base'
  | 'valor_contratado'
  | 'saldo_a_contratar'
  | 'valor_medido'
  | 'saldo_medicao'
  | 'status';

type SortDirection = 'asc' | 'desc';

export function OrcamentoBaseTable({
  orcamentos,
  contratos = [],
  obras,
  filtroObra,
  setFiltroObra,
  onNovoItem,
  onEditarItem,
  onExcluirItem,
  onMudarStatusItem,
}: OrcamentoBaseTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [filtroDisciplina, setFiltroDisciplina] = useState<string>('');
  const [filtroCategoria, setFiltroCategoria] = useState<'Todos' | 'Projeto' | 'Legalização'>('Todos');

  // Estados de ordenação
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        // Terceiro clique reseta para o padrão multinível
        setSortField(null);
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <ArrowUpDown className="h-3 w-3 text-slate-400/40 group-hover:text-slate-600 dark:group-hover:text-slate-300 shrink-0 transition-colors" />
      );
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 text-[#00A3C4] font-bold shrink-0" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-[#00A3C4] font-bold shrink-0" />
    );
  };

  const countProjetos = useMemo(() => orcamentos.filter((o) => o.categoria === 'Projeto').length, [orcamentos]);
  const countLegalizacao = useMemo(() => orcamentos.filter((o) => o.categoria === 'Legalização').length, [orcamentos]);

  // Lista única de disciplinas
  const disciplinasUnicas = useMemo(() => {
    const set = new Set<string>();
    orcamentos.forEach((o) => {
      if (o.disciplina) set.add(o.disciplina);
    });
    return Array.from(set).sort();
  }, [orcamentos]);

  // Filtros aplicados
  const orcamentosFiltrados = useMemo(() => {
    return orcamentos.filter((item) => {
      if (filtroObra && item.obra !== filtroObra) return false;
      if (filtroStatus && item.status !== filtroStatus) return false;
      if (filtroDisciplina && item.disciplina !== filtroDisciplina) return false;
      if (filtroCategoria !== 'Todos' && item.categoria !== filtroCategoria) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDisc = item.disciplina.toLowerCase().includes(q);
        const matchSub = item.subdisciplina.toLowerCase().includes(q);
        const matchObra = item.obra.toLowerCase().includes(q);
        if (!matchDisc && !matchSub && !matchObra) return false;
      }

      return true;
    });
  }, [orcamentos, filtroObra, filtroStatus, filtroDisciplina, filtroCategoria, searchQuery]);

  // Lista ordenada: padrão hierárquico (Obra ➔ Disciplina ➔ Subdisciplina) ou pela coluna ativa
  const orcamentosOrdenados = useMemo(() => {
    const list = [...orcamentosFiltrados];

    if (!sortField) {
      // 🌟 ORDENAÇÃO PADRÃO MULTINÍVEL (Hierárquica):
      // 1º Obra (A-Z) ➔ 2º Disciplina (A-Z) ➔ 3º Subdisciplina (A-Z)
      return list.sort((a, b) => {
        const cmpObra = (a.obra || '').localeCompare(b.obra || '', 'pt-BR', { numeric: true, sensitivity: 'base' });
        if (cmpObra !== 0) return cmpObra;

        const cmpDisc = (a.disciplina || '').localeCompare(b.disciplina || '', 'pt-BR', { sensitivity: 'base' });
        if (cmpDisc !== 0) return cmpDisc;

        return (a.subdisciplina || '').localeCompare(b.subdisciplina || '', 'pt-BR', { sensitivity: 'base' });
      });
    }

    return list.sort((a, b) => {
      let cmp = 0;

      switch (sortField) {
        case 'obra':
          cmp = (a.obra || '').localeCompare(b.obra || '', 'pt-BR', { numeric: true, sensitivity: 'base' });
          if (cmp === 0) {
            cmp = (a.disciplina || '').localeCompare(b.disciplina || '', 'pt-BR');
          }
          break;
        case 'categoria':
          cmp = (a.categoria || '').localeCompare(b.categoria || '', 'pt-BR');
          if (cmp === 0) {
            cmp = (a.disciplina || '').localeCompare(b.disciplina || '', 'pt-BR');
          }
          break;
        case 'disciplina':
          cmp = (a.disciplina || '').localeCompare(b.disciplina || '', 'pt-BR');
          if (cmp === 0) {
            cmp = (a.subdisciplina || '').localeCompare(b.subdisciplina || '', 'pt-BR');
          }
          break;
        case 'subdisciplina':
          cmp = (a.subdisciplina || '').localeCompare(b.subdisciplina || '', 'pt-BR');
          break;
        case 'orcamento_base':
          cmp = (a.orcamento_base || 0) - (b.orcamento_base || 0);
          break;
        case 'valor_contratado':
          cmp = (a.valor_contratado || 0) - (b.valor_contratado || 0);
          break;
        case 'saldo_a_contratar':
          cmp = (a.saldo_a_contratar || 0) - (b.saldo_a_contratar || 0);
          break;
        case 'valor_medido':
          cmp = (a.valor_medido || 0) - (b.valor_medido || 0);
          break;
        case 'saldo_medicao':
          cmp = (a.saldo_medicao || 0) - (b.saldo_medicao || 0);
          break;
        case 'status':
          cmp = (a.status || '').localeCompare(b.status || '', 'pt-BR');
          break;
        default:
          cmp = 0;
      }

      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [orcamentosFiltrados, sortField, sortDirection]);

  // Totais da tabela filtrada
  const totais = useMemo(() => {
    let base = 0;
    let contratado = 0;
    let saldoContratar = 0;
    let medido = 0;
    let saldoMedicao = 0;

    for (const o of orcamentosFiltrados) {
      base += o.orcamento_base || 0;
      contratado += o.valor_contratado || 0;
      saldoContratar += o.saldo_a_contratar || 0;
      medido += o.valor_medido || 0;
      saldoMedicao += o.saldo_medicao || 0;
    }

    return {
      base,
      contratado,
      saldoContratar,
      medido,
      saldoMedicao,
    };
  }, [orcamentosFiltrados]);

  return (
    <div className="space-y-4">
      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#072B3B] border border-slate-200 dark:border-[#0B384D] shadow-sm">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Busca por texto */}
          <div className="relative w-full sm:w-64 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar disciplina, subdisciplina..."
              className="pl-9 text-xs h-9 rounded-xl bg-slate-50 dark:bg-[#0B384D] border-slate-200 dark:border-[#0B384D]"
            />
          </div>

          {/* Filtro Obra */}
          <select
            value={filtroObra}
            onChange={(e) => setFiltroObra(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B384D] border border-slate-200 dark:border-[#0B384D] text-slate-800 dark:text-slate-100 h-9 min-w-[140px] max-w-[200px] focus:outline-none focus:ring-2 focus:ring-[#00A3C4] truncate"
          >
            <option value="">🏢 Todas as Obras</option>
            {obras.map((o) => (
              <option key={o.id} value={o.codigo}>
                {o.codigo} - {o.nome}
              </option>
            ))}
          </select>

          {/* Filtro Disciplina */}
          <select
            value={filtroDisciplina}
            onChange={(e) => setFiltroDisciplina(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B384D] border border-slate-200 dark:border-[#0B384D] text-slate-800 dark:text-slate-100 h-9 min-w-[140px] max-w-[200px] focus:outline-none focus:ring-2 focus:ring-[#00A3C4] truncate"
          >
            <option value="">📐 Disciplinas</option>
            {disciplinasUnicas.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Filtro Status */}
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B384D] border border-slate-200 dark:border-[#0B384D] text-slate-800 dark:text-slate-100 h-9 min-w-[130px] max-w-[170px] focus:outline-none focus:ring-2 focus:ring-[#00A3C4]"
          >
            <option value="">📋 Status</option>
            {STATUS_ORCAMENTO_OPCOES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Filtro Categoria: Projetos vs Legalização */}
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-[#0B384D] p-0.5 border border-slate-200 dark:border-[#0B384D] h-9">
            <button
              type="button"
              onClick={() => setFiltroCategoria('Todos')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filtroCategoria === 'Todos'
                  ? 'bg-white dark:bg-[#072B3B] text-[#072B3B] dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Todos ({orcamentos.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroCategoria('Projeto')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filtroCategoria === 'Projeto'
                  ? 'bg-[#00A3C4] text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Projetos ({countProjetos})
            </button>
            <button
              type="button"
              onClick={() => setFiltroCategoria('Legalização')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filtroCategoria === 'Legalização'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Legalização ({countLegalizacao})
            </button>
          </div>

          {(searchQuery || filtroObra || filtroDisciplina || filtroStatus || filtroCategoria !== 'Todos' || sortField !== null) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setFiltroObra('');
                setFiltroDisciplina('');
                setFiltroStatus('');
                setFiltroCategoria('Todos');
                setSortField(null);
                setSortDirection('asc');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 h-9 px-2.5"
            >
              Limpar
            </Button>
          )}
        </div>

        {/* Botão Adicionar Item */}
        <div className="flex items-center gap-2 shrink-0 self-end xl:self-center">
          <Button
            size="sm"
            onClick={onNovoItem}
            className="bg-[#00A3C4] hover:bg-[#008EA9] text-white text-xs font-bold gap-1.5 h-9 px-3 rounded-xl shadow-xs"
          >
            <Plus className="h-4 w-4" /> Nova Linha de Orçamento
          </Button>
        </div>
      </div>

      {/* Tabela de Orçamentos */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#0B384D] bg-white dark:bg-[#072B3B] overflow-hidden shadow-sm">
        {/* Barra informativa de ordenação atual */}
        <div className="px-4 py-2 bg-slate-50/70 dark:bg-[#083042]/50 border-b border-slate-200/80 dark:border-[#0B384D] flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 font-medium">
            <span>Ordem:</span>
            {!sortField ? (
              <span className="font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#072B3B] px-2 py-0.5 rounded-md border border-slate-200 dark:border-[#0B384D]">
                🏢 Obra ➔ 📑 Disciplina ➔ 📝 Subdisciplina (A–Z)
              </span>
            ) : (
              <span className="font-bold text-[#008EA9] dark:text-[#00C4EB] bg-[#00A3C4]/10 px-2 py-0.5 rounded-md border border-[#00A3C4]/30">
                Coluna: {sortField === 'obra' ? 'Obra' : sortField === 'categoria' ? 'Tipo' : sortField === 'disciplina' ? 'Disciplina' : sortField === 'subdisciplina' ? 'Subdisciplina' : sortField === 'orcamento_base' ? 'Orçamento Base' : sortField === 'valor_contratado' ? 'Valor Contratado' : sortField === 'saldo_a_contratar' ? 'Saldo a Contratar' : sortField === 'valor_medido' ? 'Valor Medido' : sortField === 'saldo_medicao' ? 'Saldo Medição' : 'Status'} ({sortDirection === 'asc' ? 'Crescente / A–Z' : 'Decrescente / Z–A'})
              </span>
            )}
          </div>

          {sortField && (
            <button
              type="button"
              onClick={() => {
                setSortField(null);
                setSortDirection('asc');
              }}
              className="text-[10px] font-bold text-slate-500 hover:text-[#00A3C4] dark:hover:text-[#00C4EB] underline transition-colors"
            >
              Restaurar ordem padrão hierárquica
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-[#0B384D] text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-[#0B384D]">
              <tr>
                <th
                  onClick={() => handleSort('obra')}
                  className="py-3 px-3.5 cursor-pointer select-none group hover:bg-slate-100 dark:hover:bg-[#083042] transition-colors"
                  title="Clique para ordenar por Obra"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Obra</span>
                    {renderSortIcon('obra')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('categoria')}
                  className="py-3 px-3.5 cursor-pointer select-none group hover:bg-slate-100 dark:hover:bg-[#083042] transition-colors"
                  title="Clique para ordenar por Tipo (Projeto / Legalização)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Tipo</span>
                    {renderSortIcon('categoria')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('disciplina')}
                  className="py-3 px-3.5 cursor-pointer select-none group hover:bg-slate-100 dark:hover:bg-[#083042] transition-colors"
                  title="Clique para ordenar por Disciplina (A–Z)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Disciplina</span>
                    {renderSortIcon('disciplina')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('subdisciplina')}
                  className="py-3 px-3.5 cursor-pointer select-none group hover:bg-slate-100 dark:hover:bg-[#083042] transition-colors"
                  title="Clique para ordenar por Subdisciplina (A–Z)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Subdisciplina</span>
                    {renderSortIcon('subdisciplina')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('orcamento_base')}
                  className="py-3 px-3.5 text-right cursor-pointer select-none group hover:bg-slate-100 dark:hover:bg-[#083042] transition-colors"
                  title="Clique para ordenar por Orçamento Base"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Orçamento Base</span>
                    {renderSortIcon('orcamento_base')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('valor_contratado')}
                  className="py-3 px-3.5 text-right cursor-pointer select-none group hover:bg-slate-100 dark:hover:bg-[#083042] transition-colors"
                  title="Clique para ordenar por Valor Contratado"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Valor Contratado</span>
                    {renderSortIcon('valor_contratado')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('saldo_a_contratar')}
                  className="py-3 px-3.5 text-right cursor-pointer select-none group hover:bg-slate-100 dark:hover:bg-[#083042] transition-colors"
                  title="Clique para ordenar por Saldo a Contratar"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Saldo a Contratar</span>
                    {renderSortIcon('saldo_a_contratar')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('valor_medido')}
                  className="py-3 px-3.5 text-right cursor-pointer select-none group hover:bg-slate-100 dark:hover:bg-[#083042] transition-colors"
                  title="Clique para ordenar por Valor Medido"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Valor Medido</span>
                    {renderSortIcon('valor_medido')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('saldo_medicao')}
                  className="py-3 px-3.5 text-right cursor-pointer select-none group hover:bg-slate-100 dark:hover:bg-[#083042] transition-colors"
                  title="Clique para ordenar por Saldo Medição"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Saldo Medição</span>
                    {renderSortIcon('saldo_medicao')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('status')}
                  className="py-3 px-3.5 text-center cursor-pointer select-none group hover:bg-slate-100 dark:hover:bg-[#083042] transition-colors"
                  title="Clique para ordenar por Status"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Status</span>
                    {renderSortIcon('status')}
                  </div>
                </th>

                <th className="py-3 px-3.5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#0B384D]/60 text-slate-700 dark:text-slate-200">
              {orcamentosOrdenados.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-400">
                    Nenhum item de orçamento encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                orcamentosOrdenados.map((item) => {
                  const statusColor = STATUS_ORCAMENTO_COLORS[item.status] || {
                    bg: 'bg-slate-100 dark:bg-slate-800',
                    text: 'text-slate-700 dark:text-slate-300',
                    border: 'border-slate-300',
                  };

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 dark:hover:bg-[#0B384D]/30 transition-colors"
                    >
                      <td className="py-2.5 px-3.5 font-bold whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-[#00A3C4]/15 text-[#008EA9] dark:text-[#00C4EB] text-[10px] font-extrabold">
                          {item.obra}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            item.categoria === 'Legalização'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-300/50'
                              : 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border border-cyan-200/50'
                          }`}
                        >
                          {item.categoria || 'Projeto'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 font-semibold text-slate-900 dark:text-white max-w-[160px] break-words">
                        {item.disciplina}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-300 max-w-[180px] break-words">
                        {item.subdisciplina}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-bold text-slate-900 dark:text-white font-mono whitespace-nowrap">
                        {formatCurrency(item.orcamento_base)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-semibold text-[#008EA9] dark:text-[#00C4EB] font-mono whitespace-nowrap">
                        {formatCurrency(item.valor_contratado)}
                      </td>
                      <td
                        className={`py-2.5 px-3.5 text-right font-semibold font-mono whitespace-nowrap ${
                          item.saldo_a_contratar < 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {formatCurrency(item.saldo_a_contratar)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-semibold text-emerald-600 dark:text-emerald-400 font-mono whitespace-nowrap">
                        {formatCurrency(item.valor_medido)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-semibold text-purple-600 dark:text-purple-400 font-mono whitespace-nowrap">
                        {formatCurrency(item.saldo_medicao)}
                      </td>
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        <select
                          value={item.status}
                          onChange={(e) => onMudarStatusItem?.(item, e.target.value as StatusOrcamento)}
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#00A3C4] ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}
                          title="Alterar status do orçamento"
                        >
                          {STATUS_ORCAMENTO_OPCOES.map((st) => (
                            <option key={st} value={st} className="bg-white dark:bg-[#072B3B] text-slate-800 dark:text-slate-100 font-semibold">
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEditarItem(item)}
                            title="Editar Item"
                            className="p-1 rounded-md text-slate-400 hover:text-[#00A3C4] hover:bg-slate-100 dark:hover:bg-[#0B384D] transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onExcluirItem(item.id)}
                            title="Excluir Item"
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Linha de Totais */}
            <tfoot className="bg-slate-100/90 dark:bg-[#072432] text-slate-900 dark:text-white font-extrabold border-t-2 border-slate-300 dark:border-[#00A3C4]/40">
              <tr>
                <td colSpan={4} className="py-3 px-3.5 text-left uppercase tracking-wider text-xs">
                  Totais ({orcamentosFiltrados.length} itens)
                </td>
                <td className="py-3 px-3.5 text-right text-xs">
                  {formatCurrency(totais.base)}
                </td>
                <td className="py-3 px-3.5 text-right text-xs text-[#008EA9] dark:text-[#00C4EB]">
                  {formatCurrency(totais.contratado)}
                </td>
                <td
                  className={`py-3 px-3.5 text-right text-xs ${
                    totais.saldoContratar < 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {formatCurrency(totais.saldoContratar)}
                </td>
                <td className="py-3 px-3.5 text-right text-xs text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totais.medido)}
                </td>
                <td className="py-3 px-3.5 text-right text-xs text-purple-600 dark:text-purple-400">
                  {formatCurrency(totais.saldoMedicao)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
