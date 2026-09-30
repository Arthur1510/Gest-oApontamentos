"use client";

import React, { useState, useMemo } from 'react';
import {
  Contrato,
  Medicao,
  Obra,
  Fornecedor,
} from '@/types/orcamento';
import { formatCurrency, formatPercent } from '@/lib/orcamento-utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search,
  Plus,
  Briefcase,
  Eye,
  Edit2,
  Trash2,
  PlusCircle,
  Building,
} from 'lucide-react';

interface ContratosTableProps {
  contratos: Contrato[];
  medicoes: Medicao[];
  obras: Obra[];
  fornecedores: Fornecedor[];
  filtroObra: string;
  setFiltroObra: (obra: string) => void;
  onNovoContrato: () => void;
  onEditarContrato: (contrato: Contrato) => void;
  onExcluirContrato: (id: string) => void;
  onVerMedicoesContrato: (contrato: Contrato) => void;
  onNovaMedicaoParaContrato: (contrato: Contrato) => void;
}

export function ContratosTable({
  contratos,
  medicoes,
  obras,
  fornecedores,
  filtroObra,
  setFiltroObra,
  onNovoContrato,
  onEditarContrato,
  onExcluirContrato,
  onVerMedicoesContrato,
  onNovaMedicaoParaContrato,
}: ContratosTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroFornecedor, setFiltroFornecedor] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<'Todos' | 'Projeto' | 'Legalização'>('Todos');

  // Contagem de medições por contrato
  const medicoesCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of medicoes) {
      map[m.contrato_id] = (map[m.contrato_id] || 0) + 1;
    }
    return map;
  }, [medicoes]);

  const countProjetos = useMemo(() => contratos.filter((c) => c.categoria === 'Projeto').length, [contratos]);
  const countLegalizacao = useMemo(() => contratos.filter((c) => c.categoria === 'Legalização').length, [contratos]);

  // Contratos filtrados
  const contratosFiltrados = useMemo(() => {
    return contratos.filter((c) => {
      if (filtroObra && c.obra !== filtroObra) return false;
      if (filtroFornecedor && c.empresa !== filtroFornecedor) return false;
      if (filtroCategoria !== 'Todos' && c.categoria !== filtroCategoria) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchEmpresa = c.empresa.toLowerCase().includes(q);
        const matchId = c.id.toLowerCase().includes(q);
        const matchSienge = c.num_sienge.toLowerCase().includes(q);
        const matchSub = c.subdisciplina.toLowerCase().includes(q);
        const matchObra = c.obra.toLowerCase().includes(q);
        if (!matchEmpresa && !matchId && !matchSienge && !matchSub && !matchObra) return false;
      }

      return true;
    });
  }, [contratos, filtroObra, filtroFornecedor, filtroCategoria, searchQuery]);

  // Totais
  const totais = useMemo(() => {
    let valorContrato = 0;
    let valorMedido = 0;
    let saldoAMedir = 0;

    for (const c of contratosFiltrados) {
      valorContrato += c.valor_contrato || 0;
      valorMedido += c.valor_medido || 0;
      saldoAMedir += c.saldo_a_medir || 0;
    }

    const pctGlobal = valorContrato > 0 ? valorMedido / valorContrato : 0;

    return {
      valorContrato,
      valorMedido,
      saldoAMedir,
      pctGlobal,
    };
  }, [contratosFiltrados]);

  return (
    <div className="space-y-4">
      {/* Barra de Filtros e Ação */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#072B3B] border border-slate-200 dark:border-[#0B384D] shadow-sm">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* Busca por texto */}
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por ID, empresa, nº Sienge, obra..."
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

          {/* Filtro Fornecedor */}
          <select
            value={filtroFornecedor}
            onChange={(e) => setFiltroFornecedor(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B384D] border border-slate-200 dark:border-[#0B384D] text-slate-800 dark:text-slate-100 h-9 focus:outline-none focus:ring-2 focus:ring-[#00A3C4]"
          >
            <option value="">🤝 Todos os Fornecedores</option>
            {fornecedores.map((f) => (
              <option key={f.id} value={f.fornecedor}>
                {f.fornecedor} ({f.tipo})
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
              Todos ({contratos.length})
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

          {(searchQuery || filtroObra || filtroFornecedor || filtroCategoria !== 'Todos') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setFiltroObra('');
                setFiltroFornecedor('');
                setFiltroCategoria('Todos');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 h-9"
            >
              Limpar
            </Button>
          )}
        </div>

        {/* Botão Novo Contrato */}
        <Button
          size="sm"
          onClick={onNovoContrato}
          className="bg-[#00A3C4] hover:bg-[#008EA9] text-white text-xs font-bold gap-1.5 h-9 rounded-xl shadow-xs"
        >
          <Plus className="h-4 w-4" /> Novo Contrato
        </Button>
      </div>

      {/* Tabela de Contratos */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#0B384D] bg-white dark:bg-[#072B3B] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-[#0B384D] text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-[#0B384D]">
              <tr>
                <th className="py-3 px-3.5">Contrato</th>
                <th className="py-3 px-3.5">Tipo</th>
                <th className="py-3 px-3.5">Nº Sienge</th>
                <th className="py-3 px-3.5">Empresa / Fornecedor</th>
                <th className="py-3 px-3.5">Obra</th>
                <th className="py-3 px-3.5">Disciplina</th>
                <th className="py-3 px-3.5">Subdisciplina</th>
                <th className="py-3 px-3.5 text-right">Valor Contrato</th>
                <th className="py-3 px-3.5 text-right">Valor Medido</th>
                <th className="py-3 px-3.5 text-right">Saldo a Medir</th>
                <th className="py-3 px-3.5 text-center min-w-[130px]">% Medido</th>
                <th className="py-3 px-3.5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#0B384D]/60 text-slate-700 dark:text-slate-200">
              {contratosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-10 text-center text-slate-400">
                    Nenhum contrato encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                contratosFiltrados.map((c) => {
                  const pct = c.percentual_medido || 0;
                  const countMed = medicoesCountMap[c.id] || 0;

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50 dark:hover:bg-[#0B384D]/30 transition-colors"
                    >
                      <td className="py-2.5 px-3.5 font-bold">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#0B384D] text-[#072B3B] dark:text-white font-mono text-[11px] border border-slate-200 dark:border-[#00A3C4]/30">
                          {c.id}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            c.categoria === 'Legalização'
                              ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                              : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {c.categoria || 'Projeto'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-slate-500 dark:text-slate-400">
                        {c.num_sienge || '-'}
                      </td>
                      <td className="py-2.5 px-3.5 font-bold text-slate-900 dark:text-white">
                        {c.empresa}
                      </td>
                      <td className="py-2.5 px-3.5 font-bold">
                        <span className="px-2 py-0.5 rounded-md bg-[#00A3C4]/15 text-[#008EA9] dark:text-[#00C4EB] text-[10px] font-extrabold">
                          {c.obra}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-300">
                        {c.disciplina}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-300">
                        {c.subdisciplina}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(c.valor_contrato)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(c.valor_medido)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-semibold text-purple-600 dark:text-purple-400">
                        {formatCurrency(c.saldo_a_medir)}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center justify-between w-full text-[10px] font-bold">
                            <span className={pct >= 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}>
                              {formatPercent(pct)}
                            </span>
                            <span className="text-[9px] text-slate-400">
                              {countMed} mediç{countMed === 1 ? 'ão' : 'ões'}
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-[#0B384D] h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                pct >= 1
                                  ? 'bg-emerald-500'
                                  : pct > 0.5
                                  ? 'bg-[#00A3C4]'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.round(pct * 100))}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onVerMedicoesContrato(c)}
                            title="Ver Medições do Contrato"
                            className="p-1 rounded-md text-slate-400 hover:text-[#00A3C4] hover:bg-slate-100 dark:hover:bg-[#0B384D] transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onNovaMedicaoParaContrato(c)}
                            title="Lançar Nova Medição"
                            className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                          >
                            <PlusCircle className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onEditarContrato(c)}
                            title="Editar Contrato"
                            className="p-1 rounded-md text-slate-400 hover:text-[#00A3C4] hover:bg-slate-100 dark:hover:bg-[#0B384D] transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onExcluirContrato(c.id)}
                            title="Excluir Contrato"
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
                <td colSpan={6} className="py-3 px-3.5 text-left uppercase tracking-wider text-xs">
                  Totais ({contratosFiltrados.length} contratos)
                </td>
                <td className="py-3 px-3.5 text-right text-xs">
                  {formatCurrency(totais.valorContrato)}
                </td>
                <td className="py-3 px-3.5 text-right text-xs text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totais.valorMedido)}
                </td>
                <td className="py-3 px-3.5 text-right text-xs text-purple-600 dark:text-purple-400">
                  {formatCurrency(totais.saldoAMedir)}
                </td>
                <td className="py-3 px-3.5 text-center text-xs font-bold text-[#00A3C4]">
                  {formatPercent(totais.pctGlobal)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
