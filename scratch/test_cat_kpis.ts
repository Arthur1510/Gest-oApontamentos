import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import {
  recalculateContratos,
  recalculateOrcamentos,
  calculateKpis,
  isContratoMatchOrcamento,
} from '../src/lib/orcamento-utils';
import { normalizeCategoria } from '../src/types/orcamento';

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

  // CURRENT:
  const ctsRecalc = recalculateContratos(cts as any, meds as any, orcs as any, obras as any);
  const orcsRecalc = recalculateOrcamentos(orcs as any, ctsRecalc as any, obras as any);

  const kpisAll = calculateKpis(orcsRecalc, ctsRecalc, meds as any, null, null, obras as any);
  const kpisProj = calculateKpis(orcsRecalc, ctsRecalc, meds as any, null, 'Projeto', obras as any);
  const kpisLeg = calculateKpis(orcsRecalc, ctsRecalc, meds as any, null, 'Legalização', obras as any);

  console.log('CURRENT kpisAll:', {
    orcado: kpisAll.totalOrcado,
    contratado: kpisAll.totalContratado,
    faltaContratar: kpisAll.faltaContratar,
    tendencia: kpisAll.totalTendencia,
  });
  console.log('CURRENT kpisProj:', {
    orcado: kpisProj.totalOrcado,
    contratado: kpisProj.totalContratado,
    faltaContratar: kpisProj.faltaContratar,
    tendencia: kpisProj.totalTendencia,
  });
  console.log('CURRENT kpisLeg:', {
    orcado: kpisLeg.totalOrcado,
    contratado: kpisLeg.totalContratado,
    faltaContratar: kpisLeg.faltaContratar,
    tendencia: kpisLeg.totalTendencia,
  });
}

main();
