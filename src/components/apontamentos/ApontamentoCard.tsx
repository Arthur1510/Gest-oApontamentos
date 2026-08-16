"use client";

import React from 'react';
import { ArrowRight, Calendar, CheckCircle2, AlertCircle, Eye, Trash2, FolderKanban } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Apontamento } from '@/types/apontamento';
import { formatDate } from '@/lib/utils';

interface ApontamentoCardProps {
  apontamento: Apontamento;
  onView: (apontamento: Apontamento) => void;
  onToggleStatus: (apontamento: Apontamento) => void;
  onDelete: (id: string) => void;
}

export function ApontamentoCard({
  apontamento,
  onView,
  onToggleStatus,
  onDelete,
}: ApontamentoCardProps) {
  const nomeProjeto = apontamento.projetos?.nome;

  return (
    <Card className="group relative overflow-hidden flex flex-col justify-between hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
      <div>
        {/* Banner Superior da Thumbnail se houver Imagem */}
        {apontamento.url_imagem && (
          <div 
            onClick={() => onView(apontamento)}
            className="relative h-40 w-full overflow-hidden bg-slate-900 cursor-pointer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={apontamento.url_imagem}
              alt={apontamento.titulo}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
            <div className="absolute top-2 right-2 flex gap-1.5">
              <Badge variant={apontamento.status === 'Resolvido' ? 'resolvido' : 'aberto'} className="shadow-md">
                {apontamento.status}
              </Badge>
            </div>
            {nomeProjeto && (
              <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-slate-950/80 backdrop-blur-xs text-indigo-300 text-[11px] px-2 py-0.5 rounded font-medium border border-indigo-500/30">
                <FolderKanban className="h-3 w-3" />
                <span className="truncate max-w-[160px]">{nomeProjeto}</span>
              </div>
            )}
          </div>
        )}

        <CardHeader className={apontamento.url_imagem ? "pt-4 pb-2" : "pb-2"}>
          {!apontamento.url_imagem && (
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

          {!apontamento.url_imagem && nomeProjeto && (
            <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-1">
              <FolderKanban className="h-3.5 w-3.5" />
              <span className="truncate">{nomeProjeto}</span>
            </div>
          )}

          <div className="flex items-start justify-between gap-2">
            <CardTitle 
              onClick={() => onView(apontamento)}
              className="text-base font-semibold leading-snug line-clamp-2 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors"
            >
              {apontamento.titulo}
            </CardTitle>
            {apontamento.url_imagem && (
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
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1.5 rounded-md border border-slate-100 dark:border-slate-800">
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold truncate max-w-[120px]">
              {apontamento.disciplina_origem}
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="text-rose-600 dark:text-rose-400 font-semibold truncate max-w-[120px]">
              {apontamento.disciplina_destino}
            </span>
          </div>

          {/* Resumo da Descrição */}
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {apontamento.descricao}
          </p>
        </CardContent>
      </div>

      <CardFooter className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formatDate(apontamento.created_at)}</span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleStatus(apontamento)}
            title={apontamento.status === 'Aberto' ? 'Marcar como Resolvido' : 'Reabrir'}
            className="h-8 w-8 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 dark:text-slate-400 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/40"
          >
            {apontamento.status === 'Aberto' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onView(apontamento)}
            title="Ver Detalhes"
            className="h-8 w-8 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-indigo-950/40"
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
            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
