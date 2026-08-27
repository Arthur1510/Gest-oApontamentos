"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ConflitoArcis,
  NovoConflitoArcis,
  StatusConflitoArcis,
  STATUS_ARCIS_OPCOES,
  TIPOS_CONFLITO_ARCIS_OPCOES,
  RelatorioArcisMetadata,
} from '@/types/arcis';
import { Projeto } from '@/types/apontamento';
import {
  supabase,
  isSupabaseConfigured,
  MOCK_PROJETOS,
  MOCK_CONFLITOS_ARCIS,
} from '@/lib/supabase/client';
import { SupabaseStatusBanner } from '@/components/apontamentos/SupabaseStatusBanner';
import { MultiSelectFilter } from '@/components/ui/multi-select-filter';
import { parseDateToISO } from '@/lib/arcis-parser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArcisConflictCard } from '@/components/arcis/ArcisConflictCard';
import { ArcisConflictDetailModal } from '@/components/arcis/ArcisConflictDetailModal';
import { ArcisConflictFormModal } from '@/components/arcis/ArcisConflictFormModal';
import { ArcisImportModal } from '@/components/arcis/ArcisImportModal';
import { ArcisDashboardCharts } from '@/components/arcis/ArcisDashboardCharts';
import {
  ShieldAlert,
  UploadCloud,
  Plus,
  RefreshCw,
  Search,
  Layers,
  LayoutDashboard,
  ListFilter,
  Loader2,
  Building,
  CheckCircle2,
  Clock,
  Sparkles,
  Filter,
  FileSpreadsheet,
  FolderKanban,
  X,
} from 'lucide-react';

