"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ItemOrcamento,
  NovoItemOrcamento,
  Contrato,
  NovoContrato,
  Medicao,
  NovaMedicao,
  Obra,
  Fornecedor,
  Disciplina,
  Subdisciplina,
  StatusMedicao,
  AditivoContrato,
  DistratoInfo,
} from '@/types/orcamento';
import {
  MOCK_OBRAS,
  MOCK_DISCIPLINAS,
  MOCK_SUBDISCIPLINAS,
  MOCK_FORNECEDORES,
  MOCK_ORCAMENTOS,
  MOCK_CONTRATOS,
  MOCK_MEDICOES,
} from '@/lib/orcamento-mock-data';
import {
  recalculateContratos,
  recalculateOrcamentos,
  isContratoMatchOrcamento,
  getCanonicalObra,
  normalizeText,
  calculateCurvaDesembolso,
  calculateKpis,
  isMedicaoEmAtraso,
} from '@/lib/orcamento-utils';
import { exportMultiSheetExcel } from '@/lib/excel-export';
import { OrcamentoDashboard } from '@/components/orcamentos/OrcamentoDashboard';
import { OrcamentoBaseTable } from '@/components/orcamentos/OrcamentoBaseTable';
import { ContratosTable } from '@/components/orcamentos/ContratosTable';
import { MedicoesTable } from '@/components/orcamentos/MedicoesTable';
import { CadastrosTab } from '@/components/orcamentos/CadastrosTab';
import { ContratoDetailModal } from '@/components/orcamentos/ContratoDetailModal';
import { ContratoFormModal } from '@/components/orcamentos/ContratoFormModal';
import { MedicaoFormModal } from '@/components/orcamentos/MedicaoFormModal';
import { OrcamentoFormModal } from '@/components/orcamentos/OrcamentoFormModal';
import { ExportModal } from '@/components/orcamentos/ExportModal';
import { AditivoModal } from '@/components/orcamentos/AditivoModal';
import { DistratoModal } from '@/components/orcamentos/DistratoModal';
import { RelatorioOrcamentoPdfModal } from '@/components/orcamentos/RelatorioOrcamentoPdfModal';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  DollarSign,
  Briefcase,
  FileCheck,
  Building,
  FileSpreadsheet,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  FileText,
  Cloud,
  CloudUpload,
  CloudDownload,
  RefreshCw,
} from 'lucide-react';
import {
  isSupabaseReady,
  fetchOrcamentoDataFromSupabase,
  saveContratoSupabase,
  deleteContratoSupabase,
  saveMedicaoSupabase,
  deleteMedicaoSupabase,
  saveOrcamentoItemSupabase,
  deleteOrcamentoItemSupabase,
  saveObraSupabase,
  deleteObraSupabase,
  saveFornecedorSupabase,
  deleteFornecedorSupabase,
  syncAllLocalToSupabase,
} from '@/lib/supabase/orcamento-service';

const STORAGE_KEY_ORCAMENTOS = 'wcc_orcamentos_data_v2';
const STORAGE_KEY_CONTRATOS = 'wcc_contratos_data_v2';
const STORAGE_KEY_MEDICOES = 'wcc_medicoes_data_v2';
const STORAGE_KEY_OBRAS = 'wcc_obras_data_v2';
const STORAGE_KEY_FORNECEDORES = 'wcc_fornecedores_data_v2';
const STORAGE_KEY_DISCIPLINAS = 'wcc_disciplinas_data_v2';
const STORAGE_KEY_SUBDISCIPLINAS = 'wcc_subdisciplinas_data_v2';
const STORAGE_KEY_CLEAN_INIT = 'wcc_platform_clean_init_v2';

