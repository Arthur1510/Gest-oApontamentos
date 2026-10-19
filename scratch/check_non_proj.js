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

async function run() {
  const { data: orcs } = await supabase.from('orcamentos_base').select('*');
  const { data: cts } = await supabase.from('contratos_obras').select('*');
  const { data: obras } = await supabase.from('obras_cadastradas').select('*');

  // Let's check non-Projeto contracts
  const nonProjCts = cts.filter(c => c.categoria && c.categoria !== 'Projeto');
  console.log('Non-project contracts count:', nonProjCts.length);
  nonProjCts.forEach(c => {
    console.log(`Contract ID: ${c.id}, Categoria: ${c.categoria}, Obra: ${c.obra}, Empresa: ${c.empresa}, Disc: ${c.disciplina}, Subdisc: ${c.subdisciplina}`);
  });
}
run();
