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
  const { data: orcs } = await supabase.from('orcamentos_base').select('*').eq('obra', 'ALT');
  orcs.forEach(o => {
    console.log(`ORC: ${o.id} | Cat: ${o.categoria} | Disc: ${o.disciplina} | Sub: ${o.subdisciplina} | Base: ${o.orcamento_base}`);
  });
}
run();
