"use client";

import React, { useMemo } from 'react';
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
  ArrowRightCircle,
  Building,
  FolderKanban,
} from 'lucide-react';

interface ArcisDashboardChartsProps {
  conflitos: ConflitoArcis[];
}

const TIPO_COLORS = ['#f43f5e', '#00a3c4', '#f59e0b', '#10b981', '#6366f1', '#ec4899'];

export function ArcisDashboardCharts({ conflitos }: ArcisDashboardChartsProps) {
  // 1. Proporção por Status ARCIS
  const dataStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    conflitos.forEach((c) => {
      const st = c.status_arcis;
      counts[st] = (counts[st] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: STATUS_ARCIS_COLORS[name as keyof typeof STATUS_ARCIS_COLORS]?.barColor || '#00a3c4',
    }));
  }, [conflitos]);

  // 2. Conflitos por Disciplina Principal
  const dataDisciplinas = useMemo(() => {
    const counts: Record<string, { total: number; normativos: number }> = {};
    conflitos.forEach((c) => {
      const disc = c.disciplina_principal || 'Geral';
      if (!counts[disc]) {
        counts[disc] = { total: 0, normativos: 0 };
      }
      counts[disc].total += 1;
      if (c.tipo_conflito.toLowerCase().includes('normativ')) {
        counts[disc].normativos += 1;
      }
    });

    return Object.entries(counts)
      .map(([disciplina, vals]) => ({
        disciplina,
        Total: vals.total,
        Normativos: vals.normativos,
        Outros: vals.total - vals.normativos,
      }))
      .sort((a, b) => b.Total - a.Total);
  }, [conflitos]);

  // 3. Distribuição por Tipo de Conflito
  const dataTipos = useMemo(() => {
    const counts: Record<string, number> = {};
    conflitos.forEach((c) => {
      const tc = c.tipo_conflito || 'Outros';
      counts[tc] = (counts[tc] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value], idx) => ({
      name,
      value,
      color: TIPO_COLORS[idx % TIPO_COLORS.length],
    }));
  }, [conflitos]);

  // 4. Distribuição por Pavimento / Nível
  const dataPavimentos = useMemo(() => {
    const counts: Record<string, number> = {};
    conflitos.forEach((c) => {
      if (c.pavimentos && c.pavimentos.length > 0) {
        c.pavimentos.forEach((pav) => {
          const clean = pav.trim();
          counts[clean] = (counts[clean] || 0) + 1;
        });
      } else {
        const local = c.localizacao || 'Torre Geral';
        counts[local] = (counts[local] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([pavimento, quantidade]) => ({
        pavimento: pavimento.length > 22 ? `${pavimento.slice(0, 20)}...` : pavimento,
        quantidade,
      }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 8); // Top 8 pavimentos
  }, [conflitos]);

  // 5. Conflitos por Projeto / Empreendimento
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

  const totalConflitos = conflitos.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Gráfico 1: Proporção de Status ARCIS */}
      <Card className="lg:col-span-5 dark:bg-[#072B3B] dark:border-[#0B384D]">
        <CardHeader>
          <div className="flex items-center gap-2 text-[#00A3C4] dark:text-[#00C4EB] text-xs font-bold uppercase tracking-wider">
            <PieIcon className="h-4 w-4" /> Distribuição ARCIS
          </div>
          <CardTitle className="text-lg">Status dos Conflitos ARCIS</CardTitle>
          <CardDescription>
            Acompanhamento do fluxo entre Aguardando Solução, Solução Proposta e Encerrado.
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
                {totalConflitos}
              </span>
              <span className="text-[10px] text-slate-500 font-medium uppercase">Conflitos</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico 2: Disciplinas Principais & Conflitos Normativos */}
      <Card className="lg:col-span-7 dark:bg-[#072B3B] dark:border-[#0B384D]">
        <CardHeader>
          <div className="flex items-center gap-2 text-[#00A3C4] dark:text-[#00C4EB] text-xs font-bold uppercase tracking-wider">
            <BarChart3 className="h-4 w-4" /> Análise por Disciplina
          </div>
          <CardTitle className="text-lg">Disciplina Principal dos Conflitos</CardTitle>
          <CardDescription>
            Detalhamento das áreas técnicas mais impactadas e incidência de conflitos normativos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataDisciplinas} margin={{ top: 20, right: 20, left: -10, bottom: 30 }}>
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
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Normativos" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Conflito Normativo" />
                <Bar dataKey="Outros" fill="#00a3c4" radius={[4, 4, 0, 0]} name="Outras Análises" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico 3: Categorização por Tipo de Conflito */}
      <Card className="lg:col-span-6 dark:bg-[#072B3B] dark:border-[#0B384D]">
        <CardHeader>
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-semibold uppercase tracking-wider">
            <ShieldAlert className="h-4 w-4" /> Tipologia ARCIS
          </div>
          <CardTitle className="text-lg">Classificação de Conflitos</CardTitle>
          <CardDescription>
            Conflitos Normativos (Exigências de Corpo de Bombeiros / CBMMG) vs Análises Críticas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataTipos} margin={{ top: 10, right: 20, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {dataTipos.map((entry, index) => (
                    <Cell key={`cell-tp-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico 4: Concentração por Pavimento */}
      <Card className="lg:col-span-6 dark:bg-[#072B3B] dark:border-[#0B384D]">
        <CardHeader>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <Layers className="h-4 w-4" /> Localização Vertical
          </div>
          <CardTitle className="text-lg">Incidência por Pavimento / Nível</CardTitle>
          <CardDescription>
            Andares e áreas com maior concentração de interferências apontadas pela compatibilizadora.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={dataPavimentos} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis dataKey="pavimento" type="category" tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="quantidade" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico 5: Segmentação por Projeto / Empreendimento */}
      {dataProjetos.length > 0 && (
        <Card className="lg:col-span-12 dark:bg-[#072B3B] dark:border-[#0B384D]">
          <CardHeader>
            <div className="flex items-center gap-2 text-[#00A3C4] dark:text-[#00C4EB] text-xs font-bold uppercase tracking-wider">
              <FolderKanban className="h-4 w-4" /> Segmentação por Empreendimento
            </div>
            <CardTitle className="text-lg">Conflitos ARCIS por Projeto Cadastrado</CardTitle>
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
  );
}
