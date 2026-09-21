import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function extract() {
  const data = new Uint8Array(fs.readFileSync('admingtp,+MANSO_MITIDIERI+-+103-+123 (1).pdf'));
  const doc = await pdfjsLib.getDocument({ data }).promise;
  console.log('Pages:', doc.numPages);
  
  let fullText = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str).join(' ');
    fullText += `\n--- PÁGINA ${i} ---\n` + strings;
  }
  
  fs.writeFileSync('scratch/manso_text.txt', fullText, 'utf8');
  console.log('Extraído com sucesso! Tamanho:', fullText.length);
}

extract().catch(console.error);
