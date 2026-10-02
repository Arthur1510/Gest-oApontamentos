"use client";

import React, { useState, useMemo } from 'react';
import {
  Contrato,
  Medicao,
  Obra,
  Fornecedor,
  STATUS_CONTRATO_COLORS,
} from '@/types/orcamento';
import { formatCurrency, formatPercent } from '@/lib/orcamento-utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search,
  Plus,
  Briefcase,
  Eye,
  Edit2,
  Trash2,
  PlusCircle,
  Building,
  FilePlus2,
  FileX2,
  LayoutGrid,
  List,
  AlertTriangle,
} from 'lucide-react';

interface ContratosTableProps {
  contratos: Contrato[];
  medicoes: Medicao[];
  obras: Obra[];
  fornecedores: Fornecedor[];
  filtroObra: string;
  setFiltroObra: (obra: string) => void;
  onNovoContrato: () => void;
  onEditarContrato: (contrato: Contrato) => void;
  onExcluirContrato: (id: string) => void;
  onVerMedicoesContrato: (contrato: Contrato) => void;
  onNovaMedicaoParaContrato: (contrato: Contrato) => void;
  onAbrirAditivo?: (contrato: Contrato) => void;
  onAbrirDistrato?: (contrato: Contrato) => void;
}

export function ContratosTable({
  contratos,
  medicoes,
  obras,
  fornecedores,
  filtroObra,
  setFiltroObra,
  onNovoContrato,
  onEditarContrato,
  onExcluirContrato,
  onVerMedicoesContrato,
  onNovaMedicaoParaContrato,
  onAbrirAditivo,
  onAbrirDistrato,
}: ContratosTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroFornecedor, setFiltroFornecedor] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<'Todos' | 'Projeto' | 'Legalização'>('Todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Contagem de medições por contrato
  const medicoesCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of medicoes) {
      map[m.contrato_id] = (map[m.contrato_id] || 0) + 1;
    }
    return map;
  }, [medicoes]);

  const countProjetos = useMemo(() => contratos.filter((c) => c.categoria === 'Projeto').length, [contratos]);
  const countLegalizacao = useMemo(() => contratos.filter((c) => c.categoria === 'Legalização').length, [contratos]);
  const countDistratados = useMemo(() => contratos.filter((c) => c.status === 'Distratado').length, [contratos]);

  // Contratos filtrados
  const contratosFiltrados = useMemo(() => {
    return contratos.filter((c) => {
      if (filtroObra && c.obra !== filtroObra) return false;
      if (filtroFornecedor && c.empresa !== filtroFornecedor) return false;
      if (filtroCategoria !== 'Todos' && c.categoria !== filtroCategoria) return false;
      if (filtroStatus && (c.status || 'Ativo') !== filtroStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchEmpresa = c.empresa.toLowerCase().includes(q);
        const matchId = c.id.toLowerCase().includes(q);
        const matchSienge = (c.num_sienge || '').toLowerCase().includes(q);
        const matchSub = (c.subdisciplina || '').toLowerCase().includes(q);
        const matchObra = (c.obra || '').toLowerCase().includes(q);
        if (!matchEmpresa && !matchId && !matchSienge && !matchSub && !matchObra) return false;
      }

      return true;
    });
  }, [contratos, filtroObra, filtroFornecedor, filtroCategoria, filtroStatus, searchQuery]);

  // Totais
  const totais = useMemo(() => {
    let valorContrato = 0;
    let valorMedido = 0;
    let saldoAMedir = 0;

    for (const c of contratosFiltrados) {
      valorContrato += c.valor_contrato || 0;
      valorMedido += c.valor_medido || 0;
      saldoAMedir += c.saldo_a_medir || 0;
    }

    const pctGlobal = valorContrato > 0 ? valorMedido / valorContrato : 0;

    return {
      valorContrato,
      valorMedido,
      saldoAMedir,
      pctGlobal,
    };
  }, [contratosFiltrados]);

  return (
    <div className="space-y-4">
      {/* Barra de Filtros e Ação */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#072B3B] border border-slate-200 dark:border-[#0B384D] shadow-sm">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Busca por texto */}
          <div className="relative w-full sm:w-64 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar ID, empresa, Sienge..."
              className="pl-9 text-xs h-9 rounded-xl bg-slate-50 dark:bg-[#0B384D] border-slate-200 dark:border-[#0B384D]"
            />
          </div>

          {/* Filtro Obra */}
          <select
            value={filtroObra}
            onChange={(e) => setFiltroObra(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B384D] border border-slate-200 dark:border-[#0B384D] text-slate-800 dark:text-slate-100 h-9 min-w-[140px] max-w-[200px] focus:outline-none focus:ring-2 focus:ring-[#00A3C4] truncate"
          >
            <option value="">🏢 Todas as Obras</option>
            {obras.map((o) => (
              <option key={o.id} value={o.codigo}>
                {o.codigo} - {o.nome}
              </option>
            ))}
          </select>

          {/* Filtro Fornecedor */}
          <select
            value={filtroFornecedor}
            onChange={(e) => setFiltroFornecedor(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B384D] border border-slate-200 dark:border-[#0B384D] text-slate-800 dark:text-slate-100 h-9 min-w-[140px] max-w-[200px] focus:outline-none focus:ring-2 focus:ring-[#00A3C4] truncate"
          >
            <option value="">🤝 Fornecedores</option>
            {fornecedores.map((f) => (
              <option key={f.id} value={f.fornecedor}>
                {f.fornecedor}
              </option>
            ))}
          </select>

          {/* Filtro Status (Ativo vs Distratado) */}
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B384D] border border-slate-200 dark:border-[#0B384D] text-slate-800 dark:text-slate-100 h-9 min-w-[120px] max-w-[160px] focus:outline-none focus:ring-2 focus:ring-[#00A3C4]"
          >
              <option value="">📋 Status</option>
              <option value="Ativo">Ativos</option>
              <option value="Distratado">Distratados ({countDistratados})</option>
              <option value="Concluído">Concluídos</option>
            </select>

            {/* Filtro Categoria: Projetos vs Legalização */}
            <div className="flex items-center rounded-xl bg-slate-100 dark:bg-[#0B384D] p-0.5 border border-slate-200 dark:border-[#0B384D] h-9">
              <button
                type="button"
                onClick={() => setFiltroCategoria('Todos')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filtroCategoria === 'Todos'
                    ? 'bg-white dark:bg-[#072B3B] text-[#072B3B] dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Todos ({contratos.length})
              </button>
              <button
                type="button"
                onClick={() => setFiltroCategoria('Projeto')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filtroCategoria === 'Projeto'
                    ? 'bg-[#00A3C4] text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Projetos ({countProjetos})
              </button>
              <button
                type="button"
                onClick={() => setFiltroCategoria('Legalização')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filtroCategoria === 'Legalização'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Legalização ({countLegalizacao})
              </button>
            </div>

            {(searchQuery || filtroObra || filtroFornecedor || filtroStatus || filtroCategoria !== 'Todos') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setFiltroObra('');
                  setFiltroFornecedor('');
                  setFiltroStatus('');
                  setFiltroCategoria('Todos');
                }}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 h-9 px-2.5"
              >
                Limpar
              </Button>
            )}
          </div>

          {/* Toggle de Visualização & Botão Novo Contrato */}
          <div className="flex items-center gap-2 self-end xl:self-center shrink-0">
            <div className="flex items-center rounded-xl bg-slate-100 dark:bg-[#0B384D] p-0.5 border border-slate-200 dark:border-[#0B384D] h-9">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Visualização em Tabela"
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-[#072B3B] text-[#00A3C4] shadow-2xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                title="Visualização em Cards"
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-[#072B3B] text-[#00A3C4] shadow-2xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>

            <Button
              size="sm"
              onClick={onNovoContrato}
              className="bg-[#00A3C4] hover:bg-[#008EA9] text-white text-xs font-bold gap-1.5 h-9 rounded-xl shadow-xs"
            >
              <Plus className="h-4 w-4" /> Novo Contrato
            </Button>
          </div>
        </div>

      {/* CASO LISTA VAZIA */}
      {contratosFiltrados.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-[#0B384D] bg-white dark:bg-[#072B3B] space-y-3">
          <div className="p-3 rounded-2xl bg-[#00A3C4]/15 text-[#00A3C4] dark:text-[#00C4EB] w-fit mx-auto">
            <Briefcase className="h-6 w-6" />
          </div>
          <h4 className="font-extrabold text-slate-800 dark:text-white text-base">
            Nenhum contrato encontrado
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {contratos.length === 0
              ? 'A base de contratos está limpa para que você possa cadastrar diretamente seus contratos reais na plataforma.'
              : 'Nenhum contrato coincide com os filtros selecionados.'}
          </p>
          <Button
            size="sm"
            onClick={onNovoContrato}
            className="bg-[#00A3C4] hover:bg-[#008EA9] text-white text-xs font-bold gap-1.5 h-9 rounded-xl"
          >
            <Plus className="h-4 w-4" /> Cadastrar Primeiro Contrato
          </Button>
        </div>
      ) : viewMode === 'cards' ? (
        /* VISUALIZAÇÃO EM CARDS RESPONSIVOS */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {contratosFiltrados.map((c) => {
            const pct = c.percentual_medido || 0;
            const countMed = medicoesCountMap[c.id] || 0;
            const isDistratado = c.status === 'Distratado';
            const statusConfig = STATUS_CONTRATO_COLORS[c.status || 'Ativo'] || STATUS_CONTRATO_COLORS['Ativo'];
            const aditivos = c.aditivos || [];

            return (
              <div
                key={c.id}
                className={`p-4 rounded-2xl border bg-white dark:bg-[#072B3B] shadow-sm flex flex-col justify-between transition-all hover:border-[#00A3C4]/40 ${
                  isDistratado
                    ? 'border-rose-400/40 bg-rose-50/20 dark:bg-rose-950/10'
                    : 'border-slate-200 dark:border-[#0B384D]'
                }`}
              >
                <div className="space-y-3">
                  {/* Top badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#0B384D] text-[#072B3B] dark:text-white font-mono text-[11px] font-bold">
                        {c.id}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${statusConfig.bg} ${statusConfig.text}`}>
                        {c.status || 'Ativo'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-[#00A3C4]/15 text-[#008EA9] dark:text-[#00C4EB] text-[10px] font-black">
                        {c.obra}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-[#0B384D] text-slate-500 font-bold">
                        {c.categoria || 'Projeto'}
                      </span>
                    </div>
                  </div>

                  {/* Nome da Empresa e Disciplina */}
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base leading-snug break-words">
                      {c.empresa}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words">
                      {c.disciplina} • <span className="font-medium text-slate-700 dark:text-slate-300">{c.subdisciplina}</span>
                    </p>
                    {c.num_sienge && (
                      <p className="text-[11px] font-mono text-[#00A3C4] mt-0.5">
                        Sienge: {c.num_sienge}
                      </p>
                    )}
                  </div>

                  {/* Valores Financeiros */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-[#0B384D]/50 text-center">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Vigente</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white font-mono block mt-0.5">
                        {formatCurrency(c.valor_contrato)}
                      </span>
                      {isDistratado && c.valor_original && c.valor_original !== c.valor_contrato && (
                        <span className="block text-[9px] text-rose-500 font-bold mt-0.5 line-through">
                          Orig: {formatCurrency(c.valor_original)}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Medido</span>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono block mt-0.5">
                        {formatCurrency(c.valor_medido)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Saldo</span>
                      <span className="text-xs font-bold text-purple-600 dark:text-purple-400 font-mono block mt-0.5">
                        {formatCurrency(c.saldo_a_medir)}
                      </span>
                    </div>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className={pct >= 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}>
                        {formatPercent(pct)} medido
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        {countMed} mediç{countMed === 1 ? 'ão' : 'ões'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-[#0B384D] h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          pct >= 1
                            ? 'bg-emerald-500'
                            : pct > 0.5
                            ? 'bg-[#00A3C4]'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.round(pct * 100))}%` }}
                      />
                    </div>
                  </div>

                  {/* Tags extras: Aditivos */}
                  {aditivos.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      <FilePlus2 className="h-3 w-3" />
                      <span>{aditivos.length} Aditivo(s) ({formatCurrency(c.valor_aditivos)})</span>
                    </div>
                  )}
                </div>

                {/* Ações do Card */}
                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-[#0B384D] flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onVerMedicoesContrato(c)}
                      className="h-7 text-xs font-bold text-[#00A3C4] px-2 rounded-lg gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" /> Detalhes
                    </Button>
                    {!isDistratado && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onNovaMedicaoParaContrato(c)}
                        className="h-7 text-xs font-bold text-emerald-600 px-2 rounded-lg gap-1"
                      >
                        <PlusCircle className="h-3.5 w-3.5" /> Medir
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center gap-0.5">
                    {onAbrirAditivo && !isDistratado && (
                      <button
                        onClick={() => onAbrirAditivo(c)}
                        title="Adicionar Termo Aditivo"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#00A3C4] hover:bg-slate-100 dark:hover:bg-[#0B384D] transition-colors"
                      >
                        <FilePlus2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {onAbrirDistrato && (
                      <button
                        onClick={() => onAbrirDistrato(c)}
                        title={isDistratado ? 'Ver Distrato' : 'Registrar Distrato'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isDistratado
                            ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                        }`}
                      >
                        <FileX2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onEditarContrato(c)}
                      title="Editar Contrato"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#00A3C4] hover:bg-slate-100 dark:hover:bg-[#0B384D] transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onExcluirContrato(c.id)}
                      title="Excluir Contrato"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VISUALIZAÇÃO EM TABELA RESPONSIVA */
        <div className="rounded-2xl border border-slate-200 dark:border-[#0B384D] bg-white dark:bg-[#072B3B] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-[#0B384D] text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-[#0B384D]">
                <tr>
                  <th className="py-3 px-3">Contrato</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3">Tipo</th>
                  <th className="py-3 px-3">Nº Sienge</th>
                  <th className="py-3 px-3">Empresa / Fornecedor</th>
                  <th className="py-3 px-3">Obra</th>
                  <th className="py-3 px-3">Disciplina / Subdisciplina</th>
                  <th className="py-3 px-3 text-right">Valor Vigente</th>
                  <th className="py-3 px-3 text-right">Valor Medido</th>
                  <th className="py-3 px-3 text-right">Saldo a Medir</th>
                  <th className="py-3 px-3 text-center min-w-[120px]">% Medido</th>
                  <th className="py-3 px-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#0B384D]/60 text-slate-700 dark:text-slate-200">
                {contratosFiltrados.map((c) => {
                  const pct = c.percentual_medido || 0;
                  const countMed = medicoesCountMap[c.id] || 0;
                  const isDistratado = c.status === 'Distratado';
                  const statusConfig = STATUS_CONTRATO_COLORS[c.status || 'Ativo'] || STATUS_CONTRATO_COLORS['Ativo'];
                  const aditivos = c.aditivos || [];

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-50 dark:hover:bg-[#0B384D]/30 transition-colors ${
                        isDistratado ? 'bg-rose-500/5' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#0B384D] text-[#072B3B] dark:text-white font-mono text-[11px] border border-slate-200 dark:border-[#00A3C4]/30">
                          {c.id}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${statusConfig.bg} ${statusConfig.text}`}>
                          {c.status || 'Ativo'}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            c.categoria === 'Legalização'
                              ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                              : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {c.categoria || 'Projeto'}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {c.num_sienge || '-'}
                      </td>

                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white max-w-[200px] break-words">
                        <div>
                          <span>{c.empresa}</span>
                          {aditivos.length > 0 && (
                            <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              +{aditivos.length} aditivo(s) ({formatCurrency(c.valor_aditivos)})
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-bold whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-[#00A3C4]/15 text-[#008EA9] dark:text-[#00C4EB] text-[10px] font-extrabold">
                          {c.obra}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 max-w-[180px] break-words">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{c.disciplina}</span>
                        <span className="block text-[11px] text-slate-500">{c.subdisciplina}</span>
                      </td>

                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white font-mono whitespace-nowrap">
                        {formatCurrency(c.valor_contrato)}
                        {isDistratado && c.valor_original && c.valor_original !== c.valor_contrato && (
                          <span className="block text-[10px] text-slate-400 font-normal line-through">
                            Orig: {formatCurrency(c.valor_original)}
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400 font-mono whitespace-nowrap">
                        {formatCurrency(c.valor_medido)}
                      </td>

                      <td className="py-2.5 px-3 text-right font-semibold text-purple-600 dark:text-purple-400 font-mono whitespace-nowrap">
                        {isDistratado ? (
                          <span className="text-rose-500 line-through">{formatCurrency(c.saldo_a_medir)}</span>
                        ) : (
                          formatCurrency(c.saldo_a_medir)
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <div className="flex flex-col items-center gap-1 min-w-[100px]">
                          <div className="flex items-center justify-between w-full text-[10px] font-bold">
                            <span className={pct >= 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}>
                              {formatPercent(pct)}
                            </span>
                            <span className="text-[9px] text-slate-400">
                              {countMed} m.
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-[#0B384D] h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                pct >= 1
                                  ? 'bg-emerald-500'
                                  : pct > 0.5
                                  ? 'bg-[#00A3C4]'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.round(pct * 100))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            onClick={() => onVerMedicoesContrato(c)}
                            title="Ver Medições do Contrato"
                            className="p-1 rounded-md text-slate-400 hover:text-[#00A3C4] hover:bg-slate-100 dark:hover:bg-[#0B384D] transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          {!isDistratado && (
                            <button
                              onClick={() => onNovaMedicaoParaContrato(c)}
                              title="Lançar Nova Medição"
                              className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                            >
                              <PlusCircle className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {onAbrirAditivo && !isDistratado && (
                            <button
                              onClick={() => onAbrirAditivo(c)}
                              title="Termo Aditivo (+/- Valor, Prazo)"
                              className="p-1 rounded-md text-slate-400 hover:text-[#00A3C4] hover:bg-slate-100 dark:hover:bg-[#0B384D] transition-colors"
                            >
                              <FilePlus2 className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {onAbrirDistrato && (
                            <button
                              onClick={() => onAbrirDistrato(c)}
                              title={isDistratado ? 'Ver Distrato' : 'Registrar Distrato'}
                              className={`p-1 rounded-md transition-colors ${
                                isDistratado
                                  ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40'
                                  : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                              }`}
                            >
                              <FileX2 className="h-3.5 w-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => onEditarContrato(c)}
                            title="Editar Contrato"
                            className="p-1 rounded-md text-slate-400 hover:text-[#00A3C4] hover:bg-slate-100 dark:hover:bg-[#0B384D] transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            onClick={() => onExcluirContrato(c.id)}
                            title="Excluir Contrato"
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Linha de Totais */}
              <tfoot className="bg-slate-100/90 dark:bg-[#072432] text-slate-900 dark:text-white font-extrabold border-t-2 border-slate-300 dark:border-[#00A3C4]/40">
                <tr>
                  <td colSpan={7} className="py-3 px-3 text-left uppercase tracking-wider text-xs">
                    Totais ({contratosFiltrados.length} contratos)
                  </td>
                  <td className="py-3 px-3 text-right text-xs font-mono whitespace-nowrap">
                    {formatCurrency(totais.valorContrato)}
                  </td>
                  <td className="py-3 px-3 text-right text-xs text-emerald-600 dark:text-emerald-400 font-mono whitespace-nowrap">
                    {formatCurrency(totais.valorMedido)}
                  </td>
                  <td className="py-3 px-3 text-right text-xs text-purple-600 dark:text-purple-400 font-mono whitespace-nowrap">
                    {formatCurrency(totais.saldoAMedir)}
                  </td>
                  <td className="py-3 px-3 text-center text-xs font-bold text-[#00A3C4]">
                    {formatPercent(totais.pctGlobal)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
