"use client";

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  ItemOrcamento,
  Contrato,
  Medicao,
  CurvaDesembolsoPonto,
  Obra,
  KpiOrcamento,
  JanelaCaixa306090,
  ItemConsolidadoDisciplina,
  ItemConsolidadoContrato,
  ItemConsolidadoObra,
  AditivoContrato,
} from '@/types/orcamento';
import {
  formatCurrency,
  formatCurrencyShort,
  formatPercent,
  formatDateBR,
  calculateKpis,
  getObraLabel,
  calculateCurvaDesembolso,
  calculateJanela306090,
  calculateConsolidadoDisciplinas,
  calculateConsolidadoContratos,
  calculateConsolidadoObras,
} from '@/lib/orcamento-utils';
import { exportMultiSheetExcel } from '@/lib/excel-export';
import { Button } from '@/components/ui/button';
import {
  X,
  Printer,
  FileSpreadsheet,
  SlidersHorizontal,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Layers,
  Calendar,
  Building,
  Briefcase,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export const MODO_RESUMO_E_OBRAS = '__TODAS_DETALHADAS__';

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
  obras,
  filtroObra: filtroObraProp,
  filtroFornecedor,
}: RelatorioOrcamentoPdfModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  const [localFiltroObra, setLocalFiltroObra] = useState<string>(filtroObraProp || '');

  useEffect(() => {
    setLocalFiltroObra(filtroObraProp || '');
  }, [filtroObraProp, isOpen]);

  const [filtroCategoria, setFiltroCategoria] = useState<'Todos' | 'Projeto' | 'Legalização'>('Todos');
  const [ordemListas, setOrdemListas] = useState<'valor' | 'alfabetica' | 'saldo'>('valor');
  const [showConfig, setShowConfig] = useState<boolean>(true);

  // Estado individual de expansão de cada card/bloco dentro do PDF
  const [expandedPdfBlocks, setExpandedPdfBlocks] = useState<Record<string, boolean>>({});
  const toggleBlockExpand = (key: string) => {
    setExpandedPdfBlocks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Seções habilitadas no PDF Executivo
  const [secoes, setSecoes] = useState({
    kpis: true,
    janela306090: true,
    disciplinas: true,
    contratos: true,
    curvaGrafico: true,
    curvaDesembolso: false,
    ocorrencias: false,
  });

  const toggleSecao = (key: keyof typeof secoes) => {
    setSecoes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selecionarTodasSecoes = (valor: boolean) => {
    setSecoes({
      kpis: valor,
      janela306090: valor,
      disciplinas: valor,
      contratos: valor,
      curvaGrafico: valor,
      curvaDesembolso: valor,
      ocorrencias: valor,
    });
  };

  const catParam = filtroCategoria === 'Todos' ? null : filtroCategoria;
  const isModoResumoEObras = localFiltroObra === MODO_RESUMO_E_OBRAS;
  const effectiveSingleObra = isModoResumoEObras ? null : localFiltroObra || null;

  // Lista consolidada de todas as obras que possuem orçamento ou contrato ativo nos filtros
  const consolidadoObras = useMemo(() => {
    const base = calculateConsolidadoObras(
      orcamentos,
      contratos,
      medicoes,
      obras,
      filtroFornecedor || null,
      catParam
    );
    const list = [...base];
    if (ordemListas === 'alfabetica') {
      return list.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' }));
    }
    if (ordemListas === 'saldo') {
      return list.sort((a, b) => b.faltaContratar - a.faltaContratar || b.valorAMedir - a.valorAMedir || b.totalPrevisto - a.totalPrevisto);
    }
    return list.sort((a, b) => b.totalPrevisto - a.totalPrevisto);
  }, [orcamentos, contratos, medicoes, obras, filtroFornecedor, catParam, ordemListas]);

  // Curva S de Desembolso Financeiro (para exportação Excel ou visão simples)
  const curvaPontosRelatorio = useMemo(() => {
    return calculateCurvaDesembolso(
      medicoes,
      effectiveSingleObra,
      filtroFornecedor || null,
      contratos,
      catParam,
      'desembolso'
    );
  }, [medicoes, effectiveSingleObra, filtroFornecedor, contratos, catParam]);

  const dataAtual = new Date().toLocaleDateString('pt-BR');
  const horaAtual = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Dimensões exatas em pixels da Folha A4 (210mm x 297mm = 794px x 1122px a 96 DPI)
  // Garante que o Cabeçalho e o Rodapé fiquem sempre em espaços fixos dedicados
  // e calcula exatamente quantos cards/linhas inteiros cabem no espaço útil entre eles.
  const PDF_LAYOUT = {
    pageHeight: 1122, // 297mm
    paddingY: 96, // 48px topo + 48px base -> 1026px internos
    headerPage1: 68, // 52px altura + 16px margem inferior
    headerPageN: 44, // 28px altura + 16px margem inferior
    footer: 36, // 20px altura + 16px margem superior (sempre reservado no fim da folha)
    sectionGap: 20, // Respiro fixo entre tópicos
    sectionHeader: 28, // 20px altura do título do tópico + 8px margem inferior
    kpis1Row: 116, // 28px título + 88px (1 linha de 4 cards)
    kpis2Rows: 212, // 28px título + 184px (2 linhas quando expandido)
    janelaNormal: 106, // 28px título + 78px cards 30/60/90
    janelaExpanded: 132, // 28px título + 104px cards 30/60/90 expandidos
    cardNormal: 54, // Altura fixa de cada card de Obra, Disciplina ou Contrato
    cardExpanded: 66, // Altura fixa de cada card expandido
    cardGap: 8, // Espaço vertical entre cards da lista
    curvaGrafico: 224, // 28px título + 196px gráfico
    tableHeader: 54, // 28px título + 26px cabeçalho da tabela
    tableRow: 24, // Altura fixa de cada linha da tabela
  };

  // Espaço útil exato disponível para os tópicos na relação (Cabeçalho <-> Rodapé):
  // Página 1 da seção: 1122 - 96 - 68 - 36 = 922px
  // Página 2+ da seção: 1122 - 96 - 44 - 36 = 946px
  const CONTENT_HEIGHT_PAGE_1 =
    PDF_LAYOUT.pageHeight - PDF_LAYOUT.paddingY - PDF_LAYOUT.headerPage1 - PDF_LAYOUT.footer;
  const CONTENT_HEIGHT_PAGE_N =
    PDF_LAYOUT.pageHeight - PDF_LAYOUT.paddingY - PDF_LAYOUT.headerPageN - PDF_LAYOUT.footer;

  // Paginação automática em múltiplas folhas A4 (se um card/linha inteiro não couber, vai para a próxima página)
  type PdfPageBlock =
    | { type: 'kpis' }
    | { type: 'janela306090' }
    | {
        type: 'quadroObras';
        items: ItemConsolidadoObra[];
        isContinuation: boolean;
        totalCount: number;
      }
    | {
        type: 'disciplinas';
        items: ItemConsolidadoDisciplina[];
        isContinuation: boolean;
        totalCount: number;
      }
    | {
        type: 'contratos';
        items: ItemConsolidadoContrato[];
        isContinuation: boolean;
        totalCount: number;
      }
    | { type: 'curvaGrafico' }
    | {
        type: 'curvaDesembolso';
        items: CurvaDesembolsoPonto[];
        isContinuation: boolean;
      }
    | {
        type: 'ocorrencias';
        items: Array<AditivoContrato & { empresa: string; obra: string }>;
        isContinuation: boolean;
      };

  interface PdfPageDescriptor {
    headerTitle: string;
    headerObraBadge: string;
    headerSubBadge?: string;
    isSectionFirstPage: boolean;
    kpis: KpiOrcamento;
    janela306090: JanelaCaixa306090;
    curvaPontos: CurvaDesembolsoPonto[];
    totaisCurva: { pago: number; aPagar: number; aMedir: number };
    blocks: PdfPageBlock[];
  }

  const pages = useMemo<PdfPageDescriptor[]>(() => {
    const sortDisciplinasList = (base: ItemConsolidadoDisciplina[]) => {
      const list = [...base];
      if (ordemListas === 'alfabetica') {
        return list.sort((a, b) => a.disciplina.localeCompare(b.disciplina, 'pt-BR', { sensitivity: 'base' }));
      }
      if (ordemListas === 'saldo') {
        return list.sort((a, b) => b.faltaContratar - a.faltaContratar || b.totalPrevisto - a.totalPrevisto);
      }
      return list.sort((a, b) => b.totalPrevisto - a.totalPrevisto);
    };

    const sortContratosList = (base: ItemConsolidadoContratosList) => {
      const list = [...base];
      if (ordemListas === 'alfabetica') {
        return list.sort(
          (a, b) =>
            a.empresa.localeCompare(b.empresa, 'pt-BR', { sensitivity: 'base' }) ||
            a.disciplina.localeCompare(b.disciplina, 'pt-BR', { sensitivity: 'base' })
        );
      }
      if (ordemListas === 'saldo') {
        return list.sort((a, b) => b.valorAMedir - a.valorAMedir || b.valorContrato - a.valorContrato);
      }
      return list.sort((a, b) => b.valorContrato - a.valorContrato);
    };
    type ItemConsolidadoContratosList = ItemConsolidadoContrato[];

    // Constrói as páginas A4 de um escopo específico (Consolidado Geral ou 1 Obra Individual)
    const buildScopePages = (
      obraCodigo: string | null,
      headerTitle: string,
      headerObraBadge: string,
      headerSubBadge?: string
    ): PdfPageDescriptor[] => {
      const scopeKpis = calculateKpis(orcamentos, contratos, medicoes, obraCodigo, catParam);
      const scopeJanela = calculateJanela306090(
        medicoes,
        contratos,
        obraCodigo,
        filtroFornecedor || null,
        catParam
      );
      const scopeDisciplinas = sortDisciplinasList(
        calculateConsolidadoDisciplinas(orcamentos, obraCodigo, catParam)
      );
      const scopeContratos = sortContratosList(
        calculateConsolidadoContratos(
          contratos,
          medicoes,
          obraCodigo,
          filtroFornecedor || null,
          catParam,
          orcamentos,
          obras
        )
      );
      const scopeCurva = calculateCurvaDesembolso(
        medicoes,
        obraCodigo,
        filtroFornecedor || null,
        contratos,
        catParam,
        'desembolso'
      );
      const scopeTotaisCurva = {
        pago: scopeCurva.reduce((acc, p) => acc + (p.pago || 0), 0),
        aPagar: scopeCurva.reduce((acc, p) => acc + (p.aPagar || 0), 0),
        aMedir: scopeCurva.reduce((acc, p) => acc + (p.aMedir || 0), 0),
      };

      const scopeContratosFiltrados = contratos.filter((c) => {
        if (obraCodigo && c.obra !== obraCodigo) return false;
        if (filtroFornecedor && c.empresa !== filtroFornecedor) return false;
        if (filtroCategoria !== 'Todos' && c.categoria !== filtroCategoria) return false;
        return true;
      });

      const scopeAditivos = scopeContratosFiltrados.flatMap((c) =>
        (c.aditivos || []).map((a) => ({ ...a, empresa: c.empresa, obra: c.obra }))
      );
      const scopeDistratados = scopeContratosFiltrados.filter((c) => c.status === 'Distratado');

      const blockPages: PdfPageBlock[][] = [];
      let currentPage: PdfPageBlock[] = [];
      let availPx = CONTENT_HEIGHT_PAGE_1;

      const startNewPage = () => {
        if (currentPage.length > 0) {
          blockPages.push(currentPage);
        }
        currentPage = [];
        availPx = CONTENT_HEIGHT_PAGE_N;
      };

      const pushFixedBlock = (block: PdfPageBlock, blockHeightPx: number) => {
        const gap = currentPage.length > 0 ? PDF_LAYOUT.sectionGap : 0;
        if (availPx < blockHeightPx + gap && currentPage.length > 0) {
          startNewPage();
        }
        const actualGap = currentPage.length > 0 ? PDF_LAYOUT.sectionGap : 0;
        currentPage.push(block);
        availPx -= blockHeightPx + actualGap;
      };

      // 1. Cards Principais (KPIs)
      if (secoes.kpis) {
        const anyKpiExpanded =
          expandedPdfBlocks.kpiContratado ||
          expandedPdfBlocks.kpiFalta ||
          expandedPdfBlocks.kpiMedido ||
          expandedPdfBlocks.kpiAMedir;
        pushFixedBlock({ type: 'kpis' }, anyKpiExpanded ? PDF_LAYOUT.kpis2Rows : PDF_LAYOUT.kpis1Row);
      }

      // 2. Janela 30 / 60 / 90 Dias
      if (secoes.janela306090) {
        pushFixedBlock(
          { type: 'janela306090' },
          expandedPdfBlocks.pdf306090 ? PDF_LAYOUT.janelaExpanded : PDF_LAYOUT.janelaNormal
        );
      }

      // 3. Consolidação por Disciplina
      if (secoes.disciplinas && scopeDisciplinas.length > 0) {
        const cardH = expandedPdfBlocks.pdfDisciplinas ? PDF_LAYOUT.cardExpanded : PDF_LAYOUT.cardNormal;
        let remaining = [...scopeDisciplinas];
        let isContinuation = false;

        while (remaining.length > 0) {
          const gap = currentPage.length > 0 ? PDF_LAYOUT.sectionGap : 0;
          const minCards = Math.min(remaining.length, 2);
          const minNeeded =
            gap + PDF_LAYOUT.sectionHeader + minCards * cardH + (minCards - 1) * PDF_LAYOUT.cardGap;

          if (availPx < minNeeded && currentPage.length > 0) {
            startNewPage();
          }

          const effectiveGap = currentPage.length > 0 ? PDF_LAYOUT.sectionGap : 0;
          const availForCards = availPx - effectiveGap - PDF_LAYOUT.sectionHeader;
          const maxFit = Math.max(
            1,
            Math.floor((availForCards + PDF_LAYOUT.cardGap) / (cardH + PDF_LAYOUT.cardGap))
          );
          const chunk = remaining.slice(0, maxFit);

          currentPage.push({
            type: 'disciplinas',
            items: chunk,
            isContinuation,
            totalCount: scopeDisciplinas.length,
          });

          const usedCardsPx = chunk.length * cardH + (chunk.length - 1) * PDF_LAYOUT.cardGap;
          availPx -= effectiveGap + PDF_LAYOUT.sectionHeader + usedCardsPx;
          remaining = remaining.slice(chunk.length);
          isContinuation = true;

          if (remaining.length > 0) {
            startNewPage();
          }
        }
      }

      // 4. Consolidação dos Contratos
      if (secoes.contratos && scopeContratos.length > 0) {
        const cardH = expandedPdfBlocks.pdfContratos ? PDF_LAYOUT.cardExpanded : PDF_LAYOUT.cardNormal;
        let remaining = [...scopeContratos];
        let isContinuation = false;

        while (remaining.length > 0) {
          const gap = currentPage.length > 0 ? PDF_LAYOUT.sectionGap : 0;
          const minCards = Math.min(remaining.length, 2);
          const minNeeded =
            gap + PDF_LAYOUT.sectionHeader + minCards * cardH + (minCards - 1) * PDF_LAYOUT.cardGap;

          if (availPx < minNeeded && currentPage.length > 0) {
            startNewPage();
          }

          const effectiveGap = currentPage.length > 0 ? PDF_LAYOUT.sectionGap : 0;
          const availForCards = availPx - effectiveGap - PDF_LAYOUT.sectionHeader;
          const maxFit = Math.max(
            1,
            Math.floor((availForCards + PDF_LAYOUT.cardGap) / (cardH + PDF_LAYOUT.cardGap))
          );
          const chunk = remaining.slice(0, maxFit);

          currentPage.push({
            type: 'contratos',
            items: chunk,
            isContinuation,
            totalCount: scopeContratos.length,
          });

          const usedCardsPx = chunk.length * cardH + (chunk.length - 1) * PDF_LAYOUT.cardGap;
          availPx -= effectiveGap + PDF_LAYOUT.sectionHeader + usedCardsPx;
          remaining = remaining.slice(chunk.length);
          isContinuation = true;

          if (remaining.length > 0) {
            startNewPage();
          }
        }
      }

      // 5. Curva S (Gráfico)
      if (secoes.curvaGrafico && scopeCurva.length > 0) {
        pushFixedBlock({ type: 'curvaGrafico' }, PDF_LAYOUT.curvaGrafico);
      }

      // 6. Tabela Mensal Curva S
      if (secoes.curvaDesembolso && scopeCurva.length > 0) {
        let remaining = [...scopeCurva];
        let isContinuation = false;

        while (remaining.length > 0) {
          const gap = currentPage.length > 0 ? PDF_LAYOUT.sectionGap : 0;
          const minRows = Math.min(remaining.length, 3);
          if (availPx < gap + PDF_LAYOUT.tableHeader + minRows * PDF_LAYOUT.tableRow && currentPage.length > 0) {
            startNewPage();
          }
          const effectiveGap = currentPage.length > 0 ? PDF_LAYOUT.sectionGap : 0;
          const availForRows = availPx - effectiveGap - PDF_LAYOUT.tableHeader;
          const maxFit = Math.max(1, Math.floor(availForRows / PDF_LAYOUT.tableRow));
          const chunk = remaining.slice(0, maxFit);

          currentPage.push({
            type: 'curvaDesembolso',
            items: chunk,
            isContinuation,
          });

          availPx -= effectiveGap + PDF_LAYOUT.tableHeader + chunk.length * PDF_LAYOUT.tableRow;
          remaining = remaining.slice(chunk.length);
          isContinuation = true;

          if (remaining.length > 0) {
            startNewPage();
          }
        }
      }

      // 7. Ocorrências Contratuais (Aditivos & Distratos)
      if (secoes.ocorrencias && (scopeAditivos.length > 0 || scopeDistratados.length > 0)) {
        let remaining = [...scopeAditivos];
        let isContinuation = false;

        if (remaining.length === 0) {
          pushFixedBlock({ type: 'ocorrencias', items: [], isContinuation: false }, 60);
        } else {
          while (remaining.length > 0) {
            const gap = currentPage.length > 0 ? PDF_LAYOUT.sectionGap : 0;
            const minRows = Math.min(remaining.length, 2);
            if (availPx < gap + PDF_LAYOUT.tableHeader + minRows * PDF_LAYOUT.tableRow && currentPage.length > 0) {
              startNewPage();
            }
            const effectiveGap = currentPage.length > 0 ? PDF_LAYOUT.sectionGap : 0;
            const availForRows = availPx - effectiveGap - PDF_LAYOUT.tableHeader;
            const maxFit = Math.max(1, Math.floor(availForRows / PDF_LAYOUT.tableRow));
            const chunk = remaining.slice(0, maxFit);

            currentPage.push({
              type: 'ocorrencias',
              items: chunk,
              isContinuation,
            });

            availPx -= effectiveGap + PDF_LAYOUT.tableHeader + chunk.length * PDF_LAYOUT.tableRow;
            remaining = remaining.slice(chunk.length);
            isContinuation = true;

            if (remaining.length > 0) {
              startNewPage();
            }
          }
        }
      }

      if (currentPage.length > 0) {
        blockPages.push(currentPage);
      }

      const finalBlockPages = blockPages.length > 0 ? blockPages : [[]];

      return finalBlockPages.map((blocks, idx) => ({
        headerTitle,
        headerObraBadge,
        headerSubBadge,
        isSectionFirstPage: idx === 0,
        kpis: scopeKpis,
        janela306090: scopeJanela,
        curvaPontos: scopeCurva,
        totaisCurva: scopeTotaisCurva,
        blocks,
      }));
    };

    // MODO 3 (NOVO): Resumo Executivo Geral na(s) 1ª(s) página(s) + Todas as Obras Detalhadas abaixo (1 obra por nova folha A4)
    if (isModoResumoEObras) {
      const allPages: PdfPageDescriptor[] = [];

      // Parte A: Página(s) de Resumo Executivo do Portfólio (Totais de Todas as Obras + Quadro Comparativo por Obra)
      const portfolioKpis = calculateKpis(orcamentos, contratos, medicoes, null, catParam);
      const portfolioJanela = calculateJanela306090(
        medicoes,
        contratos,
        null,
        filtroFornecedor || null,
        catParam
      );
      const portfolioCurva = calculateCurvaDesembolso(
        medicoes,
        null,
        filtroFornecedor || null,
        contratos,
        catParam,
        'desembolso'
      );
      const portfolioTotaisCurva = {
        pago: portfolioCurva.reduce((acc, p) => acc + (p.pago || 0), 0),
        aPagar: portfolioCurva.reduce((acc, p) => acc + (p.aPagar || 0), 0),
        aMedir: portfolioCurva.reduce((acc, p) => acc + (p.aMedir || 0), 0),
      };

      const summaryBlockPages: PdfPageBlock[][] = [];
      let sumCurrentPage: PdfPageBlock[] = [];
      let sumAvailPx = CONTENT_HEIGHT_PAGE_1;

      const startNewSummaryPage = () => {
        if (sumCurrentPage.length > 0) {
          summaryBlockPages.push(sumCurrentPage);
        }
        sumCurrentPage = [];
        sumAvailPx = CONTENT_HEIGHT_PAGE_N;
      };

      const pushSummaryFixed = (block: PdfPageBlock, blockHeightPx: number) => {
        const gap = sumCurrentPage.length > 0 ? PDF_LAYOUT.sectionGap : 0;
        if (sumAvailPx < blockHeightPx + gap && sumCurrentPage.length > 0) {
          startNewSummaryPage();
        }
        const actualGap = sumCurrentPage.length > 0 ? PDF_LAYOUT.sectionGap : 0;
        sumCurrentPage.push(block);
        sumAvailPx -= blockHeightPx + actualGap;
      };

      // 1. Posição Geral Consolidada do Portfólio (KPIs de todas as obras)
      const anyKpiExpanded =
        expandedPdfBlocks.kpiContratado ||
        expandedPdfBlocks.kpiFalta ||
        expandedPdfBlocks.kpiMedido ||
        expandedPdfBlocks.kpiAMedir;
      pushSummaryFixed({ type: 'kpis' }, anyKpiExpanded ? PDF_LAYOUT.kpis2Rows : PDF_LAYOUT.kpis1Row);

      // 2. Janela 30/60/90 Dias Consolidada do Portfólio
      pushSummaryFixed(
        { type: 'janela306090' },
        expandedPdfBlocks.pdf306090 ? PDF_LAYOUT.janelaExpanded : PDF_LAYOUT.janelaNormal
      );

      // 3. Quadro Resumo Comparativo de Todas as Obras Ativas
      if (consolidadoObras.length > 0) {
        const cardH = expandedPdfBlocks.pdfQuadroObras ? PDF_LAYOUT.cardExpanded : PDF_LAYOUT.cardNormal;
        let remaining = [...consolidadoObras];
        let isContinuation = false;

        while (remaining.length > 0) {
          const gap = sumCurrentPage.length > 0 ? PDF_LAYOUT.sectionGap : 0;
          const minCards = Math.min(remaining.length, 2);
          const minNeeded =
            gap + PDF_LAYOUT.sectionHeader + minCards * cardH + (minCards - 1) * PDF_LAYOUT.cardGap;

          if (sumAvailPx < minNeeded && sumCurrentPage.length > 0) {
            startNewSummaryPage();
          }

          const effectiveGap = sumCurrentPage.length > 0 ? PDF_LAYOUT.sectionGap : 0;
          const availForCards = sumAvailPx - effectiveGap - PDF_LAYOUT.sectionHeader;
          const maxFit = Math.max(
            1,
            Math.floor((availForCards + PDF_LAYOUT.cardGap) / (cardH + PDF_LAYOUT.cardGap))
          );
          const chunk = remaining.slice(0, maxFit);

          sumCurrentPage.push({
            type: 'quadroObras',
            items: chunk,
            isContinuation,
            totalCount: consolidadoObras.length,
          });

          const usedCardsPx = chunk.length * cardH + (chunk.length - 1) * PDF_LAYOUT.cardGap;
          sumAvailPx -= effectiveGap + PDF_LAYOUT.sectionHeader + usedCardsPx;
          remaining = remaining.slice(chunk.length);
          isContinuation = true;

          if (remaining.length > 0) {
            startNewSummaryPage();
          }
        }
      }

      if (sumCurrentPage.length > 0) {
        summaryBlockPages.push(sumCurrentPage);
      }

      const finalSummaryPages = summaryBlockPages.length > 0 ? summaryBlockPages : [[]];
      for (let i = 0; i < finalSummaryPages.length; i++) {
        allPages.push({
          headerTitle: 'RESUMO EXECUTIVO DO PORTFÓLIO — VISÃO CONSOLIDADA DE OBRAS',
          headerObraBadge: 'RESUMO EXECUTIVO (TODAS AS OBRAS)',
          headerSubBadge: `${consolidadoObras.length} ${consolidadoObras.length === 1 ? 'Obra' : 'Obras'}`,
          isSectionFirstPage: i === 0,
          kpis: portfolioKpis,
          janela306090: portfolioJanela,
          curvaPontos: portfolioCurva,
          totaisCurva: portfolioTotaisCurva,
          blocks: finalSummaryPages[i],
        });
      }

      // Parte B: Relatório Completo de Cada Obra Individualmente (iniciando cada obra em nova folha A4)
      consolidadoObras.forEach((obraItem, idx) => {
        const obraPages = buildScopePages(
          obraItem.codigo,
          'CONSOLIDAÇÃO DE ORÇAMENTOS, CONTRATOS & MEDIÇÕES',
          obraItem.label,
          `Obra ${idx + 1} de ${consolidadoObras.length}`
        );
        allPages.push(...obraPages);
      });

      return allPages;
    }

    // MODO 1 (1 Obra Individual) ou MODO 2 (Todas as Obras Somadas)
    const badgeLabel = effectiveSingleObra
      ? getObraLabel(effectiveSingleObra, obras)
      : 'TODAS AS OBRAS E EMPREENDIMENTOS (CONSOLIDADO)';

    return buildScopePages(
      effectiveSingleObra,
      'CONSOLIDAÇÃO DE ORÇAMENTOS, CONTRATOS & MEDIÇÕES',
      badgeLabel
    );
  }, [
    isModoResumoEObras,
    effectiveSingleObra,
    orcamentos,
    contratos,
    medicoes,
    obras,
    filtroFornecedor,
    filtroCategoria,
    catParam,
    ordemListas,
    secoes,
    expandedPdfBlocks,
    consolidadoObras,
    CONTENT_HEIGHT_PAGE_1,
    CONTENT_HEIGHT_PAGE_N,
  ]);

  const totalPages = pages.length;

  const docTitleSuffix = isModoResumoEObras
    ? 'Resumo_Executivo_e_Todas_as_Obras'
    : localFiltroObra || 'Consolidado';

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Relatorio_Executivo_WCC_${docTitleSuffix}_${new Date().toISOString().slice(0, 10)}`,
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
        .no-print-btn {
          display: none !important;
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
          height: 1122px !important;
          min-height: 1122px !important;
          max-height: 1122px !important;
          padding: 48px 52px !important;
          margin: 0 auto !important;
          border: none !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
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
      filtroObra: effectiveSingleObra || '',
      filtroCategoria: filtroCategoria,
      nomeArquivo: `Relatorio_Consolidado_Orcamentos_WCC_${effectiveSingleObra || 'Geral'}.xlsx`,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in-0">
      <div className="bg-white dark:bg-[#072B3B] rounded-2xl border border-slate-200 dark:border-[#0B384D] max-w-6xl w-full max-h-[96vh] flex flex-col shadow-2xl overflow-hidden">
        {/* 1. BARRA SUPERIOR DE AÇÕES */}
        <div className="p-4 border-b border-slate-200 dark:border-[#0B384D] flex items-center justify-between gap-4 bg-slate-50 dark:bg-[#072432]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00A3C4]/15 text-[#00A3C4] dark:text-[#00C4EB]">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Relatório Executivo PDF (Diretoria Financeira)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Clique no ícone de expandir em qualquer card ou seção abaixo para aumentar seu destaque antes de imprimir.
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

        {/* 2. PAINEL DE PERSONALIZAÇÃO */}
        {showConfig && (
          <div className="p-3 sm:p-4 bg-slate-100/80 dark:bg-[#083042] border-b border-slate-200 dark:border-[#0B384D] text-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Filtro de Obra / Modo de Relatório */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 text-xs flex items-center gap-1">
                  <Building className="h-3.5 w-3.5 text-[#00A3C4]" /> Obra / Formato:
                </span>
                <select
                  value={localFiltroObra}
                  onChange={(e) => setLocalFiltroObra(e.target.value)}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#072B3B] border border-slate-200 dark:border-[#0B384D] text-slate-800 dark:text-slate-100 h-9 min-w-[220px] max-w-[340px] focus:outline-none focus:ring-2 focus:ring-[#00A3C4] truncate shadow-2xs"
                >
                  <optgroup label="Visão de Portfólio (Todas as Obras)">
                    <option value="">🏢 Todas as Obras — Consolidado (Somado)</option>
                    <option value={MODO_RESUMO_E_OBRAS}>
                      📑 Resumo Executivo + Todas as Obras ({consolidadoObras.length} obras detalhadas)
                    </option>
                  </optgroup>
                  <optgroup label={`Obra Individual (${obras.length})`}>
                    {obras.map((o) => (
                      <option key={o.id} value={o.codigo}>
                        {o.codigo} - {o.nome}
                      </option>
                    ))}
                  </optgroup>
                </select>

                {/* Atalho rápido entre os modos de Todas as Obras */}
                <div className="flex items-center rounded-xl bg-white dark:bg-[#072B3B] p-0.5 border border-slate-200 dark:border-[#0B384D] h-9">
                  <button
                    type="button"
                    onClick={() => setLocalFiltroObra('')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      localFiltroObra === ''
                        ? 'bg-[#00A3C4] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                    }`}
                    title="Compila a soma de todas as obras juntas"
                  >
                    Consolidado (Somado)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocalFiltroObra(MODO_RESUMO_E_OBRAS)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      isModoResumoEObras
                        ? 'bg-[#00A3C4] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                    }`}
                    title="Apresenta 1ª página de Resumo Executivo Geral e logo abaixo detalha cada obra individualmente"
                  >
                    Resumo + Todas as Obras
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
                      {cat === 'Projeto' ? 'Projetos' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ordenação de Disciplinas e Contratos */}
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">Ordenar:</span>
                <div className="flex items-center rounded-xl bg-white dark:bg-[#072B3B] p-0.5 border border-slate-200 dark:border-[#0B384D] h-9">
                  {(
                    [
                      { id: 'valor', label: 'Maior Valor' },
                      { id: 'alfabetica', label: 'A–Z' },
                      { id: 'saldo', label: 'Maior Saldo Aberto' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setOrdemListas(opt.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        ordemListas === opt.id
                          ? 'bg-[#00A3C4] text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                      }`}
                    >
                      {opt.label}
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

            {/* Checkboxes de Seções */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-[#0B384D]/60">
              <span className="font-bold text-slate-600 dark:text-slate-400 text-[11px] mr-1">Seções a imprimir:</span>

              {[
                { key: 'kpis', label: '1. Cards Principais' },
                { key: 'janela306090', label: '2. Desembolso 30/60/90 Dias' },
                { key: 'disciplinas', label: '3. Consolidação por Disciplina' },
                { key: 'contratos', label: '4. Consolidação dos Contratos' },
                { key: 'curvaGrafico', label: '5. Curva S (Gráfico)' },
                { key: 'curvaDesembolso', label: '6. Tabela Mensal Curva S' },
                { key: 'ocorrencias', label: '7. Aditivos & Distratos' },
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

        {/* 3. ÁREA DE VISUALIZAÇÃO E IMPRESSÃO (A4 Retrato Multi-Páginas Automático) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200 dark:bg-slate-950/80 flex justify-center">
          <div
            ref={contentRef}
            className="print-report-root flex flex-col items-center gap-8 w-full max-w-[210mm]"
          >
            {pages.map((page, pageIdx) => {
              const pageNumber = pageIdx + 1;
              const isSectionFirstPage = page.isSectionFirstPage;
              const contentAreaHeight = isSectionFirstPage ? CONTENT_HEIGHT_PAGE_1 : CONTENT_HEIGHT_PAGE_N;
              const pageKpis = page.kpis;
              const pageJanela = page.janela306090;
              const pageCurva = page.curvaPontos;
              const pageTotaisCurva = page.totaisCurva;

              const estourouProjecaoKpi =
                pageKpis.diferencaOrcamento > 1 || pageKpis.diferencaContratados > 1;
              const valorEstouroKpi = Math.max(
                0,
                pageKpis.diferencaOrcamento > 1
                  ? pageKpis.diferencaOrcamento
                  : pageKpis.diferencaContratados
              );
              const economizouKpi =
                !estourouProjecaoKpi &&
                (pageKpis.diferencaOrcamento < -1 || pageKpis.diferencaContratados < -1);
              const economiaContratadosKpi = economizouKpi
                ? Math.abs(
                    pageKpis.diferencaOrcamento < -1
                      ? pageKpis.diferencaOrcamento
                      : pageKpis.diferencaContratados
                  )
                : 0;
              const contratadoBaseKpi = estourouProjecaoKpi
                ? Math.max(0, pageKpis.totalContratado - valorEstouroKpi)
                : pageKpis.totalContratado;
              const refMaxKpi = Math.max(
                pageKpis.totalOrcado,
                contratadoBaseKpi + economiaContratadosKpi + pageKpis.faltaContratar + valorEstouroKpi,
                1
              );
              const pctContratadoBarra = Math.min(100, (contratadoBaseKpi / refMaxKpi) * 100);
              const pctEconomiaBarra = Math.min(
                100 - pctContratadoBarra,
                (economiaContratadosKpi / refMaxKpi) * 100
              );
              const pctFaltaContratarBarra = Math.min(
                100 - pctContratadoBarra - pctEconomiaBarra,
                (pageKpis.faltaContratar / refMaxKpi) * 100
              );
              const pctDesvioBarra = estourouProjecaoKpi
                ? Math.min(
                    100 - pctContratadoBarra - pctEconomiaBarra - pctFaltaContratarBarra,
                    (valorEstouroKpi / refMaxKpi) * 100
                  )
                : 0;
              const pctMedidoBarra =
                pageKpis.totalContratado > 0
                  ? Math.min(100, (pageKpis.totalMedido / pageKpis.totalContratado) * 100)
                  : 0;
              const pctAMedirBarra =
                pageKpis.totalContratado > 0
                  ? Math.min(100, (pageKpis.saldoAMedir / pageKpis.totalContratado) * 100)
                  : 0;

              const anyKpiExpanded =
                expandedPdfBlocks.kpiContratado ||
                expandedPdfBlocks.kpiFalta ||
                expandedPdfBlocks.kpiMedido ||
                expandedPdfBlocks.kpiAMedir;

              return (
                <div
                  key={`folha-a4-${pageNumber}`}
                  style={{
                    height: `${PDF_LAYOUT.pageHeight}px`,
                    minHeight: `${PDF_LAYOUT.pageHeight}px`,
                    maxHeight: `${PDF_LAYOUT.pageHeight}px`,
                    padding: '48px 52px',
                  }}
                  className="folha-a4 bg-white text-slate-900 shadow-2xl border border-slate-200 rounded-lg text-xs font-sans w-full max-w-[210mm] flex flex-col justify-between box-border overflow-hidden"
                >
                  {/* 1. CABEÇALHO FIXO NO TOPO DA PÁGINA */}
                  {isSectionFirstPage ? (
                    <div
                      style={{ height: '52px', marginBottom: '16px' }}
                      className="border-b-2 border-[#00A3C4] pb-2 page-break-avoid flex items-center justify-between gap-4 shrink-0 box-border"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[9.5px] font-black tracking-wider px-2.5 py-0.5 rounded bg-[#072B3B] text-white inline-block">
                            WCC - Engenharia
                          </span>
                          {page.headerSubBadge && (
                            <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              {page.headerSubBadge}
                            </span>
                          )}
                        </div>
                        <h1 className="text-[12.5px] sm:text-[13.5px] font-black text-[#072B3B] tracking-tight leading-tight truncate">
                          {page.headerTitle}
                        </h1>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2 shrink-0 text-[10.5px]">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#00A3C4]/10 text-[#008EA9] font-bold border border-[#00A3C4]/30 max-w-[270px] truncate">
                          <Building className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{page.headerObraBadge}</span>
                        </span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-bold border border-purple-200">
                          {filtroCategoria === 'Todos'
                            ? 'Projetos & Legalização'
                            : filtroCategoria === 'Projeto'
                            ? 'Projetos'
                            : filtroCategoria}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{ height: '28px', marginBottom: '16px' }}
                      className="border-b border-[#00A3C4]/40 pb-1.5 flex items-center justify-between gap-3 page-break-avoid shrink-0 box-border"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-[9px] font-black tracking-wider px-2 py-0.5 rounded bg-[#072B3B] text-white shrink-0">
                          WCC - Engenharia
                        </span>
                        <span className="text-[10px] text-slate-700 font-bold truncate">
                          {page.headerTitle}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 text-[9.5px]">
                        {page.headerSubBadge && (
                          <span className="font-mono text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {page.headerSubBadge}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#00A3C4]/10 text-[#008EA9] font-bold border border-[#00A3C4]/30 max-w-[230px] truncate">
                          <Building className="h-2.5 w-2.5 shrink-0" />
                          <span className="truncate">{page.headerObraBadge}</span>
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold border border-purple-200">
                          {filtroCategoria === 'Todos'
                            ? 'Projetos & Legalização'
                            : filtroCategoria === 'Projeto'
                            ? 'Projetos'
                            : filtroCategoria}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 2. ÁREA CENTRAL DE TÓPICOS (ESPAÇO EXATO ENTRE CABEÇALHO E RODAPÉ) */}
                  <div
                    style={{
                      height: `${contentAreaHeight}px`,
                      maxHeight: `${contentAreaHeight}px`,
                      gap: `${PDF_LAYOUT.sectionGap}px`,
                    }}
                    className="flex flex-col justify-start overflow-hidden shrink-0"
                  >
                    {page.blocks.map((block, bIdx) => {
                      if (block.type === 'kpis') {
                        return (
                          <div
                            key={`block-kpis-${bIdx}`}
                            style={{ height: `${anyKpiExpanded ? PDF_LAYOUT.kpis2Rows : PDF_LAYOUT.kpis1Row}px` }}
                            className="flex flex-col justify-between shrink-0 page-break-avoid"
                          >
                            <div
                              style={{ height: '20px', marginBottom: '8px' }}
                              className="flex items-center justify-between border-l-4 border-[#00A3C4] pl-2.5 shrink-0"
                            >
                              <h2 className="text-[11px] font-black uppercase tracking-wider text-[#072B3B] leading-none">
                                1. Posição Geral (Orçado, Contratado, Falta Contratar e Medições)
                              </h2>
                            </div>

                            <div
                              style={{ height: `${anyKpiExpanded ? 184 : 88}px` }}
                              className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 items-stretch shrink-0"
                            >
                              {/* Card 1: Já Contratado */}
                              <div
                                className={`h-[88px] px-3 py-2 rounded-xl border border-sky-200 bg-sky-50/40 flex flex-col justify-between box-border ${
                                  expandedPdfBlocks.kpiContratado ? 'sm:col-span-2' : ''
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-sky-900 uppercase tracking-wider leading-none">
                                      Já Contratado
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => toggleBlockExpand('kpiContratado')}
                                      className="no-print-btn text-slate-400 hover:text-slate-700"
                                      title="Aumentar/Reduzir card"
                                    >
                                      {expandedPdfBlocks.kpiContratado ? (
                                        <Minimize2 className="h-3 w-3" />
                                      ) : (
                                        <Maximize2 className="h-3 w-3" />
                                      )}
                                    </button>
                                  </div>
                                  <span
                                    className={`font-black text-[#008EA9] block mt-1 leading-tight ${
                                      expandedPdfBlocks.kpiContratado ? 'text-lg' : 'text-[14px]'
                                    }`}
                                  >
                                    {formatCurrency(pageKpis.totalContratado)}
                                  </span>
                                </div>
                                <div className="space-y-1 mt-auto">
                                  <div className="w-full h-1.5 rounded-full bg-sky-200/70 overflow-hidden flex">
                                    <div
                                      className="h-full bg-[#00A3C4]"
                                      style={{ width: `${pctContratadoBarra}%` }}
                                    />
                                    {pctEconomiaBarra > 0 && (
                                      <div
                                        className="h-full bg-emerald-500"
                                        style={{ width: `${pctEconomiaBarra}%` }}
                                      />
                                    )}
                                    {pctDesvioBarra > 0 && pageKpis.faltaContratar === 0 && (
                                      <div
                                        className="h-full bg-rose-500"
                                        style={{ width: `${pctDesvioBarra}%` }}
                                      />
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between gap-1 text-[8.5px] text-slate-600 leading-none whitespace-nowrap">
                                    <span className="truncate">Orçado Base:</span>
                                    <strong className="shrink-0">{formatCurrency(pageKpis.totalOrcado)}</strong>
                                  </div>
                                </div>
                              </div>

                              {/* Card 2: Falta Contratar */}
                              <div
                                className={`h-[88px] px-3 py-2 rounded-xl border border-amber-200 bg-amber-50/40 flex flex-col justify-between box-border ${
                                  expandedPdfBlocks.kpiFalta ? 'sm:col-span-2' : ''
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-amber-900 uppercase tracking-wider leading-none">
                                      Falta Contratar
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => toggleBlockExpand('kpiFalta')}
                                      className="no-print-btn text-slate-400 hover:text-slate-700"
                                      title="Aumentar/Reduzir card"
                                    >
                                      {expandedPdfBlocks.kpiFalta ? (
                                        <Minimize2 className="h-3 w-3" />
                                      ) : (
                                        <Maximize2 className="h-3 w-3" />
                                      )}
                                    </button>
                                  </div>
                                  <span
                                    className={`font-black text-amber-700 block mt-1 leading-tight ${
                                      expandedPdfBlocks.kpiFalta ? 'text-lg' : 'text-[14px]'
                                    }`}
                                  >
                                    {formatCurrency(pageKpis.faltaContratar)}
                                  </span>
                                </div>
                                <div className="space-y-1 mt-auto">
                                  <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden flex">
                                    <div
                                      className="h-full bg-[#00A3C4]"
                                      style={{ width: `${pctContratadoBarra}%` }}
                                    />
                                    {pctEconomiaBarra > 0 && (
                                      <div
                                        className="h-full bg-emerald-500"
                                        style={{ width: `${pctEconomiaBarra}%` }}
                                      />
                                    )}
                                    {pctFaltaContratarBarra > 0 && (
                                      <div
                                        className="h-full bg-amber-400/80"
                                        style={{ width: `${pctFaltaContratarBarra}%` }}
                                      />
                                    )}
                                    {pctDesvioBarra > 0 && (
                                      <div
                                        className="h-full bg-rose-500"
                                        style={{ width: `${pctDesvioBarra}%` }}
                                      />
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between gap-1 text-[8.5px] text-slate-600 leading-none whitespace-nowrap">
                                    <span className="truncate">
                                      {estourouProjecaoKpi
                                        ? 'Projeção vs. Orçado:'
                                        : economizouKpi
                                        ? 'Economia no Orçado:'
                                        : 'Projeção Total:'}
                                    </span>
                                    {estourouProjecaoKpi ? (
                                      <strong className="text-rose-700 shrink-0">
                                        +{formatCurrency(valorEstouroKpi)}
                                      </strong>
                                    ) : economizouKpi ? (
                                      <strong className="text-emerald-700 shrink-0">
                                        -{formatCurrency(economiaContratadosKpi)}
                                      </strong>
                                    ) : (
                                      <strong className="text-slate-800 shrink-0">
                                        {formatCurrency(pageKpis.custoTotalPrevisto)}
                                      </strong>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Card 3: Valor Medido */}
                              <div
                                className={`h-[88px] px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50/40 flex flex-col justify-between box-border ${
                                  expandedPdfBlocks.kpiMedido ? 'sm:col-span-2' : ''
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-emerald-900 uppercase tracking-wider leading-none">
                                      Valor Medido
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => toggleBlockExpand('kpiMedido')}
                                      className="no-print-btn text-slate-400 hover:text-slate-700"
                                      title="Aumentar/Reduzir card"
                                    >
                                      {expandedPdfBlocks.kpiMedido ? (
                                        <Minimize2 className="h-3 w-3" />
                                      ) : (
                                        <Maximize2 className="h-3 w-3" />
                                      )}
                                    </button>
                                  </div>
                                  <span
                                    className={`font-black text-emerald-700 block mt-1 leading-tight ${
                                      expandedPdfBlocks.kpiMedido ? 'text-lg' : 'text-[14px]'
                                    }`}
                                  >
                                    {formatCurrency(pageKpis.totalMedido)}
                                  </span>
                                </div>
                                <div className="space-y-1 mt-auto">
                                  <div className="w-full h-1.5 rounded-full bg-emerald-200/70 overflow-hidden">
                                    <div
                                      className="h-full bg-emerald-500 rounded-full"
                                      style={{ width: `${pctMedidoBarra}%` }}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between gap-1 text-[8.5px] text-slate-600 leading-none whitespace-nowrap">
                                    <span className="truncate">Avanço Físico:</span>
                                    <strong className="text-emerald-700 shrink-0">{formatPercent(pageKpis.percentualMedido)}</strong>
                                  </div>
                                </div>
                              </div>

                              {/* Card 4: Valor a Medir */}
                              <div
                                className={`h-[88px] px-3 py-2 rounded-xl border border-purple-200 bg-purple-50/40 flex flex-col justify-between box-border ${
                                  expandedPdfBlocks.kpiAMedir ? 'sm:col-span-2' : ''
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-purple-900 uppercase tracking-wider leading-none">
                                      Valor a Medir
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => toggleBlockExpand('kpiAMedir')}
                                      className="no-print-btn text-slate-400 hover:text-slate-700"
                                      title="Aumentar/Reduzir card"
                                    >
                                      {expandedPdfBlocks.kpiAMedir ? (
                                        <Minimize2 className="h-3 w-3" />
                                      ) : (
                                        <Maximize2 className="h-3 w-3" />
                                      )}
                                    </button>
                                  </div>
                                  <span
                                    className={`font-black text-purple-700 block mt-1 leading-tight ${
                                      expandedPdfBlocks.kpiAMedir ? 'text-lg' : 'text-[14px]'
                                    }`}
                                  >
                                    {formatCurrency(pageKpis.saldoAMedir)}
                                  </span>
                                </div>
                                <div className="space-y-1 mt-auto">
                                  <div className="w-full h-1.5 rounded-full bg-purple-200/70 overflow-hidden">
                                    <div
                                      className="h-full bg-purple-500 rounded-full"
                                      style={{ width: `${pctAMedirBarra}%` }}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between gap-1 text-[8.5px] text-slate-600 leading-none whitespace-nowrap">
                                    <span className="truncate">Já Pago (Caixa):</span>
                                    <strong className="text-slate-800 shrink-0">{formatCurrency(pageKpis.totalPago)}</strong>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      if (block.type === 'janela306090') {
                        const janelaCardH = expandedPdfBlocks.pdf306090 ? 104 : 78;
                        return (
                          <div
                            key={`block-306090-${bIdx}`}
                            style={{
                              height: `${
                                expandedPdfBlocks.pdf306090 ? PDF_LAYOUT.janelaExpanded : PDF_LAYOUT.janelaNormal
                              }px`,
                            }}
                            className="flex flex-col justify-between shrink-0 page-break-avoid"
                          >
                            <div
                              style={{ height: '20px', marginBottom: '8px' }}
                              className="flex items-center justify-between border-l-4 border-[#00A3C4] pl-2.5 shrink-0"
                            >
                              <h2 className="text-[11px] font-black uppercase tracking-wider text-[#072B3B] leading-none">
                                2. Previsão de Desembolso: 30 / 60 / 90 Dias
                              </h2>
                              <div className="flex items-center gap-3 text-[9px] text-slate-500">
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-indigo-500" /> Medido / Com NF
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Previsto a Medir
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleBlockExpand('pdf306090')}
                                  className="no-print-btn text-slate-400 hover:text-slate-700"
                                  title="Aumentar/Detalhar 30/60/90 dias"
                                >
                                  {expandedPdfBlocks.pdf306090 ? (
                                    <Minimize2 className="h-3.5 w-3.5" />
                                  ) : (
                                    <Maximize2 className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>

                            <div style={{ height: `${janelaCardH}px` }} className="grid grid-cols-4 gap-2.5 shrink-0">
                              {[
                                { prazo: '30 Dias', item: pageJanela.mes30, destaque: false },
                                { prazo: '60 Dias', item: pageJanela.mes60, destaque: false },
                                { prazo: '90 Dias', item: pageJanela.mes90, destaque: false },
                                {
                                  prazo: 'Total 90 Dias',
                                  item: {
                                    mesSortKey: 'total',
                                    mesFormatado: 'Acumulado',
                                    medidoComNF: pageJanela.total90Dias.medidoComNF,
                                    aMedirPrevisto: pageJanela.total90Dias.aMedirPrevisto,
                                    total: pageJanela.total90Dias.total,
                                  },
                                  destaque: true,
                                },
                              ].map(({ prazo, item, destaque }) => {
                                const pctNF = item.total > 0 ? (item.medidoComNF / item.total) * 100 : 0;
                                const pctAMedir = item.total > 0 ? (item.aMedirPrevisto / item.total) * 100 : 0;

                                return (
                                  <div
                                    key={prazo}
                                    style={{ height: `${janelaCardH}px` }}
                                    className={`px-3 py-2 rounded-xl border flex flex-col justify-between box-border ${
                                      destaque
                                        ? 'border-[#00A3C4]/40 bg-[#00A3C4]/10'
                                        : 'border-slate-200 bg-slate-50/70'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-[9px] font-bold uppercase text-slate-500 leading-none">
                                        {prazo}
                                      </span>
                                      <span className="text-[8.5px] font-extrabold px-1.5 py-0.5 rounded bg-white text-[#072B3B] border border-slate-200 leading-none">
                                        {item.mesFormatado}
                                      </span>
                                    </div>
                                    <div
                                      className={`font-black text-slate-900 leading-tight ${
                                        expandedPdfBlocks.pdf306090 ? 'text-[15px]' : 'text-[13px]'
                                      }`}
                                    >
                                      {formatCurrency(item.total)}
                                    </div>
                                    <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden flex">
                                      <div className="h-full bg-indigo-500" style={{ width: `${pctNF}%` }} />
                                      <div className="h-full bg-amber-500" style={{ width: `${pctAMedir}%` }} />
                                    </div>

                                    {expandedPdfBlocks.pdf306090 && (
                                      <div className="pt-1 border-t border-slate-200 flex justify-between text-[8px] leading-none">
                                        <span className="text-indigo-700 font-bold">
                                          NF: {formatCurrencyShort(item.medidoComNF)}
                                        </span>
                                        <span className="text-amber-700 font-bold">
                                          A Medir: {formatCurrencyShort(item.aMedirPrevisto)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }

                      if (block.type === 'quadroObras') {
                        const cardH = expandedPdfBlocks.pdfQuadroObras
                          ? PDF_LAYOUT.cardExpanded
                          : PDF_LAYOUT.cardNormal;

                        return (
                          <div key={`block-obras-${bIdx}`} className="flex flex-col shrink-0">
                            <div
                              style={{ height: '20px', marginBottom: '8px' }}
                              className="flex items-center justify-between border-l-4 border-[#00A3C4] pl-2.5 shrink-0"
                            >
                              <h2 className="text-[11px] font-black uppercase tracking-wider text-[#072B3B] flex items-center gap-1.5 leading-none">
                                <Building className="h-3.5 w-3.5 text-[#00A3C4]" />
                                {block.isContinuation
                                  ? `3. Quadro Resumo Comparativo por Obra — Continuação (${block.totalCount} obras)`
                                  : `3. Quadro Resumo Comparativo por Obra (${block.totalCount} empreendimentos ativos)`}
                              </h2>
                              <div className="flex items-center gap-3 text-[8.5px] text-slate-500">
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-[#00A3C4]" /> Contratado
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Economia
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-amber-400/80" /> A Contratar
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Desvio
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleBlockExpand('pdfQuadroObras')}
                                  className="no-print-btn text-slate-400 hover:text-slate-700 flex items-center gap-1 text-[10px]"
                                  title="Aumentar/Reduzir altura dos cards de obras"
                                >
                                  {expandedPdfBlocks.pdfQuadroObras ? (
                                    <Minimize2 className="h-3.5 w-3.5" />
                                  ) : (
                                    <Maximize2 className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>

                            <div
                              style={{ gap: `${PDF_LAYOUT.cardGap}px` }}
                              className="flex flex-col shrink-0"
                            >
                              {block.items.map((ob) => {
                                const estourouProjecao =
                                  ob.diferencaOrcamento > 1 || ob.diferencaContratados > 1;
                                const valorEstouro = Math.max(
                                  0,
                                  ob.diferencaOrcamento > 1
                                    ? ob.diferencaOrcamento
                                    : ob.diferencaContratados
                                );
                                const valorEconomia = !estourouProjecao
                                  ? ob.diferencaContratados < -1
                                    ? Math.abs(ob.diferencaContratados)
                                    : ob.economiaContratados
                                  : 0;
                                const economizou = !estourouProjecao && valorEconomia > 1;
                                const contratadoSemDesvio = estourouProjecao
                                  ? Math.max(0, ob.valorContratado - valorEstouro)
                                  : ob.valorContratado;
                                const refMax = Math.max(
                                  ob.orcamentoBase,
                                  contratadoSemDesvio + valorEconomia + ob.faltaContratar + valorEstouro,
                                  1
                                );
                                const pctContratado = Math.min(100, (contratadoSemDesvio / refMax) * 100);
                                const pctEconomia = Math.min(
                                  100 - pctContratado,
                                  (valorEconomia / refMax) * 100
                                );
                                const pctFalta = Math.min(
                                  100 - pctContratado - pctEconomia,
                                  (ob.faltaContratar / refMax) * 100
                                );
                                const pctDesvio = estourouProjecao
                                  ? Math.min(
                                      100 - pctContratado - pctEconomia - pctFalta,
                                      (valorEstouro / refMax) * 100
                                    )
                                  : 0;

                                return (
                                  <div
                                    key={ob.codigo}
                                    style={{ height: `${cardH}px` }}
                                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between box-border overflow-hidden page-break-avoid"
                                  >
                                    <div className="flex items-center justify-between text-[10px] leading-none">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="font-bold text-[#072B3B] truncate">{ob.label}</span>
                                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-slate-200/80 text-slate-700 leading-none shrink-0">
                                          {ob.contratosCount} {ob.contratosCount === 1 ? 'contrato' : 'contratos'}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        {estourouProjecao ? (
                                          <span className="px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-rose-100 text-rose-700 leading-none">
                                            +{formatCurrencyShort(valorEstouro)} projeção vs. orçado
                                          </span>
                                        ) : economizou ? (
                                          <span className="px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-emerald-100 text-emerald-700 leading-none">
                                            -{formatCurrencyShort(valorEconomia)} de economia
                                          </span>
                                        ) : null}
                                        <span className="font-black text-slate-900">
                                          {formatCurrency(ob.totalPrevisto)}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden flex">
                                      {pctContratado > 0 && (
                                        <div
                                          className="h-full bg-[#00A3C4]"
                                          style={{ width: `${pctContratado}%` }}
                                        />
                                      )}
                                      {economizou && pctEconomia > 0 && (
                                        <div
                                          className="h-full bg-emerald-500"
                                          style={{ width: `${pctEconomia}%` }}
                                        />
                                      )}
                                      {ob.faltaContratar > 0 && pctFalta > 0 && (
                                        <div
                                          className="h-full bg-amber-400/75"
                                          style={{ width: `${pctFalta}%` }}
                                        />
                                      )}
                                      {estourouProjecao && pctDesvio > 0 && (
                                        <div
                                          className="h-full bg-rose-500"
                                          style={{ width: `${pctDesvio}%` }}
                                        />
                                      )}
                                    </div>

                                    <div className="flex items-center justify-between text-[8.5px] text-slate-500 leading-none">
                                      <div className="flex items-center gap-2.5">
                                        <span>
                                          Orçado:{' '}
                                          <strong className="text-slate-700">{formatCurrency(ob.orcamentoBase)}</strong>
                                        </span>
                                        <span>
                                          Contratado:{' '}
                                          <strong className="text-[#008EA9]">
                                            {formatCurrency(ob.valorContratado)}
                                          </strong>
                                        </span>
                                        {economizou && (
                                          <span>
                                            Economia:{' '}
                                            <strong className="text-emerald-700">
                                              {formatCurrency(valorEconomia)}
                                            </strong>
                                          </span>
                                        )}
                                        {ob.faltaContratar > 0 && (
                                          <span>
                                            A Contratar:{' '}
                                            <strong className="text-amber-700">
                                              {formatCurrency(ob.faltaContratar)}
                                            </strong>
                                          </span>
                                        )}
                                        {estourouProjecao && (
                                          <span>
                                            Desvio:{' '}
                                            <strong className="text-rose-700">
                                              +{formatCurrency(valorEstouro)}
                                            </strong>
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2.5 shrink-0">
                                        <span>
                                          Medido:{' '}
                                          <strong className="text-emerald-700">
                                            {formatCurrency(ob.valorMedido)}
                                          </strong>{' '}
                                          ({formatPercent(ob.percentualMedidoSobreContratado, 0)})
                                        </span>
                                        <span>
                                          A Medir:{' '}
                                          <strong className="text-purple-700">{formatCurrency(ob.valorAMedir)}</strong>
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }

                      if (block.type === 'disciplinas') {
                        const cardH = expandedPdfBlocks.pdfDisciplinas
                          ? PDF_LAYOUT.cardExpanded
                          : PDF_LAYOUT.cardNormal;

                        return (
                          <div key={`block-disc-${bIdx}`} className="flex flex-col shrink-0">
                            <div
                              style={{ height: '20px', marginBottom: '8px' }}
                              className="flex items-center justify-between border-l-4 border-[#00A3C4] pl-2.5 shrink-0"
                            >
                              <h2 className="text-[11px] font-black uppercase tracking-wider text-[#072B3B] flex items-center gap-1.5 leading-none">
                                <Layers className="h-3.5 w-3.5 text-[#00A3C4]" />
                                {block.isContinuation
                                  ? `3. Consolidação por Disciplina — Continuação (${block.totalCount})`
                                  : `3. Consolidação por Disciplina (Contratado + A Contratar vs. Orçado)`}
                              </h2>
                              <div className="flex items-center gap-3 text-[8.5px] text-slate-500">
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-[#00A3C4]" /> Contratado
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Economia
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-amber-400/80" /> A Contratar
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Desvio
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleBlockExpand('pdfDisciplinas')}
                                  className="no-print-btn text-slate-400 hover:text-slate-700 flex items-center gap-1 text-[10px]"
                                  title="Aumentar/Reduzir altura dos cards de disciplinas"
                                >
                                  {expandedPdfBlocks.pdfDisciplinas ? (
                                    <Minimize2 className="h-3.5 w-3.5" />
                                  ) : (
                                    <Maximize2 className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>

                            <div
                              style={{ gap: `${PDF_LAYOUT.cardGap}px` }}
                              className="flex flex-col shrink-0"
                            >
                              {block.items.map((d) => {
                                const estourouProjecao =
                                  d.diferencaOrcamento > 1 || d.diferencaContratados > 1;
                                const valorEstouro = Math.max(
                                  0,
                                  d.diferencaOrcamento > 1
                                    ? d.diferencaOrcamento
                                    : d.diferencaContratados
                                );
                                const valorEconomia = !estourouProjecao
                                  ? d.diferencaContratados < -1
                                    ? Math.abs(d.diferencaContratados)
                                    : d.economiaContratados
                                  : 0;
                                const economizou = !estourouProjecao && valorEconomia > 1;
                                const contratadoSemDesvio = estourouProjecao
                                  ? Math.max(0, d.valorContratado - valorEstouro)
                                  : d.valorContratado;
                                const refMax = Math.max(
                                  d.orcamentoBase,
                                  contratadoSemDesvio + valorEconomia + d.faltaContratar + valorEstouro,
                                  1
                                );
                                const pctContratado = Math.min(100, (contratadoSemDesvio / refMax) * 100);
                                const pctEconomia = Math.min(
                                  100 - pctContratado,
                                  (valorEconomia / refMax) * 100
                                );
                                const pctFalta = Math.min(
                                  100 - pctContratado - pctEconomia,
                                  (d.faltaContratar / refMax) * 100
                                );
                                const pctDesvio = estourouProjecao
                                  ? Math.min(
                                      100 - pctContratado - pctEconomia - pctFalta,
                                      (valorEstouro / refMax) * 100
                                    )
                                  : 0;
                                const discLabel = d.disciplina === 'Projeto' ? 'Projetos' : d.disciplina;

                                return (
                                  <div
                                    key={d.disciplina}
                                    style={{ height: `${cardH}px` }}
                                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between box-border overflow-hidden page-break-avoid"
                                  >
                                    <div className="flex items-center justify-between text-[10px] leading-none">
                                      <span className="font-bold text-slate-800 truncate">{discLabel}</span>
                                      <div className="flex items-center gap-2 shrink-0">
                                        {estourouProjecao ? (
                                          <span className="px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-rose-100 text-rose-700 leading-none">
                                            +{formatCurrencyShort(valorEstouro)} projeção vs. orçado
                                          </span>
                                        ) : economizou ? (
                                          <span className="px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-emerald-100 text-emerald-700 leading-none">
                                            -{formatCurrencyShort(valorEconomia)} de economia
                                          </span>
                                        ) : null}
                                        <span className="font-black text-slate-900">
                                          {formatCurrency(d.totalPrevisto)}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden flex">
                                      {pctContratado > 0 && (
                                        <div
                                          className="h-full bg-[#00A3C4]"
                                          style={{ width: `${pctContratado}%` }}
                                        />
                                      )}
                                      {economizou && pctEconomia > 0 && (
                                        <div
                                          className="h-full bg-emerald-500"
                                          style={{ width: `${pctEconomia}%` }}
                                        />
                                      )}
                                      {d.faltaContratar > 0 && pctFalta > 0 && (
                                        <div
                                          className="h-full bg-amber-400/75"
                                          style={{ width: `${pctFalta}%` }}
                                        />
                                      )}
                                      {estourouProjecao && pctDesvio > 0 && (
                                        <div
                                          className="h-full bg-rose-500"
                                          style={{ width: `${pctDesvio}%` }}
                                        />
                                      )}
                                    </div>

                                    <div className="flex items-center justify-between text-[8.5px] text-slate-500 leading-none">
                                      <div className="flex items-center gap-3">
                                        <span>
                                          Contratado:{' '}
                                          <strong className="text-[#008EA9]">
                                            {formatCurrency(d.valorContratado)}
                                          </strong>
                                        </span>
                                        {economizou && (
                                          <span>
                                            Economia:{' '}
                                            <strong className="text-emerald-700">
                                              {formatCurrency(valorEconomia)}
                                            </strong>
                                          </span>
                                        )}
                                        {d.faltaContratar > 0 && (
                                          <span>
                                            A Contratar:{' '}
                                            <strong className="text-amber-700">
                                              {formatCurrency(d.faltaContratar)}
                                            </strong>
                                          </span>
                                        )}
                                        {estourouProjecao && (
                                          <span>
                                            Desvio:{' '}
                                            <strong className="text-rose-700">
                                              +{formatCurrency(valorEstouro)}
                                            </strong>
                                          </span>
                                        )}
                                      </div>
                                      <span>
                                        Orçado Base:{' '}
                                        <strong className="text-slate-700">{formatCurrency(d.orcamentoBase)}</strong>
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }

                      if (block.type === 'contratos') {
                        const cardH = expandedPdfBlocks.pdfContratos
                          ? PDF_LAYOUT.cardExpanded
                          : PDF_LAYOUT.cardNormal;

                        return (
                          <div key={`block-ct-${bIdx}`} className="flex flex-col shrink-0">
                            <div
                              style={{ height: '20px', marginBottom: '8px' }}
                              className="flex items-center justify-between border-l-4 border-[#00A3C4] pl-2.5 shrink-0"
                            >
                              <h2 className="text-[11px] font-black uppercase tracking-wider text-[#072B3B] flex items-center gap-1.5 leading-none">
                                <Briefcase className="h-3.5 w-3.5 text-[#00A3C4]" />
                                {block.isContinuation
                                  ? `4. Consolidação dos Contratos — Continuação (${block.totalCount} contratos)`
                                  : `4. Consolidação dos Contratos (Avanço de Medições vs. Saldo a Medir)`}
                              </h2>
                              <div className="flex items-center gap-3 text-[8.5px] text-slate-500">
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Pago
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-indigo-500" /> Medido a Pagar
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Desvio
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleBlockExpand('pdfContratos')}
                                  className="no-print-btn text-slate-400 hover:text-slate-700"
                                  title="Aumentar/Reduzir altura dos cards de contratos"
                                >
                                  {expandedPdfBlocks.pdfContratos ? (
                                    <Minimize2 className="h-3.5 w-3.5" />
                                  ) : (
                                    <Maximize2 className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>

                            <div
                              style={{ gap: `${PDF_LAYOUT.cardGap}px` }}
                              className="flex flex-col shrink-0"
                            >
                              {block.items.map((c) => {
                                const valorDesvioContrato = c.valorDesvio || 0;
                                const temDesvioContrato = valorDesvioContrato > 1;
                                const pctDesvioContrato =
                                  temDesvioContrato && c.valorContrato > 0
                                    ? Math.min(100, (valorDesvioContrato / c.valorContrato) * 100)
                                    : 0;
                                const limiteBase = Math.max(0, 100 - pctDesvioContrato);
                                const pctPago = Math.min(limiteBase, c.percentualPago * 100);
                                const pctAPagar = Math.min(limiteBase - pctPago, c.percentualMedidoAPagar * 100);
                                const pctRestanteBase = Math.max(0, limiteBase - pctPago - pctAPagar);
                                const discLabel = c.disciplina === 'Projeto' ? 'Projetos' : c.disciplina;

                                return (
                                  <div
                                    key={c.id}
                                    style={{ height: `${cardH}px` }}
                                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between box-border overflow-hidden page-break-avoid"
                                  >
                                    <div className="flex items-center justify-between text-[10px] leading-none">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="font-bold text-slate-800 truncate">{c.empresa}</span>
                                        <span className="px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-slate-200 text-slate-700 leading-none shrink-0">
                                          {discLabel}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        {temDesvioContrato && (
                                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-100 text-rose-700 leading-none">
                                            +{formatCurrencyShort(valorDesvioContrato)} desvio
                                          </span>
                                        )}
                                        <span className="font-black text-slate-900">
                                          {formatCurrency(c.valorContrato)}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden flex">
                                      <div className="h-full bg-emerald-500" style={{ width: `${pctPago}%` }} />
                                      <div className="h-full bg-indigo-500" style={{ width: `${pctAPagar}%` }} />
                                      {temDesvioContrato && pctRestanteBase > 0 && (
                                        <div
                                          className="h-full bg-transparent"
                                          style={{ width: `${pctRestanteBase}%` }}
                                        />
                                      )}
                                      {temDesvioContrato && pctDesvioContrato > 0 && (
                                        <div
                                          className="h-full bg-rose-500"
                                          style={{ width: `${pctDesvioContrato}%` }}
                                        />
                                      )}
                                    </div>

                                    <div className="flex items-center justify-between text-[8.5px] text-slate-500 leading-none">
                                      <div className="flex items-center gap-3">
                                        <span>
                                          Medido:{' '}
                                          <strong className="text-emerald-700">
                                            {formatCurrency(c.valorMedidoTotal)}
                                          </strong>{' '}
                                          ({formatPercent(c.percentualMedidoTotal, 0)})
                                        </span>
                                        {temDesvioContrato && (
                                          <span>
                                            Desvio:{' '}
                                            <strong className="text-rose-700">
                                              +{formatCurrency(valorDesvioContrato)}
                                            </strong>
                                          </span>
                                        )}
                                      </div>
                                      <span>
                                        A Medir:{' '}
                                        <strong className="text-purple-700">{formatCurrency(c.valorAMedir)}</strong>
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }

                      if (block.type === 'curvaGrafico') {
                        return (
                          <div
                            key={`block-curva-${bIdx}`}
                            style={{ height: `${PDF_LAYOUT.curvaGrafico}px` }}
                            className="flex flex-col justify-between shrink-0 page-break-avoid"
                          >
                            <div
                              style={{ height: '20px', marginBottom: '8px' }}
                              className="flex items-center justify-between border-l-4 border-[#00A3C4] pl-2.5 shrink-0"
                            >
                              <h2 className="text-[11px] font-black uppercase tracking-wider text-[#072B3B] flex items-center gap-1.5 leading-none">
                                <TrendingUp className="h-3.5 w-3.5 text-[#00A3C4]" />
                                5. Curva S de Desembolso Financeiro
                              </h2>
                              <div className="flex items-center gap-3 text-[9px]">
                                <span className="text-slate-500">
                                  Pago: <strong className="text-emerald-700">{formatCurrency(pageTotaisCurva.pago)}</strong>
                                </span>
                                <span className="text-slate-500">
                                  A Pagar:{' '}
                                  <strong className="text-indigo-600">{formatCurrency(pageTotaisCurva.aPagar)}</strong>
                                </span>
                                <span className="text-slate-500">
                                  A Medir:{' '}
                                  <strong className="text-amber-600">{formatCurrency(pageTotaisCurva.aMedir)}</strong>
                                </span>
                              </div>
                            </div>

                            <div
                              style={{ height: '196px' }}
                              className="p-2.5 rounded-xl border border-slate-200 bg-white box-border shrink-0"
                            >
                              <div className="h-full w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <ComposedChart
                                    data={pageCurva}
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
                                      name="Pago"
                                      fill="#10B981"
                                      isAnimationActive={false}
                                      barSize={11}
                                      radius={[3, 3, 0, 0]}
                                    />
                                    <Bar
                                      yAxisId="left"
                                      dataKey="aPagar"
                                      name="A Pagar (Com NF)"
                                      fill="#6366F1"
                                      isAnimationActive={false}
                                      barSize={11}
                                      radius={[3, 3, 0, 0]}
                                    />
                                    <Bar
                                      yAxisId="left"
                                      dataKey="aMedir"
                                      name="A Medir"
                                      fill="#F59E0B"
                                      isAnimationActive={false}
                                      barSize={11}
                                      radius={[3, 3, 0, 0]}
                                    />
                                    <Line
                                      yAxisId="right"
                                      type="monotone"
                                      dataKey="acumuladoTotal"
                                      name="Acumulado"
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
                        );
                      }

                      if (block.type === 'curvaDesembolso') {
                        return (
                          <div key={`block-curva-tb-${bIdx}`} className="flex flex-col shrink-0 page-break-avoid">
                            <div
                              style={{ height: '20px', marginBottom: '8px' }}
                              className="flex items-center justify-between border-l-4 border-[#00A3C4] pl-2.5 shrink-0"
                            >
                              <h2 className="text-[11px] font-black uppercase tracking-wider text-[#072B3B] flex items-center gap-1.5 leading-none">
                                <Calendar className="h-3.5 w-3.5 text-[#00A3C4]" />
                                {block.isContinuation
                                  ? '6. Cronograma Mensal de Desembolso — Continuação'
                                  : '6. Cronograma Mensal de Desembolso'}
                              </h2>
                            </div>

                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                              <table className="w-full text-[9px] border-collapse">
                                <thead className="bg-[#072B3B] text-white font-bold">
                                  <tr style={{ height: '26px' }}>
                                    <th className="px-2.5 text-left">Mês</th>
                                    <th className="px-2.5 text-right">Pago</th>
                                    <th className="px-2.5 text-right text-indigo-200">A Pagar (NF)</th>
                                    <th className="px-2.5 text-right text-amber-200">A Medir</th>
                                    <th className="px-2.5 text-right">Total Mês</th>
                                    <th className="px-2.5 text-right">Acumulado</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {block.items.map((p) => (
                                    <tr
                                      key={p.mesSortKey || p.mes}
                                      style={{ height: `${PDF_LAYOUT.tableRow}px` }}
                                      className="even:bg-slate-50/50"
                                    >
                                      <td className="px-2.5 font-semibold text-slate-800">{p.mesFormatado}</td>
                                      <td className="px-2.5 text-right text-emerald-700 font-semibold">
                                        {(p.pago || 0) > 0 ? formatCurrency(p.pago || 0) : '-'}
                                      </td>
                                      <td className="px-2.5 text-right text-indigo-700 font-semibold">
                                        {(p.aPagar || 0) > 0 ? formatCurrency(p.aPagar || 0) : '-'}
                                      </td>
                                      <td className="px-2.5 text-right text-amber-700 font-semibold">
                                        {(p.aMedir || 0) > 0 ? formatCurrency(p.aMedir || 0) : '-'}
                                      </td>
                                      <td className="px-2.5 text-right font-bold text-slate-900">
                                        {formatCurrency(p.total)}
                                      </td>
                                      <td className="px-2.5 text-right font-bold text-[#008EA9]">
                                        {formatCurrency(p.acumuladoTotal)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      }

                      if (block.type === 'ocorrencias') {
                        return (
                          <div key={`block-oc-${bIdx}`} className="flex flex-col shrink-0 page-break-avoid">
                            <div
                              style={{ height: '20px', marginBottom: '8px' }}
                              className="flex items-center justify-between border-l-4 border-[#00A3C4] pl-2.5 shrink-0"
                            >
                              <h2 className="text-[11px] font-black uppercase tracking-wider text-[#072B3B] leading-none">
                                {block.isContinuation
                                  ? '7. Ocorrências Contratuais (Aditivos & Distratos) — Continuação'
                                  : '7. Ocorrências Contratuais (Aditivos & Distratos)'}
                              </h2>
                            </div>
                            {block.items.length > 0 && (
                              <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <table className="w-full text-[9px] border-collapse">
                                  <thead className="bg-slate-100 text-slate-700 font-bold">
                                    <tr style={{ height: '26px' }}>
                                      <th className="px-2 text-left">Fornecedor</th>
                                      <th className="px-2 text-center">Aditivo</th>
                                      <th className="px-2 text-center">Data</th>
                                      <th className="px-2 text-right">Valor</th>
                                      <th className="px-2 text-left">Motivo</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {block.items.map((a) => (
                                      <tr key={a.id} style={{ height: `${PDF_LAYOUT.tableRow}px` }}>
                                        <td className="px-2 font-medium">{a.empresa}</td>
                                        <td className="px-2 text-center font-bold">#{a.numero}</td>
                                        <td className="px-2 text-center">{formatDateBR(a.data)}</td>
                                        <td className="px-2 text-right font-bold">{formatCurrency(a.valor)}</td>
                                        <td className="px-2 text-slate-600 truncate max-w-xs">{a.descricao}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        );
                      }

                      return null;
                    })}
                  </div>

                  {/* 3. RODAPÉ FIXO NO FINAL DA PÁGINA (SEMPRE NO MESMO ESPAÇO DEDICADO) */}
                  <div
                    style={{ height: '20px', marginTop: '16px' }}
                    className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[8.5px] text-slate-400 shrink-0 box-border page-break-avoid"
                  >
                    <span>Emitido em {dataAtual} às {horaAtual}</span>
                    <span className="font-semibold text-slate-500">
                      Página {pageNumber} de {totalPages}
                    </span>
                  </div>
                </div>
              );
            })}
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
