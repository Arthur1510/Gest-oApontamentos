"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, FolderKanban, Loader2, Sparkles, AlertCircle, Trash2, Calendar, CheckCircle2, XCircle, Search, X, Layers } from 'lucide-react';
import { Projeto, NovoProjeto, SUGESTOES_PAVIMENTOS } from '@/types/apontamento';
import { supabase, isSupabaseConfigured, MOCK_PROJETOS } from '@/lib/supabase/client';
import { SupabaseStatusBanner } from '@/components/apontamentos/SupabaseStatusBanner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SelectNative } from '@/components/ui/select-native';
import { formatDate } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export default function ProjetosPage() {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [status, setStatus] = useState<'Ativo' | 'Inativo'>('Ativo');
  const [pavimentos, setPavimentos] = useState<string[]>([
    'Subsolo 1',
    'Térreo',
    'Pavimento Tipo',
    'Cobertura',
  ]);
  const [novoPavimentoInput, setNovoPavimentoInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const addPavimento = (nomePav: string) => {
    const trimmed = nomePav.trim();
    if (!trimmed) return;
    if (!pavimentos.includes(trimmed)) {
      setPavimentos((prev) => [...prev, trimmed]);
    }
    setNovoPavimentoInput('');
  };

  const removePavimento = (nomePav: string) => {
    setPavimentos((prev) => prev.filter((p) => p !== nomePav));
  };

  // Carregar Projetos do Supabase ou Mock
  const fetchProjetos = useCallback(async () => {
    setIsLoading(true);

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('projetos')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erro ao buscar projetos:', error);
          setProjetos(MOCK_PROJETOS);
        } else if (data) {
          setProjetos(data as Projeto[]);
        }
      } catch (err) {
        console.error('Erro ao conectar ao Supabase:', err);
        setProjetos(MOCK_PROJETOS);
      }
    } else {
      setProjetos(MOCK_PROJETOS);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchProjetos();
  }, [fetchProjetos]);

  // Inserir Projeto
  const handleCreateProjeto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErrorMsg('Por favor, informe o nome do projeto.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const novoData: NovoProjeto = {
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        status,
        pavimentos: pavimentos.length > 0 ? pavimentos : null,
      };

      if (isSupabaseConfigured() && supabase) {
        let result = await supabase
          .from('projetos')
          .insert([novoData])
          .select();

        if (
          result.error &&
          (result.error.message.includes('column') ||
            result.error.message.includes('schema cache') ||
            result.error.code === 'PGRST204' ||
            result.error.code === '42703')
        ) {
          const { pavimentos: _, ...fallbackData } = novoData;
          result = await supabase
            .from('projetos')
            .insert([fallbackData])
            .select();
        }

        if (result.error) throw new Error(result.error.message);
        if (result.data && result.data[0]) {
          const createdProj = {
            ...result.data[0],
            pavimentos: result.data[0].pavimentos ?? novoData.pavimentos,
          } as Projeto;
          setProjetos((prev) => [createdProj, ...prev]);
        }
      } else {
        const novoItem: Projeto = {
          ...novoData,
          id: `proj-${Date.now()}`,
          created_at: new Date().toISOString(),
        };
        setProjetos((prev) => [novoItem, ...prev]);
      }

      // Reset
      setNome('');
      setDescricao('');
      setStatus('Ativo');
      setPavimentos(['Subsolo 1', 'Térreo', 'Pavimento Tipo', 'Cobertura']);
      setIsFormOpen(false);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Erro ao cadastrar projeto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Alternar Status do Projeto
  const handleToggleStatus = async (projeto: Projeto) => {
    const novoStatus: 'Ativo' | 'Inativo' = projeto.status === 'Ativo' ? 'Inativo' : 'Ativo';

    setProjetos((prev) =>
      prev.map((p) => (p.id === projeto.id ? { ...p, status: novoStatus } : p))
    );

    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('projetos')
        .update({ status: novoStatus })
        .eq('id', projeto.id);

      if (error) {
        console.error('Erro ao atualizar status do projeto:', error);
        fetchProjetos();
      }
    }
  };

  // Excluir Projeto
  const handleDeleteProjeto = async (id: string, nomeProjeto: string) => {
    if (!confirm(`Tem certeza de que deseja excluir o projeto "${nomeProjeto}"?\nATENÇÃO: Todos os apontamentos vinculados a este projeto também serão excluídos (CASCADE).`)) {
      return;
    }

    setProjetos((prev) => prev.filter((p) => p.id !== id));

    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('projetos').delete().eq('id', id);
      if (error) {
        console.error('Erro ao excluir projeto:', error);
        fetchProjetos();
      }
    }
  };

  const filteredProjetos = projetos.filter(
    (p) =>
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.descricao && p.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#041A24] text-[#072B3B] dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Banner de status Supabase */}
        <SupabaseStatusBanner />

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-[#0B384D]">
          <div>
            <div className="flex items-center gap-2 text-[#00A3C4] dark:text-[#00C4EB] font-bold text-xs uppercase tracking-wider">
              <FolderKanban className="h-4 w-4" /> WCC Participações • Gestão de Empreendimentos
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#072B3B] dark:text-white mt-1">
              Projetos & Empreendimentos
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Cadastre e gerencie os empreendimentos vinculados aos apontamentos e relatórios BIM.
            </p>
          </div>

          <Button
            onClick={() => setIsFormOpen(true)}
            variant="wcc"
            size="lg"
            className="shadow-lg shadow-[#00A3C4]/20 hover:scale-[1.02] transition-transform gap-2 self-start sm:self-auto shrink-0 font-bold cursor-pointer"
          >
            <Plus className="h-5 w-5" /> Cadastrar Projeto
          </Button>
        </div>

        {/* Busca por Projeto */}
        <div className="flex items-center justify-between bg-white dark:bg-[#072B3B] border border-slate-200/80 dark:border-[#0B384D] p-4 rounded-xl shadow-2xs">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome ou descrição do projeto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs sm:text-sm h-10 rounded-xl"
            />
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline font-bold">
            Total: {filteredProjetos.length} projeto(s)
          </span>
        </div>

        {/* Lista de Projetos */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#00A3C4]" />
            <p className="text-xs text-slate-500 font-medium">Carregando projetos do Supabase...</p>
          </div>
        ) : filteredProjetos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjetos.map((projeto) => (
              <Card key={projeto.id} className="flex flex-col justify-between hover:shadow-md hover:border-[#00A3C4] dark:hover:border-[#00A3C4] transition-all dark:bg-[#072B3B] dark:border-[#0B384D]">
                <div>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <Badge
                        variant={projeto.status === 'Ativo' ? 'resolvido' : 'secondary'}
                        className="text-[11px]"
                      >
                        {projeto.status === 'Ativo' ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(projeto.created_at)}
                      </div>
                    </div>
                    <CardTitle className="text-lg font-bold leading-snug text-[#072B3B] dark:text-white">{projeto.nome}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                      {projeto.descricao || 'Sem descrição cadastrada.'}
                    </p>

                    {/* Exibição dos Pavimentos / Níveis Configurados */}
                    {projeto.pavimentos && projeto.pavimentos.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 dark:border-[#0B384D]/60 space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Layers className="h-3 w-3 text-[#00A3C4]" /> Pavimentos / Níveis ({projeto.pavimentos.length})
                        </span>
                        <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                          {projeto.pavimentos.map((pav) => (
                            <span key={pav} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#0B384D] text-[#072B3B] dark:text-slate-200 text-[10px] font-semibold border border-slate-200 dark:border-slate-700">
                              {pav}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </div>

                <div className="px-6 pb-4 pt-2 border-t border-slate-100 dark:border-[#0B384D] flex items-center justify-between text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(projeto)}
                    className="text-xs gap-1.5 hover:bg-slate-100 dark:hover:bg-[#0B384D]"
                  >
                    {projeto.status === 'Ativo' ? (
                      <>
                        <XCircle className="h-3.5 w-3.5 text-amber-500" /> Desativar
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Ativar
                      </>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteProjeto(projeto.id, projeto.nome)}
                    title="Excluir Projeto"
                    className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-[#0B384D] bg-white/50 dark:bg-[#072B3B]/50 p-12 text-center flex flex-col items-center justify-center gap-4">
            <div className="p-4 rounded-full bg-cyan-50 dark:bg-[#00A3C4]/20 text-[#00A3C4]">
              <Sparkles className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#072B3B] dark:text-white">Nenhum projeto cadastrado</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                Cadastre o primeiro empreendimento da WCC para associar aos apontamentos.
              </p>
            </div>
            <Button variant="wcc" size="sm" onClick={() => setIsFormOpen(true)} className="text-xs gap-1.5 font-bold">
              <Plus className="h-4 w-4" /> Cadastrar Primeiro Projeto
            </Button>
          </div>
        )}
      </div>

      {/* Modal de Cadastro de Projeto */}
      <Dialog open={isFormOpen} onOpenChange={(open) => !open && setIsFormOpen(false)}>
        <DialogContent className="sm:max-w-lg dark:bg-[#072B3B] dark:border-[#0B384D] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 text-[#00A3C4] dark:text-[#00C4EB] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-4 w-4" /> WCC • Novo Empreendimento
            </div>
            <DialogTitle className="text-xl font-black text-[#072B3B] dark:text-white">Cadastrar Projeto</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs">
              Adicione um novo projeto e configure seus pavimentos para uso nos apontamentos e relatórios.
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300 flex items-center gap-2 border border-red-200 dark:border-red-800">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateProjeto} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome do Projeto *</Label>
              <Input
                id="nome"
                placeholder="Ex: Empreendimento Residencial - Torre 1"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status">Status do Projeto *</Label>
              <SelectNative
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Ativo' | 'Inativo')}
              >
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </SelectNative>
            </div>

            {/* Gerenciamento de Pavimentos / Níveis */}
            <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-[#0B384D]">
              <Label className="flex items-center justify-between text-xs font-bold text-[#072B3B] dark:text-slate-200">
                <span className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-[#00A3C4]" /> Pavimentos / Níveis do Projeto
                </span>
                <span className="text-[10px] text-slate-400 font-normal">({pavimentos.length} configurados)</span>
              </Label>

              {/* Input para adicionar pavimento customizado */}
              <div className="flex items-center gap-1.5">
                <Input
                  placeholder="Ex: Subsolo 2, 5º Pavimento, Cobertura..."
                  value={novoPavimentoInput}
                  onChange={(e) => setNovoPavimentoInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addPavimento(novoPavimentoInput);
                    }
                  }}
                  className="h-9 text-xs rounded-xl"
                />
                <Button
                  type="button"
                  variant="wcc"
                  size="sm"
                  onClick={() => addPavimento(novoPavimentoInput)}
                  className="h-9 text-xs font-bold shrink-0"
                >
                  + Adicionar
                </Button>
              </div>

              {/* Sugestões Rápidas */}
              <div className="flex flex-wrap items-center gap-1 pt-1">
                <span className="text-[10px] text-slate-400 font-bold mr-1">Sugestões rápidas:</span>
                {SUGESTOES_PAVIMENTOS.slice(0, 8).map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => addPavimento(sug)}
                    className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#0B384D] text-slate-700 dark:text-slate-300 text-[10px] font-semibold hover:bg-[#00A3C4]/15 hover:text-[#008EA9] transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    + {sug}
                  </button>
                ))}
              </div>

              {/* Tags dos Pavimentos Adicionados */}
              {pavimentos.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1.5 p-2.5 bg-slate-50 dark:bg-[#041A24] rounded-xl border border-slate-200 dark:border-[#0B384D] max-h-28 overflow-y-auto">
                  {pavimentos.map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#00A3C4]/15 text-[#008EA9] dark:text-[#00C4EB] text-[11px] font-bold border border-[#00A3C4]/30"
                    >
                      {p}
                      <button
                        type="button"
                        onClick={() => removePavimento(p)}
                        className="hover:text-rose-500 transition-colors cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="descricao">Descrição (Opcional)</Label>
              <Textarea
                id="descricao"
                placeholder="Breve descrição do escopo do projeto ou obra..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={2}
                className="rounded-xl text-xs"
              />
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" variant="wcc" disabled={isSubmitting} className="font-bold cursor-pointer">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> Cadastrar Projeto
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
