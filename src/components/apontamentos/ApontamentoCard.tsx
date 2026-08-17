"use client";

import React from 'react';
import { ArrowRight, Calendar, CheckCircle2, AlertCircle, Eye, Trash2, FolderKanban, ShieldAlert, Lightbulb, Images, Pencil, Layers } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Apontamento } from '@/types/apontamento';
import { formatDate } from '@/lib/utils';

interface ApontamentoCardProps {
  apontamento: Apontamento;
  onView: (apontamento: Apontamento) => void;
  onEdit?: (apontamento: Apontamento) => void;
  onToggleStatus: (apontamento: Apontamento) => void;
  onDelete: (id: string) => void;
}

export function ApontamentoCard({
  apontamento,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
}: ApontamentoCardProps) {
  const nomeProjeto = apontamento.projetos?.nome;

  const totalImagensApt = apontamento.imagens_apontamento && apontamento.imagens_apontamento.length > 0
    ? apontamento.imagens_apontamento.length
    : apontamento.url_imagem
    ? 1
    : 0;

  const mainImageUrl = apontamento.imagens_apontamento && apontamento.imagens_apontamento.length > 0
    ? apontamento.imagens_apontamento[0]
    : apontamento.url_imagem;

  return (
    <Card className="group relative overflow-hidden flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 hover:border-[#00A3C4] dark:hover:border-[#00A3C4] transition-all duration-300 bg-white/95 dark:bg-[#072B3B]/90 dark:border-[#0B384D] backdrop-blur-xs">
      <div>
        {/* Banner Superior da Thumbnail se houver Imagem */}
        {mainImageUrl && (
          <div 
            onClick={() => onView(apontamento)}
            className="relative h-44 w-full overflow-hidden bg-[#041A24] cursor-pointer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mainImageUrl}
              alt={apontamento.titulo}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#072B3B] via-[#072B3B]/40 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
            
            {/* Badges Flutuantes no Banner */}
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
              {totalImagensApt > 1 && (
                <div title={`${totalImagensApt} fotos anexadas`} className="px-2 py-0.5 rounded-full bg-[#072B3B]/90 text-white text-[10px] font-mono border border-[#0B384D] flex items-center gap-1 shadow-md">
                  <Images className="h-3 w-3 text-[#00A3C4]" />
                  <span>{totalImagensApt}</span>
                </div>
              )}
              {apontamento.solucao && (
                <div title="Solução Proposta cadastrada" className="p-1 rounded-full bg-[#10B981] text-[#072B3B] shadow-md">
                  <Lightbulb className="h-3.5 w-3.5" />
                </div>
              )}
              <Badge variant={apontamento.status === 'Resolvido' ? 'resolvido' : 'aberto'} className="shadow-md backdrop-blur-md">
                {apontamento.status}
              </Badge>
            </div>

            {nomeProjeto && (
              <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 bg-[#072B3B]/90 backdrop-blur-md text-[#00C4EB] text-[11px] px-2.5 py-1 rounded-lg font-bold border border-[#00A3C4]/30 shadow-md">
                <FolderKanban className="h-3.5 w-3.5" />
                <span className="truncate max-w-[160px]">{nomeProjeto}</span>
              </div>
            )}
          </div>
        )}

        <CardHeader className={mainImageUrl ? "pt-4 pb-2" : "pb-2"}>
          {!mainImageUrl && (
            <div className="flex items-center justify-between gap-2 mb-2">
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
                {apontamento.prioridade} Prioridade
              </Badge>
            </div>
          )}

          {!mainImageUrl && nomeProjeto && (
            <div className="flex items-center gap-1.5 text-[#008EA9] dark:text-[#00C4EB] text-xs font-bold mb-1">
              <FolderKanban className="h-3.5 w-3.5" />
              <span className="truncate">{nomeProjeto}</span>
            </div>
          )}

          {/* Tipo do Conflito / Apontamento Tag */}
          <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 mb-1">
            <ShieldAlert className="h-3 w-3" />
            <span>{apontamento.tipo_conflito || 'Conflito Físico'}</span>
          </div>

          <div className="flex items-start justify-between gap-2">
            <CardTitle 
              onClick={() => onView(apontamento)}
              className="text-base font-bold leading-snug line-clamp-2 hover:text-[#00A3C4] dark:hover:text-[#00C4EB] cursor-pointer transition-colors text-[#072B3B] dark:text-white"
            >
              {apontamento.titulo}
            </CardTitle>
            {mainImageUrl && (
              <Badge
                variant={
                  apontamento.prioridade === 'Alta'
                    ? 'alta'
                    : apontamento.prioridade === 'Média'
                    ? 'media'
                    : 'baixa'
                }
                className="shrink-0"
              >
                {apontamento.prioridade}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pb-3">
          {/* Rota Disciplina Origem -> Destino */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100/80 dark:bg-[#0B384D]/70 px-3 py-1.5 rounded-lg border border-slate-200/60 dark:border-[#0B384D]">
            <span className="text-[#008EA9] dark:text-[#00C4EB] font-bold truncate max-w-[120px]">
              {apontamento.disciplina_origem}
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="text-rose-600 dark:text-rose-400 font-bold truncate max-w-[120px]">
              {apontamento.disciplina_destino}
            </span>
          </div>

          {/* Pavimento e Localização */}
          {(apontamento.pavimento || apontamento.localizacao) && (
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate">
              <Layers className="h-3 w-3 text-[#00A3C4] shrink-0" />
              <span className="truncate">
                {[apontamento.pavimento, apontamento.localizacao].filter(Boolean).join(' • ')}
              </span>
            </div>
          )}

          {/* Resumo da Descrição */}
          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
            {apontamento.descricao}
          </p>

          {/* Destaque de Solução Proposta se existir */}
          {apontamento.solucao && (
            <div className="flex items-start gap-1.5 text-[11px] text-[#047857] dark:text-[#34D399] bg-emerald-50/80 dark:bg-emerald-950/40 p-2 rounded-md border border-emerald-200 dark:border-emerald-800/60 line-clamp-1">
              <Lightbulb className="h-3.5 w-3.5 text-[#10B981] shrink-0 mt-0.5" />
              <span className="truncate font-medium">Solução: {apontamento.solucao}</span>
            </div>
          )}
        </CardContent>
      </div>

      <CardFooter className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-[#0B384D] text-xs text-slate-500">
        <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-400">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formatDate(apontamento.created_at)}</span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleStatus(apontamento)}
            title={apontamento.status === 'Aberto' ? 'Marcar como Resolvido' : 'Reabrir'}
            className="h-8 w-8 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 dark:text-slate-300 dark:hover:text-[#34D399] dark:hover:bg-emerald-950/40"
          >
            {apontamento.status === 'Aberto' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )}
          </Button>

          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(apontamento)}
              title="Editar Apontamento"
              className="h-8 w-8 text-slate-600 hover:text-amber-600 hover:bg-amber-50 dark:text-slate-300 dark:hover:text-amber-400 dark:hover:bg-amber-950/40"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onView(apontamento)}
            title="Ver Detalhes"
            className="h-8 w-8 text-slate-600 hover:text-[#00A3C4] hover:bg-cyan-50 dark:text-slate-300 dark:hover:text-[#00C4EB] dark:hover:bg-[#0B384D]/60"
          >
            <Eye className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (confirm('Deseja excluir este apontamento?')) {
                onDelete(apontamento.id);
              }
            }}
            title="Excluir"
            className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
