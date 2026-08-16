"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Sparkles, CheckCircle2 } from 'lucide-react';
import { Apontamento, NovoApontamento, Projeto } from '@/types/apontamento';
import { supabase, isSupabaseConfigured, MOCK_APONTAMENTOS, MOCK_PROJETOS } from '@/lib/supabase/client';
import { SupabaseStatusBanner } from '@/components/apontamentos/SupabaseStatusBanner';
import { ApontamentosHeader } from '@/components/apontamentos/ApontamentosHeader';
import { ApontamentosFilters } from '@/components/apontamentos/ApontamentosFilters';
import { ApontamentoCard } from '@/components/apontamentos/ApontamentoCard';
import { ApontamentoFormModal } from '@/components/apontamentos/ApontamentoFormModal';
import { ApontamentoDetailModal } from '@/components/apontamentos/ApontamentoDetailModal';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const [apontamentos, setApontamentos] = useState<Apontamento[]>([]);
  const [projetosList, setProjetosList] = useState<Projeto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedApontamento, setSelectedApontamento] = useState<Apontamento | null>(null);

  // Mensagem Toast Interativa
  const [toastMessage, setToastMessage] = useState<string>('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  const [selectedPrioridade, setSelectedPrioridade] = useState('Todas');
  const [selectedDisciplina, setSelectedDisciplina] = useState('Todas');
  const [selectedTipoConflito, setSelectedTipoConflito] = useState('Todos');
  const [selectedProjeto, setSelectedProjeto] = useState('Todos');

  // Carregar Apontamentos e Projetos do Supabase ou Mock
  const fetchApontamentos = useCallback(async () => {
    setIsLoading(true);

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: projData } = await supabase
          .from('projetos')
          .select('*')
          .order('nome', { ascending: true });

        if (projData) {
          setProjetosList(projData as Projeto[]);
        } else {
          setProjetosList(MOCK_PROJETOS);
        }

        const { data, error } = await supabase
          .from('apontamentos')
          .select('*, projetos(nome)')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erro ao buscar apontamentos no Supabase:', error);
          setApontamentos(MOCK_APONTAMENTOS);
        } else if (data) {
          setApontamentos(data as Apontamento[]);
        }
      } catch (err) {
        console.error('Falha na comunicação com Supabase:', err);
        setApontamentos(MOCK_APONTAMENTOS);
        setProjetosList(MOCK_PROJETOS);
      }
    } else {
      setApontamentos(MOCK_APONTAMENTOS);
      setProjetosList(MOCK_PROJETOS);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchApontamentos();
  }, [fetchApontamentos]);

  // Handler: Inserir novo Apontamento
  const handleCreateApontamento = async (novoData: NovoApontamento) => {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('apontamentos')
        .insert([novoData])
        .select('*, projetos(nome)');

      if (error) {
        throw new Error(error.message);
      }

      if (data && data[0]) {
        setApontamentos((prev) => [data[0] as Apontamento, ...prev]);
        triggerToast('Apontamento registrado com sucesso no Supabase! ✨');
      }
    } else {
      const projEncontrado = projetosList.find((p) => p.id === novoData.projeto_id);
      const novoItem: Apontamento = {
        ...novoData,
        id: `mock-${Date.now()}`,
        created_at: new Date().toISOString(),
        projetos: projEncontrado ? { nome: projEncontrado.nome } : null,
      };
      setApontamentos((prev) => [novoItem, ...prev]);
      triggerToast('Apontamento registrado com sucesso! ✨');
    }
  };

  // Handler: Alterar Status
  const handleToggleStatus = async (apontamento: Apontamento) => {
    const novoStatus = apontamento.status === 'Aberto' ? 'Resolvido' : 'Aberto';

    setApontamentos((prev) =>
      prev.map((item) =>
        item.id === apontamento.id ? { ...item, status: novoStatus } : item
      )
    );

    triggerToast(`Status alterado para "${novoStatus}"!`);

    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('apontamentos')
        .update({ status: novoStatus })
        .eq('id', apontamento.id);

      if (error) {
        console.error('Erro ao atualizar status no Supabase:', error);
        fetchApontamentos();
      }
    }
  };

  // Handler: Atualizar Solução Proposta (Texto e Imagens)
  const handleUpdateSolucao = (
    id: string,
    solucaoTexto: string,
    urlImagemSolucao?: string | null,
    imagensSolucao?: string[] | null
  ) => {
    setApontamentos((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              solucao: solucaoTexto,
              url_imagem_solucao: urlImagemSolucao !== undefined ? urlImagemSolucao : item.url_imagem_solucao,
              imagens_solucao: imagensSolucao !== undefined ? imagensSolucao : item.imagens_solucao,
            }
          : item
      )
    );
    triggerToast('Solução proposta e galeria de fotos atualizadas! 💡');
  };

  // Handler: Excluir Apontamento
  const handleDeleteApontamento = async (id: string) => {
    setApontamentos((prev) => prev.filter((item) => item.id !== id));
    triggerToast('Apontamento removido.');

    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('apontamentos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir no Supabase:', error);
        fetchApontamentos();
      }
    }
  };

  // Filtragem dos itens exibidos
  const filteredApontamentos = apontamentos.filter((item) => {
    const matchesSearch =
      item.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.descricao.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatus === 'Todos' || item.status === selectedStatus;

    const matchesPrioridade =
      selectedPrioridade === 'Todas' || item.prioridade === selectedPrioridade;

    const matchesDisciplina =
      selectedDisciplina === 'Todas' ||
      item.disciplina_origem === selectedDisciplina ||
      item.disciplina_destino === selectedDisciplina;

    const matchesTipoConflito =
      selectedTipoConflito === 'Todos' || item.tipo_conflito === selectedTipoConflito;

    const matchesProjeto =
      selectedProjeto === 'Todos' || item.projeto_id === selectedProjeto;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesPrioridade &&
      matchesDisciplina &&
      matchesTipoConflito &&
      matchesProjeto
    );
  });

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedStatus('Todos');
    setSelectedPrioridade('Todas');
    setSelectedDisciplina('Todas');
    setSelectedTipoConflito('Todos');
    setSelectedProjeto('Todos');
  };

  return (
    <main className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in-0 slide-in-from-bottom-4 duration-300 border border-slate-700/50">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Banner de Conexão Supabase */}
        <SupabaseStatusBanner />

        {/* Cabeçalho da Aplicação e Métricas */}
        <ApontamentosHeader
          apontamentos={apontamentos}
          onOpenNewModal={() => setIsFormOpen(true)}
          onFilterStatus={(status) => setSelectedStatus(status)}
          onFilterPrioridade={(prio) => setSelectedPrioridade(prio)}
        />

        {/* Filtros e Barra de Pesquisa */}
        <ApontamentosFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedPrioridade={selectedPrioridade}
          onPrioridadeChange={setSelectedPrioridade}
          selectedDisciplina={selectedDisciplina}
          onDisciplinaChange={setSelectedDisciplina}
          selectedTipoConflito={selectedTipoConflito}
          onTipoConflitoChange={setSelectedTipoConflito}
          selectedProjeto={selectedProjeto}
          onProjetoChange={setSelectedProjeto}
          projetosList={projetosList}
          onResetFilters={resetFilters}
        />

        {/* Lista de Apontamentos */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
            <p className="text-xs text-slate-500 font-medium">Carregando apontamentos...</p>
          </div>
        ) : filteredApontamentos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApontamentos.map((item) => (
              <ApontamentoCard
                key={item.id}
                apontamento={item}
                onView={(apontamento) => setSelectedApontamento(apontamento)}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDeleteApontamento}
              />
            ))}
          </div>
        ) : (
          /* Estado Vazio */
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-12 text-center flex flex-col items-center justify-center gap-4">
            <div className="p-4 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Nenhum apontamento encontrado
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mt-1">
                {apontamentos.length === 0
                  ? 'Nenhum registro cadastrado ainda. Clique no botão abaixo para adicionar o primeiro apontamento.'
                  : 'Nenhum resultado corresponde aos filtros selecionados. Tente ajustar a busca ou limpar os filtros.'}
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              {apontamentos.length > 0 && (
                <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs">
                  Limpar Filtros
                </Button>
              )}
              <Button variant="indigo" size="sm" onClick={() => setIsFormOpen(true)} className="text-xs gap-1.5">
                <Plus className="h-4 w-4" /> Cadastrar Apontamento
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Formulário de Cadastro */}
      <ApontamentoFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateApontamento}
      />

      {/* Modal de Detalhes do Apontamento */}
      <ApontamentoDetailModal
        apontamento={selectedApontamento}
        isOpen={Boolean(selectedApontamento)}
        onClose={() => setSelectedApontamento(null)}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDeleteApontamento}
        onUpdateSolucao={handleUpdateSolucao}
      />
    </main>
  );
}
