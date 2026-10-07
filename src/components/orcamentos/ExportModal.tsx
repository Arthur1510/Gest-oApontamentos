"use client";

import React from 'react';
import {
  ItemOrcamento,
  Contrato,
  Medicao,
  CurvaDesembolsoPonto,
} from '@/types/orcamento';
import { Button } from '@/components/ui/button';
import {
  X,
  Download,
  FileSpreadsheet,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Database,
  Trash2,
  FileText,
  Cloud,
  CloudUpload,
  CloudDownload,
  RefreshCw,
} from 'lucide-react';

interface ExportModalProps {
  orcamentos: ItemOrcamento[];
  contratos: Contrato[];
  medicoes: Medicao[];
  curvaPontos: CurvaDesembolsoPonto[];
  isOpen: boolean;
  onClose: () => void;
  onAbrirRelatorioPdf?: () => void;
  onExportarExcelConsolidado?: () => void;
  isSupabaseConfigured?: boolean;
}

export function ExportModal({
  orcamentos,
  contratos,
  medicoes,
  curvaPontos,
  isOpen,
  onClose,
  onAbrirRelatorioPdf,
  onExportarExcelConsolidado,
  isSupabaseConfigured = false,
}: ExportModalProps) {
  if (!isOpen) return null;

  // Função auxiliar para download de CSV com BOM para Excel no Windows
  const downloadCsv = (filename: string, headers: string[], rows: (string | number | null | undefined)[][]) => {
    const csvContent =
      '\uFEFF' +
      [
        headers.join(';'),
        ...rows.map((row) =>
          row
            .map((val) => {
              if (val === null || val === undefined) return '';
              const str = String(val).replace(/"/g, '""');
              return `"${str}"`;
            })
            .join(';')
        ),
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportOrcamentos = () => {
    const headers = [
      'OBRA',
      'NOME OBRA',
      'CATEGORIA',
      'DISCIPLINA',
      'SUBDISCIPLINA',
      'ORCAMENTO BASE',
      'VALOR CONTRATADO',
      'SALDO A CONTRATAR',
      'VALOR MEDIDO',
      'SALDO MEDICAO',
      'STATUS',
    ];
    const rows = orcamentos.map((o) => [
      o.obra,
      o.nome_obra || '',
      o.categoria || 'Projeto',
      o.disciplina,
      o.subdisciplina,
      o.orcamento_base.toFixed(2),
      o.valor_contratado.toFixed(2),
      o.saldo_a_contratar.toFixed(2),
      o.valor_medido.toFixed(2),
      o.saldo_medicao.toFixed(2),
      o.status,
    ]);
    downloadCsv('tbOrcamento_export.csv', headers, rows);
  };

  const handleExportContratos = () => {
    const headers = [
      'CONTRATO_ID',
      'NUM SIENGE',
      'EMPRESA',
      'OBRA',
      'CATEGORIA',
      'DISCIPLINA',
      'SUBDISCIPLINA',
      'VALOR CONTRATO',
      'VALOR MEDIDO',
      'SALDO A MEDIR',
      'PERCENTUAL MEDIDO',
    ];
    const rows = contratos.map((c) => [
      c.id,
      c.num_sienge,
      c.empresa,
      c.obra,
      c.categoria || 'Projeto',
      c.disciplina,
      c.subdisciplina,
      c.valor_contrato.toFixed(2),
      c.valor_medido.toFixed(2),
      c.saldo_a_medir.toFixed(2),
      (c.percentual_medido * 100).toFixed(2) + '%',
    ]);
    downloadCsv('tbContratos_export.csv', headers, rows);
  };

  const handleExportMedicoes = () => {
    const headers = [
      'ID_MEDICAO',
      'CONTRATO_ID',
      'EMPRESA',
      'OBRA',
      'ETAPA',
      'PERCENTUAL',
      'DATA PREVISTA',
      'DATA MEDICAO',
      'DATA REFERENCIA',
      'MES COMPETENCIA',
      'VALOR MEDICAO',
      'STATUS',
      'NF',
      'DATA PAGAMENTO',
    ];
    const rows = medicoes.map((m) => [
      m.id,
      m.contrato_id,
      m.empresa,
      m.obra,
      m.etapa,
      (m.percentual * 100).toFixed(2) + '%',
      m.data_prevista || '',
      m.data_medicao || '',
      m.data_referencia || '',
      m.mes_competencia,
      m.valor_medicao.toFixed(2),
      m.status,
      m.nf || '',
      m.data_pagamento || '',
    ]);
    downloadCsv('tbMedicoes_export.csv', headers, rows);
  };

  const handleExportCurva = () => {
    const headers = [
      'MES',
      'MES_FORMATADO',
      'PAGO',
      'A_PAGAR_COM_NF',
      'A_MEDIR_SEM_NF',
      'TOTAL_MES',
      'ACUMULADO_TOTAL',
    ];
    const rows = curvaPontos.map((p) => [
      p.mes,
      p.mesFormatado,
      (p.pago || 0).toFixed(2),
      (p.aPagar || 0).toFixed(2),
      (p.aMedir || 0).toFixed(2),
      p.total.toFixed(2),
      p.acumuladoTotal.toFixed(2),
    ]);
    downloadCsv('CurvaDesembolso_export.csv', headers, rows);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-0">
      <div className="bg-white dark:bg-[#072B3B] rounded-2xl border border-slate-200 dark:border-[#0B384D] max-w-md w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-[#0B384D] flex items-center justify-between bg-slate-50/50 dark:bg-[#072432]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00A3C4]/15 text-[#00A3C4] dark:text-[#00C4EB]">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Exportar Relatórios &amp; Dados
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gere documentos executivos em PDF e planilhas compatíveis com o Excel
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Seção Destaque: Relatório Executivo PDF & Excel com Dashboard */}
          <div className="p-4 rounded-xl border-2 border-[#00A3C4]/30 bg-gradient-to-br from-[#00A3C4]/10 via-slate-50 to-slate-100 dark:from-[#00A3C4]/15 dark:via-[#072B3B] dark:to-[#072432] space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#00A3C4] text-white">
                <FileSpreadsheet className="h-4 w-4" />
              </span>
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                  Relatório Executivo PDF &amp; Pasta de Trabalho Excel
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Documento formal pronto para diretoria e arquivo Excel completo com Dashboard e 6 planilhas integradas.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {onAbrirRelatorioPdf && (
                <Button
                  onClick={() => {
                    onAbrirRelatorioPdf();
                    onClose();
                  }}
                  className="bg-[#00A3C4] hover:bg-[#008EA9] text-white font-bold text-xs h-9 rounded-xl gap-2 shadow-xs justify-start"
                >
                  <FileText className="h-4 w-4" />
                  Abrir Relatório Executivo PDF (A4)
                </Button>
              )}

              {onExportarExcelConsolidado && (
                <Button
                  onClick={() => {
                    onExportarExcelConsolidado();
                    onClose();
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 rounded-xl gap-2 shadow-xs justify-start"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Baixar Excel Completo (.xlsx)
                </Button>
              )}
            </div>
          </div>

          {/* Seção de Exportação CSV Individual */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Tabelas Individuais CSV (Compatíveis com Microsoft Excel)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportOrcamentos}
                className="justify-start gap-2 text-xs border-slate-200 dark:border-[#0B384D] hover:bg-slate-50 dark:hover:bg-[#0B384D] h-9"
              >
                <Download className="h-3.5 w-3.5 text-[#00A3C4]" />
                tbOrçamento ({orcamentos.length})
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportContratos}
                className="justify-start gap-2 text-xs border-slate-200 dark:border-[#0B384D] hover:bg-slate-50 dark:hover:bg-[#0B384D] h-9"
              >
                <Download className="h-3.5 w-3.5 text-[#00A3C4]" />
                tbContratos ({contratos.length})
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportMedicoes}
                className="justify-start gap-2 text-xs border-slate-200 dark:border-[#0B384D] hover:bg-slate-50 dark:hover:bg-[#0B384D] h-9"
              >
                <Download className="h-3.5 w-3.5 text-[#00A3C4]" />
                tbMedições ({medicoes.length})
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCurva}
                className="justify-start gap-2 text-xs border-slate-200 dark:border-[#0B384D] hover:bg-slate-50 dark:hover:bg-[#0B384D] h-9"
              >
                <Download className="h-3.5 w-3.5 text-[#00A3C4]" />
                Curva Desembolso
              </Button>
            </div>
          </div>

          {/* Status do Banco de Dados Supabase */}
          <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#00A3C4]/15 text-[#00A3C4]">
                <Database className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Banco de Dados Supabase
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Todas as operações são salvas diretamente no banco em tempo real.
                </p>
              </div>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 ${
                isSupabaseConfigured
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-500/20 text-slate-600'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              {isSupabaseConfigured ? 'Conectado' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-[#0B384D] flex justify-end bg-slate-50/50 dark:bg-[#072432]">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
