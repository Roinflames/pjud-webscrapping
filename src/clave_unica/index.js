const { chromium } = require("playwright");
const path = require("path");

const { closeModalIfExists } = require('../navigation');
require("dotenv").config();

(async () => {
  const userDataDir = path.resolve(__dirname, "chrome-data");

  const browser = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: ["--start-maximized"]
  });

  const page = await browser.newPage();

  console.log("🌐 Abriendo ClaveÚnica…");

  await page.goto("https://accounts.claveunica.gob.cl/accounts/login?next=/openid/authorize%3Fclient_id%3Dd602a0071f3f4db8b37a87cffd89bf23%26redirect_uri%3Dhttps%253A%252F%252Foficinajudicialvirtual.pjud.cl%252Fclaveunica%252Freturn.php%26response_type%3Dcode%26scope%3Dopenid%2Brut%26state%3DeyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvb2ZpY2luYWp1ZGljaWFsdmlydHVhbC5wanVkLmNsIiwiYXVkIjoiaHR0cHM6XC9cL29maWNpbmFqdWRpY2lhbHZpcnR1YWwucGp1ZC5jbCIsImlhdCI6MTY1MzUyOTUxOCwiZXhwIjoxNjUzNTMwNDE4LCJkYXRhIjp7InNlc3Npb25pZCI6OTk1NzIzNjF9fQ.G0ls-jaRE1FSSknH3cAwfmbGGvAw_1bnNPTtLCzj_70");

  // Si aparece botón "Ingresar con ClaveÚnica"
  try {
    await page.click("text=Ingresar con ClaveÚnica", { timeout: 3000 });
  } catch (_) {}

  console.log("🔐 Esperando formulario de ClaveÚnica…");

  await page.waitForSelector("#login-form", { timeout: 30000 });

  // ---- AUTOCOMPLETE SEGURO ----
  const run = process.env.CLAVEUNICA_RUN;
  const pass = process.env.CLAVEUNICA_PASS;

  console.log("⌨️ Escribiendo RUN…");
  await page.click('input[name="run"]');
  await page.keyboard.type(run, { delay: 80 });

  console.log("⌨️ Escribiendo contraseña…");
  await page.click('input[name="password"]');
  await page.keyboard.type(pass, { delay: 80 });

  // Enviar formulario
  await page.click("#login-submit");

  console.log("⏳ Esperando ingreso a Oficina Judicial Virtual…");

  await closeModalIfExists(page);

  await page.waitForURL(
    url => url.href.includes("oficinajudicialvirtual"),
    { timeout: 120000 }
  );

  console.log("✅ Sesión guardada para próxima ejecución.");
})();
