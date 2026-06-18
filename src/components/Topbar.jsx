import { useState, useEffect, useRef } from 'react';

const STORES = ['CB', 'CHM', 'CHQ', 'ESC', 'HH', 'JT', 'MZ', 'PT', 'PTB', 'SJ', 'SMA', 'VN', 'XL', 'Z3'];
const MESES  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function Topbar({
  title, onExportPDF, userRole, activeStore,
  selectedMonths,  setSelectedMonths,
  onStoreChange, timeRange, onTimeRangeChange
}) {
  const [timeStr, setTimeStr] = useState('--:--:--');
  const [dateStr, setDateStr] = useState('—');
  const [storeDropOpen, setStoreDropOpen] = useState(false);
  const [monthDropOpen, setMonthDropOpen] = useState(false);
  const storeRef = useRef(null);
  const monthRef = useRef(null);

  const isAdmin = userRole === 'admin';

  // Clock
  useEffect(() => {
    const update = () => {
      const now  = new Date();
      const date = now.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
      setDateStr(date.charAt(0).toUpperCase() + date.slice(1));
      setTimeStr(now.toLocaleTimeString('es-ES'));
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (storeRef.current && !storeRef.current.contains(e.target)) setStoreDropOpen(false);
      if (monthRef.current && !monthRef.current.contains(e.target)) setMonthDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleMonth = (m) => {
    setSelectedMonths(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
    );
  };

  return (
    <header className="topbar" style={{ flexWrap: 'wrap', gap: '10px' }}>
      <h1 className="topbar-title">{title}</h1>

      {/* ── FILTROS MULTI-TAG ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, flexWrap: 'wrap' }}>

        {/* ── FILTRO TIENDAS (solo Admin) ── */}
        {isAdmin && (
          <div ref={storeRef} style={{ position: 'relative' }}>
            <button
              onClick={() => { setStoreDropOpen(o => !o); setMonthDropOpen(false); }}
              className="store-pill-btn"
              style={{ padding: '7px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <i className="fas fa-store" style={{ color: 'var(--accent-coral)', fontSize: '13px' }} />
              <span style={{ fontSize: '12px', fontWeight: '700' }}>
                Tienda: {activeStore}
              </span>
              <i className={`fas fa-chevron-${storeDropOpen ? 'up' : 'down'}`} style={{ fontSize: '9px', opacity: 0.6 }} />
            </button>

            {storeDropOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0,
                background: '#fff', border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)',
                padding: '8px', zIndex: 200, width: '220px',
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px',
              }}>
                {STORES.map(s => {
                  const isSelected = activeStore === s;
                  return (
                    <button
                      key={s}
                      onClick={() => {
                        if (onStoreChange) onStoreChange(s);
                        setStoreDropOpen(false);
                      }}
                      style={{
                        padding: '5px', fontSize: '11px', fontWeight: '700',
                        background: isSelected ? 'var(--accent-coral)' : '#F8F6F2',
                        color: isSelected ? '#fff' : 'var(--text-secondary)',
                        border: '1px solid ' + (isSelected ? 'var(--accent-coral)' : 'var(--border-light)'),
                        borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── FILTRO MESES (todos los usuarios) ── */}
        <div ref={monthRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setMonthDropOpen(o => !o); setStoreDropOpen(false); }}
            className="store-pill-btn"
            style={{ padding: '7px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <i className="fas fa-calendar-alt" style={{ color: 'var(--accent-coral)', fontSize: '13px' }} />
            <span style={{ fontSize: '12px', fontWeight: '700' }}>
              Meses {selectedMonths.length > 0 ? `(${selectedMonths.length})` : '(Todos)'}
            </span>
            <i className={`fas fa-chevron-${monthDropOpen ? 'up' : 'down'}`} style={{ fontSize: '9px', opacity: 0.6 }} />
          </button>

          {monthDropOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0,
              background: '#fff', border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)',
              padding: '8px', zIndex: 200, width: '240px',
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px',
            }}>
              <button
                onClick={() => setSelectedMonths([])}
                style={{
                  gridColumn: '1 / -1', padding: '6px', fontSize: '11px', fontWeight: '700',
                  background: selectedMonths.length === 0 ? 'var(--accent-coral)' : 'var(--bg-cream)',
                  color: selectedMonths.length === 0 ? '#fff' : 'var(--text-secondary)',
                  border: 'none', borderRadius: '6px', cursor: 'pointer', marginBottom: '4px',
                }}
              >
                Todos los Meses
              </button>
              {MESES.map(m => (
                <button
                  key={m}
                  onClick={() => toggleMonth(m)}
                  style={{
                    padding: '5px 4px', fontSize: '10px', fontWeight: '700',
                    background: selectedMonths.includes(m) ? '#3B82F6' : '#F8F6F2',
                    color: selectedMonths.includes(m) ? '#fff' : 'var(--text-secondary)',
                    border: '1px solid ' + (selectedMonths.includes(m) ? '#3B82F6' : 'var(--border-light)'),
                    borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {m.slice(0, 3)}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── FILTRO TIEMPO (dropdown select) ── */}
        <div style={{ position: 'relative' }}>
          <select
            value={timeRange}
            onChange={(e) => onTimeRangeChange(e.target.value)}
            className="select-filter"
            style={{
              padding: '7px 12px',
              fontWeight: '700',
              borderRadius: 'var(--radius-sm)',
              border: '1.5px solid var(--border-light)',
              background: '#fff',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              outline: 'none',
              transition: 'border-color var(--tr-fast)',
            }}
          >
            <option value="1 día">1 día</option>
            <option value="1 semana">1 semana</option>
            <option value="Quincenal">Quincenal</option>
            <option value="Mensual">Mensual</option>
          </select>
        </div>

        {/* ── TAGS ACTIVOS ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', alignItems: 'center' }}>
          {selectedMonths.map(m => (
            <span key={m} className="filter-tag filter-tag-month">
              <i className="fas fa-calendar-alt" style={{ fontSize: '9px' }} />
              {m.slice(0, 3)}
              <button onClick={() => toggleMonth(m)} className="tag-remove-btn">&times;</button>
            </span>
          ))}
        </div>

      </div>

      {/* ── Selector de tienda para rol Store (simple, sin multi) ── */}
      {!isAdmin && (
        <div className="store-pill-container" style={{ marginRight: '8px' }}>
          <div className="store-pill-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px' }}>
            <i className="fas fa-store" style={{ color: 'var(--accent-coral)', fontSize: '13px' }} />
            <span style={{ fontSize: '12px', fontWeight: '700' }}>
              Tienda: {activeStore}
            </span>
          </div>
        </div>
      )}

      <div className="topbar-date">
        <span className="topbar-date-val">{dateStr}</span>
        <span className="topbar-time">{timeStr}</span>
      </div>

      <button className="topbar-btn btn-outline" onClick={onExportPDF} id="export-pdf-btn">
        <i className="fas fa-file-pdf" style={{ color: '#ef4444', marginRight: '6px' }} /> Exportar PDF
      </button>
    </header>
  );
}
