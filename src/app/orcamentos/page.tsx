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
  calculateCurvaDesembolso,
  isMedicaoEmAtraso,
} from '@/lib/orcamento-utils';
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
} from 'lucide-react';

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

  // Carregar dados salvos no localStorage
  useEffect(() => {
    try {
      const isInit = localStorage.getItem(STORAGE_KEY_CLEAN_INIT);
      const savedOrc = localStorage.getItem(STORAGE_KEY_ORCAMENTOS);
      const savedCt = localStorage.getItem(STORAGE_KEY_CONTRATOS);
      const savedMed = localStorage.getItem(STORAGE_KEY_MEDICOES);
      const savedObr = localStorage.getItem(STORAGE_KEY_OBRAS);
      const savedForn = localStorage.getItem(STORAGE_KEY_FORNECEDORES);
      const savedDisc = localStorage.getItem(STORAGE_KEY_DISCIPLINAS);
      const savedSubdisc = localStorage.getItem(STORAGE_KEY_SUBDISCIPLINAS);

      if (savedObr) setObras(JSON.parse(savedObr));
      if (savedForn) setFornecedores(JSON.parse(savedForn));
      if (savedDisc) setDisciplinas(JSON.parse(savedDisc));
      if (savedSubdisc) setSubdisciplinas(JSON.parse(savedSubdisc));

      if (savedCt && savedMed && savedOrc) {
        const parsedCt: Contrato[] = JSON.parse(savedCt);
        const parsedMed: Medicao[] = JSON.parse(savedMed);
        const parsedOrc: ItemOrcamento[] = JSON.parse(savedOrc);

        const recalcCt = recalculateContratos(parsedCt, parsedMed);
        const recalcOrc = recalculateOrcamentos(parsedOrc, recalcCt);

        setContratos(recalcCt);
        setMedicoes(parsedMed);
        setOrcamentos(recalcOrc);
      } else if (!isInit) {
        // Primeira inicialização v2: Contratos e medições iniciam limpos (vazios) para preenchimento direto
        localStorage.setItem(STORAGE_KEY_CLEAN_INIT, 'true');
        const recalcOrc = recalculateOrcamentos(MOCK_ORCAMENTOS, []);
        setContratos([]);
        setMedicoes([]);
        setOrcamentos(recalcOrc);
        localStorage.setItem(STORAGE_KEY_CONTRATOS, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEY_MEDICOES, JSON.stringify([]));
        localStorage.setItem(STORAGE_KEY_ORCAMENTOS, JSON.stringify(recalcOrc));
      } else {
        // Se já foi inicializado mas não há contratos salvos, mantém vazio
        const baseOrc = savedOrc ? JSON.parse(savedOrc) : MOCK_ORCAMENTOS;
        const recalcOrc = recalculateOrcamentos(baseOrc, []);
        setContratos([]);
        setMedicoes([]);
        setOrcamentos(recalcOrc);
      }
    } catch (err) {
      console.warn('Erro ao carregar dados locais:', err);
    }
  }, []);

  // Salvar no localStorage sempre que houver alteração
  const salvarDados = useCallback(
    (newMedicoes: Medicao[], newContratos: Contrato[], newOrcamentos: ItemOrcamento[]) => {
      try {
        const recalcCt = recalculateContratos(newContratos, newMedicoes);
        const recalcOrc = recalculateOrcamentos(newOrcamentos, recalcCt);

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
      } catch (err) {
        console.error('Erro ao salvar dados:', err);
      }
    },
    [selectedContratoDetail]
  );

  // Limpar todos os contratos e medições para preenchimento direto
  const handleLimparContratosEMedicoes = useCallback(() => {
    salvarDados([], [], orcamentos);
  }, [salvarDados, orcamentos]);

  // Carregar dados de demonstração da planilha original
  const handleCarregarDadosDemo = useCallback(() => {
    const recalcCt = recalculateContratos(MOCK_CONTRATOS, MOCK_MEDICOES);
    const recalcOrc = recalculateOrcamentos(MOCK_ORCAMENTOS, recalcCt);

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

  // --- CRUD CONTRATOS ---
  const handleSalvarContrato = (contratoData: Contrato | (NovoContrato & { id?: string })) => {
    let updated: Contrato[];
    if ('id' in contratoData && contratoData.id && contratos.some((c) => c.id === contratoData.id)) {
      // Editar existente
      updated = contratos.map((c) => (c.id === contratoData.id ? { ...c, ...contratoData } : c));
    } else {
      // Novo Contrato
      const novoId = contratoData.id || `CT${String(contratos.length + 1).padStart(3, '0')}`;
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
      updated = [novo, ...contratos];
    }
    salvarDados(medicoes, updated, orcamentos);
  };

  const handleExcluirContrato = (id: string) => {
    if (confirm(`Deseja realmente excluir o contrato ${id}? Todas as medições vinculadas serão mantidas ou devem ser revisadas.`)) {
      const updated = contratos.filter((c) => c.id !== id);
      salvarDados(medicoes, updated, orcamentos);
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

    salvarDados(medicoes, updated, orcamentos);
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

    salvarDados(medicoes, updated, orcamentos);
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

    salvarDados(medicoes, updated, orcamentos);
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

    salvarDados(medicoes, updated, orcamentos);
  };

  // --- CRUD MEDIÇÕES ---
  const handleSalvarMedicao = (medicaoData: Medicao | (NovaMedicao & { id?: string })) => {
    let updated: Medicao[];
    if ('id' in medicaoData && medicaoData.id && medicoes.some((m) => m.id === medicaoData.id)) {
      // Editar
      updated = medicoes.map((m) => (m.id === medicaoData.id ? { ...m, ...medicaoData } : m));
    } else {
      // Novo
      const novoId = medicaoData.id || `MED${String(medicoes.length + 1).padStart(3, '0')}`;
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
      updated = [novo, ...medicoes];
    }
    salvarDados(updated, contratos, orcamentos);
  };

  const handleExcluirMedicao = (id: string) => {
    if (confirm(`Deseja excluir a medição ${id}?`)) {
      const updated = medicoes.filter((m) => m.id !== id);
      salvarDados(updated, contratos, orcamentos);
    }
  };

  const handleMudarStatusMedicao = (id: string, novoStatus: StatusMedicao, nf?: string, dataPagamento?: string) => {
    const updated = medicoes.map((m) => {
      if (m.id === id) {
        return {
          ...m,
          status: novoStatus,
          nf: nf !== undefined ? nf : m.nf,
          data_pagamento: dataPagamento !== undefined ? dataPagamento : m.data_pagamento,
          data_medicao: novoStatus === 'Medido' && !m.data_medicao ? new Date().toISOString().split('T')[0] : m.data_medicao,
        };
      }
      return m;
    });
    salvarDados(updated, contratos, orcamentos);
  };

  // --- CRUD ORÇAMENTO BASE ---
  const handleSalvarOrcamento = (itemData: ItemOrcamento | (NovoItemOrcamento & { id?: string })) => {
    let updated: ItemOrcamento[];
    if ('id' in itemData && itemData.id && orcamentos.some((o) => o.id === itemData.id)) {
      updated = orcamentos.map((o) => (o.id === itemData.id ? { ...o, ...itemData } : o));
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
      updated = [novo, ...orcamentos];
    }
    salvarDados(medicoes, contratos, updated);
  };

  const handleExcluirOrcamento = (id: string) => {
    if (confirm('Deseja excluir este item de orçamento?')) {
      const updated = orcamentos.filter((o) => o.id !== id);
      salvarDados(medicoes, contratos, updated);
    }
  };

  // --- CRUD CADASTROS (OBRAS) ---
  const handleAdicionarObra = (novaObra: Obra) => {
    const updated = [...obras, novaObra];
    setObras(updated);
    localStorage.setItem(STORAGE_KEY_OBRAS, JSON.stringify(updated));
  };

  const handleEditarObra = (obraEditada: Obra) => {
    const updated = obras.map((o) => (o.id === obraEditada.id ? obraEditada : o));
    setObras(updated);
    localStorage.setItem(STORAGE_KEY_OBRAS, JSON.stringify(updated));
  };

  const handleExcluirObra = (id: string) => {
    const updated = obras.filter((o) => o.id !== id);
    setObras(updated);
    localStorage.setItem(STORAGE_KEY_OBRAS, JSON.stringify(updated));
  };

  // --- CRUD CADASTROS (FORNECEDORES) ---
  const handleAdicionarFornecedor = (novoForn: Fornecedor) => {
    const updated = [...fornecedores, novoForn];
    setFornecedores(updated);
    localStorage.setItem(STORAGE_KEY_FORNECEDORES, JSON.stringify(updated));
  };

  const handleEditarFornecedor = (fornEditado: Fornecedor) => {
    const updated = fornecedores.map((f) => (f.id === fornEditado.id ? fornEditado : f));
    setFornecedores(updated);
    localStorage.setItem(STORAGE_KEY_FORNECEDORES, JSON.stringify(updated));
  };

  const handleExcluirFornecedor = (id: string) => {
    const updated = fornecedores.filter((f) => f.id !== id);
    setFornecedores(updated);
    localStorage.setItem(STORAGE_KEY_FORNECEDORES, JSON.stringify(updated));
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
            {contratos.length === 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                Base Limpa (Pronta para Entrada)
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1.5">
            Controle de Orçamentos & Medições
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 max-w-3xl leading-relaxed">
            Gestão integrada de Orçamento Base, Contratos, Aditivos, Distratos, Medições de Marco e Curva de Desembolso S.
          </p>
        </div>

        {/* Botões de Ação Rápida */}
        <div className="flex flex-wrap items-center gap-2">
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
      />
    </div>
  );
}
