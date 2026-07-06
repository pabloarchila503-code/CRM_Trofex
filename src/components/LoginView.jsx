import { useState } from 'react';
import logoImg from '../assets/logo.png';

export default function LoginView({ onLogin, scriptUrl }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = JSON.stringify({
          action: 'login',
          email,
          password
        });
      const encodedPayload = encodeURIComponent(payload);
      const response = await fetch(`${scriptUrl}?payload=${encodedPayload}`, {
        method: 'GET',
        redirect: 'follow'
      });

      const data = await response.json();

      if (data.status === 'success') {
        onLogin(data.user);
      } else {
        setError(data.message || 'Credenciales incorrectas');
      }
    } catch (err) {
      console.error(err);
      setError('Error al conectar con la base de datos. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'radial-gradient(circle at 10% 20%, rgb(15, 23, 42) 0%, rgb(30, 27, 75) 100%)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Outfit', 'Inter', sans-serif"
    }}>
      {/* Background Decorative Blobs */}
      <div style={{
        position: 'absolute', width: '300px', height: '300px',
        borderRadius: '50%', background: 'rgba(255, 109, 77, 0.15)',
        filter: 'blur(80px)', top: '10%', left: '15%', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', width: '350px', height: '350px',
        borderRadius: '50%', background: 'rgba(79, 70, 229, 0.15)',
        filter: 'blur(100px)', bottom: '15%', right: '10%', pointerEvents: 'none'
      }} />

      <div style={{
        width: '100%',
        maxWidth: '420px',
        padding: '40px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'rgba(30, 41, 59, 0.45)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        animation: 'zoomIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Soft logo container with subtle neon border */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '12px 24px',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          marginBottom: '30px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <img src={logoImg} alt="Trofex" style={{ height: '40px', objectFit: 'contain' }} />
        </div>
        
        <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', marginBottom: '8px', letterSpacing: '-0.5px' }}>
          Bienvenido al CRM
        </h2>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '32px', textAlign: 'center', lineHeight: '1.5' }}>
          Ingresa tus credenciales para acceder al sistema de gestión de Trofex.
        </p>

        {error && (
          <div style={{
            width: '100%', padding: '12px 16px', background: 'rgba(239, 68, 68, 0.15)', 
            color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px', fontSize: '13px', marginBottom: '24px', textAlign: 'center',
            fontWeight: '600', boxSizing: 'border-box'
          }}>
            <i className="fas fa-exclamation-circle" style={{ marginRight: '8px' }}></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#e2e8f0', marginBottom: '8px', letterSpacing: '0.5px' }}>
              CORREO ELECTRÓNICO
            </label>
            <div style={{ position: 'relative' }}>
              <i className="fas fa-envelope" style={{ position: 'absolute', left: '14px', top: '14px', color: '#64748b', fontSize: '14px' }}></i>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ejemplo@trofex.com"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  boxSizing: 'border-box',
                  background: 'rgba(15, 23, 42, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
              />
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: '#e2e8f0', marginBottom: '8px', letterSpacing: '0.5px' }}>
              CONTRASEÑA
            </label>
            <div style={{ position: 'relative' }}>
              <i className="fas fa-lock" style={{ position: 'absolute', left: '14px', top: '14px', color: '#64748b', fontSize: '14px' }}></i>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 42px',
                  boxSizing: 'border-box',
                  background: 'rgba(15, 23, 42, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              marginTop: '10px',
              fontSize: '14px',
              fontWeight: '700',
              color: '#ffffff',
              background: 'linear-gradient(135deg, #ff6d4d 0%, #f97316 100%)',
              border: 'none',
              borderRadius: '12px',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 16px rgba(255, 109, 77, 0.25)',
              transition: 'all 0.2s',
              opacity: loading ? 0.75 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Verificando...
              </>
            ) : (
              <>
                Iniciar Sesión <i className="fas fa-arrow-right" style={{ fontSize: '12px' }}></i>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
