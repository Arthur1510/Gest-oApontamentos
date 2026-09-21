import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.resolve(process.cwd(), 'figuras_relatorio');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function run() {
  console.log('Iniciando Chromium via Playwright no MODO CLARO...');
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1.5,
    colorScheme: 'light',
  });

  // Garante que o tema claro fique gravado no localStorage e no HTML
  await context.addInitScript(() => {
    try {
      window.localStorage.setItem('theme', 'light');
    } catch (e) {}
  });

  const page = await context.newPage();
  const BASE_URL = 'http://localhost:3000';

  // Função auxiliar para forçar e assegurar o tema claro em qualquer página
  const ensureLightMode = async () => {
    await page.evaluate(() => {
      localStorage.setItem('theme', 'light');
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    });

    // Se o botão de tema ainda exibir sol (indicando dark no componente), clica nele
    const sunBtn = page.locator('button:has(svg.lucide-sun)').first();
    if (await sunBtn.isVisible()) {
      await sunBtn.click();
      await page.waitForTimeout(500);
    }
  };

  try {
    // 1. Painel Principal de Apontamentos (Tema Claro)
    console.log('1. Acessando o Painel Principal de Apontamentos...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await ensureLightMode();
    await page.waitForTimeout(1000);

    const fig1Path = path.join(OUTPUT_DIR, 'figura_4_1_painel_apontamentos.png');
    await page.screenshot({ path: fig1Path });
    console.log(`[OK] Salvo (Tema Claro): ${fig1Path}`);

    // 2. Modal de Detalhes do Apontamento (Tema Claro com Pop-up Aberto)
    console.log('2. Abrindo o Modal de Detalhes do Apontamento no Tema Claro...');
    const eyeBtn = page.locator('button[title="Ver Detalhes"]').first();
    await eyeBtn.waitFor({ state: 'visible', timeout: 5000 });
    await eyeBtn.click();
    
    await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 6000 });
    await page.waitForTimeout(1500);

    const fig1bPath = path.join(OUTPUT_DIR, 'figura_4_1b_modal_detalhes.png');
    await page.screenshot({ path: fig1bPath });
    console.log(`[OK] Modal de Detalhes capturado (Tema Claro): ${fig1bPath}`);

    // Fechar modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(800);

    // 3. Módulo ARCIS / Conflitos RSC (Tema Claro)
    console.log('3. Acessando Módulo ARCIS / Conflitos RSC...');
    await page.goto(`${BASE_URL}/arcis`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await ensureLightMode();
    await page.waitForTimeout(1000);

    const fig2Path = path.join(OUTPUT_DIR, 'figura_4_2_modulo_rsc_arcis.png');
    await page.screenshot({ path: fig2Path });
    console.log(`[OK] Salvo (Tema Claro): ${fig2Path}`);

    // 3b. Pop-up de Importação de PDF RSC (Tema Claro)
    console.log('3b. Abrindo popup de importação de PDF RSC...');
    const importBtn = page.locator('button:has-text("Importar PDF RSC")').first();
    if (await importBtn.isVisible()) {
      await importBtn.click();
      await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 5000 });
      await page.waitForTimeout(1200);
      const fig2bPath = path.join(OUTPUT_DIR, 'figura_4_2b_modal_importacao_rsc.png');
      await page.screenshot({ path: fig2bPath });
      console.log(`[OK] Popup de importação RSC capturado (Tema Claro): ${fig2bPath}`);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(800);
    }

    // 4. Modo Apresentação Executiva (Tema Claro)
    console.log('4. Acessando Modo Apresentação Executiva...');
    await page.goto(`${BASE_URL}/apresentacao`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await ensureLightMode();
    await page.waitForTimeout(1000);

    const nextBtn = page.locator('button:has-text("Próximo"), button[title*="Próximo"], button:has(svg.lucide-chevron-right)').last();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(1000);
    }
    const fig3Path = path.join(OUTPUT_DIR, 'figura_4_3_apresentacao_slides.png');
    await page.screenshot({ path: fig3Path });
    console.log(`[OK] Salvo (Tema Claro): ${fig3Path}`);

    // 5. Dashboard Gerencial / KPIs e Gráficos (Tema Claro)
    console.log('5. Acessando Dashboard Gerencial no Tema Claro...');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await ensureLightMode();
    await page.waitForTimeout(1500); // Aguarda renderização dos gráficos Recharts
    const fig4Path = path.join(OUTPUT_DIR, 'figura_4_4_dashboard_indicadores.png');
    await page.screenshot({ path: fig4Path });
    console.log(`[OK] Salvo (Tema Claro): ${fig4Path}`);

    // 6. Módulo de Relatórios Técnicos A4 (Tema Claro)
    console.log('6. Acessando Módulo de Relatórios Técnicos...');
    await page.goto(`${BASE_URL}/relatorios`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await ensureLightMode();
    await page.waitForTimeout(1500);
    const fig5Path = path.join(OUTPUT_DIR, 'figura_4_5_relatorio_a4.png');
    await page.screenshot({ path: fig5Path });
    console.log(`[OK] Salvo (Tema Claro): ${fig5Path}`);

    console.log('Todas as telas foram capturadas no TEMA CLARO com sucesso!');
  } catch (error) {
    console.error('Erro durante a execução do Playwright:', error);
  } finally {
    await browser.close();
  }
}

run();
