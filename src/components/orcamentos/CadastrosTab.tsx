"use client";

import React, { useState } from 'react';
import {
  Obra,
  Fornecedor,
  Disciplina,
  Subdisciplina,
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
  onAdicionarObra: (obra: Obra) => void;
  onEditarObra: (obra: Obra) => void;
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
      const novo: Fornecedor = {
        id: `FOR${String(fornecedores.length + 1).padStart(3, '0')}`,
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
    setObraModalOpen(true);
  };

  const handleAbrirEditarObra = (o: Obra) => {
    setObraEditando(o);
    setObraCodigo(o.codigo);
    setObraNome(o.nome);
    setObraCC(o.cc || '');
    setObraEndereco(o.endereco || '');
    setObraModalOpen(true);
  };

  const handleSalvarObra = (e: React.FormEvent) => {
    e.preventDefault();
    if (!obraCodigo.trim() || !obraNome.trim()) return;

    if (obraEditando) {
      onEditarObra({
        ...obraEditando,
        codigo: obraCodigo.trim().toUpperCase(),
        nome: obraNome.trim(),
        cc: obraCC.trim(),
        endereco: obraEndereco.trim() || null,
      });
    } else {
      const nova: Obra = {
        id: `OBR${String(obras.length + 1).padStart(3, '0')}`,
        codigo: obraCodigo.trim().toUpperCase(),
        nome: obraNome.trim(),
        cc: obraCC.trim(),
        endereco: obraEndereco.trim() || null,
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
            {obrasFiltradas.map((o) => (
              <div
                key={o.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-[#0B384D] bg-white dark:bg-[#072B3B] hover:border-[#00A3C4]/40 transition-colors shadow-xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#00A3C4]/15 text-[#008EA9] dark:text-[#00C4EB] text-xs font-black">
                      {o.codigo}
                    </span>
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
                      if (confirm(`Deseja realmente excluir a obra "${o.nome}" (${o.codigo})? Verifique se há contratos ou orçamentos vinculados.`)) {
                        onExcluirObra(o.id);
                      }
                    }}
                    title="Excluir Obra"
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
                  placeholder="Ex: ARCIS, SOMA..."
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
