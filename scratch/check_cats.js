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

async function check() {
  const { data: orcs, error: e1 } = await supabase.from('orcamentos_base').select('*');
  const { data: cts, error: e2 } = await supabase.from('contratos_obras').select('*');
  if (e1 || e2) {
    console.error('Error:', e1, e2);
    return;
  }
  console.log('Total orcs:', orcs.length, 'Total cts:', cts.length);
  const orcsByCat = {};
  let orcSum = 0;
  orcs.forEach(o => {
    orcsByCat[o.categoria] = (orcsByCat[o.categoria] || 0) + 1;
    orcSum += Number(o.orcamento_base) || 0;
  });
  console.log('Orcs por cat:', orcsByCat);
  console.log('Total orcado:', orcSum);

  const ctsByCat = {};
  let ctSum = 0;
  cts.forEach(c => {
    ctsByCat[c.categoria] = (ctsByCat[c.categoria] || 0) + 1;
    ctSum += Number(c.valor_contrato) || 0;
  });
  console.log('Contratos por cat:', ctsByCat);
  console.log('Total contratado:', ctSum);
}
check();
