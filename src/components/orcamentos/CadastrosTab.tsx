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
} from 'lucide-react';

interface CadastrosTabProps {
  obras: Obra[];
  fornecedores: Fornecedor[];
  disciplinas: Disciplina[];
  subdisciplinas: Subdisciplina[];
  onAdicionarObra: (obra: Obra) => void;
  onAdicionarFornecedor: (fornecedor: Fornecedor) => void;
}

export function CadastrosTab({
  obras,
  fornecedores,
  disciplinas,
  subdisciplinas,
  onAdicionarObra,
  onAdicionarFornecedor,
}: CadastrosTabProps) {
  const [subTab, setSubTab] = useState<'fornecedores' | 'obras' | 'disciplinas'>('fornecedores');
  const [searchFornecedor, setSearchFornecedor] = useState('');
  const [searchSubdisciplina, setSearchSubdisciplina] = useState('');

  // Novo Fornecedor Form
  const [novoFornNome, setNovoFornNome] = useState('');
  const [novoFornSienge, setNovoFornSienge] = useState('');
  const [novoFornTipo, setNovoFornTipo] = useState('');
  const [showNovoForn, setShowNovoForn] = useState(false);

  // Nova Obra Form
  const [novaObraNome, setNovaObraNome] = useState('');
  const [novaObraCodigo, setNovaObraCodigo] = useState('');
  const [novaObraCC, setNovaObraCC] = useState('');
  const [showNovaObra, setShowNovaObra] = useState(false);

  const handleSalvarFornecedor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoFornNome) return;
    const novo: Fornecedor = {
      id: `FOR${String(fornecedores.length + 1).padStart(3, '0')}`,
      id_sienge: novoFornSienge,
      fornecedor: novoFornNome.trim().toUpperCase(),
      tipo: novoFornTipo.trim().toUpperCase() || 'GERAL',
    };
    onAdicionarFornecedor(novo);
    setNovoFornNome('');
    setNovoFornSienge('');
    setNovoFornTipo('');
    setShowNovoForn(false);
  };

  const handleSalvarObra = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaObraNome || !novaObraCodigo) return;
    const nova: Obra = {
      id: `OBR${String(obras.length + 1).padStart(3, '0')}`,
      cc: novaObraCC,
      codigo: novaObraCodigo.trim().toUpperCase(),
      nome: novaObraNome.trim(),
    };
    onAdicionarObra(nova);
    setNovaObraNome('');
    setNovaObraCodigo('');
    setNovaObraCC('');
    setShowNovaObra(false);
  };

  const fornecedoresFiltrados = fornecedores.filter((f) => {
    if (!searchFornecedor.trim()) return true;
    const q = searchFornecedor.toLowerCase();
    return (
      f.fornecedor.toLowerCase().includes(q) ||
      f.tipo.toLowerCase().includes(q) ||
      (f.id_sienge && f.id_sienge.toLowerCase().includes(q))
    );
  });

  const subdisciplinasFiltradas = subdisciplinas.filter((s) => {
    if (!searchSubdisciplina.trim()) return true;
    const q = searchSubdisciplina.toLowerCase();
    return (
      s.disciplina.toLowerCase().includes(q) ||
      s.subdisciplina.toLowerCase().includes(q) ||
      s.cod_subdisciplina.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Sub-abas de navegação */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#0B384D] pb-3">
        <button
          onClick={() => setSubTab('fornecedores')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
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
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
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
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
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
              onClick={() => setShowNovoForn(!showNovoForn)}
              className="bg-[#00A3C4] hover:bg-[#008EA9] text-white text-xs font-bold gap-1.5 h-9 rounded-xl"
            >
              <Plus className="h-4 w-4" /> Novo Fornecedor
            </Button>
          </div>

          {/* Form inline de Novo Fornecedor */}
          {showNovoForn && (
            <Card className="border-slate-200 dark:border-[#0B384D] bg-white dark:bg-[#072B3B] p-4">
              <form onSubmit={handleSalvarFornecedor} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Nome da Empresa / Fornecedor *
                  </label>
                  <Input
                    value={novoFornNome}
                    onChange={(e) => setNovoFornNome(e.target.value)}
                    placeholder="Ex: ARCIS, SOMA..."
                    className="text-xs h-8 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    ID Sienge
                  </label>
                  <Input
                    value={novoFornSienge}
                    onChange={(e) => setNovoFornSienge(e.target.value)}
                    placeholder="Ex: 2306"
                    className="text-xs h-8 rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Tipo / Especialidade
                  </label>
                  <Input
                    value={novoFornTipo}
                    onChange={(e) => setNovoFornTipo(e.target.value)}
                    placeholder="Ex: ARQUITETURA, ESTRUTURA"
                    className="text-xs h-8 rounded-lg"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8">
                    Salvar
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowNovoForn(false)} className="text-xs h-8">
                    Cancelar
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Grid de Fornecedores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {fornecedoresFiltrados.map((f) => (
              <div
                key={f.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-[#0B384D] bg-white dark:bg-[#072B3B] hover:border-[#00A3C4]/40 transition-colors shadow-2xs"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#0B384D] font-bold text-slate-500 dark:text-slate-400">
                    {f.id}
                  </span>
                  {f.id_sienge && (
                    <span className="text-[10px] font-mono text-[#00A3C4] font-bold">
                      Sienge: {f.id_sienge}
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate" title={f.fornecedor}>
                  {f.fornecedor}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {f.tipo}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. ABA OBRAS */}
      {subTab === 'obras' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => setShowNovaObra(!showNovaObra)}
              className="bg-[#00A3C4] hover:bg-[#008EA9] text-white text-xs font-bold gap-1.5 h-9 rounded-xl"
            >
              <Plus className="h-4 w-4" /> Nova Obra
            </Button>
          </div>

          {showNovaObra && (
            <Card className="border-slate-200 dark:border-[#0B384D] bg-white dark:bg-[#072B3B] p-4">
              <form onSubmit={handleSalvarObra} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Código da Obra *
                  </label>
                  <Input
                    value={novaObraCodigo}
                    onChange={(e) => setNovaObraCodigo(e.target.value)}
                    placeholder="Ex: ALT, GAL..."
                    className="text-xs h-8 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Nome do Empreendimento *
                  </label>
                  <Input
                    value={novaObraNome}
                    onChange={(e) => setNovaObraNome(e.target.value)}
                    placeholder="Ex: Altamira, Galassi..."
                    className="text-xs h-8 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                    Centro de Custo (CC Sienge)
                  </label>
                  <Input
                    value={novaObraCC}
                    onChange={(e) => setNovaObraCC(e.target.value)}
                    placeholder="Ex: 47, 65..."
                    className="text-xs h-8 rounded-lg"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8">
                    Salvar
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowNovaObra(false)} className="text-xs h-8">
                    Cancelar
                  </Button>
                </div>
              </form>
            </Card>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {obras.map((o) => (
              <div
                key={o.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-[#0B384D] bg-white dark:bg-[#072B3B] hover:border-[#00A3C4]/40 transition-colors shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-lg bg-[#00A3C4]/15 text-[#008EA9] dark:text-[#00C4EB] text-xs font-black">
                    {o.codigo}
                  </span>
                  {o.cc && (
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      CC: {o.cc}
                    </span>
                  )}
                </div>
                <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                  {o.nome}
                </h4>
                {o.endereco && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {o.endereco}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. ABA DISCIPLINAS & SUBDISCIPLINAS */}
      {subTab === 'disciplinas' && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchSubdisciplina}
              onChange={(e) => setSearchSubdisciplina(e.target.value)}
              placeholder="Buscar por disciplina ou subdisciplina..."
              className="pl-9 text-xs h-9 rounded-xl bg-slate-50 dark:bg-[#0B384D]"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-[#0B384D] bg-white dark:bg-[#072B3B] overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-[#0B384D] text-slate-600 dark:text-slate-300 font-bold sticky top-0 border-b border-slate-200 dark:border-[#0B384D]">
                  <tr>
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Disciplina Pai</th>
                    <th className="py-2.5 px-3">Subdisciplina</th>
                    <th className="py-2.5 px-3">Sigla Subdisciplina</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#0B384D]/60 text-slate-700 dark:text-slate-200">
                  {subdisciplinasFiltradas.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-[#0B384D]/30 transition-colors">
                      <td className="py-2 px-3 font-mono text-slate-500">{s.id}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                        {s.disciplina} ({s.cod_disciplina})
                      </td>
                      <td className="py-2 px-3 font-medium">{s.subdisciplina}</td>
                      <td className="py-2 px-3 font-mono text-[#00A3C4]">{s.cod_subdisciplina}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
