"use client";

import React, { useState, useEffect } from 'react';
import {
  Contrato,
  NovoContrato,
  Obra,
  Fornecedor,
  Disciplina,
  Subdisciplina,
  CategoriaContrato,
} from '@/types/orcamento';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Briefcase, DollarSign } from 'lucide-react';

interface ContratoFormModalProps {
  contratoParaEditar: Contrato | null;
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

  useEffect(() => {
    if (contratoParaEditar) {
      setFormData({
        id: contratoParaEditar.id,
        num_sienge: contratoParaEditar.num_sienge,
        empresa: contratoParaEditar.empresa,
        obra: contratoParaEditar.obra,
        disciplina: contratoParaEditar.disciplina,
        subdisciplina: contratoParaEditar.subdisciplina,
        valor_contrato: contratoParaEditar.valor_contrato,
        categoria: contratoParaEditar.categoria || 'Projeto',
      });
    } else {
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
  }, [contratoParaEditar, obras, fornecedores, disciplinas, isOpen]);

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
      num_sienge: f?.id_sienge ? String(f.id_sienge) : prev.num_sienge,
      disciplina: f?.tipo ? f.tipo : prev.disciplina,
      categoria: isLegalizacao ? 'Legalização' : prev.categoria,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.empresa || !formData.obra || formData.valor_contrato <= 0) {
      alert('Por favor, preencha a empresa, obra e um valor de contrato válido.');
      return;
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
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Empresa / Fornecedor *
              </label>
              <select
                value={formData.empresa}
                onChange={(e) => handleFornecedorChange(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B384D] border border-slate-200 dark:border-[#0B384D] text-slate-800 dark:text-slate-100 h-9"
                required
              >
                {fornecedores.map((f) => (
                  <option key={f.id} value={f.fornecedor}>
                    {f.fornecedor} ({f.tipo})
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
