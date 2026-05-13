import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@sgpe.online';
const FROM_NAME = 'SGPE';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://sgpe.online';

const COLOR_PRIMARY = '#6366f1';
const COLOR_SECONDARY = '#8b5cf6';
const COLOR_DARK = '#0f172a';
const COLOR_ACCENT = '#06b6d4';

function layout(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
    <tr>
      <td style="background:linear-gradient(135deg,${COLOR_DARK} 0%,#1e293b 100%);padding:36px 40px;text-align:center;border-radius:20px 20px 0 0;">
        <div style="display:inline-block;width:56px;height:56px;background:linear-gradient(135deg,${COLOR_PRIMARY},${COLOR_SECONDARY});border-radius:16px;margin-bottom:12px;line-height:56px;font-size:28px;font-weight:900;color:white;">S</div>
        <h1 style="color:#e2e8f0;margin:0;font-size:24px;font-weight:700;letter-spacing:1px;">SGPE</h1>
        <p style="color:#64748b;margin:4px 0 0;font-size:13px;">Sistema de Gesti\u00F3n de Proyectos</p>
      </td>
    </tr>
    <tr>
      <td style="background:#ffffff;padding:40px;border-radius:0 0 20px 20px;">
        ${content}
        <hr style="border:0;border-top:1px solid #e2e8f0;margin:32px 0 20px;">
        <table width="100%">
          <tr>
            <td style="text-align:center;padding:0 0 8px 0;">
              <a href="${FRONTEND_URL}" style="color:${COLOR_PRIMARY};font-size:13px;text-decoration:none;margin:0 12px;">Inicio</a>
              <span style="color:#cbd5e1;">|</span>
              <a href="${FRONTEND_URL}/dashboard" style="color:${COLOR_PRIMARY};font-size:13px;text-decoration:none;margin:0 12px;">Dashboard</a>
              <span style="color:#cbd5e1;">|</span>
              <a href="${FRONTEND_URL}/perfil" style="color:${COLOR_PRIMARY};font-size:13px;text-decoration:none;margin:0 12px;">Mi Cuenta</a>
            </td>
          </tr>
        </table>
        <p style="color:#94a3b8;font-size:11px;text-align:center;margin:12px 0 0;">
          \u00A9 2026 SGPE \u2014 Todos los derechos reservados<br>
          <span style="color:#64748b;">Este correo fue enviado autom\u00E1ticamente, por favor no respondas a este mensaje.</span>
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
      console.log(`\uD83D\uDCE7 [Simulado] Correo a: ${to} - Asunto: ${subject}`);
      return;
    }
    await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject,
      html,
      text,
    });
    console.log(`\uD83D\uDCE7 Correo enviado a: ${to}`);
  } catch (error) {
    console.error('\u274C Error al enviar correo:', error);
  }
};

