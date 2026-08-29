"use client";

import React, { useState } from 'react';
import { ConflitoArcis, StatusConflitoArcis } from '@/types/arcis';
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
  Images,
  Image as ImageIcon,
  Lightbulb,
  ZoomIn,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateBR, normalizeTipoConflitoArcis, cleanDescriptionText } from '@/lib/arcis-utils';

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
}: ArcisConflictCardProps) {
  const [imageError, setImageError] = useState(false);
  const tipoConflitoClean = normalizeTipoConflitoArcis(conflito.tipo_conflito);
  const descricaoClean = cleanDescriptionText(conflito.descricao);
  const isNormativo = tipoConflitoClean.toLowerCase().includes('normativ');
  const nomeProjeto = conflito.projetos?.nome || projectName;
  const conflictImage = !imageError && (conflito.url_imagem || (conflito.imagens && conflito.imagens.length > 0 ? conflito.imagens[0] : null));
  const totalImagens = conflito.imagens && conflito.imagens.length > 0 ? conflito.imagens.length : (conflito.url_imagem ? 1 : 0);

  return (
    <Card className="overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border-slate-200/90 dark:border-[#0B384D] dark:bg-[#072B3B] group flex flex-col justify-between rounded-2xl bg-white">
      <div>
        {/* QUADRO DEDICADO DE IMAGEM TÉCNICA ARCIS */}
        {conflictImage ? (
          <div
            onClick={() => onViewDetails(conflito)}
            className="relative h-44 w-full overflow-hidden bg-[#041A24] cursor-pointer border-b border-slate-100 dark:border-[#0B384D]"
            title="Clique para ampliar a foto técnica"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={conflictImage}
              alt={`Conflito #${conflito.codigo_conflito}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-95 group-hover:opacity-100"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#072B3B]/90 via-transparent to-black/20 opacity-70 group-hover:opacity-40 transition-opacity" />

            {/* Badges Flutuantes sobre a Imagem */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
              <span className="px-2.5 py-1 rounded-lg bg-[#072B3B]/90 dark:bg-white text-white dark:text-[#072B3B] font-black text-xs font-mono shadow-md border border-[#00A3C4]/40 backdrop-blur-xs">
                #{conflito.codigo_conflito}
              </span>
              <span
                className={cn(
                  'text-[10px] font-extrabold px-2 py-0.5 rounded-md border uppercase tracking-wider backdrop-blur-md shadow-xs',
                  isNormativo
                    ? 'bg-rose-500/90 text-white border-rose-400'
                    : 'bg-[#00A3C4]/90 text-white border-[#00A3C4]'
                )}
              >
                {tipoConflitoClean}
              </span>
            </div>

            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
              {totalImagens > 1 && (
                <div className="px-2 py-0.5 rounded-full bg-[#072B3B]/90 text-[#00C4EB] text-[10px] font-mono border border-[#00A3C4]/40 flex items-center gap-1 shadow-md">
                  <Images className="h-3 w-3 text-[#00A3C4]" />
                  <span>{totalImagens}</span>
                </div>
              )}
              {conflito.solucao && (
                <div title="Solução registrada" className="p-1 rounded-full bg-emerald-500 text-white shadow-md">
                  <Lightbulb className="h-3 w-3" />
                </div>
              )}
            </div>

            {/* Overlay de Zoom ao passar mouse */}
            <div className="absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-[#072B3B]/90 text-[#00C4EB] text-[10px] font-bold px-2 py-1 rounded-lg border border-[#00A3C4]/40 shadow-md">
              <ZoomIn className="h-3 w-3" />
              <span>Ver Ficha</span>
            </div>
          </div>
        ) : (
          /* Quadro Espaço / Placeholder quando não houver imagem anexada */
          <div
            onClick={() => onViewDetails(conflito)}
            className="relative h-32 w-full bg-gradient-to-br from-slate-100 to-slate-200/70 dark:from-[#041A24] dark:to-[#072B3B] cursor-pointer border-b border-slate-200/80 dark:border-[#0B384D] flex flex-col items-center justify-center p-3 text-center transition-colors group-hover:bg-[#00A3C4]/5"
          >
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
              <span className="px-2.5 py-1 rounded-lg bg-[#072B3B] dark:bg-white text-white dark:text-[#072B3B] font-black text-xs font-mono shadow-xs border border-[#00A3C4]/30">
                #{conflito.codigo_conflito}
              </span>
              <span
                className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider',
                  isNormativo
                    ? 'bg-rose-500/10 text-rose-700 border-rose-300 dark:text-rose-400 dark:border-rose-800'
                    : 'bg-cyan-500/10 text-[#008EA9] border-[#00A3C4]/30 dark:text-[#00C4EB]'
                )}
              >
                {tipoConflitoClean}
              </span>
            </div>

            <div className="p-2.5 rounded-2xl bg-white/80 dark:bg-[#0B384D]/70 text-slate-400 dark:text-slate-500 group-hover:text-[#00A3C4] group-hover:scale-110 transition-all shadow-xs border border-slate-200/60 dark:border-[#0B384D]">
              <ImageIcon className="h-5 w-5" />
            </div>
            <span className="text-[10.5px] font-semibold text-slate-400 dark:text-slate-400 mt-1.5">
              Foto técnica do relatório ARCIS
            </span>
          </div>
        )}

        {/* Topo do Card com Código, Disciplinas e Status */}
        <div className="p-4 sm:p-5 pb-3 border-b border-slate-100 dark:border-[#0B384D] space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            {/* Disciplinas: Principal -> Envolvidas */}
            <div className="flex items-center flex-wrap gap-1.5 text-xs">
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

            <ArcisStatusBadge status={conflito.status_arcis} size="sm" />
          </div>
        </div>

        {/* Conteúdo Central */}
        <CardContent className="p-4 sm:p-5 pt-3 space-y-3">
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
            {descricaoClean}
          </p>

          {/* Destaque de Solução Proposta se existir */}
          {conflito.solucao && (
            <div className="flex items-start gap-1.5 text-[11px] text-[#047857] dark:text-[#34D399] bg-emerald-50/80 dark:bg-emerald-950/40 p-2 rounded-md border border-emerald-200 dark:border-emerald-800/60 line-clamp-2">
              <Lightbulb className="h-3.5 w-3.5 text-[#10B981] shrink-0 mt-0.5" />
              <span className="font-medium">Solução: {conflito.solucao}</span>
            </div>
          )}

          {/* Data e Relatório de Origem */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {conflito.data_criacao_arcis ? formatDateBR(conflito.data_criacao_arcis) : new Date(conflito.created_at).toLocaleDateString('pt-BR')}
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
      </div>

      {/* Rodapé de Ações */}
      <div className="p-3 bg-slate-50/80 dark:bg-[#041A24]/60 border-t border-slate-100 dark:border-[#0B384D] flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewDetails(conflito)}
          className="text-xs font-bold text-[#00A3C4] dark:text-[#00C4EB] hover:bg-[#00A3C4]/10 h-8 gap-1.5 cursor-pointer"
        >
          <Eye className="h-3.5 w-3.5" /> Ver Ficha ARCIS
        </Button>

        <div className="flex items-center gap-1">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(conflito)}
              className="h-8 w-8 text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              title="Editar Conflito"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
          )}

          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (confirm(`Deseja excluir o conflito ARCIS #${conflito.codigo_conflito}?`)) {
                  onDelete(conflito.id);
                }
              }}
              className="h-8 w-8 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
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
