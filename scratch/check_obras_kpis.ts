import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import {
  recalculateContratos,
  recalculateOrcamentos,
  calculateKpis,
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
  const { data: medsRaw } = await supabase.from('medicoes_contratos').select('*');
  const { data: obrasRaw } = await supabase.from('obras_cad').select('*');

  const orcs = orcsRaw || [];
  const cts = ctsRaw || [];
  const meds = medsRaw || [];
  const obras = obrasRaw || [];

  const ctsRecalc = recalculateContratos(cts as any, meds as any, orcs as any, obras as any);
  const orcsRecalc = recalculateOrcamentos(orcs as any, ctsRecalc as any, obras as any);

  for (const o of obras) {
    const kpiAll = calculateKpis(orcsRecalc, ctsRecalc, meds as any, o.codigo, null, obras as any);
    const kpiProj = calculateKpis(orcsRecalc, ctsRecalc, meds as any, o.codigo, 'Projeto', obras as any);
    console.log(`OBRA ${o.codigo}:`);
    console.log(`  ALL:    Orcado: ${kpiAll.totalOrcado} | Contratado: ${kpiAll.totalContratado}`);
    console.log(`  PROJ:   Orcado: ${kpiProj.totalOrcado} | Contratado: ${kpiProj.totalContratado}`);
  }
}

main();
