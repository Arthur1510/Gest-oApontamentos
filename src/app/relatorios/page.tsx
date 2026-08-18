"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  FileText,
  Printer,
  Loader2,
  Filter,
  RefreshCw,
  FolderKanban,
  ArrowRight,
  Sparkles,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  ShieldAlert,
  Lightbulb,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  ListOrdered,
} from 'lucide-react';
import { Apontamento, Projeto, DISCIPLINAS_OPCOES, TIPOS_CONFLITO_OPCOES } from '@/types/apontamento';
import { supabase, isSupabaseConfigured, MOCK_APONTAMENTOS, MOCK_PROJETOS } from '@/lib/supabase/client';
import { SupabaseStatusBanner } from '@/components/apontamentos/SupabaseStatusBanner';
import { Button } from '@/components/ui/button';
import { MultiSelectFilter } from '@/components/ui/multi-select-filter';
import { SelectNative } from '@/components/ui/select-native';
import { ReorderApontamentosModal } from '@/components/apontamentos/ReorderApontamentosModal';
import { SortCriteria, SORT_OPTIONS, sortApontamentos } from '@/lib/sorting';
import { formatDate } from '@/lib/utils';

export default function RelatoriosPage() {
  const [apontamentos, setApontamentos] = useState<Apontamento[]>([]);
  const [projetosList, setProjetosList] = useState<Projeto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros de Relatório com multi-seleção
  const [selectedProjetos, setSelectedProjetos] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedDisciplinas, setSelectedDisciplinas] = useState<string[]>([]);
  const [selectedTiposConflito, setSelectedTiposConflito] = useState<string[]>([]);

  // Organização & Sequência dos Apontamentos
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>('data_desc');
  const [manualOrderedIds, setManualOrderedIds] = useState<string[]>([]);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);

  // Referência para impressão react-to-print
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Relatorio_Apontamentos_BIM_${new Date().toISOString().slice(0, 10)}`,
  });

  // Carregar Apontamentos e Projetos
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

        if (error) {
          console.error('Erro ao buscar apontamentos:', error);
          setApontamentos(MOCK_APONTAMENTOS);
        } else if (data) {
          setApontamentos(data as Apontamento[]);
        }
      } catch (err) {
        console.error('Falha de conexão:', err);
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

  // Lista Ordenada e Filtrada com suporte a critérios automáticos e ajustes manuais
  const orderedApontamentos = useMemo(() => {
    const filtered = apontamentos.filter((item) => {
      const matchesProjeto =
        selectedProjetos.length === 0 ||
        (Boolean(item.projeto_id) && selectedProjetos.includes(item.projeto_id!));

      const matchesStatus =
        selectedStatus.length === 0 || selectedStatus.includes(item.status);

      const matchesDisciplina =
        selectedDisciplinas.length === 0 ||
        selectedDisciplinas.includes(item.disciplina_origem) ||
        selectedDisciplinas.includes(item.disciplina_destino);

      const itemTipo = item.tipo_conflito || 'Conflito Físico';
      const matchesTipoConflito =
        selectedTiposConflito.length === 0 || selectedTiposConflito.includes(itemTipo);

      return matchesProjeto && matchesStatus && matchesDisciplina && matchesTipoConflito;
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
  }, [apontamentos, selectedProjetos, selectedStatus, selectedDisciplinas, selectedTiposConflito, sortCriteria, manualOrderedIds]);

  const resetFilters = () => {
    setSelectedProjetos([]);
    setSelectedStatus([]);
    setSelectedDisciplinas([]);
    setSelectedTiposConflito([]);
  };

  // Reordenação manual direta na folha do relatório
  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= orderedApontamentos.length) return;

    const list = [...orderedApontamentos];
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);

    setManualOrderedIds(list.map((item) => item.id));
    setSortCriteria('manual');
  };

  const handleMoveItemToExtreme = (index: number, position: 'top' | 'bottom') => {
    if (position === 'top' && index === 0) return;
    if (position === 'bottom' && index === orderedApontamentos.length - 1) return;

    const list = [...orderedApontamentos];
    const [moved] = list.splice(index, 1);
    if (position === 'top') {
      list.unshift(moved);
    } else {
      list.push(moved);
    }

    setManualOrderedIds(list.map((item) => item.id));
    setSortCriteria('manual');
  };

  const handleApplyOrderFromModal = (newOrderedList: Apontamento[], criteria: SortCriteria) => {
    setManualOrderedIds(newOrderedList.map((item) => item.id));
    setSortCriteria(criteria);
  };

  // Nome do projeto selecionado para a Capa
  const projetoSelecionadoNome =
    selectedProjetos.length === 0
      ? 'TODOS OS PROJETOS'
      : selectedProjetos.length === 1
      ? projetosList.find((p) => p.id === selectedProjetos[0])?.nome || 'PROJETO SELECIONADO'
      : `${selectedProjetos.length} PROJETOS SELECIONADOS`;

  const dataAtualFormatada = new Date().toLocaleDateString('pt-BR');
  const totalPaginasPDF = orderedApontamentos.length + 1; // 1 Capa + N Páginas

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Banner de status Supabase (no-print) */}
        <div className="no-print">
          <SupabaseStatusBanner />
        </div>

        {/* Cabeçalho do Relatório */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-[#0B384D]">
          <div>
            <div className="flex items-center gap-2 text-[#00A3C4] dark:text-[#00C4EB] font-bold text-xs uppercase tracking-wider">
              <FileText className="h-4 w-4" /> Gestão BIM • Relatórios & Exportação PDF
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#072B3B] dark:text-white mt-1">
              Relatórios de Compatibilização Técnica
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Geração de relatórios executivos no padrão A4 oficial para reuniões de projeto e diretoria.
            </p>
          </div>

          <Button
            onClick={() => handlePrint()}
            disabled={orderedApontamentos.length === 0 || isLoading}
            variant="wcc-gradient"
            size="lg"
            className="shadow-lg shadow-[#00A3C4]/25 hover:scale-[1.02] active:scale-[0.98] transition-all gap-2 self-start sm:self-auto shrink-0 font-bold cursor-pointer"
          >
            <Printer className="h-4 w-4" /> Imprimir / Salvar PDF
          </Button>
        </div>

        {/* Painel de Filtros (no-print) */}
        <div className="no-print bg-white dark:bg-[#072B3B]/90 border border-slate-200/80 dark:border-[#0B384D] rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#072B3B] dark:text-slate-100 uppercase tracking-wider">
              <Filter className="h-3.5 w-3.5 text-[#00A3C4] dark:text-[#00C4EB]" /> 1. Filtrar Conteúdo do Relatório (Multi-Seleção)
            </div>
            {(selectedProjetos.length > 0 || selectedStatus.length > 0 || selectedDisciplinas.length > 0 || selectedTiposConflito.length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-xs font-semibold text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 h-7 gap-1"
              >
                <RefreshCw className="h-3 w-3" /> Limpar Filtros
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Multi-Select de Projeto */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Projetos:</label>
              <MultiSelectFilter
                label="Projeto"
                placeholder="Todos"
                options={projetosList.map((p) => ({ value: p.id, label: p.nome }))}
                selectedValues={selectedProjetos}
                onChange={setSelectedProjetos}
                variant="wcc"
                searchable
              />
            </div>

            {/* Multi-Select de Tipo de Apontamento */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Tipo:</label>
              <MultiSelectFilter
                label="Tipo"
                placeholder="Todos"
                options={TIPOS_CONFLITO_OPCOES.map((tc) => ({ value: tc, label: tc }))}
                selectedValues={selectedTiposConflito}
                onChange={setSelectedTiposConflito}
                variant="amber"
                searchable
              />
            </div>

            {/* Multi-Select de Status */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Status:</label>
              <MultiSelectFilter
                label="Status"
                placeholder="Todos"
                options={[
                  { value: 'Aberto', label: 'Aberto' },
                  { value: 'Resolvido', label: 'Resolvido' },
                ]}
                selectedValues={selectedStatus}
                onChange={setSelectedStatus}
                variant="emerald"
              />
            </div>

            {/* Multi-Select de Disciplina */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Disciplinas:</label>
              <MultiSelectFilter
                label="Disciplina"
                placeholder="Todas"
                options={DISCIPLINAS_OPCOES.map((d) => ({ value: d, label: d }))}
                selectedValues={selectedDisciplinas}
                onChange={setSelectedDisciplinas}
                variant="default"
                searchable
              />
            </div>
          </div>
        </div>

        {/* Painel de Organização & Sequência das Pranchas (no-print) */}
        <div className="no-print bg-white dark:bg-[#072B3B]/90 border border-slate-200/80 dark:border-[#0B384D] rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#00A3C4]/15 text-[#008EA9] dark:text-[#00C4EB] shrink-0 border border-[#00A3C4]/20 shadow-2xs">
              <ListOrdered className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-black text-[#072B3B] dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                2. Organização da Sequência ({orderedApontamentos.length} Pranchas)
                {sortCriteria === 'manual' && (
                  <span className="text-[10px] bg-cyan-100 dark:bg-[#00A3C4]/30 text-[#008EA9] dark:text-[#00C4EB] px-2 py-0.2 rounded-full font-bold">
                    Ordem Manual
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Escolha o critério de ordenação automática das pranchas ou personalize a ordem com setas e arrastar.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-end md:self-auto shrink-0">
            <div className="flex items-center gap-2">
              <label htmlFor="sort-criteria" className="font-bold text-slate-600 dark:text-slate-300 text-[11px] uppercase tracking-wider shrink-0">
                Ordenar por:
              </label>
              <div className="w-56 sm:w-64">
                <SelectNative
                  id="sort-criteria"
                  value={sortCriteria}
                  onChange={(e) => {
                    const val = e.target.value as SortCriteria;
                    setSortCriteria(val);
                  }}
                  className="h-9 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-[#041A24] border-slate-200 dark:border-[#0B384D]"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </SelectNative>
              </div>
            </div>

            <Button
              type="button"
              variant="wcc"
              size="sm"
              onClick={() => setIsReorderModalOpen(true)}
              className="text-xs h-9 gap-1.5 font-bold cursor-pointer shadow-sm shrink-0"
            >
              <ArrowUpDown className="h-3.5 w-3.5" /> Organizar Sequência
            </Button>
          </div>
        </div>

        {/* Estado de Carregamento */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#00A3C4]" />
            <p className="text-xs text-slate-500 font-medium">Montando relatório técnico A4...</p>
          </div>
        ) : orderedApontamentos.length === 0 ? (
          /* Estado Vazio */
          <div className="bg-white dark:bg-[#072B3B]/80 border border-dashed border-slate-300 dark:border-[#0B384D] rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
            <p className="text-sm font-bold text-[#072B3B] dark:text-white">Nenhum apontamento encontrado para este filtro.</p>
            <p className="text-xs text-slate-500">Tente ajustar ou limpar os filtros para gerar o relatório impresso.</p>
            <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs mt-2">
              Limpar Filtros
            </Button>
          </div>
        ) : (
          /* CONTEUDO DO RELATORIO PARA VISUALIZAR E IMPRIMIR */
          <div className="space-y-4">
            <div className="flex items-center justify-between no-print px-1">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Visualização do Documento A4 ({orderedApontamentos.length} apontamentos • {totalPaginasPDF} páginas)
              </span>
              <span className="text-[11px] text-[#00A3C4] font-semibold">
                Relatório Técnico de Compatibilização
              </span>
            </div>

            {/* AREA IMPRIMÍVEL (REACT-TO-PRINT) */}
            <div ref={contentRef} className="print-area space-y-8 print:space-y-0 print:m-0 print:p-0 flex flex-col items-center">
              {/* PAGINA 1: CAPA INSTITUCIONAL WCC (FOLHA A4 PADRÃO) */}
              <div
                style={{ color: '#072b3b', backgroundColor: '#ffffff' }}
                className="wcc-a4-page w-[210mm] min-h-[296mm] max-h-[296.8mm] h-[296.8mm] p-6 sm:p-8 bg-white text-[#072B3B] mx-auto flex flex-col justify-between border border-slate-300 shadow-xl print:shadow-none print:border-none print:m-0 box-border rounded-none dark:bg-white dark:text-[#072B3B] break-after-page font-sans relative overflow-hidden shrink-0"
              >
                {/* Faixa decorativa topo */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00A3C4] to-[#10B981]" />

                {/* Topo da Capa */}
                <div className="flex items-center justify-between border-b border-slate-300 pb-2 text-[11px] text-slate-600 font-sans shrink-0">
                  <span className="font-bold text-[#072B3B] uppercase">RELATÓRIO TÉCNICO DE COMPATIBILIZAÇÃO</span>
                  <span className="font-extrabold text-[#00A3C4] uppercase truncate max-w-[220px]">{projetoSelecionadoNome}</span>
                  <span>{dataAtualFormatada}</span>
                </div>

                {/* Centro da Capa: Logo WCC & Titulos */}
                <div className="my-auto text-center space-y-4 flex flex-col items-center justify-center py-6">
                  <div className="flex flex-col items-center gap-1">
                    <div className="px-4 py-1.5 rounded-xl bg-[#072B3B] text-white flex items-center justify-center shadow-md border border-[#00A3C4]/30">
                      <span className="text-2xl font-black tracking-widest">WCC</span>
                    </div>
                    <div className="text-[11px] font-black tracking-[0.25em] text-[#072B3B] uppercase">
                      PARTICIPAÇÕES
                    </div>
                  </div>

                  <div className="space-y-1.5 py-1">
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#072B3B] uppercase">
                      RELATÓRIO TÉCNICO DE COMPATIBILIZAÇÃO
                    </h2>
                    <div className="w-24 h-1 mx-auto rounded-full bg-gradient-to-r from-[#00A3C4] to-[#10B981]" />
                    <p className="text-base sm:text-lg font-bold text-[#00A3C4] uppercase tracking-wide pt-1">
                      {projetoSelecionadoNome}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      GESTÃO E CONTROLE DE APONTAMENTOS BIM 2026
                    </p>
                  </div>

                  {/* Resumo e Filtros da Capa */}
                  <div className="max-w-md w-full mx-auto bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2 font-sans">
                    <div className="font-bold text-xs text-[#072B3B] border-b border-slate-200 pb-1.5 flex items-center justify-between">
                      <span>Total de Apontamentos Selecionados:</span>
                      <span className="text-[#00A3C4] font-black text-sm">{orderedApontamentos.length}</span>
                    </div>

                    <div className="space-y-1 text-slate-600 text-left text-[11px]">
                      <p className="font-bold text-[#072B3B]">Filtros Aplicados no Documento:</p>
                      <p>• <strong>Projetos:</strong> {selectedProjetos.length > 0 ? projetosList.filter(p => selectedProjetos.includes(p.id)).map(p => p.nome).join(', ') : 'Todos os Projetos'}</p>
                      <p>• <strong>Status:</strong> {selectedStatus.length > 0 ? selectedStatus.join(', ') : 'Todos os Status'}</p>
                      <p>• <strong>Disciplinas:</strong> {selectedDisciplinas.length > 0 ? selectedDisciplinas.join(', ') : 'Todas as Disciplinas'}</p>
                      <p>• <strong>Tipo de Apontamento:</strong> {selectedTiposConflito.length > 0 ? selectedTiposConflito.join(', ') : 'Todos os Tipos'}</p>
                    </div>
                  </div>
                </div>

                {/* Rodapé da Capa */}
                <div className="flex items-center justify-between border-t border-slate-300 pt-2 text-[10px] text-slate-600 font-sans shrink-0">
                  <span className="font-semibold text-slate-600 uppercase">{projetoSelecionadoNome}</span>
                  <span className="font-bold text-[#072B3B]">Pág 1 de {totalPaginasPDF}</span>
                </div>
              </div>

              {/* PAGINAS 2 A N: CADA APONTAMENTO EM UMA FOLHA A4 ADAPTÁVEL */}
              {orderedApontamentos.map((apontamento, index) => {
                const nomeProjetoItem = apontamento.projetos?.nome || projetoSelecionadoNome || 'Projeto Geral';
                const numPaginaAtual = index + 2;
                const isFirst = index === 0;
                const isLast = index === orderedApontamentos.length - 1;

                const listImagensApt = apontamento.imagens_apontamento && apontamento.imagens_apontamento.length > 0
                  ? apontamento.imagens_apontamento
                  : apontamento.url_imagem
                  ? [apontamento.url_imagem]
                  : [];

                const listImagensSol = apontamento.imagens_solucao && apontamento.imagens_solucao.length > 0
                  ? apontamento.imagens_solucao
                  : apontamento.url_imagem_solucao
                  ? [apontamento.url_imagem_solucao]
                  : [];

                const isLongText =
                  (apontamento.descricao?.length || 0) + (apontamento.solucao?.length || 0) > 220 ||
                  listImagensSol.length > 0;

                return (
                  <div key={`rel-page-container-${apontamento.id}`} className="w-full flex flex-col items-center group print:block print:w-[210mm] print:m-0 print:p-0">
                    {/* Barra de Ação Rápida de Posição da Prancha (no-print) */}
                    <div className="no-print w-[210mm] flex items-center justify-between mb-2 px-3 py-1.5 bg-white/95 dark:bg-[#072B3B]/95 backdrop-blur-xs rounded-xl border border-slate-200/90 dark:border-[#0B384D] text-xs shadow-2xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-[#072B3B] text-[#00C4EB] text-[10.5px] font-black font-mono">
                          Prancha #{index + 1}
                        </span>
                        <span className="font-bold text-[#072B3B] dark:text-slate-200 text-xs truncate max-w-[340px]">
                          {apontamento.titulo}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveItemToExtreme(index, 'top')}
                          disabled={isFirst}
                          title="Mover para a primeira posição (Topo)"
                          className="h-7 w-7 p-0 text-slate-500 hover:text-[#00A3C4] disabled:opacity-20 cursor-pointer"
                        >
                          <ChevronsUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleMoveItem(index, 'up')}
                          disabled={isFirst}
                          title="Subir uma posição"
                          className="h-7 text-xs px-2 gap-1 font-semibold border-slate-200 dark:border-[#0B384D] hover:border-[#00A3C4] hover:text-[#00A3C4] disabled:opacity-20 cursor-pointer"
                        >
                          <ArrowUp className="h-3.5 w-3.5" /> Subir
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleMoveItem(index, 'down')}
                          disabled={isLast}
                          title="Descer uma posição"
                          className="h-7 text-xs px-2 gap-1 font-semibold border-slate-200 dark:border-[#0B384D] hover:border-[#00A3C4] hover:text-[#00A3C4] disabled:opacity-20 cursor-pointer"
                        >
                          <ArrowDown className="h-3.5 w-3.5" /> Descer
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveItemToExtreme(index, 'bottom')}
                          disabled={isLast}
                          title="Mover para a última posição (Fim)"
                          className="h-7 w-7 p-0 text-slate-500 hover:text-[#00A3C4] disabled:opacity-20 cursor-pointer"
                        >
                          <ChevronsDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div
                      style={{ color: '#072b3b', backgroundColor: '#ffffff' }}
                      className="wcc-a4-page w-[210mm] min-h-[296mm] max-h-[296.8mm] h-[296.8mm] p-5 sm:p-6 bg-white text-[#072B3B] mx-auto flex flex-col justify-between border border-slate-300 shadow-xl print:shadow-none print:border-none print:m-0 box-border rounded-none dark:bg-white dark:text-[#072B3B] break-after-page font-sans overflow-hidden shrink-0"
                    >
                      {/* Header Fixo do Topo da Prancha A4 */}
                      <div className="border-b border-slate-400 pb-1.5 flex items-center justify-between text-[11px] text-slate-700 shrink-0">
                        <span className="font-bold text-[#072B3B] uppercase">RELATÓRIO DE COMPATIBILIZAÇÃO TÉCNICA</span>
                        <span className="font-black text-[#00A3C4] uppercase truncate max-w-[200px]">
                          {nomeProjetoItem}
                        </span>
                        <span>{dataAtualFormatada}</span>
                      </div>

                      {/* Conteudo Principal do Apontamento com Fluxo Contínuo e Espaçamento Natural */}
                      <div className="space-y-2 py-1.5 flex-1 flex flex-col justify-start overflow-hidden">
                        {/* 1. Titulo do Apontamento (Quebra de Linha Natural + Status) */}
                        <div className="flex items-center justify-between gap-3 border-b border-slate-300 pb-1.5 shrink-0">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-[#072B3B] text-white text-[11px] font-black shrink-0 leading-normal">
                              #{index + 1}
                            </span>
                            <h2 className="text-[13.5px] sm:text-[14.5px] font-black text-[#072B3B] leading-tight break-words whitespace-normal">
                              {apontamento.titulo}
                            </h2>
                          </div>
                          <span
                            className={`text-[9.5px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shrink-0 ${
                              apontamento.status === 'Resolvido'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {apontamento.status === 'Resolvido' ? (
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <AlertCircle className="h-3 w-3 text-amber-600" />
                            )}
                            {apontamento.status}
                          </span>
                        </div>

                        {/* 2. Metadados e Tags em 2 Linhas no Topo (Largura Total 100%) */}
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 space-y-1 text-xs shrink-0">
                          {/* Linha 1 de Metadados: Prioridade | Tipo de Conflito | Disciplina Origem -> Destino */}
                          <div className="grid grid-cols-12 gap-2 items-center">
                            {/* Prioridade */}
                            <div className="col-span-3 flex items-center gap-1.5">
                              <span className="text-[9px] text-slate-500 font-bold uppercase">Prioridade:</span>
                              <span
                                className={`font-bold px-1.5 py-0.2 rounded text-[9.5px] inline-block ${
                                  apontamento.prioridade === 'Alta'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : apontamento.prioridade === 'Média'
                                    ? 'bg-orange-100 text-orange-800 border border-orange-300'
                                    : 'bg-[#00A3C4]/15 text-[#008EA9] border border-[#00A3C4]/30'
                                }`}
                              >
                                {apontamento.prioridade === 'Alta' ? 'Alto' : apontamento.prioridade === 'Média' ? 'Médio' : 'Baixo'}
                              </span>
                            </div>

                            {/* Tipo de Apontamento */}
                            <div className="col-span-4 flex items-center gap-1 truncate">
                              <span className="text-[9px] text-slate-500 font-bold uppercase shrink-0">Tipo:</span>
                              <span className="font-bold text-amber-900 text-[10px] truncate flex items-center gap-1">
                                <ShieldAlert className="h-3 w-3 text-amber-600 shrink-0" />
                                <span className="truncate">{apontamento.tipo_conflito || 'Conflito Físico'}</span>
                              </span>
                            </div>

                            {/* Disciplinas Origem -> Destino */}
                            <div className="col-span-5 flex items-center gap-1.5 justify-end truncate">
                              <span className="text-[9px] text-slate-500 font-bold uppercase shrink-0">Disciplinas:</span>
                              <span className="font-extrabold text-[#008EA9] text-[10px] truncate">{apontamento.disciplina_origem}</span>
                              <span className="text-slate-400 font-bold">➔</span>
                              <span className="font-extrabold text-rose-900 text-[10px] truncate">{apontamento.disciplina_destino}</span>
                            </div>
                          </div>

                          {/* Linha 2 de Metadados: Localização / Pavimento | Data */}
                          <div className="flex items-center justify-between border-t border-slate-200/80 pt-1 text-[10px]">
                            <div className="flex items-center gap-1.5 truncate max-w-[480px]">
                              <span className="text-[9px] text-slate-500 font-bold uppercase shrink-0">Localização / Pavimento:</span>
                              <span className="font-extrabold text-[#072B3B] truncate" title={[apontamento.pavimento, apontamento.localizacao].filter(Boolean).join(' • ')}>
                                {[apontamento.pavimento, apontamento.localizacao].filter(Boolean).join(' • ') || 'Geral / Não especificado'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 text-slate-500 shrink-0 text-[9.5px]">
                              <span className="font-bold uppercase text-[9px]">Data:</span>
                              <span className="font-semibold text-slate-800">{formatDate(apontamento.created_at)}</span>
                            </div>
                          </div>
                        </div>

                        {/* 3. Galeria Padronizada com as Duas Primeiras Imagens em Largura Total (100%) */}
                        <div className="w-full shrink-0">
                          {listImagensApt.length === 0 ? (
                            <div className={`border-2 border-dashed border-slate-300 rounded-lg overflow-hidden bg-slate-50 flex flex-col items-center justify-center p-3 text-center ${
                              isLongText ? 'h-[44mm]' : 'h-[60mm]'
                            }`}>
                              <ImageIcon className="h-7 w-7 text-slate-400 opacity-60" />
                              <p className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                                Sem Imagem Anexada
                              </p>
                            </div>
                          ) : listImagensApt.length === 1 ? (
                            /* 1 Imagem: Visualização Ampla e Imponente em Largura Total */
                            <div className={`border-2 border-[#00A3C4]/40 rounded-lg overflow-hidden bg-[#041A24] flex items-center justify-center p-1.5 shadow-sm relative w-full ${
                              isLongText ? 'h-[48mm]' : 'h-[65mm]'
                            }`}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={listImagensApt[0]}
                                alt={apontamento.titulo}
                                crossOrigin="anonymous"
                                className="w-full h-full object-contain mx-auto"
                              />
                            </div>
                          ) : (
                            /* 2 Imagens: Grid Lado a Lado de 2 Colunas Amplas com Fotos #1 e #2 */
                            <div className={`grid grid-cols-2 gap-2.5 w-full ${isLongText ? 'h-[48mm]' : 'h-[65mm]'}`}>
                              {/* Foto 1 */}
                              <div className="border-2 border-[#00A3C4]/40 rounded-lg overflow-hidden bg-[#041A24] flex items-center justify-center p-1.5 shadow-sm relative h-full">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={listImagensApt[0]}
                                  alt="Foto 1"
                                  crossOrigin="anonymous"
                                  className="w-full h-full object-contain mx-auto"
                                />
                              </div>

                              {/* Foto 2 */}
                              <div className="border-2 border-[#00A3C4]/40 rounded-lg overflow-hidden bg-[#041A24] flex items-center justify-center p-1.5 shadow-sm relative h-full">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={listImagensApt[1]}
                                  alt="Foto 2"
                                  crossOrigin="anonymous"
                                  className="w-full h-full object-contain mx-auto"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 4. Descrição Técnica do Conflito */}
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-300 space-y-0.5 shrink-0">
                          <span className="text-[10px] text-slate-700 font-bold uppercase block tracking-wider">
                            Descrição Técnica do Conflito:
                          </span>
                          <p className="text-[11.5px] text-slate-800 leading-relaxed font-normal whitespace-pre-wrap break-words">
                            {apontamento.descricao}
                          </p>
                        </div>

                        {/* 5. Guia / Diretriz de Solução Técnica com Galeria */}
                        <div className="bg-emerald-50/90 p-2 rounded-lg border border-emerald-300 space-y-1 shrink-0">
                          <div className="flex items-center justify-between border-b border-emerald-200 pb-0.5">
                            <span className="text-[10.5px] font-bold text-[#047857] uppercase flex items-center gap-1 tracking-wider">
                              <Lightbulb className="h-3 w-3 text-[#10B981] shrink-0" /> Guia / Solução Proposta & Diretriz Técnica:
                            </span>
                            {listImagensSol.length > 0 && (
                              <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.2 rounded border border-emerald-300">
                                💡 {listImagensSol.length} Foto(s) de Solução
                              </span>
                            )}
                          </div>

                          <div className={listImagensSol.length > 0 ? "grid grid-cols-12 gap-2.5 items-start" : ""}>
                            <div className={listImagensSol.length > 0 ? "col-span-7" : ""}>
                              <p className="text-[11.5px] text-emerald-950 leading-relaxed font-normal whitespace-pre-wrap break-words">
                                {apontamento.solucao || 'Aguardando definição técnica de solução pelos projetistas envolvidos.'}
                              </p>
                            </div>

                            {listImagensSol.length > 0 && (
                              <div className="col-span-5">
                                {listImagensSol.length === 1 ? (
                                  <div className="border-2 border-emerald-400/60 rounded-lg overflow-hidden bg-[#041A24] h-16 relative flex items-center justify-center p-0.5 shadow-sm">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={listImagensSol[0]}
                                      alt="Foto da Solução"
                                      crossOrigin="anonymous"
                                      className="w-full h-full object-contain mx-auto"
                                    />
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-2 gap-1.5 h-16">
                                    {listImagensSol.slice(0, 2).map((solUrl, solIdx) => (
                                      <div
                                        key={`pdf-sol-grid2-${solIdx}`}
                                        className="border-2 border-emerald-400/60 rounded-lg overflow-hidden bg-[#041A24] relative flex items-center justify-center p-0.5 shadow-sm h-full"
                                      >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                          src={solUrl}
                                          alt={`Solução ${solIdx + 1}`}
                                          crossOrigin="anonymous"
                                          className="w-full h-full object-contain mx-auto"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Rodape Fixo da Folha A4 */}
                      <div className="border-t border-slate-400 pt-1.5 flex items-center justify-between text-[10px] text-slate-600 shrink-0">
                        <span className="font-semibold text-slate-600 uppercase">{nomeProjetoItem}</span>
                        <span className="font-bold text-[#072B3B]">Pág {numPaginaAtual} de {totalPaginasPDF}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal de Reordenação Visual da Sequência */}
        <ReorderApontamentosModal
          isOpen={isReorderModalOpen}
          onClose={() => setIsReorderModalOpen(false)}
          apontamentos={orderedApontamentos}
          onApplyOrder={handleApplyOrderFromModal}
          currentCriteria={sortCriteria}
        />
      </div>
    </main>
  );
}
