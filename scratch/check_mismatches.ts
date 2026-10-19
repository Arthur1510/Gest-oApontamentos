import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import {
  isContratoMatchOrcamento,
  getCanonicalObra,
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
  const { data: obrasRaw } = await supabase.from('obras_cad').select('*');

  const orcs = orcsRaw || [];
  const cts = ctsRaw || [];
  const obras = obrasRaw || [];

  for (const c of cts) {
    const canonObra = getCanonicalObra(c.obra, obras);
    const orcsDaObra = orcamentosDaObra(orcs, canonObra, obras);
    const matchedOrc = orcsDaObra.find((o) => isContratoMatchOrcamento(c, o, obras, orcsDaObra));
    if (matchedOrc) {
      const cCat = normalizeCategoria(c.categoria, c.disciplina);
      const oCat = normalizeCategoria(matchedOrc.categoria, matchedOrc.disciplina);
      if (cCat !== oCat) {
        console.log(`MISMATCH! Contrato ${c.id} (${c.empresa}, ${c.obra}): cat=${cCat} (raw: ${c.categoria}), but matched ORC ${matchedOrc.id}: cat=${oCat} (raw: ${matchedOrc.categoria})`);
      }
    }
  }
}

function orcamentosDaObra(orcs: any[], canonObra: string, obras: any[]) {
  return orcs.filter((o) => getCanonicalObra(o.obra || o.nome_obra, obras) === canonObra);
}

main();
