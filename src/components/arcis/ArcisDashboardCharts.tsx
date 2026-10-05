"use client";

import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ConflitoArcis, STATUS_ARCIS_COLORS } from '@/types/arcis';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  PieChart as PieIcon,
  BarChart3,
  ShieldAlert,
  Layers,
  Building,
  FolderKanban,
  Activity,
  AlertTriangle,
  CheckCircle2,
  GitCompare,
  TrendingUp,
  Filter,
} from 'lucide-react';

interface ArcisDashboardChartsProps {
  conflitos: ConflitoArcis[];
}

export const TIPO_CONFLITO_COLORS: Record<string, string> = {
  'Conflito Normativo': '#f43f5e', // Rose
  'Análise Crítica Inicial': '#8b5cf6', // Violet
  'Interferência Geométrica': '#00a3c4', // Cyan
  'Inconsistência Técnica': '#f59e0b', // Amber
  'Definição de Produto': '#3b82f6', // Blue
  'Conflito Físico': '#ec4899', // Pink
  'Conflito Funcional': '#14b8a6', // Teal
  'Informação': '#64748b', // Slate
};

const DEFAULT_PALETTE = ['#f43f5e', '#8b5cf6', '#00a3c4', '#f59e0b', '#ec4899', '#14b8a6', '#3b82f6', '#64748b'];

const getTipoColor = (tipo: string, idx = 0) => {
  return TIPO_CONFLITO_COLORS[tipo] || DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length];
};

const PRIORIDADE_COLORS: Record<string, string> = {
  'Urgente': '#ef4444',
  'Alta': '#f97316',
  'Normal': '#00a3c4',
  'Baixa': '#10b981',
};

