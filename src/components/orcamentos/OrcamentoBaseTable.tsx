"use client";

import React, { useState, useMemo } from 'react';
import {
  ItemOrcamento,
  Obra,
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
  Building,
} from 'lucide-react';

interface OrcamentoBaseTableProps {
  orcamentos: ItemOrcamento[];
  obras: Obra[];
  filtroObra: string;
  setFiltroObra: (obra: string) => void;
  onNovoItem: () => void;
  onEditarItem: (item: ItemOrcamento) => void;
  onExcluirItem: (id: string) => void;
}

export function OrcamentoBaseTable({
  orcamentos,
  obras,
  filtroObra,
  setFiltroObra,
  onNovoItem,
  onEditarItem,
  onExcluirItem,
}: OrcamentoBaseTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [filtroDisciplina, setFiltroDisciplina] = useState<string>('');
  const [filtroCategoria, setFiltroCategoria] = useState<'Todos' | 'Projeto' | 'Legalização'>('Todos');

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
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#072B3B] border border-slate-200 dark:border-[#0B384D] shadow-sm">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* Busca por texto */}
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por disciplina ou subdisciplina..."
              className="pl-9 text-xs h-9 rounded-xl bg-slate-50 dark:bg-[#0B384D] border-slate-200 dark:border-[#0B384D]"
            />
          </div>

          {/* Filtro Obra */}
          <select
            value={filtroObra}
            onChange={(e) => setFiltroObra(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B384D] border border-slate-200 dark:border-[#0B384D] text-slate-800 dark:text-slate-100 h-9 focus:outline-none focus:ring-2 focus:ring-[#00A3C4]"
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
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B384D] border border-slate-200 dark:border-[#0B384D] text-slate-800 dark:text-slate-100 h-9 focus:outline-none focus:ring-2 focus:ring-[#00A3C4]"
          >
            <option value="">📐 Todas as Disciplinas</option>
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
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B384D] border border-slate-200 dark:border-[#0B384D] text-slate-800 dark:text-slate-100 h-9 focus:outline-none focus:ring-2 focus:ring-[#00A3C4]"
          >
            <option value="">📋 Todos os Status</option>
            {STATUS_ORCAMENTO_OPCOES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Filtro Categoria: Projetos vs Legalização */}
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-[#0B384D] p-1 border border-slate-200 dark:border-[#0B384D]">
            <button
              type="button"
              onClick={() => setFiltroCategoria('Todos')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
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
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
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
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                filtroCategoria === 'Legalização'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Legalização ({countLegalizacao})
            </button>
          </div>

          {(searchQuery || filtroObra || filtroDisciplina || filtroStatus || filtroCategoria !== 'Todos') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setFiltroObra('');
                setFiltroDisciplina('');
                setFiltroStatus('');
                setFiltroCategoria('Todos');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 h-9"
            >
              Limpar
            </Button>
          )}
        </div>

        {/* Botão Adicionar Item */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={onNovoItem}
            className="bg-[#00A3C4] hover:bg-[#008EA9] text-white text-xs font-bold gap-1.5 h-9 rounded-xl shadow-xs"
          >
            <Plus className="h-4 w-4" /> Novo Item de Orçamento
          </Button>
        </div>
      </div>

      {/* Tabela de Orçamentos */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#0B384D] bg-white dark:bg-[#072B3B] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-[#0B384D] text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-[#0B384D]">
              <tr>
                <th className="py-3 px-3.5">Obra</th>
                <th className="py-3 px-3.5">Tipo</th>
                <th className="py-3 px-3.5">Disciplina</th>
                <th className="py-3 px-3.5">Subdisciplina</th>
                <th className="py-3 px-3.5 text-right">Orçamento Base</th>
                <th className="py-3 px-3.5 text-right">Valor Contratado</th>
                <th className="py-3 px-3.5 text-right">Saldo a Contratar</th>
                <th className="py-3 px-3.5 text-right">Valor Medido</th>
                <th className="py-3 px-3.5 text-right">Saldo Medição</th>
                <th className="py-3 px-3.5 text-center">Status</th>
                <th className="py-3 px-3.5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#0B384D]/60 text-slate-700 dark:text-slate-200">
              {orcamentosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-400">
                    Nenhum item de orçamento encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                orcamentosFiltrados.map((item) => {
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
                      <td className="py-2.5 px-3.5 font-bold">
                        <span className="px-2 py-0.5 rounded-md bg-[#00A3C4]/15 text-[#008EA9] dark:text-[#00C4EB] text-[10px] font-extrabold">
                          {item.obra}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5">
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
                      <td className="py-2.5 px-3.5 font-semibold text-slate-900 dark:text-white">
                        {item.disciplina}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-300">
                        {item.subdisciplina}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.orcamento_base)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-semibold text-[#008EA9] dark:text-[#00C4EB]">
                        {formatCurrency(item.valor_contratado)}
                      </td>
                      <td
                        className={`py-2.5 px-3.5 text-right font-semibold ${
                          item.saldo_a_contratar < 0
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {formatCurrency(item.saldo_a_contratar)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(item.valor_medido)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-semibold text-purple-600 dark:text-purple-400">
                        {formatCurrency(item.saldo_medicao)}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}
                        >
                          {item.status}
                        </span>
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
