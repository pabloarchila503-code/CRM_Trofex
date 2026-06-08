import React, { useState, useEffect } from 'react';

const STORES = ['CB', 'CHM', 'CHQ', 'ESC', 'HH', 'JT', 'MZ', 'PT', 'PTB', 'SJ', 'SMA', 'VN', 'XL', 'Z3'];

export default function Topbar({ title, onExportCSV, onAddDeal, userRole, activeStore, onStoreChange }) {
  const [timeStr, setTimeStr] = useState('--:--:--');
  const [dateStr, setDateStr] = useState('—');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const date = now.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
      const time = now.toLocaleTimeString('es-ES');
      setDateStr(date.charAt(0).toUpperCase() + date.slice(1));
      setTimeStr(time);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="topbar">
      <h1 className="topbar-title">{title}</h1>

      {/* Store Selection Dropdown */}
      <div className="topbar-store-selector" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '16px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center' }}>
          <i className="fas fa-store" style={{ color: 'var(--accent-coral)', marginRight: '6px', fontSize: '13px' }}></i>
          Tienda:
        </span>
        <select
          value={activeStore || 'Todos'}
          onChange={(e) => onStoreChange && onStoreChange(e.target.value)}
          disabled={userRole === 'store'}
          className="select-filter"
          style={{ 
            fontWeight: '700',
            borderColor: userRole === 'store' ? 'transparent' : 'var(--border-light)',
            background: userRole === 'store' ? 'rgba(20, 23, 43, 0.05)' : 'var(--bg-body)',
            cursor: userRole === 'store' ? 'not-allowed' : 'pointer',
            padding: '6px 12px',
            color: 'var(--text-primary)',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          {userRole === 'admin' ? (
            <>
              <option value="Todos">Todas las Tiendas</option>
              {STORES.map(store => (
                <option key={store} value={store}>{store}</option>
              ))}
            </>
          ) : (
            <option value={activeStore}>{activeStore}</option>
          )}
        </select>
      </div>

      <div className="topbar-date">
        <span className="topbar-date-val">{dateStr}</span>
        <span className="topbar-time">{timeStr}</span>
      </div>

      <button className="topbar-btn btn-outline" onClick={onExportCSV}>
        <i className="fas fa-file-export"></i> Exportar CSV
      </button>
    </header>
  );
}

