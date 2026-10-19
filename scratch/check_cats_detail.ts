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

  // Let's check orcsRecalc by categoria
  const orcByCat: Record<string, { base: number, contratado: number, saldo: number, count: number }> = {};
  for (const o of orcsRecalc) {
    const cat = o.categoria || 'SEM_CAT';
    if (!orcByCat[cat]) orcByCat[cat] = { base: 0, contratado: 0, saldo: 0, count: 0 };
    orcByCat[cat].base += Number(o.orcamento_base) || 0;
    orcByCat[cat].contratado += Number(o.valor_contratado) || 0;
    orcByCat[cat].saldo += Number(o.saldo_a_contratar) || 0;
    orcByCat[cat].count++;
  }
  console.log('--- ORCS RECALC BY CATEGORIA ---');
  console.table(orcByCat);

  // Let's check ctsRecalc by categoria
  const ctByCat: Record<string, { total: number, count: number }> = {};
  for (const c of ctsRecalc) {
    const cat = c.categoria || 'SEM_CAT';
    if (!ctByCat[cat]) ctByCat[cat] = { total: 0, count: 0 };
    ctByCat[cat].total += Number(c.valor_contrato) || 0;
    ctByCat[cat].count++;
  }
  console.log('--- CTS RECALC BY CATEGORIA ---');
  console.table(ctByCat);
}

main();
