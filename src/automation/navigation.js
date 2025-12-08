async function closeModalIfExists(page) {
  try {
    await page.click('#close-modal', { timeout: 3000 });
  } catch (_) {}
}

async function goToConsultaCausas(page) {
  console.log("🖱️ Entrando a 'Consulta causas'...");

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {}),
    page.click('text=Consulta causas').catch(() =>
      console.warn('⚠️ No se pudo hacer clic en "Consulta causas"')
    ),
  ]);
}

module.exports = {
  closeModalIfExists,
  goToConsultaCausas
};
