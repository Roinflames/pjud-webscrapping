async function fillForm(page, CONFIG) {
  console.log('📝 Llenando formulario...');

  await page.selectOption('#competencia', CONFIG.competencia).catch(() => {});
  await page.selectOption('#conCorte', CONFIG.corte).catch(() => {});
  await page.selectOption('#conTribunal', CONFIG.tribunal).catch(() => {});
  await page.selectOption('#conTipoCausa', CONFIG.tipoCausa).catch(() => {});

  const [rol, año] = CONFIG.rit.split('-');
  await page.fill('#conRolCausa', rol || '').catch(() => {});
  await page.fill('#conEraCausa', año || '').catch(() => {});

  console.log("🔍 Buscando...");

  await page.click('input[value="Buscar"], button:has-text("Buscar")').catch(() => {});
}

async function openDetalle(page) {
  await page.waitForSelector('a[title="Detalle de la causa"]', { timeout: 20000 });

  console.log("🖱️ Abriendo detalle...");

  await Promise.all([
    page.waitForSelector('#modalDetalleCivil, #modalDetalleLaboral', { timeout: 15000 }),
    page.click('a[title="Detalle de la causa"]').catch(() => {}),
  ]);

  console.log("✅ Detalle cargado.");
}

module.exports = { fillForm, openDetalle };
