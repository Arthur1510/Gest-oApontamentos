"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import {
  LayoutDashboard,
  Loader2,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Flame,
  ArrowUpRight,
  RefreshCw,
  FolderKanban,
} from 'lucide-react';
import { Apontamento, Projeto } from '@/types/apontamento';
import { supabase, isSupabaseConfigured, MOCK_APONTAMENTOS, MOCK_PROJETOS } from '@/lib/supabase/client';
import { SupabaseStatusBanner } from '@/components/apontamentos/SupabaseStatusBanner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Cores personalizadas para os gráficos
const STATUS_COLORS = {
  Aberto: '#f59e0b',    // Amber / Amarelo
  Resolvido: '#10b981', // Emerald / Verde
};

const PRIORIDADE_COLORS = {
  Alta: '#f43f5e',   // Rose / Vermelho
  Média: '#f97316',  // Orange / Laranja
  Baixa: '#0284c7',  // Sky / Azul
};

export default function DashboardPage() {
  const [apontamentos, setApontamentos] = useState<Apontamento[]>([]);
  const [projetosList, setProjetosList] = useState<Projeto[]>([]);
  const [selectedProjeto, setSelectedProjeto] = useState<string>('Todos');
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);

    if (isSupabaseConfigured() && supabase) {
      try {
        // Busca Lista de Projetos para o Filtro
        const { data: projData } = await supabase
          .from('projetos')
          .select('*')
          .order('nome', { ascending: true });

        if (projData) {
          setProjetosList(projData as Projeto[]);
        } else {
          setProjetosList(MOCK_PROJETOS);
        }

        // Busca Apontamentos
        const { data, error } = await supabase
          .from('apontamentos')
          .select('*, projetos(nome)')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erro ao carregar dados do Supabase:', error);
          setApontamentos(MOCK_APONTAMENTOS);
        } else if (data) {
          setApontamentos(data as Apontamento[]);
        }
      } catch (err) {
        console.error('Erro na comunicação com Supabase:', err);
        setApontamentos(MOCK_APONTAMENTOS);
        setProjetosList(MOCK_PROJETOS);
      }
    } else {
      setApontamentos(MOCK_APONTAMENTOS);
      setProjetosList(MOCK_PROJETOS);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Apontamentos Filtrados pelo Projeto Selecionado
  const filteredApontamentos = useMemo(() => {
    if (selectedProjeto === 'Todos') return apontamentos;
    return apontamentos.filter((a) => a.projeto_id === selectedProjeto);
  }, [apontamentos, selectedProjeto]);

  // 1. Agrupamento por Disciplina de Origem (Gráfico de Barras)
  const dataPorDisciplinaOrigem = useMemo(() => {
    const counts: Record<string, { total: number; abertos: number; resolvidos: number }> = {};

    filteredApontamentos.forEach((item) => {
      const disc = item.disciplina_origem || 'Outros';
      if (!counts[disc]) {
        counts[disc] = { total: 0, abertos: 0, resolvidos: 0 };
      }
      counts[disc].total += 1;
      if (item.status === 'Aberto') counts[disc].abertos += 1;
      if (item.status === 'Resolvido') counts[disc].resolvidos += 1;
    });

    return Object.entries(counts)
      .map(([disciplina, obj]) => ({
        disciplina,
        total: obj.total,
        Abertos: obj.abertos,
        Resolvidos: obj.resolvidos,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredApontamentos]);

  // 2. Proporção de Status: Aberto vs Resolvido (Gráfico de Pizza)
  const dataProporcaoStatus = useMemo(() => {
    const abertos = filteredApontamentos.filter((a) => a.status === 'Aberto').length;
    const resolvidos = filteredApontamentos.filter((a) => a.status === 'Resolvido').length;

    return [
      { name: 'Aberto', value: abertos, color: STATUS_COLORS.Aberto },
      { name: 'Resolvido', value: resolvidos, color: STATUS_COLORS.Resolvido },
    ];
  }, [filteredApontamentos]);

  // 3. Distribuição por Prioridade
  const dataPorPrioridade = useMemo(() => {
    const alta = filteredApontamentos.filter((a) => a.prioridade === 'Alta').length;
    const media = filteredApontamentos.filter((a) => a.prioridade === 'Média').length;
    const baixa = filteredApontamentos.filter((a) => a.prioridade === 'Baixa').length;

    return [
      { prioridade: 'Alta', quantidade: alta, color: PRIORIDADE_COLORS.Alta },
      { prioridade: 'Média', quantidade: media, color: PRIORIDADE_COLORS.Média },
      { prioridade: 'Baixa', quantidade: baixa, color: PRIORIDADE_COLORS.Baixa },
    ];
  }, [filteredApontamentos]);

  // Métricas Principais (KPIs)
  const totalApontamentos = filteredApontamentos.length;
  const totalResolvidos = filteredApontamentos.filter((a) => a.status === 'Resolvido').length;
  const taxaResolucao = totalApontamentos > 0 ? ((totalResolvidos / totalApontamentos) * 100).toFixed(1) : '0';
  const disciplinaComMaisConflitos = dataPorDisciplinaOrigem[0]?.disciplina || 'Nenhum';

  return (
    <main className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Banner de status Supabase */}
        <SupabaseStatusBanner />

        {/* Cabeçalho do Dashboard */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs uppercase tracking-wider">
              <LayoutDashboard className="h-4 w-4" /> Analytics & Relatórios
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mt-1">
              Dashboard de Indicadores
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Análise gráfica dos apontamentos por disciplina de origem, status de resolução e prioridade.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            {/* Filtro por Projeto no Dashboard */}
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-xl shadow-2xs">
              <FolderKanban className="h-4 w-4 text-indigo-600 dark:text-indigo-400 ml-2" />
              <select
                value={selectedProjeto}
                onChange={(e) => setSelectedProjeto(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none pr-2 cursor-pointer"
              >
                <option value="Todos">Todos os Projetos</option>
                {projetosList.map((p) => (
                  <option key={`dash-proj-${p.id}`} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchDashboardData}
              disabled={isLoading}
              className="gap-2 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Atualizar
            </Button>
          </div>
        </div>

        {/* Cards de KPIs em Destaque */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total de Apontamentos</span>
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                <BarChart3 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900 dark:text-slate-50">{totalApontamentos}</span>
              <span className="text-xs text-slate-500">registrados</span>
            </div>
          </div>

          {/* Taxa de Resolução */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/30 p-5 dark:border-emerald-800/30 dark:bg-emerald-950/20 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Taxa de Resolução</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-emerald-900 dark:text-emerald-200">{taxaResolucao}%</span>
              <span className="text-xs text-emerald-700/70 dark:text-emerald-400/70">concluídos</span>
            </div>
          </div>

          {/* Disciplina de Maior Origem */}
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-50/30 p-5 dark:border-indigo-800/30 dark:bg-indigo-950/20 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">Maior Origem</span>
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-lg font-bold text-indigo-950 dark:text-indigo-200 truncate" title={disciplinaComMaisConflitos}>
                {disciplinaComMaisConflitos}
              </div>
              <span className="text-xs text-indigo-700/70 dark:text-indigo-400/70">mais apontamentos</span>
            </div>
          </div>

          {/* Alta Prioridade */}
          <div className="rounded-xl border border-rose-500/20 bg-rose-50/30 p-5 dark:border-rose-800/30 dark:bg-rose-950/20 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wider">Prioridade Alta</span>
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <Flame className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-rose-900 dark:text-rose-200">
                {filteredApontamentos.filter((a) => a.prioridade === 'Alta').length}
              </span>
              <span className="text-xs text-rose-700/70 dark:text-rose-400/70">críticos</span>
            </div>
          </div>
        </div>

        {/* Seção Principal de Gráficos Recharts */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
            <p className="text-xs text-slate-500 font-medium">Carregando relatórios visuais...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Gráfico 1: Barras - Apontamentos por Disciplina de Origem */}
            <Card className="lg:col-span-7">
              <CardHeader>
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider">
                  <BarChart3 className="h-4 w-4" /> Gráfico de Barras
                </div>
                <CardTitle className="text-lg">Apontamentos por Disciplina de Origem</CardTitle>
                <CardDescription>
                  Volume total de interferências e pendências abertas/resolvidas por área técnica.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dataPorDisciplinaOrigem}
                      margin={{ top: 20, right: 20, left: -10, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis
                        dataKey="disciplina"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                      />
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
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="Abertos" fill={STATUS_COLORS.Aberto} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Resolvidos" fill={STATUS_COLORS.Resolvido} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico 2: Pizza - Proporção de Status (Aberto vs Resolvido) */}
            <Card className="lg:col-span-5">
              <CardHeader>
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider">
                  <PieIcon className="h-4 w-4" /> Gráfico de Pizza
                </div>
                <CardTitle className="text-lg">Proporção de Status</CardTitle>
                <CardDescription>
                  Distribuição percentual entre apontamentos Abertos e Resolvidos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dataProporcaoStatus}
                        cx="50%"
                        cy="45%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {dataProporcaoStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '8px',
                          color: '#f8fafc',
                          fontSize: '12px',
                        }}
                      />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Número Central no Donut */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                    <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {totalApontamentos}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium uppercase">Total</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico 3: Distribuição por Nível de Prioridade */}
            <Card className="lg:col-span-12">
              <CardHeader>
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider">
                  <Flame className="h-4 w-4" /> Distribuição de Níveis
                </div>
                <CardTitle className="text-lg">Apontamentos por Nível de Prioridade</CardTitle>
                <CardDescription>
                  Classificação da gravidade dos problemas registrados na obra/projeto.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={dataPorPrioridade}
                      margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis dataKey="prioridade" type="category" tick={{ fontSize: 12, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '8px',
                          color: '#f8fafc',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="quantidade" radius={[0, 6, 6, 0]}>
                        {dataPorPrioridade.map((entry, index) => (
                          <Cell key={`cell-prio-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
