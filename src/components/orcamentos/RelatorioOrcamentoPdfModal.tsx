"use client";

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  ItemOrcamento,
  Contrato,
  Medicao,
  CurvaDesembolsoPonto,
  Obra,
  STATUS_MEDICAO_COLORS,
} from '@/types/orcamento';
import {
  formatCurrency,
  formatCurrencyShort,
  formatPercent,
  formatDateBR,
  calculateKpis,
  getObraLabel,
  isMedicaoEmAtraso,
  calculateCurvaDesembolso,
} from '@/lib/orcamento-utils';
import { exportMultiSheetExcel } from '@/lib/excel-export';
import { Button } from '@/components/ui/button';
import {
  X,
  Printer,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Layers,
  CreditCard,
  Calendar,
  Building,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

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

const PIE_COLORS: Record<string, string> = {
  'Pago': '#10b981',      // emerald
  'A Pagar': '#6366f1',   // indigo
  'Medido': '#00a3c4',    // cyan WCC
  'A Medir': '#f59e0b',   // amber
  'Cancelado': '#94a3b8', // slate
};

export function RelatorioOrcamentoPdfModal({
  isOpen,
  onClose,
  orcamentos,
  contratos,
  medicoes,
  curvaPontos: curvaPontosProp,
  obras,
  filtroObra: filtroObraProp,
  filtroFornecedor,
}: RelatorioOrcamentoPdfModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Filtro de Obra Local (iniciado pelo filtro recebido, mas modificável no painel do relatório)
  const [localFiltroObra, setLocalFiltroObra] = useState<string>(filtroObraProp || '');

  useEffect(() => {
    setLocalFiltroObra(filtroObraProp || '');
  }, [filtroObraProp, isOpen]);

  // Estados de Personalização do Relatório (Exclusivamente Retrato / Vertical A4)
  const [filtroCategoria, setFiltroCategoria] = useState<'Todos' | 'Projeto' | 'Legalização'>('Todos');
  const [showConfig, setShowConfig] = useState<boolean>(true);

  // Seções habilitadas no PDF Executivo
  const [secoes, setSecoes] = useState({
    kpis: true,
    curvaGrafico: true,
    curvaDesembolso: true,
    disciplinasStatus: true,
    ocorrencias: true,
  });

  const toggleSecao = (key: keyof typeof secoes) => {
    setSecoes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selecionarTodasSecoes = (valor: boolean) => {
    setSecoes({
      kpis: valor,
      curvaGrafico: valor,
      curvaDesembolso: valor,
      disciplinasStatus: valor,
      ocorrencias: valor,
    });
  };

  // Categoria ativa para cálculos
  const catParam = filtroCategoria === 'Todos' ? null : filtroCategoria;

  // Curva S de Desembolso Financeiro (criterio = 'desembolso', focado em fluxo de caixa / data de pagamento)
  const curvaPontosRelatorio = useMemo(() => {
    return calculateCurvaDesembolso(
      medicoes,
      localFiltroObra || null,
      filtroFornecedor || null,
      contratos,
      catParam,
      'desembolso'
    );
  }, [medicoes, localFiltroObra, filtroFornecedor, contratos, catParam]);

  // KPIs calculados considerando o filtro de obra local e categoria
  const kpis = useMemo(() => {
    return calculateKpis(
      orcamentos,
      contratos,
      medicoes,
      localFiltroObra || null,
      catParam
    );
  }, [orcamentos, contratos, medicoes, localFiltroObra, catParam]);

  const dataAtual = new Date().toLocaleDateString('pt-BR');
  const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const obraSelecionadaNome = localFiltroObra ? getObraLabel(localFiltroObra, obras) : 'TODAS AS OBRAS E EMPREENDIMENTOS';

  // 1. Contratos Filtrados (para resumo de ocorrências)
  const contratosFiltrados = useMemo(() => {
    return contratos.filter((c) => {
      if (localFiltroObra && c.obra !== localFiltroObra) return false;
      if (filtroFornecedor && c.empresa !== filtroFornecedor) return false;
      if (filtroCategoria !== 'Todos' && c.categoria !== filtroCategoria) return false;
      return true;
    });
  }, [contratos, localFiltroObra, filtroFornecedor, filtroCategoria]);

  const todosAditivos = useMemo(() => {
    return contratosFiltrados.flatMap((c) =>
      (c.aditivos || []).map((a) => ({ ...a, empresa: c.empresa, obra: c.obra }))
    );
  }, [contratosFiltrados]);

  const contratosDistratados = useMemo(() => {
    return contratosFiltrados.filter((c) => c.status === 'Distratado');
  }, [contratosFiltrados]);

  // 2. Distribuição por Disciplina (Orçamento Base vs Contratado)
  const dadosDisciplinas = useMemo(() => {
    const map: Record<string, { base: number; contratado: number; medido: number }> = {};
    const filteredOrc = orcamentos.filter((o) => {
      if (localFiltroObra && o.obra !== localFiltroObra) return false;
      if (filtroCategoria !== 'Todos' && o.categoria !== filtroCategoria) return false;
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
  }, [orcamentos, localFiltroObra, filtroCategoria]);

  // 3. Distribuição por Status das Medições
  const dadosStatusMedicoes = useMemo(() => {
    const catPorContrato: Record<string, string> = {};
    contratos.forEach((c) => {
      catPorContrato[c.id] = c.categoria || 'Projeto';
    });

    const filteredMed = medicoes.filter((m) => {
      if (localFiltroObra && m.obra !== localFiltroObra) return false;
      if (filtroFornecedor && m.empresa !== filtroFornecedor) return false;
      if (filtroCategoria !== 'Todos' && catPorContrato[m.contrato_id] && catPorContrato[m.contrato_id] !== filtroCategoria) return false;
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
  }, [medicoes, contratos, localFiltroObra, filtroFornecedor, filtroCategoria]);

  // 4. Totais da Curva S com foco nos próximos meses
  const totalPagoCurva = useMemo(() => {
    return curvaPontosRelatorio.reduce((acc, p) => acc + (p.pago || 0), 0);
  }, [curvaPontosRelatorio]);

  const totalAPagarCurva = useMemo(() => {
    return curvaPontosRelatorio.reduce((acc, p) => acc + (p.aPagar || 0), 0);
  }, [curvaPontosRelatorio]);

  const totalAMedirCurva = useMemo(() => {
    return curvaPontosRelatorio.reduce((acc, p) => acc + (p.aMedir || 0), 0);
  }, [curvaPontosRelatorio]);

  const totalRealizadoCurva = totalPagoCurva;
  const totalPrevistoFuturo = useMemo(() => {
    return totalAPagarCurva + totalAMedirCurva;
  }, [totalAPagarCurva, totalAMedirCurva]);

  const totalMedicoesValor = useMemo(() => {
    return dadosStatusMedicoes.reduce((acc, d) => acc + d.value, 0);
  }, [dadosStatusMedicoes]);

  // Disparo da impressão com margem física exata de 2,0 cm (20mm) garantida em cada folha A4
  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Relatorio_Executivo_WCC_${localFiltroObra || 'Consolidado'}_${new Date().toISOString().slice(0, 10)}`,
    pageStyle: `
      @page {
        size: A4 portrait;
        margin: 0 !important;
      }
      @media print {
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          color: #0f172a !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
        }
        .print-report-root {
          gap: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          width: 210mm !important;
          background: transparent !important;
        }
        .folha-a4 {
          width: 210mm !important;
          min-width: 210mm !important;
          max-width: 210mm !important;
          min-height: 297mm !important;
          padding: 20mm 20mm 20mm 20mm !important;
          margin: 0 auto !important;
          border: none !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          box-sizing: border-box !important;
          page-break-after: always !important;
          break-after: page !important;
          background: #ffffff !important;
        }
        .folha-a4:last-child {
          page-break-after: auto !important;
          break-after: auto !important;
        }
        .page-break-avoid {
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
      curvaPontos: curvaPontosRelatorio,
      obras,
      filtroObra: localFiltroObra,
      filtroCategoria: filtroCategoria,
      nomeArquivo: `Relatorio_Consolidado_Orcamentos_WCC_${localFiltroObra || 'Geral'}.xlsx`,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in-0">
      <div className="bg-white dark:bg-[#072B3B] rounded-2xl border border-slate-200 dark:border-[#0B384D] max-w-6xl w-full max-h-[96vh] flex flex-col shadow-2xl overflow-hidden">
        {/* 1. BARRA SUPERIOR DE AÇÕES (Não impressa) */}
        <div className="p-4 border-b border-slate-200 dark:border-[#0B384D] flex items-center justify-between gap-4 bg-slate-50 dark:bg-[#072432]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00A3C4]/15 text-[#00A3C4] dark:text-[#00C4EB]">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Relatório Executivo PDF (Cards &amp; Gráficos)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Resumo visual executivo para diretoria. As tabelas analíticas completas ficam no Excel.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfig(!showConfig)}
              className="text-xs font-bold gap-1.5 h-9 rounded-xl border-slate-200 dark:border-[#0B384D]"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#00A3C4]" />
              Personalizar
              {showConfig ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>

            <Button
              size="sm"
              onClick={handleExportarExcelConsolidado}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 rounded-xl gap-1.5 shadow-xs"
            >
              <FileSpreadsheet className="h-4 w-4" /> Excel (.xlsx)
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
              {/* Filtro de Obra */}
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 text-xs flex items-center gap-1">
                  <Building className="h-3.5 w-3.5 text-[#00A3C4]" /> Obra:
                </span>
                <select
                  value={localFiltroObra}
                  onChange={(e) => setLocalFiltroObra(e.target.value)}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#072B3B] border border-slate-200 dark:border-[#0B384D] text-slate-800 dark:text-slate-100 h-9 min-w-[170px] max-w-[260px] focus:outline-none focus:ring-2 focus:ring-[#00A3C4] truncate shadow-2xs"
                >
                  <option value="">🏢 Todas as Obras ({obras.length})</option>
                  {obras.map((o) => (
                    <option key={o.id} value={o.codigo}>
                      {o.codigo} - {o.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Informação de Formato Fixo */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200/60 dark:bg-[#072B3B] text-[11px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#0B384D] h-9">
                <span className="inline-block w-2 h-2 rounded-full bg-[#00A3C4]" />
                <span>Formato: A4 Retrato (Vertical) • Margens: 2,0 cm</span>
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
                { key: 'curvaGrafico', label: '2. Curva S (Gráfico Desembolso)' },
                { key: 'disciplinasStatus', label: '3. Disciplinas & Status (Gráficos)' },
                { key: 'curvaDesembolso', label: '4. Cronograma Detalhado (Tabela Curva S - Pág. 2)' },
                { key: 'ocorrencias', label: '5. Ocorrências (Aditivos & Distratos)' },
              ].map((item) => {
                const ativo = secoes[item.key as keyof typeof secoes];
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggleSecao(item.key as keyof typeof secoes)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                      ativo
                        ? 'bg-white dark:bg-[#072B3B] text-slate-900 dark:text-white border-[#00A3C4]'
                        : 'bg-transparent text-slate-400 border-dashed border-slate-300 dark:border-slate-700'
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

        {/* 3. ÁREA DE VISUALIZAÇÃO E IMPRESSÃO (Folhas A4 Verticais com Margens Físicas de 2,0 cm) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200 dark:bg-slate-950/80 flex justify-center">
          <div
            ref={contentRef}
            className="print-report-root flex flex-col items-center gap-8 w-full max-w-[210mm]"
          >
            {/* ============================================================== */}
            {/* FOLHA 1 (PÁGINA 1): CABEÇALHO, KPIS E TODOS OS GRÁFICOS       */}
            {/* ============================================================== */}
            <div className="folha-a4 bg-white text-slate-900 shadow-2xl border border-slate-200 rounded-lg text-xs font-sans w-full max-w-[210mm] min-h-[297mm] p-[20mm] flex flex-col justify-between box-border">
              <div className="space-y-3.5 flex-1">
                {/* CABEÇALHO EXECUTIVO WCC */}
                <div className="border-b-2 border-[#00A3C4] pb-3 mb-2 page-break-avoid">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-black tracking-widest px-2.5 py-0.5 rounded bg-[#072B3B] text-white uppercase">
                          WCC ENGENHARIA &amp; DESENVOLVIMENTO
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          Gestão de Custos &amp; Cronograma
                        </span>
                      </div>
                      <h1 className="text-xl font-black text-[#072B3B] tracking-tight">
                        RELATÓRIO EXECUTIVO DE CUSTOS &amp; DESEMBOLSO
                      </h1>
                      <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#00A3C4]/10 text-[#008EA9] font-bold border border-[#00A3C4]/30">
                          <Building className="h-3.5 w-3.5" />
                          {obraSelecionadaNome}
                        </span>
                        {filtroCategoria !== 'Todos' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-bold border border-purple-200">
                            Categoria: {filtroCategoria}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right text-[10px] text-slate-500 shrink-0">
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1 text-right">
                        <p className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Emissão do Relatório</p>
                        <p className="font-mono font-bold text-slate-800 text-xs">{dataAtual} às {horaAtual}</p>
                        <div className="pt-1 border-t border-slate-200 flex items-center justify-end gap-2 text-[9px]">
                          <span><strong>{contratosFiltrados.length}</strong> contratos</span>
                          <span>•</span>
                          <span className={kpis.qtdEmAtraso > 0 ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold'}>
                            {kpis.qtdEmAtraso > 0 ? `${kpis.qtdEmAtraso} pendência(s)` : 'Cronograma em dia'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SEÇÃO 1: PAINEL DE KPIS EXECUTIVOS */}
                {secoes.kpis && (
                  <div className="space-y-2.5 page-break-avoid">
                    <div className="flex items-center justify-between border-l-4 border-[#00A3C4] pl-2.5 py-0.5">
                      <h2 className="text-xs font-black uppercase tracking-wider text-[#072B3B]">
                        1. Indicadores Financeiros &amp; Físicos
                      </h2>
                      <span className="text-[10px] text-slate-500">
                        Critério da curva: <strong>Desembolso Financeiro (Caixa)</strong>
                      </span>
                    </div>

                    {/* 4 Cards Principais */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/80 flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Orçamento Base</span>
                          <span className="text-base font-extrabold text-slate-900 block font-mono mt-1">
                            {formatCurrency(kpis.totalOrcado)}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-500 block mt-1.5 pt-1.5 border-t border-slate-200/70">
                          Saldo a contr.: <strong className="font-mono">{formatCurrency(kpis.saldoAContratar)}</strong>
                        </span>
                      </div>

                      <div className="p-3 rounded-xl border border-sky-200 bg-sky-50/40 flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] font-bold text-sky-800 uppercase tracking-wider block">Total Contratado</span>
                          <span className="text-base font-extrabold text-[#008EA9] block font-mono mt-1">
                            {formatCurrency(kpis.totalContratado)}
                          </span>
                        </div>
                        <span className="text-[9px] text-sky-700 block mt-1.5 pt-1.5 border-t border-sky-200/70">
                          <strong>{formatPercent(kpis.percentualContratado)}</strong> do orçado
                        </span>
                      </div>

                      <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider block">Total Medido (Físico)</span>
                          <span className="text-base font-extrabold text-emerald-700 block font-mono mt-1">
                            {formatCurrency(kpis.totalMedido)}
                          </span>
                        </div>
                        <span className="text-[9px] text-emerald-700 block mt-1.5 pt-1.5 border-t border-emerald-200/70">
                          <strong>{formatPercent(kpis.percentualMedido)}</strong> contratado
                        </span>
                      </div>

                      <div className="p-3 rounded-xl border border-purple-200 bg-purple-50/40 flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] font-bold text-purple-800 uppercase tracking-wider block">Total Pago (Caixa)</span>
                          <span className="text-base font-extrabold text-purple-700 block font-mono mt-1">
                            {formatCurrency(kpis.totalPago)}
                          </span>
                        </div>
                        <span className="text-[9px] text-purple-700 block mt-1.5 pt-1.5 border-t border-purple-200/70">
                          Saldo a medir: <strong className="font-mono">{formatCurrency(kpis.saldoAMedir)}</strong>
                          {kpis.saldoSemCronograma && kpis.saldoSemCronograma > 0 ? (
                            <span className="text-[8px] text-slate-500 block">
                              (Prog: {formatCurrencyShort(kpis.totalPrevistoAMedir)} • Sem cronog.: {formatCurrencyShort(kpis.saldoSemCronograma)})
                            </span>
                          ) : null}
                        </span>
                      </div>
                    </div>

                    {/* Sub-painel: Projetos, Legalização, Aditivos e Distratos */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px]">
                      <div>
                        <span className="text-slate-500 block font-semibold text-[9px] uppercase">Projetos Técnicos:</span>
                        <span className="font-mono font-bold text-slate-800">{formatCurrency(kpis.totalProjetosContratado)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block font-semibold text-[9px] uppercase">Taxas &amp; Legalização:</span>
                        <span className="font-mono font-bold text-purple-700">{formatCurrency(kpis.totalLegalizacaoContratado)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block font-semibold text-[9px] uppercase">Termos Aditivos:</span>
                        <span className="font-mono font-bold text-emerald-700">
                          {todosAditivos.length} adit. (+{formatCurrency(contratosFiltrados.reduce((acc, c) => acc + (c.valor_aditivos || 0), 0))})
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block font-semibold text-[9px] uppercase">Contratos Distratados:</span>
                        <span className="font-mono font-bold text-rose-700">
                          {contratosDistratados.length} contrato(s)
                        </span>
                      </div>
                    </div>

                    {/* Alerta de Atraso se houver */}
                    {kpis.qtdEmAtraso > 0 && (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-[10px] text-amber-900 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                          <span>
                            <strong>Atenção de Cronograma:</strong> {kpis.qtdEmAtraso} medições com marco previsto no passado ainda não quitadas ({formatCurrency(kpis.totalEmAtraso)}).
                          </span>
                        </div>
                        <span className="font-mono font-bold text-amber-800 shrink-0">
                          {kpis.qtdAMedirAtrasado} a medir • {kpis.qtdMedidoNaoPago} a quitar
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* SEÇÃO 2: GRÁFICO DA CURVA S (DESEMBOLSO FINANCEIRO) */}
                {secoes.curvaGrafico && (
                  <div className="space-y-2 page-break-avoid">
                    <div className="flex items-center justify-between border-l-4 border-[#00A3C4] pl-2.5 py-0.5">
                      <h2 className="text-xs font-black uppercase tracking-wider text-[#072B3B] flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-[#00A3C4]" />
                        2. Curva S de Desembolso Financeiro (Previsto x Realizado)
                      </h2>
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="text-slate-500">
                          Realizado (Pago): <strong className="text-emerald-700 font-mono">{formatCurrency(totalRealizadoCurva)}</strong>
                        </span>
                        <span className="text-slate-500">
                          A Pagar (Com NF): <strong className="text-indigo-600 font-mono">{formatCurrency(totalAPagarCurva)}</strong>
                        </span>
                        <span className="text-slate-500">
                          A Medir (Sem NF): <strong className="text-amber-600 font-mono">{formatCurrency(totalAMedirCurva)}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 bg-white">
                      <div className="h-44 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart
                            data={curvaPontosRelatorio}
                            margin={{ top: 8, right: 15, bottom: 18, left: 10 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                            <XAxis
                              dataKey="mesFormatado"
                              tick={{ fontSize: 8.5, fill: '#64748b' }}
                              interval={0}
                              angle={-20}
                              textAnchor="end"
                              height={26}
                            />
                            <YAxis
                              yAxisId="left"
                              tickFormatter={formatCurrencyShort}
                              tick={{ fontSize: 8.5, fill: '#64748b' }}
                            />
                            <YAxis
                              yAxisId="right"
                              orientation="right"
                              tickFormatter={formatCurrencyShort}
                              tick={{ fontSize: 8.5, fill: '#64748b' }}
                            />
                            <Tooltip
                              formatter={(value: any, name: any) => [formatCurrency(Number(value) || 0), name]}
                              contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                            />
                            <Legend wrapperStyle={{ fontSize: 9.5, paddingTop: 2 }} />
                            <Bar
                              yAxisId="left"
                              dataKey="pago"
                              name="Desembolso Realizado (Pago)"
                              fill="#10B981"
                              isAnimationActive={false}
                              barSize={11}
                              radius={[3, 3, 0, 0]}
                            />
                            <Bar
                              yAxisId="left"
                              dataKey="aPagar"
                              name="Comprometido a Pagar (Com NF)"
                              fill="#6366F1"
                              isAnimationActive={false}
                              barSize={11}
                              radius={[3, 3, 0, 0]}
                            />
                            <Bar
                              yAxisId="left"
                              dataKey="aMedir"
                              name="Previsto a Medir (Sem NF)"
                              fill="#F59E0B"
                              isAnimationActive={false}
                              barSize={11}
                              radius={[3, 3, 0, 0]}
                            />
                            <Line
                              yAxisId="right"
                              type="monotone"
                              dataKey="acumuladoTotal"
                              name="Curva S Acumulada Total"
                              stroke="#0284C7"
                              strokeWidth={2.5}
                              dot={{ r: 2.5, fill: '#0284C7' }}
                              isAnimationActive={false}
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {/* SEÇÃO 3: DISTRIBUIÇÃO POR DISCIPLINA & STATUS DAS MEDIÇÕES */}
                {secoes.disciplinasStatus && (
                  <div className="space-y-2 page-break-avoid">
                    <div className="flex items-center justify-between border-l-4 border-[#00A3C4] pl-2.5 py-0.5">
                      <h2 className="text-xs font-black uppercase tracking-wider text-[#072B3B] flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-[#00A3C4]" />
                        3. Distribuição Setorial &amp; Status das Medições
                      </h2>
                      <span className="text-[10px] text-slate-500">
                        Visão setorial e liquidação financeira detalhada por status
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Gráfico A: Orçamento vs Contratado por Disciplina */}
                      <div className="p-3 rounded-xl border border-slate-200 bg-white flex flex-col justify-between">
                        <h3 className="text-[10.5px] font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                          <Layers className="h-3 w-3 text-[#00A3C4]" />
                          Orçamento Base vs Contratado por Disciplina
                        </h3>
                        <div className="h-32 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={dadosDisciplinas}
                              layout="vertical"
                              margin={{ top: 2, right: 15, bottom: 2, left: 60 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" opacity={0.15} horizontal={false} />
                              <XAxis type="number" tickFormatter={formatCurrencyShort} tick={{ fontSize: 7.5 }} />
                              <YAxis type="category" dataKey="disciplina" tick={{ fontSize: 7.5 }} width={68} />
                              <Tooltip formatter={(v: any, n: any) => [formatCurrency(Number(v) || 0), n]} />
                              <Legend wrapperStyle={{ fontSize: 8.5 }} />
                              <Bar dataKey="base" name="Orçado" fill="#3B82F6" barSize={7} isAnimationActive={false} radius={[0, 2, 2, 0]} />
                              <Bar dataKey="contratado" name="Contratado" fill="#00A3C4" barSize={7} isAnimationActive={false} radius={[0, 2, 2, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Gráfico B: Status das Medições com Valores Monetários Visíveis */}
                      <div className="p-3 rounded-xl border border-slate-200 bg-white flex flex-col justify-between">
                        <h3 className="text-[10.5px] font-bold text-slate-800 flex items-center justify-between mb-1.5">
                          <span className="flex items-center gap-1.5">
                            <CreditCard className="h-3 w-3 text-[#00A3C4]" />
                            Status das Medições (Liquidação)
                          </span>
                          <span className="font-mono text-[9px] font-semibold text-slate-500">
                            Total: {formatCurrency(totalMedicoesValor)}
                          </span>
                        </h3>
                        <div className="flex items-center gap-2">
                          {/* Rosca */}
                          <div className="h-32 w-28 shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={dadosStatusMedicoes}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={24}
                                  outerRadius={44}
                                  paddingAngle={3}
                                  dataKey="value"
                                  isAnimationActive={false}
                                >
                                  {dadosStatusMedicoes.map((entry) => (
                                    <Cell key={entry.name} fill={PIE_COLORS[entry.name] || '#94a3b8'} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(v: any, n: any) => [formatCurrency(Number(v) || 0), n]} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>

                          {/* Lista de Valores por Status */}
                          <div className="flex-1 flex flex-col justify-center space-y-1 pl-2 border-l border-slate-100">
                            {dadosStatusMedicoes.map((st) => {
                              const cor = PIE_COLORS[st.name] || '#94a3b8';
                              const pct = totalMedicoesValor > 0 ? ((st.value / totalMedicoesValor) * 100).toFixed(1) : '0';
                              return (
                                <div key={st.name} className="flex items-center justify-between text-[8.5px]">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cor }} />
                                    <span className="font-bold text-slate-700">{st.name}:</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-mono font-bold text-slate-900 block leading-tight">
                                      {formatCurrency(st.value)}
                                    </span>
                                    <span className="text-[7.5px] text-slate-400 font-medium">
                                      {pct}% • {st.count} med.
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Rodapé da Página 1 */}
              <div className="pt-2 mt-auto border-t border-slate-200 flex items-center justify-between text-[8px] text-slate-400 page-break-avoid">
                <span className="font-semibold text-slate-500">WCC Engenharia &amp; Desenvolvimento • Relatório Executivo</span>
                <span>Página 1 de 2 • Emitido em {dataAtual} às {horaAtual}</span>
              </div>
            </div>

            {/* ============================================================== */}
            {/* FOLHA 2 (PÁGINA 2): CRONOGRAMA DETALHADO & OCORRÊNCIAS         */}
            {/* ============================================================== */}
            <div className="folha-a4 bg-white text-slate-900 shadow-2xl border border-slate-200 rounded-lg text-xs font-sans w-full max-w-[210mm] min-h-[297mm] p-[20mm] flex flex-col justify-between box-border">
              <div className="space-y-3.5 flex-1">
                {/* Mini Cabeçalho da Página 2 */}
                <div className="border-b border-[#00A3C4]/40 pb-2 mb-2 flex items-center justify-between page-break-avoid">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] font-black tracking-widest px-2 py-0.5 rounded bg-[#072B3B] text-white uppercase">
                      WCC ENGENHARIA
                    </span>
                    <span className="text-[10px] text-slate-700 font-bold">
                      Relatório Executivo • {obraSelecionadaNome}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400">Página 2 de 2 • Cronograma Analítico de Desembolso</span>
                </div>

                {/* SEÇÃO 4: CRONOGRAMA DE DESEMBOLSO FINANCEIRO (CURVA S - TABELA 5 COLUNAS) */}
                {secoes.curvaDesembolso && curvaPontosRelatorio.length > 0 && (
                  <div className="space-y-2 page-break-avoid">
                    <div className="flex items-center justify-between border-l-4 border-[#00A3C4] pl-2.5 py-0.5">
                      <div>
                        <h2 className="text-xs font-black uppercase tracking-wider text-[#072B3B] flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-[#00A3C4]" />
                          4. Cronograma Detalhado de Desembolso Financeiro (Mês a Mês)
                        </h2>
                        <span className="text-[9px] text-slate-500 font-medium">
                          Valores baseados na data de liquidação realizada e datas previstas para os próximos meses
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        Total a Desembolsar Futuro: <strong className="text-amber-600 font-mono">{formatCurrency(totalPrevistoFuturo)}</strong>
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                      <table className="w-full text-[10px] border-collapse">
                        <thead className="bg-[#072B3B] text-white font-bold">
                          <tr>
                            <th className="py-2 px-3 text-left w-[20%]">Mês Competência / Caixa</th>
                            <th className="py-2 px-3 text-right w-[16%]">Realizado (Pago)</th>
                            <th className="py-2 px-3 text-right w-[16%] text-indigo-200">A Pagar (Com NF)</th>
                            <th className="py-2 px-3 text-right w-[16%] text-amber-200">Previsto (A Medir)</th>
                            <th className="py-2 px-3 text-right w-[16%]">Total do Mês</th>
                            <th className="py-2 px-3 text-right w-[16%]">Acumulado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-[9.5px]">
                          {curvaPontosRelatorio.map((p) => {
                            const temAPagar = (p.aPagar || 0) > 0;
                            const temAMedir = (p.aMedir || 0) > 0;
                            return (
                              <tr
                                key={p.mesSortKey || p.mes}
                                className={temAPagar ? 'bg-indigo-50/30 font-semibold' : temAMedir ? 'bg-amber-50/30' : 'even:bg-slate-50/50'}
                              >
                                <td className="py-1.5 px-3 text-left font-sans font-semibold text-slate-800">
                                  {p.mesFormatado} <span className="font-mono text-[8.5px] text-slate-500">({p.mes})</span>
                                </td>
                                <td className="py-1.5 px-3 text-right text-emerald-700 font-semibold">
                                  {(p.pago || 0) > 0 ? formatCurrency(p.pago || 0) : '-'}
                                </td>
                                <td className="py-1.5 px-3 text-right text-indigo-700 font-semibold">
                                  {(p.aPagar || 0) > 0 ? (
                                    <span className="inline-flex items-center gap-1">
                                      {formatCurrency(p.aPagar || 0)}
                                      <span className="px-1 py-0.2 rounded text-[7px] font-black bg-indigo-600 text-white font-sans">
                                        COM NF
                                      </span>
                                    </span>
                                  ) : (
                                    '-'
                                  )}
                                </td>
                                <td className="py-1.5 px-3 text-right text-amber-700 font-bold">
                                  {(p.aMedir || 0) > 0 ? (
                                    <span className="inline-flex items-center gap-1">
                                      {formatCurrency(p.aMedir || 0)}
                                      <span className="px-1 py-0.2 rounded text-[7px] font-black bg-amber-500 text-white font-sans">
                                        A MEDIR
                                      </span>
                                    </span>
                                  ) : (
                                    '-'
                                  )}
                                </td>
                                <td className="py-1.5 px-3 text-right font-bold text-slate-900">
                                  {formatCurrency(p.total)}
                                </td>
                                <td className="py-1.5 px-3 text-right font-bold text-[#008EA9]">
                                  {formatCurrency(p.acumuladoTotal)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-[10px]">
                          <tr>
                            <td className="py-2 px-3 uppercase text-left font-sans">Totais Consolidados:</td>
                            <td className="py-2 px-3 text-right font-mono text-emerald-700">{formatCurrency(totalPagoCurva)}</td>
                            <td className="py-2 px-3 text-right font-mono text-indigo-700">{formatCurrency(totalAPagarCurva)}</td>
                            <td className="py-2 px-3 text-right font-mono text-amber-700">{formatCurrency(totalAMedirCurva)}</td>
                            <td className="py-2 px-3 text-right font-mono text-slate-900 font-black">{formatCurrency(totalPagoCurva + totalAPagarCurva + totalAMedirCurva)}</td>
                            <td className="py-2 px-3 text-right font-mono text-[#008EA9] font-black">
                              {formatCurrency(totalPagoCurva + totalAPagarCurva + totalAMedirCurva)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* SEÇÃO 5: RESUMO DE OCORRÊNCIAS (ADITIVOS & DISTRATOS) */}
                {secoes.ocorrencias && (todosAditivos.length > 0 || contratosDistratados.length > 0) && (
                  <div className="space-y-2 page-break-avoid">
                    <div className="flex items-center justify-between border-l-4 border-[#00A3C4] pl-2.5 py-0.5">
                      <h2 className="text-xs font-black uppercase tracking-wider text-[#072B3B]">
                        5. Resumo de Ocorrências Contratuais (Aditivos &amp; Distratos)
                      </h2>
                      <span className="text-[10px] text-slate-500">
                        Histórico de alterações e distratos
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {todosAditivos.length > 0 && (
                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                          <table className="w-full text-[9px] border-collapse">
                            <thead className="bg-slate-100 text-slate-700 font-bold">
                              <tr>
                                <th className="py-1.5 px-2 text-left">Contrato</th>
                                <th className="py-1.5 px-2 text-left">Fornecedor</th>
                                <th className="py-1.5 px-2 text-center">Nº</th>
                                <th className="py-1.5 px-2 text-center">Data</th>
                                <th className="py-1.5 px-2 text-center">Tipo</th>
                                <th className="py-1.5 px-2 text-right">Valor</th>
                                <th className="py-1.5 px-2 text-left">Justificativa / Escopo</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {todosAditivos.slice(0, 8).map((a) => (
                                <tr key={a.id} className="even:bg-slate-50/50">
                                  <td className="py-1 px-2 font-mono font-bold">{a.contrato_id}</td>
                                  <td className="py-1 px-2 font-medium">{a.empresa}</td>
                                  <td className="py-1 px-2 text-center font-bold">#{a.numero}</td>
                                  <td className="py-1 px-2 text-center">{formatDateBR(a.data)}</td>
                                  <td className="py-1 px-2 text-center">{a.tipo}</td>
                                  <td className={`py-1 px-2 text-right font-mono font-bold ${a.valor >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                                    {a.valor >= 0 ? `+${formatCurrency(a.valor)}` : formatCurrency(a.valor)}
                                  </td>
                                  <td className="py-1 px-2 text-slate-600 truncate max-w-xs">{a.descricao}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {contratosDistratados.length > 0 && (
                        <div className="border border-rose-200 rounded-xl overflow-hidden bg-rose-50/20 shadow-2xs">
                          <table className="w-full text-[9px] border-collapse">
                            <thead className="bg-rose-100/70 text-rose-900 font-bold">
                              <tr>
                                <th className="py-1.5 px-2 text-left">Contrato</th>
                                <th className="py-1.5 px-2 text-left">Fornecedor</th>
                                <th className="py-1.5 px-2 text-center">Data Distrato</th>
                                <th className="py-1.5 px-2 text-left">Motivo Rescisório</th>
                                <th className="py-1.5 px-2 text-right">Acerto Final</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-rose-100">
                              {contratosDistratados.map((c) => (
                                <tr key={c.id}>
                                  <td className="py-1 px-2 font-mono font-bold text-rose-800">{c.id}</td>
                                  <td className="py-1 px-2 font-semibold">{c.empresa}</td>
                                  <td className="py-1 px-2 text-center">{formatDateBR(c.distrato?.data)}</td>
                                  <td className="py-1 px-2 text-slate-700">{c.distrato?.motivo}</td>
                                  <td className="py-1 px-2 text-right font-mono font-bold">{formatCurrency(c.distrato?.valor_acerto || 0)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Rodapé da Página 2 */}
              <div className="pt-2 mt-auto border-t border-slate-200 flex items-center justify-between text-[8px] text-slate-400 page-break-avoid">
                <span className="font-semibold text-slate-500">WCC Engenharia &amp; Desenvolvimento • Relatório Executivo de Custos</span>
                <span>Documento emitido eletronicamente em {dataAtual} às {horaAtual}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. FOOTER DO MODAL */}
        <div className="p-3 border-t border-slate-200 dark:border-[#0B384D] flex items-center justify-between bg-slate-50 dark:bg-[#072432]">
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
            Dica: No diálogo de impressão, selecione <b>&quot;Salvar como PDF&quot;</b> e ative <b>&quot;Gráficos de segundo plano&quot;</b>.
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
