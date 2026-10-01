"use client";

import React, { useRef, useMemo } from 'react';
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
  Download,
  FileSpreadsheet,
  Building,
  TrendingUp,
  DollarSign,
  Briefcase,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShieldCheck,
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

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Relatorio_Executivo_Orcamentos_WCC_${filtroObra || 'Consolidado'}_${new Date().toISOString().slice(0, 10)}`,
  });

  if (!isOpen) return null;

  // Filtrar contratos e aditivos relevantes
  const contratosFiltrados = contratos.filter((c) => {
    if (filtroObra && c.obra !== filtroObra) return false;
    if (filtroFornecedor && c.empresa !== filtroFornecedor) return false;
    return true;
  });

  const todosAditivos = contratosFiltrados.flatMap((c) =>
    (c.aditivos || []).map((a) => ({ ...a, empresa: c.empresa, obra: c.obra }))
  );

  const contratosDistratados = contratosFiltrados.filter((c) => c.status === 'Distratado');

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in-0">
      <div className="bg-white dark:bg-[#072B3B] rounded-2xl border border-slate-200 dark:border-[#0B384D] max-w-5xl w-full max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Barra Superior de Ações (Não impressa) */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-[#0B384D] flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-[#072432]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#00A3C4]/15 text-[#00A3C4] dark:text-[#00C4EB]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
                Relatório Executivo Consolidado
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visualização e exportação para PDF (impressão A4) e Excel com múltiplas abas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleExportarExcelConsolidado}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 rounded-xl gap-1.5 shadow-xs"
            >
              <FileSpreadsheet className="h-4 w-4" /> Exportar Excel Completo (.xls)
            </Button>

            <Button
              size="sm"
              onClick={() => handlePrint()}
              className="bg-[#00A3C4] hover:bg-[#008EA9] text-white font-bold text-xs h-9 rounded-xl gap-1.5 shadow-xs"
            >
              <Printer className="h-4 w-4" /> Imprimir / Salvar PDF
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

        {/* Área de Visualização e Impressão (Papel A4) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 dark:bg-slate-950/60">
          <div
            ref={contentRef}
            className="bg-white text-slate-900 mx-auto p-6 sm:p-10 shadow-lg border border-slate-200 rounded-xl max-w-[210mm] text-xs font-sans print:shadow-none print:border-none print:m-0 print:p-6 print:max-w-none print:w-full"
          >
            {/* 1. CABEÇALHO EXECUTIVO WCC */}
            <div className="border-b-2 border-[#00A3C4] pb-4 mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-black tracking-widest px-2 py-0.5 rounded bg-[#072B3B] text-white uppercase">
                    WCC ENGENHARIA &amp; DESENVOLVIMENTO
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">
                    Gestão de Custos &amp; Contratos
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-[#072B3B] tracking-tight mt-1.5">
                  RELATÓRIO EXECUTIVO CONSOLIDADO
                </h1>
                <p className="text-xs font-semibold text-[#008EA9] mt-0.5">
                  Escopo: {obraSelecionadaNome}
                </p>
              </div>

              <div className="text-right text-[11px] text-slate-500 space-y-0.5">
                <p><strong>Emissão:</strong> {dataAtual} às {horaAtual}</p>
                <p><strong>Status Contratos:</strong> {contratosFiltrados.length} listados</p>
                <p><strong>Medições:</strong> {medicoes.length} marcos</p>
              </div>
            </div>

            {/* 2. PAINEL DE KPIS EXECUTIVOS */}
            <div className="mb-6">
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

            {/* 3. QUADRO RESUMO DE CONTRATOS */}
            <div className="mb-6">
              <h2 className="text-xs font-black uppercase tracking-wider text-[#072B3B] mb-2 border-l-4 border-[#00A3C4] pl-2">
                2. Relação de Contratos Vigentes ({contratosFiltrados.length})
              </h2>

              {contratosFiltrados.length === 0 ? (
                <p className="text-slate-500 italic py-2">Nenhum contrato cadastrado para este escopo.</p>
              ) : (
                <table className="w-full text-[10px] border-collapse border border-slate-200">
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
                      <th className="p-1.5 text-center">%</th>
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
                      <td colSpan={7} className="p-1.5 uppercase text-left">Totais:</td>
                      <td className="p-1.5 text-right font-mono">{formatCurrency(kpis.totalContratado)}</td>
                      <td className="p-1.5 text-right font-mono text-emerald-700">{formatCurrency(kpis.totalMedido)}</td>
                      <td className="p-1.5 text-right font-mono text-purple-700">{formatCurrency(kpis.saldoAMedir)}</td>
                      <td className="p-1.5 text-center font-mono text-[#00A3C4]">{formatPercent(kpis.percentualMedido)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>

            {/* 4. QUADRO DE OCORRÊNCIAS (ADITIVOS E DISTRATOS) */}
            {(todosAditivos.length > 0 || contratosDistratados.length > 0) && (
              <div className="mb-6">
                <h2 className="text-xs font-black uppercase tracking-wider text-[#072B3B] mb-2 border-l-4 border-[#00A3C4] pl-2">
                  3. Ocorrências Contratuais (Aditivos &amp; Distratos)
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

            {/* 5. CURVA DE DESEMBOLSO MÊS A MÊS */}
            {curvaPontos.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xs font-black uppercase tracking-wider text-[#072B3B] mb-2 border-l-4 border-[#00A3C4] pl-2">
                  4. Cronograma &amp; Curva de Desembolso Financeiro S (Competências)
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
                    {curvaPontos.slice(0, 12).map((p) => (
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

            {/* 6. ASSINATURAS E RESPONSABILIDADES */}
            <div className="pt-8 mt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-[10px] text-slate-600">
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
          </div>
        </div>

        {/* Footer do Modal */}
        <div className="p-3 border-t border-slate-200 dark:border-[#0B384D] flex justify-end bg-slate-50 dark:bg-[#072432]">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs h-9 rounded-xl"
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
