import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@sgpe.online';
const FROM_NAME = 'SGPE';

export const enviarCorreo = async (to: string, subject: string, html: string, text?: string): Promise<void> => {
  try {
    if (!resend) {
      console.log(`📧 [Simulado] Correo a: ${to} - Asunto: ${subject}`);
      return;
    }
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html,
      text,
    });
    console.log(`📧 Correo enviado a: ${to}`);
  } catch (error) {
    console.error('❌ Error al enviar correo:', error);
  }
};

export async function sendWelcomeEmail(destinatario: {
  nombre: string;
  correo: string;
  rol: string;
}): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const rolLabel: Record<string, string> = {
    GERENTE: 'Gerente de Proyectos',
    MIEMBRO: 'Miembro del Equipo',
    CLIENTE: 'Cliente',
    VIEWER: 'Visitante',
  };

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f0f4ff;font-family:'Inter',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
    <tr>
      <td style="background:linear-gradient(135deg,#0d1f2d 0%,#01696f 100%);padding:32px 40px;text-align:center;border-radius:16px 16px 0 0;">
        <h1 style="color:#4fc3cb;margin:0;font-size:28px;font-weight:800;letter-spacing:2px;">SGPE</h1>
        <p style="color:#e8eaf6;margin:4px 0 0;font-size:14px;">Sistema de Gesti\u00F3n de Proyectos Empresariales</p>
      </td>
    </tr>
    <tr>
      <td style="background:#ffffff;padding:40px;border-radius:0 0 16px 16px;">
        <h2 style="color:#1a1a2e;font-size:22px;margin:0 0 16px;">\u00A1Bienvenido/a, ${destinatario.nombre}!</h2>
        <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 12px;">
          Tu cuenta ha sido creada exitosamente en el <strong>Sistema de Gesti\u00F3n de Proyectos Empresariales</strong>
          con el rol de <strong>${rolLabel[destinatario.rol] || destinatario.rol}</strong>.
        </p>
        <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
          Desde SGPE podr\u00E1s gestionar proyectos, tareas, colaborar con tu equipo y dar seguimiento al progreso de forma integral.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center">
              <a href="${frontendUrl}"
                 style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;border-radius:12px;">
                Ingresar al sistema
              </a>
            </td>
          </tr>
        </table>
        <hr style="border:0;border-top:1px solid #e2e8f0;margin:32px 0 16px;">
        <p style="color:#94a3b8;font-size:12px;text-align:center;">
          \u00A9 2026 SGPE \u2014 Sistema de Gesti\u00F3n de Proyectos Empresariales
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Bienvenido/a, ${destinatario.nombre}!\n\nTu cuenta ha sido creada exitosamente en SGPE con el rol de ${rolLabel[destinatario.rol] || destinatario.rol}.\n\nIngresa en: ${frontendUrl}\n\n(c) 2026 SGPE`;

  await enviarCorreo(destinatario.correo, 'Bienvenido/a a SGPE', html, text);
}
