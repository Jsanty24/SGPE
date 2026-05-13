import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

const LOGIN_TIMEOUT = 5;

export default function VerificadoPage() {
  const [segundos, setSegundos] = useState(LOGIN_TIMEOUT);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const error = searchParams.get('error');

  useEffect(() => {
    if (error) return;
    const t = setInterval(() => {
      setSegundos((s) => {
        if (s <= 1) {
          clearInterval(t);
          navigate('/login', { replace: true });
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [error, navigate]);

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0f',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '20px',
      }}>
        <div style={{
          background: '#12121a',
          border: '1px solid #1e1e2e',
          borderRadius: '16px',
          padding: '48px 40px',
          maxWidth: '440px',
          width: '100%',
          textAlign: 'center',
        }}>
          <div style={{
            width: '56px', height: '56px', border: '1px solid #1e1e2e', borderRadius: '16px',
            lineHeight: '56px', fontSize: '24px', margin: '0 auto 32px',
          }}>
            <span style={{ filter: 'grayscale(1) brightness(1.5)' }}>&#10060;</span>
          </div>
          <p style={{ color: '#71717a', fontSize: '13px', margin: '0 0 4px', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Error de verificaci&oacute;n
          </p>
          <h2 style={{ color: '#e4e4e7', fontSize: '22px', margin: '0 0 20px', fontWeight: 500, letterSpacing: '-0.3px' }}>
            El enlace no es v&aacute;lido
          </h2>
          <p style={{ color: '#71717a', fontSize: '14px', lineHeight: '1.8', margin: '0 0 32px' }}>
            El enlace de verificaci&oacute;n ya expir&oacute; o no es correcto. Solicit&aacute; uno nuevo desde la pantalla de inicio de sesi&oacute;n.
          </p>
          <a href="/login"
            style={{
              display: 'inline-block', padding: '13px 40px', background: '#a78bfa', color: '#0a0a0f',
              textDecoration: 'none', fontSize: '13px', fontWeight: 600, borderRadius: '10px',
              letterSpacing: '0.5px',
            }}>
            Ir a iniciar sesi&oacute;n
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0f',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px',
    }}>
      <div style={{
        background: '#12121a',
        border: '1px solid #1e1e2e',
        borderRadius: '16px',
        padding: '48px 40px',
        maxWidth: '440px',
        width: '100%',
        textAlign: 'center',
      }}>
        <div style={{
          width: '64px', height: '64px', border: '1px solid #1e1e2e', borderRadius: '50%',
          lineHeight: '64px', fontSize: '28px', margin: '0 auto 32px',
        }}>
          <span style={{ filter: 'grayscale(1) brightness(1.5)' }}>&#10003;</span>
        </div>
        <p style={{
          color: '#71717a', fontSize: '13px', margin: '0 0 4px',
          letterSpacing: '1px', textTransform: 'uppercase',
        }}>
          Correo verificado
        </p>
        <h2 style={{
          color: '#e4e4e7', fontSize: '22px', margin: '0 0 12px',
          fontWeight: 500, letterSpacing: '-0.3px',
        }}>
          Felicitaciones
        </h2>
        <p style={{
          color: '#a1a1aa', fontSize: '14px', lineHeight: '1.8',
          margin: '0 0 32px', maxWidth: '340px', marginLeft: 'auto', marginRight: 'auto',
        }}>
          Tu cuenta ha sido verificada correctamente. Gracias por usar SGPE.
        </p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: '#1a1a2e', border: '1px solid #1e1e2e',
          borderRadius: '10px', padding: '12px 24px', marginBottom: '28px',
        }}>
          <span style={{ color: '#71717a', fontSize: '13px' }}>Redirigiendo al inicio de sesi&oacute;n en</span>
          <span style={{
            color: '#a78bfa', fontSize: '20px', fontWeight: 600,
            minWidth: '28px', textAlign: 'center',
          }}>
            {segundos}
          </span>
          <span style={{ color: '#71717a', fontSize: '13px' }}>s</span>
        </div>
        <p style={{ color: '#3f3f46', fontSize: '13px', margin: 0 }}>
          Si no te redirige autom&aacute;ticamente,&nbsp;
          <Link to="/login" style={{
            color: '#a78bfa', textDecoration: 'none',
            borderBottom: '1px dotted #1e1e2e', paddingBottom: '1px',
          }}>
            hac&eacute; clic ac&aacute;
          </Link>
        </p>
      </div>
    </div>
  );
}
