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
} from 'lucide-react';

interface ExportModalProps {
  orcamentos: ItemOrcamento[];
  contratos: Contrato[];
  medicoes: Medicao[];
  curvaPontos: CurvaDesembolsoPonto[];
  isOpen: boolean;
  onClose: () => void;
  onResetarDadosPadrao: () => void;
}

export function ExportModal({
  orcamentos,
  contratos,
  medicoes,
  curvaPontos,
  isOpen,
  onClose,
  onResetarDadosPadrao,
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
      'PREVISTO',
      'REALIZADO',
      'TOTAL_MES',
      'ACUMULADO_PREVISTO',
      'ACUMULADO_REALIZADO',
      'ACUMULADO_TOTAL',
    ];
    const rows = curvaPontos.map((p) => [
      p.mes,
      p.mesFormatado,
      p.previsto.toFixed(2),
      p.realizado.toFixed(2),
      p.total.toFixed(2),
      p.acumuladoPrevisto.toFixed(2),
      p.acumuladoRealizado.toFixed(2),
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
                Exportar & Restaurar Dados
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gere arquivos compatíveis com o Excel ou restaure a planilha original
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
          {/* Seção de Exportação */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Downloads CSV (Compatíveis com Microsoft Excel)
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

          {/* Seção Supabase Database */}
          <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 space-y-2">
            <div className="flex items-center gap-2 text-[#008EA9] dark:text-[#00C4EB] font-bold text-xs">
              <Database className="h-4 w-4" />
              Banco de Dados Supabase (Schema & Seed SQL)
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              O schema relacional atualizado com categorias (<strong className="text-slate-800 dark:text-slate-100">Projeto</strong> e <strong className="text-slate-800 dark:text-slate-100">Legalização</strong>) e status simplificados (<code className="text-[11px] font-mono">A Medir, Medido, Pago, Cancelado</code>) está em <code className="text-[11px] font-mono font-bold">schema.sql</code>. A carga completa idempotente dos dados saneados está em <code className="text-[11px] font-mono font-bold">seed_orcamentos.sql</code>.
            </p>
          </div>

          {/* Seção Restaurar Planilha Original WCC */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs">
              <AlertTriangle className="h-4 w-4" />
              Restaurar Planilha Original WCC
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Recarrega integralmente todos os 113 itens de orçamento, 61 contratos e 222 medições com o modelo padronizado.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm('Tem certeza de que deseja restaurar os dados iniciais saneados da planilha WCC?')) {
                  onResetarDadosPadrao();
                  onClose();
                }
              }}
              className="text-xs border-amber-500/30 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 gap-2 h-8"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Restaurar Dados Iniciais da Planilha
            </Button>
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
