import JSZip from 'jszip';
import {
  ItemOrcamento,
  Contrato,
  Medicao,
  CurvaDesembolsoPonto,
  KpiOrcamento,
  Obra,
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

export async function exportMultiSheetExcel({
  orcamentos,
  contratos,
  medicoes,
  curvaPontos,
  obras = [],
  filtroObra = '',
  filtroCategoria = 'TODAS',
  nomeArquivo = 'Relatorio_Consolidado_Orcamentos_WCC.xlsx',
}: {
  orcamentos: ItemOrcamento[];
  contratos: Contrato[];
  medicoes: Medicao[];
  curvaPontos: CurvaDesembolsoPonto[];
  obras?: Obra[];
  kpis?: KpiOrcamento;
  filtroObra?: string;
  filtroCategoria?: string;
  nomeArquivo?: string;
}) {
  // 1. Lista acumulada de aditivos
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

  // 2. Mapa consolidado de obras
  const obrasMap = new Map<string, string>();
  obras.forEach((o) => obrasMap.set(o.codigo, o.nome));
  orcamentos.forEach((o) => {
    if (o.obra && !obrasMap.has(o.obra)) obrasMap.set(o.obra, o.nome_obra || o.obra);
  });
  contratos.forEach((c) => {
    if (c.obra && !obrasMap.has(c.obra)) obrasMap.set(c.obra, c.obra);
  });

  // 3. Carregar o template mestre .xlsx
  let zip: JSZip;
  try {
    const res = await fetch('/templates/template_orcamentos_wcc.xlsx');
    if (!res.ok) throw new Error(`HTTP ${res.status} ao carregar template`);
    const arrayBuffer = await res.arrayBuffer();
    zip = await JSZip.loadAsync(arrayBuffer);
  } catch (err) {
    console.error('Falha ao carregar template .xlsx:', err);
    alert('Erro ao carregar o modelo de exportação do Excel. Verifique a conexão e tente novamente.');
    return;
  }

  // 4. Atualizar Dashboard_Resumo (sheet1.xml)
  const sheet1File = zip.file('xl/worksheets/sheet1.xml');
  if (sheet1File) {
    let sheet1Xml = await sheet1File.async('string');
    const valorObraInicial = filtroObra && obrasMap.has(filtroObra) ? filtroObra : 'TODAS';
    const valorCatInicial = !filtroCategoria || filtroCategoria === 'Todos' ? 'TODAS' : filtroCategoria;
    
    // Configura a célula B3 com o filtro de obra
    sheet1Xml = sheet1Xml.replace(
      /(<c r="B3"[^>]*>)(?:<v>[^<]*<\/v>|<is><t>[^<]*<\/t><\/is>)?(<\/c>)/,
      `$1<is><t>${escapeXml(valorObraInicial)}</t></is>$2`
    );

    // Configura a célula D3 com o filtro de categoria
    sheet1Xml = sheet1Xml.replace(
      /(<c r="D3"[^>]*>)(?:<v>[^<]*<\/v>|<is><t>[^<]*<\/t><\/is>)?(<\/c>)/,
      `$1<is><t>${escapeXml(valorCatInicial)}</t></is>$2`
    );

    zip.file('xl/worksheets/sheet1.xml', sheet1Xml);
  }

  // 5. Preencher tbOrcamentoBase (sheet2.xml)
  const sheet2File = zip.file('xl/worksheets/sheet2.xml');
  if (sheet2File) {
    let sheet2Xml = await sheet2File.async('string');
    let orcRows = '';
    orcamentos.forEach((o, idx) => {
      const r = idx + 2;
      orcRows += `<row r="${r}">` +
        `<c r="A${r}" t="inlineStr"><is><t>${escapeXml(o.obra)}</t></is></c>` +
        `<c r="B${r}" t="inlineStr"><is><t>${escapeXml(o.nome_obra || o.obra)}</t></is></c>` +
        `<c r="C${r}" t="inlineStr"><is><t>${escapeXml(o.categoria || 'Projeto')}</t></is></c>` +
        `<c r="D${r}" t="inlineStr"><is><t>${escapeXml(o.disciplina)}</t></is></c>` +
        `<c r="E${r}" t="inlineStr"><is><t>${escapeXml(o.subdisciplina)}</t></is></c>` +
        `<c r="F${r}"><v>${o.orcamento_base || 0}</v></c>` +
        `<c r="G${r}"><v>${o.valor_contratado || 0}</v></c>` +
        `<c r="H${r}"><v>${o.saldo_a_contratar || 0}</v></c>` +
        `<c r="I${r}"><v>${o.valor_medido || 0}</v></c>` +
        `<c r="J${r}"><v>${o.saldo_medicao || 0}</v></c>` +
        `<c r="K${r}" t="inlineStr"><is><t>${escapeXml(o.status || 'A contratar')}</t></is></c>` +
      `</row>`;
    });
    sheet2Xml = sheet2Xml.replace(/(<row r="1"[\s\S]*?<\/row>)([\s\S]*?)(<\/sheetData>)/, `$1${orcRows}$3`);
    zip.file('xl/worksheets/sheet2.xml', sheet2Xml);
  }

  // 6. Preencher tbContratos (sheet3.xml)
  const sheet3File = zip.file('xl/worksheets/sheet3.xml');
  if (sheet3File) {
    let sheet3Xml = await sheet3File.async('string');
    let ctRows = '';
    contratos.forEach((c, idx) => {
      const r = idx + 2;
      const distratoTxt = c.distrato
        ? `Distratado em ${formatDateBR(c.distrato.data)}: ${c.distrato.motivo}${c.distrato.observacoes ? ` (${c.distrato.observacoes})` : ''}`
        : '';
      ctRows += `<row r="${r}">` +
        `<c r="A${r}" t="inlineStr"><is><t>${escapeXml(c.id)}</t></is></c>` +
        `<c r="B${r}" t="inlineStr"><is><t>${escapeXml(c.status || 'Ativo')}</t></is></c>` +
        `<c r="C${r}" t="inlineStr"><is><t>${escapeXml(c.categoria || 'Projeto')}</t></is></c>` +
        `<c r="D${r}" t="inlineStr"><is><t>${escapeXml(c.num_sienge || '-')}</t></is></c>` +
        `<c r="E${r}" t="inlineStr"><is><t>${escapeXml(c.empresa)}</t></is></c>` +
        `<c r="F${r}" t="inlineStr"><is><t>${escapeXml(c.obra)}</t></is></c>` +
        `<c r="G${r}" t="inlineStr"><is><t>${escapeXml(c.disciplina)}</t></is></c>` +
        `<c r="H${r}" t="inlineStr"><is><t>${escapeXml(c.subdisciplina)}</t></is></c>` +
        `<c r="I${r}"><v>${c.valor_original ?? c.valor_contrato}</v></c>` +
        `<c r="J${r}"><v>${c.valor_aditivos || 0}</v></c>` +
        `<c r="K${r}"><v>${c.valor_contrato}</v></c>` +
        `<c r="L${r}"><v>${c.valor_medido || 0}</v></c>` +
        `<c r="M${r}"><v>${c.saldo_a_medir || 0}</v></c>` +
        `<c r="N${r}"><v>${c.percentual_medido || 0}</v></c>` +
        `<c r="O${r}" t="inlineStr"><is><t>${escapeXml(distratoTxt)}</t></is></c>` +
      `</row>`;
    });
    sheet3Xml = sheet3Xml.replace(/(<row r="1"[\s\S]*?<\/row>)([\s\S]*?)(<\/sheetData>)/, `$1${ctRows}$3`);
    zip.file('xl/worksheets/sheet3.xml', sheet3Xml);
  }

  // 7. Preencher tbMedicoes (sheet4.xml)
  const sheet4File = zip.file('xl/worksheets/sheet4.xml');
  if (sheet4File) {
    let sheet4Xml = await sheet4File.async('string');
    const contratoCategoriaMap = new Map<string, string>();
    contratos.forEach((c) => {
      contratoCategoriaMap.set(c.id, c.categoria || 'Projeto');
    });

    let medRows = '';
    medicoes.forEach((m, idx) => {
      const r = idx + 2;
      const cat = contratoCategoriaMap.get(m.contrato_id) || 'Projeto';
      medRows += `<row r="${r}">` +
        `<c r="A${r}" t="inlineStr"><is><t>${escapeXml(m.id)}</t></is></c>` +
        `<c r="B${r}" t="inlineStr"><is><t>${escapeXml(m.contrato_id)}</t></is></c>` +
        `<c r="C${r}" t="inlineStr"><is><t>${escapeXml(m.empresa)}</t></is></c>` +
        `<c r="D${r}" t="inlineStr"><is><t>${escapeXml(m.obra)}</t></is></c>` +
        `<c r="E${r}" t="inlineStr"><is><t>${escapeXml(m.etapa)}</t></is></c>` +
        `<c r="F${r}"><v>${m.percentual || 0}</v></c>` +
        `<c r="G${r}"><v>${m.valor_medicao || 0}</v></c>` +
        `<c r="H${r}" t="inlineStr"><is><t>${formatDateBR(m.data_prevista)}</t></is></c>` +
        `<c r="I${r}" t="inlineStr"><is><t>${formatDateBR(m.data_medicao)}</t></is></c>` +
        `<c r="J${r}" t="inlineStr"><is><t>${escapeXml(m.mes_competencia || '-')}</t></is></c>` +
        `<c r="K${r}" t="inlineStr"><is><t>${escapeXml(m.status)}</t></is></c>` +
        `<c r="L${r}" t="inlineStr"><is><t>${escapeXml(m.nf || '-')}</t></is></c>` +
        `<c r="M${r}" t="inlineStr"><is><t>${formatDateBR(m.data_pagamento)}</t></is></c>` +
        `<c r="N${r}" t="inlineStr"><is><t>${escapeXml(cat)}</t></is></c>` +
      `</row>`;
    });
    sheet4Xml = sheet4Xml.replace(/(<row r="1"[\s\S]*?<\/row>)([\s\S]*?)(<\/sheetData>)/, `$1${medRows}$3`);
    zip.file('xl/worksheets/sheet4.xml', sheet4Xml);
  }

  // 8. Preencher tbAditivos (sheet5.xml)
  const sheet5File = zip.file('xl/worksheets/sheet5.xml');
  if (sheet5File) {
    let sheet5Xml = await sheet5File.async('string');
    let aditRows = '';
    todosAditivos.forEach((a, idx) => {
      const r = idx + 2;
      aditRows += `<row r="${r}">` +
        `<c r="A${r}" t="inlineStr"><is><t>${escapeXml(a.contrato_id)}</t></is></c>` +
        `<c r="B${r}" t="inlineStr"><is><t>${escapeXml(a.empresa)}</t></is></c>` +
        `<c r="C${r}" t="inlineStr"><is><t>${escapeXml(a.obra)}</t></is></c>` +
        `<c r="D${r}"><v>${a.numero}</v></c>` +
        `<c r="E${r}" t="inlineStr"><is><t>${formatDateBR(a.data)}</t></is></c>` +
        `<c r="F${r}" t="inlineStr"><is><t>${escapeXml(a.tipo)}</t></is></c>` +
        `<c r="G${r}"><v>${a.valor || 0}</v></c>` +
        `<c r="H${r}" t="inlineStr"><is><t>${formatDateBR(a.novo_prazo) || '-'}</t></is></c>` +
        `<c r="I${r}" t="inlineStr"><is><t>${escapeXml(a.descricao)}</t></is></c>` +
      `</row>`;
    });
    sheet5Xml = sheet5Xml.replace(/(<row r="1"[\s\S]*?<\/row>)([\s\S]*?)(<\/sheetData>)/, `$1${aditRows}$3`);
    zip.file('xl/worksheets/sheet5.xml', sheet5Xml);
  }

  // 9. Preencher tbCurvaS (sheet6.xml)
  const sheet6File = zip.file('xl/worksheets/sheet6.xml');
  if (sheet6File) {
    let sheet6Xml = await sheet6File.async('string');
    let curvaRows = '';
    curvaPontos.forEach((p, idx) => {
      const r = idx + 2;
      curvaRows += `<row r="${r}">` +
        `<c r="A${r}" t="inlineStr"><is><t>${escapeXml(p.mes)}</t></is></c>` +
        `<c r="B${r}" t="inlineStr"><is><t>${escapeXml(p.mesFormatado)}</t></is></c>` +
        `<c r="C${r}"><v>${p.previsto || 0}</v></c>` +
        `<c r="D${r}"><v>${p.realizado || 0}</v></c>` +
        `<c r="E${r}"><v>${p.total || 0}</v></c>` +
        `<c r="F${r}"><v>${p.acumuladoPrevisto || 0}</v></c>` +
        `<c r="G${r}"><v>${p.acumuladoRealizado || 0}</v></c>` +
        `<c r="H${r}"><v>${p.acumuladoTotal || 0}</v></c>` +
      `</row>`;
    });
    sheet6Xml = sheet6Xml.replace(/(<row r="1"[\s\S]*?<\/row>)([\s\S]*?)(<\/sheetData>)/, `$1${curvaRows}$3`);
    zip.file('xl/worksheets/sheet6.xml', sheet6Xml);
  }

  // 10. Preencher tbObras (sheet7.xml)
  const sheet7File = zip.file('xl/worksheets/sheet7.xml');
  if (sheet7File) {
    let sheet7Xml = await sheet7File.async('string');
    let obrasRows = `<row r="2"><c r="A2" t="inlineStr"><is><t>TODAS</t></is></c><c r="B2" t="inlineStr"><is><t>Todas as Obras Consolidadas</t></is></c></row>`;
    let r = 3;
    obrasMap.forEach((nome, codigo) => {
      obrasRows += `<row r="${r}"><c r="A${r}" t="inlineStr"><is><t>${escapeXml(codigo)}</t></is></c><c r="B${r}" t="inlineStr"><is><t>${escapeXml(nome)}</t></is></c></row>`;
      r++;
    });
    sheet7Xml = sheet7Xml.replace(/(<row r="1"[\s\S]*?<\/row>)([\s\S]*?)(<\/sheetData>)/, `$1${obrasRows}$3`);
    zip.file('xl/worksheets/sheet7.xml', sheet7Xml);
  }

  // 11. Gerar e disparar o download do arquivo .xlsx
  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', nomeArquivo.endsWith('.xlsx') ? nomeArquivo : `${nomeArquivo}.xlsx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
