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
import { SelectNative } from '@/components/ui/select-native';
import { formatDate } from '@/lib/utils';

export default function RelatoriosPage() {
  const [apontamentos, setApontamentos] = useState<Apontamento[]>([]);
  const [projetosList, setProjetosList] = useState<Projeto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros de Relatório
  const [selectedProjeto, setSelectedProjeto] = useState<string>('Todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('Todos');
  const [selectedDisciplina, setSelectedDisciplina] = useState<string>('Todas');
  const [selectedTipoConflito, setSelectedTipoConflito] = useState<string>('Todos');

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

  // Filtrar Lista de Apontamentos
  const filteredApontamentos = apontamentos.filter((item) => {
    const matchesProjeto =
      selectedProjeto === 'Todos' || item.projeto_id === selectedProjeto;

    const matchesStatus =
      selectedStatus === 'Todos' || item.status === selectedStatus;

    const matchesDisciplina =
      selectedDisciplina === 'Todas' ||
      item.disciplina_origem === selectedDisciplina ||
      item.disciplina_destino === selectedDisciplina;

    const matchesTipoConflito =
      selectedTipoConflito === 'Todos' || item.tipo_conflito === selectedTipoConflito;

    return matchesProjeto && matchesStatus && matchesDisciplina && matchesTipoConflito;
  });

  const resetFilters = () => {
    setSelectedProjeto('Todos');
    setSelectedStatus('Todos');
    setSelectedDisciplina('Todas');
    setSelectedTipoConflito('Todos');
  };

  // Nome do projeto selecionado para a Capa
  const projetoSelecionadoNome =
    selectedProjeto === 'Todos'
      ? 'TODOS OS PROJETOS'
      : projetosList.find((p) => p.id === selectedProjeto)?.nome || 'PROJETO SELECIONADO';

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
        <div className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              <Filter className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" /> Filtrar Conteúdo do Relatório
            </div>
            {(selectedProjeto !== 'Todos' || selectedStatus !== 'Todos' || selectedDisciplina !== 'Todas' || selectedTipoConflito !== 'Todos') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 h-7 gap-1"
              >
                <RefreshCw className="h-3 w-3" /> Limpar Filtros
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Filtro por Projeto */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Projeto:</label>
              <SelectNative
                variant="indigo"
                value={selectedProjeto}
                onChange={(e) => setSelectedProjeto(e.target.value)}
              >
                <option value="Todos">Todos os Projetos</option>
                {projetosList.map((p) => (
                  <option key={`rel-proj-${p.id}`} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </SelectNative>
            </div>

            {/* Filtro por Tipo de Apontamento */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Tipo de Apontamento:</label>
              <SelectNative
                variant="amber"
                value={selectedTipoConflito}
                onChange={(e) => setSelectedTipoConflito(e.target.value)}
              >
                <option value="Todos">Todos os Tipos</option>
                {TIPOS_CONFLITO_OPCOES.map((tc) => (
                  <option key={`rel-tc-${tc}`} value={tc}>
                    {tc}
                  </option>
                ))}
              </SelectNative>
            </div>

            {/* Filtro por Status */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Status:</label>
              <SelectNative
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="Todos">Todos os Status</option>
                <option value="Aberto">Aberto</option>
                <option value="Resolvido">Resolvido</option>
              </SelectNative>
            </div>

            {/* Filtro por Disciplina */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Disciplina:</label>
              <SelectNative
                value={selectedDisciplina}
                onChange={(e) => setSelectedDisciplina(e.target.value)}
              >
                <option value="Todas">Todas as Disciplinas</option>
                {DISCIPLINAS_OPCOES.map((d) => (
                  <option key={`rel-disc-${d}`} value={d}>
                    {d}
                  </option>
                ))}
              </SelectNative>
            </div>
          </div>
        </div>

        {/* Estado de Carregamento */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
            <p className="text-xs text-slate-500 font-medium">Montando relatório técnico A4...</p>
          </div>
        ) : filteredApontamentos.length === 0 ? (
          <div className="no-print rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-12 text-center flex flex-col items-center justify-center gap-4">
            <div className="p-4 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Nenhum apontamento encontrado para o relatório
              </h3>
              <p className="text-xs text-slate-500 max-w-md mt-1">
                Ajuste os filtros acima para listar os apontamentos que deseja exportar em PDF.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs">
              Limpar Filtros
            </Button>
          </div>
        ) : (
          /* AREA DE IMPRESSAO COM SUPORTE A OVERFLOW MOBILE */
          <div className="w-full overflow-x-auto pb-4">
            <div ref={contentRef} className="space-y-8 print:space-y-0 min-w-[210mm]">
              {/* PAGINA 1: CAPA PROFISSIONAL DO RELATORIO (PADRÃO WCC 2026) */}
              <div
                style={{ pageBreakAfter: 'always', color: '#072b3b', backgroundColor: '#ffffff' }}
                className="w-[210mm] min-h-[297mm] h-auto p-8 bg-white text-[#072B3B] mx-auto flex flex-col justify-between border border-slate-300 shadow-xl print:shadow-none print:border-none print:m-0 box-border rounded-none dark:bg-white dark:text-[#072B3B] break-after-page"
              >
                {/* Header Topo da Capa */}
                <div className="flex items-center justify-between border-b border-slate-300 pb-2 text-[11px] text-slate-600 font-sans">
                  <span className="font-bold text-[#072B3B]">WCC PARTICIPAÇÕES • COMPATIBILIZAÇÃO BIM</span>
                  <span className="font-extrabold text-[#00A3C4] uppercase">{projetoSelecionadoNome}</span>
                  <span>{dataAtualFormatada}</span>
                </div>

                {/* Centro da Capa: Logo WCC & Titulos */}
                <div className="my-auto text-center space-y-6 flex flex-col items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <div className="px-5 py-2 rounded-2xl bg-[#072B3B] text-white flex items-center justify-center shadow-xl border border-[#00A3C4]/30">
                      <span className="text-3xl font-black tracking-widest">WCC</span>
                    </div>
                    <div className="text-sm font-black tracking-[0.3em] text-[#072B3B] uppercase">
                      PARTICIPAÇÕES
                    </div>
                    <div className="text-[10px] font-bold tracking-[0.35em] text-[#00A3C4] uppercase">
                      AURA | ELBRUS
                    </div>
                  </div>

                  <div className="space-y-2 py-2">
                    <h2 className="text-4xl font-black tracking-tight text-[#072B3B] uppercase">
                      RELATÓRIO TÉCNICO
                    </h2>
                    <div className="w-28 h-1 mx-auto rounded-full bg-gradient-to-r from-[#00A3C4] to-[#10B981]" />
                    <p className="text-xl font-extrabold text-[#008EA9] uppercase tracking-wide pt-1">
                      {projetoSelecionadoNome}
                    </p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      HÁ 14 ANOS TRANSFORMANDO SONHOS EM PROJETOS REAIS.
                    </p>
                  </div>

                  {/* Resumo e Filtros da Capa */}
                  <div className="max-w-lg mx-auto bg-slate-50 p-6 rounded-xl border border-slate-200 text-xs space-y-3 font-sans">
                    <div className="font-black text-sm text-[#072B3B] border-b border-slate-200 pb-2 flex items-center justify-between">
                      <span>Total de Apontamentos:</span>
                      <span className="text-[#00A3C4] font-black text-base">{filteredApontamentos.length}</span>
                    </div>

                    <div className="space-y-1 text-slate-600 text-left">
                      <p className="font-bold text-[#072B3B]">Filtros Aplicados no Relatório:</p>
                      <p>• <strong>Tipo de Apontamento:</strong> {selectedTipoConflito}</p>
                      <p>• <strong>Status:</strong> {selectedStatus}</p>
                      <p>• <strong>Disciplina:</strong> {selectedDisciplina}</p>
                      <p>• <strong>Ordenação:</strong> Data de Criação (#)</p>
                    </div>
                  </div>
                </div>

                {/* Rodapé da Capa */}
                <div className="flex items-center justify-between border-t border-slate-300 pt-2 text-[10px] text-slate-500 font-sans">
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
                    className="w-[210mm] min-h-[297mm] h-auto p-6 sm:p-8 bg-white text-[#072B3B] mx-auto flex flex-col justify-between border border-slate-300 shadow-xl print:shadow-none print:border-none print:m-0 box-border rounded-none dark:bg-white dark:text-[#072B3B] break-after-page font-sans"
                  >
                    {/* Header Fixo do Topo da Prancha A4 */}
                    <div className="border-b border-slate-400 pb-2 flex items-center justify-between text-[11px] text-slate-700 shrink-0">
                      <span className="font-bold text-[#072B3B]">WCC PARTICIPAÇÕES • COMPATIBILIZAÇÃO TÉCNICA</span>
                      <span className="font-black text-[#00A3C4] uppercase truncate max-w-[200px]">
                        {nomeProjetoItem}
                      </span>
                      <span>{dataAtualFormatada}</span>
                    </div>

                    {/* Conteudo Principal do Apontamento com Flex-1 para Adaptação Dinâmica */}
                    <div className="space-y-3 my-auto py-2 flex-1 flex flex-col justify-center">
                      {/* Titulo do Apontamento */}
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2 shrink-0">
                        <h2 className="text-base sm:text-lg font-black text-[#072B3B]">
                          Apontamento #{index + 1} - <span className={apontamento.status === 'Resolvido' ? 'text-[#047857]' : 'text-amber-700'}>{apontamento.status}</span>
                        </h2>
                        <span className="text-xs font-mono font-semibold text-slate-500">
                          ID: #{apontamento.id.slice(0, 8)}
                        </span>
                      </div>

                      {/* Layout Dividido Lado a Lado: Imagem Principal (Esquerda) + Metadados (Direita) */}
                      <div className="grid grid-cols-12 gap-4 items-start shrink-0">
                        {/* LADO ESQUERDO: IMAGEM PRINCIPAL + MINI-GALERIA */}
                        <div className="col-span-7 space-y-1.5">
                          <div className={`border-2 border-slate-300 rounded-lg overflow-hidden bg-[#041A24] flex items-center justify-center p-1 shadow-sm relative transition-all ${
                            isLongText ? 'h-[62mm]' : 'h-[78mm]'
                          }`}>
                            {listImagensApt.length > 0 ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={listImagensApt[0]}
                                alt={apontamento.titulo}
                                crossOrigin="anonymous"
                                className="w-full h-full object-contain mx-auto"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="flex flex-col items-center gap-2 text-slate-400 text-center p-4">
                                <ImageIcon className="h-10 w-10 text-[#00A3C4] opacity-60" />
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                                  Sem Imagem Anexada
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Grade de Fotos Adicionais do Apontamento no PDF */}
                          {listImagensApt.length > 1 && (
                            <div className="grid grid-cols-4 gap-1">
                              {listImagensApt.slice(1, 5).map((secUrl, secIdx) => (
                                <div key={`pdf-sec-apt-${secIdx}`} className="h-10 border border-slate-300 rounded overflow-hidden bg-[#041A24]">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={secUrl} alt={`Sec ${secIdx + 1}`} crossOrigin="anonymous" className="w-full h-full object-cover" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* LADO DIREITO: METADADOS ORGANIZADOS */}
                        <div className="col-span-5 space-y-1.5 text-xs">
                          {/* Prioridade & Data */}
                          <div className="bg-slate-50 p-2 rounded-md border border-slate-200 grid grid-cols-2 gap-1">
                            <div>
                              <span className="text-[9px] text-slate-500 font-bold uppercase block">Prioridade</span>
                              <span
                                className={`font-bold px-2 py-0.5 rounded text-[10px] inline-block mt-0.5 ${
                                  apontamento.prioridade === 'Alta'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : apontamento.prioridade === 'Média'
                                    ? 'bg-orange-100 text-orange-800 border border-orange-300'
                                    : 'bg-[#00A3C4]/15 text-[#008EA9] border border-[#00A3C4]/30'
                                }`}
                              >
                                {apontamento.prioridade}
                              </span>
                            </div>

                            <div>
                              <span className="text-[9px] text-slate-500 font-bold uppercase block">Data Criação</span>
                              <span className="font-semibold text-slate-800 text-[10px] block mt-0.5">{formatDate(apontamento.created_at)}</span>
                            </div>
                          </div>

                          {/* Tipo de Apontamento */}
                          <div className="bg-slate-50 p-2 rounded-md border border-slate-200">
                            <span className="text-[9px] text-slate-500 font-bold uppercase block">Tipo de Apontamento</span>
                            <span className="font-bold text-amber-900 block mt-0.5 text-[11px] flex items-center gap-1">
                              <ShieldAlert className="h-3 w-3 text-amber-600 shrink-0" />
                              <span className="truncate">{apontamento.tipo_conflito || 'Conflito Físico'}</span>
                            </span>
                          </div>

                          {/* Disciplina Principal (Origem) */}
                          <div className="bg-slate-50 p-2 rounded-md border border-slate-200">
                            <span className="text-[9px] text-slate-500 font-bold uppercase block">Disciplina Origem</span>
                            <span className="font-extrabold text-[#008EA9] block mt-0.5 text-[11px] truncate">{apontamento.disciplina_origem}</span>
                          </div>

                          {/* Disciplinas Envolvidas (Destino) */}
                          <div className="bg-slate-50 p-2 rounded-md border border-slate-200">
                            <span className="text-[9px] text-slate-500 font-bold uppercase block">Disciplina Destino</span>
                            <span className="font-extrabold text-rose-900 block mt-0.5 text-[11px] truncate">{apontamento.disciplina_destino}</span>
                          </div>

                          {/* Edificacao / Pavimento */}
                          <div className="bg-slate-50 p-2 rounded-md border border-slate-200">
                            <span className="text-[9px] text-slate-500 font-bold uppercase block">Localização / Pavimento</span>
                            <span className="font-semibold text-slate-800 block mt-0.5 text-[11px]">TÉRREO / PAVIMENTO TIPO</span>
                          </div>
                        </div>
                      </div>

                      {/* Descricao Detalhada */}
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-300 space-y-1">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                          <span className="text-[10px] font-bold text-slate-900 uppercase truncate max-w-[400px]">
                            Título: {apontamento.titulo}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shrink-0 ${
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

                        <span className="text-[9px] text-slate-500 font-bold uppercase block">Descrição Técnica:</span>
                        <p className="text-[11px] text-slate-800 leading-relaxed font-normal whitespace-pre-wrap break-words">
                          {apontamento.descricao}
                        </p>
                      </div>

                      {/* GUIA SOLUÇÃO / BLOCO DE SOLUÇÃO PROPOSTA */}
                      <div className="bg-emerald-50/90 p-3 rounded-lg border border-emerald-300 space-y-2">
                        <span className="text-[10px] font-bold text-[#047857] uppercase flex items-center gap-1">
                          <Lightbulb className="h-3.5 w-3.5 text-[#10B981] shrink-0" /> Guia / Solução Proposta & Diretriz Técnica:
                        </span>

                        <div className={listImagensSol.length > 0 ? "grid grid-cols-12 gap-3 items-start" : ""}>
                          <div className={listImagensSol.length > 0 ? "col-span-8" : ""}>
                            <p className="text-[11px] text-emerald-950 leading-relaxed font-normal whitespace-pre-wrap break-words">
                              {apontamento.solucao || 'Aguardando definição técnica de solução pelos projetistas envolvidos.'}
                            </p>
                          </div>

                          {listImagensSol.length > 0 && (
                            <div className="col-span-4 space-y-1">
                              <div className="border border-emerald-300 rounded overflow-hidden bg-[#041A24] h-24 relative flex items-center justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={listImagensSol[0]}
                                  alt="Foto da Solução"
                                  crossOrigin="anonymous"
                                  className="w-full h-full object-contain mx-auto"
                                />
                              </div>

                              {listImagensSol.length > 1 && (
                                <div className="grid grid-cols-3 gap-1">
                                  {listImagensSol.slice(1, 4).map((solSecUrl, solSecIdx) => (
                                    <div key={`pdf-sec-sol-${solSecIdx}`} className="h-8 border border-emerald-300 rounded overflow-hidden bg-[#041A24]">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={solSecUrl} alt={`Sol ${solSecIdx + 1}`} crossOrigin="anonymous" className="w-full h-full object-cover" />
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
