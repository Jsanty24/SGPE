import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@sgpe.online';
const FROM_NAME = 'SGPE';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://sgpe.online';
const API_URL = process.env.API_URL || 'https://sgpe-production-9cf0.up.railway.app';

const COLOR_BG = '#0a0a0f';
const COLOR_CARD = '#12121a';
const COLOR_BORDER = '#1e1e2e';
const COLOR_TEXT = '#e4e4e7';
const COLOR_MUTED = '#71717a';
const COLOR_ACCENT = '#a78bfa';
const COLOR_ACCENT_GLOW = 'rgba(167,139,250,0.15)';

function layout(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:${COLOR_BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr>
      <td style="padding:48px 0 32px;text-align:center;">
        <div style="display:inline-block;width:40px;height:40px;background:linear-gradient(135deg,${COLOR_ACCENT},#6d28d9);border-radius:12px;line-height:40px;font-size:20px;font-weight:700;color:white;letter-spacing:0;box-shadow:0 0 40px ${COLOR_ACCENT_GLOW};">S</div>
        <p style="color:${COLOR_MUTED};margin:12px 0 0;font-size:11px;font-weight:500;letter-spacing:3px;text-transform:uppercase;">SGPE</p>
      </td>
    </tr>
    <tr>
      <td style="background:${COLOR_CARD};padding:48px 40px;border:1px solid ${COLOR_BORDER};border-radius:16px;">
        ${content}
      </td>
    </tr>
    <tr>
      <td style="padding:32px 40px;text-align:center;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-bottom:12px;">
              <a href="${FRONTEND_URL}" style="color:${COLOR_MUTED};font-size:12px;text-decoration:none;margin:0 10px;">Inicio</a>
              <span style="color:${COLOR_BORDER};">·</span>
              <a href="${FRONTEND_URL}/dashboard" style="color:${COLOR_MUTED};font-size:12px;text-decoration:none;margin:0 10px;">Dashboard</a>
              <span style="color:${COLOR_BORDER};">·</span>
              <a href="${FRONTEND_URL}/perfil" style="color:${COLOR_MUTED};font-size:12px;text-decoration:none;margin:0 10px;">Perfil</a>
            </td>
          </tr>
        </table>
        <p style="color:#3f3f46;font-size:11px;margin:4px 0 0;letter-spacing:0.3px;">
          © 2026 SGPE · Todos los derechos reservados
        </p>
        <p style="color:#27272a;font-size:10px;margin:8px 0 0;letter-spacing:0.2px;">
          Este correo fue enviado automáticamente · no respondas a este mensaje
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export const enviarCorreo = async (to: string, subject: string, html: string, text?: string): Promise<void> => {
  try {
    if (!resend) {
      console.log(`[Simulado] Correo a: ${to} - Asunto: ${subject}`);
      return;
    }
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html,
      text,
    });
    console.log(`Correo enviado a: ${to}`);
  } catch (error) {
    console.error('Error al enviar correo:', error);
  }
};

