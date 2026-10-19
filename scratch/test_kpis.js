const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
let url = '', key = '';
env.split(/\r?\n/).forEach(line => {
  const parts = line.split('=');
  if (parts[0] === 'NEXT_PUBLIC_SUPABASE_URL') url = parts.slice(1).join('=').trim().replace(/['"]/g, '');
  if (parts[0] === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') key = parts.slice(1).join('=').trim().replace(/['"]/g, '');
});

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, key);

async function testKpis() {
  const { data: orcs } = await supabase.from('orcamentos_base').select('*');
  const { data: cts } = await supabase.from('contratos_obras').select('*');
  const { data: meds } = await supabase.from('medicoes_obras').select('*');
  const { data: obras } = await supabase.from('obras_cadastradas').select('*');

  // Let's check catPorContrato logic from orcamento-utils.ts:
  // lines 725-734:
  // ctsDaObra.forEach((c) => {
  //   const matchedOrc = orcsDaObra.find((o) => isContratoMatchOrcamento(c, o, obras, orcsDaObra));
  //   if (matchedOrc) {
  //     catPorContrato[c.id] = normalizeCategoria(matchedOrc.categoria, matchedOrc.disciplina);
  //   } else {
  //     catPorContrato[c.id] = normalizeCategoria(c.categoria, c.disciplina);
  //   }
  // });

  console.log('--- TEST ---');
}
testKpis();
