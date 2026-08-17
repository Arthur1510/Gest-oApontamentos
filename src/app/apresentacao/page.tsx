"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Home,
  CheckCircle2,
  AlertCircle,
  FolderKanban,
  ArrowRight,
  ShieldAlert,
  Lightbulb,
  Images,
  Sparkles,
  Loader2,
  Layers,
  Filter,
} from 'lucide-react';
import { Apontamento, Projeto, TIPOS_CONFLITO_OPCOES } from '@/types/apontamento';
import { supabase, isSupabaseConfigured, MOCK_APONTAMENTOS, MOCK_PROJETOS } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SelectNative } from '@/components/ui/select-native';
import { ThemeToggle } from '@/components/ThemeToggle';
import { formatDate } from '@/lib/utils';

export default function ResumoExecutivoPage() {
  const [apontamentos, setApontamentos] = useState<Apontamento[]>([]);
  const [projetosList, setProjetosList] = useState<Projeto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros de Resumo
  const [selectedProjeto, setSelectedProjeto] = useState<string>('Todos');
  const [selectedPrioridade, setSelectedPrioridade] = useState<string>('Todas');

  // Controle de Slides (0 = Capa Resumo Executivo, 1..N = Apontamentos)
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);

  // Seleção de Foto ativa no slide atual (0, 1, 2...)
  const [activeImageTab, setActiveImageTab] = useState<'apontamento' | 'solucao'>('apontamento');
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Carregar dados
  const fetchData = useCallback(async () => {
    setIsLoading(true);

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: projData } = await supabase
          .from('projetos')
          .select('*')
          .order('nome', { ascending: true });

        if (projData) {
          setProjetosList(projData as Projeto[]);
        } else {
          setProjetosList(MOCK_PROJETOS);
        }

        const { data, error } = await supabase
          .from('apontamentos')
          .select('*, projetos(nome)')
          .order('created_at', { ascending: false });

        if (error || !data) {
          setApontamentos(MOCK_APONTAMENTOS);
        } else {
          setApontamentos(data as Apontamento[]);
        }
      } catch (err) {
        console.error('Falha ao carregar dados do resumo:', err);
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
    fetchData();
  }, [fetchData]);

  // Lista Filtrada para Resumo
  const filteredApontamentos = apontamentos.filter((item) => {
    const matchesProjeto =
      selectedProjeto === 'Todos' || item.projeto_id === selectedProjeto;
    const matchesPrioridade =
      selectedPrioridade === 'Todas' || item.prioridade === selectedPrioridade;
    return matchesProjeto && matchesPrioridade;
  });

  const totalSlides = filteredApontamentos.length + 1; // 1 Capa + N Apontamentos

  // Reset de imagem ativa ao trocar de slide
  useEffect(() => {
    setActiveImageTab('apontamento');
    setActiveImageIdx(0);
  }, [currentSlideIdx]);

  // Navegação por teclado (Setas Esquerda/Direita, Espaço)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        setCurrentSlideIdx((prev) => (prev < totalSlides - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentSlideIdx((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Home') {
        e.preventDefault();
        setCurrentSlideIdx(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalSlides]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  const handleToggleStatus = async (item: Apontamento) => {
    const novoStatus = item.status === 'Aberto' ? 'Resolvido' : 'Aberto';
    setApontamentos((prev) =>
      prev.map((a) => (a.id === item.id ? { ...a, status: novoStatus } : a))
    );

    if (isSupabaseConfigured() && supabase) {
      await supabase
        .from('apontamentos')
        .update({ status: novoStatus })
        .eq('id', item.id);
    }
  };

  // KPIs Executivos para a Capa
  const totalApontamentos = filteredApontamentos.length;
  const totalResolvidos = filteredApontamentos.filter((a) => a.status === 'Resolvido').length;
  const totalAbertos = totalApontamentos - totalResolvidos;
  const taxaResolucao = totalApontamentos > 0 ? Math.round((totalResolvidos / totalApontamentos) * 100) : 0;
  const totalAltaPrioridade = filteredApontamentos.filter((a) => a.prioridade === 'Alta').length;

  return (
    <main className="h-screen w-screen bg-slate-50 dark:bg-[#072B3B] text-[#072B3B] dark:text-slate-100 flex flex-col justify-between select-none overflow-hidden font-sans transition-colors duration-300">
      {/* BARRA SUPERIOR DE CONTROLE DO RESUMO EXECUTIVO */}
      <header className="no-print bg-white/95 dark:bg-[#041A24]/90 border-b border-slate-200 dark:border-[#0B384D] px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 backdrop-blur-md shrink-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-xs text-slate-600 dark:text-slate-300 hover:text-[#072B3B] dark:hover:text-white gap-1.5 h-8">
              <Home className="h-4 w-4" /> Voltar ao Painel
            </Button>
          </Link>
          <div className="h-4 w-px bg-slate-200 dark:border-[#0B384D]" />
          <div className="flex items-center gap-2">
            <div className="px-2 py-0.5 rounded bg-[#072B3B] dark:bg-white text-white dark:text-[#072B3B] font-black text-xs tracking-wider border border-[#00A3C4]/40">
              WCC
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xs text-[#072B3B] dark:text-white tracking-wide leading-tight">
                APRESENTAÇÃO EXECUTIVA
              </span>
              <span className="text-[9px] font-bold text-[#00A3C4] tracking-widest leading-tight">
                2026 • AURA | ELBRUS
              </span>
            </div>
          </div>
        </div>

        {/* Filtros Rápido no Topo */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <Filter className="h-3.5 w-3.5 text-[#00A3C4]" />
            <span>Projeto:</span>
          </div>
          <SelectNative
            variant="indigo"
            value={selectedProjeto}
            onChange={(e) => {
              setSelectedProjeto(e.target.value);
              setCurrentSlideIdx(0);
            }}
            className="h-8 text-xs py-0 w-48"
          >
            <option value="Todos">Todos os Projetos</option>
            {projetosList.map((p) => (
              <option key={`res-proj-${p.id}`} value={p.id}>
                {p.nome}
              </option>
            ))}
          </SelectNative>

          <SelectNative
            value={selectedPrioridade}
            onChange={(e) => {
              setSelectedPrioridade(e.target.value);
              setCurrentSlideIdx(0);
            }}
            className="h-8 text-xs py-0 w-36"
          >
            <option value="Todas">Todas Prioridades</option>
            <option value="Alta">Alta Severidade</option>
            <option value="Média">Média Severidade</option>
            <option value="Baixa">Baixa Severidade</option>
          </SelectNative>
        </div>

        {/* Toggle Tema, Contador de Slides e Fullscreen */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="h-4 w-px bg-slate-200 dark:bg-[#0B384D]" />
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#0B384D] text-[#008EA9] dark:text-[#00C4EB] border border-slate-300 dark:border-[#00A3C4]/30">
            Slide {currentSlideIdx + 1} de {totalSlides}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            title="Modo Tela Cheia"
            className="h-8 w-8 text-slate-500 dark:text-slate-300 hover:text-[#072B3B] dark:hover:text-white"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      {/* ÁREA CENTRAL FIXA DO SLIDE */}
      <section className="flex-1 flex flex-col justify-center p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-[#00A3C4]" />
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Carregando apresentação WCC 2026...</p>
          </div>
        ) : currentSlideIdx === 0 ? (
          /* SLIDE 1: CAPA OFICIAL WCC 2026 COM BASE NO MODELO DE PPT */
          <div className="space-y-6 sm:space-y-7 animate-in fade-in-0 duration-300 my-auto">
            {/* Header da Capa com Pílula 2026 e Logotipo WCC */}
            <div className="space-y-3 max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00A3C4] text-white text-xs font-extrabold uppercase tracking-widest shadow-md">
                <span>2026</span>
              </div>

              <div className="flex flex-col items-center justify-center pt-1">
                <div className="text-3xl sm:text-4xl font-black tracking-widest text-[#072B3B] dark:text-white">
                  WCC
                </div>
                <div className="text-xs sm:text-sm font-bold tracking-[0.25em] text-slate-500 dark:text-slate-300 uppercase mt-0.5">
                  PARTICIPAÇÕES
                </div>
                <div className="text-[10px] font-bold tracking-[0.3em] text-[#00A3C4] dark:text-[#00C4EB] uppercase">
                  AURA | ELBRUS
                </div>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#072B3B] dark:text-white uppercase leading-tight pt-2">
                MODELO DE APRESENTAÇÃO
                <span className="block text-[#00A3C4] dark:text-[#00C4EB]">2026</span>
              </h1>

              {/* Linha Assinatura Gradiente WCC */}
              <div className="w-32 h-1 mx-auto rounded-full bg-gradient-to-r from-[#00A3C4] to-[#10B981]" />

              <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider max-w-xl mx-auto pt-1">
                HÁ 14 ANOS TRANSFORMANDO SONHOS EM PROJETOS REAIS.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Relatório Executivo de Compatibilização & Apontamentos de Engenharia
              </p>
            </div>

            {/* Grid de KPIs Executivos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-[#0B384D] border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 space-y-1 shadow-2xs">
                <span className="text-xs text-slate-500 dark:text-slate-300 font-bold uppercase tracking-wider">Total Apontamentos</span>
                <p className="text-3xl sm:text-4xl font-black text-[#072B3B] dark:text-white">{totalApontamentos}</p>
                <span className="text-[11px] text-slate-400 dark:text-slate-400 block">Cadastrados no sistema</span>
              </div>

              <div className="bg-white dark:bg-[#0B384D] border border-emerald-200 dark:border-[#10B981]/40 rounded-2xl p-4 sm:p-5 space-y-1 shadow-2xs">
                <span className="text-xs text-[#047857] dark:text-[#34D399] font-bold uppercase tracking-wider">Resolvidos / Solucionados</span>
                <p className="text-3xl sm:text-4xl font-black text-[#10B981]">{totalResolvidos}</p>
                <span className="text-[11px] text-[#047857] dark:text-[#34D399] block font-semibold">{taxaResolucao}% de taxa de solução</span>
              </div>

              <div className="bg-white dark:bg-[#0B384D] border border-amber-200 dark:border-amber-500/40 rounded-2xl p-4 sm:p-5 space-y-1 shadow-2xs">
                <span className="text-xs text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wider">Pendentes em Aberto</span>
                <p className="text-3xl sm:text-4xl font-black text-amber-600 dark:text-amber-400">{totalAbertos}</p>
                <span className="text-[11px] text-amber-700 dark:text-amber-300/80 block">Em análise técnica</span>
              </div>

              <div className="bg-white dark:bg-[#0B384D] border border-rose-200 dark:border-rose-500/40 rounded-2xl p-4 sm:p-5 space-y-1 shadow-2xs">
                <span className="text-xs text-rose-800 dark:text-rose-300 font-bold uppercase tracking-wider">Alta Severidade</span>
                <p className="text-3xl sm:text-4xl font-black text-rose-600 dark:text-rose-400">{totalAltaPrioridade}</p>
                <span className="text-[11px] text-rose-700 dark:text-rose-300/80 block">Críticos / Bloqueio</span>
              </div>
            </div>

            {/* CTA para Iniciar Resumo */}
            <div className="flex flex-col items-center justify-center pt-2 gap-3">
              <Button
                variant="wcc-gradient"
                size="lg"
                onClick={() => setCurrentSlideIdx(1)}
                disabled={filteredApontamentos.length === 0}
                className="h-12 px-8 rounded-xl font-extrabold text-sm shadow-xl shadow-[#00A3C4]/20 gap-2 hover:scale-105 transition-transform cursor-pointer"
              >
                Iniciar Apresentação do Resumo <ChevronRight className="h-5 w-5" />
              </Button>
              <span className="text-xs text-slate-500 dark:text-slate-300">
                Pressione a seta <kbd className="bg-slate-200 dark:bg-[#0B384D] px-1.5 py-0.5 rounded font-mono font-semibold text-[#072B3B] dark:text-white">→</kbd> ou barra de espaço para avançar os slides.
              </span>
            </div>
          </div>
        ) : (
          /* SLIDES 2 A N: APONTAMENTOS INDIVIDUAIS COM ESTRUTURA OFICIAL DO PPT */
          (() => {
            const currentApontamento = filteredApontamentos[currentSlideIdx - 1];
            if (!currentApontamento) return null;

            const listImagensApt = currentApontamento.imagens_apontamento && currentApontamento.imagens_apontamento.length > 0
              ? currentApontamento.imagens_apontamento
              : currentApontamento.url_imagem
              ? [currentApontamento.url_imagem]
              : [];

            const listImagensSol = currentApontamento.imagens_solucao && currentApontamento.imagens_solucao.length > 0
              ? currentApontamento.imagens_solucao
              : currentApontamento.url_imagem_solucao
              ? [currentApontamento.url_imagem_solucao]
              : [];

            const activeList = activeImageTab === 'solucao' ? listImagensSol : listImagensApt;
            const currentDisplayImage = activeList[activeImageIdx] || listImagensApt[0];

            return (
              <div key={currentApontamento.id} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch my-auto animate-in fade-in-0 duration-300 min-h-[460px]">
                {/* COLUNA ESQUERDA: VISUALIZADOR DE IMAGENS EM ALTURA E POSIÇÃO FIXAS */}
                <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
                  <div className="relative rounded-2xl border border-slate-200 dark:border-[#0B384D] overflow-hidden bg-[#041A24] shadow-xl h-[380px] sm:h-[400px] flex items-center justify-center group shrink-0">
                    {currentDisplayImage ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={currentDisplayImage}
                        alt={currentApontamento.titulo}
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <Images className="h-12 w-12 text-[#00A3C4]" />
                        <span className="text-xs uppercase font-semibold">Sem Imagem Anexada</span>
                      </div>
                    )}

                    <div className="absolute top-3 left-3 bg-[#072B3B]/90 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-mono font-bold text-[#00C4EB] border border-[#00A3C4]/40 shadow-md">
                      {activeImageTab === 'solucao' ? 'FOTO DA SOLUÇÃO' : 'FOTO DO APONTAMENTO'}
                    </div>
                  </div>

                  {/* Seletor de Galeria entre Problema e Solução */}
                  <div className="flex items-center justify-between bg-white dark:bg-[#0B384D] p-2 rounded-xl border border-slate-200 dark:border-[#0B384D] shadow-2xs shrink-0">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveImageTab('apontamento');
                          setActiveImageIdx(0);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                          activeImageTab === 'apontamento'
                            ? 'bg-[#00A3C4] text-white shadow-2xs font-bold'
                            : 'text-slate-600 dark:text-slate-300 hover:text-[#072B3B] dark:hover:text-white'
                        }`}
                      >
                        <Images className="h-3.5 w-3.5" /> Fotos Conflito ({listImagensApt.length})
                      </button>

                      {listImagensSol.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveImageTab('solucao');
                            setActiveImageIdx(0);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                            activeImageTab === 'solucao'
                              ? 'bg-[#10B981] text-white shadow-2xs font-bold'
                              : 'text-slate-600 dark:text-slate-300 hover:text-[#072B3B] dark:hover:text-white'
                          }`}
                        >
                          <Lightbulb className="h-3.5 w-3.5" /> Fotos Solução ({listImagensSol.length})
                        </button>
                      )}
                    </div>

                    {/* Miniaturas da lista ativa */}
                    {activeList.length > 1 && (
                      <div className="flex items-center gap-1.5">
                        {activeList.map((imgUrl, idx) => (
                          <button
                            key={`slide-thumb-${idx}`}
                            type="button"
                            onClick={() => setActiveImageIdx(idx)}
                            className={`w-9 h-9 rounded-md overflow-hidden border-2 transition-all cursor-pointer ${
                              activeImageIdx === idx
                                ? 'border-[#00A3C4] scale-105'
                                : 'border-slate-200 dark:border-slate-700 opacity-50 hover:opacity-100'
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imgUrl} alt="Thumb" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* COLUNA DIREITA: RESUMO EXECUTIVO DO APONTAMENTO */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
                  <div className="space-y-3">
                    {/* Header do Slide com Pílula WCC */}
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#072B3B] dark:bg-white text-white dark:text-[#072B3B] text-[10px] font-bold uppercase tracking-wider">
                        Apresentação WCC
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#00A3C4]/15 text-[#00A3C4] dark:text-[#00C4EB] border border-[#00A3C4]/30 font-mono">
                        2026
                      </span>
                    </div>

                    {/* Badges de Status e Prioridade */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={currentApontamento.status === 'Resolvido' ? 'resolvido' : 'aberto'}>
                        {currentApontamento.status}
                      </Badge>
                      <Badge
                        variant={
                          currentApontamento.prioridade === 'Alta'
                            ? 'alta'
                            : currentApontamento.prioridade === 'Média'
                            ? 'media'
                            : 'baixa'
                        }
                      >
                        Prioridade {currentApontamento.prioridade}
                      </Badge>
                      <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 flex items-center gap-1">
                        <ShieldAlert className="h-3 w-3" />
                        {currentApontamento.tipo_conflito || 'Conflito Físico'}
                      </Badge>
                    </div>

                    {/* Título Executivo com Linha Gradiente Oficial */}
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-[#072B3B] dark:text-white leading-snug">
                        {currentApontamento.titulo}
                      </h2>
                      <div className="wcc-gradient-bar mt-2 w-24" />
                    </div>

                    {/* Projeto e Disciplinas */}
                    <div className="flex flex-col gap-1.5 bg-white dark:bg-[#0B384D] p-3 rounded-xl border border-slate-200 dark:border-white/10 text-xs shadow-2xs">
                      {currentApontamento.projetos?.nome && (
                        <div className="flex items-center gap-1.5 font-bold text-[#008EA9] dark:text-[#00C4EB]">
                          <FolderKanban className="h-4 w-4" />
                          <span>{currentApontamento.projetos.nome}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium pt-1 border-t border-slate-100 dark:border-white/10">
                        <span className="text-[#008EA9] dark:text-[#00C4EB] font-extrabold">{currentApontamento.disciplina_origem}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="text-rose-600 dark:text-rose-400 font-extrabold">{currentApontamento.disciplina_destino}</span>
                      </div>
                    </div>

                    {/* Descrição do Problema */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider block">Descrição do Conflito</span>
                      <p className="text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap bg-white/90 dark:bg-[#0B384D]/60 p-3 rounded-xl border border-slate-200 dark:border-white/10 max-h-32 overflow-y-auto">
                        {currentApontamento.descricao}
                      </p>
                    </div>

                    {/* Guia / Diretriz de Solução Técnica */}
                    <div className="space-y-1 bg-emerald-50/90 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-[#10B981]/50">
                      <span className="text-[10px] font-bold text-[#047857] dark:text-[#34D399] uppercase tracking-wider flex items-center gap-1.5">
                        <Lightbulb className="h-3.5 w-3.5 text-[#10B981]" /> Diretriz Técnica / Solução Recomendada
                      </span>
                      <p className="text-emerald-950 dark:text-emerald-100 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-normal max-h-32 overflow-y-auto">
                        {currentApontamento.solucao || 'Em fase de definição técnica pelos projetistas.'}
                      </p>
                    </div>
                  </div>

                  {/* Botão de Ação Rápida no Slide */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-[#0B384D] shrink-0">
                    <Button
                      variant={currentApontamento.status === 'Aberto' ? 'emerald' : 'outline'}
                      size="sm"
                      onClick={() => handleToggleStatus(currentApontamento)}
                      className="text-xs gap-1.5 font-bold h-8"
                    >
                      {currentApontamento.status === 'Aberto' ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" /> Marcar como Resolvido
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-amber-500" /> Reabrir Apontamento
                        </>
                      )}
                    </Button>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 dark:text-slate-400 font-mono">
                        {formatDate(currentApontamento.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        )}
      </section>

      {/* BARRA INFERIOR DE NAVEGAÇÃO DOS SLIDES COM IDENTIDADE WCC 2026 */}
      <footer className="no-print bg-white/95 dark:bg-[#041A24]/95 border-t border-slate-200 dark:border-[#0B384D] px-6 py-2.5 flex items-center justify-between backdrop-blur-md shrink-0 z-50">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentSlideIdx((prev) => (prev > 0 ? prev - 1 : 0))}
            disabled={currentSlideIdx === 0}
            className="text-xs h-8 gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Anterior
          </Button>

          <span className="hidden sm:inline text-[11px] font-mono text-slate-400 dark:text-slate-400 pl-2">
            www.wccparticipacoes.com.br
          </span>
        </div>

        {/* Indicadores de bolinhas do slide */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-xs sm:max-w-md px-2">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <button
              key={`dot-${idx}`}
              type="button"
              onClick={() => setCurrentSlideIdx(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                currentSlideIdx === idx
                  ? 'w-6 bg-[#00A3C4]'
                  : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600'
              }`}
              title={idx === 0 ? 'Capa do Resumo' : `Slide ${idx + 1}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden lg:inline text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            WCC PARTICIPAÇÕES
          </span>
          <Button
            variant="wcc"
            size="sm"
            onClick={() => setCurrentSlideIdx((prev) => (prev < totalSlides - 1 ? prev + 1 : prev))}
            disabled={currentSlideIdx === totalSlides - 1}
            className="text-xs h-8 gap-1 font-bold shadow-xs"
          >
            Próximo <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </footer>
    </main>
  );
}
