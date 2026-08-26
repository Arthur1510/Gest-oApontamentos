"use client";

import React from 'react';
import { ConflitoArcis, StatusConflitoArcis, STATUS_ARCIS_OPCOES } from '@/types/arcis';
import { ArcisStatusBadge } from '@/components/arcis/ArcisStatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ShieldAlert,
  Building,
  Layers,
  MapPin,
  Calendar,
  Eye,
  Edit2,
  Trash2,
  ArrowRight,
  Sparkles,
  FolderKanban,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ArcisConflictCardProps {
  conflito: ConflitoArcis;
  projectName?: string;
  onViewDetails: (conflito: ConflitoArcis) => void;
  onEdit?: (conflito: ConflitoArcis) => void;
  onDelete?: (id: string) => void;
  onQuickStatusChange?: (id: string, newStatus: StatusConflitoArcis) => void;
}

export function ArcisConflictCard({
  conflito,
  projectName,
  onViewDetails,
  onEdit,
  onDelete,
  onQuickStatusChange,
}: ArcisConflictCardProps) {
  const isNormativo = conflito.tipo_conflito.toLowerCase().includes('normativ');
  const nomeProjeto = conflito.projetos?.nome || projectName;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 border-slate-200/90 dark:border-[#0B384D] dark:bg-[#072B3B] group flex flex-col justify-between">
      {/* Topo do Card com Código e Status */}
      <div className="p-4 sm:p-5 pb-3 border-b border-slate-100 dark:border-[#0B384D] space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-[#072B3B] dark:bg-white text-white dark:text-[#072B3B] font-black text-xs font-mono shadow-xs border border-[#00A3C4]/30">
              #{conflito.codigo_conflito}
            </span>
            <span
              className={cn(
                'text-[10.5px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider',
                isNormativo
                  ? 'bg-rose-500/10 text-rose-700 border-rose-300 dark:text-rose-400 dark:border-rose-800'
                  : 'bg-cyan-500/10 text-[#008EA9] border-[#00A3C4]/30 dark:text-[#00C4EB]'
              )}
            >
              {conflito.tipo_conflito}
            </span>
          </div>

          <ArcisStatusBadge status={conflito.status_arcis} size="sm" />
        </div>

        {/* Disciplinas: Principal -> Envolvidas */}
        <div className="flex items-center flex-wrap gap-1.5 pt-1 text-xs">
          <span className="px-2 py-0.5 rounded-md bg-[#00A3C4]/15 text-[#008EA9] dark:text-[#00C4EB] font-black uppercase text-[11px] border border-[#00A3C4]/30">
            {conflito.disciplina_principal}
          </span>

          {conflito.disciplinas_envolvidas && conflito.disciplinas_envolvidas.length > 0 && (
            <>
              <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
              {conflito.disciplinas_envolvidas.map((disc, idx) => (
                <span
                  key={`disc-env-${idx}`}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#0B384D] text-slate-700 dark:text-slate-300 font-bold uppercase text-[10.5px] border border-slate-200 dark:border-slate-700"
                >
                  {disc}
                </span>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Conteúdo Central */}
      <CardContent className="p-4 sm:p-5 pt-3 space-y-3 flex-1">
        {/* Metadados Espaciais (Edificação, Pavimentos, Local) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-[#041A24] p-2.5 rounded-xl border border-slate-200/70 dark:border-[#0B384D]">
          <div className="flex items-center gap-1.5 truncate">
            <Building className="h-3.5 w-3.5 text-[#00A3C4] shrink-0" />
            <span className="font-semibold truncate">{conflito.edificacao || 'TORRE'}</span>
          </div>

          {conflito.localizacao && (
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
              <span className="font-semibold truncate" title={conflito.localizacao}>
                {conflito.localizacao}
              </span>
            </div>
          )}

          {conflito.pavimentos && conflito.pavimentos.length > 0 && (
            <div className="sm:col-span-2 flex items-start gap-1.5 text-[11px] pt-1 border-t border-slate-200/50 dark:border-[#0B384D]/50">
              <Layers className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
              <div className="flex flex-wrap gap-1 flex-1">
                {conflito.pavimentos.slice(0, 3).map((pav, pIdx) => (
                  <span
                    key={`pav-${pIdx}`}
                    className="px-1.5 py-0.2 rounded bg-white dark:bg-[#072B3B] border border-slate-200 dark:border-[#0B384D] text-[10px] font-bold text-slate-700 dark:text-slate-200"
                  >
                    {pav}
                  </span>
                ))}
                {conflito.pavimentos.length > 3 && (
                  <span className="text-[10px] font-bold text-slate-500 self-center">
                    +{conflito.pavimentos.length - 3} níveis
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Descrição do Conflito */}
        <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3 leading-relaxed">
          {conflito.descricao}
        </p>

        {/* Data e Relatório de Origem */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {conflito.data_criacao_arcis || new Date(conflito.created_at).toLocaleDateString('pt-BR')}
          </span>

          {nomeProjeto && (
            <span
              className="flex items-center gap-1 font-bold text-[#008EA9] dark:text-[#00C4EB] bg-[#00A3C4]/10 dark:bg-[#00A3C4]/20 px-2 py-0.5 rounded-md border border-[#00A3C4]/25 truncate max-w-[170px]"
              title={nomeProjeto}
            >
              <FolderKanban className="h-3 w-3 shrink-0 text-[#00A3C4]" />
              <span className="truncate">{nomeProjeto}</span>
            </span>
          )}
        </div>
      </CardContent>

      {/* Rodapé de Ações */}
      <div className="p-3 bg-slate-50/80 dark:bg-[#041A24]/60 border-t border-slate-100 dark:border-[#0B384D] flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewDetails(conflito)}
          className="text-xs font-bold text-[#00A3C4] dark:text-[#00C4EB] hover:bg-[#00A3C4]/10 h-8 gap-1.5"
        >
          <Eye className="h-3.5 w-3.5" /> Ver Ficha ARCIS
        </Button>

        <div className="flex items-center gap-1">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(conflito)}
              className="h-8 w-8 text-slate-500 hover:text-slate-800 dark:hover:text-white"
              title="Editar Conflito"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
          )}

          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(conflito.id)}
              className="h-8 w-8 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400"
              title="Excluir Conflito"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
