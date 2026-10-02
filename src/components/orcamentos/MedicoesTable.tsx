"use client";

import React, { useState, useMemo } from 'react';
import {
  Medicao,
  Contrato,
  Obra,
  Fornecedor,
  StatusMedicao,
  STATUS_MEDICAO_OPCOES,
  STATUS_MEDICAO_COLORS,
} from '@/types/orcamento';
import { formatCurrency, formatPercent, formatDateBR, isMedicaoEmAtraso, getDiasAtraso } from '@/lib/orcamento-utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search,
  Plus,
  CheckCircle,
  CreditCard,
  Edit2,
  Trash2,
  Calendar,
  Building,
  Check,
  AlertTriangle,
  List,
  LayoutGrid,
  FileCheck,
} from 'lucide-react';

interface MedicoesTableProps {
  medicoes: Medicao[];
  contratos: Contrato[];
  obras: Obra[];
  fornecedores: Fornecedor[];
  filtroObra: string;
  setFiltroObra: (obra: string) => void;
  filtroFornecedor?: string;
  setFiltroFornecedor?: (fornecedor: string) => void;
  onNovaMedicao: () => void;
  onEditarMedicao: (medicao: Medicao) => void;
  onExcluirMedicao: (id: string) => void;
  onMudarStatusMedicao: (id: string, novoStatus: StatusMedicao, nf?: string, dataPagamento?: string) => void;
}

