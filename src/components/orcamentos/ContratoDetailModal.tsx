"use client";

import React, { useState, useMemo } from 'react';
import {
  Contrato,
  Medicao,
  STATUS_MEDICAO_COLORS,
  STATUS_CONTRATO_COLORS,
} from '@/types/orcamento';
import { formatCurrency, formatPercent, formatDateBR, parseMesCompetencia } from '@/lib/orcamento-utils';
import { Button } from '@/components/ui/button';
import {
  X,
  Briefcase,
  Calendar,
  CheckCircle2,
  PlusCircle,
  Building,
  Layers,
  Hash,
  FilePlus2,
  FileX2,
  AlertTriangle,
  RotateCcw,
  Trash2,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
} from 'lucide-react';

interface ContratoDetailModalProps {
  contrato: Contrato | null;
  medicoes: Medicao[];
  isOpen: boolean;
  onClose: () => void;
  onNovaMedicaoParaContrato: (contrato: Contrato) => void;
  onEditarMedicao: (medicao: Medicao) => void;
  onAbrirAditivo?: (contrato: Contrato) => void;
  onAbrirDistrato?: (contrato: Contrato) => void;
  onExcluirAditivo?: (contratoId: string, aditivoId: string) => void;
  onReverterDistrato?: (contratoId: string) => void;
}

/**
 * Normaliza qualquer formato de data ou competência para um timestamp em milissegundos (UTC).
 * Lida com:
 * - ISO "YYYY-MM-DD" e "YYYY-MM-DDTHH:mm:ss"
 * - Padrão brasileiro "DD/MM/AAAA" e "DD-MM-AAAA"
 * - Padrão brasileiro abreviado "DD/MM/AA"
 * - Ano-mês "YYYY-MM"
 * - Competência "AA/MM" (ex: "25/05", "26/02") ou "MM/AA" (ex: "05/25")
 * Ignora valores sentinelas como "00/01", "-", "N/I".
 */
function normalizeDateToTimestamp(raw: string | null | undefined): number | null {
  if (!raw || typeof raw !== 'string') return null;
  const s = raw.trim();
  if (!s || s === '-' || s === 'N/I' || s === '00/01' || s.startsWith('00/')) return null;

  // 1. Formato ISO completo ou com timestamp: "YYYY-MM-DD" ou "YYYY-MM-DDTHH:mm:ss"
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const parts = s.split('T')[0].split('-').map(Number);
    const ano = parts[0];
    const mes = parts[1];
    const dia = parts[2];
    if (ano > 1990 && mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31) {
      return Date.UTC(ano, mes - 1, dia);
    }
  }

  // 2. Formato brasileiro de data completa: "DD/MM/YYYY" ou "DD-MM-YYYY"
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(s)) {
    const parts = s.split(/[\/\-]/).map(Number);
    const dia = parts[0];
    const mes = parts[1];
    const ano = parts[2];
    if (ano > 1990 && mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31) {
      return Date.UTC(ano, mes - 1, dia);
    }
  }

  // 3. Formato brasileiro abreviado: "DD/MM/YY"
  if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2}$/.test(s)) {
    const parts = s.split(/[\/\-]/).map(Number);
    const dia = parts[0];
    const mes = parts[1];
    const ano = 2000 + parts[2];
    if (mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31) {
      return Date.UTC(ano, mes - 1, dia);
    }
  }

  // 4. Formato "YYYY-MM"
  if (/^\d{4}-\d{2}$/.test(s)) {
    const parts = s.split('-').map(Number);
    const ano = parts[0];
    const mes = parts[1];
    if (ano > 1990 && mes >= 1 && mes <= 12) {
      return Date.UTC(ano, mes - 1, 1);
    }
  }

  // 5. Formato de competência "AA/MM" ou "MM/AA" (ex: "26/02", "25/05")
  if (/^\d{2}\/\d{2}$/.test(s)) {
    const [p1, p2] = s.split('/').map(Number);
    if (p1 === 0 && p2 === 1) return null; // "00/01" não é data válida
    let ano = p1;
    let mes = p2;
    // Se invertido: ex "05/25" -> mes 05, ano 25
    if (p1 <= 12 && p2 > 12) {
      mes = p1;
      ano = p2;
    }
    const anoCompleto = ano < 100 ? 2000 + ano : ano;
    if (anoCompleto > 1990 && mes >= 1 && mes <= 12) {
      return Date.UTC(anoCompleto, mes - 1, 1);
    }
  }

  return null;
}