export default function OrcamentosPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orcamentos' | 'contratos' | 'medicoes' | 'cadastros'>('dashboard');

  // Cadastros base
  const [obras, setObras] = useState<Obra[]>(MOCK_OBRAS);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>(MOCK_DISCIPLINAS);
  const [subdisciplinas, setSubdisciplinas] = useState<Subdisciplina[]>(MOCK_SUBDISCIPLINAS);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>(MOCK_FORNECEDORES);

  // Orçamentos, Contratos e Medições (Contratos e medições iniciam vazios para preenchimento direto)
  const [orcamentos, setOrcamentos] = useState<ItemOrcamento[]>(() => recalculateOrcamentos(MOCK_ORCAMENTOS, []));
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [medicoes, setMedicoes] = useState<Medicao[]>([]);

  // Filtros Globais
  const [filtroObra, setFiltroObra] = useState<string>('');
  const [filtroFornecedor, setFiltroFornecedor] = useState<string>('');

  // Modais de Contrato, Medição e Orçamento
  const [selectedContratoDetail, setSelectedContratoDetail] = useState<Contrato | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [contratoParaEditar, setContratoParaEditar] = useState<Contrato | null>(null);
  const [isContratoModalOpen, setIsContratoModalOpen] = useState(false);

  const [medicaoParaEditar, setMedicaoParaEditar] = useState<Medicao | null>(null);
  const [contratoPreSelecionado, setContratoPreSelecionado] = useState<Contrato | null>(null);
  const [isMedicaoModalOpen, setIsMedicaoModalOpen] = useState(false);

  const [orcamentoParaEditar, setOrcamentoParaEditar] = useState<ItemOrcamento | null>(null);
  const [isOrcamentoModalOpen, setIsOrcamentoModalOpen] = useState(false);

  // Modais de Aditivo e Distrato
  const [contratoParaAditivo, setContratoParaAditivo] = useState<Contrato | null>(null);
  const [isAditivoModalOpen, setIsAditivoModalOpen] = useState(false);

  const [contratoParaDistrato, setContratoParaDistrato] = useState<Contrato | null>(null);
  const [isDistratoModalOpen, setIsDistratoModalOpen] = useState(false);

  // Modal de Exportação / Limpeza
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isRelatorioPdfOpen, setIsRelatorioPdfOpen] = useState(false);

  // Estados de Sincronização Supabase
  const [isSupabaseOnline, setIsSupabaseOnline] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncStatus, setLastSyncStatus] = useState<string | null>(null);

  // Carregar dados salvos no localStorage ou Supabase
  useEffect(() => {
    const carregarDados = async () => {
      let dadosLocaisExistem = false;
      try {
        const isInit = localStorage.getItem(STORAGE_KEY_CLEAN_INIT);
        const savedOrc = localStorage.getItem(STORAGE_KEY_ORCAMENTOS);
        const savedCt = localStorage.getItem(STORAGE_KEY_CONTRATOS);
        const savedMed = localStorage.getItem(STORAGE_KEY_MEDICOES);
        const savedObr = localStorage.getItem(STORAGE_KEY_OBRAS);
        const savedForn = localStorage.getItem(STORAGE_KEY_FORNECEDORES);
        const savedDisc = localStorage.getItem(STORAGE_KEY_DISCIPLINAS);
        const savedSubdisc = localStorage.getItem(STORAGE_KEY_SUBDISCIPLINAS);

        let currentObras = obras;
        if (savedObr) {
          currentObras = JSON.parse(savedObr);
          setObras(currentObras);
        }
        if (savedForn) setFornecedores(JSON.parse(savedForn));
        if (savedDisc) setDisciplinas(JSON.parse(savedDisc));
        if (savedSubdisc) setSubdisciplinas(JSON.parse(savedSubdisc));

        let localContratosSalvos: Contrato[] = [];
        if (savedCt && savedMed && savedOrc) {
          dadosLocaisExistem = true;
          const parsedCt: Contrato[] = JSON.parse(savedCt);
          const parsedMed: Medicao[] = JSON.parse(savedMed);
          const parsedOrc: ItemOrcamento[] = JSON.parse(savedOrc);
          localContratosSalvos = parsedCt;

          const recalcCt = recalculateContratos(parsedCt, parsedMed);
          const recalcOrc = recalculateOrcamentos(parsedOrc, recalcCt, currentObras);

          setContratos(recalcCt);
          setMedicoes(parsedMed);
          setOrcamentos(recalcOrc);
        } else if (!isInit) {
          // Primeira inicialização v2: Contratos e medições iniciam limpos (vazios) para preenchimento direto
          localStorage.setItem(STORAGE_KEY_CLEAN_INIT, 'true');
          const recalcOrc = recalculateOrcamentos(MOCK_ORCAMENTOS, [], currentObras);
          setContratos([]);
          setMedicoes([]);
          setOrcamentos(recalcOrc);
          localStorage.setItem(STORAGE_KEY_CONTRATOS, JSON.stringify([]));
          localStorage.setItem(STORAGE_KEY_MEDICOES, JSON.stringify([]));
          localStorage.setItem(STORAGE_KEY_ORCAMENTOS, JSON.stringify(recalcOrc));
        } else {
          // Se já foi inicializado mas não há contratos salvos, mantém vazio
          const baseOrc = savedOrc ? JSON.parse(savedOrc) : MOCK_ORCAMENTOS;
          const recalcOrc = recalculateOrcamentos(baseOrc, [], currentObras);
          setContratos([]);
          setMedicoes([]);
          setOrcamentos(recalcOrc);
        }
      } catch (err) {
        console.warn('Erro ao carregar dados locais:', err);
      }

      // Supabase: carregar dados atualizados da nuvem se disponível
      if (isSupabaseReady()) {
        setIsSupabaseOnline(true);
        try {
          setIsSyncing(true);
          const cloud = await fetchOrcamentoDataFromSupabase();
          if (cloud && (cloud.orcamentos.length > 0 || cloud.contratos.length > 0)) {
            const mergedObras = [...MOCK_OBRAS];
            (cloud.obras || []).forEach((co) => {
              const idx = mergedObras.findIndex((mo) => mo.id === co.id || mo.codigo === co.codigo);
              if (idx >= 0) mergedObras[idx] = co;
              else mergedObras.push(co);
            });

            let baseOrcamentos = cloud.orcamentos;
            if (cloud.orcamentos.length < MOCK_ORCAMENTOS.length) {
              const mergedOrc = [...cloud.orcamentos];
              MOCK_ORCAMENTOS.forEach((mo) => {
                if (!mergedOrc.some((co) => co.id === mo.id)) {
                  mergedOrc.push(mo);
                }
              });
              baseOrcamentos = mergedOrc;
            }

            // Mescla contratos da nuvem com dados locais (aditivos e distratos) para resiliência
            const localCtMap = new Map<string, Contrato>();
            (localContratosSalvos || []).forEach((lc: Contrato) => {
              if (lc && lc.id) localCtMap.set(String(lc.id).trim().toUpperCase(), lc);
            });

            const mergedContratos = (cloud.contratos || []).map((cc) => {
              const local = localCtMap.get(String(cc.id).trim().toUpperCase());
              if (!local) return cc;
              const hasCloudAditivos = Array.isArray(cc.aditivos) && cc.aditivos.length > 0;
              const hasLocalAditivos = Array.isArray(local.aditivos) && local.aditivos.length > 0;
              return {
                ...cc,
                valor_original: cc.valor_original ?? local.valor_original ?? cc.valor_contrato,
                aditivos: hasCloudAditivos ? cc.aditivos : (hasLocalAditivos ? local.aditivos : []),
                distrato: cc.distrato || local.distrato || null,
                status: (cc.status && cc.status !== 'Ativo') ? cc.status : (local.status || cc.status || 'Ativo'),
              };
            });

            // Preserva contratos criados localmente que ainda não foram para a nuvem
            (localContratosSalvos || []).forEach((lc: Contrato) => {
              if (lc && lc.id && !mergedContratos.some((mc) => String(mc.id).trim().toUpperCase() === String(lc.id).trim().toUpperCase())) {
                mergedContratos.push(lc);
              }
            });

            const recalcCt = recalculateContratos(mergedContratos, cloud.medicoes);
            const recalcOrc = recalculateOrcamentos(baseOrcamentos, recalcCt, mergedObras);

            setObras(mergedObras);
            localStorage.setItem(STORAGE_KEY_OBRAS, JSON.stringify(mergedObras));

            if (cloud.fornecedores.length > 0) {
              setFornecedores(cloud.fornecedores);
              localStorage.setItem(STORAGE_KEY_FORNECEDORES, JSON.stringify(cloud.fornecedores));
            }
            setContratos(recalcCt);
            setMedicoes(cloud.medicoes);
            setOrcamentos(recalcOrc);

            localStorage.setItem(STORAGE_KEY_CONTRATOS, JSON.stringify(recalcCt));
            localStorage.setItem(STORAGE_KEY_MEDICOES, JSON.stringify(cloud.medicoes));
            localStorage.setItem(STORAGE_KEY_ORCAMENTOS, JSON.stringify(recalcOrc));

            setLastSyncStatus(`Sincronizado com Supabase em ${new Date().toLocaleTimeString('pt-BR')}`);
          }
        } catch (cloudErr) {
          console.warn('Erro ao carregar dados do Supabase:', cloudErr);
        } finally {
          setIsSyncing(false);
        }
      }
    };

    carregarDados();
  }, []);

  // Salvar no localStorage sempre que houver alteração
  const salvarDados = useCallback(
    (
      newMedicoes: Medicao[],
      newContratos: Contrato[],
      newOrcamentos: ItemOrcamento[],
      currentObras?: Obra[]
    ) => {
      try {
        const obrasVigentes = currentObras || obras;
        const recalcCt = recalculateContratos(newContratos, newMedicoes);
        const recalcOrc = recalculateOrcamentos(newOrcamentos, recalcCt, obrasVigentes);

        setMedicoes(newMedicoes);
        setContratos(recalcCt);
        setOrcamentos(recalcOrc);

        // Atualiza contrato selecionado em modal se estiver aberto
        if (selectedContratoDetail) {
          const updatedSelected = recalcCt.find((c) => c.id === selectedContratoDetail.id) || null;
          setSelectedContratoDetail(updatedSelected);
        }

        localStorage.setItem(STORAGE_KEY_MEDICOES, JSON.stringify(newMedicoes));
        localStorage.setItem(STORAGE_KEY_CONTRATOS, JSON.stringify(recalcCt));
        localStorage.setItem(STORAGE_KEY_ORCAMENTOS, JSON.stringify(recalcOrc));

        return { recalcCt, recalcOrc };
      } catch (err) {
        console.error('Erro ao salvar dados:', err);
        return { recalcCt: newContratos, recalcOrc: newOrcamentos };
      }
    },
    [selectedContratoDetail, obras]
  );

  // Limpar todos os contratos e medições para preenchimento direto
  const handleLimparContratosEMedicoes = useCallback(() => {
    salvarDados([], [], orcamentos);
  }, [salvarDados, orcamentos]);

  // Carregar dados de demonstração da planilha original
  const handleCarregarDadosDemo = useCallback(() => {
    const recalcCt = recalculateContratos(MOCK_CONTRATOS, MOCK_MEDICOES);
    const recalcOrc = recalculateOrcamentos(MOCK_ORCAMENTOS, recalcCt, MOCK_OBRAS);

    setObras(MOCK_OBRAS);
    setFornecedores(MOCK_FORNECEDORES);
    setDisciplinas(MOCK_DISCIPLINAS);
    setSubdisciplinas(MOCK_SUBDISCIPLINAS);
    setContratos(recalcCt);
    setMedicoes(MOCK_MEDICOES);
    setOrcamentos(recalcOrc);

    localStorage.setItem(STORAGE_KEY_CONTRATOS, JSON.stringify(recalcCt));
    localStorage.setItem(STORAGE_KEY_MEDICOES, JSON.stringify(MOCK_MEDICOES));
    localStorage.setItem(STORAGE_KEY_ORCAMENTOS, JSON.stringify(recalcOrc));
    localStorage.setItem(STORAGE_KEY_OBRAS, JSON.stringify(MOCK_OBRAS));
    localStorage.setItem(STORAGE_KEY_FORNECEDORES, JSON.stringify(MOCK_FORNECEDORES));
    localStorage.setItem(STORAGE_KEY_DISCIPLINAS, JSON.stringify(MOCK_DISCIPLINAS));
    localStorage.setItem(STORAGE_KEY_SUBDISCIPLINAS, JSON.stringify(MOCK_SUBDISCIPLINAS));
  }, []);

  // --- SINCRONIZAÇÃO SUPABASE ---
  const handleSincronizarTudoComSupabase = useCallback(async () => {
    if (!isSupabaseReady()) {
      alert('Supabase não está configurado nas variáveis de ambiente.');
      return;
    }
    setIsSyncing(true);
    setLastSyncStatus('Sincronizando...');
    try {
      const res = await syncAllLocalToSupabase({
        obras,
        fornecedores,
        orcamentos,
        contratos,
        medicoes,
      });
      if (res.success) {
        const timeStr = new Date().toLocaleTimeString('pt-BR');
        setLastSyncStatus(`Sincronizado às ${timeStr}`);
        alert(`✅ Sucesso! Todos os dados (${contratos.length} contratos, ${medicoes.length} medições, ${orcamentos.length} orçamentos) foram sincronizados com o banco Supabase na nuvem.`);
      } else {
        setLastSyncStatus('Erro na sincronização');
        alert(`Aviso ao sincronizar com Supabase: ${res.message}`);
      }
    } catch (err: any) {
      console.error('Erro na sincronização com Supabase:', err);
      setLastSyncStatus('Erro na sincronização');
      alert(`Falha ao sincronizar com o Supabase: ${err?.message || 'Erro de conexão'}`);
    } finally {
      setIsSyncing(false);
    }
  }, [obras, fornecedores, orcamentos, contratos, medicoes]);

  const handleBaixarDoSupabase = useCallback(async () => {
    if (!isSupabaseReady()) {
      alert('Supabase não está configurado nas variáveis de ambiente.');
      return;
    }
    if (!confirm('Deseja realmente baixar os dados do Supabase? Isso atualizará a tela e o armazenamento local com as informações da nuvem.')) {
      return;
    }
    setIsSyncing(true);
    try {
      const cloud = await fetchOrcamentoDataFromSupabase();
      if (!cloud) {
        throw new Error('Não foi possível carregar os dados do Supabase.');
      }
      const recalcCt = recalculateContratos(cloud.contratos, cloud.medicoes);
      const recalcOrc = recalculateOrcamentos(cloud.orcamentos, recalcCt, cloud.obras);

      if (cloud.obras.length > 0) {
        setObras(cloud.obras);
        localStorage.setItem(STORAGE_KEY_OBRAS, JSON.stringify(cloud.obras));
      }
      if (cloud.fornecedores.length > 0) {
        setFornecedores(cloud.fornecedores);
        localStorage.setItem(STORAGE_KEY_FORNECEDORES, JSON.stringify(cloud.fornecedores));
      }

      setContratos(recalcCt);
      setMedicoes(cloud.medicoes);
      setOrcamentos(recalcOrc);

      localStorage.setItem(STORAGE_KEY_CONTRATOS, JSON.stringify(recalcCt));
      localStorage.setItem(STORAGE_KEY_MEDICOES, JSON.stringify(cloud.medicoes));
      localStorage.setItem(STORAGE_KEY_ORCAMENTOS, JSON.stringify(recalcOrc));

      setLastSyncStatus(`Atualizado da nuvem às ${new Date().toLocaleTimeString('pt-BR')}`);
      alert(`✅ Dados baixados do Supabase com sucesso!\n- ${cloud.contratos.length} Contratos\n- ${cloud.medicoes.length} Medições\n- ${cloud.orcamentos.length} Orçamentos\n- ${cloud.obras.length} Obras\n- ${cloud.fornecedores.length} Fornecedores`);
    } catch (err: any) {
      console.error('Erro ao baixar do Supabase:', err);
      alert(`Falha ao baixar dados do Supabase: ${err?.message || 'Erro de conexão'}`);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // --- CRUD CONTRATOS ---
  const handleSalvarContrato = (contratoData: Contrato | (NovoContrato & { id?: string })) => {
    let updated: Contrato[];
    let contratoSalvo: Contrato | undefined;
    if ('id' in contratoData && contratoData.id && contratos.some((c) => c.id === contratoData.id)) {
      // Editar existente
      updated = contratos.map((c) => {
        if (c.id === contratoData.id) {
          const novoValorContrato = Number(contratoData.valor_contrato);
          const totalAditivos = (c.aditivos || []).reduce((acc, a) => acc + (Number(a.valor) || 0), 0);
          const novoValorOriginal = novoValorContrato - totalAditivos > 0 ? novoValorContrato - totalAditivos : novoValorContrato;
          const mod = {
            ...c,
            ...contratoData,
            valor_original: novoValorOriginal,
          };
          contratoSalvo = mod;
          return mod;
        }
        return c;
      });
    } else {
      // Novo Contrato: calcular ID único para evitar colisões
      let maxNum = 0;
      contratos.forEach((c) => {
        const match = c.id.match(/\d+/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (num > maxNum) maxNum = num;
        }
      });
      const generatedId = `CT${String(maxNum + 1).padStart(3, '0')}`;
      const novoId = (contratoData.id && !contratos.some((c) => c.id === contratoData.id))
        ? contratoData.id
        : generatedId;
      const novo: Contrato = {
        id: novoId,
        num_sienge: contratoData.num_sienge || '',
        empresa: contratoData.empresa,
        obra: contratoData.obra,
        disciplina: contratoData.disciplina,
        subdisciplina: contratoData.subdisciplina,
        valor_contrato: contratoData.valor_contrato,
        valor_original: contratoData.valor_contrato,
        valor_aditivos: 0,
        aditivos: [],
        valor_medido: 0,
        saldo_a_medir: contratoData.valor_contrato,
        percentual_medido: 0,
        categoria: contratoData.categoria || 'Projeto',
        status: 'Ativo',
      };
      contratoSalvo = novo;
      updated = [novo, ...contratos];
    }
    const { recalcCt, recalcOrc } = salvarDados(medicoes, updated, orcamentos);
    const idParaSalvar = contratoSalvo?.id;
    const contratoFinal = idParaSalvar ? recalcCt.find((c) => c.id === idParaSalvar) : contratoSalvo;
    if (contratoFinal) {
      saveContratoSupabase(contratoFinal).catch((err) =>
        console.warn('Erro ao persistir contrato no Supabase:', err)
      );
      const orcsAfetados = recalcOrc.filter((o) =>
        isContratoMatchOrcamento(contratoFinal, o, obras, recalcOrc)
      );
      orcsAfetados.forEach((item) => {
        saveOrcamentoItemSupabase(item).catch((err) =>
          console.warn('Erro ao atualizar orçamento no Supabase:', err)
        );
      });
    }
  };

  const handleExcluirContrato = (id: string) => {
    if (confirm(`Deseja realmente excluir o contrato ${id}? Todas as medições vinculadas serão mantidas ou devem ser revisadas.`)) {
      const contratoExcluido = contratos.find((c) => c.id === id);
      const updated = contratos.filter((c) => c.id !== id);
      const { recalcOrc } = salvarDados(medicoes, updated, orcamentos);
      deleteContratoSupabase(id).catch((err) =>
        console.warn('Erro ao excluir contrato no Supabase:', err)
      );
      if (contratoExcluido) {
        const orcsAfetados = recalcOrc.filter((o) =>
          isContratoMatchOrcamento(contratoExcluido, o, obras, recalcOrc)
        );
        orcsAfetados.forEach((item) => {
          saveOrcamentoItemSupabase(item).catch((err) =>
            console.warn('Erro ao atualizar orçamento no Supabase:', err)
          );
        });
      }
    }
  };

  // --- LÓGICA DE ADITIVO ---
  const handleAbrirAditivo = (contrato: Contrato) => {
    setContratoParaAditivo(contrato);
    setIsAditivoModalOpen(true);
  };

  const handleSalvarAditivo = (contratoId: string, novoAditivo: Omit<AditivoContrato, 'id' | 'contrato_id'>) => {
    const updated = contratos.map((c) => {
      if (c.id === contratoId) {
        const aditivos = c.aditivos || [];
        const aditivoCompleto: AditivoContrato = {
          ...novoAditivo,
          id: `ADT_${contratoId}_${novoAditivo.numero}_${Date.now()}`,
          contrato_id: contratoId,
        };
        const novosAditivos = [...aditivos, aditivoCompleto];
        return {
          ...c,
          aditivos: novosAditivos,
        };
      }
      return c;
    });

    const { recalcCt, recalcOrc } = salvarDados(medicoes, updated, orcamentos);
    const contratoFinal = recalcCt.find((c) => c.id === contratoId);
    if (contratoFinal) {
      saveContratoSupabase(contratoFinal).catch((err) =>
        console.warn('Erro ao salvar aditivo no Supabase:', err)
      );
      const orcsAfetados = recalcOrc.filter((o) =>
        isContratoMatchOrcamento(contratoFinal, o, obras, recalcOrc)
      );
      orcsAfetados.forEach((item) => {
        saveOrcamentoItemSupabase(item).catch((err) =>
          console.warn('Erro ao atualizar orçamento no Supabase:', err)
        );
      });
    }
  };

  const handleExcluirAditivo = (contratoId: string, aditivoId: string) => {
    const updated = contratos.map((c) => {
      if (c.id === contratoId && c.aditivos) {
        const novosAditivos = c.aditivos.filter((a) => a.id !== aditivoId);
        return {
          ...c,
          aditivos: novosAditivos,
        };
      }
      return c;
    });

    const { recalcCt, recalcOrc } = salvarDados(medicoes, updated, orcamentos);
    const contratoFinal = recalcCt.find((c) => c.id === contratoId);
    if (contratoFinal) {
      saveContratoSupabase(contratoFinal).catch((err) =>
        console.warn('Erro ao atualizar contrato após exclusão de aditivo no Supabase:', err)
      );
      const orcsAfetados = recalcOrc.filter((o) =>
        isContratoMatchOrcamento(contratoFinal, o, obras, recalcOrc)
      );
      orcsAfetados.forEach((item) => {
        saveOrcamentoItemSupabase(item).catch((err) =>
          console.warn('Erro ao atualizar orçamento no Supabase:', err)
        );
      });
    }
  };

  // --- LÓGICA DE DISTRATO ---
  const handleAbrirDistrato = (contrato: Contrato) => {
    setContratoParaDistrato(contrato);
    setIsDistratoModalOpen(true);
  };

  const handleRegistrarDistrato = (contratoId: string, distrato: DistratoInfo) => {
    const updated = contratos.map((c) => {
      if (c.id === contratoId) {
        return {
          ...c,
          status: 'Distratado' as const,
          distrato,
        };
      }
      return c;
    });

    const { recalcCt, recalcOrc } = salvarDados(medicoes, updated, orcamentos);
    const contratoFinal = recalcCt.find((c) => c.id === contratoId);
    if (contratoFinal) {
      saveContratoSupabase(contratoFinal).catch((err) =>
        console.warn('Erro ao registrar distrato no Supabase:', err)
      );
      const orcsAfetados = recalcOrc.filter((o) =>
        isContratoMatchOrcamento(contratoFinal, o, obras, recalcOrc)
      );
      orcsAfetados.forEach((item) => {
        saveOrcamentoItemSupabase(item).catch((err) =>
          console.warn('Erro ao atualizar orçamento no Supabase:', err)
        );
      });
    }
  };

  const handleReverterDistrato = (contratoId: string) => {
    const updated = contratos.map((c) => {
      if (c.id === contratoId) {
        return {
          ...c,
          status: 'Ativo' as const,
          distrato: null,
        };
      }
      return c;
    });

    const { recalcCt, recalcOrc } = salvarDados(medicoes, updated, orcamentos);
    const contratoFinal = recalcCt.find((c) => c.id === contratoId);
    if (contratoFinal) {
      saveContratoSupabase(contratoFinal).catch((err) =>
        console.warn('Erro ao reverter distrato no Supabase:', err)
      );
      const orcsAfetados = recalcOrc.filter((o) =>
        isContratoMatchOrcamento(contratoFinal, o, obras, recalcOrc)
      );
      orcsAfetados.forEach((item) => {
        saveOrcamentoItemSupabase(item).catch((err) =>
          console.warn('Erro ao atualizar orçamento no Supabase:', err)
        );
      });
    }
  };

  // --- CRUD MEDIÇÕES ---
  const handleSalvarMedicao = (medicaoData: Medicao | (NovaMedicao & { id?: string })) => {
    const targetId = medicaoData.id || medicaoParaEditar?.id;
    const existingIndex = targetId
      ? medicoes.findIndex((m) => String(m.id).trim().toUpperCase() === String(targetId).trim().toUpperCase())
      : -1;

    let updated: Medicao[];
    let medicaoSalva: Medicao | undefined;
    if (existingIndex >= 0 && targetId) {
      // Editar existente: substitui in-place garantindo que não cria duplicata
      updated = medicoes.map((m, idx) => {
        if (idx === existingIndex) {
          const mod = {
            ...m,
            ...medicaoData,
            id: m.id,
          };
          medicaoSalva = mod;
          return mod;
        }
        return m;
      });
    } else {
      // Novo: calcular ID único para evitar colisões
      let maxNum = 0;
      medicoes.forEach((m) => {
        const match = String(m.id).match(/\d+/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (num > maxNum) maxNum = num;
        }
      });
      const generatedId = `MED${String(maxNum + 1).padStart(3, '0')}`;
      const novoId = (targetId && !medicoes.some((m) => String(m.id).trim().toUpperCase() === String(targetId).trim().toUpperCase()))
        ? targetId
        : generatedId;

      const novo: Medicao = {
        id: novoId,
        contrato_id: medicaoData.contrato_id,
        empresa: medicaoData.empresa,
        obra: medicaoData.obra,
        etapa: medicaoData.etapa,
        percentual: medicaoData.percentual,
        data_prevista: medicaoData.data_prevista,
        data_medicao: medicaoData.data_medicao,
        data_referencia: medicaoData.data_referencia,
        mes_competencia: medicaoData.mes_competencia,
        valor_medicao: medicaoData.valor_medicao,
        status: medicaoData.status,
        nf: medicaoData.nf || null,
        data_pagamento: medicaoData.data_pagamento || null,
      };
      medicaoSalva = novo;
      updated = [novo, ...medicoes];
    }
    const { recalcCt, recalcOrc } = salvarDados(updated, contratos, orcamentos);
    if (medicaoSalva) {
      saveMedicaoSupabase(medicaoSalva).catch((err) =>
        console.warn('Erro ao salvar medição no Supabase:', err)
      );
      const ctAfetado = recalcCt.find((c) => String(c.id).trim().toUpperCase() === String(medicaoSalva?.contrato_id).trim().toUpperCase());
      if (ctAfetado) {
        saveContratoSupabase(ctAfetado).catch((err) =>
          console.warn('Erro ao atualizar contrato após medição:', err)
        );
        const orcsAfetados = recalcOrc.filter((o) =>
          isContratoMatchOrcamento(ctAfetado, o, obras, recalcOrc)
        );
        orcsAfetados.forEach((item) => {
          saveOrcamentoItemSupabase(item).catch((err) =>
            console.warn('Erro ao atualizar orçamento após medição:', err)
          );
        });
      }
    }
  };

  const handleExcluirMedicao = (id: string) => {
    if (confirm(`Deseja excluir a medição ${id}?`)) {
      const medicaoExcluida = medicoes.find((m) => m.id === id);
      const updated = medicoes.filter((m) => m.id !== id);
      const { recalcCt, recalcOrc } = salvarDados(updated, contratos, orcamentos);
      deleteMedicaoSupabase(id).catch((err) =>
        console.warn('Erro ao excluir medição no Supabase:', err)
      );
      if (medicaoExcluida) {
        const ctAfetado = recalcCt.find((c) => String(c.id).trim().toUpperCase() === String(medicaoExcluida.contrato_id).trim().toUpperCase());
        if (ctAfetado) {
          saveContratoSupabase(ctAfetado).catch((err) =>
            console.warn('Erro ao atualizar contrato após exclusão de medição:', err)
          );
          const orcsAfetados = recalcOrc.filter((o) =>
            isContratoMatchOrcamento(ctAfetado, o, obras, recalcOrc)
          );
          orcsAfetados.forEach((item) => {
            saveOrcamentoItemSupabase(item).catch((err) =>
              console.warn('Erro ao atualizar orçamento após exclusão de medição:', err)
            );
          });
        }
      }
    }
  };

  const handleMudarStatusMedicao = (id: string, novoStatus: StatusMedicao, nf?: string, dataPagamento?: string) => {
    let medicaoSalva: Medicao | undefined;
    const updated = medicoes.map((m) => {
      if (m.id === id) {
        medicaoSalva = {
          ...m,
          status: novoStatus,
          nf: nf !== undefined ? nf : m.nf,
          data_pagamento: dataPagamento !== undefined ? dataPagamento : m.data_pagamento,
          data_medicao: novoStatus === 'Medido' && !m.data_medicao ? new Date().toISOString().split('T')[0] : m.data_medicao,
        };
        return medicaoSalva;
      }
      return m;
    });
    const { recalcCt, recalcOrc } = salvarDados(updated, contratos, orcamentos);
    if (medicaoSalva) {
      saveMedicaoSupabase(medicaoSalva).catch((err) =>
        console.warn('Erro ao atualizar status da medição no Supabase:', err)
      );
      const ctAfetado = recalcCt.find((c) => String(c.id).trim().toUpperCase() === String(medicaoSalva?.contrato_id).trim().toUpperCase());
      if (ctAfetado) {
        saveContratoSupabase(ctAfetado).catch((err) =>
          console.warn('Erro ao atualizar contrato após mudança de status de medição:', err)
        );
        const orcsAfetados = recalcOrc.filter((o) =>
          isContratoMatchOrcamento(ctAfetado, o, obras, recalcOrc)
        );
        orcsAfetados.forEach((item) => {
          saveOrcamentoItemSupabase(item).catch((err) =>
            console.warn('Erro ao atualizar orçamento após mudança de status de medição:', err)
          );
        });
      }
    }
  };

  // --- CRUD ORÇAMENTO BASE ---
  const handleSalvarOrcamento = (itemData: ItemOrcamento | (NovoItemOrcamento & { id?: string })) => {
    let updated: ItemOrcamento[];
    let orcSalvo: ItemOrcamento | undefined;
    if ('id' in itemData && itemData.id && orcamentos.some((o) => o.id === itemData.id)) {
      updated = orcamentos.map((o) => {
        if (o.id === itemData.id) {
          orcSalvo = { ...o, ...itemData };
          return orcSalvo;
        }
        return o;
      });
    } else {
      const novoId = itemData.id || `ORC${String(orcamentos.length + 1).padStart(3, '0')}`;
      const novo: ItemOrcamento = {
        id: novoId,
        obra: itemData.obra,
        nome_obra: itemData.nome_obra || itemData.obra,
        disciplina: itemData.disciplina,
        subdisciplina: itemData.subdisciplina,
        orcamento_base: itemData.orcamento_base,
        valor_contratado: 0,
        saldo_a_contratar: itemData.orcamento_base,
        valor_medido: 0,
        saldo_medicao: 0,
        status: itemData.status,
        categoria: itemData.categoria || 'Projeto',
      };
      orcSalvo = novo;
      updated = [novo, ...orcamentos];
    }
    const { recalcOrc } = salvarDados(medicoes, contratos, updated);
    const idParaSalvar = orcSalvo?.id;
    const orcFinal = idParaSalvar ? recalcOrc.find((o) => o.id === idParaSalvar) : orcSalvo;
    if (orcFinal) {
      saveOrcamentoItemSupabase(orcFinal).catch((err) =>
        console.warn('Erro ao salvar item de orçamento no Supabase:', err)
      );
    }
  };

  const handleExcluirOrcamento = (id: string) => {
    if (confirm('Deseja excluir este item de orçamento?')) {
      const updated = orcamentos.filter((o) => o.id !== id);
      salvarDados(medicoes, contratos, updated);
      deleteOrcamentoItemSupabase(id).catch((err) =>
        console.warn('Erro ao excluir orçamento no Supabase:', err)
      );
    }
  };

  // --- CRUD CADASTROS (OBRAS) ---
  const handleAdicionarObra = (novaObra: Obra) => {
    const updated = [...obras, novaObra];
    setObras(updated);
    localStorage.setItem(STORAGE_KEY_OBRAS, JSON.stringify(updated));
    salvarDados(medicoes, contratos, orcamentos, updated);
    saveObraSupabase(novaObra).catch((err) =>
      console.warn('Erro ao salvar obra no Supabase:', err)
    );
  };

  const handleEditarObra = (
    obraEditada: Obra,
    opcoes?: { distratarContratos?: boolean; reativarContratos?: boolean }
  ) => {
    const obraAnterior = obras.find((o) => o.id === obraEditada.id);
    const updated = obras.map((o) => (o.id === obraEditada.id ? obraEditada : o));
    setObras(updated);
    localStorage.setItem(STORAGE_KEY_OBRAS, JSON.stringify(updated));
    saveObraSupabase(obraEditada).catch((err) =>
      console.warn('Erro ao atualizar obra no Supabase:', err)
    );

    const pertenceAEstaObra = (nomeOuCodigo: string) => {
      const norm = (nomeOuCodigo || '').trim().toUpperCase();
      return (
        norm === obraEditada.codigo.trim().toUpperCase() ||
        norm === obraEditada.nome.trim().toUpperCase() ||
        (obraAnterior && (
          norm === obraAnterior.codigo.trim().toUpperCase() ||
          norm === obraAnterior.nome.trim().toUpperCase()
        ))
      );
    };

    if (opcoes?.distratarContratos) {
      const updatedContratos = contratos.map((c) => {
        if (pertenceAEstaObra(c.obra) && c.status !== 'Distratado') {
          return {
            ...c,
            status: 'Distratado' as const,
            distrato: {
              data: new Date().toISOString().split('T')[0],
              motivo: `Obra ${obraEditada.status?.toLowerCase() || 'paralisada'}`,
              congelar_saldo: true,
              valor_acerto: 0,
            },
          };
        }
        return c;
      });

      const updatedMedicoes = medicoes.map((m) => {
        if (pertenceAEstaObra(m.obra) && m.status === 'A Medir') {
          return {
            ...m,
            status: 'Cancelado' as const,
          };
        }
        return m;
      });

      const { recalcCt } = salvarDados(updatedMedicoes, updatedContratos, orcamentos, updated);

      // Sincronizar contratos e medições afetados no Supabase
      recalcCt.filter((c) => pertenceAEstaObra(c.obra)).forEach((c) => {
        saveContratoSupabase(c).catch(console.warn);
      });
      updatedMedicoes.filter((m) => pertenceAEstaObra(m.obra) && m.status === 'Cancelado').forEach((m) => {
        saveMedicaoSupabase(m).catch(console.warn);
      });
    } else if (opcoes?.reativarContratos) {
      const updatedContratos = contratos.map((c) => {
        if (pertenceAEstaObra(c.obra) && c.status === 'Distratado') {
          return {
            ...c,
            status: 'Ativo' as const,
            distrato: null,
          };
        }
        return c;
      });

      const { recalcCt } = salvarDados(medicoes, updatedContratos, orcamentos, updated);

      recalcCt.filter((c) => pertenceAEstaObra(c.obra)).forEach((c) => {
        saveContratoSupabase(c).catch(console.warn);
      });
    } else {
      salvarDados(medicoes, contratos, orcamentos, updated);
    }
  };

  const handleExcluirObra = (id: string) => {
    const updated = obras.filter((o) => o.id !== id);
    setObras(updated);
    localStorage.setItem(STORAGE_KEY_OBRAS, JSON.stringify(updated));
    deleteObraSupabase(id).catch((err) =>
      console.warn('Erro ao excluir obra no Supabase:', err)
    );
  };

  // --- CRUD CADASTROS (FORNECEDORES) ---
  const handleAdicionarFornecedor = (novoForn: Fornecedor) => {
    const updated = [...fornecedores, novoForn];
    setFornecedores(updated);
    localStorage.setItem(STORAGE_KEY_FORNECEDORES, JSON.stringify(updated));
    saveFornecedorSupabase(novoForn).catch((err) =>
      console.warn('Erro ao salvar fornecedor no Supabase:', err)
    );
  };

  const handleEditarFornecedor = (fornEditado: Fornecedor) => {
    const updated = fornecedores.map((f) => (f.id === fornEditado.id ? fornEditado : f));
    setFornecedores(updated);
    localStorage.setItem(STORAGE_KEY_FORNECEDORES, JSON.stringify(updated));
    saveFornecedorSupabase(fornEditado).catch((err) =>
      console.warn('Erro ao atualizar fornecedor no Supabase:', err)
    );
  };

  const handleExcluirFornecedor = (id: string) => {
    const updated = fornecedores.filter((f) => f.id !== id);
    setFornecedores(updated);
    localStorage.setItem(STORAGE_KEY_FORNECEDORES, JSON.stringify(updated));
    deleteFornecedorSupabase(id).catch((err) =>
      console.warn('Erro ao excluir fornecedor no Supabase:', err)
    );
  };

  // --- CRUD CADASTROS (DISCIPLINAS) ---
  const handleAdicionarDisciplina = (novaDisc: Disciplina) => {
    const updated = [...disciplinas, novaDisc];
    setDisciplinas(updated);
    localStorage.setItem(STORAGE_KEY_DISCIPLINAS, JSON.stringify(updated));
  };

  const handleEditarDisciplina = (discEditada: Disciplina) => {
    const updated = disciplinas.map((d) => (d.id === discEditada.id ? discEditada : d));
    setDisciplinas(updated);
    localStorage.setItem(STORAGE_KEY_DISCIPLINAS, JSON.stringify(updated));
  };

  const handleExcluirDisciplina = (id: string) => {
    const updated = disciplinas.filter((d) => d.id !== id);
    setDisciplinas(updated);
    localStorage.setItem(STORAGE_KEY_DISCIPLINAS, JSON.stringify(updated));
  };

  // --- CRUD CADASTROS (SUBDISCIPLINAS) ---
  const handleAdicionarSubdisciplina = (novaSub: Subdisciplina) => {
    const updated = [...subdisciplinas, novaSub];
    setSubdisciplinas(updated);
    localStorage.setItem(STORAGE_KEY_SUBDISCIPLINAS, JSON.stringify(updated));
  };

  const handleEditarSubdisciplina = (subEditada: Subdisciplina) => {
    const updated = subdisciplinas.map((s) => (s.id === subEditada.id ? subEditada : s));
    setSubdisciplinas(updated);
    localStorage.setItem(STORAGE_KEY_SUBDISCIPLINAS, JSON.stringify(updated));
  };

  const handleExcluirSubdisciplina = (id: string) => {
    const updated = subdisciplinas.filter((s) => s.id !== id);
    setSubdisciplinas(updated);
    localStorage.setItem(STORAGE_KEY_SUBDISCIPLINAS, JSON.stringify(updated));
  };

  // Pontos da Curva de Desembolso para exportação
  const curvaPontosExport = useMemo(() => {
    return calculateCurvaDesembolso(medicoes, filtroObra || null, filtroFornecedor || null);
  }, [medicoes, filtroObra, filtroFornecedor]);

  // Exportação consolidada para Excel com Dashboard & 6 Planilhas
  const handleExportarExcelConsolidado = useCallback(() => {
    const kpis = calculateKpis(orcamentos, contratos, medicoes, filtroObra || null, null);
    exportMultiSheetExcel({
      orcamentos,
      contratos,
      medicoes,
      curvaPontos: curvaPontosExport,
      kpis,
      nomeArquivo: `Relatorio_Consolidado_Orcamentos_WCC_${filtroObra || 'Geral'}.xls`,
    });
  }, [orcamentos, contratos, medicoes, filtroObra, curvaPontosExport]);

  return (
    <div className="flex-1 space-y-6 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* 1. CABEÇALHO DO MÓDULO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#0B384D] pb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-[#00A3C4]/15 text-[#008EA9] dark:text-[#00C4EB] text-xs font-black tracking-wider uppercase">
              WCC Gestão de Custos & Medições
            </span>
            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#0B384D] px-2 py-0.5 rounded-full">
              <Sparkles className="h-3 w-3 text-[#00A3C4]" /> Plataforma Direta
            </span>
            {isSupabaseOnline ? (
              <span
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                title={lastSyncStatus || 'Supabase conectado em tempo real'}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Cloud className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{isSyncing ? 'Sincronizando...' : 'Supabase Conectado'}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                <Cloud className="h-3.5 w-3.5" /> Modo Local (Offline)
              </span>
            )}
            {contratos.length === 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-500/20">
                Base Limpa (Pronta para Entrada)
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1.5">
            Controle de Orçamentos & Medições
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 max-w-3xl leading-relaxed">
            Gestão integrada de Orçamento Base, Contratos, Aditivos, Distratos, Medições de Marco e Curva de Desembolso S sincronizados na nuvem.
          </p>
        </div>

        {/* Botões de Ação Rápida */}
        <div className="flex flex-wrap items-center gap-2">
          {isSupabaseOnline && (
            <Button
              size="sm"
              variant="outline"
              disabled={isSyncing}
              onClick={handleSincronizarTudoComSupabase}
              title={lastSyncStatus || 'Sincronizar dados locais com o Supabase'}
              className="text-xs font-bold gap-1.5 h-9 rounded-xl border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar Nuvem'}
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => {
              setContratoParaEditar(null);
              setIsContratoModalOpen(true);
            }}
            className="bg-[#00A3C4] hover:bg-[#008EA9] text-white text-xs font-bold gap-1.5 h-9 rounded-xl shadow-xs"
          >
            <Plus className="h-4 w-4" /> Novo Contrato
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setMedicaoParaEditar(null);
              setContratoPreSelecionado(null);
              setIsMedicaoModalOpen(true);
            }}
            variant="outline"
            className="text-xs font-bold gap-1.5 h-9 rounded-xl border-slate-200 dark:border-[#0B384D] hover:bg-slate-50 dark:hover:bg-[#0B384D]"
          >
            <Plus className="h-4 w-4 text-[#00A3C4]" /> Nova Medição
          </Button>

          <Button
            size="sm"
            onClick={() => setIsRelatorioPdfOpen(true)}
            className="bg-[#072B3B] dark:bg-[#00A3C4] hover:bg-[#0B384D] dark:hover:bg-[#008EA9] text-white text-xs font-bold gap-1.5 h-9 rounded-xl shadow-xs"
          >
            <FileText className="h-4 w-4 text-[#00C4EB] dark:text-white" /> Relatório Executivo PDF
          </Button>

          {contratos.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (confirm('Deseja realmente limpar todos os contratos e medições para preencher do zero na plataforma?')) {
                  handleLimparContratosEMedicoes();
                }
              }}
              title="Excluir base de contratos e medições atuais para preencher do zero"
              className="text-xs font-bold gap-1.5 h-9 rounded-xl border-rose-200 dark:border-rose-900/40 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <Trash2 className="h-4 w-4 text-rose-500" /> Limpar Base
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsExportModalOpen(true)}
            className="text-xs font-bold gap-1.5 h-9 rounded-xl border-slate-200 dark:border-[#0B384D] hover:bg-slate-50 dark:hover:bg-[#0B384D]"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Exportar / Restaurar
          </Button>
        </div>
      </div>

      {/* 2. NAVEGAÇÃO ENTRE ABAS */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-[#0B384D]">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'dashboard'
              ? 'bg-[#00A3C4] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#0B384D]'
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          Visão Geral & Curva S
        </button>

        <button
          onClick={() => setActiveTab('orcamentos')}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'orcamentos'
              ? 'bg-[#00A3C4] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#0B384D]'
          }`}
        >
          <DollarSign className="h-4 w-4" />
          Orçamento Base ({orcamentos.length})
        </button>

        <button
          onClick={() => setActiveTab('contratos')}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'contratos'
              ? 'bg-[#00A3C4] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#0B384D]'
          }`}
        >
          <Briefcase className="h-4 w-4" />
          Contratos ({contratos.length})
        </button>

        <button
          onClick={() => setActiveTab('medicoes')}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'medicoes'
              ? 'bg-[#00A3C4] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#0B384D]'
          }`}
        >
          <FileCheck className="h-4 w-4" />
          Medições ({medicoes.length})
          {medicoes.some((m) => isMedicaoEmAtraso(m)) && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'medicoes'
                  ? 'bg-amber-400 text-slate-900'
                  : 'bg-amber-500 text-white'
              }`}
              title="Medições em atraso"
            >
              {medicoes.filter((m) => isMedicaoEmAtraso(m)).length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('cadastros')}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
            activeTab === 'cadastros'
              ? 'bg-[#00A3C4] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#0B384D]'
          }`}
        >
          <Building className="h-4 w-4" />
          Cadastros (Obras, Fornec., Disc.)
        </button>
      </div>

      {/* 3. CONTEÚDO DA ABA ATIVA */}
      {activeTab === 'dashboard' && (
        <OrcamentoDashboard
          orcamentos={orcamentos}
          contratos={contratos}
          medicoes={medicoes}
          obras={obras}
          fornecedores={fornecedores}
          filtroObra={filtroObra}
          setFiltroObra={setFiltroObra}
          filtroFornecedor={filtroFornecedor}
          setFiltroFornecedor={setFiltroFornecedor}
          onNavigateTab={(tab) => setActiveTab(tab as any)}
        />
      )}

      {activeTab === 'orcamentos' && (
        <OrcamentoBaseTable
          orcamentos={orcamentos}
          obras={obras}
          filtroObra={filtroObra}
          setFiltroObra={setFiltroObra}
          onNovoItem={() => {
            setOrcamentoParaEditar(null);
            setIsOrcamentoModalOpen(true);
          }}
          onEditarItem={(item) => {
            setOrcamentoParaEditar(item);
            setIsOrcamentoModalOpen(true);
          }}
          onExcluirItem={handleExcluirOrcamento}
        />
      )}

      {activeTab === 'contratos' && (
        <ContratosTable
          contratos={contratos}
          medicoes={medicoes}
          obras={obras}
          fornecedores={fornecedores}
          filtroObra={filtroObra}
          setFiltroObra={setFiltroObra}
          onNovoContrato={() => {
            setContratoParaEditar(null);
            setIsContratoModalOpen(true);
          }}
          onEditarContrato={(c) => {
            setContratoParaEditar(c);
            setIsContratoModalOpen(true);
          }}
          onExcluirContrato={handleExcluirContrato}
          onVerMedicoesContrato={(c) => {
            setSelectedContratoDetail(c);
            setIsDetailModalOpen(true);
          }}
          onNovaMedicaoParaContrato={(c) => {
            setContratoPreSelecionado(c);
            setMedicaoParaEditar(null);
            setIsMedicaoModalOpen(true);
          }}
          onAbrirAditivo={handleAbrirAditivo}
          onAbrirDistrato={handleAbrirDistrato}
        />
      )}

      {activeTab === 'medicoes' && (
        <MedicoesTable
          medicoes={medicoes}
          contratos={contratos}
          obras={obras}
          fornecedores={fornecedores}
          filtroObra={filtroObra}
          setFiltroObra={setFiltroObra}
          filtroFornecedor={filtroFornecedor}
          setFiltroFornecedor={setFiltroFornecedor}
          onNovaMedicao={() => {
            setMedicaoParaEditar(null);
            setContratoPreSelecionado(null);
            setIsMedicaoModalOpen(true);
          }}
          onEditarMedicao={(m) => {
            setMedicaoParaEditar(m);
            setIsMedicaoModalOpen(true);
          }}
          onExcluirMedicao={handleExcluirMedicao}
          onMudarStatusMedicao={handleMudarStatusMedicao}
        />
      )}

      {activeTab === 'cadastros' && (
        <CadastrosTab
          obras={obras}
          fornecedores={fornecedores}
          disciplinas={disciplinas}
          subdisciplinas={subdisciplinas}
          onAdicionarObra={handleAdicionarObra}
          onEditarObra={handleEditarObra}
          onExcluirObra={handleExcluirObra}
          onAdicionarFornecedor={handleAdicionarFornecedor}
          onEditarFornecedor={handleEditarFornecedor}
          onExcluirFornecedor={handleExcluirFornecedor}
          onAdicionarDisciplina={handleAdicionarDisciplina}
          onEditarDisciplina={handleEditarDisciplina}
          onExcluirDisciplina={handleExcluirDisciplina}
          onAdicionarSubdisciplina={handleAdicionarSubdisciplina}
          onEditarSubdisciplina={handleEditarSubdisciplina}
          onExcluirSubdisciplina={handleExcluirSubdisciplina}
        />
      )}

      {/* 4. MODAIS DO SISTEMA */}
      <ContratoDetailModal
        contrato={selectedContratoDetail}
        medicoes={medicoes}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedContratoDetail(null);
        }}
        onNovaMedicaoParaContrato={(c) => {
          setContratoPreSelecionado(c);
          setMedicaoParaEditar(null);
          setIsMedicaoModalOpen(true);
        }}
        onEditarMedicao={(m) => {
          setContratoPreSelecionado(null);
          setMedicaoParaEditar(m);
          setIsMedicaoModalOpen(true);
        }}
        onAbrirAditivo={handleAbrirAditivo}
        onAbrirDistrato={handleAbrirDistrato}
        onExcluirAditivo={handleExcluirAditivo}
        onReverterDistrato={handleReverterDistrato}
      />

      <ContratoFormModal
        contratoParaEditar={contratoParaEditar}
        contratos={contratos}
        obras={obras}
        fornecedores={fornecedores}
        disciplinas={disciplinas}
        subdisciplinas={subdisciplinas}
        isOpen={isContratoModalOpen}
        onClose={() => {
          setIsContratoModalOpen(false);
          setContratoParaEditar(null);
        }}
        onSalvar={handleSalvarContrato}
      />

      <MedicaoFormModal
        key={medicaoParaEditar ? `edit-${medicaoParaEditar.id}` : 'novo-medicao'}
        medicaoParaEditar={medicaoParaEditar}
        contratos={contratos}
        contratoPreSelecionado={contratoPreSelecionado}
        isOpen={isMedicaoModalOpen}
        onClose={() => {
          setIsMedicaoModalOpen(false);
          setMedicaoParaEditar(null);
          setContratoPreSelecionado(null);
        }}
        onSalvar={handleSalvarMedicao}
      />

      <OrcamentoFormModal
        itemParaEditar={orcamentoParaEditar}
        obras={obras}
        disciplinas={disciplinas}
        subdisciplinas={subdisciplinas}
        isOpen={isOrcamentoModalOpen}
        onClose={() => {
          setIsOrcamentoModalOpen(false);
          setOrcamentoParaEditar(null);
        }}
        onSalvar={handleSalvarOrcamento}
      />

      <AditivoModal
        contrato={contratoParaAditivo}
        isOpen={isAditivoModalOpen}
        onClose={() => {
          setIsAditivoModalOpen(false);
          setContratoParaAditivo(null);
        }}
        onSalvarAditivo={handleSalvarAditivo}
      />

      <DistratoModal
        contrato={contratoParaDistrato}
        isOpen={isDistratoModalOpen}
        onClose={() => {
          setIsDistratoModalOpen(false);
          setContratoParaDistrato(null);
        }}
        onRegistrarDistrato={handleRegistrarDistrato}
        onReverterDistrato={handleReverterDistrato}
      />

      <ExportModal
        orcamentos={orcamentos}
        contratos={contratos}
        medicoes={medicoes}
        curvaPontos={curvaPontosExport}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onResetarDadosPadrao={handleCarregarDadosDemo}
        onLimparContratosMedicoes={handleLimparContratosEMedicoes}
        onAbrirRelatorioPdf={() => setIsRelatorioPdfOpen(true)}
        onExportarExcelConsolidado={handleExportarExcelConsolidado}
        isSupabaseConfigured={isSupabaseOnline}
        isSyncing={isSyncing}
        onSubirParaSupabase={handleSincronizarTudoComSupabase}
        onBaixarDoSupabase={handleBaixarDoSupabase}
      />

      <RelatorioOrcamentoPdfModal
        isOpen={isRelatorioPdfOpen}
        onClose={() => setIsRelatorioPdfOpen(false)}
        orcamentos={orcamentos}
        contratos={contratos}
        medicoes={medicoes}
        curvaPontos={curvaPontosExport}
        obras={obras}
        filtroObra={filtroObra}
        filtroFornecedor={filtroFornecedor}
      />
    </div>
  );
}