export function MedicoesTable({
  medicoes,
  contratos,
  obras,
  fornecedores,
  filtroObra,
  setFiltroObra,
  filtroFornecedor,
  setFiltroFornecedor,
  onNovaMedicao,
  onEditarMedicao,
  onExcluirMedicao,
  onMudarStatusMedicao,
}: MedicoesTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [localFiltroFornecedor, setLocalFiltroFornecedor] = useState<string>('');
  const filtroFornecedorAtivo = filtroFornecedor !== undefined ? filtroFornecedor : localFiltroFornecedor;
  const handleSetFiltroFornecedor = (forn: string) => {
    if (setFiltroFornecedor) {
      setFiltroFornecedor(forn);
    } else {
      setLocalFiltroFornecedor(forn);
    }
  };
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [filtroMes, setFiltroMes] = useState<string>('');
  const [filtroContrato, setFiltroContrato] = useState<string>('');
  const [filtroAtrasoApenas, setFiltroAtrasoApenas] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modais rápidos de pagamento inline
  const [pagamentoModalItem, setPagamentoModalItem] = useState<Medicao | null>(null);
  const [nfInput, setNfInput] = useState('');
  const [dataPagamentoInput, setDataPagamentoInput] = useState(new Date().toISOString().split('T')[0]);

  // Lista única de fornecedores para o filtro
  const fornecedoresOpcoes = useMemo(() => {
    const nomes = new Set<string>();
    fornecedores.forEach((f) => {
      if (f.fornecedor) nomes.add(f.fornecedor);
    });
    medicoes.forEach((m) => {
      if (m.empresa) nomes.add(m.empresa);
    });
    return Array.from(nomes).sort((a, b) => a.localeCompare(b));
  }, [fornecedores, medicoes]);

  // Contagem de medições em atraso no total recebido
  const countEmAtraso = useMemo(() => {
    return medicoes.filter((m) => {
      if (filtroObra && m.obra !== filtroObra) return false;
      if (filtroFornecedorAtivo && m.empresa !== filtroFornecedorAtivo) return false;
      return isMedicaoEmAtraso(m);
    }).length;
  }, [medicoes, filtroObra, filtroFornecedorAtivo]);

  // Lista única de meses para o filtro
  const mesesUnicos = useMemo(() => {
    const set = new Set<string>();
    medicoes.forEach((m) => {
      if (m.mes_competencia) set.add(m.mes_competencia);
    });
    return Array.from(set).sort();
  }, [medicoes]);

  // Mapa de contratos indexado por ID para consultas rápidas
  const contratosMap = useMemo(() => {
    const map: Record<string, Contrato> = {};
    contratos.forEach((c) => {
      map[c.id] = c;
    });
    return map;
  }, [contratos]);

  // Medições filtradas
  const medicoesFiltradas = useMemo(() => {
    return medicoes.filter((m) => {
      if (filtroObra && m.obra !== filtroObra) return false;
      if (filtroFornecedorAtivo && m.empresa !== filtroFornecedorAtivo) return false;
      if (filtroStatus && m.status !== filtroStatus) return false;
      if (filtroMes && m.mes_competencia !== filtroMes) return false;
      if (filtroContrato && m.contrato_id !== filtroContrato) return false;
      if (filtroAtrasoApenas && !isMedicaoEmAtraso(m)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchEmpresa = (m.empresa || '').toLowerCase().includes(q);
        const matchId = (m.id || '').toLowerCase().includes(q);
        const matchContrato = (m.contrato_id || '').toLowerCase().includes(q);
        const matchEtapa = (m.etapa || '').toLowerCase().includes(q);
        const matchNf = (m.nf || '').toLowerCase().includes(q);
        if (!matchEmpresa && !matchId && !matchContrato && !matchEtapa && !matchNf) return false;
      }

      return true;
    });
  }, [medicoes, filtroObra, filtroFornecedorAtivo, filtroStatus, filtroMes, filtroContrato, filtroAtrasoApenas, searchQuery]);

  // Totais
  const totais = useMemo(() => {
    let totalValor = 0;
    let pago = 0;
    let aPagar = 0;
    let medido = 0;
    let aMedir = 0;
    let totalAtraso = 0;
    let countAtraso = 0;

    for (const m of medicoesFiltradas) {
      totalValor += m.valor_medicao || 0;
      if (m.status === 'Pago') pago += m.valor_medicao || 0;
      else if (m.status === 'A Pagar') aPagar += m.valor_medicao || 0;
      else if (m.status === 'Medido') medido += m.valor_medicao || 0;
      else if (m.status === 'A Medir') aMedir += m.valor_medicao || 0;

      if (isMedicaoEmAtraso(m)) {
        totalAtraso += m.valor_medicao || 0;
        countAtraso++;
      }
    }

    return { totalValor, pago, aPagar, medido, aMedir, totalAtraso, countAtraso };
  }, [medicoesFiltradas]);

  const handleConfirmarPagamento = (status: 'Pago' | 'A Pagar' = 'Pago') => {
    if (pagamentoModalItem) {
      onMudarStatusMedicao(pagamentoModalItem.id, status, nfInput, dataPagamentoInput);
      setPagamentoModalItem(null);
      setNfInput('');
    }
  };

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
              placeholder="Buscar ID, etapa, empresa, NF..."
              className="pl-9 text-xs h-9 rounded-xl bg-slate-50 dark:bg-[#0B384D] border-slate-200 dark:border-[#0B384D]"
            />
          </div>

          {/* Filtro Obra */}
          <select
            value={filtroObra}
            onChange={(e) => setFiltroObra(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B384D] border border-slate-200 dark:border-[#0B384D] text-slate-800 dark:text-slate-100 h-9 min-w-[140px] max-w-[200px] focus:outline-none focus:ring-2 focus:ring-[#00A3C4] truncate"
          >
            <option value="">🏢 Obras</option>
            {obras.map((o) => (
              <option key={o.id} value={o.codigo}>
                {o.codigo} - {o.nome}
              </option>
            ))}
          </select>

          {/* Filtro Fornecedor */}
          <select
            value={filtroFornecedorAtivo}
            onChange={(e) => handleSetFiltroFornecedor(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B384D] border border-slate-200 dark:border-[#0B384D] text-slate-800 dark:text-slate-100 h-9 min-w-[140px] max-w-[200px] focus:outline-none focus:ring-2 focus:ring-[#00A3C4] truncate"
          >
            <option value="">🤝 Fornecedores</option>
            {fornecedoresOpcoes.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>

          {/* Filtro Status */}
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B384D] border border-slate-200 dark:border-[#0B384D] text-slate-800 dark:text-slate-100 h-9 min-w-[130px] max-w-[170px] focus:outline-none focus:ring-2 focus:ring-[#00A3C4] truncate"
          >
            <option value="">📋 Status</option>
            {STATUS_MEDICAO_OPCOES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Filtro Mês */}
          {mesesUnicos.length > 0 && (
            <select
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B384D] border border-slate-200 dark:border-[#0B384D] text-slate-800 dark:text-slate-100 h-9 min-w-[120px] max-w-[150px] focus:outline-none focus:ring-2 focus:ring-[#00A3C4] truncate"
            >
              <option value="">📅 Meses</option>
              {mesesUnicos.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          )}

          {/* Filtro Rápido: Apenas Em Atraso */}
          {countEmAtraso > 0 && (
            <button
              type="button"
              onClick={() => setFiltroAtrasoApenas(!filtroAtrasoApenas)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all h-9 border shrink-0 ${
                filtroAtrasoApenas
                  ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                  : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-300/60 hover:bg-amber-100 dark:hover:bg-amber-900/40'
              }`}
              title="Exibir apenas medições vencidas"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Em Atraso ({countEmAtraso})</span>
            </button>
          )}

          {(searchQuery || filtroObra || filtroFornecedorAtivo || filtroStatus || filtroMes || filtroContrato || filtroAtrasoApenas) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setFiltroObra('');
                handleSetFiltroFornecedor('');
                setFiltroStatus('');
                setFiltroMes('');
                setFiltroContrato('');
                setFiltroAtrasoApenas(false);
              }}
              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 h-9 px-2.5"
            >
              Limpar
            </Button>
          )}
        </div>

        {/* Toggle de Visualização & Botão Nova Medição */}
        <div className="flex items-center gap-2 self-end xl:self-center shrink-0">
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-[#0B384D] p-0.5 border border-slate-200 dark:border-[#0B384D] h-9">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="Visualização em Tabela"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-[#072B3B] text-[#00A3C4] shadow-2xs'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              title="Visualização em Cards"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-[#072B3B] text-[#00A3C4] shadow-2xs'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          <Button
            size="sm"
            onClick={onNovaMedicao}
            className="bg-[#00A3C4] hover:bg-[#008EA9] text-white text-xs font-bold gap-1.5 h-9 rounded-xl shadow-xs"
          >
            <Plus className="h-4 w-4" /> Nova Medição
          </Button>
        </div>
      </div>

      {/* CASO LISTA VAZIA */}
      {medicoesFiltradas.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-[#0B384D] bg-white dark:bg-[#072B3B] space-y-3">
          <div className="p-3 rounded-2xl bg-[#00A3C4]/15 text-[#00A3C4] dark:text-[#00C4EB] w-fit mx-auto">
            <FileCheck className="h-6 w-6" />
          </div>
          <h4 className="font-extrabold text-slate-800 dark:text-white text-base">
            Nenhuma medição encontrada
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {medicoes.length === 0
              ? 'A base de medições está limpa para novos lançamentos. Clique abaixo para registrar a primeira medição ou etapa de contrato.'
              : 'Nenhuma medição coincide com os filtros selecionados.'}
          </p>
          <Button
            size="sm"
            onClick={onNovaMedicao}
            className="bg-[#00A3C4] hover:bg-[#008EA9] text-white text-xs font-bold gap-1.5 h-9 rounded-xl"
          >
            <Plus className="h-4 w-4" /> Lançar Primeira Medição
          </Button>
        </div>
      ) : viewMode === 'cards' ? (
        /* VISUALIZAÇÃO EM CARDS RESPONSIVOS */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {medicoesFiltradas.map((m) => {
            const statusColor = STATUS_MEDICAO_COLORS[m.status] || {
              bg: 'bg-slate-100',
              text: 'text-slate-600',
              border: 'border-slate-300',
            };
            const isAtraso = isMedicaoEmAtraso(m);
            const diasAtraso = isAtraso ? getDiasAtraso(m) : 0;

            return (
              <div
                key={m.id}
                className={`p-4 rounded-2xl border bg-white dark:bg-[#072B3B] shadow-sm flex flex-col justify-between transition-all hover:border-[#00A3C4]/40 ${
                  isAtraso ? 'border-amber-400/50 bg-amber-50/15 dark:bg-amber-950/10' : 'border-slate-200 dark:border-[#0B384D]'
                }`}
              >
                <div className="space-y-3">
                  {/* Top badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#0B384D] text-[#072B3B] dark:text-white font-mono text-[10px] font-bold">
                        {m.id}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {m.contrato_id}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-[#00A3C4]/15 text-[#008EA9] dark:text-[#00C4EB] text-[10px] font-extrabold">
                        {m.obra}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}>
                        {m.status}
                      </span>
                    </div>
                  </div>

                  {/* Nome da Empresa e Etapa */}
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base leading-snug break-words">
                      {m.empresa}
                    </h4>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-1 break-words leading-tight">
                      {m.etapa}
                    </p>
                  </div>

                  {/* Valores & % */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#0B384D]/40">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Valor da Medição</span>
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white font-mono block mt-0.5">
                        {formatCurrency(m.valor_medicao)}
                      </span>
                    </div>
                    {(() => {
                      const c = contratosMap[m.contrato_id];
                      const pctExibido = (m.percentual && m.percentual > 0)
                        ? m.percentual
                        : (c && c.valor_contrato > 0 ? (m.valor_medicao / c.valor_contrato) : 0);
                      return (
                        <div className="text-right">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">% Marco</span>
                          <span
                            className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono block mt-0.5 cursor-help"
                            title={
                              c
                                ? `Contrato Vigente: ${formatCurrency(c.valor_contrato)}${
                                    (c.valor_aditivos || 0) !== 0
                                      ? ` (Aditivos: ${formatCurrency(c.valor_aditivos || 0)})`
                                      : ''
                                  }`
                                : undefined
                            }
                          >
                            {formatPercent(pctExibido)}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Datas e NF */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <div>
                      <span className="block text-[10px] text-slate-400">Previsão:</span>
                      <span className={isAtraso ? 'text-amber-600 dark:text-amber-400 font-bold' : 'font-medium'}>
                        {formatDateBR(m.data_prevista)}
                      </span>
                      {isAtraso && (
                        <span className="block text-[9px] font-bold text-amber-600">
                          {diasAtraso > 0 ? `${diasAtraso}d atraso` : 'Atrasada'}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400">Medição / NF:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {m.data_medicao ? formatDateBR(m.data_medicao) : '-'} {m.nf ? `(NF: ${m.nf})` : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ações do Card */}
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-[#0B384D] flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    {m.status === 'A Medir' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onMudarStatusMedicao(m.id, 'Medido')}
                        className="h-7 text-xs font-bold text-cyan-600 px-2 rounded-lg gap-1"
                      >
                        <Check className="h-3.5 w-3.5" /> Medir
                      </Button>
                    )}
                    {(m.status === 'Medido' || m.status === 'A Medir' || m.status === 'A Pagar') && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setPagamentoModalItem(m);
                          setNfInput(m.nf || '');
                          setDataPagamentoInput(m.data_pagamento || new Date().toISOString().split('T')[0]);
                        }}
                        className={`h-7 text-xs font-bold px-2 rounded-lg gap-1 ${
                          m.status === 'A Pagar'
                            ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/20'
                            : 'text-emerald-600'
                        }`}
                      >
                        <CreditCard className="h-3.5 w-3.5" /> {m.status === 'A Pagar' ? 'Quitar' : 'Pagar'}
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => onEditarMedicao(m)}
                      title="Editar Medição"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#00A3C4] hover:bg-slate-100 dark:hover:bg-[#0B384D] transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onExcluirMedicao(m.id)}
                      title="Excluir Medição"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VISUALIZAÇÃO EM TABELA RESPONSIVA */
        <div className="rounded-2xl border border-slate-200 dark:border-[#0B384D] bg-white dark:bg-[#072B3B] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-[#0B384D] text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-[#0B384D]">
                <tr>
                  <th className="py-3 px-3">ID</th>
                  <th className="py-3 px-3">Contrato</th>
                  <th className="py-3 px-3">Empresa</th>
                  <th className="py-3 px-3">Obra</th>
                  <th className="py-3 px-3">Etapa / Marco</th>
                  <th className="py-3 px-3 text-center">% Etapa</th>
                  <th className="py-3 px-3 text-right">Valor Medição</th>
                  <th className="py-3 px-3">Data Prevista</th>
                  <th className="py-3 px-3">Data Medição</th>
                  <th className="py-3 px-3 text-center">Mês</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3">NF</th>
                  <th className="py-3 px-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#0B384D]/60 text-slate-700 dark:text-slate-200">
                {medicoesFiltradas.map((m) => {
                  const statusColor = STATUS_MEDICAO_COLORS[m.status] || {
                    bg: 'bg-slate-100',
                    text: 'text-slate-600',
                    border: 'border-slate-300',
                  };
                  const isAtraso = isMedicaoEmAtraso(m);
                  const diasAtraso = isAtraso ? getDiasAtraso(m) : 0;

                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-slate-50 dark:hover:bg-[#0B384D]/30 transition-colors ${
                        isAtraso ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#0B384D] text-[#072B3B] dark:text-white font-mono text-[10px] border border-slate-200 dark:border-[#00A3C4]/30">
                          {m.id}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {m.contrato_id}
                      </td>

                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white max-w-[180px] break-words">
                        {m.empresa}
                      </td>

                      <td className="py-2.5 px-3 font-bold whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-[#00A3C4]/15 text-[#008EA9] dark:text-[#00C4EB] text-[10px] font-extrabold">
                          {m.obra}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-200 max-w-[220px] break-words">
                        {m.etapa}
                      </td>

                      {(() => {
                        const c = contratosMap[m.contrato_id];
                        const pctExibido = (m.percentual && m.percentual > 0)
                          ? m.percentual
                          : (c && c.valor_contrato > 0 ? (m.valor_medicao / c.valor_contrato) : 0);
                        return (
                          <td className="py-2.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap">
                            <span
                              className="cursor-help"
                              title={
                                c
                                  ? `Contrato Vigente: ${formatCurrency(c.valor_contrato)}${
                                      (c.valor_aditivos || 0) !== 0
                                        ? ` (Original: ${formatCurrency(c.valor_original ?? c.valor_contrato)} | Aditivos: ${formatCurrency(c.valor_aditivos || 0)})`
                                        : ''
                                    }`
                                  : undefined
                              }
                            >
                              {formatPercent(pctExibido)}
                            </span>
                          </td>
                        );
                      })()}

                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white font-mono whitespace-nowrap">
                        {formatCurrency(m.valor_medicao)}
                      </td>

                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className={isAtraso ? 'text-amber-700 dark:text-amber-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}>
                            {formatDateBR(m.data_prevista)}
                          </span>
                          {isAtraso && (
                            <span
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 w-fit"
                              title={`Vencida há ${diasAtraso} dias`}
                            >
                              <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
                              {diasAtraso > 0 ? `${diasAtraso}d atraso` : 'Em atraso'}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {formatDateBR(m.data_medicao)}
                      </td>

                      <td className="py-2.5 px-3 text-center font-semibold whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#0B384D] text-slate-600 dark:text-slate-300 text-[10px]">
                          {m.mes_competencia || '-'}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}
                        >
                          {m.status}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {m.nf || '-'}
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {m.status === 'A Medir' && (
                            <button
                              onClick={() => onMudarStatusMedicao(m.id, 'Medido')}
                              title="Marcar como Medido"
                              className="p-1 rounded-md text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 transition-colors"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {(m.status === 'Medido' || m.status === 'A Medir' || m.status === 'A Pagar') && (
                            <button
                              onClick={() => {
                                setPagamentoModalItem(m);
                                setNfInput(m.nf || '');
                                setDataPagamentoInput(m.data_pagamento || new Date().toISOString().split('T')[0]);
                              }}
                              title={m.status === 'A Pagar' ? 'Confirmar Quitação (Pago)' : 'Registrar Pagamento / Nota Fiscal'}
                              className={`p-1 rounded-md transition-colors ${
                                m.status === 'A Pagar'
                                  ? 'text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
                                  : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                              }`}
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onEditarMedicao(m)}
                            title="Editar Medição"
                            className="p-1 rounded-md text-slate-400 hover:text-[#00A3C4] hover:bg-slate-100 dark:hover:bg-[#0B384D] transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onExcluirMedicao(m.id)}
                            title="Excluir Medição"
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Linha de Totais */}
              <tfoot className="bg-slate-100/90 dark:bg-[#072432] text-slate-900 dark:text-white font-extrabold border-t-2 border-slate-300 dark:border-[#00A3C4]/40">
                <tr>
                  <td colSpan={6} className="py-3 px-3 text-left uppercase tracking-wider text-xs">
                    Totais ({medicoesFiltradas.length} medições)
                  </td>
                  <td className="py-3 px-3 text-right text-xs font-mono whitespace-nowrap">
                    {formatCurrency(totais.totalValor)}
                  </td>
                  <td colSpan={3} className="py-3 px-3 text-right text-xs text-slate-500 dark:text-slate-400">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap">
                      Pago: {formatCurrency(totais.pago)}
                    </span>
                    {' | '}
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold whitespace-nowrap">
                      A Pagar: {formatCurrency(totais.aPagar)}
                    </span>
                    {' | '}
                    <span className="text-cyan-600 dark:text-cyan-400 font-bold whitespace-nowrap">
                      Medido: {formatCurrency(totais.medido)}
                    </span>
                    {' | '}
                    <span className="text-amber-600 dark:text-amber-400 font-bold whitespace-nowrap">
                      A Medir: {formatCurrency(totais.aMedir)}
                    </span>
                    {totais.countAtraso > 0 && (
                      <span className="text-rose-600 dark:text-rose-400 font-bold block sm:inline sm:ml-2 whitespace-nowrap">
                        {' | '}⚠️ Em Atraso: {formatCurrency(totais.totalAtraso)} ({totais.countAtraso})
                      </span>
                    )}
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Modal Rápido de Confirmação de Pagamento */}
      {pagamentoModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-0">
          <div className="bg-white dark:bg-[#072B3B] rounded-2xl border border-slate-200 dark:border-[#0B384D] p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Registrar Pagamento
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 break-words">
                  {pagamentoModalItem.id} - {pagamentoModalItem.empresa} ({formatCurrency(pagamentoModalItem.valor_medicao)})
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Número da Nota Fiscal (NF)
                </label>
                <Input
                  value={nfInput}
                  onChange={(e) => setNfInput(e.target.value)}
                  placeholder="Ex: 593"
                  className="text-xs h-9 rounded-xl bg-slate-50 dark:bg-[#0B384D]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Data de Pagamento
                </label>
                <Input
                  type="date"
                  value={dataPagamentoInput}
                  onChange={(e) => setDataPagamentoInput(e.target.value)}
                  className="text-xs h-9 rounded-xl bg-slate-50 dark:bg-[#0B384D]"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#0B384D]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagamentoModalItem(null)}
                className="text-xs h-9 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={() => handleConfirmarPagamento('A Pagar')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold h-9 rounded-xl shadow-xs"
                title="Salva a data de pagamento prevista e define o status como A Pagar"
              >
                Salvar como A Pagar
              </Button>
              <Button
                size="sm"
                onClick={() => handleConfirmarPagamento('Pago')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-9 rounded-xl shadow-xs"
                title="Confirma a quitação e define o status como Pago"
              >
                Confirmar Pagamento (Pago)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
