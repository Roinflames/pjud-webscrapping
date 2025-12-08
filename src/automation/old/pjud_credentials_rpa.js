// ¿Qué realiza este script?
// Login al PJUD con credenciales de persona natural
const { chromium } = require('playwright');
require('dotenv').config();

(async () => {
  const RUT = process.env.OJV_RUT || '';
  const PASS = process.env.OJV_PASS || '';

  if (!RUT || !PASS) {
    console.warn("⚠️ Falta definir OJV_RUT y OJV_PASS en el archivo .env");
  }

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log("🌐 Abriendo Oficina Judicial Virtual...");
    await page.goto(process.env.OJV, { waitUntil: 'domcontentloaded' });

    // --- Paso 1: clic en botón Clave Única ---
    console.log("🔍 Esperando botón Clave Única...");
    await page.waitForSelector('#linkCU', { timeout: 15000 });
    console.log("➡️ Clic en botón Clave Única...");
    await page.click('#linkCU');

    // Esperar popup o redirección con timeout corto usando Promise.race
    const popupPromise = context.waitForEvent('page').catch(() => null);
    const navPromise = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 3000 }).catch(() => null);
    const raceResult = await Promise.race([
      popupPromise,
      navPromise,
      new Promise(r => setTimeout(() => r(null), 3000)) // fallback timeout 3s
    ]);

    let loginTarget = null;
    if (raceResult && raceResult.url) {
      console.log("🪟 Se detectó popup de Clave Única");
      loginTarget = raceResult;
      await loginTarget.waitForLoadState('domcontentloaded');
    } else if (raceResult === true) {
      console.log("🔁 Redirección interna detectada");
      loginTarget = page;
    } else {
      console.log("📄 Buscando iframe de Clave Única...");
      const frames = page.frames();
      const cuFrame = frames.find(f => f.url().includes('claveunica') || f.url().includes('openid'));
      if (cuFrame) {
        console.log("✅ Iframe de Clave Única detectado");
        loginTarget = cuFrame;
      } else {
        console.warn("⚠️ No se encontró redirección, popup ni iframe. Verifica visualmente la página.");
        loginTarget = page; // fallback a página principal
      }
    }

    // --- Paso 2: esperar campos del formulario ---
    console.log("🕵️ Esperando campos de usuario/contraseña...");
    const rutSelectors = [
      'input[name="run"]',
      'input[id="rut"]',
      'input[name="username"]',
      'input[type="text"]',
      'input[type="email"]'
    ];

    let userSel = null;
    for (const s of rutSelectors) {
      try {
        await loginTarget.waitForSelector(s, { timeout: 4000 });
        userSel = s;
        break;
      } catch {}
    }

    if (userSel) {
      console.log(`✏️ Campo de usuario detectado (${userSel})`);
      await loginTarget.click(userSel);
      await loginTarget.type(userSel, RUT, { delay: 50 });
    } else {
      console.warn("⚠️ No se encontró campo de usuario. Revisa la página manualmente.");
    }

    const passSelectors = ['input[type="password"]', 'input[name="password"]', '#password'];
    let passSel = null;
    for (const s of passSelectors) {
      try {
        await loginTarget.waitForSelector(s, { timeout: 2000 });
        passSel = s;
        break;
      } catch {}
    }

    if (passSel) {
      console.log(`✏️ Campo de contraseña detectado (${passSel})`);
      await loginTarget.click(passSel);
      await loginTarget.type(passSel, PASS, { delay: 50 });
    } else {
      console.warn("⚠️ No se encontró campo de contraseña.");
    }

    // --- Paso 3: clic en botón de envío ---
    console.log("🚀 Buscando botón de envío...");
    const sendSelectors = [
      '#login-submit',
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("INGRESA")',
      'button:has-text("Ingresar")',
      'button:has-text("Entrar")'
    ];

    let sendBtn = null;
    for (const s of sendSelectors) {
      sendBtn = await loginTarget.$(s);
      if (sendBtn) break;
    }

    if (sendBtn) {
      console.log(" Esperando que el botón esté habilitado...");
      try {
        await loginTarget.waitForFunction(() => {
          const btn = document.querySelector('#login-submit');
          return btn && !btn.disabled;
        }, { timeout: 15000 });
        console.log("✅ Botón habilitado, haciendo clic...");

        await Promise.all([
          loginTarget.waitForNavigation({ waitUntil: 'networkidle', timeout: 20000 }).catch(() => {}),
          sendBtn.click()
        ]);
      } catch (e) {
        console.warn("⚠️ El botón no se habilitó o no respondió. Intentando clic forzado...");
        await loginTarget.evaluate(() => {
          const btn = document.querySelector('#login-submit');
          if (btn) btn.click();
        });
      }
    } else {
      console.warn("⚠️ No se encontró botón de envío automático. Puede requerir acción manual.");
    }

    // --- Paso 4: manejo de OTP o CAPTCHA ---
    const otpOrCaptcha = await loginTarget.$('input[name="otp"], #captcha, iframe[title*="captcha"]');
    if (otpOrCaptcha) {
      console.log(" Se detectó OTP o CAPTCHA, resuélvelo manualmente y presiona ENTER para continuar...");
      await new Promise(resolve => process.stdin.once('data', () => resolve()));
    }

    // --- Paso 5: verificar si se inició sesión ---
    console.log("🔎 Verificando sesión iniciada...");
    await new Promise(r => setTimeout(r, 5000));

    let sessionDetected = false;
    for (const p of context.pages()) {
      const logged = await p.$('text="Cerrar sesión", text="Salir", text="Mi cuenta"');
      if (logged) {
        sessionDetected = true;
        break;
      }
    }

    if (sessionDetected) {
      console.log("✅ Sesión iniciada correctamente. Guardando storageState.json...");
      await context.storageState({ path: 'storageState.json' });
    } else {
      console.warn("⚠️ No se detectó sesión iniciada automáticamente. Revisa el flujo manualmente.");
    }

  } catch (err) {
    console.error("❌ Error general:", err);
  } finally {
    console.log("🧭 Navegador queda abierto para revisión manual. Cierra cuando termines.");
  }

})();
