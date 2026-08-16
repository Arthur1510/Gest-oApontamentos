"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, FolderKanban, Loader2, Sparkles, AlertCircle, Trash2, Calendar, CheckCircle2, XCircle, Search } from 'lucide-react';
import { Projeto, NovoProjeto } from '@/types/apontamento';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
      };

      if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase
          .from('projetos')
          .insert([novoData])
          .select();

        if (error) throw new Error(error.message);
        if (data && data[0]) {
          setProjetos((prev) => [data[0] as Projeto, ...prev]);
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
    <main className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Banner de status Supabase */}
        <SupabaseStatusBanner />

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs uppercase tracking-wider">
              <FolderKanban className="h-4 w-4" /> Gestão de Empreendimentos
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mt-1">
              Projetos Cadastrados
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Cadastre e organize os projetos para vincular aos apontamentos e relatórios de interferências.
            </p>
          </div>

          <Button
            onClick={() => setIsFormOpen(true)}
            variant="indigo"
            size="lg"
            className="shadow-lg shadow-indigo-600/20 hover:scale-[1.02] transition-transform gap-2 self-start sm:self-auto shrink-0"
          >
            <Plus className="h-5 w-5" /> Cadastrar Projeto
          </Button>
        </div>

        {/* Busca por Projeto */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-xl shadow-2xs">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome ou descrição do projeto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs sm:text-sm h-10 rounded-xl"
            />
          </div>
          <span className="text-xs text-slate-500 hidden sm:inline font-medium">
            Total: {filteredProjetos.length} projeto(s)
          </span>
        </div>

        {/* Lista de Projetos */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
            <p className="text-xs text-slate-500 font-medium">Carregando projetos do Supabase...</p>
          </div>
        ) : filteredProjetos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjetos.map((projeto) => (
              <Card key={projeto.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
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
                    <CardTitle className="text-lg font-semibold leading-snug">{projeto.nome}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {projeto.descricao || 'Sem descrição cadastrada.'}
                    </p>
                  </CardContent>
                </div>

                <div className="px-6 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(projeto)}
                    className="text-xs gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
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
                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-12 text-center flex flex-col items-center justify-center gap-4">
            <div className="p-4 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Nenhum projeto encontrado</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Cadastre o primeiro projeto para vincular aos apontamentos técnicos.
              </p>
            </div>
            <Button variant="indigo" size="sm" onClick={() => setIsFormOpen(true)} className="text-xs gap-1.5">
              <Plus className="h-4 w-4" /> Cadastrar Primeiro Projeto
            </Button>
          </div>
        )}
      </div>

      {/* Modal de Cadastro de Projeto */}
      <Dialog open={isFormOpen} onOpenChange={(open) => !open && setIsFormOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="h-4 w-4" /> Novo Empreendimento
            </div>
            <DialogTitle className="text-xl">Cadastrar Projeto</DialogTitle>
            <DialogDescription>
              Adicione um novo projeto à base de dados para associar apontamentos.
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
                placeholder="Ex: Hospital Central - Bloco A"
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

            <div className="space-y-1.5">
              <Label htmlFor="descricao">Descrição (Opcional)</Label>
              <Textarea
                id="descricao"
                placeholder="Breve descrição do escopo do projeto ou obra..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
                className="rounded-xl"
              />
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" variant="indigo" disabled={isSubmitting}>
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
