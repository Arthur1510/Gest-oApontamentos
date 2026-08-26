"use client";

import React from 'react';
import { StatusConflitoArcis, STATUS_ARCIS_COLORS } from '@/types/arcis';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, FileCheck, HelpCircle, ArrowRightCircle, Sparkles } from 'lucide-react';

interface ArcisStatusBadgeProps {
  status: StatusConflitoArcis;
  className?: string;
  size?: 'sm' | 'md';
}

export function ArcisStatusBadge({ status, className, size = 'md' }: ArcisStatusBadgeProps) {
  const config = STATUS_ARCIS_COLORS[status] || {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-700',
  };

  const getIcon = () => {
    switch (status) {
      case 'Aguardando Solução':
        return <Clock className="h-3 w-3 shrink-0" />;
      case 'Solução Proposta por Portobello':
      case 'Solução Proposta por Projetista':
      case 'Solução Proposta por Cliente':
        return <ArrowRightCircle className="h-3 w-3 shrink-0" />;
      case 'Solução Aguardando Aprovação':
        return <Sparkles className="h-3 w-3 shrink-0" />;
      case 'Solução Aprovada':
        return <FileCheck className="h-3 w-3 shrink-0" />;
      case 'Encerrado':
        return <CheckCircle2 className="h-3 w-3 shrink-0" />;
      default:
        return <HelpCircle className="h-3 w-3 shrink-0" />;
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full border transition-all',
        config.bg,
        config.text,
        config.border,
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]',
        className
      )}
    >
      {getIcon()}
      <span className="truncate">{status}</span>
    </span>
  );
}
