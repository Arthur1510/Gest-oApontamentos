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

// Import recalculateContratos etc from ts-node or transpiled code or mimic it
async function run() {
  const { data: orcs } = await supabase.from('orcamentos_base').select('*');
  const { data: cts } = await supabase.from('contratos_obras').select('*');
  const { data: meds } = await supabase.from('medicoes_obras').select('*');
  const { data: obras } = await supabase.from('obras_cadastradas').select('*');

  // Let's inspect the orcs and cts categories
  console.log('--- RAW ORCS ---');
  let orcProj = 0, orcTotal = 0;
  orcs.forEach(o => {
    orcTotal += Number(o.orcamento_base) || 0;
    if (o.categoria === 'Projeto') orcProj += Number(o.orcamento_base) || 0;
  });
  console.log({ orcTotal, orcProj });

  console.log('--- RAW CTS ---');
  let ctProj = 0, ctTotal = 0;
  cts.forEach(c => {
    ctTotal += Number(c.valor_contrato) || 0;
    if (c.categoria === 'Projeto') ctProj += Number(c.valor_contrato) || 0;
  });
  console.log({ ctTotal, ctProj });
}
run();
