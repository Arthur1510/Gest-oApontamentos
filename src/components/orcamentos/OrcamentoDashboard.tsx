"use client";

import React, { useMemo, useState } from 'react';
import {
  ItemOrcamento,
  Contrato,
  Medicao,
  Obra,
  Fornecedor,
} from '@/types/orcamento';
import {
  formatCurrency,
  formatCurrencyShort,
  formatPercent,
  calculateCurvaDesembolso,
  calculateKpis,
  calculateJanela306090,
  calculateConsolidadoDisciplinas,
  calculateConsolidadoContratos,
  getObraLabel,
  getObraStatus,
  CriterioCurvaS,
} from '@/lib/orcamento-utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Layers,
  ChevronDown,
  ChevronUp,
  Building,
  AlertTriangle,
  Maximize2,
  Minimize2,
  FilePlus2,
} from 'lucide-react';

interface OrcamentoDashboardProps {
  orcamentos: ItemOrcamento[];
  contratos: Contrato[];
  medicoes: Medicao[];
  obras: Obra[];
  fornecedores: Fornecedor[];
  filtroObra: string;
  setFiltroObra: (obra: string) => void;
  filtroFornecedor: string;
  setFiltroFornecedor: (fornecedor: string) => void;
  onNavigateTab: (tab: string) => void;
}

