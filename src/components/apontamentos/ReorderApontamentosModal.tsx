"use client";

import React, { useState, useEffect } from 'react';
import {
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Sparkles,
  Check,
  Layers,
  ShieldAlert,
  ListOrdered,
  Building2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Apontamento } from '@/types/apontamento';
import { SortCriteria, sortApontamentos } from '@/lib/sorting';

interface ReorderApontamentosModalProps {
  isOpen: boolean;
  onClose: () => void;
  apontamentos: Apontamento[];
  onApplyOrder: (newOrderedList: Apontamento[], criteria: SortCriteria) => void;
  currentCriteria?: SortCriteria;
  title?: string;
  description?: string;
  confirmLabel?: string;
}

export function ReorderApontamentosModal({
  isOpen,
  onClose,
  apontamentos,
  onApplyOrder,
  currentCriteria = 'data_desc',
  title = 'Organizar Sequência dos Apontamentos',
  description = 'Ajuste a ordem em que os apontamentos aparecem no relatório e na apresentação. Use os botões rápidos ou reordene individualmente.',
  confirmLabel = 'Aplicar Sequência',
}: ReorderApontamentosModalProps) {
  const [items, setItems] = useState<Apontamento[]>([]);
  const [activeCriteria, setActiveCriteria] = useState<SortCriteria>(currentCriteria);

  useEffect(() => {
    if (isOpen) {
      setItems([...apontamentos]);
      setActiveCriteria(currentCriteria);
    }
  }, [isOpen, apontamentos, currentCriteria]);

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return;

    const updated = [...items];
    const [moved] = updated.splice(index, 1);
    updated.splice(target, 0, moved);
    setItems(updated);
    setActiveCriteria('manual');
  };

  const handleMoveToExtreme = (index: number, position: 'top' | 'bottom') => {
    if (position === 'top' && index === 0) return;
    if (position === 'bottom' && index === items.length - 1) return;

    const updated = [...items];
    const [moved] = updated.splice(index, 1);
    if (position === 'top') {
      updated.unshift(moved);
    } else {
      updated.push(moved);
    }
    setItems(updated);
    setActiveCriteria('manual');
  };

  const handleApplyQuickSort = (criteria: SortCriteria) => {
    const sorted = sortApontamentos(items, criteria);
    setItems(sorted);
    setActiveCriteria(criteria);
  };

  const handleConfirm = () => {
    onApplyOrder(items, activeCriteria);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden dark:bg-[#072B3B] dark:border-[#0B384D]">
        {/* Header */}
        <DialogHeader className="p-5 pb-3 border-b border-slate-200 dark:border-[#0B384D] bg-slate-50/70 dark:bg-[#041A24]/60">
          <div className="flex items-center gap-2 text-[#00A3C4] dark:text-[#00C4EB] text-xs font-bold uppercase tracking-wider">
            <ListOrdered className="h-4 w-4" /> Gestão de Sequência • Relatório & Apresentação
          </div>
          <DialogTitle className="text-xl font-black text-[#072B3B] dark:text-white">
            {title} ({items.length} Apontamentos)
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            {description}
          </DialogDescription>

          {/* Barra de Ordenação Automática Rápida */}
          <div className="pt-2">
            <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-[#00A3C4]" /> Ordenação Automática Pré-Definida:
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Button
                type="button"
                variant={activeCriteria === 'pavimento' ? 'wcc' : 'outline'}
                size="sm"
                onClick={() => handleApplyQuickSort('pavimento')}
                className="text-xs h-7 gap-1"
              >
                <Layers className="h-3 w-3" /> Por Pavimento (Estrutural)
              </Button>
              <Button
                type="button"
                variant={activeCriteria === 'prioridade_desc' ? 'wcc' : 'outline'}
                size="sm"
                onClick={() => handleApplyQuickSort('prioridade_desc')}
                className="text-xs h-7 gap-1"
              >
                <ShieldAlert className="h-3 w-3" /> Prioridade (Alta ➔ Baixa)
              </Button>
              <Button
                type="button"
                variant={activeCriteria === 'data_desc' ? 'wcc' : 'outline'}
                size="sm"
                onClick={() => handleApplyQuickSort('data_desc')}
                className="text-xs h-7 gap-1"
              >
                <Calendar className="h-3 w-3" /> Mais Recentes
              </Button>
              <Button
                type="button"
                variant={activeCriteria === 'data_asc' ? 'wcc' : 'outline'}
                size="sm"
                onClick={() => handleApplyQuickSort('data_asc')}
                className="text-xs h-7 gap-1"
              >
                <Calendar className="h-3 w-3" /> Mais Antigos
              </Button>
              <Button
                type="button"
                variant={activeCriteria === 'disciplina' ? 'wcc' : 'outline'}
                size="sm"
                onClick={() => handleApplyQuickSort('disciplina')}
                className="text-xs h-7 gap-1"
              >
                <Building2 className="h-3 w-3" /> Por Disciplina
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Lista de Itens para Reordenação */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2 max-h-[52vh]">
          {items.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs flex flex-col items-center gap-2">
              <AlertCircle className="h-6 w-6 text-slate-400" />
              Nenhum apontamento disponível para organizar.
            </div>
          ) : (
            items.map((item, index) => {
              const isFirst = index === 0;
              const isLast = index === items.length - 1;

              return (
                <div
                  key={`reorder-item-${item.id}`}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-[#0B384D] bg-white dark:bg-[#072B3B] hover:border-[#00A3C4]/60 dark:hover:border-[#00A3C4]/60 transition-all shadow-2xs group"
                >
                  {/* Posição e Título */}
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-[#072B3B] dark:bg-[#041A24] text-[#00C4EB] text-xs font-black flex items-center justify-center shrink-0 border border-[#00A3C4]/30 shadow-2xs font-mono">
                      #{index + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#072B3B] dark:text-slate-100 truncate">
                        {item.titulo}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[10.5px]">
                        {item.pavimento && (
                          <span className="bg-slate-100 dark:bg-[#041A24] text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded font-medium truncate max-w-[180px]">
                            📍 {item.pavimento}
                          </span>
                        )}
                        <span
                          className={`px-1.5 py-0.2 rounded font-bold text-[9.5px] ${
                            item.prioridade === 'Alta'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : item.prioridade === 'Média'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {item.prioridade}
                        </span>
                        <span className="text-slate-400 text-[10px] truncate">
                          {item.disciplina_origem} ➔ {item.disciplina_destino}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Controles de Movimentação */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveToExtreme(index, 'top')}
                      disabled={isFirst}
                      title="Mover para o Topo (Primeiro)"
                      className="h-8 w-8 p-0 text-slate-500 hover:text-[#00A3C4] disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronsUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleMove(index, 'up')}
                      disabled={isFirst}
                      title="Subir uma posição"
                      className="h-8 w-8 p-0 border-slate-200 dark:border-[#0B384D] hover:border-[#00A3C4] hover:text-[#00A3C4] disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleMove(index, 'down')}
                      disabled={isLast}
                      title="Descer uma posição"
                      className="h-8 w-8 p-0 border-slate-200 dark:border-[#0B384D] hover:border-[#00A3C4] hover:text-[#00A3C4] disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveToExtreme(index, 'bottom')}
                      disabled={isLast}
                      title="Mover para o Fim (Último)"
                      className="h-8 w-8 p-0 text-slate-500 hover:text-[#00A3C4] disabled:opacity-30 cursor-pointer"
                    >
                      <ChevronsDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t border-slate-200 dark:border-[#0B384D] bg-slate-50/70 dark:bg-[#041A24]/60 flex items-center justify-between sm:justify-between w-full">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
            {activeCriteria === 'manual' ? (
              <span className="text-[#00A3C4] font-bold">✨ Ordem manual personalizada aplicada</span>
            ) : (
              <span>Ordem selecionada: <strong>{activeCriteria}</strong></span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
              Cancelar
            </Button>
            <Button
              type="button"
              variant="wcc"
              size="sm"
              onClick={handleConfirm}
              className="text-xs font-bold gap-1.5 cursor-pointer shadow-md"
            >
              <Check className="h-3.5 w-3.5" /> {confirmLabel}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
