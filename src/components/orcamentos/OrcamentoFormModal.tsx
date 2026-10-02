"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  ItemOrcamento,
  NovoItemOrcamento,
  Obra,
  Disciplina,
  Subdisciplina,
  StatusOrcamento,
  CategoriaContrato,
  STATUS_ORCAMENTO_OPCOES,
} from '@/types/orcamento';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, DollarSign } from 'lucide-react';

interface OrcamentoFormModalProps {
  itemParaEditar: ItemOrcamento | null;
  obras: Obra[];
  disciplinas: Disciplina[];
  subdisciplinas: Subdisciplina[];
  isOpen: boolean;
  onClose: () => void;
  onSalvar: (item: ItemOrcamento | (NovoItemOrcamento & { id?: string })) => Promise<boolean | void> | void;
}

export function OrcamentoFormModal({
  itemParaEditar,
  obras,
  disciplinas,
  subdisciplinas,
  isOpen,
  onClose,
  onSalvar,
}: OrcamentoFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<{
    id: string;
    obra: string;
    disciplina: string;
    subdisciplina: string;
    orcamento_base: number;
    status: StatusOrcamento;
    categoria: CategoriaContrato;
  }>({
    id: '',
    obra: '',
    disciplina: '',
    subdisciplina: '',
    orcamento_base: 0,
    status: 'A contratar',
    categoria: 'Projeto',
  });

  useEffect(() => {
    if (!isOpen) return;
    if (itemParaEditar) {
      setFormData({
        id: itemParaEditar.id,
        obra: itemParaEditar.obra,
        disciplina: itemParaEditar.disciplina,
        subdisciplina: itemParaEditar.subdisciplina,
        orcamento_base: Number(itemParaEditar.orcamento_base) || 0,
        status: itemParaEditar.status,
        categoria: itemParaEditar.categoria || 'Projeto',
      });
    } else {
      setFormData({
        id: '',
        obra: obras[0]?.codigo || '',
        disciplina: disciplinas[0]?.disciplina || '',
        subdisciplina: '',
        orcamento_base: 0,
        status: 'A contratar',
        categoria: 'Projeto',
      });
    }
  }, [itemParaEditar, isOpen, obras, disciplinas]);

  const obrasDisponiveis = useMemo(() => {
    const list = [...obras];
    if (formData.obra && !list.some((o: Obra) => o.codigo.toUpperCase() === formData.obra.toUpperCase())) {
      list.push({
        id: `OBR_CUSTOM`,
        codigo: formData.obra,
        nome: formData.obra,
        cc: '',
        status: 'Ativa',
      });
    }
    return list;
  }, [obras, formData.obra]);

  const disciplinasDisponiveis = useMemo(() => {
    const list = [...disciplinas];
    if (formData.disciplina && !list.some((d: Disciplina) => d.disciplina.toUpperCase() === formData.disciplina.toUpperCase())) {
      list.push({
        id: `DISC_CUSTOM`,
        disciplina: formData.disciplina,
        codigo: formData.disciplina.slice(0, 4).toUpperCase(),
      });
    }
    return list;
  }, [disciplinas, formData.disciplina]);

  const subdisciplinasFiltradas = subdisciplinas.filter(
    (s: Subdisciplina) => !formData.disciplina || s.disciplina.toUpperCase() === formData.disciplina.toUpperCase()
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.obra || !formData.disciplina || isNaN(formData.orcamento_base) || formData.orcamento_base < 0) {
      alert('Por favor, selecione a obra, disciplina e informe um orçamento base válido (maior ou igual a zero).');
      return;
    }

    const obraObj = obrasDisponiveis.find((o: Obra) => o.codigo === formData.obra);

    setIsSubmitting(true);
    try {
      const res = await onSalvar({
        id: formData.id || undefined,
        obra: formData.obra,
        nome_obra: obraObj?.nome || formData.obra,
        disciplina: formData.disciplina,
        subdisciplina: formData.subdisciplina || formData.disciplina,
        orcamento_base: Number(formData.orcamento_base) || 0,
        status: formData.status,
        categoria: formData.categoria,
      });
      if (res !== false) {
        onClose();
      }
    } catch (err: any) {
      console.error('Erro ao salvar item:', err);
      alert(`Erro ao salvar: ${err?.message || 'Falha ao processar operação'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-0">
      <div className="bg-white dark:bg-[#072B3B] rounded-2xl border border-slate-200 dark:border-[#0B384D] max-w-md w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-[#0B384D] flex items-center justify-between bg-slate-50/50 dark:bg-[#072432]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00A3C4]/15 text-[#00A3C4] dark:text-[#00C4EB]">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                {itemParaEditar ? 'Editar Item de Orçamento' : 'Novo Item de Orçamento'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cadastro de estimativa orçamentária por disciplina
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
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
              {obrasDisponiveis.map((o: Obra) => (
                <option key={o.id} value={o.codigo}>
                  {o.codigo} - {o.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Disciplina */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Disciplina *
            </label>
            <select
              value={formData.disciplina}
              onChange={(e) => {
                const disc = e.target.value;
                const isLeg = disc.toUpperCase().includes('TAXA') || disc.toUpperCase().includes('LEGALIZA');
                setFormData({
                  ...formData,
                  disciplina: disc,
                  subdisciplina: '',
                  categoria: isLeg ? 'Legalização' : formData.categoria,
                });
              }}
              className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B384D] border border-slate-200 dark:border-[#0B384D] text-slate-800 dark:text-slate-100 h-9"
              required
            >
              {disciplinasDisponiveis.map((d: Disciplina) => (
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
            <Input
              value={formData.subdisciplina}
              onChange={(e) => setFormData({ ...formData, subdisciplina: e.target.value })}
              placeholder="Ex: ARQUITETURA LEGAL, SONDAGEM..."
              list="subdisciplinas-list"
              className="text-xs h-9 rounded-xl bg-slate-50 dark:bg-[#0B384D]"
            />
            <datalist id="subdisciplinas-list">
              {subdisciplinasFiltradas.map((s) => (
                <option key={s.id} value={s.subdisciplina} />
              ))}
            </datalist>
          </div>

          {/* Orçamento Base */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Orçamento Base (R$) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                R$
              </span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.orcamento_base !== undefined ? formData.orcamento_base : ''}
                onChange={(e) => setFormData({ ...formData, orcamento_base: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="pl-9 text-xs h-9 rounded-xl bg-slate-50 dark:bg-[#0B384D] font-bold"
                required
              />
            </div>
          </div>

          {/* Categoria e Status */}
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

            {/* Status */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Status do Orçamento
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as StatusOrcamento })}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B384D] border border-slate-200 dark:border-[#0B384D] text-slate-800 dark:text-slate-100 h-9"
              >
                {STATUS_ORCAMENTO_OPCOES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-[#0B384D]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={onClose}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-[#00A3C4] hover:bg-[#008EA9] text-white text-xs font-bold gap-2"
            >
              {isSubmitting ? 'Salvando no Banco...' : itemParaEditar ? 'Atualizar Item' : 'Salvar Item'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
