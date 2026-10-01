"use client";

import React, { useState, useEffect } from 'react';
import {
  Contrato,
  DistratoInfo,
} from '@/types/orcamento';
import { formatCurrency } from '@/lib/orcamento-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  X,
  FileX2,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Ban,
} from 'lucide-react';

interface DistratoModalProps {
  contrato: Contrato | null;
  isOpen: boolean;
  onClose: () => void;
  onRegistrarDistrato: (contratoId: string, distrato: DistratoInfo) => void;
  onReverterDistrato?: (contratoId: string) => void;
}

const MOTIVOS_SUGERIDOS = [
  'Inadimplemento de obrigações contratuais',
  'Atraso injustificado no cronograma',
  'Mútuo acordo / distrato amigável',
  'Readequação do escopo / projeto',
  'Substituição do fornecedor',
  'Paralisação ou cancelamento da obra',
  'Outro motivo específico',
];

export function DistratoModal({
  contrato,
  isOpen,
  onClose,
  onRegistrarDistrato,
  onReverterDistrato,
}: DistratoModalProps) {
  const isDistratado = contrato?.status === 'Distratado';

  const [dataInput, setDataInput] = useState<string>(new Date().toISOString().split('T')[0]);
  const [motivoInput, setMotivoInput] = useState<string>(MOTIVOS_SUGERIDOS[0]);
  const [valorAcertoInput, setValorAcertoInput] = useState<string>('0');
  const [congelarSaldo, setCongelarSaldo] = useState<boolean>(true);
  const [observacoesInput, setObservacoesInput] = useState<string>('');

  useEffect(() => {
    if (contrato?.distrato) {
      setDataInput(contrato.distrato.data || new Date().toISOString().split('T')[0]);
      setMotivoInput(contrato.distrato.motivo || MOTIVOS_SUGERIDOS[0]);
      setValorAcertoInput(String(contrato.distrato.valor_acerto || 0));
      setCongelarSaldo(contrato.distrato.congelar_saldo !== false);
      setObservacoesInput(contrato.distrato.observacoes || '');
    } else {
      setDataInput(new Date().toISOString().split('T')[0]);
      setMotivoInput(MOTIVOS_SUGERIDOS[0]);
      setValorAcertoInput('0');
      setCongelarSaldo(true);
      setObservacoesInput('');
    }
  }, [contrato, isOpen]);

  if (!isOpen || !contrato) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!motivoInput.trim()) {
      alert('Por favor, informe o motivo do distrato.');
      return;
    }

    if (!confirm(`Deseja realmente registrar o DISTRATO do contrato ${contrato.id} (${contrato.empresa})? O status será alterado para Distratado e o saldo a medir será encerrado.`)) {
      return;
    }

    onRegistrarDistrato(contrato.id, {
      data: dataInput,
      motivo: motivoInput.trim(),
      valor_acerto: parseFloat(valorAcertoInput) || 0,
      congelar_saldo: congelarSaldo,
      observacoes: observacoesInput.trim(),
    });

    onClose();
  };

  const handleReverter = () => {
    if (!onReverterDistrato) return;
    if (confirm(`Deseja reverter o distrato e reativar o contrato ${contrato.id}?`)) {
      onReverterDistrato(contrato.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-0">
      <div className="bg-white dark:bg-[#072B3B] rounded-2xl border border-slate-200 dark:border-[#0B384D] max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[#0B384D] flex items-center justify-between bg-rose-50/60 dark:bg-rose-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-rose-600/15 text-rose-600 dark:text-rose-400">
              <FileX2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-[#0B384D] font-bold">
                  {contrato.id}
                </span>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  {isDistratado ? 'Contrato Distratado' : 'Registrar Distrato / Rescisão'}
                </span>
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base leading-tight mt-0.5 break-words">
                {contrato.empresa}
              </h3>
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

        {/* Informações Atuais */}
        <div className="p-4 sm:p-5 bg-slate-50/50 dark:bg-[#072432] border-b border-slate-100 dark:border-[#0B384D] grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-white dark:bg-[#072B3B] border border-slate-200 dark:border-[#0B384D]">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Valor Vigente</span>
            <span className="font-mono font-bold text-slate-800 dark:text-white mt-0.5 block">
              {formatCurrency(contrato.valor_contrato)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-[#072B3B] border border-slate-200 dark:border-[#0B384D]">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Medido</span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {formatCurrency(contrato.valor_medido)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-white dark:bg-[#072B3B] border border-slate-200 dark:border-[#0B384D]">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">Saldo Atual</span>
            <span className="font-mono font-bold text-purple-600 dark:text-purple-400 mt-0.5 block">
              {formatCurrency(contrato.saldo_a_medir)}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {isDistratado && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs">Este contrato foi formalmente distratado.</p>
                <p className="text-[11px] opacity-90 mt-0.5">
                  O saldo a medir foi zerado para não gerar distorções nos compromissos futuros. Se o distrato foi registrado por engano, você pode reativá-lo.
                </p>
              </div>
            </div>
          )}

          {/* Data do Distrato */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
              Data do Distrato / Rescisão *
            </label>
            <Input
              type="date"
              value={dataInput}
              onChange={(e) => setDataInput(e.target.value)}
              className="h-9 rounded-xl bg-white dark:bg-[#072B3B]"
              required
              disabled={isDistratado}
            />
          </div>

          {/* Motivo do Distrato */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
              Motivo Principal *
            </label>
            <select
              value={motivoInput}
              onChange={(e) => setMotivoInput(e.target.value)}
              disabled={isDistratado}
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-white dark:bg-[#072B3B] border border-slate-200 dark:border-[#0B384D] text-slate-800 dark:text-slate-100 h-9 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              {MOTIVOS_SUGERIDOS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Valor de Acerto Final */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
              Valor de Acerto / Quitação Final (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                R$
              </span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={valorAcertoInput}
                onChange={(e) => setValorAcertoInput(e.target.value)}
                disabled={isDistratado}
                placeholder="0,00"
                className="pl-9 font-bold text-xs h-9 rounded-xl bg-white dark:bg-[#072B3B]"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Informe se houve algum valor final residual acordado em rescisão ou indenização.
            </p>
          </div>

          {/* Checkbox congelar saldo */}
          <div className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-[#0B384D] bg-slate-50 dark:bg-[#0B384D]/30">
            <input
              type="checkbox"
              id="congelarSaldoCheck"
              checked={congelarSaldo}
              onChange={(e) => setCongelarSaldo(e.target.checked)}
              disabled={isDistratado}
              className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4"
            />
            <label htmlFor="congelarSaldoCheck" className="text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
              Zerar Saldo a Medir Restante (Recomendado)
            </label>
          </div>

          {/* Observações */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
              Observações e Detalhes da Rescisão
            </label>
            <textarea
              value={observacoesInput}
              onChange={(e) => setObservacoesInput(e.target.value)}
              disabled={isDistratado}
              placeholder="Descreva tratativas com o jurídico, devolução de materiais, quitação de notas, etc."
              rows={3}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-[#0B384D] bg-white dark:bg-[#072B3B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-[#0B384D]">
            {isDistratado && onReverterDistrato ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReverter}
                className="text-xs h-9 rounded-xl border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reativar Contrato
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-xs h-9 rounded-xl"
              >
                {isDistratado ? 'Fechar' : 'Cancelar'}
              </Button>
              {!isDistratado && (
                <Button
                  type="submit"
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-9 rounded-xl shadow-xs gap-1.5"
                >
                  <Ban className="h-4 w-4" /> Confirmar Distrato
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
