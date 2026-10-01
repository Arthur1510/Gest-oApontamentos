"use client";

import React, { useState, useEffect } from 'react';
import {
  Contrato,
  AditivoContrato,
  TipoAditivo,
} from '@/types/orcamento';
import { formatCurrency } from '@/lib/orcamento-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  X,
  FilePlus2,
  DollarSign,
  Calendar,
  AlertCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface AditivoModalProps {
  contrato: Contrato | null;
  isOpen: boolean;
  onClose: () => void;
  onSalvarAditivo: (contratoId: string, aditivo: Omit<AditivoContrato, 'id' | 'contrato_id'>) => void;
}

export function AditivoModal({
  contrato,
  isOpen,
  onClose,
  onSalvarAditivo,
}: AditivoModalProps) {
  const [tipo, setTipo] = useState<TipoAditivo>('Valor');
  const [isAcrescimo, setIsAcrescimo] = useState(true);
  const [valorInput, setValorInput] = useState<string>('');
  const [dataInput, setDataInput] = useState<string>(new Date().toISOString().split('T')[0]);
  const [novoPrazoInput, setNovoPrazoInput] = useState<string>('');
  const [descricaoInput, setDescricaoInput] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setTipo('Valor');
      setIsAcrescimo(true);
      setValorInput('');
      setDataInput(new Date().toISOString().split('T')[0]);
      setNovoPrazoInput('');
      setDescricaoInput('');
    }
  }, [isOpen]);

  if (!isOpen || !contrato) return null;

  const proximoNumero = (contrato.aditivos?.length || 0) + 1;
  const valorNumerico = parseFloat(valorInput) || 0;
  const valorFinalAditivo = (tipo === 'Valor' || tipo === 'Misto')
    ? (isAcrescimo ? Math.abs(valorNumerico) : -Math.abs(valorNumerico))
    : 0;

  const valorOriginal = contrato.valor_original ?? contrato.valor_contrato;
  const somaAditivosAtuais = (contrato.aditivos || []).reduce((acc, a) => acc + (a.valor || 0), 0);
  const novoValorContrato = valorOriginal + somaAditivosAtuais + valorFinalAditivo;
  const novoSaldoAMedir = Math.max(0, novoValorContrato - (contrato.valor_medido || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!descricaoInput.trim()) {
      alert('Por favor, informe a justificativa ou escopo do aditivo.');
      return;
    }

    if ((tipo === 'Valor' || tipo === 'Misto') && valorNumerico <= 0) {
      alert('Por favor, informe um valor maior que zero para o aditivo.');
      return;
    }

    if (novoValorContrato < (contrato.valor_medido || 0)) {
      if (!confirm(`Atenção: A supressão faz o novo valor do contrato (${formatCurrency(novoValorContrato)}) ficar menor que o já medido (${formatCurrency(contrato.valor_medido)}). Deseja continuar?`)) {
        return;
      }
    }

    onSalvarAditivo(contrato.id, {
      numero: proximoNumero,
      data: dataInput,
      tipo,
      valor: valorFinalAditivo,
      descricao: descricaoInput.trim(),
      novo_prazo: novoPrazoInput || null,
      criado_em: new Date().toISOString(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-0">
      <div className="bg-white dark:bg-[#072B3B] rounded-2xl border border-slate-200 dark:border-[#0B384D] max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[#0B384D] flex items-center justify-between bg-slate-50/70 dark:bg-[#072432]">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-[#00A3C4]/15 text-[#00A3C4] dark:text-[#00C4EB]">
              <FilePlus2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-[#0B384D] font-bold">
                  {contrato.id}
                </span>
                <span className="text-xs font-bold text-[#00A3C4]">
                  Termo Aditivo nº {proximoNumero}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Tipo de Aditivo */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1.5 uppercase tracking-wider">
              Tipo de Aditivo *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['Valor', 'Prazo', 'Escopo', 'Misto'] as TipoAditivo[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  className={`py-2 px-2 rounded-xl font-bold text-center border transition-all ${
                    tipo === t
                      ? 'bg-[#00A3C4] text-white border-[#00A3C4] shadow-xs'
                      : 'border-slate-200 dark:border-[#0B384D] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#0B384D]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Se for Valor ou Misto */}
          {(tipo === 'Valor' || tipo === 'Misto') && (
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-[#0B384D] bg-slate-50/60 dark:bg-[#0B384D]/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300">Natureza do Valor</span>
                <div className="flex items-center gap-1.5 bg-slate-200 dark:bg-[#072B3B] p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setIsAcrescimo(true)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                      isAcrescimo
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <TrendingUp className="h-3 w-3" /> Acréscimo (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAcrescimo(false)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                      !isAcrescimo
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <TrendingDown className="h-3 w-3" /> Supressão (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Valor do Aditivo (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                    R$
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={valorInput}
                    onChange={(e) => setValorInput(e.target.value)}
                    className="pl-9 font-bold text-sm h-10 rounded-xl bg-white dark:bg-[#072B3B]"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Prazo e Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                Data do Aditivo *
              </label>
              <Input
                type="date"
                value={dataInput}
                onChange={(e) => setDataInput(e.target.value)}
                className="h-9 rounded-xl bg-white dark:bg-[#072B3B]"
                required
              />
            </div>

            {(tipo === 'Prazo' || tipo === 'Misto') && (
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Novo Prazo / Conclusão
                </label>
                <Input
                  type="date"
                  value={novoPrazoInput}
                  onChange={(e) => setNovoPrazoInput(e.target.value)}
                  className="h-9 rounded-xl bg-white dark:bg-[#072B3B]"
                />
              </div>
            )}
          </div>

          {/* Descrição e Justificativa */}
          <div>
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
              Justificativa / Escopo do Aditivo *
            </label>
            <textarea
              value={descricaoInput}
              onChange={(e) => setDescricaoInput(e.target.value)}
              placeholder="Ex: Acréscimo de escopo referente a novos projetos complementares do bloco B..."
              rows={3}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-[#0B384D] bg-white dark:bg-[#072B3B] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00A3C4]"
              required
            />
          </div>

          {/* Resumo Financeiro Projetado */}
          <div className="p-3.5 rounded-xl border border-[#00A3C4]/30 bg-[#00A3C4]/5 dark:bg-[#00A3C4]/10 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#008EA9] dark:text-[#00C4EB] block">
              Impacto Financeiro no Contrato
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Valor Vigente Atual:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                  {formatCurrency(contrato.valor_contrato)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Variação Aditivo:</span>
                <span className={`font-bold font-mono ${valorFinalAditivo >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {valorFinalAditivo >= 0 ? `+${formatCurrency(valorFinalAditivo)}` : formatCurrency(valorFinalAditivo)}
                </span>
              </div>
              <div className="border-t border-[#00A3C4]/20 pt-1.5">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Novo Valor Contrato:</span>
                <span className="font-extrabold text-[#008EA9] dark:text-[#00C4EB] font-mono text-sm">
                  {formatCurrency(novoValorContrato)}
                </span>
              </div>
              <div className="border-t border-[#00A3C4]/20 pt-1.5">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Novo Saldo a Medir:</span>
                <span className="font-bold text-purple-600 dark:text-purple-400 font-mono text-sm">
                  {formatCurrency(novoSaldoAMedir)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-[#0B384D]">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs h-9 rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-[#00A3C4] hover:bg-[#008EA9] text-white font-bold text-xs h-9 rounded-xl shadow-xs"
            >
              Salvar Termo Aditivo
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
