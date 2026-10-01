import {
  ItemOrcamento,
  Contrato,
  Medicao,
  CurvaDesembolsoPonto,
  KpiOrcamento,
  Obra,
  Fornecedor,
} from '@/types/orcamento';
import { formatDateBR } from '@/lib/orcamento-utils';

function escapeXml(unsafe: string | number | null | undefined): string {
  if (unsafe === null || unsafe === undefined) return '';
  const str = String(unsafe);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function exportMultiSheetExcel({
  orcamentos,
  contratos,
  medicoes,
  curvaPontos,
  kpis,
  nomeArquivo = 'Relatorio_Consolidado_Orcamentos_WCC.xls',
}: {
  orcamentos: ItemOrcamento[];
  contratos: Contrato[];
  medicoes: Medicao[];
  curvaPontos: CurvaDesembolsoPonto[];
  kpis: KpiOrcamento;
  nomeArquivo?: string;
}) {
  // Lista acumulada de aditivos
  const todosAditivos: {
    contrato_id: string;
    empresa: string;
    obra: string;
    numero: number;
    data: string;
    tipo: string;
    valor: number;
    novo_prazo?: string | null;
    descricao: string;
  }[] = [];

  for (const c of contratos) {
    if (c.aditivos && c.aditivos.length > 0) {
      for (const a of c.aditivos) {
        todosAditivos.push({
          contrato_id: c.id,
          empresa: c.empresa,
          obra: c.obra,
          numero: a.numero,
          data: a.data,
          tipo: a.tipo,
          valor: a.valor,
          novo_prazo: a.novo_prazo,
          descricao: a.descricao,
        });
      }
    }
  }

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#072B3B" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#00A3C4" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#072B3B"/>
   </Borders>
  </Style>
  <Style ss:ID="SubHeader">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#072B3B"/>
   <Interior ss:Color="#E2F5F8" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Currency">
   <NumberFormat ss:Format="&quot;R$&quot;\ #,##0.00"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="CurrencyBold">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#072B3B"/>
   <NumberFormat ss:Format="&quot;R$&quot;\ #,##0.00"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Percent">
   <NumberFormat ss:Format="0.0%"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="PercentBold">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#00A3C4"/>
   <NumberFormat ss:Format="0.0%"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Date">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Center">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="BadgeDistrato">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#991B1B"/>
   <Interior ss:Color="#FEE2E2" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="BadgeAtivo">
   <Font ss:FontName="Calibri" ss:Size="10" ss:Bold="1" ss:Color="#065F46"/>
   <Interior ss:Color="#D1FAE5" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
 </Styles>

 <!-- 1. ABA DASHBOARD & KPIS -->
 <Worksheet ss:Name="Dashboard_Resumo">
  <Table ss:DefaultRowHeight="20">
   <Column ss:Width="250"/>
   <Column ss:Width="160"/>
   <Column ss:Width="200"/>
   <Column ss:Width="160"/>

   <Row ss:Height="30">
    <Cell ss:MergeAcross="3" ss:StyleID="Title"><Data ss:Type="String">  WCC GESTÃO DE CUSTOS &amp; MEDIÇÕES - DASHBOARD EXECUTIVO</Data></Cell>
   </Row>
   <Row ss:Height="10"/>

   <Row>
    <Cell ss:MergeAcross="1" ss:StyleID="SubHeader"><Data ss:Type="String">INDICADORES FINANCEIROS GLOBAIS</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="SubHeader"><Data ss:Type="String">MEDIDAS DE LIQUIDAÇÃO &amp; CRONOGRAMA</Data></Cell>
   </Row>

   <Row>
    <Cell><Data ss:Type="String">Orçamento Base Total:</Data></Cell>
    <Cell ss:StyleID="CurrencyBold"><Data ss:Type="Number">${kpis.totalOrcado}</Data></Cell>
    <Cell><Data ss:Type="String">Total Medido / Físico:</Data></Cell>
    <Cell ss:StyleID="CurrencyBold"><Data ss:Type="Number">${kpis.totalMedido}</Data></Cell>
   </Row>

   <Row>
    <Cell><Data ss:Type="String">Valor Total Contratado:</Data></Cell>
    <Cell ss:StyleID="CurrencyBold"><Data ss:Type="Number">${kpis.totalContratado}</Data></Cell>
    <Cell><Data ss:Type="String">Percentual Medido / Contratado:</Data></Cell>
    <Cell ss:StyleID="PercentBold"><Data ss:Type="Number">${kpis.percentualMedido}</Data></Cell>
   </Row>

   <Row>
    <Cell><Data ss:Type="String">Saldo a Contratar:</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${kpis.saldoAContratar}</Data></Cell>
    <Cell><Data ss:Type="String">Saldo Restante a Medir:</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${kpis.saldoAMedir}</Data></Cell>
   </Row>

   <Row>
    <Cell><Data ss:Type="String">% Orçamento Contratado:</Data></Cell>
    <Cell ss:StyleID="Percent"><Data ss:Type="Number">${kpis.percentualContratado}</Data></Cell>
    <Cell><Data ss:Type="String">Total Efetivamente Pago:</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${kpis.totalPago}</Data></Cell>
   </Row>

   <Row>
    <Cell><Data ss:Type="String">Total Contratos Ativos:</Data></Cell>
    <Cell ss:StyleID="Center"><Data ss:Type="Number">${contratos.filter(c => c.status !== 'Distratado').length}</Data></Cell>
    <Cell><Data ss:Type="String">Total Medido Pendente de Quitação:</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${kpis.totalMedidoPendente}</Data></Cell>
   </Row>

   <Row>
    <Cell><Data ss:Type="String">Contratos Distratados:</Data></Cell>
    <Cell ss:StyleID="Center"><Data ss:Type="Number">${contratos.filter(c => c.status === 'Distratado').length}</Data></Cell>
    <Cell><Data ss:Type="String">Medições em Atraso (Vencidas):</Data></Cell>
    <Cell ss:StyleID="CurrencyBold"><Data ss:Type="Number">${kpis.totalEmAtraso}</Data></Cell>
   </Row>

   <Row ss:Height="15"/>
   <Row>
    <Cell ss:MergeAcross="3" ss:StyleID="SubHeader"><Data ss:Type="String">DIVISÃO POR CATEGORIA (CONTRATADO)</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Projetos Técnicos / Executivos:</Data></Cell>
    <Cell ss:StyleID="CurrencyBold"><Data ss:Type="Number">${kpis.totalProjetosContratado}</Data></Cell>
    <Cell><Data ss:Type="String">Legalização &amp; Taxas:</Data></Cell>
    <Cell ss:StyleID="CurrencyBold"><Data ss:Type="Number">${kpis.totalLegalizacaoContratado}</Data></Cell>
   </Row>
  </Table>
 </Worksheet>

 <!-- 2. ABA CONTRATOS -->
 <Worksheet ss:Name="tbContratos">
  <Table ss:DefaultRowHeight="18">
   <Column ss:Width="80"/>
   <Column ss:Width="80"/>
   <Column ss:Width="90"/>
   <Column ss:Width="100"/>
   <Column ss:Width="200"/>
   <Column ss:Width="70"/>
   <Column ss:Width="130"/>
   <Column ss:Width="150"/>
   <Column ss:Width="120"/>
   <Column ss:Width="110"/>
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   <Column ss:Width="80"/>
   <Column ss:Width="220"/>

   <Row ss:Height="24">
    <Cell ss:StyleID="Header"><Data ss:Type="String">ID</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Status</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Categoria</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Nº Sienge</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Empresa / Fornecedor</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Obra</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Disciplina</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Subdisciplina</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Valor Original</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Total Aditivos</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Valor Vigente</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Valor Medido</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Saldo a Medir</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">% Medido</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Detalhes Distrato / Obs</Data></Cell>
   </Row>

   ${contratos.map((c) => {
     const statusStyle = c.status === 'Distratado' ? 'BadgeDistrato' : 'BadgeAtivo';
     const distratoTxt = c.distrato
       ? `Distratado em ${formatDateBR(c.distrato.data)}: ${c.distrato.motivo}${c.distrato.observacoes ? ` (${c.distrato.observacoes})` : ''}`
       : '';

     return `
   <Row>
    <Cell ss:StyleID="Center"><Data ss:Type="String">${escapeXml(c.id)}</Data></Cell>
    <Cell ss:StyleID="${statusStyle}"><Data ss:Type="String">${escapeXml(c.status || 'Ativo')}</Data></Cell>
    <Cell ss:StyleID="Center"><Data ss:Type="String">${escapeXml(c.categoria || 'Projeto')}</Data></Cell>
    <Cell ss:StyleID="Center"><Data ss:Type="String">${escapeXml(c.num_sienge || '-')}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(c.empresa)}</Data></Cell>
    <Cell ss:StyleID="Center"><Data ss:Type="String">${escapeXml(c.obra)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(c.disciplina)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(c.subdisciplina)}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${c.valor_original ?? c.valor_contrato}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${c.valor_aditivos || 0}</Data></Cell>
    <Cell ss:StyleID="CurrencyBold"><Data ss:Type="Number">${c.valor_contrato}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${c.valor_medido}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${c.saldo_a_medir}</Data></Cell>
    <Cell ss:StyleID="Percent"><Data ss:Type="Number">${c.percentual_medido || 0}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(distratoTxt)}</Data></Cell>
   </Row>`;
   }).join('')}
  </Table>
 </Worksheet>

 <!-- 3. ABA TERMOS ADITIVOS -->
 <Worksheet ss:Name="tbAditivos">
  <Table ss:DefaultRowHeight="18">
   <Column ss:Width="90"/>
   <Column ss:Width="200"/>
   <Column ss:Width="70"/>
   <Column ss:Width="80"/>
   <Column ss:Width="90"/>
   <Column ss:Width="80"/>
   <Column ss:Width="120"/>
   <Column ss:Width="100"/>
   <Column ss:Width="300"/>

   <Row ss:Height="24">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Contrato ID</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Empresa</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Obra</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Nº Aditivo</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Data</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Tipo</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Valor Aditivo</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Novo Prazo</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Justificativa / Escopo</Data></Cell>
   </Row>

   ${todosAditivos.length === 0 ? `
   <Row>
    <Cell ss:MergeAcross="8" ss:StyleID="Center"><Data ss:Type="String">Nenhum termo aditivo cadastrado.</Data></Cell>
   </Row>` : todosAditivos.map(a => `
   <Row>
    <Cell ss:StyleID="Center"><Data ss:Type="String">${escapeXml(a.contrato_id)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(a.empresa)}</Data></Cell>
    <Cell ss:StyleID="Center"><Data ss:Type="String">${escapeXml(a.obra)}</Data></Cell>
    <Cell ss:StyleID="Center"><Data ss:Type="Number">${a.numero}</Data></Cell>
    <Cell ss:StyleID="Date"><Data ss:Type="String">${formatDateBR(a.data)}</Data></Cell>
    <Cell ss:StyleID="Center"><Data ss:Type="String">${escapeXml(a.tipo)}</Data></Cell>
    <Cell ss:StyleID="CurrencyBold"><Data ss:Type="Number">${a.valor}</Data></Cell>
    <Cell ss:StyleID="Date"><Data ss:Type="String">${formatDateBR(a.novo_prazo) || '-'}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(a.descricao)}</Data></Cell>
   </Row>`).join('')}
  </Table>
 </Worksheet>

 <!-- 4. ABA MEDIÇÕES -->
 <Worksheet ss:Name="tbMedicoes">
  <Table ss:DefaultRowHeight="18">
   <Column ss:Width="80"/>
   <Column ss:Width="90"/>
   <Column ss:Width="200"/>
   <Column ss:Width="70"/>
   <Column ss:Width="220"/>
   <Column ss:Width="70"/>
   <Column ss:Width="120"/>
   <Column ss:Width="90"/>
   <Column ss:Width="90"/>
   <Column ss:Width="80"/>
   <Column ss:Width="90"/>
   <Column ss:Width="80"/>
   <Column ss:Width="100"/>

   <Row ss:Height="24">
    <Cell ss:StyleID="Header"><Data ss:Type="String">ID Medição</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Contrato</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Empresa</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Obra</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Etapa / Descrição</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">% Etapa</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Valor Medição</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Data Prevista</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Data Medição</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Mês Comp.</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Status</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">NF</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Data Pagto</Data></Cell>
   </Row>

   ${medicoes.map((m) => `
   <Row>
    <Cell ss:StyleID="Center"><Data ss:Type="String">${escapeXml(m.id)}</Data></Cell>
    <Cell ss:StyleID="Center"><Data ss:Type="String">${escapeXml(m.contrato_id)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(m.empresa)}</Data></Cell>
    <Cell ss:StyleID="Center"><Data ss:Type="String">${escapeXml(m.obra)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(m.etapa)}</Data></Cell>
    <Cell ss:StyleID="Percent"><Data ss:Type="Number">${m.percentual}</Data></Cell>
    <Cell ss:StyleID="CurrencyBold"><Data ss:Type="Number">${m.valor_medicao}</Data></Cell>
    <Cell ss:StyleID="Date"><Data ss:Type="String">${formatDateBR(m.data_prevista)}</Data></Cell>
    <Cell ss:StyleID="Date"><Data ss:Type="String">${formatDateBR(m.data_medicao)}</Data></Cell>
    <Cell ss:StyleID="Center"><Data ss:Type="String">${escapeXml(m.mes_competencia || '-')}</Data></Cell>
    <Cell ss:StyleID="Center"><Data ss:Type="String">${escapeXml(m.status)}</Data></Cell>
    <Cell ss:StyleID="Center"><Data ss:Type="String">${escapeXml(m.nf || '-')}</Data></Cell>
    <Cell ss:StyleID="Date"><Data ss:Type="String">${formatDateBR(m.data_pagamento)}</Data></Cell>
   </Row>`).join('')}
  </Table>
 </Worksheet>

 <!-- 5. ABA ORÇAMENTO BASE -->
 <Worksheet ss:Name="tbOrcamentoBase">
  <Table ss:DefaultRowHeight="18">
   <Column ss:Width="70"/>
   <Column ss:Width="160"/>
   <Column ss:Width="90"/>
   <Column ss:Width="140"/>
   <Column ss:Width="150"/>
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   <Column ss:Width="100"/>

   <Row ss:Height="24">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Obra</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Nome Empreendimento</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Categoria</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Disciplina</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Subdisciplina</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Orçamento Base</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Valor Contratado</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Saldo a Contratar</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Valor Medido</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Saldo Medição</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Status</Data></Cell>
   </Row>

   ${orcamentos.map((o) => `
   <Row>
    <Cell ss:StyleID="Center"><Data ss:Type="String">${escapeXml(o.obra)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(o.nome_obra || o.obra)}</Data></Cell>
    <Cell ss:StyleID="Center"><Data ss:Type="String">${escapeXml(o.categoria || 'Projeto')}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(o.disciplina)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(o.subdisciplina)}</Data></Cell>
    <Cell ss:StyleID="CurrencyBold"><Data ss:Type="Number">${o.orcamento_base}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${o.valor_contratado}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${o.saldo_a_contratar}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${o.valor_medido}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${o.saldo_medicao}</Data></Cell>
    <Cell ss:StyleID="Center"><Data ss:Type="String">${escapeXml(o.status)}</Data></Cell>
   </Row>`).join('')}
  </Table>
 </Worksheet>

 <!-- 6. ABA CURVA DESEMBOLSO (CURVA S) -->
 <Worksheet ss:Name="CurvaDesembolso_S">
  <Table ss:DefaultRowHeight="18">
   <Column ss:Width="80"/>
   <Column ss:Width="90"/>
   <Column ss:Width="130"/>
   <Column ss:Width="130"/>
   <Column ss:Width="130"/>
   <Column ss:Width="140"/>
   <Column ss:Width="140"/>

   <Row ss:Height="24">
    <Cell ss:StyleID="Header"><Data ss:Type="String">Mês Comp.</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Mês Extenso</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Previsto Mensal</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Realizado Mensal</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Total Mês</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Acumulado Previsto</Data></Cell>
    <Cell ss:StyleID="Header"><Data ss:Type="String">Acumulado Realizado</Data></Cell>
   </Row>

   ${curvaPontos.map((p) => `
   <Row>
    <Cell ss:StyleID="Center"><Data ss:Type="String">${escapeXml(p.mes)}</Data></Cell>
    <Cell ss:StyleID="Center"><Data ss:Type="String">${escapeXml(p.mesFormatado)}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${p.previsto}</Data></Cell>
    <Cell ss:StyleID="CurrencyBold"><Data ss:Type="Number">${p.realizado}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${p.total}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${p.acumuladoPrevisto}</Data></Cell>
    <Cell ss:StyleID="CurrencyBold"><Data ss:Type="Number">${p.acumuladoRealizado}</Data></Cell>
   </Row>`).join('')}
  </Table>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', nomeArquivo);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