export async function sendWelcomeEmail(destinatario: { nombre: string; correo: string; rol: string }): Promise<void> {
  const rolLabel: Record<string, string> = {
    GERENTE: 'Gerente de Proyectos',
    MIEMBRO: 'Miembro del Equipo',
    CLIENTE: 'Cliente',
    VIEWER: 'Visitante',
  };

  const html = layout(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;width:72px;height:72px;background:linear-gradient(135deg,#22c55e,#16a34a);border-radius:50%;line-height:72px;font-size:36px;">🎉</div>
    </div>
    <h2 style="color:#0f172a;font-size:24px;margin:0 0 8px;text-align:center;">¡Bienvenido, ${destinatario.nombre}!</h2>
    <p style="color:#64748b;font-size:15px;line-height:1.7;text-align:center;margin:0 0 24px;">
      Tu cuenta ha sido creada en <strong style="color:${COLOR_PRIMARY};">SGPE</strong> con el rol 
      <strong style="color:#0f172a;background:#f1f5f9;padding:2px 10px;border-radius:6px;">${rolLabel[destinatario.rol] || destinatario.rol}</strong>
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;padding:20px;margin:0 0 24px;">
      <tr>
        <td style="width:33%;text-align:center;padding:8px;">
          <div style="font-size:28px;margin-bottom:4px;">📋</div>
          <div style="color:#475569;font-size:12px;font-weight:600;">Proyectos</div>
          <div style="color:#94a3b8;font-size:11px;">Crea y gestiona</div>
        </td>
        <td style="width:33%;text-align:center;padding:8px;">
          <div style="font-size:28px;margin-bottom:4px;">✅</div>
          <div style="color:#475569;font-size:12px;font-weight:600;">Tareas</div>
          <div style="color:#94a3b8;font-size:11px;">Organiza y avanza</div>
        </td>
        <td style="width:33%;text-align:center;padding:8px;">
          <div style="font-size:28px;margin-bottom:4px;">🤝</div>
          <div style="color:#475569;font-size:12px;font-weight:600;">Equipo</div>
          <div style="color:#94a3b8;font-size:11px;">Colabora en tiempo real</div>
        </td>
      </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="${FRONTEND_URL}"
             style="display:inline-block;padding:14px 48px;background:linear-gradient(135deg,${COLOR_PRIMARY},${COLOR_SECONDARY});color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;border-radius:12px;box-shadow:0 4px 14px rgba(99,102,241,0.4);">
            🚀 Ir a SGPE
          </a>
        </td>
      </tr>
    </table>
  `);

  await enviarCorreo(destinatario.correo, '🎉 ¡Bienvenido a SGPE!', html);
}

export async function sendVerificationEmail(destinatario: { nombre: string; correo: string; token: string }): Promise<void> {
  const link = `${FRONTEND_URL}/verificar-email/${destinatario.token}`;

  const html = layout(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;width:72px;height:72px;background:linear-gradient(135deg,${COLOR_ACCENT},#0284c7);border-radius:50%;line-height:72px;font-size:36px;">✉️</div>
    </div>
    <h2 style="color:#0f172a;font-size:24px;margin:0 0 8px;text-align:center;">Verifica tu correo</h2>
    <p style="color:#64748b;font-size:15px;line-height:1.7;text-align:center;margin:0 0 8px;">
      Hola <strong>${destinatario.nombre}</strong>, gracias por registrarte en SGPE.
    </p>
    <p style="color:#64748b;font-size:15px;line-height:1.7;text-align:center;margin:0 0 24px;">
      Para empezar a usar tu cuenta, confirma tu direcci\u00F3n de correo haciendo clic en el bot\u00F3n:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="${link}"
             style="display:inline-block;padding:14px 48px;background:linear-gradient(135deg,${COLOR_ACCENT},#0284c7);color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;border-radius:12px;box-shadow:0 4px 14px rgba(6,182,212,0.4);">
            ✅ Verificar correo
          </a>
        </td>
      </tr>
    </table>
    <p style="color:#94a3b8;font-size:13px;text-align:center;margin:24px 0 0;">
      O copia este enlace en tu navegador:<br>
      <a href="${link}" style="color:${COLOR_PRIMARY};font-size:12px;word-break:break-all;">${link}</a>
    </p>
    <p style="color:#f59e0b;font-size:12px;text-align:center;margin:16px 0 0;">⏰ Este enlace expira en 24 horas.</p>
  `);

  await enviarCorreo(destinatario.correo, '✅ Verifica tu correo - SGPE', html);
}

export async function sendPasswordResetEmail(destinatario: { nombre: string; correo: string; token: string }): Promise<void> {
  const link = `${FRONTEND_URL}/reset-password/${destinatario.token}`;

  const html = layout(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;width:72px;height:72px;background:linear-gradient(135deg,#f59e0b,#d97706);border-radius:50%;line-height:72px;font-size:36px;">🔐</div>
    </div>
    <h2 style="color:#0f172a;font-size:24px;margin:0 0 8px;text-align:center;">Recupera tu contraseña</h2>
    <p style="color:#64748b;font-size:15px;line-height:1.7;text-align:center;margin:0 0 8px;">
      Hola <strong>${destinatario.nombre}</strong>, recibimos una solicitud para restablecer tu contraseña.
    </p>
    <p style="color:#64748b;font-size:15px;line-height:1.7;text-align:center;margin:0 0 24px;">
      Haz clic en el bot\u00F3n para crear una nueva contraseña:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="${link}"
             style="display:inline-block;padding:14px 48px;background:linear-gradient(135deg,#f59e0b,#d97706);color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;border-radius:12px;box-shadow:0 4px 14px rgba(245,158,11,0.4);">
            🔑 Restablecer contraseña
          </a>
        </td>
      </tr>
    </table>
    <p style="color:#94a3b8;font-size:13px;text-align:center;margin:24px 0 0;">
      O copia este enlace:<br>
      <a href="${link}" style="color:${COLOR_PRIMARY};font-size:12px;word-break:break-all;">${link}</a>
    </p>
    <p style="color:#ef4444;font-size:12px;text-align:center;margin:16px 0 0;">⚠️ Si no solicitaste esto, ignora este correo.</p>
    <p style="color:#f59e0b;font-size:12px;text-align:center;margin:8px 0 0;">⏰ Este enlace expira en 1 hora.</p>
  `);

  await enviarCorreo(destinatario.correo, '🔐 Recuperación de contraseña - SGPE', html);
}
