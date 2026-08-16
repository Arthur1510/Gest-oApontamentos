"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, ArrowRight, CheckCircle2, AlertCircle, Trash2, ExternalLink, ShieldAlert, Lightbulb, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Apontamento } from '@/types/apontamento';
import { formatDate } from '@/lib/utils';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

interface ApontamentoDetailModalProps {
  apontamento: Apontamento | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleStatus: (apontamento: Apontamento) => void;
  onDelete: (id: string) => void;
  onUpdateSolucao?: (id: string, solucao: string) => void;
}

export function ApontamentoDetailModal({
  apontamento,
  isOpen,
  onClose,
  onToggleStatus,
  onDelete,
  onUpdateSolucao,
}: ApontamentoDetailModalProps) {
  const [solucaoTexto, setSolucaoTexto] = useState('');
  const [isSavingSolucao, setIsSavingSolucao] = useState(false);
  const [isEditingSolucao, setIsEditingSolucao] = useState(false);

  useEffect(() => {
    if (apontamento) {
      setSolucaoTexto(apontamento.solucao || '');
      setIsEditingSolucao(!apontamento.solucao);
    }
  }, [apontamento]);

  if (!apontamento) return null;

  const handleSaveSolucao = async () => {
    if (!apontamento) return;
    try {
      setIsSavingSolucao(true);
      apontamento.solucao = solucaoTexto.trim();

      if (isSupabaseConfigured() && supabase) {
        await supabase
          .from('apontamentos')
          .update({ solucao: solucaoTexto.trim() || null })
          .eq('id', apontamento.id);
      }

      if (onUpdateSolucao) {
        onUpdateSolucao(apontamento.id, solucaoTexto.trim());
      }
      setIsEditingSolucao(false);
    } catch (err) {
      console.error('Erro ao salvar solução:', err);
    } finally {
      setIsSavingSolucao(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 pr-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={apontamento.status === 'Resolvido' ? 'resolvido' : 'aberto'}>
                {apontamento.status}
              </Badge>
              <Badge
                variant={
                  apontamento.prioridade === 'Alta'
                    ? 'alta'
                    : apontamento.prioridade === 'Média'
                    ? 'media'
                    : 'baixa'
                }
              >
                Prioridade {apontamento.prioridade}
              </Badge>

              {/* Badge Tipo do Conflito */}
              <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" />
                {apontamento.tipo_conflito || 'Conflito Físico'}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(apontamento.created_at)}
            </div>
          </div>
          <DialogTitle className="text-xl mt-2">{apontamento.titulo}</DialogTitle>
          <DialogDescription>
            Detalhes do conflito e acompanhamento técnico entre disciplinas.
          </DialogDescription>
        </DialogHeader>

        {/* Informações da Rota de Disciplina */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-850 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
          <span className="text-slate-500 uppercase text-[11px] font-semibold tracking-wider">Origem:</span>
          <span className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs font-semibold text-indigo-600 dark:text-indigo-400">
            {apontamento.disciplina_origem}
          </span>
          <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
          <span className="text-slate-500 uppercase text-[11px] font-semibold tracking-wider">Destino:</span>
          <span className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs font-semibold text-rose-600 dark:text-rose-400">
            {apontamento.disciplina_destino}
          </span>
        </div>

        {/* Imagem em tamanho grande */}
        {apontamento.url_imagem && (
          <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-900 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={apontamento.url_imagem}
              alt={apontamento.titulo}
              className="w-full h-64 object-cover object-center max-h-80"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <a
              href={apontamento.url_imagem}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-md backdrop-blur-sm flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Abrir imagem original
            </a>
          </div>
        )}

        {/* Descrição em destaque */}
        <div className="space-y-1.5 py-1">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Descrição Técnica</h4>
          <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed bg-slate-50/50 dark:bg-slate-900/50 p-3.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
            {apontamento.descricao}
          </p>
        </div>

        {/* Guia / Bloco de Solução Proposta */}
        <div className="space-y-2 py-1 bg-emerald-50/60 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-800/40">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Guia de Solução Técnica / Diretriz
            </h4>
            {!isEditingSolucao && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingSolucao(true)}
                className="text-xs text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 h-7 px-2"
              >
                Editar Solução
              </Button>
            )}
          </div>

          {isEditingSolucao ? (
            <div className="space-y-2">
              <Textarea
                placeholder="Descreva a solução proposta, alteração de traçado ou diretriz de engenharia..."
                value={solucaoTexto}
                onChange={(e) => setSolucaoTexto(e.target.value)}
                rows={3}
                className="text-xs bg-white dark:bg-slate-950 border-emerald-300 dark:border-emerald-800"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingSolucao(false)}
                  className="text-xs h-7"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="emerald"
                  size="sm"
                  onClick={handleSaveSolucao}
                  disabled={isSavingSolucao}
                  className="text-xs h-7 gap-1"
                >
                  <Save className="h-3 w-3" /> Salvando...
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-slate-800 dark:text-slate-200 text-xs leading-relaxed font-normal whitespace-pre-wrap">
              {solucaoTexto || 'Nenhuma solução foi registrada ainda. Clique em "Editar Solução" para adicionar as diretrizes de resolução.'}
            </p>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row justify-between sm:justify-between items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm('Tem certeza de que deseja excluir este apontamento?')) {
                onDelete(apontamento.id);
                onClose();
              }
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs gap-1.5 self-start sm:self-auto"
          >
            <Trash2 className="h-4 w-4" /> Excluir Apontamento
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant={apontamento.status === 'Aberto' ? 'emerald' : 'outline'}
              size="sm"
              onClick={() => {
                onToggleStatus(apontamento);
                onClose();
              }}
              className="gap-1.5 text-xs"
            >
              {apontamento.status === 'Aberto' ? (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Marcar como Resolvido
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-amber-500" /> Reabrir Apontamento
                </>
              )}
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={onClose} className="text-xs">
              Fechar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