export async function sendVerificationEmail(destinatario: { nombre: string; correo: string; token: string }): Promise<void> {
  const link = `${API_URL}/api/verification/confirmar/${destinatario.token}`;

  const html = layout(`
    <div style="text-align:center;margin-bottom:40px;">
      <div style="display:inline-block;width:56px;height:56px;border:1px solid ${COLOR_BORDER};border-radius:16px;line-height:56px;font-size:24px;">
        <span style="filter:grayscale(1) brightness(1.5);">&#9993;</span>
      </div>
    </div>
    <p style="color:${COLOR_MUTED};font-size:13px;margin:0 0 4px;text-align:center;letter-spacing:1px;text-transform:uppercase;">Bienvenido a SGPE</p>
    <h2 style="color:${COLOR_TEXT};font-size:22px;margin:0 0 20px;text-align:center;font-weight:500;letter-spacing:-0.3px;">${destinatario.nombre}</h2>
    <p style="color:${COLOR_MUTED};font-size:14px;line-height:1.8;text-align:center;margin:0 0 32px;max-width:380px;margin-left:auto;margin-right:auto;">
      Solo falta un paso. Confirma tu correo para comenzar a usar SGPE.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="${link}"
             style="display:inline-block;padding:13px 40px;background:${COLOR_ACCENT};color:#0a0a0f;text-decoration:none;font-size:13px;font-weight:600;border-radius:10px;letter-spacing:0.5px;">
            Confirmar correo
          </a>
        </td>
      </tr>
    </table>
    <p style="color:#3f3f46;font-size:12px;text-align:center;margin:24px 0 0;">
      O copia este enlace en tu navegador:
    </p>
    <p style="text-align:center;margin:4px 0 0;">
      <a href="${link}" style="color:${COLOR_ACCENT};font-size:11px;word-break:break-all;text-decoration:none;border-bottom:1px dotted ${COLOR_BORDER};padding-bottom:1px;">${link}</a>
    </p>
    <p style="color:#27272a;font-size:11px;text-align:center;margin:28px 0 0;letter-spacing:0.2px;">Este enlace expira en 24 horas</p>
  `);

  await enviarCorreo(destinatario.correo, 'Confirma tu correo · SGPE', html);
}

export async function sendPasswordResetEmail(destinatario: { nombre: string; correo: string; token: string }): Promise<void> {
  const link = `${FRONTEND_URL}/reset-password/${destinatario.token}`;

  const html = layout(`
    <div style="text-align:center;margin-bottom:40px;">
      <div style="display:inline-block;width:56px;height:56px;border:1px solid ${COLOR_BORDER};border-radius:16px;line-height:56px;font-size:24px;">
        <span style="filter:grayscale(1) brightness(1.5);">&#9881;</span>
      </div>
    </div>
    <p style="color:${COLOR_MUTED};font-size:13px;margin:0 0 4px;text-align:center;letter-spacing:1px;text-transform:uppercase;">Recuperaci\u00F3n de contrase\u00F1a</p>
    <h2 style="color:${COLOR_TEXT};font-size:22px;margin:0 0 20px;text-align:center;font-weight:500;letter-spacing:-0.3px;">${destinatario.nombre}</h2>
    <p style="color:${COLOR_MUTED};font-size:14px;line-height:1.8;text-align:center;margin:0 0 32px;max-width:380px;margin-left:auto;margin-right:auto;">
      Recibimos una solicitud para restablecer tu contrase\u00F1a. Hac\u00E9 clic abajo para crear una nueva.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="${link}"
             style="display:inline-block;padding:13px 40px;background:${COLOR_ACCENT};color:#0a0a0f;text-decoration:none;font-size:13px;font-weight:600;border-radius:10px;letter-spacing:0.5px;">
            Restablecer contrase\u00F1a
          </a>
        </td>
      </tr>
    </table>
    <p style="color:#3f3f46;font-size:12px;text-align:center;margin:24px 0 0;">
      O copia este enlace:
    </p>
    <p style="text-align:center;margin:4px 0 0;">
      <a href="${link}" style="color:${COLOR_ACCENT};font-size:11px;word-break:break-all;text-decoration:none;border-bottom:1px dotted ${COLOR_BORDER};padding-bottom:1px;">${link}</a>
    </p>
    <p style="color:#27272a;font-size:11px;text-align:center;margin:28px 0 0;letter-spacing:0.2px;">Este enlace expira en 1 hora</p>
    <p style="color:#3f3f46;font-size:11px;text-align:center;margin:8px 0 0;letter-spacing:0.2px;">Si no solicitaste esto, ignor\u00E1 este correo.</p>
  `);

  await enviarCorreo(destinatario.correo, 'Recuperaci\u00F3n de contrase\u00F1a · SGPE', html);
}