/**
 * Retorna o timestamp representativo da medição em ordem cronológica de ocorrência/previsão:
 * 1. data_medicao: se a medição já ocorreu, a data real é o marco cronológico primário.
 * 2. data_prevista: se ainda não ocorreu, o marco planejado é a previsão.
 * 3. data_referencia: data de referência caso definida.
 * 4. data_pagamento: data de pagamento caso informada.
 * 5. mes_competencia: competência (convertida com ano e mês válidos).
 */
function getMedicaoTimestamp(m: Medicao): number | null {
  if (m.data_medicao) {
    const ts = normalizeDateToTimestamp(m.data_medicao);
    if (ts !== null) return ts;
  }
  if (m.data_prevista) {
    const ts = normalizeDateToTimestamp(m.data_prevista);
    if (ts !== null) return ts;
  }
  if (m.data_referencia) {
    const ts = normalizeDateToTimestamp(m.data_referencia);
    if (ts !== null) return ts;
  }
  if (m.data_pagamento) {
    const ts = normalizeDateToTimestamp(m.data_pagamento);
    if (ts !== null) return ts;
  }
  if (m.mes_competencia && m.mes_competencia !== '00/01' && !m.mes_competencia.startsWith('00/')) {
    const ts = normalizeDateToTimestamp(m.mes_competencia);
    if (ts !== null) return ts;
  }
  return null;
}

