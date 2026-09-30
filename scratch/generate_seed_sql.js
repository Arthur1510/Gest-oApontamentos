const fs = require('fs');

const raw = fs.readFileSync('scratch/full_dataset.json', 'utf8');
const data = JSON.parse(raw);

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function numSql(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return Number(num).toFixed(2);
}

function dateSql(d) {
  if (!d) return 'NULL';
  return `'${d}'`;
}

let sql = `-- =========================================================
-- SEED SQL COMPLETO: Orçamentos, Contratos e Medições WCC
-- Idempotente: Executa inserção ou atualização (UPSERT)
-- =========================================================

-- 1. OBRAS
INSERT INTO public.obras_cad (id, cc, codigo, nome, endereco) VALUES
`;

const obrasValues = data.obras.map(o => 
  `(${escapeSql(o.id)}, ${escapeSql(o.cc)}, ${escapeSql(o.codigo)}, ${escapeSql(o.nome)}, ${escapeSql(o.endereco)})`
).join(',\n');

sql += obrasValues + `
ON CONFLICT (id) DO UPDATE SET 
  cc = EXCLUDED.cc,
  codigo = EXCLUDED.codigo,
  nome = EXCLUDED.nome,
  endereco = EXCLUDED.endereco;

-- 2. FORNECEDORES
INSERT INTO public.fornecedores_cad (id, id_sienge, fornecedor, tipo) VALUES
`;

const fornValues = data.fornecedores.map(f => 
  `(${escapeSql(f.id)}, ${escapeSql(f.id_sienge)}, ${escapeSql(f.fornecedor)}, ${escapeSql(f.tipo)})`
).join(',\n');

sql += fornValues + `
ON CONFLICT (id) DO UPDATE SET 
  id_sienge = EXCLUDED.id_sienge,
  fornecedor = EXCLUDED.fornecedor,
  tipo = EXCLUDED.tipo;

-- 3. ORÇAMENTOS BASE
INSERT INTO public.orcamentos_base (id, obra, nome_obra, disciplina, subdisciplina, orcamento_base, categoria, status) VALUES
`;

const orcValues = data.orcamentos.map(o => 
  `(${escapeSql(o.id)}, ${escapeSql(o.obra)}, ${escapeSql(o.nome_obra)}, ${escapeSql(o.disciplina)}, ${escapeSql(o.subdisciplina)}, ${numSql(o.orcamento_base)}, ${escapeSql(o.categoria || 'Projeto')}, ${escapeSql(o.status)})`
).join(',\n');

sql += orcValues + `
ON CONFLICT (id) DO UPDATE SET 
  obra = EXCLUDED.obra,
  nome_obra = EXCLUDED.nome_obra,
  disciplina = EXCLUDED.disciplina,
  subdisciplina = EXCLUDED.subdisciplina,
  orcamento_base = EXCLUDED.orcamento_base,
  categoria = EXCLUDED.categoria,
  status = EXCLUDED.status;

-- 4. CONTRATOS
INSERT INTO public.contratos_obras (id, num_sienge, empresa, obra, disciplina, subdisciplina, valor_contrato, categoria) VALUES
`;

const ctValues = data.contratos.map(c => 
  `(${escapeSql(c.id)}, ${escapeSql(c.num_sienge)}, ${escapeSql(c.empresa)}, ${escapeSql(c.obra)}, ${escapeSql(c.disciplina)}, ${escapeSql(c.subdisciplina)}, ${numSql(c.valor_contrato)}, ${escapeSql(c.categoria || 'Projeto')})`
).join(',\n');

sql += ctValues + `
ON CONFLICT (id) DO UPDATE SET 
  num_sienge = EXCLUDED.num_sienge,
  empresa = EXCLUDED.empresa,
  obra = EXCLUDED.obra,
  disciplina = EXCLUDED.disciplina,
  subdisciplina = EXCLUDED.subdisciplina,
  valor_contrato = EXCLUDED.valor_contrato,
  categoria = EXCLUDED.categoria;

-- 5. MEDIÇÕES
INSERT INTO public.medicoes_contratos (id, contrato_id, empresa, obra, etapa, percentual, data_prevista, data_medicao, data_referencia, mes_competencia, valor_medicao, status, nf, data_pagamento) VALUES
`;

const medValues = data.medicoes.map(m => 
  `(${escapeSql(m.id)}, ${escapeSql(m.contrato_id)}, ${escapeSql(m.empresa)}, ${escapeSql(m.obra)}, ${escapeSql(m.etapa)}, ${Number(m.percentual).toFixed(4)}, ${dateSql(m.data_prevista)}, ${dateSql(m.data_medicao)}, ${dateSql(m.data_referencia)}, ${escapeSql(m.mes_competencia)}, ${numSql(m.valor_medicao)}, ${escapeSql(m.status)}, ${escapeSql(m.nf)}, ${dateSql(m.data_pagamento)})`
).join(',\n');

sql += medValues + `
ON CONFLICT (id) DO UPDATE SET 
  contrato_id = EXCLUDED.contrato_id,
  empresa = EXCLUDED.empresa,
  obra = EXCLUDED.obra,
  etapa = EXCLUDED.etapa,
  percentual = EXCLUDED.percentual,
  data_prevista = EXCLUDED.data_prevista,
  data_medicao = EXCLUDED.data_medicao,
  data_referencia = EXCLUDED.data_referencia,
  mes_competencia = EXCLUDED.mes_competencia,
  valor_medicao = EXCLUDED.valor_medicao,
  status = EXCLUDED.status,
  nf = EXCLUDED.nf,
  data_pagamento = EXCLUDED.data_pagamento;
`;

fs.writeFileSync('seed_orcamentos.sql', sql, 'utf8');
console.log('Arquivo seed_orcamentos.sql gerado com sucesso!');
