"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Contrato,
  NovoContrato,
  Obra,
  Fornecedor,
  Disciplina,
  Subdisciplina,
  CategoriaContrato,
} from '@/types/orcamento';
import { formatCurrency } from '@/lib/orcamento-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Briefcase, DollarSign, AlertTriangle } from 'lucide-react';

interface ContratoFormModalProps {
  contratoParaEditar: Contrato | null;
  contratos?: Contrato[];
  obras: Obra[];
  fornecedores: Fornecedor[];
  disciplinas: Disciplina[];
  subdisciplinas: Subdisciplina[];
  isOpen: boolean;
  onClose: () => void;
  onSalvar: (contrato: Contrato | (NovoContrato & { id?: string })) => void;
}

export function ContratoFormModal({
  contratoParaEditar,
  contratos,
  obras,
  fornecedores,
  disciplinas,
  subdisciplinas,
  isOpen,
  onClose,
  onSalvar,
}: ContratoFormModalProps) {
  const [formData, setFormData] = useState<{
    id: string;
    num_sienge: string;
    empresa: string;
    obra: string;
    disciplina: string;
    subdisciplina: string;
    valor_contrato: number;
    categoria: CategoriaContrato;
  }>({
    id: '',
    num_sienge: '',
    empresa: '',
    obra: '',
    disciplina: '',
    subdisciplina: '',
    valor_contrato: 0,
    categoria: 'Projeto',
  });

  const prevOpenRef = useRef(false);

  useEffect(() => {
    const justOpened = isOpen && !prevOpenRef.current;
    prevOpenRef.current = isOpen;

    if (!isOpen) return;

    if (justOpened || contratoParaEditar) {
      if (contratoParaEditar) {
        setFormData({
          id: contratoParaEditar.id,
          num_sienge: contratoParaEditar.num_sienge || '',
          empresa: contratoParaEditar.empresa,
          obra: contratoParaEditar.obra,
          disciplina: contratoParaEditar.disciplina,
          subdisciplina: contratoParaEditar.subdisciplina,
          valor_contrato: contratoParaEditar.valor_contrato,
          categoria: contratoParaEditar.categoria || 'Projeto',
        });
      } else if (justOpened) {
        setFormData({
          id: '',
          num_sienge: '',
          empresa: fornecedores[0]?.fornecedor || '',
          obra: obras[0]?.codigo || '',
          disciplina: disciplinas[0]?.disciplina || '',
          subdisciplina: '',
          valor_contrato: 0,
          categoria: 'Projeto',
        });
      }
    }
  }, [contratoParaEditar, isOpen]);

  if (!isOpen) return null;

  // Filtrar subdisciplinas pela disciplina selecionada
  const subdisciplinasFiltradas = subdisciplinas.filter(
    (s) => !formData.disciplina || s.disciplina.toUpperCase() === formData.disciplina.toUpperCase()
  );

  const handleFornecedorChange = (empresaNome: string) => {
    const f = fornecedores.find((forn) => forn.fornecedor === empresaNome);
    const isLegalizacao =
      empresaNome.toUpperCase() === 'TAXAS' ||
      empresaNome.toUpperCase().includes('THAIS') ||
      empresaNome.toUpperCase().includes('COSTA') ||
      f?.tipo?.toUpperCase().includes('LEGALIZA');

    setFormData((prev) => ({
      ...prev,
      empresa: empresaNome,
      // NUNCA sobrescrever o num_sienge digitado pelo usuário com o id_sienge do fornecedor!
      disciplina: f?.tipo ? f.tipo : prev.disciplina,
      categoria: isLegalizacao ? 'Legalização' : prev.categoria,
    }));
  };

  // Verificação de duplicidade em tempo real
  const contratoDuplicado = (contratos || []).find((c) => {
    if (contratoParaEditar && c.id === contratoParaEditar.id) return false;
    if (!formData.empresa || !formData.obra || formData.valor_contrato <= 0) return false;
    const sameEmpresa = c.empresa.trim().toLowerCase() === formData.empresa.trim().toLowerCase();
    const sameObra = c.obra.trim().toLowerCase() === formData.obra.trim().toLowerCase();
    const sameValor = Math.abs(c.valor_contrato - Number(formData.valor_contrato)) < 0.01;
    return sameEmpresa && sameObra && sameValor;
  });

  const contratoMesmoSienge = (contratos || []).find((c) => {
    if (contratoParaEditar && c.id === contratoParaEditar.id) return false;
    if (!formData.num_sienge || formData.num_sienge.trim() === '') return false;
    return (c.num_sienge || '').trim() === formData.num_sienge.trim();
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.empresa || !formData.obra || formData.valor_contrato <= 0) {
      alert('Por favor, preencha a empresa, obra e um valor de contrato válido.');
      return;
    }

    if (contratoMesmoSienge) {
      const confirma = confirm(
        `Atenção: Já existe o contrato ${contratoMesmoSienge.id} cadastrado com o Nº Sienge "${formData.num_sienge}" (${contratoMesmoSienge.empresa} na obra ${contratoMesmoSienge.obra}).\n\nDeseja realmente cadastrar outro contrato com este mesmo número Sienge?`
      );
      if (!confirma) return;
    }

    if (contratoDuplicado) {
      const confirma = confirm(
        `Aviso de Duplicidade:\nJá existe o contrato ${contratoDuplicado.id} cadastrado para "${contratoDuplicado.empresa}" na obra "${contratoDuplicado.obra}" com o mesmo valor de ${formatCurrency(contratoDuplicado.valor_contrato)} (${contratoDuplicado.disciplina}).\n\nDeseja realmente cadastrar um novo contrato avulso ou prefere cancelar para verificar?`
      );
      if (!confirma) return;
    }

    onSalvar({
      id: formData.id || undefined,
      num_sienge: formData.num_sienge,
      empresa: formData.empresa,
      obra: formData.obra,
      disciplina: formData.disciplina,
      subdisciplina: formData.subdisciplina || formData.disciplina,
      valor_contrato: Number(formData.valor_contrato),
      categoria: formData.categoria,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-0">
      <div className="bg-white dark:bg-[#072B3B] rounded-2xl border border-slate-200 dark:border-[#0B384D] max-w-lg w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-[#0B384D] flex items-center justify-between bg-slate-50/50 dark:bg-[#072432]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00A3C4]/15 text-[#00A3C4] dark:text-[#00C4EB]">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                {contratoParaEditar ? 'Editar Contrato' : 'Novo Contrato'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Preencha os dados do contrato com o fornecedor
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

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* ID Contrato (se novo pode ser gerado automático) */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Código Contrato (ID)
              </label>
              <Input
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                placeholder="Ex: CT062 (ou automático)"
                className="text-xs h-9 rounded-xl bg-slate-50 dark:bg-[#0B384D]"
              />
            </div>

            {/* Número Sienge */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Nº Contrato Sienge
              </label>
              <Input
                value={formData.num_sienge}
                onChange={(e) => setFormData({ ...formData, num_sienge: e.target.value })}
                placeholder="Ex: 593"
                className="text-xs h-9 rounded-xl bg-slate-50 dark:bg-[#0B384D]"
              />
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                Nº do contrato gerado no Sienge
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Obra */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Obra *
              </label>
              <select
                value={formData.obra}
                onChange={(e) => setFormData({ ...formData, obra: e.target.value })}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B384D] border border-slate-200 dark:border-[#0B384D] text-slate-800 dark:text-slate-100 h-9"
                required
              >
                {obras.map((o) => (
                  <option key={o.id} value={o.codigo}>
                    {o.codigo} - {o.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Fornecedor / Empresa */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Empresa / Fornecedor *
                </label>
                {fornecedores.find((f) => f.fornecedor === formData.empresa)?.id_sienge && (
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-400">
                    Credor #{fornecedores.find((f) => f.fornecedor === formData.empresa)?.id_sienge}
                  </span>
                )}
              </div>
              <select
                value={formData.empresa}
                onChange={(e) => handleFornecedorChange(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B384D] border border-slate-200 dark:border-[#0B384D] text-slate-800 dark:text-slate-100 h-9"
                required
              >
                {fornecedores.map((f) => (
                  <option key={f.id} value={f.fornecedor}>
                    {f.fornecedor} {f.tipo ? `(${f.tipo})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Disciplina */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Disciplina
              </label>
              <select
                value={formData.disciplina}
                onChange={(e) => setFormData({ ...formData, disciplina: e.target.value, subdisciplina: '' })}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B384D] border border-slate-200 dark:border-[#0B384D] text-slate-800 dark:text-slate-100 h-9"
              >
                {disciplinas.map((d) => (
                  <option key={d.id} value={d.disciplina}>
                    {d.disciplina}
                  </option>
                ))}
              </select>
            </div>

            {/* Subdisciplina */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Subdisciplina
              </label>
              <select
                value={formData.subdisciplina}
                onChange={(e) => setFormData({ ...formData, subdisciplina: e.target.value })}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B384D] border border-slate-200 dark:border-[#0B384D] text-slate-800 dark:text-slate-100 h-9"
              >
                <option value="">Selecione ou igual à disciplina</option>
                {subdisciplinasFiltradas.map((s) => (
                  <option key={s.id} value={s.subdisciplina}>
                    {s.subdisciplina}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Categoria */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Tipo / Categoria *
              </label>
              <select
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value as CategoriaContrato })}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B384D] border border-slate-200 dark:border-[#0B384D] text-slate-800 dark:text-slate-100 h-9"
              >
                <option value="Projeto">Projeto (Projetos / Eng.)</option>
                <option value="Legalização">Legalização (Taxas / Órgãos)</option>
              </select>
            </div>

            {/* Valor do Contrato */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Valor Total (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  R$
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor_contrato || ''}
                  onChange={(e) => setFormData({ ...formData, valor_contrato: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  className="pl-9 text-xs h-9 rounded-xl bg-slate-50 dark:bg-[#0B384D] font-bold"
                  required
                />
              </div>
            </div>
          </div>

          {/* Alertas visuais de Duplicidade em tempo real */}
          {contratoMesmoSienge && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
              <div>
                <p className="font-bold">Aviso: Nº Sienge já utilizado</p>
                <p className="text-[11px] mt-0.5 leading-tight">
                  O contrato <strong>{contratoMesmoSienge.id}</strong> ({contratoMesmoSienge.empresa} na obra {contratoMesmoSienge.obra}) já possui o Nº Sienge "{formData.num_sienge}".
                </p>
              </div>
            </div>
          )}

          {contratoDuplicado && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
              <div>
                <p className="font-bold">Aviso: Possível contrato duplicado</p>
                <p className="text-[11px] mt-0.5 leading-tight">
                  Já existe o contrato <strong>{contratoDuplicado.id}</strong> ({contratoDuplicado.empresa} na obra {contratoDuplicado.obra}) com o mesmo valor de {formatCurrency(contratoDuplicado.valor_contrato)}.
                </p>
              </div>
            </div>
          )}

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
              {contratoParaEditar ? 'Atualizar Contrato' : 'Cadastrar Contrato'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
