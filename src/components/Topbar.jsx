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

      {/* Store Selection Dropdown (Pill Button Redesign) */}
      <div className="store-pill-container" style={{ marginRight: '16px' }}>
        <div className="store-pill-btn">
          <i className="fas fa-store" style={{ color: 'var(--accent-coral)', fontSize: '14px' }}></i>
          <span>Tienda: {activeStore === 'Todos' ? 'Todas las Tiendas' : activeStore}</span>
          {userRole === 'admin' && <i className="fas fa-chevron-down" style={{ fontSize: '10px', marginLeft: '4px', opacity: 0.7 }}></i>}
          
          {userRole === 'admin' && (
            <select
              value={activeStore || 'Todos'}
              onChange={(e) => onStoreChange && onStoreChange(e.target.value)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer',
                WebkitAppearance: 'none'
              }}
            >
              <option value="Todos">Todas las Tiendas</option>
              {STORES.map(store => (
                <option key={store} value={store}>{store}</option>
              ))}
            </select>
          )}
        </div>
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

