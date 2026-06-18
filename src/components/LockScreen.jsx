import { useState } from 'react';

const STORES = ['CB', 'CHM', 'CHQ', 'ESC', 'HH', 'JT', 'MZ', 'PT', 'PTB', 'SJ', 'SMA', 'VN', 'XL', 'Z3'];

export default function LockScreen({ onLogin }) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const code = passcode.trim().toUpperCase();

    if (!code) {
      setError('Por favor, ingresa tu código.');
      return;
    }

    if (code === 'ADMIN123') {
      onLogin('admin', 'Todos');
    } else if (STORES.includes(code)) {
      onLogin('store', code);
    } else {
      setError('Código no autorizado. Revisa tus credenciales.');
    }
  };

  return (
    <div className="modal-overlay active" style={{ 
      background: 'rgba(20, 23, 43, 0.85)', 
      backdropFilter: 'blur(10px)', 
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'fixed',
      inset: 0
    }}>
      <div className="modal-box" style={{ 
        maxWidth: '400px', 
        padding: '36px 28px', 
        textAlign: 'center',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '54px', 
            height: '54px',
            background: 'linear-gradient(135deg, #d32f2f 50%, #111111 50%)',
            boxShadow: '0 8px 24px rgba(211, 47, 47, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '14px'
          }}>
            <svg viewBox="0 0 24 24" width="30" height="30" fill="#FFFFFF">
              <path d="M19 2H5c-1.1 0-2 .9-2 2v3c0 2.2 1.8 4 4 4h1.2c.6 1.8 2.2 3.2 4.1 3.7V18H9c-1.1 0-2 .9-2 2v2h10v-2c0-1.1-.9-2-2-2h-3.3v-3.3c1.9-.5 3.5-1.9 4.1-3.7H17c2.2 0 4-1.8 4-4V4c0-1.1-.9-2-2-2zm-12 7c-1.1 0-2-.9-2-2V4h4v3c0 1.1-.9 2-2 2zm10 0c-1.1 0-2-.9-2-2V4h4v3c0 1.1-.9 2-2 2z" />
            </svg>
          </div>
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '6px', color: 'var(--text-primary)' }}>
          TROFEX CRM
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>
          Control de Acceso Autorizado
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group" style={{ textAlign: 'left' }}>
            <label className="form-label" htmlFor="passcode-input" style={{ fontSize: '10px' }}>
              Código de Acceso
            </label>
            <input
              type="text"
              id="passcode-input"
              className="form-control"
              placeholder="Ej: CB, JT o contraseña Admin"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setError('');
              }}
              style={{
                width: '100%',
                padding: '12px 14px',
                fontSize: '14px',
                textAlign: 'center',
                letterSpacing: '1px',
                fontWeight: '600'
              }}
              autoFocus
            />
          </div>

          {error && (
            <div style={{ 
              color: 'var(--accent-red)', 
              fontSize: '11.5px', 
              fontWeight: '600',
              padding: '6px 12px',
              background: 'rgba(239, 68, 68, 0.08)',
              borderRadius: '6px'
            }}>
              <i className="fas fa-exclamation-circle" style={{ marginRight: '6px' }}></i>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="topbar-btn btn-primary" 
            style={{ 
              width: '100%', 
              justifyContent: 'center',
              padding: '12px',
              fontSize: '13px',
              marginTop: '6px'
            }}
          >
            <i className="fas fa-lock-open" style={{ marginRight: '8px' }}></i>
            Ingresar al Sistema
          </button>
        </form>

        {/* Demo Hints for Reviewer convenience */}
        <div style={{ 
          marginTop: '32px', 
          padding: '12px', 
          background: 'var(--bg-body)', 
          borderRadius: '8px',
          border: '1.5px solid var(--border-light)',
          textAlign: 'left'
        }}>
          <div style={{ fontSize: '9.5px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px', letterSpacing: '0.5px' }}>
            Credenciales de Demostración:
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            🔑 <strong>Admin:</strong> <code>ADMIN123</code> (Acceso total)
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            🏬 <strong>Tienda:</strong> <code>CB</code>, <code>JT</code>, <code>Z3</code> (Filtro bloqueado)
          </div>
        </div>
      </div>
    </div>
  );
}
