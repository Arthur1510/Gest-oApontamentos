import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import {
  recalculateContratos,
  recalculateOrcamentos,
  calculateKpis,
  calculateJanela306090,
  calculateConsolidadoDisciplinas,
  calculateConsolidadoContratos,
} from '../src/lib/orcamento-utils';
import { CategoriaContrato, CATEGORIA_CONTRATO_OPCOES } from '../src/types/orcamento';

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
  const { data: medsRaw } = await supabase.from('medicoes_contratos').select('*');
  const { data: obrasRaw } = await supabase.from('obras_cad').select('*');

  const orcs = orcsRaw || [];
  const cts = ctsRaw || [];
  const meds = medsRaw || [];
  const obras = obrasRaw || [];

  const ctsRecalc = recalculateContratos(cts as any, meds as any, orcs as any, obras as any);
  const orcsRecalc = recalculateOrcamentos(orcs as any, ctsRecalc as any, obras as any);

  console.log('Testing each category:');
  const cats: ('Todos' | CategoriaContrato)[] = ['Todos', ...CATEGORIA_CONTRATO_OPCOES];
  for (const cat of cats) {
    const catParam = cat === 'Todos' ? null : cat;
    const kpis = calculateKpis(orcsRecalc, ctsRecalc, meds as any, null, catParam, obras as any);
    const disc = calculateConsolidadoDisciplinas(orcsRecalc, null, catParam, obras as any);
    const ct = calculateConsolidadoContratos(ctsRecalc, meds as any, null, null, catParam, orcsRecalc, obras as any);
    console.log(`Cat: ${cat} -> orcado: ${kpis.totalOrcado}, contratado: ${kpis.totalContratado}, falta: ${kpis.faltaContratar}, discCount: ${disc.length}, ctCount: ${ct.length}`);
  }
}

main();
