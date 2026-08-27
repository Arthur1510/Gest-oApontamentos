"use client";

import React, { useState } from 'react';
import { ConflitoArcis, StatusConflitoArcis, STATUS_ARCIS_OPCOES } from '@/types/arcis';
import { ArcisStatusBadge } from '@/components/arcis/ArcisStatusBadge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SelectNative } from '@/components/ui/select-native';
import { Textarea } from '@/components/ui/textarea';
import {
  ShieldAlert,
  Building,
  Layers,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  FileText,
  Save,
  Clock,
  Sparkles,
  FolderKanban,
} from 'lucide-react';
import { formatDateBR } from '@/lib/arcis-parser';

interface ArcisConflictDetailModalProps {
  conflito: ConflitoArcis | null;
  projectName?: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus?: (id: string, newStatus: StatusConflitoArcis, solucao?: string) => Promise<void> | void;
}

export function ArcisConflictDetailModal({
  conflito,
  projectName,
  isOpen,
  onClose,
  onUpdateStatus,
}: ArcisConflictDetailModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<StatusConflitoArcis>(
    conflito?.status_arcis || 'Aguardando Solução'
  );
  const [solucaoText, setSolucaoText] = useState(conflito?.solucao || '');
  const [isSaving, setIsSaving] = useState(false);

  // Sincronizar estado local quando abrir com novo conflito
  React.useEffect(() => {
    if (conflito) {
      setSelectedStatus(conflito.status_arcis);
      setSolucaoText(conflito.solucao || '');
    }
  }, [conflito]);

  if (!conflito) return null;

  const nomeProjeto = conflito.projetos?.nome || projectName || 'Projeto Não Vinculado';

  const handleSave = async () => {
    if (!onUpdateStatus) return;
    try {
      setIsSaving(true);
      await onUpdateStatus(conflito.id, selectedStatus, solucaoText);
      onClose();
    } catch (err) {
      console.error('Erro ao salvar atualização do conflito ARCIS:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
        <DialogHeader className="border-b border-slate-200 dark:border-[#0B384D] pb-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="px-3 py-1 rounded-xl bg-[#072B3B] text-white font-mono font-black text-sm border border-[#00A3C4]/40">
                Conflito #{conflito.codigo_conflito}
              </span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#00A3C4]/15 text-[#008EA9] dark:text-[#00C4EB] border border-[#00A3C4]/30 uppercase">
                {conflito.tipo_conflito}
              </span>
            </div>

            <ArcisStatusBadge status={selectedStatus} />
          </div>

          <DialogTitle className="text-xl font-black text-[#072B3B] dark:text-white pt-1">
            Ficha de Compatibilização Técnica ARCIS
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Relatório de Origem: {conflito.numero_relatorio || 'RSC Oficial'} • Empreendimento:{' '}
            <span className="font-bold text-[#00A3C4] dark:text-[#00C4EB]">{nomeProjeto}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Quadro de Metadados Técnicos do PDF */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 dark:bg-[#041A24] p-4 rounded-2xl border border-slate-200/80 dark:border-[#0B384D] text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Empreendimento WCC
            </span>
            <span className="font-extrabold text-[#00A3C4] dark:text-[#00C4EB] text-sm block mt-0.5 truncate flex items-center gap-1" title={nomeProjeto}>
              <FolderKanban className="h-3.5 w-3.5 shrink-0 text-[#00A3C4]" />
              <span className="truncate">{nomeProjeto}</span>
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Disciplina Principal
            </span>
            <span className="font-extrabold text-slate-800 dark:text-slate-100 text-sm block mt-0.5 truncate">
              {conflito.disciplina_principal}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Disciplinas Envolvidas
            </span>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {conflito.disciplinas_envolvidas && conflito.disciplinas_envolvidas.length > 0 ? (
                conflito.disciplinas_envolvidas.map((disc, idx) => (
                  <span
                    key={`modal-disc-${idx}`}
                    className="font-bold text-slate-700 dark:text-slate-200 text-xs"
                  >
                    {disc}
                  </span>
                ))
              ) : (
                <span className="text-slate-400 text-xs">-</span>
              )}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Edificação & Local
            </span>
            <span className="font-bold text-slate-700 dark:text-slate-200 text-xs block mt-0.5 truncate">
              {conflito.edificacao} • {conflito.localizacao || conflito.local_edificacao || 'Geral'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Data de Criação
            </span>
            <span className="font-bold text-slate-700 dark:text-slate-200 text-xs block mt-0.5 flex items-center gap-1">
              <Calendar className="h-3 w-3 text-slate-400" />
              {conflito.data_criacao_arcis ? formatDateBR(conflito.data_criacao_arcis) : new Date(conflito.created_at).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>

        {/* Pavimentos Afetados */}
        {conflito.pavimentos && conflito.pavimentos.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-amber-500" /> Pavimentos Afetados:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {conflito.pavimentos.map((pav, idx) => (
                <span
                  key={`detail-pav-${idx}`}
                  className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-900/50 text-xs font-bold"
                >
                  {pav}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Descrição Detalhada do Relatório ARCIS */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-[#00A3C4]" /> Parecer Técnico & Descrição do Conflito:
          </label>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#072B3B] border border-slate-200 dark:border-[#0B384D] text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-sans">
            {conflito.descricao}
          </div>
        </div>

        {/* Gestão de Solução & Alteração de Status */}
        <div className="p-4 rounded-2xl bg-[#00A3C4]/5 dark:bg-[#00A3C4]/10 border border-[#00A3C4]/20 space-y-4">
          <div className="flex items-center gap-2 text-xs font-black text-[#072B3B] dark:text-white uppercase tracking-wider">
            <Sparkles className="h-4 w-4 text-[#00A3C4]" /> Encaminhamento & Resolução WCC
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="modal-status-select" className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 uppercase tracking-wider">
                Atualizar Status ARCIS:
              </label>
              <SelectNative
                id="modal-status-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as StatusConflitoArcis)}
                className="h-10 text-xs font-bold rounded-xl bg-white dark:bg-[#072B3B] border-[#00A3C4]/40"
              >
                {STATUS_ARCIS_OPCOES.map((st) => (
                  <option key={`opt-st-${st}`} value={st}>
                    {st}
                  </option>
                ))}
              </SelectNative>
            </div>

            <div>
              <label htmlFor="modal-solucao-textarea" className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 uppercase tracking-wider">
                Diretriz de Solução / Resposta:
              </label>
              <Textarea
                id="modal-solucao-textarea"
                placeholder="Insira a diretriz da construtora ou resposta técnica para este conflito..."
                value={solucaoText}
                onChange={(e) => setSolucaoText(e.target.value)}
                className="text-xs h-20 bg-white dark:bg-[#072B3B]"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between border-t border-slate-200 dark:border-[#0B384D] pt-4">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Fechar
          </Button>

          {onUpdateStatus && (
            <Button
              variant="wcc-gradient"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="text-xs font-bold gap-2"
            >
              <Save className="h-3.5 w-3.5" /> {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
