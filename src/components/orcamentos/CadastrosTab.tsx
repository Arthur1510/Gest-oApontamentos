"use client";

import React, { useState } from 'react';
import {
  Obra,
  Fornecedor,
  Disciplina,
  Subdisciplina,
  ItemOrcamento,
  Contrato,
  Medicao,
  StatusObra,
  STATUS_OBRA_OPCOES,
  STATUS_OBRA_COLORS,
} from '@/types/orcamento';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Building,
  Users,
  Layers,
  Plus,
  Search,
  Check,
  Edit2,
  Trash2,
  X,
  FileCheck,
} from 'lucide-react';

interface CadastrosTabProps {
  obras: Obra[];
  fornecedores: Fornecedor[];
  disciplinas: Disciplina[];
  subdisciplinas: Subdisciplina[];
  orcamentos?: ItemOrcamento[];
  contratos?: Contrato[];
  medicoes?: Medicao[];
  onAdicionarObra: (obra: Obra) => void;
  onEditarObra: (obra: Obra, opcoes?: { distratarContratos?: boolean; reativarContratos?: boolean }) => void;
  onExcluirObra: (id: string) => void;
  onAdicionarFornecedor: (fornecedor: Fornecedor) => void;
  onEditarFornecedor: (fornecedor: Fornecedor) => void;
  onExcluirFornecedor: (id: string) => void;
  onAdicionarDisciplina: (disciplina: Disciplina) => void;
  onEditarDisciplina: (disciplina: Disciplina) => void;
  onExcluirDisciplina: (id: string) => void;
  onAdicionarSubdisciplina: (sub: Subdisciplina) => void;
  onEditarSubdisciplina: (sub: Subdisciplina) => void;
  onExcluirSubdisciplina: (id: string) => void;
}

