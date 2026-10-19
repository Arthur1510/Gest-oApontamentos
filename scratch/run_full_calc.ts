import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import {
  recalculateContratos,
  recalculateOrcamentos,
  calculateKpis,
  normalizeCategoria
} from '../src/lib/orcamento-utils';

const env = fs.readFileSync('.env.local', 'utf8');
let url = '', key = '';
env.split(/\r?\n/).forEach(line => {
  const parts = line.split('=');
  if (parts[0] === 'NEXT_PUBLIC_SUPABASE_URL') url = parts.slice(1).join('=').trim().replace(/['"]/g, '');
  if (parts[0] === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') key = parts.slice(1).join('=').trim().replace(/['"]/g, '');
});

const supabase = createClient(url, key);

async function main() {
  const { data: orcsRaw } = await supabase.from('orcamentos_base').select('*');
  const { data: ctsRaw } = await supabase.from('contratos_obras').select('*');
  const { data: medsRaw } = await supabase.from('medicoes_obras').select('*');
  const { data: obrasRaw } = await supabase.from('obras_cadastradas').select('*');

  const orcs = orcsRaw || [];
  const cts = ctsRaw || [];
  const meds = medsRaw || [];
  const obras = obrasRaw || [];

  const ctsRecalc = recalculateContratos(cts as any, meds as any, orcs as any, obras as any);
  const orcsRecalc = recalculateOrcamentos(orcs as any, ctsRecalc as any, obras as any);

  console.log('--- ALL OBRAS, ALL CATEGORIES (filtroCategoria = null / Todos) ---');
  const kpisAll = calculateKpis(orcsRecalc, ctsRecalc, meds as any, null, null, obras as any);
  console.log({
    totalOrcado: kpisAll.totalOrcado,
    totalContratado: kpisAll.totalContratado,
    faltaContratar: kpisAll.faltaContratar,
    totalMedido: kpisAll.totalMedido,
    saldoAMedir: kpisAll.saldoAMedir,
  });

  console.log('--- ALL OBRAS, PROJETO (filtroCategoria = "Projeto") ---');
  const kpisProj = calculateKpis(orcsRecalc, ctsRecalc, meds as any, null, 'Projeto', obras as any);
  console.log({
    totalOrcado: kpisProj.totalOrcado,
    totalContratado: kpisProj.totalContratado,
    faltaContratar: kpisProj.faltaContratar,
    totalMedido: kpisProj.totalMedido,
    saldoAMedir: kpisProj.saldoAMedir,
  });

  console.log('--- RESUMO VIABILIDADE (from kpisAll) ---');
  console.table((kpisAll.resumoViabilidade || []).map(r => ({
    cat: r.categoria,
    base: r.orcamentoBase,
    contratado: r.valorContratado,
    saldo: r.saldoAContratar,
    tendencia: r.valorTendencia,
  })));

  // Check how many contracts are in each category after recalculateContratos
  const catCountsAfterRecalc: Record<string, number> = {};
  ctsRecalc.forEach(c => {
    catCountsAfterRecalc[c.categoria] = (catCountsAfterRecalc[c.categoria] || 0) + 1;
  });
  console.log('Contratos categorias after recalculateContratos:', catCountsAfterRecalc);

  // Check raw contracts
  const catCountsRaw: Record<string, number> = {};
  cts.forEach(c => {
    catCountsRaw[c.categoria] = (catCountsRaw[c.categoria] || 0) + 1;
  });
  console.log('Contratos categorias RAW:', catCountsRaw);
}

main();