export function ArcisDashboardCharts({ conflitos }: ArcisDashboardChartsProps) {
  const [tipoFiltro, setTipoFiltro] = useState<string | null>(null);

  // Lista única de tipos de conflito existentes na lista atual
  const todosTipos = useMemo(() => {
    const set = new Set<string>();
    conflitos.forEach((c) => {
      if (c.tipo_conflito) set.add(c.tipo_conflito);
    });
    return Array.from(set).sort();
  }, [conflitos]);

  // Conflitos filtrados pelo seletor de tipo rápido (ou todos)
  const conflitosFiltrados = useMemo(() => {
    if (!tipoFiltro) return conflitos;
    return conflitos.filter((c) => c.tipo_conflito === tipoFiltro);
  }, [conflitos, tipoFiltro]);

  const totalConflitos = conflitos.length;

  // ========== CARDS DE INSIGHTS RELACIONAIS ==========
  const insights = useMemo(() => {
    if (conflitos.length === 0) {
      return {
        tipoTop: '-',
        tipoTopPct: 0,
        urgentesCount: 0,
        urgentesPct: 0,
        tipoMaisUrgente: '-',
        parMaisConflitante: '-',
        parMaisConflitanteCount: 0,
        resolvidosPct: 0,
      };
    }

    const tipoCounts: Record<string, number> = {};
    const urgentesPorTipo: Record<string, number> = {};
    let totalUrgentes = 0;
    const parCounts: Record<string, number> = {};
    let totalComSolucao = 0;

    conflitos.forEach((c) => {
      const tp = c.tipo_conflito || 'Outros';
      tipoCounts[tp] = (tipoCounts[tp] || 0) + 1;

      if (c.prioridade === 'Urgente' || c.prioridade === 'Alta') {
        totalUrgentes++;
        urgentesPorTipo[tp] = (urgentesPorTipo[tp] || 0) + 1;
      }

      if (c.status_arcis !== 'Aguardando Solução') {
        totalComSolucao++;
      }

      const discP = c.disciplina_principal || 'Geral';
      const envs = c.disciplinas_envolvidas && c.disciplinas_envolvidas.length > 0
        ? c.disciplinas_envolvidas
        : ['Interno'];

      envs.forEach((env) => {
        const pair = `${discP} ↔ ${env}`;
        parCounts[pair] = (parCounts[pair] || 0) + 1;
      });
    });

    const sortedTipos = Object.entries(tipoCounts).sort((a, b) => b[1] - a[1]);
    const topTipoEntry = sortedTipos[0] || ['-', 0];

    const sortedUrgentes = Object.entries(urgentesPorTipo).sort((a, b) => b[1] - a[1]);
    const topUrgenteTipo = sortedUrgentes[0] ? sortedUrgentes[0][0] : '-';

    const sortedPares = Object.entries(parCounts).sort((a, b) => b[1] - a[1]);
    const topPar = sortedPares[0] ? sortedPares[0][0] : '-';
    const topParCount = sortedPares[0] ? sortedPares[0][1] : 0;

    return {
      tipoTop: topTipoEntry[0],
      tipoTopPct: Math.round((topTipoEntry[1] / conflitos.length) * 100),
      urgentesCount: totalUrgentes,
      urgentesPct: Math.round((totalUrgentes / conflitos.length) * 100),
      tipoMaisUrgente: topUrgenteTipo,
      parMaisConflitante: topPar,
      parMaisConflitanteCount: topParCount,
      resolvidosPct: Math.round((totalComSolucao / conflitos.length) * 100),
    };
  }, [conflitos]);

  // ========== 1. RELAÇÃO: TIPO DE CONFLITO × DISCIPLINA PRINCIPAL ==========
  const dataTipoXDisciplina = useMemo(() => {
    const discMap: Record<string, Record<string, number>> = {};
    const tiposEncontrados = new Set<string>();

    conflitos.forEach((c) => {
      const disc = c.disciplina_principal || 'Geral';
      const tp = c.tipo_conflito || 'Outros';
      tiposEncontrados.add(tp);

      if (!discMap[disc]) discMap[disc] = {};
      discMap[disc][tp] = (discMap[disc][tp] || 0) + 1;
    });

    const tiposList = Array.from(tiposEncontrados);

    const rows = Object.entries(discMap).map(([disciplina, counts]) => {
      const row: Record<string, any> = { disciplina };
      let total = 0;
      tiposList.forEach((tp) => {
        const val = counts[tp] || 0;
        row[tp] = val;
        total += val;
      });
      row._total = total;
      return row;
    });

    return {
      rows: rows.sort((a, b) => b._total - a._total),
      tipos: tiposList,
    };
  }, [conflitos]);

  // ========== 2. RELAÇÃO: TIPO DE CONFLITO × NÍVEL DE PRIORIDADE (SEVERIDADE) ==========
  const dataTipoXPrioridade = useMemo(() => {
    const map: Record<string, { Urgente: number; Alta: number; Normal: number; Baixa: number; total: number }> = {};

    conflitos.forEach((c) => {
      const tp = c.tipo_conflito || 'Outros';
      if (!map[tp]) {
        map[tp] = { Urgente: 0, Alta: 0, Normal: 0, Baixa: 0, total: 0 };
      }
      const p = c.prioridade || 'Normal';
      if (p in map[tp]) {
        map[tp][p as 'Urgente' | 'Alta' | 'Normal' | 'Baixa'] += 1;
      } else {
        map[tp].Normal += 1;
      }
      map[tp].total += 1;
    });

    return Object.entries(map)
      .map(([tipo, vals]) => ({
        tipo,
        Urgente: vals.Urgente,
        Alta: vals.Alta,
        Normal: vals.Normal,
        Baixa: vals.Baixa,
        total: vals.total,
      }))
      .sort((a, b) => b.total - a.total);
  }, [conflitos]);

  // ========== 3. RELAÇÃO: TIPO DE CONFLITO × STATUS DE RESOLUÇÃO ==========
  const dataTipoXStatus = useMemo(() => {
    const map: Record<string, { pendente: number; proposta: number; aprovado: number; total: number }> = {};

    conflitos.forEach((c) => {
      const tp = c.tipo_conflito || 'Outros';
      if (!map[tp]) {
        map[tp] = { pendente: 0, proposta: 0, aprovado: 0, total: 0 };
      }
      const st = c.status_arcis;
      if (st === 'Aguardando Solução') {
        map[tp].pendente += 1;
      } else if (st.includes('Proposta') || st.includes('Aguardando Aprovação')) {
        map[tp].proposta += 1;
      } else {
        map[tp].aprovado += 1;
      }
      map[tp].total += 1;
    });

    return Object.entries(map)
      .map(([tipo, vals]) => ({
        tipo,
        'Aguardando Solução': vals.pendente,
        'Solução Proposta': vals.proposta,
        'Aprovado / Encerrado': vals.aprovado,
        total: vals.total,
      }))
      .sort((a, b) => b.total - a.total);
  }, [conflitos]);

  // ========== 4. RELAÇÃO: INTERFACES ENTRE PARES DE DISCIPLINAS E SEUS TIPOS ==========
  const dataParesDisciplinas = useMemo(() => {
    const pairs: Record<string, { pair: string; total: number; tipos: Record<string, number> }> = {};
    const tiposEncontrados = new Set<string>();

    conflitos.forEach((c) => {
      const p = c.disciplina_principal || 'Geral';
      const envs = c.disciplinas_envolvidas && c.disciplinas_envolvidas.length > 0
        ? c.disciplinas_envolvidas
        : ['Sem Interface Externa'];

      const tp = c.tipo_conflito || 'Outros';
      tiposEncontrados.add(tp);

      envs.forEach((env) => {
        const key = `${p} ↔ ${env}`;
        if (!pairs[key]) {
          pairs[key] = { pair: key, total: 0, tipos: {} };
        }
        pairs[key].total += 1;
        pairs[key].tipos[tp] = (pairs[key].tipos[tp] || 0) + 1;
      });
    });

    const tiposList = Array.from(tiposEncontrados);

    const rows = Object.values(pairs)
      .sort((a, b) => b.total - a.total)
      .slice(0, 7)
      .map((item) => {
        const row: Record<string, any> = {
          interface: item.pair.length > 28 ? `${item.pair.slice(0, 26)}...` : item.pair,
          nomeCompleto: item.pair,
          total: item.total,
        };
        tiposList.forEach((tp) => {
          row[tp] = item.tipos[tp] || 0;
        });
        return row;
      });

    return { rows, tipos: tiposList };
  }, [conflitos]);

  // ========== 5. RELAÇÃO: PAVIMENTO / NÍVEL × TIPOS DE CONFLITO ==========
  const dataPavimentoXTipos = useMemo(() => {
    const counts: Record<string, { total: number; tipos: Record<string, number> }> = {};
    const tiposEncontrados = new Set<string>();

    conflitos.forEach((c) => {
      const tp = c.tipo_conflito || 'Outros';
      tiposEncontrados.add(tp);

      const pavs = c.pavimentos && c.pavimentos.length > 0 ? c.pavimentos : [c.localizacao || 'Torre Geral'];
      pavs.forEach((pav) => {
        const clean = pav.trim();
        if (!counts[clean]) {
          counts[clean] = { total: 0, tipos: {} };
        }
        counts[clean].total += 1;
        counts[clean].tipos[tp] = (counts[clean].tipos[tp] || 0) + 1;
      });
    });

    const tiposList = Array.from(tiposEncontrados);

    const rows = Object.entries(counts)
      .map(([pavimento, data]) => {
        const row: Record<string, any> = {
          pavimento: pavimento.length > 22 ? `${pavimento.slice(0, 20)}...` : pavimento,
          nomeCompleto: pavimento,
          total: data.total,
        };
        tiposList.forEach((tp) => {
          row[tp] = data.tipos[tp] || 0;
        });
        return row;
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);

    return { rows, tipos: tiposList };
  }, [conflitos]);

  // ========== 6. PROPORÇÃO GERAL DE STATUS RSC ==========
  const dataStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    conflitosFiltrados.forEach((c) => {
      const st = c.status_arcis;
      counts[st] = (counts[st] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: STATUS_ARCIS_COLORS[name as keyof typeof STATUS_ARCIS_COLORS]?.barColor || '#00a3c4',
    }));
  }, [conflitosFiltrados]);

  // ========== 7. SEGMENTAÇÃO POR PROJETO / EMPREENDIMENTO ==========
  const dataProjetos = useMemo(() => {
    const counts: Record<string, { total: number; normativos: number; pendentes: number }> = {};
    conflitos.forEach((c) => {
      const projNome = c.projetos?.nome || 'Sem Projeto Vinculado';
      if (!counts[projNome]) {
        counts[projNome] = { total: 0, normativos: 0, pendentes: 0 };
      }
      counts[projNome].total += 1;
      if (c.tipo_conflito.toLowerCase().includes('normativ')) {
        counts[projNome].normativos += 1;
      }
      if (c.status_arcis === 'Aguardando Solução') {
        counts[projNome].pendentes += 1;
      }
    });

    return Object.entries(counts)
      .map(([projeto, vals]) => ({
        projeto: projeto.length > 20 ? `${projeto.slice(0, 18)}...` : projeto,
        nomeCompleto: projeto,
        Total: vals.total,
        Normativos: vals.normativos,
        Pendentes: vals.pendentes,
      }))
      .sort((a, b) => b.Total - a.Total);
  }, [conflitos]);

  const totalConflitosDisplay = conflitos.length;

  return (
    <div className="space-y-6">
      {/* 4 CARDS DE INSIGHTS EXECUTIVOS SOBRE AS RELAÇÕES DE CONFLITO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tipologia Predominante */}
        <div className="bg-white dark:bg-[#072B3B] border border-slate-200/80 dark:border-[#0B384D] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Tipologia Dominante
            </span>
            <div className="p-2 rounded-xl bg-[#00A3C4]/15 text-[#00A3C4]">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xl font-black text-slate-900 dark:text-white truncate block">
              {insights.tipoTop}
            </span>
            <span className="text-xs text-[#008EA9] dark:text-[#00C4EB] font-bold">
              {insights.tipoTopPct}% de incidência ({conflitos.filter(c => c.tipo_conflito === insights.tipoTop).length} itens)
            </span>
          </div>
        </div>

        {/* Card 2: Conflitos Críticos & Urgentes */}
        <div className="bg-white dark:bg-[#072B3B] border border-slate-200/80 dark:border-[#0B384D] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Urgência / Risco Alto
            </span>
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-700 dark:text-rose-400">
              {insights.urgentesCount}
            </span>
            <span className="text-xs text-rose-600/80 dark:text-rose-400/80 font-medium">
              ({insights.urgentesPct}% do total)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            Maior foco: <strong className="text-slate-700 dark:text-slate-300">{insights.tipoMaisUrgente}</strong>
          </p>
        </div>

        {/* Card 3: Interface Disciplinar Mais Conflitante */}
        <div className="bg-white dark:bg-[#072B3B] border border-slate-200/80 dark:border-[#0B384D] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Interface Crítica
            </span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <GitCompare className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm font-black text-slate-900 dark:text-white truncate block" title={insights.parMaisConflitante}>
              {insights.parMaisConflitante}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">
              {insights.parMaisConflitanteCount} interferências registradas
            </span>
          </div>
        </div>

        {/* Card 4: Taxa de Resolução Global */}
        <div className="bg-white dark:bg-[#072B3B] border border-slate-200/80 dark:border-[#0B384D] rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Índice de Tratativa
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
              {insights.resolvidosPct}%
            </span>
            <span className="text-xs text-emerald-600/80 dark:text-emerald-400/80 font-medium">
              com proposta / resolvidos
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {totalConflitosDisplay - conflitos.filter(c => c.status_arcis === 'Aguardando Solução').length} de {totalConflitosDisplay} conflitos atendidos
          </p>
        </div>
      </div>

      {/* SELETOR INTERATIVO RÁPIDO DE TIPO DE CONFLITO */}
      <div className="bg-white dark:bg-[#072B3B] border border-slate-200/80 dark:border-[#0B384D] rounded-2xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#00A3C4]" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Filtrar Tipologia nos Gráficos:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTipoFiltro(null)}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              tipoFiltro === null
                ? 'bg-[#00A3C4] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-[#0B384D] text-slate-600 dark:text-slate-300 hover:bg-[#00A3C4]/10'
            }`}
          >
            Todos os Tipos ({totalConflitosDisplay})
          </button>

          {todosTipos.map((tipo) => {
            const count = conflitos.filter((c) => c.tipo_conflito === tipo).length;
            const isSel = tipoFiltro === tipo;
            const color = getTipoColor(tipo);

            return (
              <button
                key={`btn-tipo-${tipo}`}
                type="button"
                onClick={() => setTipoFiltro(isSel ? null : tipo)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSel
                    ? 'text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-[#0B384D] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#0B384D]/80'
                }`}
                style={isSel ? { backgroundColor: color } : undefined}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span>{tipo}</span>
                <span className="text-[10px] opacity-80">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* GRID PRINCIPAL DE GRÁFICOS RELACIONAIS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* GRÁFICO 1: RELAÇÃO TIPO DE CONFLITO × DISCIPLINA PRINCIPAL (STACKED BAR) */}
        <Card className="lg:col-span-7 dark:bg-[#072B3B] dark:border-[#0B384D]">
          <CardHeader>
            <div className="flex items-center gap-2 text-[#00A3C4] dark:text-[#00C4EB] text-xs font-bold uppercase tracking-wider">
              <BarChart3 className="h-4 w-4" /> Cruzamento Multidisciplinar
            </div>
            <CardTitle className="text-lg">Relação: Tipos de Conflito × Disciplina Principal</CardTitle>
            <CardDescription>
              Composição detalhada das tipologias de conflito que incidem em cada disciplina técnica.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataTipoXDisciplina.rows} margin={{ top: 20, right: 20, left: -15, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="disciplina" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#072B3B',
                      borderColor: '#0B384D',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                  {dataTipoXDisciplina.tipos.map((tipo, idx) => (
                    <Bar
                      key={`bar-disc-tp-${tipo}`}
                      dataKey={tipo}
                      stackId="disciplinas"
                      fill={getTipoColor(tipo, idx)}
                      radius={[0, 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* GRÁFICO 2: PROPORÇÃO DE STATUS RSC */}
        <Card className="lg:col-span-5 dark:bg-[#072B3B] dark:border-[#0B384D]">
          <CardHeader>
            <div className="flex items-center gap-2 text-[#00A3C4] dark:text-[#00C4EB] text-xs font-bold uppercase tracking-wider">
              <PieIcon className="h-4 w-4" /> Distribuição RSC
            </div>
            <CardTitle className="text-lg">Status dos Conflitos RSC</CardTitle>
            <CardDescription>
              Acompanhamento do fluxo entre Aguardando Solução, Propostas e Encerrados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataStatus}
                    cx="50%"
                    cy="45%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {dataStatus.map((entry, index) => (
                      <Cell key={`cell-arcis-st-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#072B3B',
                      borderColor: '#0B384D',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                <span className="text-2xl font-black text-[#072B3B] dark:text-white">
                  {conflitosFiltrados.length}
                </span>
                <span className="text-[10px] text-slate-500 font-medium uppercase">Conflitos</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GRÁFICO 3: RELAÇÃO TIPO DE CONFLITO × GRAVIDADE / CRITICIDADE (PRIORIDADE) */}
        <Card className="lg:col-span-6 dark:bg-[#072B3B] dark:border-[#0B384D]">
          <CardHeader>
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-semibold uppercase tracking-wider">
              <ShieldAlert className="h-4 w-4" /> Relação de Criticidade
            </div>
            <CardTitle className="text-lg">Tipo de Conflito × Nível de Prioridade</CardTitle>
            <CardDescription>
              Identificação de quais tipos de apontamento concentram os riscos mais urgentes da obra.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataTipoXPrioridade} margin={{ top: 15, right: 20, left: -15, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="tipo" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#072B3B',
                      borderColor: '#0B384D',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="Urgente" stackId="prio" fill={PRIORIDADE_COLORS['Urgente']} radius={[0, 0, 0, 0]} name="Urgente" />
                  <Bar dataKey="Alta" stackId="prio" fill={PRIORIDADE_COLORS['Alta']} radius={[0, 0, 0, 0]} name="Alta" />
                  <Bar dataKey="Normal" stackId="prio" fill={PRIORIDADE_COLORS['Normal']} radius={[0, 0, 0, 0]} name="Normal" />
                  <Bar dataKey="Baixa" stackId="prio" fill={PRIORIDADE_COLORS['Baixa']} radius={[4, 4, 0, 0]} name="Baixa" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* GRÁFICO 4: RELAÇÃO TIPO DE CONFLITO × STATUS DE RESOLUÇÃO */}
        <Card className="lg:col-span-6 dark:bg-[#072B3B] dark:border-[#0B384D]">
          <CardHeader>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <Activity className="h-4 w-4" /> Fluxo de Resolução
            </div>
            <CardTitle className="text-lg">Tipo de Conflito × Status de Resolução</CardTitle>
            <CardDescription>
              Comparativo entre pendências aguardando solução vs propostas em andamento e aprovações.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataTipoXStatus} margin={{ top: 15, right: 20, left: -15, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="tipo" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#072B3B',
                      borderColor: '#0B384D',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="Aguardando Solução" stackId="status" fill="#f59e0b" name="Aguardando Solução" />
                  <Bar dataKey="Solução Proposta" stackId="status" fill="#6366f1" name="Solução Proposta" />
                  <Bar dataKey="Aprovado / Encerrado" stackId="status" fill="#10b981" radius={[4, 4, 0, 0]} name="Aprovado / Encerrado" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* GRÁFICO 5: MATRIZ DE INTERFACES MULTIDISCIPLINARES (PARES DE DISCIPLINAS) */}
        <Card className="lg:col-span-6 dark:bg-[#072B3B] dark:border-[#0B384D]">
          <CardHeader>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <GitCompare className="h-4 w-4" /> Interfaces Multidisciplinares
            </div>
            <CardTitle className="text-lg">Interferências por Pares de Disciplinas</CardTitle>
            <CardDescription>
              Frentes de interface com maior volume de conflitos cruzados e sua tipologia.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={dataParesDisciplinas.rows}
                  margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis dataKey="interface" type="category" tick={{ fontSize: 10, fill: '#64748b' }} width={140} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#072B3B',
                      borderColor: '#0B384D',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px' }} />
                  {dataParesDisciplinas.tipos.map((tipo, idx) => (
                    <Bar
                      key={`bar-pair-tp-${tipo}`}
                      dataKey={tipo}
                      stackId="pairs"
                      fill={getTipoColor(tipo, idx)}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* GRÁFICO 6: CONCENTRAÇÃO POR PAVIMENTO COM TIPOLOGIA */}
        <Card className="lg:col-span-6 dark:bg-[#072B3B] dark:border-[#0B384D]">
          <CardHeader>
            <div className="flex items-center gap-2 text-[#00A3C4] dark:text-[#00C4EB] text-xs font-semibold uppercase tracking-wider">
              <Layers className="h-4 w-4" /> Localização Vertical
            </div>
            <CardTitle className="text-lg">Incidência por Pavimento / Nível</CardTitle>
            <CardDescription>
              Andares mais impactados e tipos de conflito concentrados em cada nível.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={dataPavimentoXTipos.rows}
                  margin={{ top: 10, right: 30, left: 30, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis dataKey="pavimento" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={130} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#072B3B',
                      borderColor: '#0B384D',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '10px' }} />
                  {dataPavimentoXTipos.tipos.map((tipo, idx) => (
                    <Bar
                      key={`bar-pav-tp-${tipo}`}
                      dataKey={tipo}
                      stackId="pavimentos"
                      fill={getTipoColor(tipo, idx)}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* GRÁFICO 7: SEGMENTAÇÃO POR PROJETO / EMPREENDIMENTO */}
        {dataProjetos.length > 0 && (
          <Card className="lg:col-span-12 dark:bg-[#072B3B] dark:border-[#0B384D]">
            <CardHeader>
              <div className="flex items-center gap-2 text-[#00A3C4] dark:text-[#00C4EB] text-xs font-bold uppercase tracking-wider">
                <FolderKanban className="h-4 w-4" /> Segmentação por Empreendimento
              </div>
              <CardTitle className="text-lg">Conflitos RSC por Projeto Cadastrado</CardTitle>
              <CardDescription>
                Comparativo de pendências técnicas, soluções propostas e conflitos normativos entre os empreendimentos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dataProjetos} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="projeto" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#072B3B',
                        borderColor: '#0B384D',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '12px',
                      }}
                    />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="Total" fill="#00a3c4" radius={[4, 4, 0, 0]} name="Total de Conflitos" />
                    <Bar dataKey="Pendentes" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Aguardando Solução" />
                    <Bar dataKey="Normativos" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Conflitos Normativos" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
