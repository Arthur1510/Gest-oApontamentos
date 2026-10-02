import { supabase, isSupabaseConfigured } from './client';
import {
  Contrato,
  Medicao,
  ItemOrcamento,
  Obra,
  Fornecedor,
  Disciplina,
  Subdisciplina,
  StatusObra,
} from '@/types/orcamento';

// Cache para detecção de colunas estendidas no Postgres (status, aditivos, distrato, valores calculados)
let hasExtendedContratoCols: boolean | null = null;
let hasExtendedObraCols: boolean | null = null;
let hasExtendedOrcamentoCols: boolean | null = null;

/**
 * Verifica se o Supabase está configurado e disponível
 */
export function isSupabaseReady(): boolean {
  return isSupabaseConfigured() && supabase !== null;
}

/**
 * Busca todos os dados do módulo de orçamentos diretamente do Supabase
 */
export async function fetchOrcamentoDataFromSupabase(): Promise<{
  obras: Obra[];
  fornecedores: Fornecedor[];
  orcamentos: ItemOrcamento[];
  contratos: Contrato[];
  medicoes: Medicao[];
  disciplinas: Disciplina[];
  subdisciplinas: Subdisciplina[];
} | null> {
  if (!isSupabaseReady() || !supabase) return null;

  try {
    const [obrasRes, fornRes, orcRes, ctRes, medRes, discRes, subdiscRes] = await Promise.all([
      supabase.from('obras_cad').select('*').order('codigo'),
      supabase.from('fornecedores_cad').select('*').order('fornecedor'),
      supabase.from('orcamentos_base').select('*').order('id'),
      supabase.from('contratos_obras').select('*').order('id'),
      supabase.from('medicoes_contratos').select('*').order('data_prevista', { ascending: true }),
      supabase.from('disciplinas_cad').select('*').order('disciplina'),
      supabase.from('subdisciplinas_cad').select('*').order('subdisciplina'),
    ]);

    if (obrasRes.error) console.warn('Aviso ao carregar obras_cad do Supabase:', obrasRes.error.message);
    if (fornRes.error) console.warn('Aviso ao carregar fornecedores_cad do Supabase:', fornRes.error.message);
    if (orcRes.error) console.warn('Aviso ao carregar orcamentos_base do Supabase:', orcRes.error.message);
    if (ctRes.error) console.warn('Aviso ao carregar contratos_obras do Supabase:', ctRes.error.message);
    if (medRes.error) console.warn('Aviso ao carregar medicoes_contratos do Supabase:', medRes.error.message);

    const obras: Obra[] = (obrasRes.data || []).map((o: any) => ({
      id: o.id,
      codigo: o.codigo,
      nome: o.nome,
      cc: o.cc || '',
      endereco: o.endereco || null,
      status: (o.status as StatusObra) || 'Ativa',
    }));

    const fornecedores: Fornecedor[] = (fornRes.data || []).map((f: any) => ({
      id: f.id,
      id_sienge: f.id_sienge || '',
      fornecedor: f.fornecedor,
      tipo: f.tipo || '',
    }));

    const orcamentos: ItemOrcamento[] = (orcRes.data || []).map((orc: any) => ({
      id: orc.id,
      obra: orc.obra,
      nome_obra: orc.nome_obra || orc.obra,
      disciplina: orc.disciplina,
      subdisciplina: orc.subdisciplina,
      orcamento_base: Number(orc.orcamento_base) || 0,
      valor_contratado: Number(orc.valor_contratado) || 0,
      saldo_a_contratar: orc.saldo_a_contratar !== undefined && orc.saldo_a_contratar !== null
        ? Number(orc.saldo_a_contratar)
        : Number(orc.orcamento_base) || 0,
      valor_medido: Number(orc.valor_medido) || 0,
      saldo_medicao: Number(orc.saldo_medicao) || 0,
      categoria: orc.categoria || 'Projeto',
      status: orc.status || 'A contratar',
    }));

    const contratos: Contrato[] = (ctRes.data || []).map((c: any) => ({
      id: c.id,
      num_sienge: c.num_sienge || '',
      empresa: c.empresa,
      obra: c.obra,
      disciplina: c.disciplina,
      subdisciplina: c.subdisciplina,
      valor_contrato: Number(c.valor_contrato) || 0,
      valor_original: c.valor_original !== undefined && c.valor_original !== null ? Number(c.valor_original) : Number(c.valor_contrato) || 0,
      valor_aditivos: Number(c.valor_aditivos) || 0,
      aditivos: Array.isArray(c.aditivos) ? c.aditivos : [],
      valor_medido: 0,
      saldo_a_medir: Number(c.valor_contrato) || 0,
      percentual_medido: 0,
      categoria: c.categoria || 'Projeto',
      status: c.status || 'Ativo',
      distrato: c.distrato || null,
    }));

    const medicoes: Medicao[] = (medRes.data || []).map((m: any) => ({
      id: m.id,
      contrato_id: m.contrato_id,
      empresa: m.empresa,
      obra: m.obra,
      etapa: m.etapa,
      percentual: Number(m.percentual) || 0,
      data_prevista: m.data_prevista || null,
      data_medicao: m.data_medicao || null,
      data_referencia: m.data_referencia || null,
      mes_competencia: m.mes_competencia || '',
      valor_medicao: Number(m.valor_medicao) || 0,
      status: m.status || 'A Medir',
      nf: m.nf || null,
      data_pagamento: m.data_pagamento || null,
    }));

    // Disciplinas: do banco ou derivadas dinamicamente dos dados reais
    let disciplinas: Disciplina[] = (discRes.data || []).map((d: any) => ({
      id: d.id,
      disciplina: d.disciplina,
      codigo: d.codigo || d.disciplina?.slice(0, 4).toUpperCase(),
    }));

    if (disciplinas.length === 0) {
      const uniqueDisc = new Set<string>();
      orcamentos.forEach((o) => {
        if (o.disciplina) uniqueDisc.add(o.disciplina);
      });
      contratos.forEach((c) => {
        if (c.disciplina) uniqueDisc.add(c.disciplina);
      });
      disciplinas = Array.from(uniqueDisc).sort().map((d, idx) => ({
        id: `DISC_${String(idx + 1).padStart(3, '0')}`,
        disciplina: d,
        codigo: d.slice(0, 4).toUpperCase(),
      }));
    }

    // Subdisciplinas: do banco ou derivadas dinamicamente dos dados reais
    let subdisciplinas: Subdisciplina[] = (subdiscRes.data || []).map((sd: any) => ({
      id: sd.id,
      disciplina: sd.disciplina,
      cod_disciplina: sd.cod_disciplina || '',
      subdisciplina: sd.subdisciplina,
      cod_subdisciplina: sd.cod_subdisciplina || '',
    }));

    if (subdisciplinas.length === 0) {
      const uniqueSub = new Map<string, { disciplina: string; subdisciplina: string }>();
      orcamentos.forEach((o) => {
        if (o.disciplina && o.subdisciplina) {
          const key = `${o.disciplina.toUpperCase()}__${o.subdisciplina.toUpperCase()}`;
          if (!uniqueSub.has(key)) {
            uniqueSub.set(key, { disciplina: o.disciplina, subdisciplina: o.subdisciplina });
          }
        }
      });
      contratos.forEach((c) => {
        if (c.disciplina && c.subdisciplina) {
          const key = `${c.disciplina.toUpperCase()}__${c.subdisciplina.toUpperCase()}`;
          if (!uniqueSub.has(key)) {
            uniqueSub.set(key, { disciplina: c.disciplina, subdisciplina: c.subdisciplina });
          }
        }
      });
      subdisciplinas = Array.from(uniqueSub.values()).map((item, idx) => ({
        id: `SUB_${String(idx + 1).padStart(3, '0')}`,
        disciplina: item.disciplina,
        cod_disciplina: item.disciplina.slice(0, 4).toUpperCase(),
        subdisciplina: item.subdisciplina,
        cod_subdisciplina: item.subdisciplina.slice(0, 4).toUpperCase(),
      }));
    }

    return {
      obras,
      fornecedores,
      orcamentos,
      contratos,
      medicoes,
      disciplinas,
      subdisciplinas,
    };
  } catch (err) {
    console.error('Erro ao conectar ao Supabase para orçamentos:', err);
    return null;
  }
}

