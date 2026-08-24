"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { SortCriteria, sortApontamentos } from '@/lib/sorting';
import { matchesDateRange } from '@/lib/utils';

export default function HomePage() {
  const [apontamentos, setApontamentos] = useState<Apontamento[]>([]);
  const [projetosList, setProjetosList] = useState<Projeto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingApontamento, setEditingApontamento] = useState<Apontamento | null>(null);
  const [selectedApontamento, setSelectedApontamento] = useState<Apontamento | null>(null);

  // Mensagem Toast Interativa
  const [toastMessage, setToastMessage] = useState<string>('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Filtros com suporte a multi-seleção, período de datas e ordenação
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedPrioridades, setSelectedPrioridades] = useState<string[]>([]);
  const [selectedDisciplinas, setSelectedDisciplinas] = useState<string[]>([]);
  const [selectedTiposConflito, setSelectedTiposConflito] = useState<string[]>([]);
  const [selectedProjetos, setSelectedProjetos] = useState<string[]>([]);
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>('data_desc');

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

  // Handler: Abertura do Modal de Criação ou Edição
  const handleOpenNewModal = () => {
    setEditingApontamento(null);
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (apontamento: Apontamento) => {
    setEditingApontamento(apontamento);
    setIsFormOpen(true);
  };

  // Handler: Inserir novo Apontamento
  const handleCreateApontamento = async (novoData: NovoApontamento) => {
    if (isSupabaseConfigured() && supabase) {
      let result = await supabase
        .from('apontamentos')
        .insert([novoData])
        .select('*, projetos(nome)');

      let usedFallback = false;

      // Se falhar por divergência de schema (ex: coluna pavimento ou localizacao ainda não criada no Supabase)
      if (
        result.error &&
        (result.error.message.includes('column') ||
          result.error.message.includes('schema cache') ||
          result.error.code === 'PGRST204' ||
          result.error.code === '42703')
      ) {
        console.warn('Tentativa com payload simplificado devido a colunas pendentes no banco Supabase:', result.error);
        const { pavimento, localizacao, ...fallbackData } = novoData;
        result = await supabase
          .from('apontamentos')
          .insert([fallbackData])
          .select('*, projetos(nome)');
        usedFallback = true;
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (result.data && result.data[0]) {
        const createdItem = {
          ...result.data[0],
          pavimento: result.data[0].pavimento ?? novoData.pavimento,
          localizacao: result.data[0].localizacao ?? novoData.localizacao,
        } as Apontamento;

        setApontamentos((prev) => [createdItem, ...prev]);
        if (usedFallback) {
          triggerToast('Apontamento salvo! Execute o script schema.sql no Supabase para habilitar Pavimento e Localização.');
        } else {
          triggerToast('Apontamento registrado com sucesso no Supabase! ✨');
        }
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

  // Handler: Atualizar Apontamento existente
  const handleUpdateApontamento = async (id: string, updatedData: NovoApontamento) => {
    if (isSupabaseConfigured() && supabase) {
      let result = await supabase
        .from('apontamentos')
        .update(updatedData)
        .eq('id', id)
        .select('*, projetos(nome)');

      let usedFallback = false;

      // Fallback caso colunas não existam no Supabase
      if (
        result.error &&
        (result.error.message.includes('column') ||
          result.error.message.includes('schema cache') ||
          result.error.code === 'PGRST204' ||
          result.error.code === '42703')
      ) {
        console.warn('Tentativa de update com payload simplificado:', result.error);
        const { pavimento, localizacao, ...fallbackData } = updatedData;
        result = await supabase
          .from('apontamentos')
          .update(fallbackData)
          .eq('id', id)
          .select('*, projetos(nome)');
        usedFallback = true;
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (result.data && result.data[0]) {
        const updatedItem = {
          ...result.data[0],
          pavimento: result.data[0].pavimento ?? updatedData.pavimento,
          localizacao: result.data[0].localizacao ?? updatedData.localizacao,
        } as Apontamento;

        setApontamentos((prev) =>
          prev.map((item) => (item.id === id ? updatedItem : item))
        );
        if (selectedApontamento?.id === id) {
          setSelectedApontamento(updatedItem);
        }
        if (usedFallback) {
          triggerToast('Apontamento atualizado! Execute o schema.sql no Supabase para persistir Pavimento e Localização.');
        } else {
          triggerToast('Apontamento atualizado com sucesso no Supabase! ✏️');
        }
      }
    } else {
      const projEncontrado = projetosList.find((p) => p.id === updatedData.projeto_id);
      const existing = apontamentos.find((a) => a.id === id);
      const updatedItem: Apontamento = {
        ...updatedData,
        id,
        created_at: existing ? existing.created_at : new Date().toISOString(),
        projetos: projEncontrado ? { nome: projEncontrado.nome } : null,
      };
      setApontamentos((prev) =>
        prev.map((item) => (item.id === id ? updatedItem : item))
      );
      if (selectedApontamento?.id === id) {
        setSelectedApontamento(updatedItem);
      }
      triggerToast('Apontamento atualizado com sucesso! ✏️');
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

  // Filtragem dinâmica e reativa dos itens exibidos com suporte a multi-seleção e ordenação
  const filteredApontamentos = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const filtered = apontamentos.filter((item) => {
      // 1. Busca textual resiliente (título, descrição, projeto, disciplinas ou tipo de conflito)
      const matchesSearch =
        !term ||
        (Boolean(item.titulo) && item.titulo.toLowerCase().includes(term)) ||
        (Boolean(item.descricao) && item.descricao.toLowerCase().includes(term)) ||
        (Boolean(item.projetos?.nome) && item.projetos!.nome.toLowerCase().includes(term)) ||
        (Boolean(item.disciplina_origem) && item.disciplina_origem.toLowerCase().includes(term)) ||
        (Boolean(item.disciplina_destino) && item.disciplina_destino.toLowerCase().includes(term)) ||
        (Boolean(item.tipo_conflito) && item.tipo_conflito!.toLowerCase().includes(term));

      // 2. Filtro de Status (multi-seleção)
      const matchesStatus =
        selectedStatus.length === 0 || selectedStatus.includes(item.status);

      // 3. Filtro de Prioridade (multi-seleção)
      const matchesPrioridade =
        selectedPrioridades.length === 0 || selectedPrioridades.includes(item.prioridade);

      // 4. Filtro de Disciplina (multi-seleção para origem ou destino)
      const matchesDisciplina =
        selectedDisciplinas.length === 0 ||
        selectedDisciplinas.includes(item.disciplina_origem) ||
        selectedDisciplinas.includes(item.disciplina_destino);

      // 5. Filtro de Tipo de Conflito (multi-seleção)
      const itemTipo = item.tipo_conflito || 'Conflito Físico';
      const matchesTipoConflito =
        selectedTiposConflito.length === 0 || selectedTiposConflito.includes(itemTipo);

      // 6. Filtro de Projeto (multi-seleção)
      const matchesProjeto =
        selectedProjetos.length === 0 ||
        (Boolean(item.projeto_id) && selectedProjetos.includes(item.projeto_id!));

      // 7. Filtro de Período / Data de Criação
      const matchesData = matchesDateRange(item.created_at, dataInicio, dataFim);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPrioridade &&
        matchesDisciplina &&
        matchesTipoConflito &&
        matchesProjeto &&
        matchesData
      );
    });

    return sortApontamentos(filtered, sortCriteria);
  }, [
    apontamentos,
    searchTerm,
    selectedStatus,
    selectedPrioridades,
    selectedDisciplinas,
    selectedTiposConflito,
    selectedProjetos,
    dataInicio,
    dataFim,
    sortCriteria,
  ]);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedStatus([]);
    setSelectedPrioridades([]);
    setSelectedDisciplinas([]);
    setSelectedTiposConflito([]);
    setSelectedProjetos([]);
    setDataInicio('');
    setDataFim('');
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#041A24] text-[#072B3B] dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#072B3B] text-white dark:bg-white dark:text-[#072B3B] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in-0 slide-in-from-bottom-4 duration-300 border border-[#00A3C4]/30 shadow-[#00A3C4]/20">
          <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Banner de Conexão Supabase */}
        <SupabaseStatusBanner />

        {/* Cabeçalho da Aplicação e Métricas Dinâmicas com Nome do Projeto */}
        <ApontamentosHeader
          apontamentos={filteredApontamentos}
          totalRawCount={apontamentos.length}
          selectedStatus={selectedStatus.length === 1 ? selectedStatus[0] : selectedStatus.length > 1 ? 'Multi' : 'Todos'}
          selectedPrioridade={selectedPrioridades.length === 1 ? selectedPrioridades[0] : selectedPrioridades.length > 1 ? 'Multi' : 'Todas'}
          selectedProjetos={selectedProjetos}
          projetosList={projetosList}
          onOpenNewModal={handleOpenNewModal}
          onFilterStatus={(status) => setSelectedStatus(status === 'Todos' ? [] : [status])}
          onFilterPrioridade={(prio) => setSelectedPrioridades(prio === 'Todas' ? [] : [prio])}
        />

        {/* Filtros com Suporte a Múltiplas Seleções Simultâneas, Data e Ordenação */}
        <ApontamentosFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedPrioridades={selectedPrioridades}
          onPrioridadesChange={setSelectedPrioridades}
          selectedDisciplinas={selectedDisciplinas}
          onDisciplinasChange={setSelectedDisciplinas}
          selectedTiposConflito={selectedTiposConflito}
          onTiposConflitoChange={setSelectedTiposConflito}
          selectedProjetos={selectedProjetos}
          onProjetosChange={setSelectedProjetos}
          dataInicio={dataInicio}
          dataFim={dataFim}
          onDateRangeChange={(inicio, fim) => {
            setDataInicio(inicio);
            setDataFim(fim);
          }}
          projetosList={projetosList}
          onResetFilters={resetFilters}
          sortCriteria={sortCriteria}
          onSortCriteriaChange={setSortCriteria}
        />

        {/* Lista de Apontamentos em Grade de 2 Colunas */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#00A3C4]" />
            <p className="text-xs text-slate-500 font-medium">Carregando apontamentos...</p>
          </div>
        ) : filteredApontamentos.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredApontamentos.map((item) => (
              <ApontamentoCard
                key={item.id}
                apontamento={item}
                onView={(apontamento) => setSelectedApontamento(apontamento)}
                onEdit={handleOpenEditModal}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDeleteApontamento}
              />
            ))}
          </div>
        ) : (
          /* Estado Vazio */
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-[#0B384D] bg-white/50 dark:bg-[#072B3B]/40 p-12 text-center flex flex-col items-center justify-center gap-4">
            <div className="p-4 rounded-full bg-cyan-50 dark:bg-[#00A3C4]/20 text-[#00A3C4]">
              <Sparkles className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#072B3B] dark:text-white">
                Nenhum apontamento encontrado
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mt-1">
                {apontamentos.length === 0
                  ? 'Nenhum registro cadastrado ainda. Clique no botão abaixo para adicionar o primeiro apontamento.'
                  : 'Nenhum resultado corresponde aos filtros selecionados. Tente ajustar a busca ou limpar os filtros.'}
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              {apontamentos.length > 0 && (
                <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs font-semibold">
                  Limpar Filtros
                </Button>
              )}
              <Button variant="wcc" size="sm" onClick={handleOpenNewModal} className="text-xs gap-1.5 font-bold cursor-pointer">
                <Plus className="h-4 w-4" /> Cadastrar Apontamento
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Formulário de Cadastro e Edição */}
      <ApontamentoFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingApontamento(null);
        }}
        onSubmit={handleCreateApontamento}
        apontamentoToEdit={editingApontamento}
        onUpdate={handleUpdateApontamento}
      />

      {/* Modal de Detalhes do Apontamento */}
      <ApontamentoDetailModal
        apontamento={selectedApontamento}
        isOpen={Boolean(selectedApontamento)}
        onClose={() => setSelectedApontamento(null)}
        onEdit={handleOpenEditModal}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDeleteApontamento}
        onUpdateSolucao={handleUpdateSolucao}
      />
    </main>
  );
}
