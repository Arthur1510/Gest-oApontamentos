"use client";

import React from 'react';
import {
  Contrato,
  Medicao,
  STATUS_MEDICAO_COLORS,
} from '@/types/orcamento';
import { formatCurrency, formatPercent, formatDateBR } from '@/lib/orcamento-utils';
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
} from 'lucide-react';

interface ContratoDetailModalProps {
  contrato: Contrato | null;
  medicoes: Medicao[];
  isOpen: boolean;
  onClose: () => void;
  onNovaMedicaoParaContrato: (contrato: Contrato) => void;
  onEditarMedicao: (medicao: Medicao) => void;
}

export function ContratoDetailModal({
  contrato,
  medicoes,
  isOpen,
  onClose,
  onNovaMedicaoParaContrato,
  onEditarMedicao,
}: ContratoDetailModalProps) {
  if (!isOpen || !contrato) return null;

  const medicoesDoContrato = medicoes.filter((m) => m.contrato_id === contrato.id);
  const pct = contrato.percentual_medido || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-0">
      <div className="bg-white dark:bg-[#072B3B] rounded-2xl border border-slate-200 dark:border-[#0B384D] max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-[#0B384D] flex items-center justify-between bg-slate-50/50 dark:bg-[#072432]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#00A3C4]/15 text-[#00A3C4] dark:text-[#00C4EB]">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-[#0B384D] font-bold">
                  {contrato.id}
                </span>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  {contrato.empresa}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Obra: {contrato.obra} | {contrato.disciplina} - {contrato.subdisciplina} | Nº Sienge: {contrato.num_sienge || 'N/A'}
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

        {/* Resumo Financeiro do Contrato */}
        <div className="p-5 border-b border-slate-100 dark:border-[#0B384D] grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-[#072B3B]">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B384D]">
            <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block">
              Valor do Contrato
            </span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white block mt-0.5">
              {formatCurrency(contrato.valor_contrato)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
            <span className="text-[10px] font-bold uppercase block opacity-80">
              Valor Medido
            </span>
            <span className="text-base font-extrabold block mt-0.5">
              {formatCurrency(contrato.valor_medido)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-400">
            <span className="text-[10px] font-bold uppercase block opacity-80">
              Saldo a Medir
            </span>
            <span className="text-base font-extrabold block mt-0.5">
              {formatCurrency(contrato.saldo_a_medir)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#00A3C4]/10 text-[#008EA9] dark:text-[#00C4EB]">
            <span className="text-[10px] font-bold uppercase block opacity-80">
              Avanço Físico
            </span>
            <span className="text-base font-extrabold block mt-0.5">
              {formatPercent(pct)}
            </span>
          </div>
        </div>

        {/* Barra de Progresso Físico */}
        <div className="px-5 pt-3">
          <div className="w-full bg-slate-100 dark:bg-[#0B384D] h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                pct >= 1 ? 'bg-emerald-500' : 'bg-[#00A3C4]'
              }`}
              style={{ width: `${Math.min(100, Math.round(pct * 100))}%` }}
            />
          </div>
        </div>

        {/* Tabela de Etapas / Medições do Contrato */}
        <div className="p-5 flex-1 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Etapas e Medições Cadastradas ({medicoesDoContrato.length})
            </h4>
            <Button
              size="sm"
              onClick={() => onNovaMedicaoParaContrato(contrato)}
              className="bg-[#00A3C4] hover:bg-[#008EA9] text-white text-xs font-bold gap-1.5 h-8 rounded-xl"
            >
              <PlusCircle className="h-3.5 w-3.5" /> Adicionar Etapa / Medição
            </Button>
          </div>

          {medicoesDoContrato.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-[#0B384D] rounded-xl">
              Nenhuma etapa ou medição cadastrada para este contrato ainda.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#0B384D]">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-[#0B384D] text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-[#0B384D]">
                  <tr>
                    <th className="py-2.5 px-3">Etapa / Descrição</th>
                    <th className="py-2.5 px-3 text-center">% Etapa</th>
                    <th className="py-2.5 px-3 text-right">Valor</th>
                    <th className="py-2.5 px-3">Previsão</th>
                    <th className="py-2.5 px-3">Medição</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3">NF</th>
                    <th className="py-2.5 px-3 text-center">Editar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#0B384D]/60 text-slate-700 dark:text-slate-200">
                  {medicoesDoContrato.map((m) => {
                    const statusColor = STATUS_MEDICAO_COLORS[m.status] || {
                      bg: 'bg-slate-100',
                      text: 'text-slate-600',
                      border: 'border-slate-300',
                    };

                    return (
                      <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-[#0B384D]/30 transition-colors">
                        <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                          {m.etapa}
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                          {formatPercent(m.percentual)}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">
                          {formatCurrency(m.valor_medicao)}
                        </td>
                        <td className="py-2 px-3 text-slate-500 dark:text-slate-400">
                          {formatDateBR(m.data_prevista)}
                        </td>
                        <td className="py-2 px-3 font-medium">
                          {formatDateBR(m.data_medicao)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}
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

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-[#0B384D] flex justify-end bg-slate-50/50 dark:bg-[#072432]">
          <Button
            variant="outline"
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
