"use client";

import React, { useState, useMemo } from 'react';
import {
  Medicao,
  Contrato,
  Obra,
  Fornecedor,
  StatusMedicao,
  STATUS_MEDICAO_OPCOES,
  STATUS_MEDICAO_COLORS,
} from '@/types/orcamento';
import { formatCurrency, formatPercent, formatDateBR } from '@/lib/orcamento-utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search,
  Plus,
  CheckCircle,
  CreditCard,
  Edit2,
  Trash2,
  Calendar,
  Building,
  Check,
} from 'lucide-react';

interface MedicoesTableProps {
  medicoes: Medicao[];
  contratos: Contrato[];
  obras: Obra[];
  fornecedores: Fornecedor[];
  filtroObra: string;
  setFiltroObra: (obra: string) => void;
  onNovaMedicao: () => void;
  onEditarMedicao: (medicao: Medicao) => void;
  onExcluirMedicao: (id: string) => void;
  onMudarStatusMedicao: (id: string, novoStatus: StatusMedicao, nf?: string, dataPagamento?: string) => void;
}

export function MedicoesTable({
  medicoes,
  contratos,
  obras,
  fornecedores,
  filtroObra,
  setFiltroObra,
  onNovaMedicao,
  onEditarMedicao,
  onExcluirMedicao,
  onMudarStatusMedicao,
}: MedicoesTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [filtroMes, setFiltroMes] = useState<string>('');
  const [filtroContrato, setFiltroContrato] = useState<string>('');

  // Modais rápidos de pagamento inline
  const [pagamentoModalItem, setPagamentoModalItem] = useState<Medicao | null>(null);
  const [nfInput, setNfInput] = useState('');
  const [dataPagamentoInput, setDataPagamentoInput] = useState(new Date().toISOString().split('T')[0]);

  // Lista única de meses para o filtro
  const mesesUnicos = useMemo(() => {
    const set = new Set<string>();
    medicoes.forEach((m) => {
      if (m.mes_competencia) set.add(m.mes_competencia);
    });
    return Array.from(set).sort();
  }, [medicoes]);

  // Medições filtradas
  const medicoesFiltradas = useMemo(() => {
    return medicoes.filter((m) => {
      if (filtroObra && m.obra !== filtroObra) return false;
      if (filtroStatus && m.status !== filtroStatus) return false;
      if (filtroMes && m.mes_competencia !== filtroMes) return false;
      if (filtroContrato && m.contrato_id !== filtroContrato) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchEmpresa = m.empresa.toLowerCase().includes(q);
        const matchId = m.id.toLowerCase().includes(q);
        const matchContrato = m.contrato_id.toLowerCase().includes(q);
        const matchEtapa = m.etapa.toLowerCase().includes(q);
        const matchNf = (m.nf || '').toLowerCase().includes(q);
        if (!matchEmpresa && !matchId && !matchContrato && !matchEtapa && !matchNf) return false;
      }

      return true;
    });
  }, [medicoes, filtroObra, filtroStatus, filtroMes, filtroContrato, searchQuery]);

  // Totais
  const totais = useMemo(() => {
    let totalValor = 0;
    let pago = 0;
    let medido = 0;
    let aMedir = 0;

    for (const m of medicoesFiltradas) {
      totalValor += m.valor_medicao || 0;
      if (m.status === 'Pago') pago += m.valor_medicao || 0;
      else if (m.status === 'Medido') medido += m.valor_medicao || 0;
      else if (m.status === 'A Medir') aMedir += m.valor_medicao || 0;
    }

    return { totalValor, pago, medido, aMedir };
  }, [medicoesFiltradas]);

  const handleConfirmarPagamento = () => {
    if (pagamentoModalItem) {
      onMudarStatusMedicao(pagamentoModalItem.id, 'Pago', nfInput, dataPagamentoInput);
      setPagamentoModalItem(null);
      setNfInput('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#072B3B] border border-slate-200 dark:border-[#0B384D] shadow-sm">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* Busca por texto */}
          <div className="relative min-w-[200px] flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por ID, empresa, etapa, NF..."
              className="pl-9 text-xs h-9 rounded-xl bg-slate-50 dark:bg-[#0B384D] border-slate-200 dark:border-[#0B384D]"
            />
          </div>

          {/* Filtro Obra */}
          <select
            value={filtroObra}
            onChange={(e) => setFiltroObra(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B384D] border border-slate-200 dark:border-[#0B384D] text-slate-800 dark:text-slate-100 h-9 focus:outline-none focus:ring-2 focus:ring-[#00A3C4]"
          >
            <option value="">🏢 Todas as Obras</option>
            {obras.map((o) => (
              <option key={o.id} value={o.codigo}>
                {o.codigo} - {o.nome}
              </option>
            ))}
          </select>

          {/* Filtro Status */}
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B384D] border border-slate-200 dark:border-[#0B384D] text-slate-800 dark:text-slate-100 h-9 focus:outline-none focus:ring-2 focus:ring-[#00A3C4]"
          >
            <option value="">📋 Todos os Status</option>
            {STATUS_MEDICAO_OPCOES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Filtro Mês */}
          <select
            value={filtroMes}
            onChange={(e) => setFiltroMes(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B384D] border border-slate-200 dark:border-[#0B384D] text-slate-800 dark:text-slate-100 h-9 focus:outline-none focus:ring-2 focus:ring-[#00A3C4]"
          >
            <option value="">📅 Todos os Meses</option>
            {mesesUnicos.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {(searchQuery || filtroObra || filtroStatus || filtroMes || filtroContrato) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setFiltroObra('');
                setFiltroStatus('');
                setFiltroMes('');
                setFiltroContrato('');
              }}
              className="text-xs text-rose-600 hover:text-rose-700 h-9"
            >
              Limpar
            </Button>
          )}
        </div>

        {/* Botão Nova Medição */}
        <Button
          size="sm"
          onClick={onNovaMedicao}
          className="bg-[#00A3C4] hover:bg-[#008EA9] text-white text-xs font-bold gap-1.5 h-9 rounded-xl shadow-xs"
        >
          <Plus className="h-4 w-4" /> Nova Medição
        </Button>
      </div>

      {/* Tabela de Medições */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#0B384D] bg-white dark:bg-[#072B3B] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-[#0B384D] text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-[#0B384D]">
              <tr>
                <th className="py-3 px-3.5">ID</th>
                <th className="py-3 px-3.5">Contrato</th>
                <th className="py-3 px-3.5">Empresa</th>
                <th className="py-3 px-3.5">Obra</th>
                <th className="py-3 px-3.5">Etapa / Marco</th>
                <th className="py-3 px-3.5 text-center">% Etapa</th>
                <th className="py-3 px-3.5 text-right">Valor Medição</th>
                <th className="py-3 px-3.5">Data Prevista</th>
                <th className="py-3 px-3.5">Data Medição</th>
                <th className="py-3 px-3.5 text-center">Mês</th>
                <th className="py-3 px-3.5 text-center">Status</th>
                <th className="py-3 px-3.5">NF</th>
                <th className="py-3 px-3.5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#0B384D]/60 text-slate-700 dark:text-slate-200">
              {medicoesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-10 text-center text-slate-400">
                    Nenhuma medição encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                medicoesFiltradas.map((m) => {
                  const statusColor = STATUS_MEDICAO_COLORS[m.status] || {
                    bg: 'bg-slate-100',
                    text: 'text-slate-600',
                    border: 'border-slate-300',
                  };

                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-slate-50 dark:hover:bg-[#0B384D]/30 transition-colors"
                    >
                      <td className="py-2.5 px-3.5 font-bold">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#0B384D] text-[#072B3B] dark:text-white font-mono text-[10px] border border-slate-200 dark:border-[#00A3C4]/30">
                          {m.id}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-slate-600 dark:text-slate-300">
                        {m.contrato_id}
                      </td>
                      <td className="py-2.5 px-3.5 font-semibold text-slate-900 dark:text-white">
                        {m.empresa}
                      </td>
                      <td className="py-2.5 px-3.5 font-bold">
                        <span className="px-2 py-0.5 rounded-md bg-[#00A3C4]/15 text-[#008EA9] dark:text-[#00C4EB] text-[10px] font-extrabold">
                          {m.obra}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-700 dark:text-slate-200 max-w-[200px] truncate" title={m.etapa}>
                        {m.etapa}
                      </td>
                      <td className="py-2.5 px-3.5 text-center font-bold text-slate-700 dark:text-slate-300">
                        {formatPercent(m.percentual)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(m.valor_medicao)}
                      </td>
                      <td className="py-2.5 px-3.5 text-slate-500 dark:text-slate-400">
                        {formatDateBR(m.data_prevista)}
                      </td>
                      <td className="py-2.5 px-3.5 font-medium text-slate-800 dark:text-slate-200">
                        {formatDateBR(m.data_medicao)}
                      </td>
                      <td className="py-2.5 px-3.5 text-center font-semibold">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#0B384D] text-slate-600 dark:text-slate-300 text-[10px]">
                          {m.mes_competencia || '-'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-slate-600 dark:text-slate-300">
                        {m.nf || '-'}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {m.status === 'A Medir' && (
                            <button
                              onClick={() => onMudarStatusMedicao(m.id, 'Medido')}
                              title="Marcar como Medido"
                              className="p-1 rounded-md text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 transition-colors"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {(m.status === 'Medido' || m.status === 'A Medir') && (
                            <button
                              onClick={() => {
                                setPagamentoModalItem(m);
                                setNfInput(m.nf || '');
                              }}
                              title="Registrar Pagamento / Nota Fiscal"
                              className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                            >
                              <CreditCard className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onEditarMedicao(m)}
                            title="Editar Medição"
                            className="p-1 rounded-md text-slate-400 hover:text-[#00A3C4] hover:bg-slate-100 dark:hover:bg-[#0B384D] transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onExcluirMedicao(m.id)}
                            title="Excluir Medição"
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Linha de Totais */}
            <tfoot className="bg-slate-100/90 dark:bg-[#072432] text-slate-900 dark:text-white font-extrabold border-t-2 border-slate-300 dark:border-[#00A3C4]/40">
              <tr>
                <td colSpan={6} className="py-3 px-3.5 text-left uppercase tracking-wider text-xs">
                  Totais ({medicoesFiltradas.length} medições)
                </td>
                <td className="py-3 px-3.5 text-right text-xs">
                  {formatCurrency(totais.totalValor)}
                </td>
                <td colSpan={3} className="py-3 px-3.5 text-right text-xs text-slate-500 dark:text-slate-400">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    Pago: {formatCurrency(totais.pago)}
                  </span>
                  {' | '}
                  <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                    Medido: {formatCurrency(totais.medido)}
                  </span>
                  {' | '}
                  <span className="text-amber-600 dark:text-amber-400 font-bold">
                    A Medir: {formatCurrency(totais.aMedir)}
                  </span>
                </td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal Rápido de Confirmação de Pagamento */}
      {pagamentoModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-0">
          <div className="bg-white dark:bg-[#072B3B] rounded-2xl border border-slate-200 dark:border-[#0B384D] p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Registrar Pagamento
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Medição {pagamentoModalItem.id} - {pagamentoModalItem.empresa} ({formatCurrency(pagamentoModalItem.valor_medicao)})
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Número da Nota Fiscal (NF)
                </label>
                <Input
                  value={nfInput}
                  onChange={(e) => setNfInput(e.target.value)}
                  placeholder="Ex: 593"
                  className="text-xs h-9 rounded-xl bg-slate-50 dark:bg-[#0B384D]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Data de Pagamento
                </label>
                <Input
                  type="date"
                  value={dataPagamentoInput}
                  onChange={(e) => setDataPagamentoInput(e.target.value)}
                  className="text-xs h-9 rounded-xl bg-slate-50 dark:bg-[#0B384D]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#0B384D]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagamentoModalItem(null)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmarPagamento}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                Confirmar Pagamento
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
