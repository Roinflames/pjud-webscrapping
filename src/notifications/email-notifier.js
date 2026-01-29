/**
 * Email Notifier - Envía notificaciones por correo cuando termina el scraping
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

// Configuración del transporter (usando Gmail como ejemplo)
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD // Para Gmail: usar App Password, no contraseña normal
  }
});

/**
 * Enviar notificación de finalización del scheduler
 * @param {Object} stats - Estadísticas del scraping
 * @param {number} stats.totalProcesadas - Total de causas procesadas
 * @param {number} stats.exitosas - Causas exitosas
 * @param {number} stats.fallidas - Causas fallidas
 * @param {number} stats.iteracion - Número de iteración del scheduler
 * @param {string} stats.inicioEjecucion - Timestamp de inicio
 * @param {string} stats.finEjecucion - Timestamp de fin
 * @param {number} stats.duracionMinutos - Duración en minutos
 */
async function sendCompletionEmail(stats) {
  try {
    // Validar que hay configuración de email
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('⚠️ No hay configuración de email (EMAIL_USER y EMAIL_PASSWORD requeridos)');
      return false;
    }

    if (!process.env.EMAIL_TO) {
      console.warn('⚠️ No hay destinatario configurado (EMAIL_TO requerido)');
      return false;
    }

    const {
      totalProcesadas = 0,
      exitosas = 0,
      fallidas = 0,
      iteracion = 0,
      inicioEjecucion = 'N/A',
      finEjecucion = 'N/A',
      duracionMinutos = 0
    } = stats;

    const tasaExito = totalProcesadas > 0 ? ((exitosas / totalProcesadas) * 100).toFixed(2) : 0;
    const estado = fallidas === 0 ? '✅ EXITOSO' : fallidas > exitosas ? '❌ FALLIDO' : '⚠️ PARCIAL';

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px; }
    .stats { background: #f4f4f4; padding: 15px; margin: 20px 0; border-radius: 5px; }
    .stat-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd; }
    .stat-label { font-weight: bold; }
    .success { color: #4CAF50; font-weight: bold; }
    .failed { color: #f44336; font-weight: bold; }
    .footer { text-align: center; color: #777; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🤖 PJUD Scheduler - Iteración #${iteracion} Completada</h2>
    </div>

    <div class="stats">
      <h3>📊 Resumen de Ejecución</h3>

      <div class="stat-row">
        <span class="stat-label">Estado:</span>
        <span>${estado}</span>
      </div>

      <div class="stat-row">
        <span class="stat-label">Total Procesadas:</span>
        <span>${totalProcesadas}</span>
      </div>

      <div class="stat-row">
        <span class="stat-label">Exitosas:</span>
        <span class="success">${exitosas}</span>
      </div>

      <div class="stat-row">
        <span class="stat-label">Fallidas:</span>
        <span class="failed">${fallidas}</span>
      </div>

      <div class="stat-row">
        <span class="stat-label">Tasa de Éxito:</span>
        <span>${tasaExito}%</span>
      </div>

      <div class="stat-row">
        <span class="stat-label">Duración:</span>
        <span>${duracionMinutos.toFixed(2)} minutos</span>
      </div>

      <div class="stat-row">
        <span class="stat-label">Inicio:</span>
        <span>${inicioEjecucion}</span>
      </div>

      <div class="stat-row">
        <span class="stat-label">Fin:</span>
        <span>${finEjecucion}</span>
      </div>
    </div>

    <div class="footer">
      <p>Notificación automática del PJUD Scheduler Worker</p>
      <p>Próxima ejecución en 10 minutos</p>
    </div>
  </div>
</body>
</html>
    `.trim();

    const textContent = `
PJUD Scheduler - Iteración #${iteracion} Completada
=====================================================

Estado: ${estado}

Resumen:
- Total Procesadas: ${totalProcesadas}
- Exitosas: ${exitosas}
- Fallidas: ${fallidas}
- Tasa de Éxito: ${tasaExito}%
- Duración: ${duracionMinutos.toFixed(2)} minutos

Inicio: ${inicioEjecucion}
Fin: ${finEjecucion}

Próxima ejecución en 10 minutos.
    `.trim();

    const mailOptions = {
      from: `"PJUD Scheduler" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO,
      subject: `[PJUD] Scheduler #${iteracion} Completado - ${estado}`,
      text: textContent,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email enviado: ${info.messageId}`);
    return true;

  } catch (error) {
    console.error('❌ Error enviando email:', error.message);
    return false;
  }
}

/**
 * Verificar configuración de email
 */
function checkEmailConfig() {
  const required = ['EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_TO'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.warn('⚠️ Configuración de email incompleta. Faltan variables:');
    missing.forEach(key => console.warn(`   - ${key}`));
    return false;
  }

  console.log('✅ Configuración de email válida');
  return true;
}

module.exports = {
  sendCompletionEmail,
  checkEmailConfig
};
