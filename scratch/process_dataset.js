const fs = require('fs');

// Read excel_tables.json
const raw = fs.readFileSync('scratch/excel_tables.json', 'utf8').replace(/^\uFEFF/, '');
const data = JSON.parse(raw);

const listasRaw = fs.readFileSync('scratch/listas.json', 'utf8').replace(/^\uFEFF/, '');
const listas = JSON.parse(listasRaw);

function excelSerialToDate(serial) {
  if (!serial || isNaN(serial)) return null;
  const num = parseFloat(serial);
  if (num < 1000) return null;
  const utcDays = Math.floor(num - 25569);
  const date = new Date(utcDays * 86400 * 1000);
  return date.toISOString().split('T')[0];
}

// 1. Normalizar Grafia (Corrigir typo histórico ARQUITERURA -> ARQUITETURA)
function sanitizeText(str) {
  if (!str) return '';
  return str.replace(/ARQUITERURA/g, 'ARQUITETURA').trim();
}

// 2. Normalizar Status simplificado (A Medir, Medido, Pago, Cancelado)
function normalizeStatus(st) {
  if (!st) return 'A Medir';
  const s = st.trim().toLowerCase();
  if (s === 'pago') return 'Pago';
  if (s === 'medido') return 'Medido';
  if (s === 'cancelada' || s === 'cancelado') return 'Cancelado';
  return 'A Medir'; // 'a medir', 'a fazer', 'em andamento' convergem para 'A Medir'
}

// 3. Determinar Categoria (Projeto vs Legalização)
function getCategoria(item) {
  const d = (item.disciplina || '').toUpperCase();
  const sub = (item.subdisciplina || '').toUpperCase();
  const f = (item.empresa || '').toUpperCase();
  if (
    d.includes('LEGAL') ||
    sub.includes('LEGAL') ||
    f.includes('TAXA') ||
    f.includes('RECEITA') ||
    f.includes('CART') ||
    f.includes('CREA') ||
    f.includes('CRT') ||
    f.includes('PMU') ||
    f.includes('THAIS') ||
    f.includes('COSTA')
  ) {
    // Atenção: ARQUITETURA LEGAL é projeto de arquitetura para prefeitura, ou legalização?
    // Se a disciplina for ARQUITETURA e a sub for ARQUITETURA LEGAL, é PROJETO de arquitetura!
    if (d === 'ARQUITETURA') return 'Projeto';
    return 'Legalização';
  }
  return 'Projeto';
}

// Higienizar Subdisciplinas
const subdisciplinas = listas.subdisciplinas.map((s) => ({
  ...s,
  subdisciplina: sanitizeText(s.subdisciplina),
}));

// Processar Contratos
console.log('--- Processando Contratos ---');
const contratos = (data.tbContratos || []).map((c, idx) => {
  const disc = sanitizeText(c.DISCIPLINA);
  const sub = sanitizeText(c.SUBDISCIPLINA);
  const empresa = sanitizeText(c.EMPRESA);
  const cat = getCategoria({ disciplina: disc, subdisciplina: sub, empresa });

  return {
    id: c.CONTRATO_ID || `CT${String(idx + 1).padStart(3, '0')}`,
    num_sienge: c['NUM SIENGE'] || '',
    empresa: empresa,
    obra: c.OBRA || '',
    disciplina: disc,
    subdisciplina: sub,
    valor_contrato: parseFloat(c['VALOR CONTRATO']) || 0,
    valor_medido: parseFloat(c['VALOR MEDIDO']) || 0,
    saldo_a_medir: parseFloat(c['SALDO A MEDIR']) || 0,
    percentual_medido: parseFloat(c['PERCENTUAL MEDIDO']) || 0,
    categoria: cat,
  };
});
console.log(`Contratos processados: ${contratos.length}`);

// Processar Orçamento Base
console.log('--- Processando Orçamentos ---');
const orcamentosBaseRaw = (data['tbOrçamento'] || [])
  .filter((o) => o.OBRA && o.OBRA.toLowerCase() !== 'total' && o.DISCIPLINA)
  .map((o, idx) => {
    const disc = sanitizeText(o.DISCIPLINA);
    const sub = sanitizeText(o.SUBDISCIPLINA);
    const cat = getCategoria({ disciplina: disc, subdisciplina: sub });

    return {
      id: `ORC${String(idx + 1).padStart(3, '0')}`,
      obra: o.OBRA || '',
      nome_obra: o['NOME OBRA'] || '',
      disciplina: disc,
      subdisciplina: sub,
      orcamento_base: parseFloat(o['ORÇAMENTO BASE ']) || 0,
      valor_contratado: parseFloat(o['VALOR CONTRATADO']) || 0,
      saldo_a_contratar: parseFloat(o['SALDO A CONTRATAR']) || 0,
      valor_medido: parseFloat(o['VALOR MEDIDO']) || 0,
      saldo_medicao: parseFloat(o['SALDO MEDIÇÃO']) || 0,
      categoria: cat,
      status: o['STATUS '] || 'A contratar',
    };
  });

