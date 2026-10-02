"use client";

import React, { useRef, useMemo, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  ItemOrcamento,
  Contrato,
  Medicao,
  CurvaDesembolsoPonto,
  Obra,
  Fornecedor,
  STATUS_MEDICAO_COLORS,
  STATUS_CONTRATO_COLORS,
} from '@/types/orcamento';
import {
  formatCurrency,
  formatPercent,
  formatDateBR,
  calculateKpis,
  getObraLabel,
  isMedicaoEmAtraso,
} from '@/lib/orcamento-utils';
import { exportMultiSheetExcel } from '@/lib/excel-export';
import { Button } from '@/components/ui/button';
import {
  X,
  Printer,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  Layout,
  Layers,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface RelatorioOrcamentoPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  orcamentos: ItemOrcamento[];
  contratos: Contrato[];
  medicoes: Medicao[];
  curvaPontos: CurvaDesembolsoPonto[];
  obras: Obra[];
  filtroObra: string;
  filtroFornecedor: string;
}

export function RelatorioOrcamentoPdfModal({
  isOpen,
  onClose,
  orcamentos,
  contratos,
  medicoes,
  curvaPontos,
  obras,
  filtroObra,
  filtroFornecedor,
}: RelatorioOrcamentoPdfModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Estados de Personalização do Relatório
  const [orientacao, setOrientacao] = useState<'landscape' | 'portrait'>('landscape');
  const [filtroCategoria, setFiltroCategoria] = useState<'Todos' | 'Projeto' | 'Legalização'>('Todos');
  const [showConfig, setShowConfig] = useState<boolean>(true);

  // Seções habilitadas no PDF
  const [secoes, setSecoes] = useState({
    kpis: true,
    orcamentoBase: true,
    contratos: true,
    medicoes: true,
    ocorrencias: true,
    curvaDesembolso: true,
    assinaturas: true,
  });

  const toggleSecao = (key: keyof typeof secoes) => {
    setSecoes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selecionarTodasSecoes = (valor: boolean) => {
    setSecoes({
      kpis: valor,
      orcamentoBase: valor,
      contratos: valor,
      medicoes: valor,
      ocorrencias: valor,
      curvaDesembolso: valor,
      assinaturas: valor,
    });
  };

  // KPIs calculados
  const kpis = useMemo(() => {
    return calculateKpis(
      orcamentos,
      contratos,
      medicoes,
      filtroObra || null,
      null
    );
  }, [orcamentos, contratos, medicoes, filtroObra]);

  const dataAtual = new Date().toLocaleDateString('pt-BR');
  const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const obraSelecionadaNome = filtroObra ? getObraLabel(filtroObra, obras) : 'TODAS AS OBRAS E EMPREENDIMENTOS';

  // 1. Orçamentos Filtrados e Ordenados Hierarquicamente
  const orcamentosFiltradosRelatorio = useMemo(() => {
    return orcamentos
      .filter((o) => {
        if (filtroObra && o.obra !== filtroObra) return false;
        if (filtroCategoria !== 'Todos' && o.categoria !== filtroCategoria) return false;
        return true;
      })
      .sort((a, b) => {
        const cmpObra = (a.obra || '').localeCompare(b.obra || '', 'pt-BR', { numeric: true, sensitivity: 'base' });
        if (cmpObra !== 0) return cmpObra;
        const cmpDisc = (a.disciplina || '').localeCompare(b.disciplina || '', 'pt-BR', { sensitivity: 'base' });
        if (cmpDisc !== 0) return cmpDisc;
        return (a.subdisciplina || '').localeCompare(b.subdisciplina || '', 'pt-BR', { sensitivity: 'base' });
      });
  }, [orcamentos, filtroObra, filtroCategoria]);

  const totaisOrcamento = useMemo(() => {
    let base = 0;
    let contratado = 0;
    let saldoContratar = 0;
    let medido = 0;
    let saldoMedicao = 0;

    for (const o of orcamentosFiltradosRelatorio) {
      base += o.orcamento_base || 0;
      contratado += o.valor_contratado || 0;
      saldoContratar += o.saldo_a_contratar || 0;
      medido += o.valor_medido || 0;
      saldoMedicao += o.saldo_medicao || 0;
    }
    return { base, contratado, saldoContratar, medido, saldoMedicao };
  }, [orcamentosFiltradosRelatorio]);

  // 2. Contratos Filtrados
  const contratosFiltrados = useMemo(() => {
    return contratos
      .filter((c) => {
        if (filtroObra && c.obra !== filtroObra) return false;
        if (filtroFornecedor && c.empresa !== filtroFornecedor) return false;
        if (filtroCategoria !== 'Todos' && c.categoria !== filtroCategoria) return false;
        return true;
      })
      .sort((a, b) => (a.empresa || '').localeCompare(b.empresa || '', 'pt-BR'));
  }, [contratos, filtroObra, filtroFornecedor, filtroCategoria]);

  const todosAditivos = useMemo(() => {
    return contratosFiltrados.flatMap((c) =>
      (c.aditivos || []).map((a) => ({ ...a, empresa: c.empresa, obra: c.obra }))
    );
  }, [contratosFiltrados]);

  const contratosDistratados = useMemo(() => {
    return contratosFiltrados.filter((c) => c.status === 'Distratado');
  }, [contratosFiltrados]);

  // 3. Medições Filtradas
  const medicoesFiltradas = useMemo(() => {
    return medicoes
      .filter((m) => {
        if (filtroObra && m.obra !== filtroObra) return false;
        if (filtroFornecedor && m.empresa !== filtroFornecedor) return false;
        return true;
      })
      .sort((a, b) => (a.data_prevista || '').localeCompare(b.data_prevista || ''));
  }, [medicoes, filtroObra, filtroFornecedor]);

  const medicoesAtrasadas = useMemo(() => {
    return medicoesFiltradas.filter((m) => isMedicaoEmAtraso(m));
  }, [medicoesFiltradas]);

  // Disparo da impressão com estilos A4 dedicados e controle anti-corte de páginas
  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Relatorio_Executivo_Orcamentos_WCC_${filtroObra || 'Consolidado'}_${new Date().toISOString().slice(0, 10)}`,
    pageStyle: `
      @page {
        size: A4 ${orientacao};
        margin: 8mm 8mm 8mm 8mm;
      }
      @media print {
        html, body {
          background: #ffffff !important;
          color: #0f172a !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          font-family: ui-sans-serif, system-ui, sans-serif !important;
        }
        .page-break-avoid {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
        .page-break-before {
          break-before: page !important;
          page-break-before: always !important;
        }
        thead {
          display: table-header-group !important;
        }
        tfoot {
          display: table-footer-group !important;
        }
        tr {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
      }
    `,
  });

  const handleExportarExcelConsolidado = () => {
    exportMultiSheetExcel({
      orcamentos,
      contratos,
      medicoes,
      curvaPontos,
      kpis,
      nomeArquivo: `Relatorio_Consolidado_Orcamentos_WCC_${filtroObra || 'Geral'}.xls`,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in-0">
      <div className="bg-white dark:bg-[#072B3B] rounded-2xl border border-slate-200 dark:border-[#0B384D] max-w-6xl w-full max-h-[96vh] flex flex-col shadow-2xl overflow-hidden">
        {/* 1. BARRA SUPERIOR DE AÇÕES (Não impressa) */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-[#0B384D] flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-[#072432]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00A3C4]/15 text-[#00A3C4] dark:text-[#00C4EB]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
                  Relatório Executivo Consolidado
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00A3C4]/10 text-[#008EA9] dark:text-[#00C4EB] border border-[#00A3C4]/20">
                  {orientacao === 'landscape' ? 'A4 Paisagem (Horizontal)' : 'A4 Retrato (Vertical)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visualização formatada para exportação em PDF e Excel multinível.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowConfig(!showConfig)}
              className="text-xs font-semibold h-9 rounded-xl gap-1.5 border-slate-200 dark:border-[#0B384D]"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>{showConfig ? 'Ocultar Filtros' : 'Opções do Relatório'}</span>
              {showConfig ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>

            <Button
              size="sm"
              onClick={handleExportarExcelConsolidado}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 rounded-xl gap-1.5 shadow-xs"
            >
              <FileSpreadsheet className="h-4 w-4" /> Excel (.xls)
            </Button>

            <Button
              size="sm"
              onClick={() => handlePrint()}
              className="bg-[#00A3C4] hover:bg-[#008EA9] text-white font-bold text-xs h-9 rounded-xl gap-1.5 shadow-xs"
            >
              <Printer className="h-4 w-4" /> Imprimir / PDF
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-9 w-9 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 2. PAINEL DE CONTROLE / PERSONALIZAÇÃO (Não impresso) */}
        {showConfig && (
          <div className="p-3 sm:p-4 bg-slate-100/80 dark:bg-[#083042] border-b border-slate-200 dark:border-[#0B384D] text-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Orientação do Papel */}
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">Orientação da Folha:</span>
                <div className="flex items-center rounded-xl bg-white dark:bg-[#072B3B] p-0.5 border border-slate-200 dark:border-[#0B384D] h-9">
                  <button
                    type="button"
                    onClick={() => setOrientacao('landscape')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      orientacao === 'landscape'
                        ? 'bg-[#00A3C4] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    Paisagem (Horizontal - Recomendado)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientacao('portrait')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      orientacao === 'portrait'
                        ? 'bg-[#00A3C4] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    Retrato (Vertical)
                  </button>
                </div>
              </div>

              {/* Filtro de Categoria */}
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">Categoria:</span>
                <div className="flex items-center rounded-xl bg-white dark:bg-[#072B3B] p-0.5 border border-slate-200 dark:border-[#0B384D] h-9">
                  {(['Todos', 'Projeto', 'Legalização'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFiltroCategoria(cat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        filtroCategoria === cat
                          ? 'bg-[#00A3C4] text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botões Marcar Todos / Limpar */}
              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  type="button"
                  onClick={() => selecionarTodasSecoes(true)}
                  className="text-[11px] font-bold text-[#00A3C4] hover:underline px-2 py-1"
                >
                  Marcar Todas
                </button>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <button
                  type="button"
                  onClick={() => selecionarTodasSecoes(false)}
                  className="text-[11px] font-bold text-rose-600 hover:underline px-2 py-1"
                >
                  Desmarcar
                </button>
              </div>
            </div>

            {/* Checkboxes de Seções do Relatório */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-[#0B384D]/60">
              <span className="font-bold text-slate-600 dark:text-slate-400 text-[11px] mr-1">Seções a imprimir:</span>

              {[
                { key: 'kpis', label: '1. Indicadores (KPIs)' },
                { key: 'orcamentoBase', label: '2. Orçamento Base Analítico' },
                { key: 'contratos', label: '3. Contratos Vigentes' },
                { key: 'medicoes', label: '4. Cronograma & Medições' },
                { key: 'ocorrencias', label: '5. Aditivos & Distratos' },
                { key: 'curvaDesembolso', label: '6. Curva S / Fluxo' },
                { key: 'assinaturas', label: '7. Assinaturas Técnicas' },
              ].map((item) => {
                const ativo = secoes[item.key as keyof typeof secoes];
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggleSecao(item.key as keyof typeof secoes)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      ativo
                        ? 'bg-white dark:bg-[#072B3B] text-[#008EA9] dark:text-[#00C4EB] border-[#00A3C4]/40 shadow-2xs'
                        : 'bg-slate-200/50 dark:bg-[#061e29] text-slate-400 dark:text-slate-500 border-transparent hover:border-slate-300'
                    }`}
                  >
                    {ativo ? (
                      <CheckSquare className="h-3.5 w-3.5 text-[#00A3C4]" />
                    ) : (
                      <Square className="h-3.5 w-3.5 text-slate-400" />
                    )}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. ÁREA DE VISUALIZAÇÃO E IMPRESSÃO (Folha A4) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 dark:bg-slate-950/60 flex justify-center">
          <div
            ref={contentRef}
            className={`bg-white text-slate-900 mx-auto p-6 sm:p-10 shadow-lg border border-slate-200 rounded-xl text-xs font-sans print:shadow-none print:border-none print:m-0 print:p-4 print:max-w-none print:w-full transition-all ${
              orientacao === 'landscape' ? 'w-full max-w-[297mm]' : 'w-full max-w-[210mm]'
            }`}
          >
            {/* CABEÇALHO EXECUTIVO WCC */}
            <div className="border-b-2 border-[#00A3C4] pb-4 mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-black tracking-widest px-2.5 py-0.5 rounded bg-[#072B3B] text-white uppercase">
                    WCC ENGENHARIA &amp; DESENVOLVIMENTO
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">
                    Gestão de Custos, Orçamentos &amp; Contratos
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-[#072B3B] tracking-tight mt-1.5">
                  RELATÓRIO EXECUTIVO CONSOLIDADO
                </h1>
                <p className="text-xs font-bold text-[#008EA9] mt-0.5">
                  Escopo: {obraSelecionadaNome}
                  {filtroCategoria !== 'Todos' && ` • Categoria: ${filtroCategoria}`}
                </p>
              </div>

              <div className="text-right text-[11px] text-slate-500 space-y-0.5">
                <p><strong>Emissão:</strong> {dataAtual} às {horaAtual}</p>
                <p><strong>Itens Orçamento:</strong> {orcamentosFiltradosRelatorio.length} pacotes</p>
                <p><strong>Contratos:</strong> {contratosFiltrados.length} listados</p>
                <p><strong>Medições:</strong> {medicoesFiltradas.length} marcos</p>
              </div>
            </div>

            {/* SEÇÃO 1: PAINEL DE KPIS EXECUTIVOS */}
            {secoes.kpis && (
              <div className="mb-6 page-break-avoid">
                <h2 className="text-xs font-black uppercase tracking-wider text-[#072B3B] mb-2.5 border-l-4 border-[#00A3C4] pl-2">
                  1. Painel de Indicadores Financeiros &amp; Físicos
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Orçamento Base</span>
                    <span className="text-sm font-extrabold text-slate-900 block font-mono mt-0.5">
                      {formatCurrency(kpis.totalOrcado)}
                    </span>
                    <span className="text-[9px] text-slate-500 block">Saldo a contr.: {formatCurrency(kpis.saldoAContratar)}</span>
                  </div>

                  <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Total Contratado</span>
                    <span className="text-sm font-extrabold text-[#008EA9] block font-mono mt-0.5">
                      {formatCurrency(kpis.totalContratado)}
                    </span>
                    <span className="text-[9px] text-slate-500 block">{formatPercent(kpis.percentualContratado)} do orçado</span>
                  </div>

                  <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50">
                    <span className="text-[9px] font-bold text-emerald-800 uppercase block">Total Medido (Físico)</span>
                    <span className="text-sm font-extrabold text-emerald-700 block font-mono mt-0.5">
                      {formatCurrency(kpis.totalMedido)}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-700 block">{formatPercent(kpis.percentualMedido)} contratado</span>
                  </div>

                  <div className="p-2.5 rounded-lg border border-purple-200 bg-purple-50/50">
                    <span className="text-[9px] font-bold text-purple-800 uppercase block">Saldo a Medir</span>
                    <span className="text-sm font-extrabold text-purple-700 block font-mono mt-0.5">
                      {formatCurrency(kpis.saldoAMedir)}
                    </span>
                    <span className="text-[9px] text-purple-600 block">Pago: {formatCurrency(kpis.totalPago)}</span>
                  </div>
                </div>

                {/* Subdivisão Projetos vs Legalização & Ocorrências */}
                <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] p-2 rounded-lg bg-slate-100 border border-slate-200">
                  <div>
                    <span className="text-slate-500 block font-bold">Projetos Técnicos:</span>
                    <span className="font-mono font-bold text-slate-800">{formatCurrency(kpis.totalProjetosContratado)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-bold">Taxas &amp; Legalização:</span>
                    <span className="font-mono font-bold text-purple-700">{formatCurrency(kpis.totalLegalizacaoContratado)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-bold">Termos Aditivos:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {todosAditivos.length} adit. ({formatCurrency(contratosFiltrados.reduce((acc, c) => acc + (c.valor_aditivos || 0), 0))})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-bold">Contratos Distratados:</span>
                    <span className="font-mono font-bold text-rose-700">
                      {contratosDistratados.length} contrato(s)
                    </span>
                  </div>
                </div>

                {/* Alerta de Atraso se houver */}
                {kpis.qtdEmAtraso > 0 && (
                  <div className="mt-2.5 p-2 rounded-lg bg-amber-50 border border-amber-300 text-[10px] text-amber-900 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span><strong>Atenção de Cronograma:</strong> {kpis.qtdEmAtraso} medições com marco previsto no passado ainda não quitadas.</span>
                    </div>
                    <span className="font-mono font-bold text-amber-800">{formatCurrency(kpis.totalEmAtraso)}</span>
                  </div>
                )}
              </div>
            )}

            {/* SEÇÃO 2: QUADRO DE ORÇAMENTO BASE ANALÍTICO */}
            {secoes.orcamentoBase && (
              <div className="mb-6 page-break-avoid">
                <div className="flex items-center justify-between mb-2 border-l-4 border-[#00A3C4] pl-2">
                  <h2 className="text-xs font-black uppercase tracking-wider text-[#072B3B]">
                    2. Quadro Analítico de Orçamento Base ({orcamentosFiltradosRelatorio.length} itens)
                  </h2>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    Previsto: <strong>{formatCurrency(totaisOrcamento.base)}</strong> • Contratado: <strong>{formatCurrency(totaisOrcamento.contratado)}</strong>
                  </span>
                </div>

                {orcamentosFiltradosRelatorio.length === 0 ? (
                  <p className="text-slate-500 italic py-2">Nenhum item de orçamento encontrado para os filtros selecionados.</p>
                ) : (
                  <table className="w-full text-[9px] border-collapse border border-slate-200">
                    <thead className="bg-[#072B3B] text-white">
                      <tr>
                        <th className="p-1.5 text-center">Obra</th>
                        <th className="p-1.5 text-center">Tipo</th>
                        <th className="p-1.5 text-left">Disciplina</th>
                        <th className="p-1.5 text-left">Subdisciplina</th>
                        <th className="p-1.5 text-right">Orçamento Base</th>
                        <th className="p-1.5 text-right">Contratado</th>
                        <th className="p-1.5 text-right">Saldo Contratar</th>
                        <th className="p-1.5 text-center">% Contrat.</th>
                        <th className="p-1.5 text-right">Medido</th>
                        <th className="p-1.5 text-right">Saldo Medição</th>
                        <th className="p-1.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {orcamentosFiltradosRelatorio.map((o) => {
                        const pctContrat = o.orcamento_base > 0 ? (o.valor_contratado / o.orcamento_base) * 100 : 0;
                        return (
                          <tr key={o.id} className="even:bg-slate-50">
                            <td className="p-1 text-center font-bold text-[#008EA9]">{o.obra}</td>
                            <td className="p-1 text-center font-semibold">
                              <span className={`px-1 py-0.5 rounded text-[8px] ${o.categoria === 'Legalização' ? 'text-purple-700 bg-purple-50' : 'text-cyan-800 bg-cyan-50'}`}>
                                {o.categoria || 'Projeto'}
                              </span>
                            </td>
                            <td className="p-1 font-semibold text-slate-900">{o.disciplina}</td>
                            <td className="p-1 text-slate-600">{o.subdisciplina}</td>
                            <td className="p-1 text-right font-mono font-bold text-slate-800">{formatCurrency(o.orcamento_base)}</td>
                            <td className="p-1 text-right font-mono text-[#008EA9]">{formatCurrency(o.valor_contratado)}</td>
                            <td className={`p-1 text-right font-mono ${o.saldo_a_contratar < 0 ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                              {formatCurrency(o.saldo_a_contratar)}
                            </td>
                            <td className="p-1 text-center font-mono">
                              {formatPercent(Math.min(1, pctContrat / 100))}
                            </td>
                            <td className="p-1 text-right font-mono text-emerald-700">{formatCurrency(o.valor_medido)}</td>
                            <td className="p-1 text-right font-mono text-purple-700">{formatCurrency(o.saldo_medicao)}</td>
                            <td className="p-1 text-center">
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold border border-slate-300 bg-slate-100 text-slate-700">
                                {o.status || 'A contratar'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                      <tr>
                        <td colSpan={4} className="p-1.5 uppercase text-left">Totais Orçamento Base:</td>
                        <td className="p-1.5 text-right font-mono text-slate-900">{formatCurrency(totaisOrcamento.base)}</td>
                        <td className="p-1.5 text-right font-mono text-[#008EA9]">{formatCurrency(totaisOrcamento.contratado)}</td>
                        <td className={`p-1.5 text-right font-mono ${totaisOrcamento.saldoContratar < 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                          {formatCurrency(totaisOrcamento.saldoContratar)}
                        </td>
                        <td className="p-1.5 text-center font-mono text-[#00A3C4]">
                          {formatPercent(totaisOrcamento.base > 0 ? totaisOrcamento.contratado / totaisOrcamento.base : 0)}
                        </td>
                        <td className="p-1.5 text-right font-mono text-emerald-700">{formatCurrency(totaisOrcamento.medido)}</td>
                        <td className="p-1.5 text-right font-mono text-purple-700">{formatCurrency(totaisOrcamento.saldoMedicao)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            )}

            {/* SEÇÃO 3: QUADRO RESUMO DE CONTRATOS */}
            {secoes.contratos && (
              <div className="mb-6 page-break-avoid">
                <h2 className="text-xs font-black uppercase tracking-wider text-[#072B3B] mb-2 border-l-4 border-[#00A3C4] pl-2">
                  3. Relação de Contratos Vigentes ({contratosFiltrados.length})
                </h2>

                {contratosFiltrados.length === 0 ? (
                  <p className="text-slate-500 italic py-2">Nenhum contrato cadastrado para este escopo.</p>
                ) : (
                  <table className="w-full text-[9px] border-collapse border border-slate-200">
                    <thead className="bg-[#072B3B] text-white">
                      <tr>
                        <th className="p-1.5 text-left">ID</th>
                        <th className="p-1.5 text-center">Status</th>
                        <th className="p-1.5 text-left">Empresa</th>
                        <th className="p-1.5 text-center">Obra</th>
                        <th className="p-1.5 text-left">Disciplina</th>
                        <th className="p-1.5 text-right">V. Original</th>
                        <th className="p-1.5 text-right">Aditivos</th>
                        <th className="p-1.5 text-right">V. Vigente</th>
                        <th className="p-1.5 text-right">Medido</th>
                        <th className="p-1.5 text-right">Saldo</th>
                        <th className="p-1.5 text-center">% Medido</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {contratosFiltrados.map((c) => (
                        <tr key={c.id} className={c.status === 'Distratado' ? 'bg-rose-50/50' : 'even:bg-slate-50'}>
                          <td className="p-1 font-mono font-bold text-slate-700">{c.id}</td>
                          <td className="p-1 text-center font-bold">
                            <span className={c.status === 'Distratado' ? 'text-rose-600' : 'text-emerald-700'}>
                              {c.status || 'Ativo'}
                            </span>
                          </td>
                          <td className="p-1 font-semibold text-slate-900">{c.empresa}</td>
                          <td className="p-1 text-center font-bold text-[#008EA9]">{c.obra}</td>
                          <td className="p-1 text-slate-600">{c.subdisciplina || c.disciplina}</td>
                          <td className="p-1 text-right font-mono">{formatCurrency(c.valor_original ?? c.valor_contrato)}</td>
                          <td className="p-1 text-right font-mono text-emerald-700">
                            {c.valor_aditivos ? formatCurrency(c.valor_aditivos) : '-'}
                          </td>
                          <td className="p-1 text-right font-mono font-bold text-slate-900">{formatCurrency(c.valor_contrato)}</td>
                          <td className="p-1 text-right font-mono text-emerald-700">{formatCurrency(c.valor_medido)}</td>
                          <td className="p-1 text-right font-mono text-purple-700">
                            {c.status === 'Distratado' ? <span className="line-through text-rose-500">R$ 0,00</span> : formatCurrency(c.saldo_a_medir)}
                          </td>
                          <td className="p-1 text-center font-mono font-bold">{formatPercent(c.percentual_medido)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                      <tr>
                        <td colSpan={7} className="p-1.5 uppercase text-left">Totais Contratos:</td>
                        <td className="p-1.5 text-right font-mono text-slate-900">{formatCurrency(kpis.totalContratado)}</td>
                        <td className="p-1.5 text-right font-mono text-emerald-700">{formatCurrency(kpis.totalMedido)}</td>
                        <td className="p-1.5 text-right font-mono text-purple-700">{formatCurrency(kpis.saldoAMedir)}</td>
                        <td className="p-1.5 text-center font-mono text-[#00A3C4]">{formatPercent(kpis.percentualMedido)}</td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            )}

            {/* SEÇÃO 4: CRONOGRAMA & MEDIÇÕES */}
            {secoes.medicoes && (
              <div className="mb-6 page-break-avoid">
                <div className="flex items-center justify-between mb-2 border-l-4 border-[#00A3C4] pl-2">
                  <h2 className="text-xs font-black uppercase tracking-wider text-[#072B3B]">
                    4. Cronograma &amp; Registro de Medições ({medicoesFiltradas.length} marcos)
                  </h2>
                  {medicoesAtrasadas.length > 0 && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                      ⚠️ {medicoesAtrasadas.length} marco(s) em atraso ({formatCurrency(medicoesAtrasadas.reduce((acc, m) => acc + m.valor_medicao, 0))})
                    </span>
                  )}
                </div>

                {medicoesFiltradas.length === 0 ? (
                  <p className="text-slate-500 italic py-2">Nenhuma medição cadastrada para este escopo.</p>
                ) : (
                  <table className="w-full text-[9px] border-collapse border border-slate-200">
                    <thead className="bg-[#072B3B] text-white">
                      <tr>
                        <th className="p-1.5 text-left">ID</th>
                        <th className="p-1.5 text-center">Status</th>
                        <th className="p-1.5 text-left">Fornecedor / Contrato</th>
                        <th className="p-1.5 text-center">Obra</th>
                        <th className="p-1.5 text-left">Etapa / Marco</th>
                        <th className="p-1.5 text-right">Valor Medição</th>
                        <th className="p-1.5 text-center">Data Prevista</th>
                        <th className="p-1.5 text-center">Data Medição</th>
                        <th className="p-1.5 text-center">Mês Comp.</th>
                        <th className="p-1.5 text-center">NF</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {medicoesFiltradas.map((m) => {
                        const isAtraso = isMedicaoEmAtraso(m);
                        return (
                          <tr key={m.id} className={isAtraso ? 'bg-amber-50/70' : 'even:bg-slate-50'}>
                            <td className="p-1 font-mono font-bold text-slate-700">{m.id}</td>
                            <td className="p-1 text-center font-bold">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] ${
                                m.status === 'Pago' ? 'text-emerald-700 bg-emerald-100/60 font-bold' :
                                m.status === 'A Pagar' ? 'text-indigo-700 bg-indigo-100/60 font-bold' :
                                m.status === 'Medido' ? 'text-cyan-700 bg-cyan-100/60 font-bold' :
                                isAtraso ? 'text-amber-800 bg-amber-200/80 font-black' :
                                'text-slate-700 bg-slate-100'
                              }`}>
                                {isAtraso ? 'EM ATRASO' : m.status}
                              </span>
                            </td>
                            <td className="p-1 font-medium text-slate-900">{m.empresa} <span className="font-mono text-slate-400">({m.contrato_id})</span></td>
                            <td className="p-1 text-center font-bold text-[#008EA9]">{m.obra}</td>
                            <td className="p-1 text-slate-700">{m.etapa}</td>
                            <td className="p-1 text-right font-mono font-bold text-slate-900">{formatCurrency(m.valor_medicao)}</td>
                            <td className="p-1 text-center font-mono">{formatDateBR(m.data_prevista)}</td>
                            <td className="p-1 text-center font-mono">{formatDateBR(m.data_medicao)}</td>
                            <td className="p-1 text-center font-mono font-bold text-slate-600">{m.mes_competencia || '-'}</td>
                            <td className="p-1 text-center font-mono text-slate-500">{m.nf || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                      <tr>
                        <td colSpan={5} className="p-1.5 uppercase text-left">Total de Medições Listadas:</td>
                        <td className="p-1.5 text-right font-mono text-slate-900">
                          {formatCurrency(medicoesFiltradas.reduce((acc, m) => acc + m.valor_medicao, 0))}
                        </td>
                        <td colSpan={4}></td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            )}

            {/* SEÇÃO 5: QUADRO DE OCORRÊNCIAS (ADITIVOS E DISTRATOS) */}
            {secoes.ocorrencias && (todosAditivos.length > 0 || contratosDistratados.length > 0) && (
              <div className="mb-6 page-break-avoid">
                <h2 className="text-xs font-black uppercase tracking-wider text-[#072B3B] mb-2 border-l-4 border-[#00A3C4] pl-2">
                  5. Ocorrências Contratuais (Aditivos &amp; Distratos)
                </h2>

                <div className="space-y-3">
                  {todosAditivos.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-700 block mb-1">Termos Aditivos Registrados:</span>
                      <table className="w-full text-[9px] border-collapse border border-slate-200">
                        <thead className="bg-slate-100 text-slate-700">
                          <tr>
                            <th className="p-1 text-left">Contrato</th>
                            <th className="p-1 text-left">Fornecedor</th>
                            <th className="p-1 text-center">Nº</th>
                            <th className="p-1 text-center">Data</th>
                            <th className="p-1 text-center">Tipo</th>
                            <th className="p-1 text-right">Valor</th>
                            <th className="p-1 text-left">Justificativa / Escopo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {todosAditivos.map((a) => (
                            <tr key={a.id}>
                              <td className="p-1 font-mono font-bold">{a.contrato_id}</td>
                              <td className="p-1 font-medium">{a.empresa}</td>
                              <td className="p-1 text-center font-bold">#{a.numero}</td>
                              <td className="p-1 text-center">{formatDateBR(a.data)}</td>
                              <td className="p-1 text-center">{a.tipo}</td>
                              <td className={`p-1 text-right font-mono font-bold ${a.valor >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                                {a.valor >= 0 ? `+${formatCurrency(a.valor)}` : formatCurrency(a.valor)}
                              </td>
                              <td className="p-1 text-slate-600">{a.descricao}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {contratosDistratados.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-rose-700 block mb-1">Contratos Distratados / Rescindidos:</span>
                      <table className="w-full text-[9px] border-collapse border border-rose-200 bg-rose-50/30">
                        <thead className="bg-rose-100/70 text-rose-900">
                          <tr>
                            <th className="p-1 text-left">Contrato</th>
                            <th className="p-1 text-left">Fornecedor</th>
                            <th className="p-1 text-center">Data Distrato</th>
                            <th className="p-1 text-left">Motivo Rescisório</th>
                            <th className="p-1 text-right">Acerto Final</th>
                            <th className="p-1 text-left">Observações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-rose-100">
                          {contratosDistratados.map((c) => (
                            <tr key={c.id}>
                              <td className="p-1 font-mono font-bold text-rose-800">{c.id}</td>
                              <td className="p-1 font-semibold">{c.empresa}</td>
                              <td className="p-1 text-center">{formatDateBR(c.distrato?.data)}</td>
                              <td className="p-1 text-slate-700">{c.distrato?.motivo}</td>
                              <td className="p-1 text-right font-mono font-bold">{formatCurrency(c.distrato?.valor_acerto || 0)}</td>
                              <td className="p-1 text-slate-500">{c.distrato?.observacoes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SEÇÃO 6: CURVA DE DESEMBOLSO MÊS A MÊS */}
            {secoes.curvaDesembolso && curvaPontos.length > 0 && (
              <div className="mb-6 page-break-avoid">
                <h2 className="text-xs font-black uppercase tracking-wider text-[#072B3B] mb-2 border-l-4 border-[#00A3C4] pl-2">
                  6. Cronograma &amp; Curva de Desembolso Financeiro S (Competências)
                </h2>

                <table className="w-full text-[9px] border-collapse border border-slate-200">
                  <thead className="bg-slate-100 text-slate-700 font-bold">
                    <tr>
                      <th className="p-1 text-center">Mês</th>
                      <th className="p-1 text-right">Previsto Mensal</th>
                      <th className="p-1 text-right">Realizado Mensal</th>
                      <th className="p-1 text-right">Total Mês</th>
                      <th className="p-1 text-right">Acumulado Previsto</th>
                      <th className="p-1 text-right">Acumulado Realizado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {curvaPontos.slice(0, 16).map((p) => (
                      <tr key={p.mes} className="even:bg-slate-50">
                        <td className="p-1 text-center font-bold text-slate-700">{p.mesFormatado}</td>
                        <td className="p-1 text-right text-slate-600">{formatCurrency(p.previsto)}</td>
                        <td className="p-1 text-right font-bold text-[#008EA9]">{formatCurrency(p.realizado)}</td>
                        <td className="p-1 text-right text-slate-700">{formatCurrency(p.total)}</td>
                        <td className="p-1 text-right text-slate-500">{formatCurrency(p.acumuladoPrevisto)}</td>
                        <td className="p-1 text-right font-bold text-emerald-700">{formatCurrency(p.acumuladoRealizado)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* SEÇÃO 7: ASSINATURAS E RESPONSABILIDADES */}
            {secoes.assinaturas && (
              <div className="pt-8 mt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-600 page-break-avoid">
                <div>
                  <div className="border-t border-slate-400 w-3/4 mx-auto pt-1 font-bold text-slate-900">
                    Responsável Técnico / Orçamentista
                  </div>
                  <span>WCC Engenharia &amp; Orçamentos</span>
                </div>
                <div>
                  <div className="border-t border-slate-400 w-3/4 mx-auto pt-1 font-bold text-slate-900">
                    Gestão de Obras / Diretoria de Contratos
                  </div>
                  <span>Aprovação Executiva</span>
                </div>
              </div>
            )}

            {/* RODAPÉ DO DOCUMENTO */}
            <div className="mt-8 pt-2 border-t border-slate-100 flex items-center justify-between text-[8px] text-slate-400">
              <span>WCC Engenharia • Sistema Integrado de Gestão e Apontamentos</span>
              <span>Documento emitido eletronicamente em {dataAtual} às {horaAtual}</span>
            </div>
          </div>
        </div>

        {/* 4. FOOTER DO MODAL */}
        <div className="p-3 border-t border-slate-200 dark:border-[#0B384D] flex items-center justify-between bg-slate-50 dark:bg-[#072432]">
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
            Dica: No diálogo de impressão do navegador, selecione a opção <b>&quot;Salvar como PDF&quot;</b> e certifique-se de que <b>&quot;Gráficos de segundo plano&quot;</b> esteja marcado.
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs h-9 rounded-xl ml-auto"
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
