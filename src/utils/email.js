/**
 * Módulo de envío de emails
 * Configuración para notificaciones de movimientos nuevos en PJUD
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuración del transporter (puede ser Gmail, SMTP, etc.)
let transporter = null;

function initTransporter() {
    if (transporter) return transporter;

    // Configuración desde variables de entorno
    const config = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros puertos
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    };

    // Si no hay configuración, usar modo de prueba (no envía emails reales)
    if (!config.auth.user || !config.auth.pass) {
        console.warn('⚠️  SMTP no configurado. Usando modo de prueba (emails no se enviarán realmente).');
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            auth: {
                user: 'test@ethereal.email',
                pass: 'test'
            }
        });
    } else {
        transporter = nodemailer.createTransport(config);
    }

    return transporter;
}

/**
 * Genera el HTML del email para notificar movimientos nuevos
 */
function generarEmailMovimientosNuevos(causa, movimientosNuevos, clienteEmail, clienteNombre) {
    const rit = causa.rit;
    const caratulado = causa.caratulado || 'Sin caratulado';
    const tribunal = causa.tribunal_nombre || causa.tribunal || 'Sin tribunal';
    
    let movimientosHTML = '';
    movimientosNuevos.forEach((mov, idx) => {
        movimientosHTML += `
            <tr style="border-bottom: 1px solid #e0e0e0;">
                <td style="padding: 12px; background: ${idx % 2 === 0 ? '#f9f9f9' : '#ffffff'};">
                    <strong>Folio:</strong> ${mov.folio || mov.indice || '-'}
                </td>
                <td style="padding: 12px; background: ${idx % 2 === 0 ? '#f9f9f9' : '#ffffff'};">
                    <strong>Fecha:</strong> ${mov.fecha || '-'}
                </td>
                <td style="padding: 12px; background: ${idx % 2 === 0 ? '#f9f9f9' : '#ffffff'};">
                    <strong>Etapa:</strong> ${mov.etapa || '-'}
                </td>
            </tr>
            <tr style="border-bottom: 1px solid #e0e0e0;">
                <td colspan="3" style="padding: 12px; background: ${idx % 2 === 0 ? '#f9f9f9' : '#ffffff'};">
                    <strong>Descripción:</strong> ${mov.descripcion || mov.desc_tramite || '-'}
                </td>
            </tr>
        `;
    });

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1a237e 0%, #0d47a1 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 20px; border: 1px solid #e0e0e0; }
        .footer { background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 24px; background: #1a237e; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .highlight { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2 style="margin: 0;">🔔 Nuevos Movimientos en Causa Judicial</h2>
        </div>
        <div class="content">
            <p>Estimado/a <strong>${clienteNombre || 'Cliente'}</strong>,</p>
            
            <p>Le informamos que se han detectado <strong>${movimientosNuevos.length} movimiento(s) nuevo(s)</strong> en la causa:</p>
            
            <div class="highlight">
                <strong>RIT:</strong> ${rit}<br>
                <strong>Caratulado:</strong> ${caratulado}<br>
                <strong>Tribunal:</strong> ${tribunal}
            </div>

            <h3 style="color: #1a237e; margin-top: 25px;">Movimientos Nuevos:</h3>
            <table>
                ${movimientosHTML}
            </table>

            <p style="margin-top: 20px;">
                <a href="${process.env.APP_URL || 'http://localhost:3000'}/demo?rit=${rit}" class="button">
                    Ver Detalle Completo
                </a>
            </p>

            <p style="margin-top: 20px; font-size: 12px; color: #666;">
                Este es un email automático generado por el sistema de monitoreo de causas judiciales.
                Por favor, no responda a este correo.
            </p>
        </div>
        <div class="footer">
            <p style="margin: 0;">
                <strong>Soporte:</strong> Comunidad Virtual Limitada 2026 - +56 9 8509 1252<br>
                Sistema de Consulta de Causas Judiciales
            </p>
        </div>
    </div>
</body>
</html>
    `;
}

/**
 * Envía email de notificación de movimientos nuevos
 */
async function enviarNotificacionMovimientos(causa, movimientosNuevos, clienteEmail, clienteNombre) {
    try {
        const transporter = initTransporter();
        
        if (!clienteEmail) {
            console.warn(`⚠️  No hay email configurado para la causa ${causa.rit}`);
            return { enviado: false, error: 'Email no configurado' };
        }

        const emailHTML = generarEmailMovimientosNuevos(causa, movimientosNuevos, clienteEmail, clienteNombre);
        
        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@pjud-scraping.local',
            to: clienteEmail,
            subject: `🔔 Nuevos Movimientos - Causa ${causa.rit}`,
            html: emailHTML,
            text: `Nuevos movimientos detectados en la causa ${causa.rit}. Total: ${movimientosNuevos.length} movimiento(s).`
        };

        const info = await transporter.sendMail(mailOptions);
        
        console.log(`✅ Email enviado a ${clienteEmail} para causa ${causa.rit}`);
        return { enviado: true, messageId: info.messageId };
    } catch (error) {
        console.error(`❌ Error enviando email a ${clienteEmail}:`, error.message);
        return { enviado: false, error: error.message };
    }
}

/**
 * Envía email de prueba
 */
async function enviarEmailPrueba(destinatario) {
    try {
        const transporter = initTransporter();
        
        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@pjud-scraping.local',
            to: destinatario,
            subject: 'Prueba - Sistema de Notificaciones PJUD',
            html: `
                <h2>Email de Prueba</h2>
                <p>Este es un email de prueba del sistema de notificaciones de causas judiciales.</p>
                <p>Si recibes este correo, la configuración de email está funcionando correctamente.</p>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        return { enviado: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error enviando email de prueba:', error);
        return { enviado: false, error: error.message };
    }
}

module.exports = {
    enviarNotificacionMovimientos,
    enviarEmailPrueba,
    initTransporter
};