export function ContratoDetailModal({
  contrato,
  medicoes,
  isOpen,
  onClose,
  onNovaMedicaoParaContrato,
  onEditarMedicao,
  onAbrirAditivo,
  onAbrirDistrato,
  onExcluirAditivo,
  onReverterDistrato,
}: ContratoDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'medicoes' | 'aditivos'>('medicoes');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Medições ordenadas cronologicamente de forma real por Ano, Mês e Dia
  const medicoesDoContrato = useMemo(() => {
    if (!contrato) return [];
    const cId = String(contrato.id).trim().toUpperCase();
    return [...medicoes]
      .filter((m) => String(m.contrato_id).trim().toUpperCase() === cId)
      .sort((a, b) => {
        const tsA = getMedicaoTimestamp(a);
        const tsB = getMedicaoTimestamp(b);

        // Itens sem data válida são posicionados ao final da lista
        if (tsA === null && tsB !== null) return 1;
        if (tsA !== null && tsB === null) return -1;

        if (tsA !== null && tsB !== null && tsA !== tsB) {
          return sortDirection === 'asc' ? tsA - tsB : tsB - tsA;
        }

        // Desempate por etapa (ex: "1ª Parcela", "Etapa 01", "Etapa 02") com ordenação numérica natural
        const etapaComp = (a.etapa || '').localeCompare(b.etapa || '', undefined, { numeric: true });
        if (etapaComp !== 0) {
          return sortDirection === 'asc' ? etapaComp : -etapaComp;
        }

        return a.id.localeCompare(b.id);
      });
  }, [medicoes, contrato?.id, sortDirection]);

  if (!isOpen || !contrato) return null;

  const pct = contrato.percentual_medido || 0;
  const isDistratado = contrato.status === 'Distratado';
  const statusColor = STATUS_CONTRATO_COLORS[contrato.status || 'Ativo'] || STATUS_CONTRATO_COLORS['Ativo'];
  const aditivos = contrato.aditivos || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-0">
      <div className="bg-white dark:bg-[#072B3B] rounded-2xl border border-slate-200 dark:border-[#0B384D] max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[#0B384D] flex items-start sm:items-center justify-between gap-3 bg-slate-50/70 dark:bg-[#072432]">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#00A3C4]/15 text-[#00A3C4] dark:text-[#00C4EB] shrink-0 mt-0.5 sm:mt-0">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-[#0B384D] font-bold text-slate-800 dark:text-slate-100">
                  {contrato.id}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${statusColor.bg} ${statusColor.text} border ${statusColor.border}`}>
                  {contrato.status || 'Ativo'}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#00A3C4]/15 text-[#008EA9] dark:text-[#00C4EB]">
                  {contrato.categoria || 'Projeto'}
                </span>
              </div>
              <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg break-words mt-1 leading-tight">
                {contrato.empresa}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words">
                Obra: <strong className="text-slate-700 dark:text-slate-200">{contrato.obra}</strong> | {contrato.disciplina} • {contrato.subdisciplina} {contrato.num_sienge ? `| Nº Sienge: ${contrato.num_sienge}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Banner de Distrato (se houver) */}
        {isDistratado && (
          <div className="bg-rose-500/10 border-b border-rose-500/30 p-3.5 sm:px-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-rose-800 dark:text-rose-300">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <span className="font-bold">Contrato Distratado em {formatDateBR(contrato.distrato?.data)}</span>
                <p className="text-[11px] opacity-90 mt-0.5">
                  Motivo: {contrato.distrato?.motivo || 'Rescisão formal'} {contrato.distrato?.observacoes ? `• ${contrato.distrato.observacoes}` : ''}
                </p>
              </div>
            </div>
            {onReverterDistrato && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReverterDistrato(contrato.id)}
                className="text-xs font-bold h-7 rounded-lg border-rose-400 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/40 gap-1 self-end sm:self-center"
              >
                <RotateCcw className="h-3 w-3" /> Reativar Contrato
              </Button>
            )}
          </div>
        )}

        {/* Resumo Financeiro do Contrato */}
        <div className="p-3.5 sm:p-5 border-b border-slate-100 dark:border-[#0B384D] grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 bg-white dark:bg-[#072B3B]">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B384D]">
            <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block">
              Valor Vigente
            </span>
            <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white block mt-0.5 font-mono">
              {formatCurrency(contrato.valor_contrato)}
            </span>
            {aditivos.length > 0 && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                Orig: {formatCurrency(contrato.valor_original)} (+{aditivos.length} adit.)
              </span>
            )}
            {isDistratado && contrato.valor_original && contrato.valor_original !== contrato.valor_contrato && (
              <span className="text-[10px] text-rose-500 font-bold block mt-0.5">
                Orig: {formatCurrency(contrato.valor_original)} (Encerrado)
              </span>
            )}
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
            <span className="text-[10px] font-bold uppercase block opacity-80">
              Valor Medido
            </span>
            <span className="text-sm sm:text-base font-extrabold block mt-0.5 font-mono">
              {formatCurrency(contrato.valor_medido)}
            </span>
            <span className="text-[10px] opacity-75 block mt-0.5">
              {medicoesDoContrato.length} lançamentos
            </span>
          </div>

          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-400">
            <span className="text-[10px] font-bold uppercase block opacity-80">
              Saldo a Medir
            </span>
            <span className="text-sm sm:text-base font-extrabold block mt-0.5 font-mono">
              {formatCurrency(contrato.saldo_a_medir)}
            </span>
            {isDistratado && (
              <span className="text-[10px] text-rose-500 font-bold block mt-0.5">
                Encerrado por distrato
              </span>
            )}
          </div>

          <div className="p-3 rounded-xl bg-[#00A3C4]/10 text-[#008EA9] dark:text-[#00C4EB]">
            <span className="text-[10px] font-bold uppercase block opacity-80">
              Avanço Físico
            </span>
            <span className="text-sm sm:text-base font-extrabold block mt-0.5 font-mono">
              {formatPercent(pct)}
            </span>
            <span className="text-[10px] opacity-75 block mt-0.5">
              {pct >= 1 ? 'Integralmente medido' : 'Em andamento'}
            </span>
          </div>
        </div>

        {/* Barra de Progresso Físico */}
        <div className="px-3.5 sm:px-5 pt-3">
          <div className="w-full bg-slate-100 dark:bg-[#0B384D] h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                pct >= 1 ? 'bg-emerald-500' : 'bg-[#00A3C4]'
              }`}
              style={{ width: `${Math.min(100, Math.round(pct * 100))}%` }}
            />
          </div>
        </div>

        {/* Navegação entre Abas do Contrato */}
        <div className="px-3.5 sm:px-5 pt-3 border-b border-slate-200 dark:border-[#0B384D] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('medicoes')}
              className={`pb-2 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'medicoes'
                  ? 'border-[#00A3C4] text-[#00A3C4]'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Medições & Etapas ({medicoesDoContrato.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('aditivos')}
              className={`pb-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'aditivos'
                  ? 'border-[#00A3C4] text-[#00A3C4]'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FilePlus2 className="h-3.5 w-3.5" />
              Termos Aditivos ({aditivos.length})
            </button>
          </div>

          <div className="pb-2 flex items-center gap-1.5">
            {onAbrirAditivo && !isDistratado && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAbrirAditivo(contrato)}
                className="text-xs h-7 rounded-lg gap-1 border-slate-200 dark:border-[#0B384D]"
              >
                <FilePlus2 className="h-3 w-3 text-[#00A3C4]" /> + Aditivo
              </Button>
            )}

            {onAbrirDistrato && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAbrirDistrato(contrato)}
                className={`text-xs h-7 rounded-lg gap-1 ${
                  isDistratado
                    ? 'border-rose-400 text-rose-600'
                    : 'border-slate-200 dark:border-[#0B384D] text-slate-600 hover:text-rose-600'
                }`}
              >
                <FileX2 className="h-3 w-3 text-rose-500" /> {isDistratado ? 'Ver Distrato' : 'Distrato'}
              </Button>
            )}
          </div>
        </div>

        {/* Conteúdo da Aba */}
        <div className="p-3.5 sm:p-5 flex-1 overflow-y-auto space-y-3">
          {/* 1. ABA DE MEDIÇÕES */}
          {activeTab === 'medicoes' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Histórico de Etapas Cadastradas
                  </span>
                  <button
                    type="button"
                    onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-[#0B384D] dark:hover:bg-[#0E4660] transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                    title={`Ordenado por data cronológica (${sortDirection === 'asc' ? 'mais antigas primeiro' : 'mais recentes primeiro'}). Clique para inverter.`}
                  >
                    <ArrowUpDown className="h-3 w-3 text-[#00A3C4]" />
                    <span>
                      {sortDirection === 'asc' ? 'Cronológica (1ª → Última)' : 'Cronológica (Última → 1ª)'}
                    </span>
                  </button>
                </div>
                {!isDistratado && (
                  <Button
                    size="sm"
                    onClick={() => onNovaMedicaoParaContrato(contrato)}
                    className="bg-[#00A3C4] hover:bg-[#008EA9] text-white text-xs font-bold gap-1.5 h-8 rounded-xl"
                  >
                    <PlusCircle className="h-3.5 w-3.5" /> Nova Medição
                  </Button>
                )}
              </div>

              {medicoesDoContrato.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-[#0B384D] rounded-xl space-y-2">
                  <p>Nenhuma etapa ou medição cadastrada para este contrato ainda.</p>
                  {!isDistratado && (
                    <Button
                      size="sm"
                      onClick={() => onNovaMedicaoParaContrato(contrato)}
                      className="bg-[#00A3C4] hover:bg-[#008EA9] text-white text-xs font-bold gap-1.5 h-8 rounded-xl"
                    >
                      <PlusCircle className="h-3.5 w-3.5" /> Lançar Primeira Medição
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#0B384D]">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-[#0B384D] text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-[#0B384D]">
                      <tr>
                        <th className="py-2.5 px-3">Etapa / Descrição</th>
                        <th className="py-2.5 px-3 text-center">% Etapa</th>
                        <th className="py-2.5 px-3 text-right">Valor</th>
                        <th
                          className="py-2.5 px-3 cursor-pointer select-none hover:text-[#00A3C4] transition-colors"
                          onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                          title="Clique para alternar ordem cronológica"
                        >
                          <div className="flex items-center gap-1">
                            <span>Previsão</span>
                            <ArrowUpDown className="h-3 w-3 opacity-60" />
                          </div>
                        </th>
                        <th
                          className="py-2.5 px-3 cursor-pointer select-none hover:text-[#00A3C4] transition-colors"
                          onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                          title="Clique para alternar ordem cronológica"
                        >
                          <div className="flex items-center gap-1">
                            <span>Medição</span>
                            <ArrowUpDown className="h-3 w-3 opacity-60" />
                          </div>
                        </th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3">NF</th>
                        <th className="py-2.5 px-3 text-center">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#0B384D]/60 text-slate-700 dark:text-slate-200">
                      {medicoesDoContrato.map((m) => {
                        const mStatusColor = STATUS_MEDICAO_COLORS[m.status] || {
                          bg: 'bg-slate-100',
                          text: 'text-slate-600',
                          border: 'border-slate-300',
                        };

                        return (
                          <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-[#0B384D]/30 transition-colors">
                            <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white max-w-[220px] break-words">
                              {m.etapa}
                            </td>
                            <td className="py-2 px-3 text-center font-bold text-slate-700 dark:text-slate-300 font-mono">
                              {formatPercent(m.percentual)}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white font-mono whitespace-nowrap">
                              {formatCurrency(m.valor_medicao)}
                            </td>
                            <td className="py-2 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                              {formatDateBR(m.data_prevista)}
                            </td>
                            <td className="py-2 px-3 font-medium whitespace-nowrap">
                              {formatDateBR(m.data_medicao)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${mStatusColor.bg} ${mStatusColor.text} ${mStatusColor.border}`}
                              >
                                {m.status}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-500">
                              {m.nf || '-'}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                onClick={() => onEditarMedicao(m)}
                                className="text-[#00A3C4] hover:underline font-bold text-[11px]"
                              >
                                Editar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 2. ABA DE ADITIVOS */}
          {activeTab === 'aditivos' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Termos Aditivos Registrados ({aditivos.length})
                </span>
                {onAbrirAditivo && !isDistratado && (
                  <Button
                    size="sm"
                    onClick={() => onAbrirAditivo(contrato)}
                    className="bg-[#00A3C4] hover:bg-[#008EA9] text-white text-xs font-bold gap-1.5 h-8 rounded-xl"
                  >
                    <FilePlus2 className="h-3.5 w-3.5" /> Adicionar Termo Aditivo
                  </Button>
                )}
              </div>

              {aditivos.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-[#0B384D] rounded-xl space-y-2">
                  <p>Nenhum termo aditivo lançado para este contrato.</p>
                  <p className="text-[11px] opacity-75">
                    Utilize aditivos para registrar acréscimos ou supressões de valor, alteração de prazo ou escopo contratual.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {aditivos.map((a) => (
                    <div
                      key={a.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-[#0B384D] bg-slate-50/60 dark:bg-[#0B384D]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-[#0B384D] font-bold">
                            Aditivo #{a.numero}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-[#00A3C4]/15 text-[#008EA9] dark:text-[#00C4EB] text-[10px] font-bold">
                            Tipo: {a.tipo}
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            Data: {formatDateBR(a.data)}
                          </span>
                          {a.novo_prazo && (
                            <span className="text-purple-600 dark:text-purple-400 font-semibold text-[11px]">
                              Novo Prazo: {formatDateBR(a.novo_prazo)}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-700 dark:text-slate-200 font-medium break-words mt-1">
                          {a.descricao}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        {a.valor !== 0 && (
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block font-bold">Impacto Valor</span>
                            <span className={`font-mono font-extrabold text-sm ${
                              a.valor > 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}>
                              {a.valor > 0 ? `+${formatCurrency(a.valor)}` : formatCurrency(a.valor)}
                            </span>
                          </div>
                        )}

                        {onExcluirAditivo && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Deseja excluir o Aditivo #${a.numero}?`)) {
                                onExcluirAditivo(contrato.id, a.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Excluir Aditivo"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-[#0B384D] flex justify-end bg-slate-50/50 dark:bg-[#072432]">
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