/**
 * Salva ou atualiza um contrato no Supabase (com fallback inteligente de colunas)
 */
export async function saveContratoSupabase(contrato: Contrato): Promise<boolean> {
  if (!isSupabaseReady() || !supabase) return false;

  try {
    if (hasExtendedContratoCols !== false) {
      const fullPayload = {
        id: contrato.id,
        num_sienge: contrato.num_sienge || '',
        empresa: contrato.empresa,
        obra: contrato.obra,
        disciplina: contrato.disciplina,
        subdisciplina: contrato.subdisciplina,
        valor_contrato: contrato.valor_contrato,
        valor_original: contrato.valor_original ?? contrato.valor_contrato,
        valor_aditivos: contrato.valor_aditivos || 0,
        aditivos: contrato.aditivos || [],
        categoria: contrato.categoria || 'Projeto',
        status: contrato.status || 'Ativo',
        distrato: contrato.distrato || null,
      };

      const { error } = await supabase.from('contratos_obras').upsert(fullPayload);
      if (!error) {
        hasExtendedContratoCols = true;
        return true;
      }

      // Se falhou por coluna não existente, desativa o cache estendido e tenta colunas base
      if (
        error.message.includes('does not exist') ||
        error.message.includes('Could not find') ||
        error.code === '42703' ||
        error.code === 'PGRST204'
      ) {
        hasExtendedContratoCols = false;
      } else {
        console.error('Erro ao salvar contrato no Supabase:', error.message);
        return false;
      }
    }

    // Payload com colunas padrão pré-existentes
    const basePayload = {
      id: contrato.id,
      num_sienge: contrato.num_sienge || '',
      empresa: contrato.empresa,
      obra: contrato.obra,
      disciplina: contrato.disciplina,
      subdisciplina: contrato.subdisciplina,
      valor_contrato: contrato.valor_contrato,
      categoria: contrato.categoria || 'Projeto',
    };

    const { error: baseError } = await supabase.from('contratos_obras').upsert(basePayload);
    if (baseError) {
      console.error('Erro ao salvar colunas base do contrato no Supabase:', baseError.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exceção ao salvar contrato no Supabase:', err);
    return false;
  }
}

/**
 * Exclui um contrato do Supabase
 */
export async function deleteContratoSupabase(id: string): Promise<boolean> {
  if (!isSupabaseReady() || !supabase) return false;
  try {
    const { error } = await supabase.from('contratos_obras').delete().eq('id', id);
    if (error) {
      console.error('Erro ao excluir contrato no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exceção ao excluir contrato no Supabase:', err);
    return false;
  }
}

/**
 * Salva ou atualiza uma medição no Supabase
 */
export async function saveMedicaoSupabase(medicao: Medicao): Promise<boolean> {
  if (!isSupabaseReady() || !supabase) return false;

  try {
    const payload = {
      id: medicao.id,
      contrato_id: medicao.contrato_id,
      empresa: medicao.empresa,
      obra: medicao.obra,
      etapa: medicao.etapa,
      percentual: medicao.percentual,
      data_prevista: medicao.data_prevista || null,
      data_medicao: medicao.data_medicao || null,
      data_referencia: medicao.data_referencia || null,
      mes_competencia: medicao.mes_competencia || '',
      valor_medicao: medicao.valor_medicao,
      status: medicao.status || 'A Medir',
      nf: medicao.nf || null,
      data_pagamento: medicao.data_pagamento || null,
    };

    const { error } = await supabase.from('medicoes_contratos').upsert(payload);
    if (error) {
      console.error('Erro ao salvar medição no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exceção ao salvar medição no Supabase:', err);
    return false;
  }
}

/**
 * Exclui uma medição do Supabase
 */
export async function deleteMedicaoSupabase(id: string): Promise<boolean> {
  if (!isSupabaseReady() || !supabase) return false;
  try {
    const { error } = await supabase.from('medicoes_contratos').delete().eq('id', id);
    if (error) {
      console.error('Erro ao excluir medição no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exceção ao excluir medição no Supabase:', err);
    return false;
  }
}

/**
 * Salva ou atualiza um item de Orçamento Base no Supabase
 */
export async function saveOrcamentoItemSupabase(item: ItemOrcamento): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseReady() || !supabase) {
    return { success: false, error: 'Supabase não está configurado ou cliente indisponível.' };
  }
  try {
    const cleanId = String(item.id).trim();
    const cleanObra = String(item.obra).trim();
    const cleanDisc = String(item.disciplina).trim();
    const cleanSub = String(item.subdisciplina || item.disciplina).trim();
    const cleanBase = Number(item.orcamento_base) || 0;
    const cleanContratado = Number(item.valor_contratado) || 0;
    const cleanSaldoContratar = item.saldo_a_contratar !== undefined && item.saldo_a_contratar !== null
      ? Number(item.saldo_a_contratar)
      : cleanBase - cleanContratado;
    const cleanMedido = Number(item.valor_medido) || 0;
    const cleanSaldoMedicao = item.saldo_medicao !== undefined && item.saldo_medicao !== null
      ? Number(item.saldo_medicao)
      : Math.max(0, cleanContratado - cleanMedido);

    if (hasExtendedOrcamentoCols !== false) {
      const fullPayload = {
        id: cleanId,
        obra: cleanObra,
        nome_obra: item.nome_obra || cleanObra,
        disciplina: cleanDisc,
        subdisciplina: cleanSub,
        orcamento_base: cleanBase,
        valor_contratado: cleanContratado,
        saldo_a_contratar: cleanSaldoContratar,
        valor_medido: cleanMedido,
        saldo_medicao: cleanSaldoMedicao,
        categoria: item.categoria || 'Projeto',
        status: item.status || 'A contratar',
      };
      const { error } = await supabase.from('orcamentos_base').upsert(fullPayload);
      if (!error) {
        hasExtendedOrcamentoCols = true;
        return { success: true };
      }
      if (
        error.message.includes('does not exist') ||
        error.message.includes('Could not find') ||
        error.code === '42703' ||
        error.code === 'PGRST204'
      ) {
        hasExtendedOrcamentoCols = false;
      } else {
        console.error('Erro ao salvar item de orçamento estendido no Supabase:', error.message);
        return { success: false, error: error.message };
      }
    }

    const basePayload = {
      id: cleanId,
      obra: cleanObra,
      nome_obra: item.nome_obra || cleanObra,
      disciplina: cleanDisc,
      subdisciplina: cleanSub,
      orcamento_base: cleanBase,
      categoria: item.categoria || 'Projeto',
      status: item.status || 'A contratar',
    };
    const { error: baseError } = await supabase.from('orcamentos_base').upsert(basePayload);
    if (baseError) {
      console.error('Erro ao salvar item de orçamento base no Supabase:', baseError.message);
      return { success: false, error: baseError.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Exceção ao salvar orçamento no Supabase:', err);
    return { success: false, error: err?.message || 'Falha de comunicação com o Supabase' };
  }
}

/**
 * Salva múltiplos itens de Orçamento Base no Supabase
 */
export async function saveOrcamentosBatchSupabase(items: ItemOrcamento[]): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseReady() || !supabase || items.length === 0) {
    return { success: false, error: 'Supabase não disponível ou lista vazia.' };
  }
  try {
    for (const item of items) {
      const res = await saveOrcamentoItemSupabase(item);
      if (!res.success) {
        return res;
      }
    }
    return { success: true };
  } catch (err: any) {
    console.error('Exceção ao salvar lote de orçamentos no Supabase:', err);
    return { success: false, error: err?.message || 'Erro ao persistir lote' };
  }
}

/**
 * Exclui um item de Orçamento Base do Supabase
 */
export async function deleteOrcamentoItemSupabase(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseReady() || !supabase) {
    return { success: false, error: 'Supabase não está configurado ou cliente indisponível.' };
  }
  try {
    const cleanId = String(id).trim();
    const { error } = await supabase.from('orcamentos_base').delete().eq('id', cleanId);
    if (error) {
      console.error('Erro ao excluir orçamento no Supabase:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Exceção ao excluir orçamento no Supabase:', err);
    return { success: false, error: err?.message || 'Erro ao excluir orçamento' };
  }
}

/**
 * Salva ou atualiza uma obra no Supabase
 */
export async function saveObraSupabase(obra: Obra): Promise<boolean> {
  if (!isSupabaseReady() || !supabase) return false;
  try {
    if (hasExtendedObraCols !== false) {
      const fullPayload = {
        id: obra.id,
        cc: obra.cc || null,
        codigo: obra.codigo,
        nome: obra.nome,
        endereco: obra.endereco || null,
        status: obra.status || 'Ativa',
      };
      const { error } = await supabase.from('obras_cad').upsert(fullPayload);
      if (!error) {
        hasExtendedObraCols = true;
        return true;
      }
      if (error.message.includes('does not exist') || error.code === '42703') {
        hasExtendedObraCols = false;
      } else {
        console.error('Erro ao salvar obra no Supabase:', error.message);
        return false;
      }
    }

    const basePayload = {
      id: obra.id,
      cc: obra.cc || null,
      codigo: obra.codigo,
      nome: obra.nome,
      endereco: obra.endereco || null,
    };
    const { error: baseErr } = await supabase.from('obras_cad').upsert(basePayload);
    if (baseErr) {
      console.error('Erro ao salvar colunas base de obra no Supabase:', baseErr.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exceção ao salvar obra no Supabase:', err);
    return false;
  }
}

/**
 * Exclui uma obra do Supabase
 */
export async function deleteObraSupabase(id: string): Promise<boolean> {
  if (!isSupabaseReady() || !supabase) return false;
  try {
    const { error } = await supabase.from('obras_cad').delete().eq('id', id);
    if (error) {
      console.error('Erro ao excluir obra no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exceção ao excluir obra no Supabase:', err);
    return false;
  }
}

/**
 * Salva ou atualiza um fornecedor no Supabase
 */
export async function saveFornecedorSupabase(fornecedor: Fornecedor): Promise<boolean> {
  if (!isSupabaseReady() || !supabase) return false;
  try {
    const payload = {
      id: fornecedor.id,
      id_sienge: fornecedor.id_sienge || null,
      fornecedor: fornecedor.fornecedor,
      tipo: fornecedor.tipo || null,
    };
    const { error } = await supabase.from('fornecedores_cad').upsert(payload);
    if (error) {
      console.error('Erro ao salvar fornecedor no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exceção ao salvar fornecedor no Supabase:', err);
    return false;
  }
}

/**
 * Exclui um fornecedor do Supabase
 */
export async function deleteFornecedorSupabase(id: string): Promise<boolean> {
  if (!isSupabaseReady() || !supabase) return false;
  try {
    const { error } = await supabase.from('fornecedores_cad').delete().eq('id', id);
    if (error) {
      console.error('Erro ao excluir fornecedor no Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exceção ao excluir fornecedor no Supabase:', err);
    return false;
  }
}

/**
 * Envia todos os dados locais em lote para o Supabase
 */
export async function syncAllLocalToSupabase(data: {
  obras: Obra[];
  fornecedores: Fornecedor[];
  orcamentos: ItemOrcamento[];
  contratos: Contrato[];
  medicoes: Medicao[];
}): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseReady() || !supabase) {
    return { success: false, message: 'Supabase não está configurado em .env.local.' };
  }

  try {
    // 1. Obras
    for (const o of data.obras) {
      await saveObraSupabase(o);
    }

    // 2. Fornecedores
    for (const f of data.fornecedores) {
      await saveFornecedorSupabase(f);
    }

    // 3. Orçamentos Base
    for (const orc of data.orcamentos) {
      await saveOrcamentoItemSupabase(orc);
    }

    // 4. Contratos
    for (const c of data.contratos) {
      await saveContratoSupabase(c);
    }

    // 5. Medições
    for (const m of data.medicoes) {
      await saveMedicaoSupabase(m);
    }

    return {
      success: true,
      message: `Sincronização concluída com sucesso! (${data.contratos.length} contratos e ${data.medicoes.length} medições salvas na nuvem)`,
    };
  } catch (err: any) {
    console.error('Erro ao sincronizar em lote com o Supabase:', err);
    return {
      success: false,
      message: `Erro na sincronização: ${err.message || 'Falha de comunicação'}`,
    };
  }
}
