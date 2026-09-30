const fs = require('fs');

const raw = fs.readFileSync('scratch/full_dataset.json', 'utf8');
const data = JSON.parse(raw);

console.log('=== VERIFICATION OF TOTALS ===');

// 1. Orçamento totals
let totalOrcado = 0;
let totalContratadoEmOrcamento = 0;
let totalSaldoAContratar = 0;
let totalMedidoEmOrcamento = 0;
let totalSaldoMedicaoEmOrcamento = 0;

for (const o of data.orcamentos) {
  totalOrcado += o.orcamento_base;
  totalContratadoEmOrcamento += o.valor_contratado;
  totalSaldoAContratar += o.saldo_a_contratar;
  totalMedidoEmOrcamento += o.valor_medido;
  totalSaldoMedicaoEmOrcamento += o.saldo_medicao;
}

console.log('Orçado Base:', totalOrcado.toFixed(2)); // Excel: 871259.20
console.log('Contratado (em Orc):', totalContratadoEmOrcamento.toFixed(2)); // Excel: 748921.20
console.log('Saldo a Contratar:', totalSaldoAContratar.toFixed(2)); // Excel: 122338.00
console.log('Medido (em Orc):', totalMedidoEmOrcamento.toFixed(2)); // Excel: 170452.99
console.log('Saldo Medição (em Orc):', totalSaldoMedicaoEmOrcamento.toFixed(2)); // Excel: 578468.21

// 2. Contratos totals
let totalContratos = 0;
let totalMedidoContratos = 0;
let totalSaldoAMedirContratos = 0;

for (const c of data.contratos) {
  totalContratos += c.valor_contrato;
  totalMedidoContratos += c.valor_medido;
  totalSaldoAMedirContratos += c.saldo_a_medir;
}

console.log('\nTotal Contratos:', totalContratos.toFixed(2));
console.log('Total Medido Contratos:', totalMedidoContratos.toFixed(2));
console.log('Saldo a Medir Contratos:', totalSaldoAMedirContratos.toFixed(2));

// 3. Medições totals
let totalMedicoesPago = 0;
let totalMedicoesMedido = 0;
let totalMedicoesAMedir = 0;
let totalMedicoesCancelada = 0;

for (const m of data.medicoes) {
  if (m.status === 'Pago') totalMedicoesPago += m.valor_medicao;
  else if (m.status === 'Medido') totalMedicoesMedido += m.valor_medicao;
  else if (m.status === 'A medir') totalMedicoesAMedir += m.valor_medicao;
  else if (m.status === 'Cancelada') totalMedicoesCancelada += m.valor_medicao;
}

console.log('\nMedições Pagas:', totalMedicoesPago.toFixed(2));
console.log('Medições Medidas (a pagar):', totalMedicoesMedido.toFixed(2));
console.log('Medições Total Realizado (Pago+Medido):', (totalMedicoesPago + totalMedicoesMedido).toFixed(2));
console.log('Medições A Medir (Previsto):', totalMedicoesAMedir.toFixed(2));
console.log('Medições Canceladas:', totalMedicoesCancelada.toFixed(2));

// 4. Monthly Disbursement (Curva de Desembolso)
const monthly = {};
for (const m of data.medicoes) {
  if (m.status === 'Cancelada') continue;
  const mes = m.mes_competencia || 'Sem data';
  if (!monthly[mes]) {
    monthly[mes] = { previsto: 0, realizado: 0, total: 0 };
  }
  if (m.status === 'Pago' || m.status === 'Medido') {
    monthly[mes].realizado += m.valor_medicao;
  } else {
    monthly[mes].previsto += m.valor_medicao;
  }
  monthly[mes].total += m.valor_medicao;
}

console.log('\nMonthly Breakdown sample:');
console.log(Object.entries(monthly).slice(0, 10));
