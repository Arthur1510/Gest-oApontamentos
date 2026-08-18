"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
} from 'lucide-react';
import { Apontamento, Projeto, DISCIPLINAS_OPCOES, TIPOS_CONFLITO_OPCOES } from '@/types/apontamento';
import { supabase, isSupabaseConfigured, MOCK_APONTAMENTOS, MOCK_PROJETOS } from '@/lib/supabase/client';
import { SupabaseStatusBanner } from '@/components/apontamentos/SupabaseStatusBanner';
import { Button } from '@/components/ui/button';
import { MultiSelectFilter, MultiSelectOption } from '@/components/ui/multi-select-filter';
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

  // Filtrar Lista de Apontamentos com multi-seleção
  const filteredApontamentos = apontamentos.filter((item) => {
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

  const resetFilters = () => {
    setSelectedProjetos([]);
    setSelectedStatus([]);
    setSelectedDisciplinas([]);
    setSelectedTiposConflito([]);
  };

  // Nome do projeto selecionado para a Capa
  const projetoSelecionadoNome =
    selectedProjetos.length === 0
      ? 'TODOS OS PROJETOS'
      : selectedProjetos.length === 1
      ? projetosList.find((p) => p.id === selectedProjetos[0])?.nome || 'PROJETO SELECIONADO'
      : `${selectedProjetos.length} PROJETOS SELECIONADOS`;

  const dataAtualFormatada = new Date().toLocaleDateString('pt-BR');
  const totalPaginasPDF = filteredApontamentos.length + 1; // 1 Capa + N Páginas

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Banner de status Supabase (no-print) */}
        <div className="no-print">
          <SupabaseStatusBanner />
        </div>

        {/* Cabeçalho do Relatório */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-[#0B384D]">
          <div>
            <div className="flex items-center gap-2 text-[#00A3C4] dark:text-[#00C4EB] font-bold text-xs uppercase tracking-wider">
              <FileText className="h-4 w-4" /> WCC Participações • Relatórios & Exportação PDF
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
            disabled={filteredApontamentos.length === 0 || isLoading}
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
              <Filter className="h-3.5 w-3.5 text-[#00A3C4] dark:text-[#00C4EB]" /> Filtrar Conteúdo do Relatório (Multi-Seleção)
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

        {/* Estado de Carregamento */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#00A3C4]" />
            <p className="text-xs text-slate-500 font-medium">Montando relatório técnico A4...</p>
          </div>
        ) : filteredApontamentos.length === 0 ? (
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
                Visualização do Documento A4 ({filteredApontamentos.length} apontamentos • {totalPaginasPDF} páginas)
              </span>
              <span className="text-[11px] text-[#00A3C4] font-semibold">
                Padrão Institucional WCC Participações
              </span>
            </div>

            {/* AREA IMPRIMÍVEL (REACT-TO-PRINT) */}
            <div ref={contentRef} className="print-area space-y-8 flex flex-col items-center">
              {/* PAGINA 1: CAPA INSTITUCIONAL WCC (FOLHA A4 PADRÃO) */}
              <div
                style={{ pageBreakAfter: 'always', color: '#072b3b', backgroundColor: '#ffffff' }}
                className="w-[210mm] min-h-[297mm] h-auto p-6 sm:p-8 bg-white text-[#072B3B] mx-auto flex flex-col justify-between border border-slate-300 shadow-xl print:shadow-none print:border-none print:m-0 box-border rounded-none dark:bg-white dark:text-[#072B3B] break-after-page font-sans relative overflow-hidden"
              >
                {/* Faixa decorativa topo */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00A3C4] to-[#10B981]" />

                {/* Topo da Capa */}
                <div className="flex items-center justify-between border-b border-slate-300 pb-2 text-[11px] text-slate-600 font-sans shrink-0">
                  <span className="font-bold text-[#072B3B] uppercase">WCC PARTICIPAÇÕES • RELATÓRIO TÉCNICO</span>
                  <span className="font-extrabold text-[#00A3C4] uppercase truncate max-w-[220px]">{projetoSelecionadoNome}</span>
                  <span>{dataAtualFormatada}</span>
                </div>

                {/* Centro da Capa: Logo WCC & Titulos */}
                <div className="my-auto text-center space-y-5 flex flex-col items-center justify-center py-8">
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
                      <span className="text-[#00A3C4] font-black text-sm">{filteredApontamentos.length}</span>
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
                  <span className="font-mono">www.wccparticipacoes.com.br</span>
                  <span className="font-bold text-[#072B3B]">Pág 1 de {totalPaginasPDF}</span>
                </div>
              </div>

              {/* PAGINAS 2 A N: CADA APONTAMENTO EM UMA FOLHA A4 ADAPTÁVEL */}
              {filteredApontamentos.map((apontamento, index) => {
                const nomeProjetoItem = apontamento.projetos?.nome || projetoSelecionadoNome || 'Projeto Geral';
                const numPaginaAtual = index + 2;

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

                const isLongText = (apontamento.descricao?.length || 0) + (apontamento.solucao?.length || 0) > 400;

                return (
                  <div
                    key={`rel-page-${apontamento.id}`}
                    style={{ pageBreakAfter: 'always', color: '#072b3b', backgroundColor: '#ffffff' }}
                    className="w-[210mm] min-h-[297mm] h-auto p-6 sm:p-7 bg-white text-[#072B3B] mx-auto flex flex-col justify-between border border-slate-300 shadow-xl print:shadow-none print:border-none print:m-0 box-border rounded-none dark:bg-white dark:text-[#072B3B] break-after-page font-sans"
                  >
                    {/* Header Fixo do Topo da Prancha A4 */}
                    <div className="border-b border-slate-400 pb-2 flex items-center justify-between text-[11px] text-slate-700 shrink-0">
                      <span className="font-bold text-[#072B3B]">WCC PARTICIPAÇÕES • COMPATIBILIZAÇÃO TÉCNICA</span>
                      <span className="font-black text-[#00A3C4] uppercase truncate max-w-[200px]">
                        {nomeProjetoItem}
                      </span>
                      <span>{dataAtualFormatada}</span>
                    </div>

                    {/* Conteudo Principal do Apontamento com Fluxo Contínuo e Espaçamento Natural */}
                    <div className="space-y-2.5 py-2 flex-1 flex flex-col justify-start">
                      {/* 1. Titulo do Apontamento (Quebra de Linha Natural + Status) */}
                      <div className="flex items-start justify-between gap-3 border-b border-slate-300 pb-2 shrink-0">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <span className="px-2 py-0.5 rounded bg-[#072B3B] text-white text-[11px] font-black shrink-0 mt-0.5">
                            #{index + 1}
                          </span>
                          <h2 className="text-[13.5px] sm:text-sm font-black text-[#072B3B] leading-snug break-words whitespace-normal">
                            {apontamento.titulo}
                          </h2>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shrink-0 mt-0.5 ${
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
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 space-y-1.5 text-xs shrink-0">
                        {/* Linha 1 de Metadados: Prioridade | Tipo de Conflito | Disciplina Origem -> Destino */}
                        <div className="grid grid-cols-12 gap-2 items-center">
                          {/* Prioridade */}
                          <div className="col-span-3 flex items-center gap-1.5">
                            <span className="text-[9px] text-slate-500 font-bold uppercase">Prioridade:</span>
                            <span
                              className={`font-bold px-2 py-0.2 rounded text-[10px] inline-block ${
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
                            <span className="font-bold text-amber-900 text-[10.5px] truncate flex items-center gap-1">
                              <ShieldAlert className="h-3 w-3 text-amber-600 shrink-0" />
                              <span className="truncate">{apontamento.tipo_conflito || 'Conflito Físico'}</span>
                            </span>
                          </div>

                          {/* Disciplinas Origem -> Destino */}
                          <div className="col-span-5 flex items-center gap-1.5 justify-end truncate">
                            <span className="text-[9px] text-slate-500 font-bold uppercase shrink-0">Disciplinas:</span>
                            <span className="font-extrabold text-[#008EA9] text-[10.5px] truncate">{apontamento.disciplina_origem}</span>
                            <span className="text-slate-400 font-bold">➔</span>
                            <span className="font-extrabold text-rose-900 text-[10.5px] truncate">{apontamento.disciplina_destino}</span>
                          </div>
                        </div>

                        {/* Linha 2 de Metadados: Localização / Pavimento | Data */}
                        <div className="flex items-center justify-between border-t border-slate-200/80 pt-1 text-[10.5px]">
                          <div className="flex items-center gap-1.5 truncate max-w-[500px]">
                            <span className="text-[9px] text-slate-500 font-bold uppercase shrink-0">Localização / Pavimento:</span>
                            <span className="font-extrabold text-[#072B3B] truncate" title={[apontamento.pavimento, apontamento.localizacao].filter(Boolean).join(' • ')}>
                              {[apontamento.pavimento, apontamento.localizacao].filter(Boolean).join(' • ') || 'Geral / Não especificado'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-slate-500 shrink-0 text-[10px]">
                            <span className="font-bold uppercase text-[9px]">Data:</span>
                            <span className="font-semibold text-slate-800">{formatDate(apontamento.created_at)}</span>
                          </div>
                        </div>
                      </div>

                      {/* 3. Galeria Padronizada com as Duas Primeiras Imagens em Largura Total (100%) */}
                      <div className="w-full shrink-0">
                        {listImagensApt.length === 0 ? (
                          <div className={`border-2 border-dashed border-slate-300 rounded-lg overflow-hidden bg-slate-50 flex flex-col items-center justify-center p-4 text-center ${
                            isLongText ? 'h-[58mm]' : 'h-[78mm]'
                          }`}>
                            <ImageIcon className="h-8 w-8 text-slate-400 opacity-60" />
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">
                              Sem Imagem Anexada
                            </p>
                          </div>
                        ) : listImagensApt.length === 1 ? (
                          /* 1 Imagem: Visualização Ampla e Imponente em Largura Total */
                          <div className={`border-2 border-[#00A3C4]/40 rounded-lg overflow-hidden bg-[#041A24] flex items-center justify-center p-1.5 shadow-sm relative w-full ${
                            isLongText ? 'h-[60mm]' : 'h-[80mm]'
                          }`}>
                            <div className="absolute top-2 left-2 bg-[#072B3B]/90 text-white text-[9px] font-mono px-2 py-0.5 rounded border border-[#00A3C4]/40 z-10">
                              📸 Foto Principal (#1)
                            </div>
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
                          <div className={`grid grid-cols-2 gap-3 w-full ${isLongText ? 'h-[60mm]' : 'h-[80mm]'}`}>
                            {/* Foto 1 */}
                            <div className="border-2 border-[#00A3C4]/40 rounded-lg overflow-hidden bg-[#041A24] flex items-center justify-center p-1.5 shadow-sm relative h-full">
                              <div className="absolute top-1.5 left-1.5 bg-[#072B3B]/90 text-[#00C4EB] text-[8.5px] font-mono px-2 py-0.5 rounded border border-[#00A3C4]/40 z-10">
                                📸 #1 Principal
                              </div>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={listImagensApt[0]}
                                alt="Foto 1 Principal"
                                crossOrigin="anonymous"
                                className="w-full h-full object-contain mx-auto"
                              />
                            </div>

                            {/* Foto 2 */}
                            <div className="border-2 border-[#00A3C4]/40 rounded-lg overflow-hidden bg-[#041A24] flex items-center justify-center p-1.5 shadow-sm relative h-full">
                              <div className="absolute top-1.5 left-1.5 bg-[#072B3B]/90 text-[#00C4EB] text-[8.5px] font-mono px-2 py-0.5 rounded border border-[#00A3C4]/40 z-10 flex items-center gap-1">
                                <span>📸 #2 Detalhe</span>
                                {listImagensApt.length > 2 && (
                                  <span className="text-amber-300 font-bold">(+{listImagensApt.length - 2} fotos)</span>
                                )}
                              </div>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={listImagensApt[1]}
                                alt="Foto 2 Detalhe"
                                crossOrigin="anonymous"
                                className="w-full h-full object-contain mx-auto"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 4. Descrição Técnica do Conflito */}
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-300 space-y-1 shrink-0">
                        <span className="text-[9.5px] text-slate-600 font-bold uppercase block">Descrição Técnica do Conflito:</span>
                        <p className="text-[10.5px] text-slate-800 leading-relaxed font-normal whitespace-pre-wrap break-words">
                          {apontamento.descricao}
                        </p>
                      </div>

                      {/* 5. Guia / Diretriz de Solução Técnica com Galeria */}
                      <div className="bg-emerald-50/90 p-2.5 rounded-lg border border-emerald-300 space-y-1.5 shrink-0">
                        <div className="flex items-center justify-between border-b border-emerald-200 pb-1">
                          <span className="text-[10px] font-bold text-[#047857] uppercase flex items-center gap-1">
                            <Lightbulb className="h-3.5 w-3.5 text-[#10B981] shrink-0" /> Guia / Solução Proposta & Diretriz Técnica:
                          </span>
                          {listImagensSol.length > 0 && (
                            <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.2 rounded border border-emerald-300">
                              💡 {listImagensSol.length} Foto(s) de Solução
                            </span>
                          )}
                        </div>

                        <div className={listImagensSol.length > 0 ? "grid grid-cols-12 gap-3 items-start" : ""}>
                          <div className={listImagensSol.length > 0 ? "col-span-7" : ""}>
                            <p className="text-[10.5px] text-emerald-950 leading-relaxed font-normal whitespace-pre-wrap break-words">
                              {apontamento.solucao || 'Aguardando definição técnica de solução pelos projetistas envolvidos.'}
                            </p>
                          </div>

                          {listImagensSol.length > 0 && (
                            <div className="col-span-5">
                              {listImagensSol.length === 1 ? (
                                <div className="border-2 border-emerald-400/60 rounded-lg overflow-hidden bg-[#041A24] h-20 relative flex items-center justify-center p-0.5 shadow-sm">
                                  <div className="absolute top-1 left-1 bg-[#041A24]/90 text-emerald-400 text-[8px] font-mono px-1.5 py-0.5 rounded border border-emerald-400/40 z-10">
                                    💡 Solução #1
                                  </div>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={listImagensSol[0]}
                                    alt="Foto da Solução"
                                    crossOrigin="anonymous"
                                    className="w-full h-full object-contain mx-auto"
                                  />
                                </div>
                              ) : (
                                <div className="grid grid-cols-2 gap-1.5 h-20">
                                  {listImagensSol.slice(0, 2).map((solUrl, solIdx) => (
                                    <div
                                      key={`pdf-sol-grid2-${solIdx}`}
                                      className="border-2 border-emerald-400/60 rounded-lg overflow-hidden bg-[#041A24] relative flex items-center justify-center p-0.5 shadow-sm h-full"
                                    >
                                      <div className="absolute top-0.5 left-0.5 bg-[#041A24]/90 text-emerald-400 text-[7px] font-mono px-1 rounded z-10">
                                        💡 #{solIdx + 1}
                                      </div>
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
                    <div className="border-t border-slate-400 pt-2 flex items-center justify-between text-[10px] text-slate-600 shrink-0">
                      <span className="font-mono">WCC PARTICIPAÇÕES • www.wccparticipacoes.com.br</span>
                      <span className="font-bold text-[#072B3B]">Pág {numPaginaAtual} de {totalPaginasPDF}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
