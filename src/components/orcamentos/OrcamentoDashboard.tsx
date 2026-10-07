"use client";

import React, { useMemo, useState } from 'react';
import {
  ItemOrcamento,
  Contrato,
  Medicao,
  Obra,
  Fornecedor,
  STATUS_MEDICAO_COLORS,
} from '@/types/orcamento';
import {
  formatCurrency,
  formatCurrencyShort,
  formatPercent,
  calculateCurvaDesembolso,
  calculateKpis,
  getObraLabel,
  CriterioCurvaS,
} from '@/lib/orcamento-utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
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
  PieChart,
  Pie,
  Cell,
  BarChart,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Briefcase,
  FileCheck,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Layers,
  ChevronDown,
  ChevronUp,
  Building,
  CreditCard,
  Percent,
  AlertTriangle,
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

  const catParam = filtroCategoria === 'Todos' ? null : filtroCategoria;

  // KPIs consolidados
  const kpis = useMemo(() => {
    return calculateKpis(
      orcamentos,
      contratos,
      medicoes,
      filtroObra || null,
      catParam
    );
  }, [orcamentos, contratos, medicoes, filtroObra, catParam]);

  // Curva de Desembolso Mês a Mês
  const curvaPontos = useMemo(() => {
    return calculateCurvaDesembolso(
      medicoes,
      filtroObra || null,
      filtroFornecedor || null,
      contratos,
      catParam,
      criterioCurva
    );
  }, [medicoes, filtroObra, filtroFornecedor, contratos, catParam, criterioCurva]);

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

  // Distribuição por Disciplina (Orçamento Base vs Contratado)
  const dadosDisciplinas = useMemo(() => {
    const map: Record<string, { base: number; contratado: number; medido: number }> = {};
    const filteredOrc = orcamentos.filter((o) => {
      if (filtroObra && o.obra !== filtroObra) return false;
      if (catParam && o.categoria !== catParam) return false;
      return true;
    });

    for (const o of filteredOrc) {
      const disc = o.disciplina || 'OUTROS';
      if (!map[disc]) {
        map[disc] = { base: 0, contratado: 0, medido: 0 };
      }
      map[disc].base += o.orcamento_base || 0;
      map[disc].contratado += o.valor_contratado || 0;
      map[disc].medido += o.valor_medido || 0;
    }

    return Object.entries(map)
      .map(([disciplina, valores]) => ({
        disciplina,
        base: valores.base,
        contratado: valores.contratado,
        medido: valores.medido,
      }))
      .sort((a, b) => b.base - a.base)
      .slice(0, 8); // Top 8
  }, [orcamentos, filtroObra, catParam]);

  // Distribuição por Status das Medições
  const dadosStatusMedicoes = useMemo(() => {
    const catPorContrato: Record<string, string> = {};
    contratos.forEach((c) => {
      catPorContrato[c.id] = c.categoria || 'Projeto';
    });

    const filteredMed = medicoes.filter((m) => {
      if (filtroObra && m.obra !== filtroObra) return false;
      if (filtroFornecedor && m.empresa !== filtroFornecedor) return false;
      if (catParam && catPorContrato[m.contrato_id] && catPorContrato[m.contrato_id] !== catParam) return false;
      return true;
    });

    const map: Record<string, { count: number; valor: number }> = {
      'Pago': { count: 0, valor: 0 },
      'A Pagar': { count: 0, valor: 0 },
      'Medido': { count: 0, valor: 0 },
      'A Medir': { count: 0, valor: 0 },
      'Cancelado': { count: 0, valor: 0 },
    };

    for (const m of filteredMed) {
      const st = m.status;
      if (map[st]) {
        map[st].count += 1;
        map[st].valor += m.valor_medicao || 0;
      }
    }

    return Object.entries(map)
      .filter(([_, dados]) => dados.count > 0)
      .map(([status, dados]) => ({
        name: status,
        count: dados.count,
        value: dados.valor,
      }));
  }, [medicoes, contratos, filtroObra, filtroFornecedor, catParam]);

  const PIE_COLORS: Record<string, string> = {
    'Pago': '#10b981', // emerald
    'A Pagar': '#6366f1', // indigo
    'Medido': '#00a3c4', // cyan WCC
    'A Medir': '#f59e0b', // amber
    'Cancelado': '#94a3b8', // slate
  };

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

      {/* 2. CARDS DE KPIS CONSOLIDADOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Orçamento Base */}
        <Card className="border-slate-200 dark:border-[#0B384D] bg-white dark:bg-[#072B3B] hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Orçamento Base
              </CardDescription>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black text-slate-800 dark:text-white">
              {formatCurrency(kpis.totalOrcado)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-[#0B384D] pt-2">
              <span>A Contratar:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {formatCurrency(kpis.saldoAContratar)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Valor Contratado */}
        <Card className="border-slate-200 dark:border-[#0B384D] bg-white dark:bg-[#072B3B] hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Valor Contratado
              </CardDescription>
              <div className="p-2 rounded-xl bg-[#00A3C4]/15 text-[#00A3C4] dark:text-[#00C4EB]">
                <Briefcase className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black text-[#008EA9] dark:text-[#00C4EB]">
              {formatCurrency(kpis.totalContratado)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-[#0B384D] pt-2">
              <span title="Contratos de Arquitetura, Estrutura, Instalações, etc.">
                Projetos: <strong className="text-slate-700 dark:text-slate-200">{formatCurrencyShort(kpis.totalProjetosContratado)}</strong>
              </span>
              <span title="Taxas, Alvarás, Prefeituras e Consultoria de Legalização" className="font-semibold text-purple-600 dark:text-purple-400">
                Legalização: {formatCurrencyShort(kpis.totalLegalizacaoContratado)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Valor Medido (Realizado) */}
        <Card className="border-slate-200 dark:border-[#0B384D] bg-white dark:bg-[#072B3B] hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Medido (Físico)
              </CardDescription>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(kpis.totalMedido)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-[#0B384D] pt-2">
              <span>% Medido / Contratado:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {formatPercent(kpis.percentualMedido)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Saldo a Medir */}
        <Card className="border-slate-200 dark:border-[#0B384D] bg-white dark:bg-[#072B3B] hover:shadow-md transition-all">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Saldo a Medir
              </CardDescription>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {formatCurrency(kpis.saldoAMedir)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-[#0B384D] pt-2">
              <div className="flex items-center justify-between">
                <span>Pago: <strong>{formatCurrencyShort(kpis.totalPago)}</strong></span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400" title="Medições atestadas/com NF aguardando quitação">
                  A Pagar (NF): {formatCurrencyShort(kpis.totalMedidoPendente)}
                </span>
              </div>
              {kpis.saldoSemCronograma && kpis.saldoSemCronograma > 0 ? (
                <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-1 border-t border-dashed border-slate-200 dark:border-slate-700/60">
                  <span title="Saldo com medições futuras já lançadas no cronograma">
                    Programado: <strong className="text-slate-700 dark:text-slate-200">{formatCurrencyShort(kpis.totalPrevistoAMedir)}</strong>
                  </span>
                  <span title="Saldo de contratos ainda sem medições programadas (ex: taxas globais e estimativas)">
                    Sem cronograma: <strong className="text-amber-600 dark:text-amber-400">{formatCurrencyShort(kpis.saldoSemCronograma)}</strong>
                  </span>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ALERTA DE CRONOGRAMA: MEDIÇÕES EM ATRASO */}
      {kpis.qtdEmAtraso > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in-0 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-extrabold text-amber-900 dark:text-amber-200">
                  Atenção de Cronograma: {kpis.qtdEmAtraso} Medições Vencidas / Em Atraso
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white">
                  {formatCurrency(kpis.totalEmAtraso)}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Existem marcos previstos para meses anteriores que ainda não foram concluídos ou quitados:
                <strong className="text-slate-800 dark:text-slate-100 ml-1">
                  {kpis.qtdAMedirAtrasado} a medir pelos projetistas ({formatCurrency(kpis.totalAMedirAtrasado)})
                </strong>{' '}
                e{' '}
                <strong className="text-slate-800 dark:text-slate-100">
                  {kpis.qtdMedidoNaoPago} medidas aguardando quitação ({formatCurrency(kpis.totalMedidoNaoPago)})
                </strong>.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => onNavigateTab('medicoes')}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold gap-1.5 h-9 rounded-xl shrink-0 self-end md:self-center"
          >
            Ver Medições em Atraso &rarr;
          </Button>
        </div>
      )}

      {/* 3. GRÁFICO PRINCIPAL: CURVA DE DESEMBOLSO / CURVA S (PREVISTO X REALIZADO) */}
      <Card className="border-slate-200 dark:border-[#0B384D] bg-white dark:bg-[#072B3B] shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#00A3C4]/15 text-[#00A3C4] dark:text-[#00C4EB]">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Curva S
                </CardTitle>
              </div>

              <div className="hidden sm:inline-block h-4 w-px bg-slate-200 dark:bg-[#0B384D]" />

              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  Pago: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(totaisCurva.pago)}</strong>
                </span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-slate-500 dark:text-slate-400">
                  A Pagar: <strong className="text-indigo-600 dark:text-indigo-400 font-mono">{formatCurrency(totaisCurva.aPagar)}</strong>
                </span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-slate-500 dark:text-slate-400">
                  A Medir: <strong className="text-amber-600 dark:text-amber-400 font-mono">{formatCurrency(totaisCurva.aMedir)}</strong>
                </span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-slate-500 dark:text-slate-400">
                  Total: <strong className="text-[#00A3C4] dark:text-[#00C4EB] font-mono">{formatCurrency(totaisCurva.total)}</strong>
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Seletor de Critério */}
              <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-[#072432] border border-slate-200 dark:border-[#0B384D]">
                <button
                  type="button"
                  onClick={() => setCriterioCurva('desembolso')}
                  className={`px-2.5 py-1 text-[11px] rounded-md transition-all ${
                    criterioCurva === 'desembolso'
                      ? 'bg-white dark:bg-[#00A3C4] text-slate-900 dark:text-white shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
                  }`}
                  title="Visão Financeira / Caixa: agrupa no mês da data de pagamento"
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
                  title="Agrupa pelo campo Mês Competência (com fallback dinâmico)"
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
                  title="Visão Física: agrupa no mês da data de medição"
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
          <div className="h-80 w-full">
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
                <Legend
                  wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
                />
                {/* Barras mensais */}
                {criterioCurva !== 'medicao' ? (
                  <>
                    <Bar
                      yAxisId="left"
                      dataKey="pago"
                      name="Desembolso Realizado (Pago)"
                      fill="#10B981"
                      radius={[3, 3, 0, 0]}
                      barSize={16}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="aPagar"
                      name="Comprometido a Pagar (Com NF)"
                      fill="#6366F1"
                      radius={[3, 3, 0, 0]}
                      barSize={16}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="aMedir"
                      name="Previsto a Medir (Sem NF)"
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
                      name="Avanço Físico Medido"
                      fill="#00A3C4"
                      radius={[4, 4, 0, 0]}
                      barSize={20}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="previsto"
                      name="Avanço Físico a Medir"
                      fill="#F59E0B"
                      radius={[4, 4, 0, 0]}
                      barSize={20}
                    />
                  </>
                )}
                {/* Linhas acumuladas (Curva S) */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="acumuladoTotal"
                  name="Curva S Acumulada Total"
                  stroke="#38BDF8"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#38BDF8' }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* TABELA MENSAL ANALÍTICA (OPCIONAL/COLAPSÁVEL) */}
          {showTabelaCurva && (
            <div className="mt-6 border-t border-slate-200 dark:border-[#0B384D] pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#00A3C4]" />
                Detalhamento Mensal de Desembolso (Pago, A Pagar e A Medir)
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#0B384D]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-[#0B384D] text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-[#0B384D]">
                    {criterioCurva !== 'medicao' ? (
                      <tr>
                        <th className="py-2.5 px-3">Mês Competência / Caixa</th>
                        <th className="py-2.5 px-3 text-right">Realizado (Pago)</th>
                        <th className="py-2.5 px-3 text-right text-indigo-600 dark:text-indigo-400">A Pagar (Com NF)</th>
                        <th className="py-2.5 px-3 text-right text-amber-600 dark:text-amber-400">A Medir (Sem NF)</th>
                        <th className="py-2.5 px-3 text-right">Total do Mês</th>
                        <th className="py-2.5 px-3 text-right">Acumulado</th>
                      </tr>
                    ) : (
                      <tr>
                        <th className="py-2.5 px-3">Mês Competência</th>
                        <th className="py-2.5 px-3 text-right">Realizado (Medido)</th>
                        <th className="py-2.5 px-3 text-right">Previsto (A medir)</th>
                        <th className="py-2.5 px-3 text-right">Total do Mês</th>
                        <th className="py-2.5 px-3 text-right">Acumulado</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#0B384D]/60 text-slate-700 dark:text-slate-200">
                    {curvaPontos.map((p) => (
                      <tr key={p.mesSortKey} className="hover:bg-slate-50 dark:hover:bg-[#0B384D]/30 transition-colors">
                        <td className="py-2 px-3 font-semibold">{p.mesFormatado} ({p.mes})</td>
                        {criterioCurva !== 'medicao' ? (
                          <>
                            <td className="py-2 px-3 text-right font-medium text-emerald-600 dark:text-emerald-400 font-mono">
                              {(p.pago || 0) > 0 ? formatCurrency(p.pago || 0) : '-'}
                            </td>
                            <td className="py-2 px-3 text-right font-medium text-indigo-600 dark:text-indigo-400 font-mono">
                              {(p.aPagar || 0) > 0 ? (
                                <span className="inline-flex items-center gap-1">
                                  {formatCurrency(p.aPagar || 0)}
                                  <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                                    COM NF
                                  </span>
                                </span>
                              ) : '-'}
                            </td>
                            <td className="py-2 px-3 text-right font-medium text-amber-600 dark:text-amber-400 font-mono">
                              {(p.aMedir || 0) > 0 ? (
                                <span className="inline-flex items-center gap-1">
                                  {formatCurrency(p.aMedir || 0)}
                                  <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                    A MEDIR
                                  </span>
                                </span>
                              ) : '-'}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-2 px-3 text-right font-medium text-emerald-600 dark:text-emerald-400 font-mono">
                              {p.realizado > 0 ? formatCurrency(p.realizado) : '-'}
                            </td>
                            <td className="py-2 px-3 text-right font-medium text-amber-600 dark:text-amber-400 font-mono">
                              {p.previsto > 0 ? formatCurrency(p.previsto) : '-'}
                            </td>
                          </>
                        )}
                        <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white font-mono">
                          {formatCurrency(p.total)}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-[#00A3C4] dark:text-[#00C4EB] font-mono">
                          {formatCurrency(p.acumuladoTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 dark:bg-[#072432] font-bold border-t-2 border-slate-300 dark:border-[#0B384D] text-xs">
                    {criterioCurva !== 'medicao' ? (
                      <tr>
                        <td className="py-2.5 px-3 uppercase">Totais Consolidados:</td>
                        <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-mono">
                          {formatCurrency(totaisCurva.pago)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-indigo-600 dark:text-indigo-400 font-mono">
                          {formatCurrency(totaisCurva.aPagar)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-amber-600 dark:text-amber-400 font-mono">
                          {formatCurrency(totaisCurva.aMedir)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-900 dark:text-white font-mono font-black">
                          {formatCurrency(totaisCurva.total)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-[#00A3C4] dark:text-[#00C4EB] font-mono font-black">
                          {formatCurrency(totaisCurva.total)}
                        </td>
                      </tr>
                    ) : (
                      <tr>
                        <td className="py-2.5 px-3 uppercase">Totais Consolidados:</td>
                        <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400 font-mono">
                          {formatCurrency(totaisCurva.realizado)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-amber-600 dark:text-amber-400 font-mono">
                          {formatCurrency(totaisCurva.previsto)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-900 dark:text-white font-mono font-black">
                          {formatCurrency(totaisCurva.total)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-[#00A3C4] dark:text-[#00C4EB] font-mono font-black">
                          {formatCurrency(totaisCurva.total)}
                        </td>
                      </tr>
                    )}
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. SEGUNDA FILEIRA DE GRÁFICOS: POR DISCIPLINA & STATUS DE MEDIÇÃO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribuição por Disciplina */}
        <Card className="lg:col-span-2 border-slate-200 dark:border-[#0B384D] bg-white dark:bg-[#072B3B] shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#00A3C4]" />
                  Orçamento vs Contratado por Disciplina
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Comparação do valor orçado base com o valor efetivamente contratado
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigateTab('orcamentos')}
                className="text-xs text-[#00A3C4] hover:text-[#008EA9] h-8"
              >
                Ver Orçamento Completo →
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dadosDisciplinas}
                  layout="vertical"
                  margin={{ top: 5, right: 25, bottom: 5, left: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} horizontal={false} />
                  <XAxis type="number" tickFormatter={formatCurrencyShort} tick={{ fontSize: 10, fill: 'currentColor' }} />
                  <YAxis type="category" dataKey="disciplina" tick={{ fontSize: 10, fill: 'currentColor' }} width={80} />
                  <Tooltip
                    formatter={(val: any, name: any) => [formatCurrency(val as number), name]}
                    contentStyle={{
                      backgroundColor: '#072B3B',
                      borderRadius: '10px',
                      border: '1px solid #0B384D',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="base" name="Orçamento Base" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={10} />
                  <Bar dataKey="contratado" name="Valor Contratado" fill="#00A3C4" radius={[0, 4, 4, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribuição por Status das Medições */}
        <Card className="border-slate-200 dark:border-[#0B384D] bg-white dark:bg-[#072B3B] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#00A3C4]" />
              Status das Medições
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Divisão financeira das etapas de pagamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosStatusMedicoes}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {dadosStatusMedicoes.map((entry) => (
                      <Cell key={entry.name} fill={PIE_COLORS[entry.name] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any) => [formatCurrency(val as number), name]}
                    contentStyle={{
                      backgroundColor: '#072B3B',
                      borderRadius: '10px',
                      border: '1px solid #0B384D',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 mt-2">
              {dadosStatusMedicoes.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[d.name] || '#94a3b8' }}
                    />
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                      {d.name} ({d.count})
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatCurrency(d.value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
