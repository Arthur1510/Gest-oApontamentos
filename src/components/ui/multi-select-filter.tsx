"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, X, Search, CheckSquare, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MultiSelectOption {
  value: string;
  label: string;
  count?: number;
  color?: string;
}

interface MultiSelectFilterProps {
  label: string;
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  variant?: 'default' | 'wcc' | 'amber' | 'emerald';
  searchable?: boolean;
}

export function MultiSelectFilter({
  label,
  options,
  selectedValues,
  onChange,
  placeholder = 'Todos',
  className,
  variant = 'default',
  searchable = false,
}: MultiSelectFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha dropdown ao clicar fora
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

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(searchTerm.trim().toLowerCase())
    );
  }, [options, searchTerm]);

  const isAllSelected = selectedValues.length === 0 || selectedValues.length === options.length;

  const toggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      const next = selectedValues.filter((v) => v !== value);
      onChange(next);
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const handleSelectAll = () => {
    onChange([]);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  // Texto resumido exibido no botão
  const buttonDisplayText = useMemo(() => {
    if (selectedValues.length === 0) {
      return `${label}: ${placeholder}`;
    }
    if (selectedValues.length === 1) {
      const found = options.find((o) => o.value === selectedValues[0]);
      return `${label}: ${found?.label || selectedValues[0]}`;
    }
    if (selectedValues.length === 2) {
      const names = selectedValues
        .map((v) => options.find((o) => o.value === v)?.label || v)
        .join(', ');
      return `${label} (2): ${names}`;
    }
    return `${label} (${selectedValues.length} selecionados)`;
  }, [label, placeholder, selectedValues, options]);

  return (
    <div className={cn("relative w-full", className)} ref={dropdownRef}>
      {/* Botão Gatilho */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-10 px-3.5 flex items-center justify-between rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer shadow-2xs border text-left",
          "bg-white dark:bg-[#072B3B]/80 text-[#072B3B] dark:text-slate-100",
          selectedValues.length > 0
            ? "border-[#00A3C4] ring-1 ring-[#00A3C4]/30 dark:border-[#00A3C4]"
            : "border-slate-200 dark:border-[#0B384D] hover:border-[#00A3C4] dark:hover:border-[#00A3C4]",
          variant === 'wcc' && selectedValues.length > 0 && "bg-[#00A3C4]/5 text-[#008EA9] dark:text-[#00C4EB]",
          variant === 'amber' && selectedValues.length > 0 && "border-amber-400 bg-amber-50/40 text-amber-900 dark:text-amber-200 dark:bg-amber-950/30",
          variant === 'emerald' && selectedValues.length > 0 && "border-emerald-400 bg-emerald-50/40 text-emerald-900 dark:text-emerald-200 dark:bg-emerald-950/30"
        )}
      >
        <div className="flex items-center gap-2 truncate pr-2">
          <span className="truncate">{buttonDisplayText}</span>
          {selectedValues.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#00A3C4] text-white text-[10px] font-black shrink-0">
              {selectedValues.length}
            </span>
          )}
        </div>
        <ChevronDown className={cn("h-4 w-4 text-slate-400 dark:text-slate-400 shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {/* Menu Suspenso */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-72 max-w-[90vw] sm:max-w-xs bg-white dark:bg-[#072B3B] border border-slate-200 dark:border-[#0B384D] rounded-2xl shadow-xl p-2.5 space-y-2 animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Cabeçalho do Dropdown com Ações Rápidas */}
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-[#0B384D]">
            <span className="text-[11px] font-bold text-[#072B3B] dark:text-slate-200 uppercase tracking-wider">
              {label}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[10px] font-bold text-[#00A3C4] hover:underline"
              >
                Todos
              </button>
              {selectedValues.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[10px] font-bold text-rose-500 hover:underline"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Campo de Busca Interno se habilitado */}
          {searchable && options.length > 6 && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder={`Pesquisar ${label.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-8 pl-8 pr-2.5 text-xs rounded-lg bg-slate-50 dark:bg-[#041A24] border border-slate-200 dark:border-[#0B384D] text-[#072B3B] dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#00A3C4]"
              />
            </div>
          )}

          {/* Lista de Opções com Checkbox */}
          <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {/* Opção "Todos" */}
            <div
              onClick={() => onChange([])}
              className={cn(
                "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors",
                isAllSelected
                  ? "bg-[#00A3C4]/15 text-[#008EA9] dark:text-[#00C4EB] font-bold"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#0B384D]"
              )}
            >
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-4 h-4 rounded flex items-center justify-center border transition-colors",
                  isAllSelected
                    ? "bg-[#00A3C4] border-[#00A3C4] text-white"
                    : "border-slate-300 dark:border-slate-600 bg-transparent"
                )}>
                  {isAllSelected && <Check className="h-3 w-3" />}
                </div>
                <span>Todos (Sem filtro)</span>
              </div>
            </div>

            {/* Itens Individuais */}
            {filteredOptions.map((opt) => {
              const isChecked = selectedValues.includes(opt.value);

              return (
                <div
                  key={`multi-${label}-${opt.value}`}
                  onClick={() => toggleOption(opt.value)}
                  className={cn(
                    "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors",
                    isChecked
                      ? "bg-[#00A3C4]/15 text-[#008EA9] dark:text-[#00C4EB] font-bold"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#0B384D]"
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    <div className={cn(
                      "w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0",
                      isChecked
                        ? "bg-[#00A3C4] border-[#00A3C4] text-white"
                        : "border-slate-300 dark:border-slate-600 bg-transparent"
                    )}>
                      {isChecked && <Check className="h-3 w-3" />}
                    </div>
                    <span className="truncate">{opt.label}</span>
                  </div>

                  {opt.count !== undefined && (
                    <span className="text-[10px] text-slate-400 font-mono ml-1 shrink-0">
                      ({opt.count})
                    </span>
                  )}
                </div>
              );
            })}

            {filteredOptions.length === 0 && (
              <p className="text-[11px] text-slate-400 text-center py-2">
                Nenhum item encontrado.
              </p>
            )}
          </div>

          {/* Rodapé com Botão de Concluir */}
          <div className="pt-1.5 border-t border-slate-100 dark:border-[#0B384D] flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-medium">
              {selectedValues.length === 0
                ? 'Todos incluídos'
                : `${selectedValues.length} selecionado(s)`}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 rounded-lg bg-[#00A3C4] text-white font-bold text-[11px] hover:bg-[#008EA9] transition-colors"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