export default function ArcisPage() {
  const [conflitos, setConflitos] = useState<ConflitoArcis[]>([]);
  const [projetosList, setProjetosList] = useState<Projeto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tabs: 'dashboard' | 'lista' | 'importar'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'lista' | 'importar'>('dashboard');

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjetos, setSelectedProjetos] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedTipos, setSelectedTipos] = useState<string[]>([]);
  const [selectedDisciplinas, setSelectedDisciplinas] = useState<string[]>([]);

  // Modais
  const [selectedConflitoDetail, setSelectedConflitoDetail] = useState<ConflitoArcis | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [conflitoParaEditar, setConflitoParaEditar] = useState<ConflitoArcis | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Carregar Dados (Supabase ou Mock)
  const fetchData = useCallback(async () => {
    setIsLoading(true);

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: projData } = await supabase
          .from('projetos')
          .select('*')
          .order('nome', { ascending: true });

        const resolvedProjetos = projData ? (projData as Projeto[]) : MOCK_PROJETOS;
        setProjetosList(resolvedProjetos);

        const { data, error } = await supabase
          .from('apontamentos_arcis')
          .select('*, projetos(nome)')
          .order('codigo_conflito', { ascending: true });

        if (error) {
          console.warn('Tabela apontamentos_arcis não encontrada ou vazia no Supabase. Utilizando mock de ALTAMIRA 47:', error.message);
          setConflitos(MOCK_CONFLITOS_ARCIS);
        } else if (data && data.length > 0) {
          const enriched = (data as ConflitoArcis[]).map((c) => {
            if (!c.projetos?.nome && c.projeto_id) {
              const foundProj = resolvedProjetos.find((p) => p.id === c.projeto_id);
              if (foundProj) {
                return { ...c, projetos: { nome: foundProj.nome } };
              }
            }
            return c;
          });
          setConflitos(enriched);
        } else {
          setConflitos(MOCK_CONFLITOS_ARCIS);
        }
      } catch (err) {
        console.error('Erro de comunicação:', err);
        setConflitos(MOCK_CONFLITOS_ARCIS);
        setProjetosList(MOCK_PROJETOS);
      }
    } else {
      setConflitos(MOCK_CONFLITOS_ARCIS);
      setProjetosList(MOCK_PROJETOS);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Lista de Disciplinas Únicas detectadas nos conflitos
  const disciplinasOpcoes = useMemo(() => {
    const set = new Set<string>();
    conflitos.forEach((c) => {
      if (c.disciplina_principal) set.add(c.disciplina_principal);
      if (c.disciplinas_envolvidas) {
        c.disciplinas_envolvidas.forEach((d) => set.add(d));
      }
    });
    return Array.from(set).map((d) => ({ value: d, label: d }));
  }, [conflitos]);

  // Filtros aplicados
  const filteredConflitos = useMemo(() => {
    return conflitos.filter((item) => {
      const matchesSearch =
        !searchQuery.trim() ||
        item.descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.disciplina_principal.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.localizacao && item.localizacao.toLowerCase().includes(searchQuery.toLowerCase())) ||
        String(item.codigo_conflito).includes(searchQuery);

      const matchesProjeto =
        selectedProjetos.length === 0 ||
        (Boolean(item.projeto_id) && selectedProjetos.includes(item.projeto_id!));

      const matchesStatus =
        selectedStatus.length === 0 || selectedStatus.includes(item.status_arcis);

      const matchesTipo =
        selectedTipos.length === 0 || selectedTipos.includes(item.tipo_conflito);

      const matchesDisciplina =
        selectedDisciplinas.length === 0 ||
        selectedDisciplinas.includes(item.disciplina_principal) ||
        (item.disciplinas_envolvidas &&
          item.disciplinas_envolvidas.some((d) => selectedDisciplinas.includes(d)));

      return matchesSearch && matchesProjeto && matchesStatus && matchesTipo && matchesDisciplina;
    });
  }, [conflitos, searchQuery, selectedProjetos, selectedStatus, selectedTipos, selectedDisciplinas]);

  // Título e Subtítulo dinâmicos do projeto (Segmentação por Empreendimento)
  const textoProjetoDinamico = useMemo(() => {
    if (selectedProjetos.length === 0) return 'Todos os Projetos';
    if (selectedProjetos.length === 1) {
      const proj = projetosList.find((p) => p.id === selectedProjetos[0]);
      return proj ? proj.nome : 'Empreendimento Selecionado';
    }
    const nomes = projetosList
      .filter((p) => selectedProjetos.includes(p.id))
      .map((p) => p.nome);
    return nomes.length <= 2 ? nomes.join(' • ') : `${nomes.length} Projetos Selecionados`;
  }, [selectedProjetos, projetosList]);

  const subtituloProjeto = useMemo(() => {
    if (selectedProjetos.length === 0) {
      return 'Compatibilização Externa & Conflitos Normativos • Todos os Empreendimentos';
    }
    return `Compatibilização Externa & Conflitos Normativos • ${textoProjetoDinamico}`;
  }, [selectedProjetos, textoProjetoDinamico]);

  // KPIs
  const totalConflitos = filteredConflitos.length;
  const totalRawCount = conflitos.length;
  const aguardandoSolucao = filteredConflitos.filter((c) => c.status_arcis === 'Aguardando Solução').length;
  const emAndamento = filteredConflitos.filter(
    (c) =>
      c.status_arcis.includes('Proposta') ||
      c.status_arcis === 'Solução Aguardando Aprovação' ||
      c.status_arcis === 'Solução Aprovada'
  ).length;
  const conflitosNormativos = filteredConflitos.filter((c) =>
    c.tipo_conflito.toLowerCase().includes('normativ')
  ).length;

  // Handler rápido para filtrar pelos cards de KPI
  const handleFilterStatusKpi = (group: 'all' | 'aguardando' | 'em_andamento' | 'normativos') => {
    if (group === 'all') {
      setSelectedStatus([]);
      setSelectedTipos([]);
    } else if (group === 'aguardando') {
      if (selectedStatus.length === 1 && selectedStatus[0] === 'Aguardando Solução') {
        setSelectedStatus([]);
      } else {
        setSelectedStatus(['Aguardando Solução']);
      }
    } else if (group === 'em_andamento') {
      const isCurrentlyActive = selectedStatus.some((s) => s.includes('Proposta') || s.includes('Aprova'));
      if (isCurrentlyActive) {
        setSelectedStatus([]);
      } else {
        setSelectedStatus([
          'Solução Proposta por Portobello',
          'Solução Proposta por Projetista',
          'Solução Proposta por Cliente',
          'Solução Aguardando Aprovação',
          'Solução Aprovada',
        ]);
      }
    } else if (group === 'normativos') {
      if (selectedTipos.includes('Conflito Normativo')) {
        setSelectedTipos([]);
      } else {
        setSelectedTipos(['Conflito Normativo']);
      }
    }
  };

  const isTotalKpiActive = selectedStatus.length === 0 && selectedTipos.length === 0;
  const isAguardandoKpiActive = selectedStatus.length === 1 && selectedStatus[0] === 'Aguardando Solução';
  const isEmAndamentoKpiActive = selectedStatus.some((s) => s.includes('Proposta') || s.includes('Aprova'));
  const isNormativosKpiActive = selectedTipos.includes('Conflito Normativo');

  // Handlers
  const handleOpenDetail = (conflito: ConflitoArcis) => {
    setSelectedConflitoDetail(conflito);
    setIsDetailModalOpen(true);
  };

  const handleOpenNew = () => {
    setConflitoParaEditar(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (conflito: ConflitoArcis) => {
    setConflitoParaEditar(conflito);
    setIsFormModalOpen(true);
  };

  const handleSaveConflito = async (payload: NovoConflitoArcis, id?: string) => {
    const payloadToSave: NovoConflitoArcis = {
      ...payload,
      projeto_id: payload.projeto_id && payload.projeto_id.trim() !== '' ? payload.projeto_id.trim() : null,
      data_criacao_arcis: parseDateToISO(payload.data_criacao_arcis),
      data_ultima_alteracao: parseDateToISO(payload.data_ultima_alteracao) || new Date().toISOString().slice(0, 10),
    };

    if (isSupabaseConfigured() && supabase) {
      try {
        if (id) {
          const { data, error } = await supabase
            .from('apontamentos_arcis')
            .update(payloadToSave)
            .eq('id', id)
            .select('*, projetos(nome)')
            .single();

          if (!error && data) {
            const enriched = {
              ...(data as ConflitoArcis),
              projetos: (data as ConflitoArcis).projetos || (payloadToSave.projeto_id ? { nome: projetosList.find((p) => p.id === payloadToSave.projeto_id)?.nome || '' } : null),
            };
            setConflitos((prev) => prev.map((c) => (c.id === id ? enriched : c)));
            return;
          }
        } else {
          const { data, error } = await supabase
            .from('apontamentos_arcis')
            .insert([payloadToSave])
            .select('*, projetos(nome)')
            .single();

          if (!error && data) {
            const enriched = {
              ...(data as ConflitoArcis),
              projetos: (data as ConflitoArcis).projetos || (payloadToSave.projeto_id ? { nome: projetosList.find((p) => p.id === payloadToSave.projeto_id)?.nome || '' } : null),
            };
            setConflitos((prev) => [...prev, enriched]);
            return;
          }
        }
      } catch (err) {
        console.error('Falha no Supabase, salvando localmente:', err);
      }
    }

    // Fallback local
    if (id) {
      setConflitos((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                ...payloadToSave,
                projetos: payloadToSave.projeto_id
                  ? { nome: projetosList.find((p) => p.id === payloadToSave.projeto_id)?.nome || '' }
                  : null,
              }
            : c
        )
      );
    } else {
      const novo: ConflitoArcis = {
        ...payloadToSave,
        id: `arcis-local-${Date.now()}`,
        created_at: new Date().toISOString(),
        projetos: payloadToSave.projeto_id
          ? { nome: projetosList.find((p) => p.id === payloadToSave.projeto_id)?.nome || '' }
          : null,
      };
      setConflitos((prev) => [...prev, novo]);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: StatusConflitoArcis, solucao?: string) => {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase
          .from('apontamentos_arcis')
          .update({
            status_arcis: newStatus,
            solucao: solucao || null,
            data_ultima_alteracao: new Date().toISOString().slice(0, 10),
          })
          .eq('id', id);
      } catch (err) {
        console.error('Erro ao atualizar no Supabase:', err);
      }
    }

    setConflitos((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status_arcis: newStatus,
              solucao: solucao !== undefined ? solucao : c.solucao,
              data_ultima_alteracao: new Date().toISOString().slice(0, 10),
            }
          : c
      )
    );
  };

  const handleDelete = async (id: string) => {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('apontamentos_arcis').delete().eq('id', id);
      } catch (err) {
        console.error('Erro ao excluir no Supabase:', err);
      }
    }
    setConflitos((prev) => prev.filter((c) => c.id !== id));
  };

  const handleImportSuccess = async (importedConflicts: ConflitoArcis[], metadata: RelatorioArcisMetadata) => {
    if (isSupabaseConfigured() && supabase) {
      try {
        const rowsToUpsert = importedConflicts.map((c) => ({
          projeto_id: c.projeto_id && c.projeto_id.trim() !== '' ? c.projeto_id.trim() : null,
          codigo_conflito: c.codigo_conflito,
          status_arcis: c.status_arcis,
          prioridade: c.prioridade,
          tipo_conflito: c.tipo_conflito,
          disciplina_principal: c.disciplina_principal,
          disciplinas_envolvidas: c.disciplinas_envolvidas || [],
          edificacao: c.edificacao || 'TORRE',
          pavimentos: c.pavimentos || [],
          local_edificacao: c.local_edificacao || null,
          localizacao: c.localizacao || null,
          descricao: c.descricao,
          solucao: c.solucao || null,
          data_criacao_arcis: parseDateToISO(c.data_criacao_arcis),
          data_ultima_alteracao: parseDateToISO(c.data_ultima_alteracao) || parseDateToISO(c.data_criacao_arcis) || new Date().toISOString().slice(0, 10),
          numero_relatorio: c.numero_relatorio || 'RSC_ARCIS',
        }));

        // 1. Tentar upsert nativo com base na chave (projeto_id, codigo_conflito)
        const { data, error } = await supabase
          .from('apontamentos_arcis')
          .upsert(rowsToUpsert, { onConflict: 'projeto_id,codigo_conflito' })
          .select('*, projetos(nome)');

        if (!error && data) {
          const enrichedBatch = (data as ConflitoArcis[]).map((row) => ({
            ...row,
            projetos: row.projetos || (row.projeto_id ? { nome: projetosList.find((p) => p.id === row.projeto_id)?.nome || '' } : null),
          }));

          // Atualizar o estado local substituindo registros existentes e adicionando novos (sem duplicar)
          setConflitos((prev) => {
            const map = new Map<string, ConflitoArcis>();
            prev.forEach((c) => {
              const key = `${c.projeto_id || 'null'}-${c.codigo_conflito}`;
              map.set(key, c);
            });
            enrichedBatch.forEach((c) => {
              const key = `${c.projeto_id || 'null'}-${c.codigo_conflito}`;
              const existing = map.get(key);
              map.set(key, {
                ...c,
                id: c.id || existing?.id || `arcis-c-${c.codigo_conflito}`,
                url_imagem: existing?.url_imagem || c.url_imagem,
                imagens: existing?.imagens && existing.imagens.length > 0 ? existing.imagens : c.imagens,
              });
            });
            return Array.from(map.values()).sort((a, b) => a.codigo_conflito - b.codigo_conflito);
          });

          setActiveTab('dashboard');
          return;
        } else if (error) {
          console.warn('Upsert direto via constraint falhou, aplicando reconciliação granular:', error.message, error.details);
          
          // Reconciliação seletiva: verifica um a um para atualizar ou inserir
          for (const row of rowsToUpsert) {
            let query = supabase.from('apontamentos_arcis').select('id').eq('codigo_conflito', row.codigo_conflito);
            if (row.projeto_id) {
              query = query.eq('projeto_id', row.projeto_id);
            } else {
              query = query.is('projeto_id', null);
            }
            const { data: existingRows } = await query;
            if (existingRows && existingRows.length > 0) {
              const { error: updErr } = await supabase
                .from('apontamentos_arcis')
                .update(row)
                .eq('id', existingRows[0].id);
              if (updErr) {
                console.error(`Erro ao atualizar conflito #${row.codigo_conflito}:`, updErr);
                throw updErr;
              }
            } else {
              const { error: insErr } = await supabase.from('apontamentos_arcis').insert([row]);
              if (insErr) {
                console.error(`Erro ao inserir conflito #${row.codigo_conflito}:`, insErr);
                throw insErr;
              }
            }
          }

          await fetchData();
          setActiveTab('dashboard');
          return;
        }
      } catch (err) {
        console.error('Erro na sincronização de conflitos com Supabase:', err);
        throw err;
      }
    }

    // Fallback de reconciliação em memória (mock/offline)
    setConflitos((prev) => {
      const map = new Map<string, ConflitoArcis>();
      prev.forEach((c) => {
        const key = `${c.projeto_id || 'null'}-${c.codigo_conflito}`;
        map.set(key, c);
      });
      importedConflicts.forEach((c) => {
        const key = `${c.projeto_id || 'null'}-${c.codigo_conflito}`;
        const existing = map.get(key);
        map.set(key, {
          ...c,
          id: existing ? existing.id : c.id,
          url_imagem: existing?.url_imagem || c.url_imagem,
          imagens: existing?.imagens && existing.imagens.length > 0 ? existing.imagens : c.imagens,
        });
      });
      return Array.from(map.values()).sort((a, b) => a.codigo_conflito - b.codigo_conflito);
    });

    setActiveTab('dashboard');
  };

  const proximoCodigo =
    conflitos.length > 0 ? Math.max(...conflitos.map((c) => c.codigo_conflito)) + 1 : 1;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#041A24] text-[#072B3B] dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Banner de Status Supabase */}
        <SupabaseStatusBanner />

        {/* Cabeçalho Principal do Módulo ARCIS Dinâmico por Projeto */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-[#0B384D]">
          <div>
            <div className="flex items-center gap-2 text-[#00A3C4] dark:text-[#00C4EB] font-black text-xs uppercase tracking-widest">
              <ShieldAlert className="h-4 w-4" /> Módulo Anexo • Grupo ARCIS (RSC) • WCC Participações
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#072B3B] dark:text-white mt-1">
              {textoProjetoDinamico}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {subtituloProjeto}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImportModalOpen(true)}
              className="text-xs font-bold gap-1.5 border-[#00A3C4]/40 hover:bg-[#00A3C4]/10 text-[#008EA9] dark:text-[#00C4EB] cursor-pointer"
            >
              <UploadCloud className="h-4 w-4 text-[#00A3C4]" /> Importar PDF RSC
            </Button>

            <Button
              variant="wcc-gradient"
              size="sm"
              onClick={handleOpenNew}
              className="text-xs font-bold gap-1.5 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Novo Conflito ARCIS
            </Button>
          </div>
        </div>

        {/* BARRA DE SEGMENTAÇÃO DIRETA POR EMPREENDIMENTO (Pills / Seletor Rápido) */}
        <div className="bg-white dark:bg-[#072B3B]/90 border border-slate-200/80 dark:border-[#0B384D] rounded-2xl p-3 sm:p-4 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FolderKanban className="h-3.5 w-3.5 text-[#00A3C4]" /> Segmentação por Empreendimento ({projetosList.length} Projetos Cadastrados)
            </span>
            {selectedProjetos.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedProjetos([])}
                className="text-[11px] font-bold text-[#00A3C4] hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Mostrar Todos</span>
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {/* Pílula Geral: Todos os Projetos */}
            <button
              type="button"
              onClick={() => setSelectedProjetos([])}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                selectedProjetos.length === 0
                  ? 'bg-[#00A3C4] text-white shadow-md ring-2 ring-[#00A3C4]/30'
                  : 'bg-slate-100 dark:bg-[#0B384D] text-slate-700 dark:text-slate-300 hover:bg-[#00A3C4]/15 hover:text-[#008EA9] dark:hover:text-[#00C4EB]'
              }`}
            >
              <FolderKanban className="h-3.5 w-3.5 shrink-0" />
              <span>Todos os Projetos</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10.5px] font-black ${
                  selectedProjetos.length === 0
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {conflitos.length}
              </span>
            </button>

            {/* Pílula Individual para cada projeto cadastrado no Supabase */}
            {projetosList.map((projeto) => {
              const isSelected = selectedProjetos.includes(projeto.id);
              const countForProj = conflitos.filter((c) => c.projeto_id === projeto.id).length;

              return (
                <button
                  key={`proj-pill-${projeto.id}`}
                  type="button"
                  onClick={() => {
                    if (isSelected && selectedProjetos.length === 1) {
                      setSelectedProjetos([]);
                    } else {
                      setSelectedProjetos([projeto.id]);
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-[#00A3C4] text-white shadow-md ring-2 ring-[#00A3C4]/30'
                      : 'bg-slate-100 dark:bg-[#0B384D] text-slate-700 dark:text-slate-300 hover:bg-[#00A3C4]/15 hover:text-[#008EA9] dark:hover:text-[#00C4EB]'
                  }`}
                >
                  <Building className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate max-w-[200px]">{projeto.nome}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10.5px] font-black ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {countForProj}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cards de KPIs Principais (Interativos e Clicáveis com Filtro Rápido) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Conflitos */}
          <div
            onClick={() => handleFilterStatusKpi('all')}
            className={`rounded-2xl border p-5 shadow-2xs cursor-pointer transition-all duration-200 ${
              isTotalKpiActive
                ? 'border-[#00A3C4] bg-white dark:bg-[#072B3B] ring-2 ring-[#00A3C4]/30 scale-[1.01]'
                : 'border-slate-200/80 bg-white dark:border-[#0B384D] dark:bg-[#072B3B] hover:border-[#00A3C4]/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Conflitos ARCIS
              </span>
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-[#0B384D] text-[#00A3C4]">
                <Layers className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#072B3B] dark:text-white">{totalConflitos}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {totalRawCount !== totalConflitos ? `de ${totalRawCount} total` : 'fichas registradas'}
              </span>
            </div>
          </div>

          {/* Aguardando Solução */}
          <div
            onClick={() => handleFilterStatusKpi('aguardando')}
            className={`rounded-2xl border p-5 shadow-2xs cursor-pointer transition-all duration-200 ${
              isAguardandoKpiActive
                ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 ring-2 ring-amber-500/40 scale-[1.01]'
                : 'border-amber-500/20 bg-amber-50/40 dark:border-amber-900/30 dark:bg-amber-950/20 hover:border-amber-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                Aguardando Solução
              </span>
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-900 dark:text-amber-200">{aguardandoSolucao}</span>
              <span className="text-xs text-amber-700/70 dark:text-amber-400/70">pendências abertas</span>
            </div>
          </div>

          {/* Soluções Propostas / Em Análise */}
          <div
            onClick={() => handleFilterStatusKpi('em_andamento')}
            className={`rounded-2xl border p-5 shadow-2xs cursor-pointer transition-all duration-200 ${
              isEmAndamentoKpiActive
                ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40 ring-2 ring-indigo-500/40 scale-[1.01]'
                : 'border-indigo-500/20 bg-indigo-50/40 dark:border-indigo-900/30 dark:bg-indigo-950/20 hover:border-indigo-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider">
                Soluções / Em Tratativa
              </span>
              <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-indigo-900 dark:text-indigo-200">{emAndamento}</span>
              <span className="text-xs text-indigo-700/70 dark:text-indigo-400/70">em aprovação</span>
            </div>
          </div>

          {/* Conflitos Normativos (CBMMG / Bombeiros) */}
          <div
            onClick={() => handleFilterStatusKpi('normativos')}
            className={`rounded-2xl border p-5 shadow-2xs cursor-pointer transition-all duration-200 ${
              isNormativosKpiActive
                ? 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 ring-2 ring-rose-500/40 scale-[1.01]'
                : 'border-rose-500/20 bg-rose-50/40 dark:border-rose-900/30 dark:bg-rose-950/20 hover:border-rose-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider">
                Conflitos Normativos
              </span>
              <div className="p-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
                <ShieldAlert className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-rose-900 dark:text-rose-200">{conflitosNormativos}</span>
              <span className="text-xs text-rose-700/70 dark:text-rose-400/70">normas / bombeiros</span>
            </div>
          </div>
        </div>

        {/* Abas de Navegação do Módulo ARCIS */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#0B384D] gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'border-[#00A3C4] text-[#008EA9] dark:text-[#00C4EB]'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" /> 1. Dashboard & Gráficos
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('lista')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === 'lista'
                  ? 'border-[#00A3C4] text-[#008EA9] dark:text-[#00C4EB]'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ListFilter className="h-4 w-4" /> 2. Fichas de Conflitos ({filteredConflitos.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('importar')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === 'importar'
                  ? 'border-[#00A3C4] text-[#008EA9] dark:text-[#00C4EB]'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UploadCloud className="h-4 w-4" /> 3. Importador PDF RSC
            </button>
          </div>

          <div className="flex items-center gap-2 pb-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchData}
              disabled={isLoading}
              className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white gap-1.5 h-8 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Atualizar
            </Button>
          </div>
        </div>

        {/* Filtros Globais para o Módulo */}
        <div className="bg-white dark:bg-[#072B3B]/90 border border-slate-200/80 dark:border-[#0B384D] rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-[#00A3C4]" /> Filtros de Análise ARCIS
            </span>

            {(selectedProjetos.length > 0 ||
              selectedStatus.length > 0 ||
              selectedTipos.length > 0 ||
              selectedDisciplinas.length > 0 ||
              searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedProjetos([]);
                  setSelectedStatus([]);
                  setSelectedTipos([]);
                  setSelectedDisciplinas([]);
                  setSearchQuery('');
                }}
                className="text-xs text-slate-500 hover:text-rose-600 h-7 cursor-pointer"
              >
                Limpar Filtros
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Busca textual */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">
                Busca:
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  placeholder="Código, texto ou local..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-xs"
                />
              </div>
            </div>

            {/* Projetos */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">
                Projetos:
              </label>
              <MultiSelectFilter
                label="Projetos"
                placeholder="Todos"
                options={projetosList.map((p) => ({ value: p.id, label: p.nome }))}
                selectedValues={selectedProjetos}
                onChange={setSelectedProjetos}
                variant="wcc"
                searchable
              />
            </div>

            {/* Status ARCIS */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">
                Status ARCIS:
              </label>
              <MultiSelectFilter
                label="Status"
                placeholder="Todos"
                options={STATUS_ARCIS_OPCOES.map((s) => ({ value: s, label: s }))}
                selectedValues={selectedStatus}
                onChange={setSelectedStatus}
                variant="amber"
                searchable
              />
            </div>

            {/* Disciplinas */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">
                Disciplinas:
              </label>
              <MultiSelectFilter
                label="Disciplina"
                placeholder="Todas"
                options={disciplinasOpcoes}
                selectedValues={selectedDisciplinas}
                onChange={setSelectedDisciplinas}
                variant="default"
                searchable
              />
            </div>

            {/* Tipo de Conflito */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">
                Tipo Conflito:
              </label>
              <MultiSelectFilter
                label="Tipo"
                placeholder="Todos"
                options={TIPOS_CONFLITO_ARCIS_OPCOES.map((t) => ({ value: t, label: t }))}
                selectedValues={selectedTipos}
                onChange={setSelectedTipos}
                variant="emerald"
                searchable
              />
            </div>
          </div>

          {/* Chips de Filtros Ativos (Removíveis com 1 clique) */}
          {(selectedProjetos.length > 0 ||
            selectedStatus.length > 0 ||
            selectedTipos.length > 0 ||
            selectedDisciplinas.length > 0 ||
            searchQuery) && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-[#0B384D] text-xs">
              <span className="text-[11px] font-bold text-slate-400 mr-1">Filtros ativos:</span>

              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#0B384D] text-[#072B3B] dark:text-slate-200 text-[11px] font-medium border border-slate-200 dark:border-slate-700">
                  Busca: &quot;{searchQuery}&quot;
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="hover:text-rose-500 cursor-pointer ml-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {selectedProjetos.map((projId) => {
                const name = projetosList.find((p) => p.id === projId)?.nome || projId;
                return (
                  <span
                    key={`chip-arcis-proj-${projId}`}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#00A3C4]/15 text-[#008EA9] dark:text-[#00C4EB] text-[11px] font-bold border border-[#00A3C4]/30"
                  >
                    <FolderKanban className="h-3 w-3" />
                    Proj: {name}
                    <button
                      type="button"
                      onClick={() => setSelectedProjetos(selectedProjetos.filter((id) => id !== projId))}
                      className="hover:text-rose-500 cursor-pointer ml-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}

              {selectedStatus.map((st) => (
                <span
                  key={`chip-arcis-st-${st}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px] font-bold border border-amber-300 dark:border-amber-800"
                >
                  Status: {st}
                  <button
                    type="button"
                    onClick={() => setSelectedStatus(selectedStatus.filter((s) => s !== st))}
                    className="hover:text-rose-500 cursor-pointer ml-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}

              {selectedTipos.map((tp) => (
                <span
                  key={`chip-arcis-tp-${tp}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-[11px] font-bold border border-rose-300 dark:border-rose-800"
                >
                  Tipo: {tp}
                  <button
                    type="button"
                    onClick={() => setSelectedTipos(selectedTipos.filter((t) => t !== tp))}
                    className="hover:text-rose-500 cursor-pointer ml-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}

              {selectedDisciplinas.map((disc) => (
                <span
                  key={`chip-arcis-disc-${disc}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-[#00A3C4]/15 text-[#008EA9] dark:text-[#00C4EB] text-[11px] font-bold border border-[#00A3C4]/30"
                >
                  Disc: {disc}
                  <button
                    type="button"
                    onClick={() => setSelectedDisciplinas(selectedDisciplinas.filter((d) => d !== disc))}
                    className="hover:text-rose-500 cursor-pointer ml-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* CONTEÚDO DAS ABAS */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#00A3C4]" />
            <p className="text-xs text-slate-500 font-medium">Carregando dados da ARCIS...</p>
          </div>
        ) : (
          <>
            {/* ABA 1: DASHBOARD & GRÁFICOS */}
            {activeTab === 'dashboard' && (
              <ArcisDashboardCharts conflitos={filteredConflitos} />
            )}

            {/* ABA 2: LISTA / CARDS DE CONFLITOS */}
            {activeTab === 'lista' && (
              <div className="space-y-4">
                {filteredConflitos.length === 0 ? (
                  <div className="p-12 text-center bg-white dark:bg-[#072B3B]/80 rounded-2xl border border-dashed border-slate-300 dark:border-[#0B384D] space-y-4">
                    <div className="p-4 rounded-full bg-cyan-50 dark:bg-[#00A3C4]/20 text-[#00A3C4] w-14 h-14 mx-auto flex items-center justify-center">
                      <Sparkles className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-[#072B3B] dark:text-white">
                        Nenhum conflito encontrado para &ldquo;{textoProjetoDinamico}&rdquo;.
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                        Tente limpar os filtros, selecionar outro empreendimento ou importe um novo relatório PDF RSC.
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-3 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedProjetos([]);
                          setSelectedStatus([]);
                          setSelectedTipos([]);
                          setSelectedDisciplinas([]);
                          setSearchQuery('');
                        }}
                        className="text-xs font-semibold cursor-pointer"
                      >
                        Limpar Filtros
                      </Button>
                      <Button
                        variant="wcc-gradient"
                        size="sm"
                        onClick={handleOpenNew}
                        className="text-xs font-bold gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Plus className="h-4 w-4" /> Cadastrar Conflito
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredConflitos.map((conflito) => (
                      <ArcisConflictCard
                        key={conflito.id}
                        conflito={conflito}
                        projectName={projetosList.find((p) => p.id === conflito.projeto_id)?.nome}
                        onViewDetails={handleOpenDetail}
                        onEdit={handleOpenEdit}
                        onDelete={handleDelete}
                        onQuickStatusChange={(id, st) => handleUpdateStatus(id, st)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ABA 3: ÁREA DEDICADA DE IMPORTAÇÃO */}
            {activeTab === 'importar' && (
              <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-white dark:bg-[#072B3B] border border-slate-200/90 dark:border-[#0B384D] shadow-sm text-center space-y-6">
                <div className="p-4 rounded-2xl bg-[#00A3C4]/10 text-[#00A3C4] w-16 h-16 mx-auto flex items-center justify-center shadow-xs">
                  <UploadCloud className="h-8 w-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-black text-[#072B3B] dark:text-white">
                    Importação de Relatórios de Compatibilização (PDF RSC)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    Você pode importar arquivos como <code className="font-mono text-[#00A3C4] font-bold">RSC_WCC_CONSTRUTORA_ALTAMIRA_47_20260816.pdf</code>. O sistema realiza a leitura automatizada de todas as pranchas, vincula ao projeto correspondente cadastrado no Supabase, identifica os conflitos normativos, pavimentos, disciplinas e armazena neste módulo dedicado.
                  </p>
                </div>

                <Button
                  variant="wcc-gradient"
                  size="lg"
                  onClick={() => setIsImportModalOpen(true)}
                  className="font-bold gap-2 text-sm shadow-md cursor-pointer"
                >
                  <UploadCloud className="h-4 w-4" /> Abrir Importador de PDF
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modais do Módulo */}
      <ArcisConflictDetailModal
        conflito={selectedConflitoDetail}
        projectName={selectedConflitoDetail?.projeto_id ? projetosList.find((p) => p.id === selectedConflitoDetail.projeto_id)?.nome : undefined}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedConflitoDetail(null);
        }}
        onUpdateStatus={handleUpdateStatus}
      />

      <ArcisConflictFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setConflitoParaEditar(null);
        }}
        conflitoParaEditar={conflitoParaEditar}
        projetos={projetosList}
        defaultProjetoId={selectedProjetos.length === 1 ? selectedProjetos[0] : undefined}
        proximoCodigo={proximoCodigo}
        onSave={handleSaveConflito}
      />

      <ArcisImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        projetos={projetosList}
        defaultProjetoId={selectedProjetos.length === 1 ? selectedProjetos[0] : undefined}
        conflitosExistentes={conflitos}
        onImportSuccess={handleImportSuccess}
      />
    </main>
  );
}