export function OrcamentoDashboard({
  orcamentos,
  contratos,
  medicoes,
  obras,
  fornecedores,
  filtroObra,
  setFiltroObra,
  filtroFornecedor,
  setFiltroFornecedor,
  onNavigateTab,
}: OrcamentoDashboardProps) {
  const [showTabelaCurva, setShowTabelaCurva] = useState(false);
  const [criterioCurva, setCriterioCurva] = useState<CriterioCurvaS>('desembolso');
  const [filtroCategoria, setFiltroCategoria] = useState<'Todos' | 'Projeto' | 'Legalização'>('Todos');
  const [ordemDisciplinas, setOrdemDisciplinas] = useState<'valor' | 'alfabetica' | 'saldo'>('valor');
  const [ordemContratos, setOrdemContratos] = useState<'valor' | 'alfabetica' | 'saldo'>('valor');

  // Estados individuais de expansão de cada card e seção (permite aumentar qualquer card sob demanda)
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const toggleExpand = (key: string) => {
    setExpandedCards((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const catParam = filtroCategoria === 'Todos' ? null : filtroCategoria;
  const statusObraSelecionada = filtroObra ? getObraStatus(filtroObra, obras) : null;

  // KPIs consolidados
  const kpis = useMemo(() => {
    return calculateKpis(
      orcamentos,
      contratos,
      medicoes,
      filtroObra || null,
      catParam,
      obras
    );
  }, [orcamentos, contratos, medicoes, filtroObra, catParam, obras]);

  // Relação 30 / 60 / 90 dias limpa
  const janela306090 = useMemo(() => {
    return calculateJanela306090(
      medicoes,
      contratos,
      filtroObra || null,
      filtroFornecedor || null,
      catParam,
      undefined,
      obras
    );
  }, [medicoes, contratos, filtroObra, filtroFornecedor, catParam, obras]);

  // Consolidação por Disciplina (Barras de Progresso) + Ordenação Selecionada
  const consolidadoDisciplinas = useMemo(() => {
    const base = calculateConsolidadoDisciplinas(
      orcamentos,
      filtroObra || null,
      catParam,
      obras
    );
    const list = [...base];
    if (ordemDisciplinas === 'alfabetica') {
      return list.sort((a, b) => a.disciplina.localeCompare(b.disciplina, 'pt-BR', { sensitivity: 'base' }));
    }
    if (ordemDisciplinas === 'saldo') {
      return list.sort((a, b) => b.faltaContratar - a.faltaContratar || b.totalPrevisto - a.totalPrevisto);
    }
    return list.sort((a, b) => b.totalPrevisto - a.totalPrevisto);
  }, [orcamentos, filtroObra, catParam, obras, ordemDisciplinas]);

  // Consolidação dos Contratos (Barras de Progresso) + Ordenação Selecionada
  const consolidadoContratos = useMemo(() => {
    const base = calculateConsolidadoContratos(
      contratos,
      medicoes,
      filtroObra || null,
      filtroFornecedor || null,
      catParam,
      orcamentos,
      obras
    );
    const list = [...base];
    if (ordemContratos === 'alfabetica') {
      return list.sort(
        (a, b) =>
          a.empresa.localeCompare(b.empresa, 'pt-BR', { sensitivity: 'base' }) ||
          a.disciplina.localeCompare(b.disciplina, 'pt-BR', { sensitivity: 'base' })
      );
    }
    if (ordemContratos === 'saldo') {
      return list.sort((a, b) => b.valorAMedir - a.valorAMedir || b.valorContrato - a.valorContrato);
    }
    return list.sort((a, b) => b.valorContrato - a.valorContrato);
  }, [contratos, medicoes, filtroObra, filtroFornecedor, catParam, orcamentos, obras, ordemContratos]);

  // Curva de Desembolso Mês a Mês
  const curvaPontos = useMemo(() => {
    return calculateCurvaDesembolso(
      medicoes,
      filtroObra || null,
      filtroFornecedor || null,
      contratos,
      catParam,
      criterioCurva,
      obras
    );
  }, [medicoes, filtroObra, filtroFornecedor, contratos, catParam, criterioCurva, obras]);

  // Totais da Curva S
  const totaisCurva = useMemo(() => {
    let pago = 0;
    let aPagar = 0;
    let aMedir = 0;
    let realizado = 0;
    let previsto = 0;
    let total = 0;
    for (const p of curvaPontos) {
      pago += p.pago || 0;
      aPagar += p.aPagar || 0;
      aMedir += p.aMedir || 0;
      realizado += p.realizado || 0;
      previsto += p.previsto || 0;
      total += p.total || 0;
    }
    return { pago, aPagar, aMedir, realizado, previsto, total };
  }, [curvaPontos]);

  // Base de contratos filtrada por critérios exceto categoria
  const contratosBase = useMemo(() => {
    return contratos.filter((c) => {
      if (filtroObra && c.obra !== filtroObra) return false;
      if (filtroFornecedor && c.empresa !== filtroFornecedor) return false;
      return true;
    });
  }, [contratos, filtroObra, filtroFornecedor]);

  const countTodos = contratosBase.length;
  const countProjetos = useMemo(() => contratosBase.filter((c) => c.categoria === 'Projeto').length, [contratosBase]);
  const countLegalizacao = useMemo(() => contratosBase.filter((c) => c.categoria === 'Legalização').length, [contratosBase]);

  // Proporções visuais para as barras dos cards principais (Contratado Base + Economia ou A Contratar + Suspenso + Desvio em vermelho)
  const estourouProjecaoKpi = kpis.diferencaOrcamento > 1 || kpis.diferencaContratados > 1;
  const valorEstouroKpi = estourouProjecaoKpi
    ? Math.max(0, kpis.diferencaOrcamento > 1 ? kpis.diferencaOrcamento : kpis.diferencaContratados)
    : 0;
  const economizouKpi = !estourouProjecaoKpi && (kpis.diferencaOrcamento < -1 || kpis.diferencaContratados < -1);
  const economiaContratadosKpi = economizouKpi
    ? Math.abs(kpis.diferencaOrcamento < -1 ? kpis.diferencaOrcamento : kpis.diferencaContratados)
    : 0;
  const contratadoBaseKpi = estourouProjecaoKpi
    ? Math.max(0, kpis.totalContratado - valorEstouroKpi)
    : kpis.totalContratado;
  const refMaxKpi = Math.max(
    kpis.totalOrcado,
    contratadoBaseKpi + economiaContratadosKpi + kpis.faltaContratar + kpis.faltaContratarPausado + valorEstouroKpi,
    1
  );
  const pctContratadoBarra = Math.min(100, (contratadoBaseKpi / refMaxKpi) * 100);
  const pctEconomiaBarra = Math.min(100 - pctContratadoBarra, (economiaContratadosKpi / refMaxKpi) * 100);
  const pctFaltaContratarBarra = Math.min(
    100 - pctContratadoBarra - pctEconomiaBarra,
    (kpis.faltaContratar / refMaxKpi) * 100
  );
  const pctFaltaPausadoBarra = Math.min(
    100 - pctContratadoBarra - pctEconomiaBarra - pctFaltaContratarBarra,
    (kpis.faltaContratarPausado / refMaxKpi) * 100
  );
  const pctDesvioBarra = Math.min(
    100 - pctContratadoBarra - pctEconomiaBarra - pctFaltaContratarBarra - pctFaltaPausadoBarra,
    (valorEstouroKpi / refMaxKpi) * 100
  );
  const pctMedidoBarra = kpis.totalContratado > 0 ? Math.min(100, (kpis.totalMedido / kpis.totalContratado) * 100) : 0;
  const pctAMedirBarra = kpis.totalContratado > 0 ? Math.min(100, (kpis.saldoAMedir / kpis.totalContratado) * 100) : 0;
  const pctPausadoBarra = kpis.totalContratado > 0
    ? Math.min(100 - pctAMedirBarra, (kpis.saldoPausado / kpis.totalContratado) * 100)
    : 0;
  const pctADistratarBarra = kpis.totalContratado > 0
    ? Math.min(100 - pctAMedirBarra - pctPausadoBarra, (kpis.saldoADistratar / kpis.totalContratado) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* 1. BARRA DE FILTROS RÁPIDOS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#072B3B] border border-slate-200 dark:border-[#0B384D] shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider pr-1">
            <Filter className="h-3.5 w-3.5 text-[#00A3C4]" />
            <span>Filtros:</span>
          </div>

          {/* Filtro Obra */}
          <select
            value={filtroObra}
            onChange={(e) => setFiltroObra(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B384D] border border-slate-200 dark:border-[#0B384D] text-slate-800 dark:text-slate-100 h-9 min-w-[160px] max-w-[220px] focus:outline-none focus:ring-2 focus:ring-[#00A3C4] truncate"
          >
            <option value="">🏢 Todas as Obras ({obras.length})</option>
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
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B384D] border border-slate-200 dark:border-[#0B384D] text-slate-800 dark:text-slate-100 h-9 min-w-[160px] max-w-[220px] focus:outline-none focus:ring-2 focus:ring-[#00A3C4] truncate"
          >
            <option value="">🤝 Todos os Fornecedores</option>
            {fornecedores.map((f) => (
              <option key={f.id} value={f.fornecedor}>
                {f.fornecedor} ({f.tipo})
              </option>
            ))}
          </select>

          {/* Filtro Categoria: Projetos vs Legalização */}
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-[#0B384D] p-0.5 border border-slate-200 dark:border-[#0B384D] h-9">
            <button
              type="button"
              onClick={() => setFiltroCategoria('Todos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filtroCategoria === 'Todos'
                  ? 'bg-white dark:bg-[#072B3B] text-[#072B3B] dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Todos ({countTodos})
            </button>
            <button
              type="button"
              onClick={() => setFiltroCategoria('Projeto')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filtroCategoria === 'Legalização'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Legalização ({countLegalizacao})
            </button>
          </div>

          {(filtroObra || filtroFornecedor || filtroCategoria !== 'Todos') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFiltroObra('');
                setFiltroFornecedor('');
                setFiltroCategoria('Todos');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 h-9 px-2.5"
            >
              Limpar
            </Button>
          )}
        </div>

        {filtroObra && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00A3C4]/10 text-[#008EA9] dark:text-[#00C4EB] text-xs font-bold border border-[#00A3C4]/30 h-9 shrink-0">
            <Building className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate max-w-xs">{getObraLabel(filtroObra, obras)}</span>
          </div>
        )}
      </div>

      {/* 2. OS 4 CARDS ESSENCIAIS (LIMPOS + BOTÃO INDIVIDUAL DE AUMENTAR) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
        {/* Card 1: Já Contratado */}
        <Card
          className={`flex flex-col justify-between border-slate-200 dark:border-[#0B384D] bg-white dark:bg-[#072B3B] hover:shadow-md transition-all ${
            expandedCards.contratado ? 'sm:col-span-2 lg:col-span-2 ring-2 ring-[#00A3C4]/40' : ''
          }`}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#00A3C4]/15 text-[#00A3C4] dark:text-[#00C4EB]">
                  <Briefcase className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Já Contratado
                </span>
              </div>
              <button
                type="button"
                onClick={() => toggleExpand('contratado')}
                title={expandedCards.contratado ? 'Reduzir card' : 'Aumentar card e ver detalhes'}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#0B384D] transition-colors"
              >
                {expandedCards.contratado ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>
            </div>
            <CardTitle
              className={`font-black text-[#008EA9] dark:text-[#00C4EB] pt-1 ${
                expandedCards.contratado ? 'text-3xl sm:text-4xl' : 'text-2xl'
              }`}
            >
              {formatCurrency(kpis.totalContratado)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2.5 mt-auto">
            {/* Barra de Progresso com fatia de Economia ou Desvio */}
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#0B384D] overflow-hidden flex">
              <div
                className="h-full bg-[#00A3C4] transition-all"
                style={{ width: `${pctContratadoBarra}%` }}
                title={`Contratado (dentro do orçado): ${formatCurrency(contratadoBaseKpi)}`}
              />
              {pctEconomiaBarra > 0 && (
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${pctEconomiaBarra}%` }}
                  title={`Economia Conquistada: ${formatCurrency(economiaContratadosKpi)}`}
                />
              )}
              {pctDesvioBarra > 0 && kpis.faltaContratar === 0 && (
                <div
                  className="h-full bg-rose-500 transition-all"
                  style={{ width: `${pctDesvioBarra}%` }}
                  title={`Desvio / Estouro vs. Orçado: +${formatCurrency(valorEstouroKpi)}`}
                />
              )}
            </div>
            <div className="flex items-center justify-between gap-2 text-xs leading-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
              <span className="truncate">Orçamento Base:</span>
              <strong className="text-slate-800 dark:text-slate-200 shrink-0">{formatCurrency(kpis.totalOrcado)}</strong>
            </div>

            {expandedCards.contratado && (
              <div className="pt-2.5 border-t border-slate-100 dark:border-[#0B384D] grid grid-cols-2 gap-3 text-xs animate-in fade-in-0">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#072432]">
                  <span className="text-slate-400 block text-[11px]">Projetos</span>
                  <strong className="text-slate-800 dark:text-white text-sm">{formatCurrency(kpis.totalProjetosContratado)}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#072432]">
                  <span className="text-slate-400 block text-[11px]">Legalização</span>
                  <strong className="text-purple-600 dark:text-purple-400 text-sm">{formatCurrency(kpis.totalLegalizacaoContratado)}</strong>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Falta Contratar */}
        <Card
          className={`flex flex-col justify-between border-slate-200 dark:border-[#0B384D] bg-white dark:bg-[#072B3B] hover:shadow-md transition-all ${
            expandedCards.faltaContratar ? 'sm:col-span-2 lg:col-span-2 ring-2 ring-amber-500/40' : ''
          }`}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <FilePlus2 className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {statusObraSelecionada === 'Paralisada'
                    ? 'Contratação Suspensa'
                    : statusObraSelecionada === 'Cancelada'
                    ? 'Falta Contratar (Encerrado)'
                    : 'Falta Contratar'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => toggleExpand('faltaContratar')}
                title={expandedCards.faltaContratar ? 'Reduzir card' : 'Aumentar card e ver detalhes'}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#0B384D] transition-colors"
              >
                {expandedCards.faltaContratar ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>
            </div>
            <CardTitle
              className={`font-black pt-1 ${
                statusObraSelecionada === 'Paralisada'
                  ? 'text-slate-600 dark:text-slate-300'
                  : 'text-amber-600 dark:text-amber-400'
              } ${expandedCards.faltaContratar ? 'text-3xl sm:text-4xl' : 'text-2xl'}`}
            >
              {formatCurrency(
                statusObraSelecionada === 'Paralisada'
                  ? kpis.faltaContratarPausado
                  : kpis.faltaContratar
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2.5 mt-auto">
            {/* Barra de Proporção (Azul Contratado + Verde Economia + Âmbar A Contratar + Cinza Suspenso + Vermelho Desvio) */}
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#0B384D] overflow-hidden flex">
              <div
                className="h-full bg-[#00A3C4] transition-all"
                style={{ width: `${pctContratadoBarra}%` }}
                title={`Contratado (dentro do orçado): ${formatCurrency(contratadoBaseKpi)}`}
              />
              {pctEconomiaBarra > 0 && (
                <div
                  className="h-full bg-emerald-500 transition-all"
                  style={{ width: `${pctEconomiaBarra}%` }}
                  title={`Economia Conquistada: ${formatCurrency(economiaContratadosKpi)}`}
                />
              )}
              {pctFaltaContratarBarra > 0 && (
                <div
                  className="h-full bg-amber-400/75 transition-all"
                  style={{ width: `${pctFaltaContratarBarra}%` }}
                  title={`A Contratar (Obras Ativas): ${formatCurrency(kpis.faltaContratar)}`}
                />
              )}
              {pctFaltaPausadoBarra > 0 && (
                <div
                  className="h-full bg-slate-400 transition-all"
                  style={{ width: `${pctFaltaPausadoBarra}%` }}
                  title={`Contratação Suspensa (Obras Paralisadas): ${formatCurrency(kpis.faltaContratarPausado)}`}
                />
              )}
              {pctDesvioBarra > 0 && (
                <div
                  className="h-full bg-rose-500 transition-all"
                  style={{ width: `${pctDesvioBarra}%` }}
                  title={`Desvio / Estouro vs. Orçado: +${formatCurrency(valorEstouroKpi)}`}
                />
              )}
            </div>

            <div className="flex items-center justify-between gap-2 text-xs leading-4 whitespace-nowrap">
              <span className="text-slate-500 dark:text-slate-400 truncate">
                {estourouProjecaoKpi
                  ? 'Projeção vs. Orçado:'
                  : economizouKpi
                  ? 'Economia no Orçado:'
                  : !filtroObra && kpis.faltaContratarPausado > 0
                  ? 'Suspenso (Paralisadas):'
                  : 'Projeção Total:'}
              </span>
              {estourouProjecaoKpi ? (
                <strong className="text-rose-600 dark:text-rose-400 shrink-0">
                  +{formatCurrency(valorEstouroKpi)}
                </strong>
              ) : economizouKpi ? (
                <strong className="text-emerald-600 dark:text-emerald-400 shrink-0">
                  -{formatCurrency(economiaContratadosKpi)}
                </strong>
              ) : !filtroObra && kpis.faltaContratarPausado > 0 ? (
                <strong className="text-slate-600 dark:text-slate-300 shrink-0">
                  {formatCurrency(kpis.faltaContratarPausado)}
                </strong>
              ) : (
                <strong className="text-slate-800 dark:text-slate-200 shrink-0">
                  {formatCurrency(kpis.custoTotalPrevisto)}
                </strong>
              )}
            </div>

            {expandedCards.faltaContratar && (
              <div className="pt-2.5 border-t border-slate-100 dark:border-[#0B384D] grid grid-cols-2 gap-3 text-xs animate-in fade-in-0">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#072432]">
                  <span className="text-slate-400 block text-[11px]">Projeção Consolidada</span>
                  <strong className="text-slate-900 dark:text-white text-sm">{formatCurrency(kpis.custoTotalPrevisto)}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#072432]">
                  <span className="text-slate-400 block text-[11px]">Disciplinas Ativas em Aberto</span>
                  <strong className="text-amber-600 dark:text-amber-400 text-sm">{kpis.qtdFaltaContratar} item(ns)</strong>
                </div>
                {kpis.faltaContratarPausado > 0 && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <span className="text-amber-700 dark:text-amber-400 block text-[11px]">Contratação Suspensa (Pausadas)</span>
                    <strong className="text-amber-600 dark:text-amber-400 text-sm">
                      {formatCurrency(kpis.faltaContratarPausado)} ({kpis.qtdFaltaContratarPausado})
                    </strong>
                  </div>
                )}
                {(kpis.totalEconomiaItens || 0) > 0 && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-emerald-700 dark:text-emerald-400 block text-[11px]">Economia nos Contratados</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 text-sm">
                      -{formatCurrency(kpis.totalEconomiaItens || 0)}
                    </strong>
                  </div>
                )}
                {(kpis.totalEstouroItens || 0) > 0 && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <span className="text-rose-700 dark:text-rose-400 block text-[11px]">Desvio nos Contratados</span>
                    <strong className="text-rose-600 dark:text-rose-400 text-sm">
                      +{formatCurrency(kpis.totalEstouroItens || 0)} vs. orçado
                    </strong>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 3: Valor Medido */}
        <Card
          className={`flex flex-col justify-between border-slate-200 dark:border-[#0B384D] bg-white dark:bg-[#072B3B] hover:shadow-md transition-all ${
            expandedCards.medido ? 'sm:col-span-2 lg:col-span-2 ring-2 ring-emerald-500/40' : ''
          }`}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Valor Medido
                </span>
              </div>
              <button
                type="button"
                onClick={() => toggleExpand('medido')}
                title={expandedCards.medido ? 'Reduzir card' : 'Aumentar card e ver detalhes'}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#0B384D] transition-colors"
              >
                {expandedCards.medido ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>
            </div>
            <CardTitle
              className={`font-black text-emerald-600 dark:text-emerald-400 pt-1 ${
                expandedCards.medido ? 'text-3xl sm:text-4xl' : 'text-2xl'
              }`}
            >
              {formatCurrency(kpis.totalMedido)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2.5 mt-auto">
            {/* Barra de Progresso Medido */}
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#0B384D] overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${pctMedidoBarra}%` }}
              />
            </div>

            <div className="flex items-center justify-between gap-2 text-xs leading-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
              <span className="truncate">Avanço dos Contratos:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 shrink-0">{formatPercent(kpis.percentualMedido)}</strong>
            </div>

            {expandedCards.medido && (
              <div className="pt-2.5 border-t border-slate-100 dark:border-[#0B384D] grid grid-cols-2 gap-3 text-xs animate-in fade-in-0">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#072432]">
                  <span className="text-slate-400 block text-[11px]">Já Pago (Caixa)</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 text-sm">{formatCurrency(kpis.totalPago)}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#072432]">
                  <span className="text-slate-400 block text-[11px]">A Pagar (Com NF)</span>
                  <strong className="text-indigo-600 dark:text-indigo-400 text-sm">{formatCurrency(kpis.totalMedidoPendente)}</strong>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 4: Valor a Medir (Obras Ativas) / Saldo Pausado / Saldo a Distratar */}
        <Card
          className={`flex flex-col justify-between border-slate-200 dark:border-[#0B384D] bg-white dark:bg-[#072B3B] hover:shadow-md transition-all ${
            expandedCards.aMedir ? 'sm:col-span-2 lg:col-span-2 ring-2 ring-purple-500/40' : ''
          }`}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-xl ${
                    statusObraSelecionada === 'Paralisada'
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      : statusObraSelecionada === 'Cancelada'
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                      : 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                  }`}
                >
                  <Clock className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {statusObraSelecionada === 'Paralisada'
                    ? 'Saldo Pausado'
                    : statusObraSelecionada === 'Cancelada'
                    ? 'Saldo a Distratar'
                    : 'Valor a Medir'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => toggleExpand('aMedir')}
                title={expandedCards.aMedir ? 'Reduzir card' : 'Aumentar card e ver detalhes'}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#0B384D] transition-colors"
              >
                {expandedCards.aMedir ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>
            </div>
            <CardTitle
              className={`font-black pt-1 ${
                statusObraSelecionada === 'Paralisada'
                  ? 'text-amber-600 dark:text-amber-400'
                  : statusObraSelecionada === 'Cancelada'
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-purple-600 dark:text-purple-400'
              } ${expandedCards.aMedir ? 'text-3xl sm:text-4xl' : 'text-2xl'}`}
            >
              {formatCurrency(
                statusObraSelecionada === 'Paralisada'
                  ? kpis.saldoPausado
                  : statusObraSelecionada === 'Cancelada'
                  ? kpis.saldoADistratar
                  : kpis.saldoAMedir
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2.5 mt-auto">
            {/* Barra de Proporção: Roxo (A Medir Ativo) + Âmbar (Saldo Pausado) + Vermelho (Saldo a Distratar) */}
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#0B384D] overflow-hidden flex">
              {pctAMedirBarra > 0 && (
                <div
                  className="h-full bg-purple-500 transition-all"
                  style={{ width: `${pctAMedirBarra}%` }}
                  title={`A Medir (Obras Ativas): ${formatCurrency(kpis.saldoAMedir)}`}
                />
              )}
              {pctPausadoBarra > 0 && (
                <div
                  className="h-full bg-amber-500 transition-all"
                  style={{ width: `${pctPausadoBarra}%` }}
                  title={`Saldo Pausado / Suspenso (Obras Paralisadas): ${formatCurrency(kpis.saldoPausado)}`}
                />
              )}
              {pctADistratarBarra > 0 && (
                <div
                  className="h-full bg-rose-500 transition-all"
                  style={{ width: `${pctADistratarBarra}%` }}
                  title={`Saldo a Distratar (Obras Canceladas): ${formatCurrency(kpis.saldoADistratar)}`}
                />
              )}
            </div>

            <div className="flex items-center justify-between gap-2 text-xs leading-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
              {kpis.saldoPausado > 0 && kpis.saldoADistratar > 0 ? (
                <>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold truncate">
                    Pausado: {formatCurrencyShort(kpis.saldoPausado)}
                  </span>
                  <span className="text-rose-600 dark:text-rose-400 font-semibold shrink-0">
                    Distratar: {formatCurrencyShort(kpis.saldoADistratar)}
                  </span>
                </>
              ) : kpis.saldoPausado > 0 && statusObraSelecionada !== 'Paralisada' ? (
                <>
                  <span className="truncate">Saldo Pausado:</span>
                  <strong className="text-amber-600 dark:text-amber-400 shrink-0">
                    {formatCurrency(kpis.saldoPausado)}
                  </strong>
                </>
              ) : kpis.saldoADistratar > 0 && statusObraSelecionada !== 'Cancelada' ? (
                <>
                  <span className="truncate">Saldo a Distratar:</span>
                  <strong className="text-rose-600 dark:text-rose-400 shrink-0">
                    {formatCurrency(kpis.saldoADistratar)}
                  </strong>
                </>
              ) : (
                <>
                  <span className="truncate">Já Pago:</span>
                  <strong className="text-slate-800 dark:text-slate-200 shrink-0">
                    {formatCurrency(kpis.totalPago)}
                  </strong>
                </>
              )}
            </div>

            {expandedCards.aMedir && (
              <div className="pt-2.5 border-t border-slate-100 dark:border-[#0B384D] grid grid-cols-2 gap-3 text-xs animate-in fade-in-0">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#072432]">
                  <span className="text-slate-400 block text-[11px]">Programado no Cronograma</span>
                  <strong className="text-slate-800 dark:text-white text-sm">{formatCurrency(kpis.totalPrevistoAMedir)}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#072432]">
                  <span className="text-slate-400 block text-[11px]">Sem Cronograma Definido</span>
                  <strong className="text-amber-600 dark:text-amber-400 text-sm">{formatCurrency(kpis.saldoSemCronograma || 0)}</strong>
                </div>
                {kpis.saldoPausado > 0 && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <span className="text-amber-700 dark:text-amber-400 block text-[11px]">Saldo Pausado (Paralisadas)</span>
                    <strong className="text-amber-600 dark:text-amber-400 text-sm">{formatCurrency(kpis.saldoPausado)}</strong>
                  </div>
                )}
                {kpis.saldoADistratar > 0 && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <span className="text-rose-700 dark:text-rose-400 block text-[11px]">Saldo a Distratar (Canceladas)</span>
                    <strong className="text-rose-600 dark:text-rose-400 text-sm">{formatCurrency(kpis.saldoADistratar)}</strong>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3. RELAÇÃO 30 / 60 / 90 DIAS (VISUAL LIMPO + BOTÃO DE EXPANDIR) */}
      <Card className="border-slate-200 dark:border-[#0B384D] bg-white dark:bg-[#072B3B] shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-[#00A3C4]/15 text-[#00A3C4] dark:text-[#00C4EB]">
                <Calendar className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                Previsão de Desembolso: 30 / 60 / 90 Dias
              </CardTitle>
              {janela306090.atrasadoAnterior > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  <AlertTriangle className="h-3 w-3" />
                  Atrasado anterior: {formatCurrency(janela306090.atrasadoAnterior)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  Medido / Com NF
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Previsto a Medir
                </span>
              </div>

              <button
                type="button"
                onClick={() => toggleExpand('janela306090')}
                title={expandedCards.janela306090 ? 'Reduzir visualização' : 'Aumentar cards 30/60/90 dias'}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#0B384D] transition-colors"
              >
                {expandedCards.janela306090 ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[
              { prazo: '30 Dias', item: janela306090.mes30, destaque: false },
              { prazo: '60 Dias', item: janela306090.mes60, destaque: false },
              { prazo: '90 Dias', item: janela306090.mes90, destaque: false },
              {
                prazo: 'Total 90 Dias',
                item: {
                  mesSortKey: 'total',
                  mesFormatado: 'Acumulado 90d',
                  medidoComNF: janela306090.total90Dias.medidoComNF,
                  aMedirPrevisto: janela306090.total90Dias.aMedirPrevisto,
                  total: janela306090.total90Dias.total,
                },
                destaque: true,
              },
            ].map(({ prazo, item, destaque }) => {
              const pctNF = item.total > 0 ? (item.medidoComNF / item.total) * 100 : 0;
              const pctAMedir = item.total > 0 ? (item.aMedirPrevisto / item.total) * 100 : 0;

              return (
                <div
                  key={prazo}
                  className={`p-4 rounded-xl border transition-all ${
                    destaque
                      ? 'border-[#00A3C4]/40 bg-[#00A3C4]/10'
                      : 'border-slate-200 dark:border-[#0B384D] bg-slate-50/60 dark:bg-[#072432]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {prazo}
                    </span>
                    <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-white dark:bg-[#072B3B] text-[#008EA9] dark:text-[#00C4EB] border border-slate-200 dark:border-[#0B384D]">
                      {item.mesFormatado}
                    </span>
                  </div>

                  <div
                    className={`font-black text-slate-900 dark:text-white my-2 ${
                      expandedCards.janela306090 ? 'text-2xl sm:text-3xl' : 'text-xl'
                    }`}
                  >
                    {formatCurrency(item.total)}
                  </div>

                  {/* Barra Bipartida com indicação percentual interna e visual claro */}
                  <div className="w-full h-3 rounded-full bg-slate-200/80 dark:bg-[#0B384D] overflow-hidden flex shadow-inner">
                    <div
                      className="h-full bg-indigo-500 flex items-center justify-center transition-all overflow-hidden"
                      style={{ width: `${pctNF}%` }}
                      title={`Medido / Com NF: ${formatCurrency(item.medidoComNF)} (${pctNF.toFixed(1)}%)`}
                    >
                      {pctNF >= 16 && (
                        <span className="text-[9px] font-black text-white px-1 leading-none select-none drop-shadow-sm">
                          {pctNF.toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <div
                      className="h-full bg-amber-500 flex items-center justify-center transition-all overflow-hidden"
                      style={{ width: `${pctAMedir}%` }}
                      title={`Previsto a Medir: ${formatCurrency(item.aMedirPrevisto)} (${pctAMedir.toFixed(1)}%)`}
                    >
                      {pctAMedir >= 16 && (
                        <span className="text-[9px] font-black text-white px-1 leading-none select-none drop-shadow-sm">
                          {pctAMedir.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Detalhamento dos valores e percentuais de Medido NF e A Medir */}
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-[#0B384D]/70 flex items-center justify-between text-[11px] leading-tight">
                    <span
                      className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400"
                      title={`Medido / Com NF: ${formatCurrency(item.medidoComNF)} (${pctNF.toFixed(1)}% do total)`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                      <span>NF: <strong>{expandedCards.janela306090 ? formatCurrency(item.medidoComNF) : formatCurrencyShort(item.medidoComNF)}</strong></span>
                      <span className="text-[10px] opacity-80 font-normal">({pctNF.toFixed(0)}%)</span>
                    </span>

                    <span
                      className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400"
                      title={`Previsto a Medir: ${formatCurrency(item.aMedirPrevisto)} (${pctAMedir.toFixed(1)}% do total)`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span>A Medir: <strong>{expandedCards.janela306090 ? formatCurrency(item.aMedirPrevisto) : formatCurrencyShort(item.aMedirPrevisto)}</strong></span>
                      <span className="text-[10px] opacity-80 font-normal">({pctAMedir.toFixed(0)}%)</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 4. CONSOLIDAÇÃO POR DISCIPLINA E CONSOLIDAÇÃO DOS CONTRATOS (BARRAS DE PROGRESSO VISUAIS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bloco Esquerdo: Consolidação por Disciplina com Barra de Progresso */}
        <Card
          className={`border-slate-200 dark:border-[#0B384D] bg-white dark:bg-[#072B3B] shadow-sm transition-all ${
            expandedCards.disciplinas ? 'lg:col-span-2 ring-2 ring-[#00A3C4]/30' : ''
          }`}
        >
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#00A3C4]/15 text-[#00A3C4] dark:text-[#00C4EB]">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                    Consolidação por Disciplina
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#00A3C4]" /> Contratado
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Economia
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400/80" /> A Contratar
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500" /> Desvio
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="flex items-center rounded-lg bg-slate-100 dark:bg-[#0B384D] p-0.5 border border-slate-200 dark:border-[#0B384D]">
                  {(
                    [
                      { id: 'valor', label: 'Maior Valor' },
                      { id: 'alfabetica', label: 'A–Z' },
                      { id: 'saldo', label: 'Falta Contratar' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setOrdemDisciplinas(opt.id)}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                        ordemDisciplinas === opt.id
                          ? 'bg-white dark:bg-[#072B3B] text-[#008EA9] dark:text-[#00C4EB] shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigateTab('orcamentos')}
                  className="text-xs text-[#00A3C4] hover:text-[#008EA9] h-8 px-2"
                >
                  Ver Orçamento &rarr;
                </Button>
                <button
                  type="button"
                  onClick={() => toggleExpand('disciplinas')}
                  title={expandedCards.disciplinas ? 'Reduzir seção' : 'Expandir seção em largura total'}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#0B384D] transition-colors"
                >
                  {expandedCards.disciplinas ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div
              className={`space-y-3 overflow-y-auto pr-1 ${
                expandedCards.disciplinas ? 'max-h-[540px]' : 'max-h-96'
              }`}
            >
              {consolidadoDisciplinas.map((d) => {
                const estourouProjecao = d.diferencaOrcamento > 1 || d.diferencaContratados > 1;
                const valorEstouro = Math.max(0, d.diferencaOrcamento > 1 ? d.diferencaOrcamento : d.diferencaContratados);
                const valorEconomia = !estourouProjecao
                  ? d.diferencaContratados < -1
                    ? Math.abs(d.diferencaContratados)
                    : d.economiaContratados
                  : 0;
                const economizou = !estourouProjecao && valorEconomia > 1;
                const faltaSuspenso = d.faltaContratarPausado || 0;
                const contratadoSemDesvio = estourouProjecao
                  ? Math.max(0, d.valorContratado - valorEstouro)
                  : d.valorContratado;
                const refMax = Math.max(
                  d.orcamentoBase,
                  contratadoSemDesvio + valorEconomia + d.faltaContratar + faltaSuspenso + valorEstouro,
                  1
                );
                const pctContratado = Math.min(100, (contratadoSemDesvio / refMax) * 100);
                const pctEconomia = Math.min(100 - pctContratado, (valorEconomia / refMax) * 100);
                const pctFalta = Math.min(
                  100 - pctContratado - pctEconomia,
                  (d.faltaContratar / refMax) * 100
                );
                const pctSuspenso = Math.min(
                  100 - pctContratado - pctEconomia - pctFalta,
                  (faltaSuspenso / refMax) * 100
                );
                const pctDesvio = estourouProjecao
                  ? Math.min(100 - pctContratado - pctEconomia - pctFalta - pctSuspenso, (valorEstouro / refMax) * 100)
                  : 0;

                return (
                  <div
                    key={d.disciplina}
                    className="p-3 rounded-xl border border-slate-100 dark:border-[#0B384D] bg-slate-50/60 dark:bg-[#072432] space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white truncate">
                        {d.disciplina}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        {estourouProjecao ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400">
                            +{formatCurrencyShort(valorEstouro)} projeção vs. orçado
                          </span>
                        ) : economizou ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                            -{formatCurrencyShort(valorEconomia)} de economia
                          </span>
                        ) : faltaSuspenso > 0 && d.faltaContratar === 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                            Suspenso ({formatCurrencyShort(faltaSuspenso)})
                          </span>
                        ) : null}
                        <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                          {formatCurrency(d.totalPrevisto)}
                        </span>
                      </div>
                    </div>

                    {/* Barra de Progresso Visual da Disciplina (Azul Contratado + Verde Economia + Âmbar A Contratar + Slate Suspenso + Vermelho Desvio) */}
                    <div className="w-full h-2.5 rounded-full bg-slate-200/80 dark:bg-[#0B384D] overflow-hidden flex">
                      {pctContratado > 0 && (
                        <div
                          className="h-full bg-[#00A3C4] transition-all"
                          style={{ width: `${pctContratado}%` }}
                          title={`Contratado (dentro do orçado): ${formatCurrency(contratadoSemDesvio)}`}
                        />
                      )}
                      {economizou && pctEconomia > 0 && (
                        <div
                          className="h-full bg-emerald-500 transition-all"
                          style={{ width: `${pctEconomia}%` }}
                          title={`Economia Conquistada nos Contratados: ${formatCurrency(valorEconomia)}`}
                        />
                      )}
                      {d.faltaContratar > 0 && pctFalta > 0 && (
                        <div
                          className="h-full bg-amber-400/75 transition-all"
                          style={{ width: `${pctFalta}%` }}
                          title={`A Contratar: ${formatCurrency(d.faltaContratar)}`}
                        />
                      )}
                      {faltaSuspenso > 0 && pctSuspenso > 0 && (
                        <div
                          className="h-full bg-slate-400/80 transition-all"
                          style={{ width: `${pctSuspenso}%` }}
                          title={`Contratação Suspensa (Obra Paralisada): ${formatCurrency(faltaSuspenso)}`}
                        />
                      )}
                      {estourouProjecao && pctDesvio > 0 && (
                        <div
                          className="h-full bg-rose-500 transition-all"
                          style={{ width: `${pctDesvio}%` }}
                          title={`Desvio / Estouro vs. Orçado: +${formatCurrency(valorEstouro)}`}
                        />
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <div className="flex flex-wrap items-center gap-3">
                        <span>
                          Contratado: <strong className="text-[#008EA9] dark:text-[#00C4EB]">{formatCurrency(d.valorContratado)}</strong>
                        </span>
                        {economizou && (
                          <span>
                            Economia: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(valorEconomia)}</strong>
                          </span>
                        )}
                        {d.faltaContratar > 0 && (
                          <span>
                            A Contratar: <strong className="text-amber-600 dark:text-amber-400">{formatCurrency(d.faltaContratar)}</strong>
                          </span>
                        )}
                        {faltaSuspenso > 0 && (
                          <span>
                            Suspenso: <strong className="text-slate-600 dark:text-slate-300">{formatCurrency(faltaSuspenso)}</strong>
                          </span>
                        )}
                        {estourouProjecao && (
                          <span>
                            Desvio: <strong className="text-rose-600 dark:text-rose-400">+{formatCurrency(valorEstouro)}</strong>
                          </span>
                        )}
                      </div>
                      <span>
                        Orçado: <strong className="text-slate-700 dark:text-slate-300">{formatCurrency(d.orcamentoBase)}</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Bloco Direito: Consolidação dos Contratos com Barra de Progresso */}
        <Card
          className={`border-slate-200 dark:border-[#0B384D] bg-white dark:bg-[#072B3B] shadow-sm transition-all ${
            expandedCards.contratosLista ? 'lg:col-span-2 ring-2 ring-[#00A3C4]/30' : ''
          }`}
        >
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Briefcase className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                    Consolidação dos Contratos ({consolidadoContratos.length})
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Pago
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" /> Medido a Pagar
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500" /> Aditivos / Distratos
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="flex items-center rounded-lg bg-slate-100 dark:bg-[#0B384D] p-0.5 border border-slate-200 dark:border-[#0B384D]">
                  {(
                    [
                      { id: 'valor', label: 'Maior Valor' },
                      { id: 'alfabetica', label: 'A–Z' },
                      { id: 'saldo', label: 'Maior a Medir' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setOrdemContratos(opt.id)}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                        ordemContratos === opt.id
                          ? 'bg-white dark:bg-[#072B3B] text-[#008EA9] dark:text-[#00C4EB] shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigateTab('contratos')}
                  className="text-xs text-[#00A3C4] hover:text-[#008EA9] h-8 px-2"
                >
                  Ver Contratos &rarr;
                </Button>
                <button
                  type="button"
                  onClick={() => toggleExpand('contratosLista')}
                  title={expandedCards.contratosLista ? 'Reduzir seção' : 'Expandir seção em largura total'}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#0B384D] transition-colors"
                >
                  {expandedCards.contratosLista ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div
              className={`space-y-3 overflow-y-auto pr-1 ${
                expandedCards.contratosLista ? 'max-h-[540px]' : 'max-h-96'
              }`}
            >
              {consolidadoContratos.map((c) => {
                const valorDesvioContrato = c.valorDesvio || 0;
                const temAditivo = c.tipoDesvio === 'aditivo' && valorDesvioContrato > 1;
                const temSupressao = c.tipoDesvio === 'supressao' && valorDesvioContrato > 1;
                const isDistratado = c.status === 'Distratado' || c.tipoDesvio === 'distrato';
                const pctDesvioContrato = temAditivo && c.valorContrato > 0
                  ? Math.min(100, (valorDesvioContrato / c.valorContrato) * 100)
                  : 0;
                const limiteBase = Math.max(0, 100 - pctDesvioContrato);
                const pctPago = Math.min(limiteBase, c.percentualPago * 100);
                const pctAPagar = Math.min(limiteBase - pctPago, c.percentualMedidoAPagar * 100);
                const pctRestanteBase = Math.max(0, limiteBase - pctPago - pctAPagar);
                const saldoPausadoContrato = c.saldoPausado || 0;
                const saldoADistratarContrato = c.saldoADistratar || 0;

                return (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl border border-slate-100 dark:border-[#0B384D] bg-slate-50/60 dark:bg-[#072432] space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white truncate">
                          {c.empresa}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200/70 dark:bg-[#0B384D] text-slate-600 dark:text-slate-300 shrink-0">
                          {c.disciplina}
                        </span>
                        {c.status === 'Distratado' && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 shrink-0">
                            Distratado
                          </span>
                        )}
                        {c.statusObra === 'Paralisada' && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                            Paralisada
                          </span>
                        )}
                        {c.statusObra === 'Cancelada' && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 shrink-0">
                            Cancelada
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {temAditivo && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400">
                            +{formatCurrencyShort(valorDesvioContrato)} aditivo
                          </span>
                        )}
                        {temSupressao && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                            -{formatCurrencyShort(valorDesvioContrato)} supressão
                          </span>
                        )}
                        {c.tipoDesvio === 'distrato' && valorDesvioContrato > 1 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400">
                            -{formatCurrencyShort(valorDesvioContrato)} distrato
                          </span>
                        )}
                        <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                          {formatCurrency(c.valorContrato)}
                        </span>
                      </div>
                    </div>

                    {/* Barra de Progresso de Medição do Contrato + Fatia de Aditivo em Vermelho/Rose */}
                    <div className="w-full h-2.5 rounded-full bg-slate-200/80 dark:bg-[#0B384D] overflow-hidden flex">
                      <div
                        className="h-full bg-emerald-500 transition-all"
                        style={{ width: `${pctPago}%` }}
                        title={`Pago: ${formatCurrency(c.valorPago)}`}
                      />
                      <div
                        className="h-full bg-indigo-500 transition-all"
                        style={{ width: `${pctAPagar}%` }}
                        title={`Medido a Pagar: ${formatCurrency(c.valorMedidoAPagar)}`}
                      />
                      {temAditivo && pctRestanteBase > 0 && (
                        <div
                          className="h-full bg-transparent"
                          style={{ width: `${pctRestanteBase}%` }}
                        />
                      )}
                      {temAditivo && pctDesvioContrato > 0 && (
                        <div
                          className="h-full bg-rose-500 transition-all"
                          style={{ width: `${pctDesvioContrato}%` }}
                          title={`Aditivo de Valor: +${formatCurrency(valorDesvioContrato)}`}
                        />
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <div className="flex flex-wrap items-center gap-3">
                        <span>
                          Medido: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(c.valorMedidoTotal)}</strong> ({formatPercent(c.percentualMedidoTotal, 0)})
                        </span>
                        {temAditivo && (
                          <span>
                            Aditivo: <strong className="text-rose-600 dark:text-rose-400">+{formatCurrency(valorDesvioContrato)}</strong>
                          </span>
                        )}
                        {temSupressao && (
                          <span>
                            Supressão: <strong className="text-emerald-600 dark:text-emerald-400">-{formatCurrency(valorDesvioContrato)}</strong>
                          </span>
                        )}
                        {c.tipoDesvio === 'distrato' && valorDesvioContrato > 1 && (
                          <span>
                            Distrato: <strong className="text-rose-600 dark:text-rose-400">-{formatCurrency(valorDesvioContrato)}</strong>
                          </span>
                        )}
                      </div>
                      {saldoADistratarContrato > 0 ? (
                        <span>
                          A Distratar: <strong className="text-rose-600 dark:text-rose-400">{formatCurrency(saldoADistratarContrato)}</strong>
                        </span>
                      ) : saldoPausadoContrato > 0 ? (
                        <span>
                          Saldo Pausado: <strong className="text-amber-600 dark:text-amber-400">{formatCurrency(saldoPausadoContrato)}</strong>
                        </span>
                      ) : (
                        <span>
                          A Medir: <strong className="text-purple-600 dark:text-purple-400">{formatCurrency(c.valorAMedir)}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. GRÁFICO PRINCIPAL: CURVA DE DESEMBOLSO / CURVA S */}
      <Card className="border-slate-200 dark:border-[#0B384D] bg-white dark:bg-[#072B3B] shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#00A3C4]/15 text-[#00A3C4] dark:text-[#00C4EB]">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Curva S de Desembolso
                </CardTitle>
              </div>

              <div className="hidden sm:inline-block h-4 w-px bg-slate-200 dark:bg-[#0B384D]" />

              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  Pago: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(totaisCurva.pago)}</strong>
                </span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-slate-500 dark:text-slate-400">
                  A Pagar: <strong className="text-indigo-600 dark:text-indigo-400">{formatCurrency(totaisCurva.aPagar)}</strong>
                </span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-slate-500 dark:text-slate-400">
                  A Medir: <strong className="text-amber-600 dark:text-amber-400">{formatCurrency(totaisCurva.aMedir)}</strong>
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-[#072432] border border-slate-200 dark:border-[#0B384D]">
                <button
                  type="button"
                  onClick={() => setCriterioCurva('desembolso')}
                  className={`px-2.5 py-1 text-[11px] rounded-md transition-all ${
                    criterioCurva === 'desembolso'
                      ? 'bg-white dark:bg-[#00A3C4] text-slate-900 dark:text-white shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
                  }`}
                >
                  Pagamento (Caixa)
                </button>
                <button
                  type="button"
                  onClick={() => setCriterioCurva('competencia')}
                  className={`px-2.5 py-1 text-[11px] rounded-md transition-all ${
                    criterioCurva === 'competencia'
                      ? 'bg-white dark:bg-[#00A3C4] text-slate-900 dark:text-white shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
                  }`}
                >
                  Competência
                </button>
                <button
                  type="button"
                  onClick={() => setCriterioCurva('medicao')}
                  className={`px-2.5 py-1 text-[11px] rounded-md transition-all ${
                    criterioCurva === 'medicao'
                      ? 'bg-white dark:bg-[#00A3C4] text-slate-900 dark:text-white shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
                  }`}
                >
                  Medição (Físico)
                </button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTabelaCurva(!showTabelaCurva)}
                className="text-xs gap-1.5 border-slate-200 dark:border-[#0B384D] hover:bg-slate-50 dark:hover:bg-[#0B384D]"
              >
                {showTabelaCurva ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {showTabelaCurva ? 'Ocultar Tabela' : 'Ver Tabela'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={curvaPontos}
                margin={{ top: 15, right: 25, bottom: 25, left: 15 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  dataKey="mesFormatado"
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  height={45}
                />
                <YAxis
                  yAxisId="left"
                  tickFormatter={formatCurrencyShort}
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={formatCurrencyShort}
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                />
                <Tooltip
                  formatter={(value: any, name: any) => {
                    const valNum = typeof value === 'number' ? value : parseFloat(value) || 0;
                    return [formatCurrency(valNum), name];
                  }}
                  contentStyle={{
                    backgroundColor: '#072B3B',
                    borderRadius: '12px',
                    border: '1px solid #0B384D',
                    color: '#fff',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
                {criterioCurva !== 'medicao' ? (
                  <>
                    <Bar
                      yAxisId="left"
                      dataKey="pago"
                      name="Pago"
                      fill="#10B981"
                      radius={[3, 3, 0, 0]}
                      barSize={16}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="aPagar"
                      name="A Pagar (Com NF)"
                      fill="#6366F1"
                      radius={[3, 3, 0, 0]}
                      barSize={16}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="aMedir"
                      name="A Medir"
                      fill="#F59E0B"
                      radius={[3, 3, 0, 0]}
                      barSize={16}
                    />
                  </>
                ) : (
                  <>
                    <Bar
                      yAxisId="left"
                      dataKey="realizado"
                      name="Medido"
                      fill="#00A3C4"
                      radius={[4, 4, 0, 0]}
                      barSize={20}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="previsto"
                      name="A Medir"
                      fill="#F59E0B"
                      radius={[4, 4, 0, 0]}
                      barSize={20}
                    />
                  </>
                )}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="acumuladoTotal"
                  name="Acumulado"
                  stroke="#38BDF8"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#38BDF8' }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {showTabelaCurva && (
            <div className="mt-6 border-t border-slate-200 dark:border-[#0B384D] pt-4">
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#0B384D]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-[#0B384D] text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-[#0B384D]">
                    <tr>
                      <th className="py-2.5 px-3">Mês</th>
                      <th className="py-2.5 px-3 text-right">Pago</th>
                      <th className="py-2.5 px-3 text-right text-indigo-600 dark:text-indigo-400">A Pagar (NF)</th>
                      <th className="py-2.5 px-3 text-right text-amber-600 dark:text-amber-400">A Medir</th>
                      <th className="py-2.5 px-3 text-right">Total do Mês</th>
                      <th className="py-2.5 px-3 text-right">Acumulado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#0B384D]/60 text-slate-700 dark:text-slate-200">
                    {curvaPontos.map((p) => (
                      <tr key={p.mesSortKey} className="hover:bg-slate-50 dark:hover:bg-[#0B384D]/30">
                        <td className="py-2 px-3 font-semibold">{p.mesFormatado}</td>
                        <td className="py-2 px-3 text-right text-emerald-600 dark:text-emerald-400">
                          {(p.pago || 0) > 0 ? formatCurrency(p.pago || 0) : '-'}
                        </td>
                        <td className="py-2 px-3 text-right text-indigo-600 dark:text-indigo-400">
                          {(p.aPagar || 0) > 0 ? formatCurrency(p.aPagar || 0) : '-'}
                        </td>
                        <td className="py-2 px-3 text-right text-amber-600 dark:text-amber-400">
                          {(p.aMedir || 0) > 0 ? formatCurrency(p.aMedir || 0) : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-bold">{formatCurrency(p.total)}</td>
                        <td className="py-2 px-3 text-right font-bold text-[#00A3C4] dark:text-[#00C4EB]">
                          {formatCurrency(p.acumuladoTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