// Adicionar as 4 linhas faltantes de Orçamento para STM, SEFAZ e MON
let nextOrcNum = orcamentosBaseRaw.length + 1;
const missingOrcs = [
  {
    id: `ORC${String(nextOrcNum++).padStart(3, '0')}`,
    obra: 'STM',
    nome_obra: 'Santa Mônica',
    disciplina: 'PLANIALTIMÉTRICO',
    subdisciplina: 'PLANIALTIMÉTRICO',
    orcamento_base: 4550,
    valor_contratado: 4550,
    saldo_a_contratar: 0,
    valor_medido: 4550,
    saldo_medicao: 0,
    categoria: 'Projeto',
    status: 'Contratado',
  },
  {
    id: `ORC${String(nextOrcNum++).padStart(3, '0')}`,
    obra: 'SEFAZ',
    nome_obra: 'Galassi SEFAZ',
    disciplina: 'PLANIALTIMÉTRICO',
    subdisciplina: 'PLANIALTIMÉTRICO',
    orcamento_base: 4550,
    valor_contratado: 4550,
    saldo_a_contratar: 0,
    valor_medido: 4550,
    saldo_medicao: 0,
    categoria: 'Projeto',
    status: 'Contratado',
  },
  {
    id: `ORC${String(nextOrcNum++).padStart(3, '0')}`,
    obra: 'MON',
    nome_obra: 'Monterré',
    disciplina: 'COMPLEMENTARES',
    subdisciplina: 'COMPLEMENTARES',
    orcamento_base: 290000,
    valor_contratado: 290000,
    saldo_a_contratar: 0,
    valor_medido: 0,
    saldo_medicao: 290000,
    categoria: 'Projeto',
    status: 'Contratado',
  },
  {
    id: `ORC${String(nextOrcNum++).padStart(3, '0')}`,
    obra: 'MON',
    nome_obra: 'Monterré',
    disciplina: 'ESTRUTURA',
    subdisciplina: 'ESTRUTURA DE CONCRETO',
    orcamento_base: 100000,
    valor_contratado: 100000,
    saldo_a_contratar: 0,
    valor_medido: 0,
    saldo_medicao: 100000,
    categoria: 'Projeto',
    status: 'Contratado',
  },
];

const orcamentos = [...orcamentosBaseRaw, ...missingOrcs];
console.log(`Orçamentos consolidados: ${orcamentos.length}`);

// Processar Medições com Status Simplificado
console.log('--- Processando Medições ---');
const medicoesTable = data['tbMedições'] || [];
const medicoes = medicoesTable.map((m, idx) => {
  const dataPrevista = excelSerialToDate(m['DATA PREVISTA']);
  const dataMedicao = excelSerialToDate(m['DATA MEDIÇÃO']);
  const dataRef = excelSerialToDate(m['DATA REFERÊNCIA']) || dataMedicao || dataPrevista;
  const dataPagamento = excelSerialToDate(m['DATA PAGAMENTO']);

  let etapaStr = '';
  if (typeof m.ETAPA === 'string') {
    etapaStr = sanitizeText(m.ETAPA);
  } else if (m['Estudo preliminar'] === 'MED007') {
    etapaStr = 'Emissão alvará';
  } else if (m.ETAPA) {
    etapaStr = sanitizeText(String(m.ETAPA));
  }

  const statusNorm = normalizeStatus(m.STATUS);

  return {
    id: m['Estudo preliminar'] || `MED${String(idx + 1).padStart(3, '0')}`,
    contrato_id: m.CONTRATO_ID || '',
    empresa: sanitizeText(m.EMPRESA),
    obra: m.OBRA || '',
    etapa: etapaStr,
    percentual: parseFloat(m.PERCENTUAL) || 0,
    data_prevista: dataPrevista,
    data_medicao: dataMedicao,
    data_referencia: dataRef,
    mes_competencia: m['MÊS'] || (dataRef ? dataRef.substring(2, 7).replace('-', '/') : ''),
    valor_medicao: parseFloat(m['VALOR MEDIÇÃO']) || 0,
    status: statusNorm,
    nf: m.NF ? String(m.NF).trim() : '',
    data_pagamento: dataPagamento,
  };
});
console.log(`Medições processadas: ${medicoes.length}`);

const fullDataset = {
  obras: listas.obras,
  disciplinas: listas.disciplinas,
  subdisciplinas,
  fornecedores: listas.fornecedores,
  orcamentos,
  contratos,
  medicoes,
};

fs.writeFileSync('scratch/full_dataset.json', JSON.stringify(fullDataset, null, 2), 'utf8');
console.log('scratch/full_dataset.json salvo com sucesso!');
