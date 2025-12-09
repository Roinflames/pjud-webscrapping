const { chromium } = require('playwright');

async function startBrowser(url) {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  if (url) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  }

  return { browser, context, page };
}

module.exports = { startBrowser };
