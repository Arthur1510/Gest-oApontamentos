"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Loader2,
  Layers,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ListOrdered,
} from 'lucide-react';
import { Apontamento, Projeto } from '@/types/apontamento';
import { supabase, isSupabaseConfigured, MOCK_APONTAMENTOS, MOCK_PROJETOS } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MultiSelectFilter } from '@/components/ui/multi-select-filter';
import { SelectNative } from '@/components/ui/select-native';
import { ReorderApontamentosModal } from '@/components/apontamentos/ReorderApontamentosModal';
import { SortCriteria, SORT_OPTIONS, sortApontamentos } from '@/lib/sorting';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function ResumoExecutivoPage() {
  const [apontamentos, setApontamentos] = useState<Apontamento[]>([]);
  const [projetosList, setProjetosList] = useState<Projeto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros de Resumo com multi-seleção
  const [selectedProjetos, setSelectedProjetos] = useState<string[]>([]);
  const [selectedPrioridades, setSelectedPrioridades] = useState<string[]>([]);

  // Organização & Sequência dos Apontamentos / Conflitos
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>('data_desc');
  const [manualOrderedIds, setManualOrderedIds] = useState<string[]>([]);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);

  // Controle de Slides (0 = Capa Resumo Executivo, 1..N = Apontamentos)
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);

  // Seleção de Foto ativa no slide atual (0, 1, 2...)
  const [activeImageTab, setActiveImageTab] = useState<'apontamento' | 'solucao'>('apontamento');
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Carregar dados
  const loadData = useCallback(async () => {
    setIsLoading(true);

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: projData } = await supabase
          .from('projetos')
          .select('*')
          .order('nome', { ascending: true });

        setProjetosList(projData ? (projData as Projeto[]) : MOCK_PROJETOS);

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
    const init = async () => {
      await loadData();
    };
    init();
  }, [loadData]);

  // Lista Ordenada e Filtrada com suporte a critérios automáticos e ajustes manuais
  const orderedApontamentos = useMemo(() => {
    const filtered = apontamentos.filter((item) => {
      const matchesProjeto =
        selectedProjetos.length === 0 ||
        (Boolean(item.projeto_id) && selectedProjetos.includes(item.projeto_id!));
      const matchesPrioridade =
        selectedPrioridades.length === 0 || selectedPrioridades.includes(item.prioridade);
      return matchesProjeto && matchesPrioridade;
    });

    if (sortCriteria === 'manual' && manualOrderedIds.length > 0) {
      const map = new Map(filtered.map((item) => [item.id, item]));
      const result: Apontamento[] = [];
      for (const id of manualOrderedIds) {
        const item = map.get(id);
        if (item) {
          result.push(item);
          map.delete(id);
        }
      }
      for (const item of map.values()) {
        result.push(item);
      }
      return result;
    }

    return sortApontamentos(filtered, sortCriteria);
  }, [apontamentos, selectedProjetos, selectedPrioridades, sortCriteria, manualOrderedIds]);

  const totalSlides = orderedApontamentos.length + 1; // 1 Capa + N Apontamentos

  // Transição de Slide com reset de aba de imagem
  const goToSlide = useCallback((newIdx: number | ((prev: number) => number)) => {
    setCurrentSlideIdx((prev) => {
      const resolved = typeof newIdx === 'function' ? newIdx(prev) : newIdx;
      const clamped = Math.max(0, Math.min(resolved, totalSlides - 1));
      if (clamped !== prev) {
        setActiveImageTab('apontamento');
        setActiveImageIdx(0);
      }
      return clamped;
    });
  }, [totalSlides]);

  // Reordenação manual a partir do modal
  const handleApplyOrderFromModal = (newOrderedList: Apontamento[], criteria: SortCriteria) => {
    setManualOrderedIds(newOrderedList.map((item) => item.id));
    setSortCriteria(criteria);
  };

  // Reordenação direta do slide ativo
  const handleMoveCurrentSlide = (direction: 'up' | 'down') => {
    if (currentSlideIdx === 0) return;
    const currentAptIndex = currentSlideIdx - 1;
    const targetAptIndex = direction === 'up' ? currentAptIndex - 1 : currentAptIndex + 1;
    if (targetAptIndex < 0 || targetAptIndex >= orderedApontamentos.length) return;

    const list = [...orderedApontamentos];
    const [moved] = list.splice(currentAptIndex, 1);
    list.splice(targetAptIndex, 0, moved);

    setManualOrderedIds(list.map((item) => item.id));
    setSortCriteria('manual');
    goToSlide(targetAptIndex + 1);
  };

  // Navegação por teclado (Setas Esquerda/Direita, Espaço)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goToSlide((prev) => (prev < totalSlides - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToSlide((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Home') {
        e.preventDefault();
        goToSlide(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalSlides, goToSlide]);

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
  const totalApontamentos = orderedApontamentos.length;
  const totalResolvidos = orderedApontamentos.filter((a) => a.status === 'Resolvido').length;
  const totalAbertos = totalApontamentos - totalResolvidos;
  const taxaResolucao = totalApontamentos > 0 ? Math.round((totalResolvidos / totalApontamentos) * 100) : 0;
  const totalAltaPrioridade = orderedApontamentos.filter((a) => a.prioridade === 'Alta').length;

  // Título dinâmico do projeto selecionado
  const projetoTituloExibicao =
    selectedProjetos.length === 1
      ? projetosList.find((p) => p.id === selectedProjetos[0])?.nome || 'Empreendimento'
      : selectedProjetos.length > 1
      ? projetosList
          .filter((p) => selectedProjetos.includes(p.id))
          .map((p) => p.nome)
          .join(' • ')
      : 'Todos os Projetos';

  return (
    <main className="h-screen w-screen bg-slate-50 dark:bg-[#072B3B] text-[#072B3B] dark:text-slate-100 flex flex-col justify-between select-none overflow-hidden font-sans transition-colors duration-300">
      {/* BARRA SUPERIOR DE CONTROLE DO RESUMO EXECUTIVO */}
      <header className="no-print bg-white/95 dark:bg-[#041A24]/90 border-b border-slate-200 dark:border-[#0B384D] px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 backdrop-blur-md shrink-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-xs text-slate-600 dark:text-slate-300 hover:text-[#072B3B] dark:hover:text-white gap-1.5 h-8 cursor-pointer">
              <Home className="h-4 w-4" /> Voltar ao Painel
            </Button>
          </Link>
          <div className="h-4 w-px bg-slate-200 dark:border-[#0B384D]" />
          <div className="flex items-center gap-2">
            <div className="px-2 py-0.5 rounded bg-[#072B3B] dark:bg-white text-white dark:text-[#072B3B] font-black text-xs tracking-wider border border-[#00A3C4]/40">
              WCC
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xs text-[#072B3B] dark:text-white tracking-wide leading-tight truncate max-w-[200px] sm:max-w-[280px]" title={projetoTituloExibicao}>
                {projetoTituloExibicao}
              </span>
              <span className="text-[9px] font-bold text-[#00A3C4] tracking-widest leading-tight">
                RESUMO EXECUTIVO BIM
              </span>
            </div>
          </div>
        </div>

        {/* Filtros e Ordenação no Topo */}
        <div className="hidden md:flex items-center gap-2.5">
          <MultiSelectFilter
            label="Projetos"
            placeholder="Todos"
            options={projetosList.map((p) => ({ value: p.id, label: p.nome }))}
            selectedValues={selectedProjetos}
            onChange={(values) => {
              setSelectedProjetos(values);
              goToSlide(0);
            }}
            variant="wcc"
            searchable
            className="w-36 lg:w-44"
          />

          <MultiSelectFilter
            label="Prioridade"
            placeholder="Todas"
            options={[
              { value: 'Alta', label: 'Alto' },
              { value: 'Média', label: 'Médio' },
              { value: 'Baixa', label: 'Baixo' },
            ]}
            selectedValues={selectedPrioridades}
            onChange={(values) => {
              setSelectedPrioridades(values);
              goToSlide(0);
            }}
            variant="default"
            className="w-32 lg:w-36"
          />

          {/* Ordenação dos Conflitos */}
          <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200 dark:border-[#0B384D]">
            <div className="w-44 lg:w-52">
              <SelectNative
                id="sort-criteria-resumo"
                value={sortCriteria}
                onChange={(e) => {
                  setSortCriteria(e.target.value as SortCriteria);
                }}
                className="h-8 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-[#041A24] border-slate-200 dark:border-[#0B384D]"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </SelectNative>
            </div>

            <Button
              type="button"
              variant="wcc"
              size="sm"
              onClick={() => setIsReorderModalOpen(true)}
              title="Personalizar Ordem dos Conflitos"
              className="text-xs h-8 px-2.5 gap-1 font-bold cursor-pointer shrink-0 shadow-xs"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">Organizar</span>
            </Button>
          </div>
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
            className="h-8 w-8 text-slate-500 dark:text-slate-300 hover:text-[#072B3B] dark:hover:text-white cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      {/* ÁREA CENTRAL FIXA DO SLIDE */}
      <section className="flex-1 flex flex-col justify-center p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-[#00A3C4]" />
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Carregando resumo executivo...</p>
          </div>
        ) : currentSlideIdx === 0 ? (
          /* SLIDE 1: CAPA OFICIAL COM FOCO TOTAL NO PROJETO */
          <div className="space-y-4 sm:space-y-6 animate-in fade-in-0 duration-300 my-auto max-w-3xl mx-auto w-full">
            {/* Header da Capa com Logotipo WCC e Nome Dinâmico do Projeto */}
            <div className="space-y-2 text-center">
              <div className="flex flex-col items-center justify-center">
                <div className="text-3xl sm:text-4xl font-black tracking-widest text-[#072B3B] dark:text-white">
                  WCC
                </div>
                <div className="text-xs sm:text-sm font-bold tracking-[0.25em] text-slate-500 dark:text-slate-300 uppercase mt-0.5">
                  PARTICIPAÇÕES
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#072B3B] dark:text-white uppercase leading-tight pt-1">
                {projetoTituloExibicao}
              </h1>

              {/* Linha Assinatura Gradiente WCC */}
              <div className="w-28 h-1 mx-auto rounded-full bg-gradient-to-r from-[#00A3C4] to-[#10B981]" />
            </div>

            {/* Grid de KPIs Executivos em Duas Linhas (2x2) */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-2xl mx-auto w-full">
              {/* Linha 1 - Card 1: Total */}
              <div className="bg-white dark:bg-[#0B384D] border border-slate-200 dark:border-white/10 rounded-2xl p-3.5 sm:p-4 space-y-0.5 shadow-2xs">
                <span className="text-xs text-slate-500 dark:text-slate-300 font-bold uppercase tracking-wider">Total Apontamentos</span>
                <p className="text-2xl sm:text-3xl font-black text-[#072B3B] dark:text-white">{totalApontamentos}</p>
                <span className="text-[11px] text-slate-400 dark:text-slate-400 block">Cadastrados no sistema</span>
              </div>

              {/* Linha 1 - Card 2: Resolvidos */}
              <div className="bg-white dark:bg-[#0B384D] border border-emerald-200 dark:border-[#10B981]/40 rounded-2xl p-3.5 sm:p-4 space-y-0.5 shadow-2xs">
                <span className="text-xs text-[#047857] dark:text-[#34D399] font-bold uppercase tracking-wider">Resolvidos / Solucionados</span>
                <p className="text-2xl sm:text-3xl font-black text-[#10B981]">{totalResolvidos}</p>
                <span className="text-[11px] text-[#047857] dark:text-[#34D399] block font-semibold">{taxaResolucao}% de taxa de solução</span>
              </div>

              {/* Linha 2 - Card 3: Pendentes em Aberto */}
              <div className="bg-white dark:bg-[#0B384D] border border-amber-200 dark:border-amber-500/40 rounded-2xl p-3.5 sm:p-4 space-y-0.5 shadow-2xs">
                <span className="text-xs text-amber-800 dark:text-amber-300 font-bold uppercase tracking-wider">Pendentes em Aberto</span>
                <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">{totalAbertos}</p>
                <span className="text-[11px] text-amber-700 dark:text-amber-300/80 block">Em análise técnica</span>
              </div>

              {/* Linha 2 - Card 4: Alto */}
              <div className="bg-white dark:bg-[#0B384D] border border-rose-200 dark:border-rose-500/40 rounded-2xl p-3.5 sm:p-4 space-y-0.5 shadow-2xs">
                <span className="text-xs text-rose-800 dark:text-rose-300 font-bold uppercase tracking-wider">Alto</span>
                <p className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">{totalAltaPrioridade}</p>
                <span className="text-[11px] text-rose-700 dark:text-rose-300/80 block">Críticos / Bloqueio</span>
              </div>
            </div>

            {/* Box de Configuração da Sequência / Ordem dos Conflitos na Capa */}
            <div className="bg-white dark:bg-[#0B384D] border border-slate-200 dark:border-white/10 rounded-2xl p-3.5 sm:p-4 shadow-2xs space-y-2.5 max-w-2xl mx-auto w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#00A3C4]/15 text-[#008EA9] dark:text-[#00C4EB] shrink-0 border border-[#00A3C4]/20">
                    <ListOrdered className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-[#072B3B] dark:text-white uppercase tracking-wider flex items-center gap-2">
                      Ordem dos Conflitos ({orderedApontamentos.length} Slides)
                      {sortCriteria === 'manual' && (
                        <span className="text-[10px] bg-cyan-100 dark:bg-[#00A3C4]/30 text-[#008EA9] dark:text-[#00C4EB] px-2 py-0.2 rounded-full font-bold">
                          Manual
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-300">
                      Critério de sequência para a apresentação
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-48 sm:w-56">
                    <SelectNative
                      value={sortCriteria}
                      onChange={(e) => setSortCriteria(e.target.value as SortCriteria)}
                      className="h-8 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-[#041A24] border-slate-200 dark:border-[#0B384D]"
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </SelectNative>
                  </div>

                  <Button
                    type="button"
                    variant="wcc"
                    size="sm"
                    onClick={() => setIsReorderModalOpen(true)}
                    className="text-xs h-8 gap-1 font-bold cursor-pointer shadow-xs shrink-0"
                  >
                    <ArrowUpDown className="h-3.5 w-3.5" /> Organizar
                  </Button>
                </div>
              </div>
            </div>

            {/* CTA para Iniciar Resumo */}
            <div className="flex flex-col items-center justify-center pt-1 gap-2">
              <Button
                variant="wcc-gradient"
                size="lg"
                onClick={() => goToSlide(1)}
                disabled={orderedApontamentos.length === 0}
                className="h-11 px-8 rounded-xl font-extrabold text-sm shadow-xl shadow-[#00A3C4]/20 gap-2 hover:scale-105 transition-transform cursor-pointer"
              >
                Iniciar Apresentação do Resumo <ChevronRight className="h-5 w-5" />
              </Button>
              <span className="text-xs text-slate-500 dark:text-slate-300">
                Pressione a seta <kbd className="bg-slate-200 dark:bg-[#0B384D] px-1.5 py-0.5 rounded font-mono font-semibold text-[#072B3B] dark:text-white">→</kbd> ou barra de espaço para avançar os slides.
              </span>
            </div>
          </div>
        ) : (
          /* SLIDES 2 A N: APONTAMENTOS INDIVIDUAIS COM ESTRUTURA EXECUTIVA ROBUSTA */
          (() => {
            const currentApontamento = orderedApontamentos[currentSlideIdx - 1];
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
              <div key={currentApontamento.id} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start my-auto animate-in fade-in-0 duration-300 w-full h-full max-h-[calc(100vh-140px)]">
                {/* COLUNA ESQUERDA: VISUALIZADOR DE IMAGENS */}
                <div className="lg:col-span-7 flex flex-col justify-between space-y-3 h-full max-h-[calc(100vh-160px)]">
                  {/* Moldura da Foto */}
                  <div className="relative rounded-2xl border border-slate-200 dark:border-[#0B384D] overflow-hidden bg-[#041A24] shadow-xl flex-1 min-h-[300px] max-h-[480px] flex items-center justify-center group">
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
                  </div>

                  {/* Seletor de Galeria entre Problema e Solução + Miniaturas */}
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
                      <div className="flex items-center gap-1.5 overflow-x-auto max-w-[200px] py-0.5">
                        {activeList.map((imgUrl, idx) => (
                          <button
                            key={`slide-thumb-${idx}`}
                            type="button"
                            onClick={() => setActiveImageIdx(idx)}
                            className={`w-9 h-9 rounded-md overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
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

                {/* COLUNA DIREITA: RESUMO EXECUTIVO COM SCROLL CONTROLADO */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-3 h-full max-h-[calc(100vh-160px)] overflow-y-auto pr-1">
                  <div className="space-y-3">
                    {/* Badges de Status, Prioridade e Tipo */}
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
                        {currentApontamento.prioridade === 'Alta' ? 'Alto' : currentApontamento.prioridade === 'Média' ? 'Médio' : 'Baixo'}
                      </Badge>
                      <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 flex items-center gap-1">
                        <ShieldAlert className="h-3 w-3" />
                        {currentApontamento.tipo_conflito || 'Conflito Físico'}
                      </Badge>
                    </div>

                    {/* Título Executivo */}
                    <div>
                      <h2 className="text-lg sm:text-xl font-black text-[#072B3B] dark:text-white leading-snug">
                        {currentApontamento.titulo}
                      </h2>
                      <div className="wcc-gradient-bar mt-1.5 w-20" />
                    </div>

                    {/* Projeto, Disciplinas e Localização */}
                    <div className="flex flex-col gap-1.5 bg-white dark:bg-[#0B384D] p-3 rounded-xl border border-slate-200 dark:border-white/10 text-xs shadow-2xs">
                      {currentApontamento.projetos?.nome && (
                        <div className="flex items-center gap-1.5 font-bold text-[#008EA9] dark:text-[#00C4EB]">
                          <FolderKanban className="h-4 w-4" />
                          <span className="truncate">{currentApontamento.projetos.nome}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium pt-1 border-t border-slate-100 dark:border-white/10">
                        <span className="text-[#008EA9] dark:text-[#00C4EB] font-extrabold">{currentApontamento.disciplina_origem}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="text-rose-600 dark:text-rose-400 font-extrabold">{currentApontamento.disciplina_destino}</span>
                      </div>
                      {(currentApontamento.pavimento || currentApontamento.localizacao) && (
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-100 dark:border-white/10 truncate">
                          <Layers className="h-3.5 w-3.5 text-[#00A3C4] shrink-0" />
                          <span className="truncate">
                            {[currentApontamento.pavimento, currentApontamento.localizacao].filter(Boolean).join(' • ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Descrição do Problema (Adapta-se ao tamanho sem quebrar o layout) */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider block">
                        Descrição Técnica do Conflito
                      </span>
                      <div className="bg-white/95 dark:bg-[#0B384D]/70 p-3.5 rounded-xl border border-slate-200 dark:border-white/10 max-h-48 overflow-y-auto shadow-2xs">
                        <p className="text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                          {currentApontamento.descricao}
                        </p>
                      </div>
                    </div>

                    {/* Guia / Diretriz de Solução Técnica */}
                    <div className="space-y-1 bg-emerald-50/90 dark:bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-200 dark:border-[#10B981]/50 shadow-2xs">
                      <span className="text-[10px] font-bold text-[#047857] dark:text-[#34D399] uppercase tracking-wider flex items-center gap-1.5">
                        <Lightbulb className="h-3.5 w-3.5 text-[#10B981]" /> Diretriz Técnica / Solução Recomendada
                      </span>
                      <div className="max-h-36 overflow-y-auto">
                        <p className="text-emerald-950 dark:text-emerald-100 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-normal">
                          {currentApontamento.solucao || 'Em fase de definição técnica pelos projetistas.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Botões de Ação e Reordenação Rápida no Slide */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 dark:border-[#0B384D] shrink-0 mt-2">
                    <Button
                      variant={currentApontamento.status === 'Aberto' ? 'emerald' : 'outline'}
                      size="sm"
                      onClick={() => handleToggleStatus(currentApontamento)}
                      className="text-xs gap-1.5 font-bold h-8 cursor-pointer"
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

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                        #{currentSlideIdx} de {orderedApontamentos.length}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveCurrentSlide('up')}
                        disabled={currentSlideIdx <= 1}
                        title="Mover este conflito para antes (Slide anterior)"
                        className="h-8 w-8 p-0 text-slate-500 hover:text-[#00A3C4] disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveCurrentSlide('down')}
                        disabled={currentSlideIdx >= orderedApontamentos.length}
                        title="Mover este conflito para depois (Próximo slide)"
                        className="h-8 w-8 p-0 text-slate-500 hover:text-[#00A3C4] disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsReorderModalOpen(true)}
                        title="Organizar sequência dos conflitos"
                        className="text-xs h-8 px-2 gap-1 text-slate-600 dark:text-slate-300 hover:border-[#00A3C4] hover:text-[#00A3C4] cursor-pointer"
                      >
                        <ArrowUpDown className="h-3 w-3" />
                        <span className="hidden sm:inline">Ordem</span>
                      </Button>
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
            onClick={() => goToSlide((prev) => (prev > 0 ? prev - 1 : 0))}
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
              onClick={() => goToSlide(idx)}
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
            onClick={() => goToSlide((prev) => (prev < totalSlides - 1 ? prev + 1 : prev))}
            disabled={currentSlideIdx === totalSlides - 1}
            className="text-xs h-8 gap-1 font-bold shadow-xs"
          >
            Próximo <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </footer>

      {/* Modal de Reordenação e Sequenciamento dos Conflitos */}
      <ReorderApontamentosModal
        isOpen={isReorderModalOpen}
        onClose={() => setIsReorderModalOpen(false)}
        apontamentos={orderedApontamentos}
        onApplyOrder={handleApplyOrderFromModal}
        currentCriteria={sortCriteria}
        title="Organizar Sequência da Apresentação"
        description="Ajuste a ordem dos conflitos para a apresentação e reunião técnica. Use os botões rápidos ou reordene individualmente."
        confirmLabel="Aplicar à Apresentação"
      />
    </main>
  );
}