export function CadastrosTab({
  obras,
  fornecedores,
  disciplinas,
  subdisciplinas,
  orcamentos = [],
  contratos = [],
  medicoes = [],
  onAdicionarObra,
  onEditarObra,
  onExcluirObra,
  onAdicionarFornecedor,
  onEditarFornecedor,
  onExcluirFornecedor,
  onAdicionarDisciplina,
  onEditarDisciplina,
  onExcluirDisciplina,
  onAdicionarSubdisciplina,
  onEditarSubdisciplina,
  onExcluirSubdisciplina,
}: CadastrosTabProps) {
  const [subTab, setSubTab] = useState<'fornecedores' | 'obras' | 'disciplinas'>('fornecedores');
  const [searchFornecedor, setSearchFornecedor] = useState('');
  const [searchObra, setSearchObra] = useState('');
  const [searchSubdisciplina, setSearchSubdisciplina] = useState('');

  // Estados dos Modais/Formulários de Edição e Criação
  // 1. Fornecedor Modal
  const [fornecedorEditando, setFornecedorEditando] = useState<Fornecedor | null>(null);
  const [fornModalOpen, setFornModalOpen] = useState(false);
  const [fornNome, setFornNome] = useState('');
  const [fornSienge, setFornSienge] = useState('');
  const [fornTipo, setFornTipo] = useState('');

  // 2. Obra Modal
  const [obraEditando, setObraEditando] = useState<Obra | null>(null);
  const [obraModalOpen, setObraModalOpen] = useState(false);
  const [obraCodigo, setObraCodigo] = useState('');
  const [obraNome, setObraNome] = useState('');
  const [obraCC, setObraCC] = useState('');
  const [obraEndereco, setObraEndereco] = useState('');
  const [obraStatus, setObraStatus] = useState<StatusObra>('Ativa');
  const [autoDistratarContratos, setAutoDistratarContratos] = useState<boolean>(false);
  const [autoReativarContratos, setAutoReativarContratos] = useState<boolean>(true);

  // 3. Disciplina / Subdisciplina Modal
  const [subdisciplinaEditando, setSubdisciplinaEditando] = useState<Subdisciplina | null>(null);
  const [discModalOpen, setDiscModalOpen] = useState(false);
  const [discNome, setDiscNome] = useState('');
  const [discCodigo, setDiscCodigo] = useState('');
  const [subNome, setSubNome] = useState('');
  const [subCodigo, setSubCodigo] = useState('');

  // --- Handlers Fornecedor ---
  const handleAbrirNovoFornecedor = () => {
    setFornecedorEditando(null);
    setFornNome('');
    setFornSienge('');
    setFornTipo('');
    setFornModalOpen(true);
  };

  const handleAbrirEditarFornecedor = (f: Fornecedor) => {
    setFornecedorEditando(f);
    setFornNome(f.fornecedor);
    setFornSienge(f.id_sienge || '');
    setFornTipo(f.tipo);
    setFornModalOpen(true);
  };

  const handleSalvarFornecedor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fornNome.trim()) return;

    if (fornecedorEditando) {
      onEditarFornecedor({
        ...fornecedorEditando,
        fornecedor: fornNome.trim().toUpperCase(),
        id_sienge: fornSienge.trim() || null,
        tipo: fornTipo.trim().toUpperCase() || 'GERAL',
      });
    } else {
      let maxNum = 0;
      fornecedores.forEach((f) => {
        const match = String(f.id).match(/\d+/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (num > maxNum) maxNum = num;
        }
      });
      const novo: Fornecedor = {
        id: `FOR${String(maxNum + 1).padStart(3, '0')}`,
        id_sienge: fornSienge.trim() || null,
        fornecedor: fornNome.trim().toUpperCase(),
        tipo: fornTipo.trim().toUpperCase() || 'GERAL',
      };
      onAdicionarFornecedor(novo);
    }
    setFornModalOpen(false);
  };

  // --- Handlers Obra ---
  const handleAbrirNovaObra = () => {
    setObraEditando(null);
    setObraCodigo('');
    setObraNome('');
    setObraCC('');
    setObraEndereco('');
    setObraStatus('Ativa');
    setAutoDistratarContratos(false);
    setAutoReativarContratos(true);
    setObraModalOpen(true);
  };

  const handleAbrirEditarObra = (o: Obra) => {
    setObraEditando(o);
    setObraCodigo(o.codigo);
    setObraNome(o.nome);
    setObraCC(o.cc || '');
    setObraEndereco(o.endereco || '');
    setObraStatus(o.status || 'Ativa');
    setAutoDistratarContratos(false);
    setAutoReativarContratos(o.status !== 'Cancelada');
    setObraModalOpen(true);
  };

  const handleSalvarObra = (e: React.FormEvent) => {
    e.preventDefault();
    if (!obraCodigo.trim() || !obraNome.trim()) return;

    if (obraEditando) {
      const codNorm = obraEditando.codigo.trim().toUpperCase();
      const nomeNorm = obraEditando.nome.trim().toUpperCase();
      const temDistratadosNaObra = contratos.some((c) => {
        const v = (c.obra || '').trim().toUpperCase();
        return (v === codNorm || v === nomeNorm) && c.status === 'Distratado';
      });

      const deveDistratar = obraStatus === 'Cancelada' && autoDistratarContratos;
      const deveReativar =
        !deveDistratar &&
        autoReativarContratos &&
        temDistratadosNaObra &&
        (obraStatus === 'Ativa' || obraStatus === 'Paralisada' || obraStatus === 'Cancelada');

      onEditarObra(
        {
          ...obraEditando,
          codigo: obraCodigo.trim().toUpperCase(),
          nome: obraNome.trim(),
          cc: obraCC.trim(),
          endereco: obraEndereco.trim() || null,
          status: obraStatus,
        },
        {
          distratarContratos: deveDistratar,
          reativarContratos: deveReativar,
        }
      );
    } else {
      let maxNum = 0;
      obras.forEach((o) => {
        const match = String(o.id).match(/\d+/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (num > maxNum) maxNum = num;
        }
      });
      const nova: Obra = {
        id: `OBR${String(maxNum + 1).padStart(3, '0')}`,
        codigo: obraCodigo.trim().toUpperCase(),
        nome: obraNome.trim(),
        cc: obraCC.trim(),
        endereco: obraEndereco.trim() || null,
        status: obraStatus,
      };
      onAdicionarObra(nova);
    }
    setObraModalOpen(false);
  };

  // --- Handlers Disciplina / Subdisciplina ---
  const handleAbrirNovaSubdisciplina = () => {
    setSubdisciplinaEditando(null);
    setDiscNome(disciplinas[0]?.disciplina || 'ARQUITETURA');
    setDiscCodigo(disciplinas[0]?.codigo || 'ARQ');
    setSubNome('');
    setSubCodigo('');
    setDiscModalOpen(true);
  };

  const handleAbrirEditarSubdisciplina = (s: Subdisciplina) => {
    setSubdisciplinaEditando(s);
    setDiscNome(s.disciplina);
    setDiscCodigo(s.cod_disciplina);
    setSubNome(s.subdisciplina);
    setSubCodigo(s.cod_subdisciplina);
    setDiscModalOpen(true);
  };

  const handleSalvarSubdisciplina = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discNome.trim() || !subNome.trim()) return;

    if (subdisciplinaEditando) {
      onEditarSubdisciplina({
        ...subdisciplinaEditando,
        disciplina: discNome.trim().toUpperCase(),
        cod_disciplina: discCodigo.trim().toUpperCase() || discNome.slice(0, 3).toUpperCase(),
        subdisciplina: subNome.trim(),
        cod_subdisciplina: subCodigo.trim().toUpperCase() || subNome.slice(0, 4).toUpperCase(),
      });
    } else {
      const nova: Subdisciplina = {
        id: `SUB${String(subdisciplinas.length + 1).padStart(3, '0')}`,
        disciplina: discNome.trim().toUpperCase(),
        cod_disciplina: discCodigo.trim().toUpperCase() || discNome.slice(0, 3).toUpperCase(),
        subdisciplina: subNome.trim(),
        cod_subdisciplina: subCodigo.trim().toUpperCase() || subNome.slice(0, 4).toUpperCase(),
      };
      onAdicionarSubdisciplina(nova);
    }
    setDiscModalOpen(false);
  };

  // Filtros
  const fornecedoresFiltrados = fornecedores.filter((f) => {
    if (!searchFornecedor.trim()) return true;
    const q = searchFornecedor.toLowerCase();
    return (
      (f.fornecedor || '').toLowerCase().includes(q) ||
      (f.tipo || '').toLowerCase().includes(q) ||
      (f.id_sienge && String(f.id_sienge).toLowerCase().includes(q))
    );
  });

  const obrasFiltradas = obras.filter((o) => {
    if (!searchObra.trim()) return true;
    const q = searchObra.toLowerCase();
    return (
      (o.codigo || '').toLowerCase().includes(q) ||
      (o.nome || '').toLowerCase().includes(q) ||
      (o.cc && String(o.cc).toLowerCase().includes(q))
    );
  });

  const subdisciplinasFiltradas = subdisciplinas.filter((s) => {
    if (!searchSubdisciplina.trim()) return true;
    const q = searchSubdisciplina.toLowerCase();
    return (
      (s.disciplina || '').toLowerCase().includes(q) ||
      (s.subdisciplina || '').toLowerCase().includes(q) ||
      (s.cod_subdisciplina || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Sub-abas de navegação */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#0B384D] pb-3 overflow-x-auto">
        <button
          onClick={() => setSubTab('fornecedores')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            subTab === 'fornecedores'
              ? 'bg-[#00A3C4] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#0B384D]'
          }`}
        >
          <Users className="h-4 w-4" />
          Fornecedores ({fornecedores.length})
        </button>

        <button
          onClick={() => setSubTab('obras')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            subTab === 'obras'
              ? 'bg-[#00A3C4] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#0B384D]'
          }`}
        >
          <Building className="h-4 w-4" />
          Obras & Empreendimentos ({obras.length})
        </button>

        <button
          onClick={() => setSubTab('disciplinas')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            subTab === 'disciplinas'
              ? 'bg-[#00A3C4] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#0B384D]'
          }`}
        >
          <Layers className="h-4 w-4" />
          Disciplinas & Subdisciplinas ({subdisciplinas.length})
        </button>
      </div>

      {/* 1. ABA FORNECEDORES */}
      {subTab === 'fornecedores' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={searchFornecedor}
                onChange={(e) => setSearchFornecedor(e.target.value)}
                placeholder="Buscar fornecedor, ID Sienge, tipo..."
                className="pl-9 text-xs h-9 rounded-xl bg-slate-50 dark:bg-[#0B384D]"
              />
            </div>

            <Button
              size="sm"
              onClick={handleAbrirNovoFornecedor}
              className="bg-[#00A3C4] hover:bg-[#008EA9] text-white text-xs font-bold gap-1.5 h-9 rounded-xl shadow-xs"
            >
              <Plus className="h-4 w-4" /> Novo Fornecedor
            </Button>
          </div>

          {/* Grid de Fornecedores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {fornecedoresFiltrados.map((f) => (
              <div
                key={f.id}
                className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-[#0B384D] bg-white dark:bg-[#072B3B] hover:border-[#00A3C4]/40 transition-colors shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#0B384D] font-bold text-slate-500 dark:text-slate-400">
                      {f.id}
                    </span>
                    {f.id_sienge && (
                      <span className="text-[10px] font-mono text-[#00A3C4] font-bold">
                        Sienge: {f.id_sienge}
                      </span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm break-words leading-tight" title={f.fornecedor}>
                    {f.fornecedor}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 break-words">
                    {f.tipo}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 dark:border-[#0B384D] flex items-center justify-end gap-1">
                  <button
                    onClick={() => handleAbrirEditarFornecedor(f)}
                    title="Editar Fornecedor"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#00A3C4] hover:bg-slate-100 dark:hover:bg-[#0B384D] transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Deseja realmente excluir o fornecedor "${f.fornecedor}"?`)) {
                        onExcluirFornecedor(f.id);
                      }
                    }}
                    title="Excluir Fornecedor"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. ABA OBRAS */}
      {subTab === 'obras' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={searchObra}
                onChange={(e) => setSearchObra(e.target.value)}
                placeholder="Buscar obra, código ou centro de custo..."
                className="pl-9 text-xs h-9 rounded-xl bg-slate-50 dark:bg-[#0B384D]"
              />
            </div>

            <Button
              size="sm"
              onClick={handleAbrirNovaObra}
              className="bg-[#00A3C4] hover:bg-[#008EA9] text-white text-xs font-bold gap-1.5 h-9 rounded-xl shadow-xs"
            >
              <Plus className="h-4 w-4" /> Nova Obra
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {obrasFiltradas.map((o) => {
              const codNorm = o.codigo.trim().toUpperCase();
              const nomeNorm = o.nome.trim().toUpperCase();
              const matchesObra = (val?: string) => {
                if (!val) return false;
                const v = val.trim().toUpperCase();
                return v === codNorm || v === nomeNorm;
              };
              const orcsVinculados = orcamentos.filter(item => matchesObra(item.obra));
              const ctsVinculados = contratos.filter(ct => matchesObra(ct.obra));
              const ctIdsSet = new Set(ctsVinculados.map(ct => ct.id));
              const medsVinculadas = medicoes.filter(m => matchesObra(m.obra) || ctIdsSet.has(m.contrato_id));
              const totalVinculos = orcsVinculados.length + ctsVinculados.length + medsVinculadas.length;

              return (
                <div
                  key={o.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-[#0B384D] bg-white dark:bg-[#072B3B] hover:border-[#00A3C4]/40 transition-colors shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-lg bg-[#00A3C4]/15 text-[#008EA9] dark:text-[#00C4EB] text-xs font-black">
                          {o.codigo}
                        </span>
                        {o.status && (
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${STATUS_OBRA_COLORS[o.status]?.bg || ''} ${STATUS_OBRA_COLORS[o.status]?.text || ''} ${STATUS_OBRA_COLORS[o.status]?.border || ''}`}>
                            {o.status}
                          </span>
                        )}
                      </div>
                      {o.cc && (
                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                          CC: {o.cc}
                        </span>
                      )}
                    </div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-base break-words">
                      {o.nome}
                    </h4>
                    {o.endereco && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 break-words">
                        {o.endereco}
                      </p>
                    )}

                    {/* Indicadores de registros vinculados no banco */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#0B384D] text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        {orcsVinculados.length} {orcsVinculados.length === 1 ? 'orçamento' : 'orçamentos'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#0B384D] text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        {ctsVinculados.length} {ctsVinculados.length === 1 ? 'contrato' : 'contratos'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#0B384D] text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        {medsVinculadas.length} {medsVinculadas.length === 1 ? 'medição' : 'medições'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-[#0B384D] flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleAbrirEditarObra(o)}
                      title="Editar Obra"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#00A3C4] hover:bg-slate-100 dark:hover:bg-[#0B384D] transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        const msg = totalVinculos > 0
                          ? `Deseja realmente excluir a obra "${o.nome}" (${o.codigo})?\n\nATENÇÃO: Isso também excluirá permanentemente do banco de dados:\n• ${orcsVinculados.length} item(ns) de orçamento\n• ${ctsVinculados.length} contrato(s)\n• ${medsVinculadas.length} medição(ões)`
                          : `Deseja realmente excluir a obra "${o.nome}" (${o.codigo}) do banco de dados?`;
                        if (confirm(msg)) {
                          onExcluirObra(o.id);
                        }
                      }}
                      title="Excluir Obra e Vínculos"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. ABA DISCIPLINAS & SUBDISCIPLINAS */}
      {subTab === 'disciplinas' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={searchSubdisciplina}
                onChange={(e) => setSearchSubdisciplina(e.target.value)}
                placeholder="Buscar por disciplina ou subdisciplina..."
                className="pl-9 text-xs h-9 rounded-xl bg-slate-50 dark:bg-[#0B384D]"
              />
            </div>

            <Button
              size="sm"
              onClick={handleAbrirNovaSubdisciplina}
              className="bg-[#00A3C4] hover:bg-[#008EA9] text-white text-xs font-bold gap-1.5 h-9 rounded-xl shadow-xs"
            >
              <Plus className="h-4 w-4" /> Nova Subdisciplina
            </Button>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-[#0B384D] bg-white dark:bg-[#072B3B] overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[550px]">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-[#0B384D] text-slate-600 dark:text-slate-300 font-bold sticky top-0 border-b border-slate-200 dark:border-[#0B384D]">
                  <tr>
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Disciplina Pai</th>
                    <th className="py-2.5 px-3">Subdisciplina</th>
                    <th className="py-2.5 px-3">Sigla Subdisciplina</th>
                    <th className="py-2.5 px-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#0B384D]/60 text-slate-700 dark:text-slate-200">
                  {subdisciplinasFiltradas.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-[#0B384D]/30 transition-colors">
                      <td className="py-2 px-3 font-mono text-slate-500 whitespace-nowrap">{s.id}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        {s.disciplina} <span className="text-slate-400 font-normal font-mono">({s.cod_disciplina})</span>
                      </td>
                      <td className="py-2 px-3 font-medium break-words max-w-[200px]">{s.subdisciplina}</td>
                      <td className="py-2 px-3 font-mono text-[#00A3C4] font-bold whitespace-nowrap">{s.cod_subdisciplina}</td>
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleAbrirEditarSubdisciplina(s)}
                            title="Editar Subdisciplina"
                            className="p-1 rounded-md text-slate-400 hover:text-[#00A3C4] hover:bg-slate-100 dark:hover:bg-[#0B384D] transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Deseja realmente excluir a subdisciplina "${s.subdisciplina}"?`)) {
                                onExcluirSubdisciplina(s.id);
                              }
                            }}
                            title="Excluir Subdisciplina"
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAIS DE CADASTRO/EDIÇÃO --- */}

      {/* 1. Modal Fornecedor */}
      {fornModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-0">
          <div className="bg-white dark:bg-[#072B3B] rounded-2xl border border-slate-200 dark:border-[#0B384D] p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#0B384D] pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {fornecedorEditando ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </h3>
              <button onClick={() => setFornModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarFornecedor} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Nome da Empresa / Fornecedor *
                </label>
                <Input
                  value={fornNome}
                  onChange={(e) => setFornNome(e.target.value)}
                  placeholder="Ex: RSC, SOMA..."
                  className="text-xs h-9 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  ID Sienge (Código no ERP)
                </label>
                <Input
                  value={fornSienge}
                  onChange={(e) => setFornSienge(e.target.value)}
                  placeholder="Ex: 2306"
                  className="text-xs h-9 rounded-xl"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Tipo / Especialidade
                </label>
                <Input
                  value={fornTipo}
                  onChange={(e) => setFornTipo(e.target.value)}
                  placeholder="Ex: ARQUITETURA, ESTRUTURA, TAXAS..."
                  className="text-xs h-9 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#0B384D] flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setFornModalOpen(false)} className="text-xs h-9 rounded-xl">
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="bg-[#00A3C4] hover:bg-[#008EA9] text-white text-xs font-bold h-9 rounded-xl">
                  Salvar Fornecedor
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal Obra */}
      {obraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-0">
          <div className="bg-white dark:bg-[#072B3B] rounded-2xl border border-slate-200 dark:border-[#0B384D] p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#0B384D] pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {obraEditando ? 'Editar Obra' : 'Nova Obra'}
              </h3>
              <button onClick={() => setObraModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarObra} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Código da Obra *
                </label>
                <Input
                  value={obraCodigo}
                  onChange={(e) => setObraCodigo(e.target.value)}
                  placeholder="Ex: ALT, GAL, MON..."
                  className="text-xs h-9 rounded-xl uppercase"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Nome do Empreendimento *
                </label>
                <Input
                  value={obraNome}
                  onChange={(e) => setObraNome(e.target.value)}
                  placeholder="Ex: Altamira, Galassi..."
                  className="text-xs h-9 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Centro de Custo (CC Sienge)
                </label>
                <Input
                  value={obraCC}
                  onChange={(e) => setObraCC(e.target.value)}
                  placeholder="Ex: 47, 65..."
                  className="text-xs h-9 rounded-xl"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Endereço / Localização
                </label>
                <Input
                  value={obraEndereco}
                  onChange={(e) => setObraEndereco(e.target.value)}
                  placeholder="Ex: Rua das Palmeiras, 120"
                  className="text-xs h-9 rounded-xl"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                  Status do Empreendimento *
                </label>
                <select
                  value={obraStatus}
                  onChange={(e) => setObraStatus(e.target.value as StatusObra)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-white dark:bg-[#072B3B] border border-slate-200 dark:border-[#0B384D] text-slate-800 dark:text-slate-100 h-9 focus:outline-none focus:ring-2 focus:ring-[#00A3C4]"
                >
                  {STATUS_OBRA_OPCOES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* Comportamento Financeiro para Obra Paralisada */}
              {obraEditando && obraStatus === 'Paralisada' && (() => {
                const codNorm = obraEditando.codigo.trim().toUpperCase();
                const nomeNorm = obraEditando.nome.trim().toUpperCase();
                const qtdDistratados = contratos.filter((c) => {
                  const v = (c.obra || '').trim().toUpperCase();
                  return (v === codNorm || v === nomeNorm) && c.status === 'Distratado';
                }).length;

                return (
                  <div className="p-3 rounded-xl border border-amber-300/80 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/30 space-y-2">
                    <p className="text-[11px] font-bold text-amber-900 dark:text-amber-200 leading-tight">
                      Tratamento de Saldos — Obra Paralisada (Pausada):
                    </p>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-tight">
                      • <b>Contratos ativos</b>: não entram em <i>Valor a Medir</i> imediato; seus saldos ficam segregados como <b>Saldo Pausado</b> (podendo ser medidos na retomada).<br />
                      • <b>Orçamentos não contratados</b>: segregados como <b>Contratação Suspensa</b>.<br />
                      • <b>Janela 30/60/90d e Curva S</b>: medições futuras (&apos;A Medir&apos;) ficam suspensas da previsão de desembolso.
                    </p>
                    {qtdDistratados > 0 && (
                      <div className="pt-1.5 border-t border-amber-200 dark:border-amber-800/60 flex items-start gap-2">
                        <input
                          type="checkbox"
                          id="restaurarPausadaCheck"
                          checked={autoReativarContratos}
                          onChange={(e) => setAutoReativarContratos(e.target.checked)}
                          className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4 mt-0.5 cursor-pointer"
                        />
                        <label htmlFor="restaurarPausadaCheck" className="text-[11px] font-bold text-amber-900 dark:text-amber-100 cursor-pointer leading-tight">
                          Restaurar {qtdDistratados} contrato(s) distratado(s) desta obra para exibir seus saldos como <u>Saldo Pausado</u>
                        </label>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Comportamento Financeiro para Obra Cancelada */}
              {obraEditando && obraStatus === 'Cancelada' && (() => {
                const codNorm = obraEditando.codigo.trim().toUpperCase();
                const nomeNorm = obraEditando.nome.trim().toUpperCase();
                const qtdDistratados = contratos.filter((c) => {
                  const v = (c.obra || '').trim().toUpperCase();
                  return (v === codNorm || v === nomeNorm) && c.status === 'Distratado';
                }).length;

                return (
                  <div className="p-3 rounded-xl border border-rose-300/80 dark:border-rose-700/60 bg-rose-50 dark:bg-rose-950/30 space-y-2">
                    <p className="text-[11px] font-bold text-rose-900 dark:text-rose-200 leading-tight">
                      Tratamento de Saldos — Obra Cancelada:
                    </p>
                    <p className="text-[11px] text-rose-800 dark:text-rose-300 leading-tight">
                      • <b>Contratos cadastrados ativos</b>: o saldo restante passa a ser exibido como <b>Saldo a Distratar</b> (fora de <i>Valor a Medir</i>).<br />
                      • <b>Orçamentos sem contrato</b>: têm o saldo <i>Falta Contratar</i> zerado sem gerar falsa economia.
                    </p>
                    <div className="pt-1.5 border-t border-rose-200 dark:border-rose-800/60 space-y-1.5">
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          id="autoDistratarContratosCheck"
                          checked={autoDistratarContratos}
                          onChange={(e) => {
                            setAutoDistratarContratos(e.target.checked);
                            if (e.target.checked) setAutoReativarContratos(false);
                          }}
                          className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4 mt-0.5 cursor-pointer"
                        />
                        <label htmlFor="autoDistratarContratosCheck" className="text-[11px] font-bold text-rose-900 dark:text-rose-200 cursor-pointer leading-tight">
                          Já formalizar distrato em lote de todos os contratos desta obra agora (zera o Saldo a Distratar)
                        </label>
                      </div>
                      {qtdDistratados > 0 && !autoDistratarContratos && (
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            id="restaurarCanceladaCheck"
                            checked={autoReativarContratos}
                            onChange={(e) => setAutoReativarContratos(e.target.checked)}
                            className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4 mt-0.5 cursor-pointer"
                          />
                          <label htmlFor="restaurarCanceladaCheck" className="text-[11px] font-bold text-rose-900 dark:text-rose-100 cursor-pointer leading-tight">
                            Restaurar {qtdDistratados} contrato(s) já distratado(s) para que apareçam em <u>Saldo a Distratar</u>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Automação de Reativação para Obras que voltam a Ativa */}
              {obraEditando && obraStatus === 'Ativa' && (() => {
                const codNorm = obraEditando.codigo.trim().toUpperCase();
                const nomeNorm = obraEditando.nome.trim().toUpperCase();
                const qtdDistratados = contratos.filter((c) => {
                  const v = (c.obra || '').trim().toUpperCase();
                  return (v === codNorm || v === nomeNorm) && c.status === 'Distratado';
                }).length;
                if (qtdDistratados === 0) return null;

                return (
                  <div className="p-3 rounded-xl border border-emerald-300/80 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-950/30 space-y-1.5">
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        id="autoReativarContratosCheck"
                        checked={autoReativarContratos}
                        onChange={(e) => setAutoReativarContratos(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 mt-0.5 cursor-pointer"
                      />
                      <label htmlFor="autoReativarContratosCheck" className="text-xs font-bold text-emerald-900 dark:text-emerald-200 cursor-pointer">
                        Reativar {qtdDistratados} contrato(s) distratado(s) desta obra
                      </label>
                    </div>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300 ml-6 leading-tight">
                      Restaura os contratos da obra para o status Ativo e recupera os saldos originais a medir.
                    </p>
                  </div>
                );
              })()}

              <div className="pt-3 border-t border-slate-100 dark:border-[#0B384D] flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setObraModalOpen(false)} className="text-xs h-9 rounded-xl">
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="bg-[#00A3C4] hover:bg-[#008EA9] text-white text-xs font-bold h-9 rounded-xl">
                  Salvar Obra
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Modal Subdisciplina */}
      {discModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-0">
          <div className="bg-white dark:bg-[#072B3B] rounded-2xl border border-slate-200 dark:border-[#0B384D] p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#0B384D] pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {subdisciplinaEditando ? 'Editar Subdisciplina' : 'Nova Subdisciplina'}
              </h3>
              <button onClick={() => setDiscModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarSubdisciplina} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Disciplina Pai *
                  </label>
                  <Input
                    value={discNome}
                    onChange={(e) => setDiscNome(e.target.value)}
                    placeholder="Ex: ARQUITETURA, ESTRUTURA"
                    className="text-xs h-9 rounded-xl uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Sigla Disciplina
                  </label>
                  <Input
                    value={discCodigo}
                    onChange={(e) => setDiscCodigo(e.target.value)}
                    placeholder="Ex: ARQ, EST"
                    className="text-xs h-9 rounded-xl uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Nome da Subdisciplina *
                  </label>
                  <Input
                    value={subNome}
                    onChange={(e) => setSubNome(e.target.value)}
                    placeholder="Ex: Fundação, Alvenaria"
                    className="text-xs h-9 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Sigla / Código
                  </label>
                  <Input
                    value={subCodigo}
                    onChange={(e) => setSubCodigo(e.target.value)}
                    placeholder="Ex: FUND, ALV"
                    className="text-xs h-9 rounded-xl uppercase"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#0B384D] flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setDiscModalOpen(false)} className="text-xs h-9 rounded-xl">
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="bg-[#00A3C4] hover:bg-[#008EA9] text-white text-xs font-bold h-9 rounded-xl">
                  Salvar Subdisciplina
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
