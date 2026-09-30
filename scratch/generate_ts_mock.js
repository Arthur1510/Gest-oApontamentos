const fs = require('fs');

const raw = fs.readFileSync('scratch/full_dataset.json', 'utf8');
const data = JSON.parse(raw);

const code = `import { Obra, Disciplina, Subdisciplina, Fornecedor, ItemOrcamento, Contrato, Medicao } from '@/types/orcamento';

export const MOCK_OBRAS: Obra[] = ${JSON.stringify(data.obras, null, 2)};

export const MOCK_DISCIPLINAS: Disciplina[] = ${JSON.stringify(data.disciplinas, null, 2)};

export const MOCK_SUBDISCIPLINAS: Subdisciplina[] = ${JSON.stringify(data.subdisciplinas, null, 2)};

export const MOCK_FORNECEDORES: Fornecedor[] = ${JSON.stringify(data.fornecedores, null, 2)};

export const MOCK_ORCAMENTOS: ItemOrcamento[] = ${JSON.stringify(data.orcamentos, null, 2)};

export const MOCK_CONTRATOS: Contrato[] = ${JSON.stringify(data.contratos, null, 2)};

export const MOCK_MEDICOES: Medicao[] = ${JSON.stringify(data.medicoes, null, 2)};
`;

fs.writeFileSync('src/lib/orcamento-mock-data.ts', code, 'utf8');
console.log('src/lib/orcamento-mock-data.ts written successfully!');
