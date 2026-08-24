"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronDown, RotateCcw, Check } from 'lucide-react';
import { cn, formatDateShort } from '@/lib/utils';

interface DateRangeFilterProps {
  dataInicio: string; // YYYY-MM-DD
  dataFim: string;    // YYYY-MM-DD
  onChange: (inicio: string, fim: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  variant?: 'default' | 'wcc' | 'amber' | 'emerald';
}

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateNDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getFirstDayOfMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

function getFirstDayOfYear(): string {
  const now = new Date();
  return `${now.getFullYear()}-01-01`;
}

export function DateRangeFilter({
  dataInicio,
  dataFim,
  onChange,
  label = 'Data',
  placeholder = 'Todas',
  className,
  variant = 'default',
}: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Estados locais para edição antes de aplicar
  const [tempInicio, setTempInicio] = useState(dataInicio);
  const [tempFim, setTempFim] = useState(dataFim);

  // Sincronizar com props quando o modal abrir ou props mudarem
  useEffect(() => {
    setTempInicio(dataInicio);
    setTempFim(dataFim);
  }, [dataInicio, dataFim, isOpen]);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const hasActiveFilter = Boolean(dataInicio || dataFim);

  // Texto exibido no botão
  const buttonDisplayText = useMemo(() => {
    if (!dataInicio && !dataFim) {
      return `${label}: ${placeholder}`;
    }
    if (dataInicio && dataFim) {
      if (dataInicio === dataFim) {
        return `${label}: ${formatDateShort(dataInicio)}`;
      }
      return `${label}: ${formatDateShort(dataInicio)} a ${formatDateShort(dataFim)}`;
    }
    if (dataInicio) {
      return `${label}: a partir de ${formatDateShort(dataInicio)}`;
    }
    return `${label}: até ${formatDateShort(dataFim)}`;
  }, [label, placeholder, dataInicio, dataFim]);

  const handleApply = () => {
    onChange(tempInicio, tempFim);
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempInicio('');
    setTempFim('');
    onChange('', '');
    setIsOpen(false);
  };

  const applyPreset = (inicio: string, fim: string) => {
    setTempInicio(inicio);
    setTempFim(fim);
    onChange(inicio, fim);
    setIsOpen(false);
  };

  const today = getTodayString();

  return (
    <div className={cn("relative w-full", className)} ref={dropdownRef}>
      {/* Botão Gatilho */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-10 px-3.5 flex items-center justify-between rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer shadow-2xs border text-left",
          "bg-white dark:bg-[#072B3B]/80 text-[#072B3B] dark:text-slate-100",
          hasActiveFilter
            ? "border-[#00A3C4] ring-1 ring-[#00A3C4]/30 dark:border-[#00A3C4] bg-[#00A3C4]/5 text-[#008EA9] dark:text-[#00C4EB]"
            : "border-slate-200 dark:border-[#0B384D] hover:border-[#00A3C4] dark:hover:border-[#00A3C4]",
          variant === 'amber' && hasActiveFilter && "border-amber-400 bg-amber-50/40 text-amber-900 dark:text-amber-200 dark:bg-amber-950/30",
          variant === 'emerald' && hasActiveFilter && "border-emerald-400 bg-emerald-50/40 text-emerald-900 dark:text-emerald-200 dark:bg-emerald-950/30"
        )}
      >
        <div className="flex items-center gap-2 truncate pr-2">
          <CalendarIcon className={cn("h-3.5 w-3.5 shrink-0", hasActiveFilter ? "text-[#00A3C4] dark:text-[#00C4EB]" : "text-slate-400")} />
          <span className="truncate">{buttonDisplayText}</span>
          {hasActiveFilter && (
            <span className="w-2 h-2 rounded-full bg-[#00A3C4] shrink-0" />
          )}
        </div>
        <ChevronDown className={cn("h-4 w-4 text-slate-400 dark:text-slate-400 shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {/* Menu Suspenso (Dropdown) */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-80 max-w-[95vw] sm:max-w-sm bg-white dark:bg-[#072B3B] border border-slate-200 dark:border-[#0B384D] rounded-2xl shadow-xl p-3 space-y-3 animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#0B384D]">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#072B3B] dark:text-slate-200 uppercase tracking-wider">
              <CalendarIcon className="h-3.5 w-3.5 text-[#00A3C4]" />
              <span>Filtrar por Período</span>
            </div>
            {hasActiveFilter && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[10px] font-bold text-rose-500 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <RotateCcw className="h-2.5 w-2.5" /> Limpar
              </button>
            )}
          </div>

          {/* Atalhos Rápidos (Presets) */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
              Atalhos Rápidos:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset(today, today)}
                className="px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 hover:bg-[#00A3C4]/15 hover:text-[#008EA9] dark:bg-[#041A24] dark:hover:bg-[#0B384D] transition-colors text-left truncate cursor-pointer border border-slate-100 dark:border-slate-800"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => applyPreset(getDateNDaysAgo(6), today)}
                className="px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 hover:bg-[#00A3C4]/15 hover:text-[#008EA9] dark:bg-[#041A24] dark:hover:bg-[#0B384D] transition-colors text-left truncate cursor-pointer border border-slate-100 dark:border-slate-800"
              >
                Últimos 7 dias
              </button>
              <button
                type="button"
                onClick={() => applyPreset(getDateNDaysAgo(29), today)}
                className="px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 hover:bg-[#00A3C4]/15 hover:text-[#008EA9] dark:bg-[#041A24] dark:hover:bg-[#0B384D] transition-colors text-left truncate cursor-pointer border border-slate-100 dark:border-slate-800"
              >
                Últimos 30 dias
              </button>
              <button
                type="button"
                onClick={() => applyPreset(getFirstDayOfMonth(), today)}
                className="px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 hover:bg-[#00A3C4]/15 hover:text-[#008EA9] dark:bg-[#041A24] dark:hover:bg-[#0B384D] transition-colors text-left truncate cursor-pointer border border-slate-100 dark:border-slate-800"
              >
                Este Mês
              </button>
              <button
                type="button"
                onClick={() => applyPreset(getFirstDayOfYear(), today)}
                className="col-span-2 px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 hover:bg-[#00A3C4]/15 hover:text-[#008EA9] dark:bg-[#041A24] dark:hover:bg-[#0B384D] transition-colors text-left truncate cursor-pointer border border-slate-100 dark:border-slate-800"
              >
                Este Ano ({new Date().getFullYear()})
              </button>
            </div>
          </div>

          {/* Inputs Personalizados De / Até */}
          <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-[#0B384D]">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
              Intervalo Personalizado:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                  De (Início):
                </label>
                <input
                  type="date"
                  value={tempInicio}
                  onChange={(e) => setTempInicio(e.target.value)}
                  className="w-full h-8 px-2 text-xs rounded-lg bg-slate-50 dark:bg-[#041A24] border border-slate-200 dark:border-[#0B384D] text-[#072B3B] dark:text-slate-100 focus:outline-none focus:border-[#00A3C4]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                  Até (Fim):
                </label>
                <input
                  type="date"
                  value={tempFim}
                  onChange={(e) => setTempFim(e.target.value)}
                  className="w-full h-8 px-2 text-xs rounded-lg bg-slate-50 dark:bg-[#041A24] border border-slate-200 dark:border-[#0B384D] text-[#072B3B] dark:text-slate-100 focus:outline-none focus:border-[#00A3C4]"
                />
              </div>
            </div>
          </div>

          {/* Rodapé com Botões de Ação */}
          <div className="pt-2 border-t border-slate-100 dark:border-[#0B384D] flex items-center justify-between">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
            >
              Limpar
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#0B384D] rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="px-3.5 py-1 text-xs font-bold bg-[#00A3C4] text-white hover:bg-[#008EA9] rounded-lg shadow-sm cursor-pointer flex items-center gap-1"
              >
                <Check className="h-3.5 w-3.5" /> Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
