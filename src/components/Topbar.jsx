import { useState, useEffect, useRef } from 'react';

const STORES = ['CB', 'CHM', 'CHQ', 'ESC', 'HH', 'JT', 'MZ', 'PT', 'PTB', 'SJ', 'SMA', 'VN', 'XL', 'Z3'];
const MESES  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// ─────────────────────────────────────────────────────────────────
// NOTIFICATION BELL — lives in the global topbar
// ─────────────────────────────────────────────────────────────────
function NotificationBell({ notifications = [], onClear, onMarkAllRead }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const iconForType = (type) => {
    if (type === 'event')  return { icon: 'fa-calendar-plus', color: '#4f46e5', bg: '#ede9fe' };
    if (type === 'task')   return { icon: 'fa-tasks',         color: '#059669', bg: '#d1fae5' };
    if (type === 'vale')   return { icon: 'fa-file-invoice',  color: '#d97706', bg: '#fef3c7' };
    if (type === 'order')  return { icon: 'fa-box',           color: '#2563eb', bg: '#dbeafe' };
    return { icon: 'fa-bell', color: '#64748b', bg: '#f1f5f9' };
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => { setOpen(o => !o); if (!open && onMarkAllRead) onMarkAllRead(); }}
        title="Notificaciones"
        style={{
          position: 'relative',
          background: open ? 'rgba(79,70,229,0.1)' : '#f8fafc',
          border: '1px solid',
          borderColor: open ? 'rgba(79,70,229,0.3)' : '#e2e8f0',
          borderRadius: '10px',
          width: '38px', height: '38px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          color: open ? '#4f46e5' : '#475569',
          flexShrink: 0,
        }}
      >
        <i className="fas fa-bell" style={{ fontSize: '15px' }} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: '-5px', right: '-5px',
            background: '#ef4444', color: '#fff',
            fontSize: '9px', fontWeight: '800',
            width: '18px', height: '18px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #fff',
            animation: 'notif-pulse 1.5s infinite',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          background: '#fff', border: '1px solid #e2e8f0',
          borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          zIndex: 9999, width: '340px', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: '800', fontSize: '14px', color: '#1e293b' }}>Notificaciones</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{notifications.length} en total · guardadas en sistema</div>
            </div>
            {notifications.length > 0 && (
              <button
                onClick={() => { if (onClear) onClear(); setOpen(false); }}
                style={{ fontSize: '11px', fontWeight: '700', color: '#ef4444', background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}
              >
                Limpiar
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                <i className="fas fa-bell-slash" style={{ fontSize: '28px', display: 'block', marginBottom: '10px', opacity: 0.4 }} />
                <div style={{ fontSize: '13px', fontWeight: '600' }}>Sin notificaciones</div>
                <div style={{ fontSize: '11px', marginTop: '4px' }}>Aparecerán aquí cuando haya actividad</div>
              </div>
            ) : (
              notifications.map(n => {
                const cfg = iconForType(n.type);
                return (
                  <div key={n.id} style={{
                    display: 'flex', gap: '12px', padding: '12px 20px',
                    borderBottom: '1px solid #f8fafc',
                    background: n.read ? '#fff' : 'rgba(79,70,229,0.02)',
                  }}>
                    <div style={{ width: '34px', height: '34px', background: cfg.bg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={`fas ${cfg.icon}`} style={{ fontSize: '13px', color: cfg.color }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', lineHeight: 1.4 }}>{n.mensaje}</div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px' }}>{n.hora}</div>
                    </div>
                    {!n.read && (
                      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4f46e5', flexShrink: 0, marginTop: '6px' }} />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes notif-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// TOPBAR
// ─────────────────────────────────────────────────────────────────
export default function Topbar({
  title, onExportPDF, userRole, selectedStores = [], setSelectedStores,
  allowedStores = STORES,
  selectedMonths, setSelectedMonths,
  currentView,
  notifications = [],
  onClearNotifications,
  onMarkAllRead,
}) {
  const [timeStr, setTimeStr] = useState('--:--:--');
  const [dateStr, setDateStr] = useState('—');
  const [storeDropOpen, setStoreDropOpen] = useState(false);
  const [monthDropOpen, setMonthDropOpen] = useState(false);
  const storeRef = useRef(null);
  const monthRef = useRef(null);

  const isAdmin = userRole === 'admin';
  const isMultiStore = isAdmin || allowedStores.length > 1;

  const toggleStore = (s) => {
    setSelectedStores(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const toggleAllStores = () => {
    if (selectedStores.length === allowedStores.length) {
      setSelectedStores([]);
    } else {
      setSelectedStores([...allowedStores]);
    }
  };

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
      <div
        className={(currentView === 'calendario' || currentView === 'tareas') ? 'd-none' : ''}
        style={{
          display: (currentView === 'calendario' || currentView === 'tareas') ? 'none' : 'flex',
          alignItems: 'center',
          gap: '10px',
          flex: 1,
          flexWrap: 'wrap'
        }}
      >

        {/* ── FILTRO TIENDAS (Multi o Single) ── */}
        {currentView === 'dashboard' && (
          <div ref={storeRef} style={{ position: 'relative' }}>
            <button
              onClick={() => { if (isMultiStore) { setStoreDropOpen(o => !o); setMonthDropOpen(false); } }}
              className="store-pill-btn"
              style={{ padding: '7px 14px', display: 'flex', alignItems: 'center', gap: '6px', cursor: isMultiStore ? 'pointer' : 'default' }}
            >
              <i className="fas fa-store" style={{ color: 'var(--accent-coral)', fontSize: '13px' }} />
              <span style={{ fontSize: '12px', fontWeight: '700' }}>
                Tienda: {isMultiStore ? (selectedStores.length === allowedStores.length ? 'Todas' : (selectedStores.length > 0 ? selectedStores.join(', ') : 'Ninguna')) : (selectedStores[0] || allowedStores[0])}
              </span>
              {isMultiStore && (
                <i className={`fas fa-chevron-${storeDropOpen ? 'up' : 'down'}`} style={{ fontSize: '9px', opacity: 0.6 }} />
              )}
            </button>

            {isMultiStore && storeDropOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0,
                background: '#fff', border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)',
                padding: '12px', zIndex: 9999, width: '260px',
                display: 'flex', flexDirection: 'column', gap: '10px',
              }}>
                <button
                  onClick={toggleAllStores}
                  style={{
                    padding: '8px', fontSize: '12px', fontWeight: '700',
                    background: selectedStores.length === allowedStores.length ? 'var(--accent-coral)' : '#F8F6F2',
                    color: selectedStores.length === allowedStores.length ? '#fff' : 'var(--text-secondary)',
                    border: '1px solid ' + (selectedStores.length === allowedStores.length ? 'var(--accent-coral)' : 'var(--border-light)'),
                    borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s',
                    width: '100%'
                  }}
                >
                  {selectedStores.length === allowedStores.length ? 'Quitar todas' : 'Seleccionar todas'}
                </button>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px'
                }}>
                  {allowedStores.map(s => {
                    const isSelected = selectedStores.includes(s);
                    return (
                      <button
                        key={s}
                        onClick={() => toggleStore(s)}
                        style={{
                          padding: '6px', fontSize: '11px', fontWeight: '700',
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
              </div>
            )}
          </div>
        )}

        {/* ── FILTRO MESES (todos los usuarios) ── */}
        <div
          ref={monthRef}
          className={['prospecciones', '80-20', 'proyecto', 'carreras', 'tendencias', 'productos'].includes(currentView) ? 'd-none' : ''}
          style={{
            position: 'relative',
            display: ['prospecciones', '80-20', 'proyecto', 'carreras', 'tendencias', 'productos'].includes(currentView) ? 'none' : 'block'
          }}
        >
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

        {/* ── TAGS ACTIVOS ── */}
        <div style={{
          display: ['prospecciones', '80-20', 'proyecto', 'carreras'].includes(currentView) ? 'none' : 'flex',
          flexWrap: 'wrap',
          gap: '5px',
          alignItems: 'center'
        }}>
          {selectedMonths.map(m => (
            <span key={m} className="filter-tag filter-tag-month">
              <i className="fas fa-calendar-alt" style={{ fontSize: '9px' }} />
              {m.slice(0, 3)}
              <button onClick={() => toggleMonth(m)} className="tag-remove-btn">&times;</button>
            </span>
          ))}
        </div>

      </div>

      {/* ── FECHA + HORA ── */}
      <div className="topbar-date">
        <span className="topbar-date-val">{dateStr}</span>
        <span className="topbar-time">{timeStr}</span>
      </div>

      {/* ── CAMPANA DE NOTIFICACIONES (siempre visible en el header) ── */}
      <NotificationBell
        notifications={notifications}
        onClear={onClearNotifications}
        onMarkAllRead={onMarkAllRead}
      />

      {/* ── EXPORTAR PDF ── */}
      <button className="topbar-btn btn-outline" onClick={onExportPDF} id="export-pdf-btn">
        <i className="fas fa-file-pdf" style={{ color: '#ef4444', marginRight: '6px' }} /> Exportar PDF
      </button>
    </header>
  );
}
