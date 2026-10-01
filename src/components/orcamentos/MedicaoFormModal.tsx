"use client";

import React, { useState, useEffect } from 'react';
import {
  Medicao,
  NovaMedicao,
  Contrato,
  StatusMedicao,
  STATUS_MEDICAO_OPCOES,
} from '@/types/orcamento';
import { formatCurrency } from '@/lib/orcamento-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Calendar, DollarSign, CheckCircle2 } from 'lucide-react';

interface MedicaoFormModalProps {
  medicaoParaEditar: Medicao | null;
  contratos: Contrato[];
  contratoPreSelecionado?: Contrato | null;
  isOpen: boolean;
  onClose: () => void;
  onSalvar: (medicao: Medicao | (NovaMedicao & { id?: string })) => void;
}

export function MedicaoFormModal({
  medicaoParaEditar,
  contratos,
  contratoPreSelecionado,
  isOpen,
  onClose,
  onSalvar,
}: MedicaoFormModalProps) {
  const [formData, setFormData] = useState<{
    id: string;
    contrato_id: string;
    empresa: string;
    obra: string;
    etapa: string;
    percentual: number; // 0 a 100 no form
    valor_medicao: number;
    data_prevista: string;
    data_medicao: string;
    data_referencia: string;
    mes_competencia: string;
    status: StatusMedicao;
    nf: string;
    data_pagamento: string;
  }>({
    id: '',
    contrato_id: '',
    empresa: '',
    obra: '',
    etapa: '',
    percentual: 10,
    valor_medicao: 0,
    data_prevista: '',
    data_medicao: '',
    data_referencia: '',
    mes_competencia: '',
    status: 'A Medir',
    nf: '',
    data_pagamento: '',
  });

  const [valorManual, setValorManual] = useState(false);

  // Inicializar dados
  useEffect(() => {
    if (medicaoParaEditar) {
      setFormData({
        id: medicaoParaEditar.id,
        contrato_id: medicaoParaEditar.contrato_id,
        empresa: medicaoParaEditar.empresa,
        obra: medicaoParaEditar.obra,
        etapa: medicaoParaEditar.etapa,
        percentual: (medicaoParaEditar.percentual || 0) * 100,
        valor_medicao: medicaoParaEditar.valor_medicao,
        data_prevista: medicaoParaEditar.data_prevista || '',
        data_medicao: medicaoParaEditar.data_medicao || '',
        data_referencia: medicaoParaEditar.data_referencia || '',
        mes_competencia: medicaoParaEditar.mes_competencia || '',
        status: medicaoParaEditar.status,
        nf: medicaoParaEditar.nf || '',
        data_pagamento: medicaoParaEditar.data_pagamento || '',
      });
      setValorManual(true);
    } else {
      const c = contratoPreSelecionado || contratos[0];
      const defaultPct = 10;
      const calcVal = c ? (c.valor_contrato * defaultPct) / 100 : 0;

      setFormData({
        id: '',
        contrato_id: c?.id || '',
        empresa: c?.empresa || '',
        obra: c?.obra || '',
        etapa: '',
        percentual: defaultPct,
        valor_medicao: calcVal,
        data_prevista: new Date().toISOString().split('T')[0],
        data_medicao: '',
        data_referencia: new Date().toISOString().split('T')[0],
        mes_competencia: `${new Date().getFullYear().toString().slice(-2)}/${String(new Date().getMonth() + 1).padStart(2, '0')}`,
        status: 'A Medir',
        nf: '',
        data_pagamento: '',
      });
      setValorManual(false);
    }
  }, [medicaoParaEditar, contratoPreSelecionado, contratos, isOpen]);

  if (!isOpen) return null;

  const handleContratoSelect = (contratoId: string) => {
    const c = contratos.find((item) => item.id === contratoId);
    if (c) {
      const pctDecimal = formData.percentual / 100;
      setFormData((prev) => ({
        ...prev,
        contrato_id: c.id,
        empresa: c.empresa,
        obra: c.obra,
        valor_medicao: valorManual ? prev.valor_medicao : c.valor_contrato * pctDecimal,
      }));
    }
  };

  const handlePercentualChange = (pctValue: number) => {
    const c = contratos.find((item) => item.id === formData.contrato_id);
    const novoValor = c ? (c.valor_contrato * pctValue) / 100 : formData.valor_medicao;

    setFormData((prev) => ({
      ...prev,
      percentual: pctValue,
      valor_medicao: valorManual ? prev.valor_medicao : novoValor,
    }));
  };

  const handleDataChange = (dataPrevista: string, dataMedicao: string, status: StatusMedicao) => {
    // Se estiver pago e tiver data_pagamento, prioriza data_pagamento para desembolso; senão dataMedicao, senão dataPrevista
    const refData = (status === 'Pago' && formData.data_pagamento)
      ? formData.data_pagamento
      : ((status === 'Pago' || status === 'Medido') && dataMedicao ? dataMedicao : dataPrevista);
    
    let mesComp = formData.mes_competencia;

    if (refData && (!formData.mes_competencia || !medicaoParaEditar)) {
      const parts = refData.split('-');
      if (parts.length >= 2) {
        mesComp = `${parts[0].slice(-2)}/${parts[1]}`;
      }
    }

    setFormData((prev) => ({
      ...prev,
      data_prevista: dataPrevista,
      data_medicao: dataMedicao,
      data_referencia: refData,
      mes_competencia: mesComp,
      status: status,
    }));
  };

  const handleDataPagamentoChange = (dtPag: string) => {
    let mesComp = formData.mes_competencia;
    // Se a medição estiver como Pago e preencher data de pagamento, sugere atualizar o mês de competência/desembolso
    if (dtPag && (formData.status === 'Pago' || !mesComp)) {
      const parts = dtPag.split('-');
      if (parts.length >= 2) {
        mesComp = `${parts[0].slice(-2)}/${parts[1]}`;
      }
    }
    setFormData((prev) => ({
      ...prev,
      data_pagamento: dtPag,
      mes_competencia: mesComp,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.contrato_id || !formData.etapa || formData.valor_medicao <= 0) {
      alert('Por favor, informe o contrato, etapa e valor da medição.');
      return;
    }

    onSalvar({
      id: formData.id || undefined,
      contrato_id: formData.contrato_id,
      empresa: formData.empresa,
      obra: formData.obra,
      etapa: formData.etapa,
      percentual: formData.percentual / 100,
      valor_medicao: Number(formData.valor_medicao),
      data_prevista: formData.data_prevista || null,
      data_medicao: formData.data_medicao || null,
      data_referencia: formData.data_referencia || formData.data_medicao || formData.data_prevista || null,
      mes_competencia: formData.mes_competencia,
      status: formData.status,
      nf: formData.nf || null,
      data_pagamento: formData.data_pagamento || null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-0">
      <div className="bg-white dark:bg-[#072B3B] rounded-2xl border border-slate-200 dark:border-[#0B384D] max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-[#0B384D] flex items-center justify-between bg-slate-50/50 dark:bg-[#072432]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00A3C4]/15 text-[#00A3C4] dark:text-[#00C4EB]">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                {medicaoParaEditar ? 'Editar Medição / Etapa' : 'Nova Medição / Etapa'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Acompanhamento e registro de medição de serviço
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {/* Selecionar Contrato */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Contrato Associado *
            </label>
            <select
              value={formData.contrato_id}
              onChange={(e) => handleContratoSelect(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B384D] border border-slate-200 dark:border-[#0B384D] text-slate-800 dark:text-slate-100 h-9"
              required
            >
              {contratos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} - {c.empresa} ({c.obra} - {c.subdisciplina}) - Total: {formatCurrency(c.valor_contrato)}
                </option>
              ))}
            </select>
          </div>

          {/* Etapa / Descrição do Marco */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Etapa / Descrição do Marco *
            </label>
            <Input
              value={formData.etapa}
              onChange={(e) => setFormData({ ...formData, etapa: e.target.value })}
              placeholder="Ex: Emissão inicial EP, 1º Comunique-se, etc."
              className="text-xs h-9 rounded-xl bg-slate-50 dark:bg-[#0B384D]"
              required
            />
          </div>

          {/* Percentual e Valor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Percentual da Etapa (%)
              </label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.percentual}
                  onChange={(e) => handlePercentualChange(parseFloat(e.target.value) || 0)}
                  className="pr-7 text-xs h-9 rounded-xl bg-slate-50 dark:bg-[#0B384D] font-bold"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  %
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Valor da Medição (R$) *
                </label>
                <button
                  type="button"
                  onClick={() => setValorManual(!valorManual)}
                  className="text-[10px] text-[#00A3C4] hover:underline"
                >
                  {valorManual ? 'Calcular via %' : 'Editar valor manual'}
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  R$
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor_medicao || ''}
                  onChange={(e) => {
                    setValorManual(true);
                    setFormData({ ...formData, valor_medicao: parseFloat(e.target.value) || 0 });
                  }}
                  className="pl-9 text-xs h-9 rounded-xl bg-slate-50 dark:bg-[#0B384D] font-bold"
                  required
                />
              </div>
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Data Prevista
              </label>
              <Input
                type="date"
                value={formData.data_prevista}
                onChange={(e) => handleDataChange(e.target.value, formData.data_medicao, formData.status)}
                className="text-xs h-9 rounded-xl bg-slate-50 dark:bg-[#0B384D]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Data Medição (Realizada)
              </label>
              <Input
                type="date"
                value={formData.data_medicao}
                onChange={(e) => handleDataChange(formData.data_prevista, e.target.value, formData.status)}
                className="text-xs h-9 rounded-xl bg-slate-50 dark:bg-[#0B384D]"
              />
            </div>
          </div>

          {/* Status e Mês de Competência */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Status da Medição
              </label>
              <select
                value={formData.status}
                onChange={(e) => {
                  const newSt = e.target.value as StatusMedicao;
                  handleDataChange(formData.data_prevista, formData.data_medicao, newSt);
                }}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B384D] border border-slate-200 dark:border-[#0B384D] text-slate-800 dark:text-slate-100 h-9"
              >
                {STATUS_MEDICAO_OPCOES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Mês Competência (AA/MM)
              </label>
              <Input
                value={formData.mes_competencia}
                onChange={(e) => setFormData({ ...formData, mes_competencia: e.target.value })}
                placeholder="Ex: 26/03"
                className="text-xs h-9 rounded-xl bg-slate-50 dark:bg-[#0B384D]"
              />
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {formData.data_pagamento && (
                  <button
                    type="button"
                    onClick={() => {
                      const p = formData.data_pagamento.split('-');
                      if (p.length >= 2) setFormData((prev) => ({ ...prev, mes_competencia: `${p[0].slice(-2)}/${p[1]}` }));
                    }}
                    className="text-[10px] text-[#00A3C4] hover:underline"
                  >
                    Usar mês pagto ({formData.data_pagamento.slice(2, 4)}/{formData.data_pagamento.slice(5, 7)})
                  </button>
                )}
                {formData.data_medicao && (
                  <button
                    type="button"
                    onClick={() => {
                      const p = formData.data_medicao.split('-');
                      if (p.length >= 2) setFormData((prev) => ({ ...prev, mes_competencia: `${p[0].slice(-2)}/${p[1]}` }));
                    }}
                    className="text-[10px] text-slate-500 hover:underline"
                  >
                    Usar mês medição ({formData.data_medicao.slice(2, 4)}/{formData.data_medicao.slice(5, 7)})
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-tight">
                Agrupador na Curva S: para <b>Fluxo de Caixa (Desembolso)</b>, use o mês do pagamento. Para <b>Avanço Físico</b>, use o mês medido. Se vazio, deduz automaticamente.
              </p>
            </div>
          </div>

          {/* NF e Data de Pagamento */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Nota Fiscal (NF)
              </label>
              <Input
                value={formData.nf}
                onChange={(e) => setFormData({ ...formData, nf: e.target.value })}
                placeholder="Ex: 457"
                className="text-xs h-9 rounded-xl bg-slate-50 dark:bg-[#0B384D]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Data do Pagamento
              </label>
              <Input
                type="date"
                value={formData.data_pagamento}
                onChange={(e) => handleDataPagamentoChange(e.target.value)}
                className="text-xs h-9 rounded-xl bg-slate-50 dark:bg-[#0B384D]"
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-[#0B384D]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-[#00A3C4] hover:bg-[#008EA9] text-white text-xs font-bold"
            >
              {medicaoParaEditar ? 'Atualizar Medição' : 'Registrar Medição'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
