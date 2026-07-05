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
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'var(--bg-body)', padding: '20px'
    }}>
      <div className="card" style={{
        width: '100%', maxWidth: '400px', padding: '40px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        background: '#fff', borderRadius: 'var(--radius-lg)',
        boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
        animation: 'zoomIn 0.3s ease-out'
      }}>
        <img src={logoImg} alt="Trofex" style={{ height: '45px', marginBottom: '30px' }} />
        
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Bienvenido a CRM Trofex
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '30px', textAlign: 'center' }}>
          Ingresa tus credenciales para acceder al sistema de gestión y reportes.
        </p>

        {error && (
          <div style={{
            width: '100%', padding: '12px', background: '#FEE2E2', color: '#B91C1C',
            borderRadius: '6px', fontSize: '13px', marginBottom: '20px', textAlign: 'center',
            fontWeight: '600'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
              CORREO ELECTRÓNICO
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ejemplo@trofex.com"
              required
              className="topbar-search"
              style={{ width: '100%', padding: '10px 14px', boxSizing: 'border-box' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
              CONTRASEÑA
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="topbar-search"
              style={{ width: '100%', padding: '10px 14px', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            className="topbar-btn btn-primary"
            disabled={loading}
            style={{
              width: '100%', padding: '12px', marginTop: '10px',
              fontSize: '14px', fontWeight: '700',
              opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
