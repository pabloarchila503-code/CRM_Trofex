import { useState, useMemo, useRef, useEffect } from 'react';

const STORES = ['CB', 'CHM', 'CHQ', 'ESC', 'HH', 'JT', 'MZ', 'PT', 'PTB', 'SJ', 'SMA', 'VN', 'XL', 'Z3'];

const INITIAL_EVENTS = [
  { id: 'ev1', fecha: '2026-06-02', titulo: 'Entrega Medallas Ciclismo', hora: '10:00', prioridad: 'Alta', descripcion: 'Despacho de medallas personalizadas para competencia en Quetzaltenango.', tienda: 'CB', creadoPor: 'margarita.cb@tuempresa.com', replicarGlobal: false },
  { id: 'ev2', fecha: '2026-06-05', titulo: 'Corte Contable Quincenal', hora: '17:00', prioridad: 'Media', descripcion: 'Revisión y cierre de contabilidad del período.', tienda: 'Todos', creadoPor: 'admin@tuempresa.com', replicarGlobal: true },
  { id: 'ev3', fecha: '2026-06-08', titulo: 'Despacho Trofeos Copa Oro', hora: '11:30', prioridad: 'Alta', descripcion: 'Despacho de copas premium grabadas para la final de fútbol.', tienda: 'JT', creadoPor: 'jose.jt@tuempresa.com', replicarGlobal: false },
  { id: 'ev4', fecha: '2026-06-10', titulo: 'Revisión Catálogos Nuevos', hora: '09:00', prioridad: 'Baja', descripcion: 'Revisión física de los nuevos marcos y muestras de acrílico.', tienda: 'Z3', creadoPor: 'zoila.z3@tuempresa.com', replicarGlobal: false },
  { id: 'ev5', fecha: '2026-06-15', titulo: 'Depósito Mensual Cierre', hora: '16:00', prioridad: 'Alta', descripcion: 'Corte y depósito final del mes.', tienda: 'Todos', creadoPor: 'admin@tuempresa.com', replicarGlobal: true },
  { id: 'ev6', fecha: '2026-07-05', titulo: 'Llamadas de Prospección Directa', hora: '10:00', prioridad: 'Alta', descripcion: 'Barrido telefónico de nuevos desarrollos en Carretera al Salvador.', tienda: 'CB', creadoPor: 'admin@tuempresa.com', replicarGlobal: false },
  { id: 'ev7', fecha: '2026-07-05', titulo: 'Contacto Directo Clientes Corp', hora: '11:00', prioridad: 'Media', descripcion: 'Visita programada a instalaciones de socios estratégicos en Zacapa.', tienda: 'Z3', creadoPor: 'admin@tuempresa.com', replicarGlobal: false },
  { id: 'ev8', fecha: '2026-07-10', titulo: 'Entrega Trofeos Club Deportivo', hora: '09:30', prioridad: 'Alta', descripcion: 'Despacho de trofeos y medallas para torneo regional.', tienda: 'XL', creadoPor: 'admin@tuempresa.com', replicarGlobal: false },
  { id: 'ev9', fecha: '2026-07-12', titulo: 'Reunión Proveedor Metales', hora: '15:00', prioridad: 'Media', descripcion: 'Revisión de catálogo y precios de nuevas piezas.', tienda: 'VN', creadoPor: 'admin@tuempresa.com', replicarGlobal: false },
  { id: 'ev10', fecha: '2026-07-15', titulo: 'Corte Quincenal de Inventario', hora: '17:00', prioridad: 'Alta', descripcion: 'Conteo y ajuste de stock en todas las categorías.', tienda: 'Todos', creadoPor: 'admin@tuempresa.com', replicarGlobal: true },
  { id: 'ev11', fecha: '2026-07-20', titulo: 'Campaña Grabado Especial', hora: '10:00', prioridad: 'Baja', descripcion: 'Inicio de campaña de grabado personalizado para fin de año escolar.', tienda: 'MZ', creadoPor: 'admin@tuempresa.com', replicarGlobal: false },
  { id: 'ev12', fecha: '2026-07-28', titulo: 'Cierre Mensual Julio', hora: '16:30', prioridad: 'Alta', descripcion: 'Cierre de mes, depósito y reporte a administración central.', tienda: 'Todos', creadoPor: 'admin@tuempresa.com', replicarGlobal: true },
];

const DAY_NAMES_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAY_NAMES_FULL  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const MONTH_NAMES_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function CalendarioView({ selectedStores = [], userRole = 'admin' }) {

  // ── Date states ──────────────────────────────────────────────────────────
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayForEvent, setSelectedDayForEvent] = useState(null);
  const [selectedDayFilter, setSelectedDayFilter] = useState(null); // ISO 'YYYY-MM-DD' used to filter chronogram
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [editingEventId, setEditingEventId] = useState(null);
  const [calendarStoreFilter, setCalendarStoreFilter] = useState(STORES);
  const [storeDropOpen, setStoreDropOpen] = useState(false);
  const storeRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (storeRef.current && !storeRef.current.contains(e.target)) setStoreDropOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleAllStores = () => {
    if (calendarStoreFilter.length === STORES.length) setCalendarStoreFilter([]);
    else setCalendarStoreFilter(STORES);
  };

  const toggleStoreFilter = (s) => {
    setCalendarStoreFilter(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  // ── Modal states ─────────────────────────────────────────────────────────
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventForm, setEventForm] = useState({ titulo: '', hora: '12:00', prioridad: 'Media', descripcion: '', tienda: 'CB', replicarGlobal: false });

  // ── Calendar grid logic ───────────────────────────────────────────────────
  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const currentMonth = currentDate.getMonth();
  const currentYear  = currentDate.getFullYear();
  const daysInMonth  = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startDayOffset = new Date(currentYear, currentMonth, 1).getDay();
  const gridOffset = startDayOffset === 0 ? 6 : startDayOffset - 1;
  const gridDays = [...Array.from({ length: gridOffset }, () => null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const todayISO = new Date().toISOString().slice(0, 10);

  const handlePrevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const handleGoToday   = () => { setCurrentDate(new Date()); setSelectedDayFilter(todayISO); };

  // ── Click handlers ────────────────────────────────────────────────────────
  // Clicking a calendar day toggles the chronogram filter for that day
  const handleDayClick = (day) => {
    if (!day) return;
    const dateKey = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    setSelectedDayFilter(prev => prev === dateKey ? null : dateKey);
  };

  // Open create modal
  const handleOpenCreateModal = () => {
    const targetDate = selectedDayFilter
      ? new Date(selectedDayFilter + 'T12:00:00')
      : new Date();
    setSelectedDayForEvent(targetDate);
    setEditingEventId(null);
    setEventForm({
      titulo: '', hora: '12:00', prioridad: 'Media', descripcion: '',
      tienda: selectedStores.length === 14 ? 'CB' : (selectedStores[0] || 'CB'),
      replicarGlobal: false
    });
    setIsEventModalOpen(true);
  };

  // Click on existing event → Edit mode
  const handleEventClick = (e, evt) => {
    e.stopPropagation();
    const eventDate = new Date(evt.fecha + 'T12:00:00');
    setSelectedDayForEvent(eventDate);
    setEditingEventId(evt.id);
    setEventForm({
      titulo: evt.titulo, hora: evt.hora, prioridad: evt.prioridad,
      descripcion: evt.descripcion || '',
      tienda: evt.replicarGlobal ? 'CB' : evt.tienda,
      replicarGlobal: evt.replicarGlobal || false
    });
    setIsEventModalOpen(true);
  };

  // ── Save / Update ─────────────────────────────────────────────────────────
  const handleSaveEvent = (e) => {
    e.preventDefault();
    if (!eventForm.titulo.trim()) { alert('Por favor, ingresa el título del evento.'); return; }

    const isoDateStr = selectedDayForEvent.toISOString().slice(0, 10);

    if (editingEventId !== null) {
      setEvents(prev => prev.map(evt => evt.id === editingEventId
        ? { ...evt, titulo: eventForm.titulo, hora: eventForm.hora, prioridad: eventForm.prioridad, descripcion: eventForm.descripcion, tienda: eventForm.replicarGlobal && userRole === 'admin' ? 'Todos' : eventForm.tienda, replicarGlobal: eventForm.replicarGlobal && userRole === 'admin' }
        : evt
      ));
      alert('Evento actualizado exitosamente.');
    } else {
      const newEvent = {
        id: 'ev' + Date.now(), fecha: isoDateStr,
        titulo: eventForm.titulo, hora: eventForm.hora, prioridad: eventForm.prioridad,
        descripcion: eventForm.descripcion,
        tienda: eventForm.replicarGlobal && userRole === 'admin' ? 'Todos' : eventForm.tienda,
        creadoPor: userRole === 'admin' ? 'admin@tuempresa.com' : `${(selectedStores[0] || 'cb').toLowerCase()}@tuempresa.com`,
        replicarGlobal: eventForm.replicarGlobal && userRole === 'admin'
      };
      setEvents(prev => [...prev, newEvent]);
      alert(`Evento registrado. ${newEvent.replicarGlobal ? 'Replicado en las 14 tiendas.' : ''}`);
    }
    setIsEventModalOpen(false);
    setEditingEventId(null);
  };

  // ── Filtered events (global store access control) ─────────────────────────
  const filteredEvents = useMemo(() => events.filter(evt => {
    if (selectedStores.length === 14) return true;
    return evt.tienda === selectedStores[0] || evt.tienda === 'Todos' || evt.replicarGlobal;
  }), [events, selectedStores]);

  // ── Chronogram data ───────────────────────────────────────────────────────
  const chronogramGroups = useMemo(() => {
    const monthStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}`;
    let evts = filteredEvents.filter(e => e.fecha.startsWith(monthStr));
    if (selectedDayFilter) evts = evts.filter(e => e.fecha === selectedDayFilter);
    evts = [...evts].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));
    const grouped = {};
    evts.forEach(evt => { if (!grouped[evt.fecha]) grouped[evt.fecha] = []; grouped[evt.fecha].push(evt); });
    return Object.entries(grouped);
  }, [filteredEvents, currentMonth, currentYear, selectedDayFilter]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="view-section active">
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <p className="section-label" style={{ margin: 0 }}>Operaciones Administrativas — Calendario de Eventos</p>
        <button
          className="topbar-btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '700', borderRadius: '10px' }}
          onClick={handleOpenCreateModal}
        >
          <i className="fas fa-plus"></i> Añadir Actividad
        </button>
      </div>

      {/* ── CALENDAR CARD ─────────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: '20px', padding: '24px' }}>
        {/* Calendar header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 className="card-title" style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-calendar-alt" style={{ color: 'var(--accent-coral)' }}></i>
              {monthNames[currentMonth]} {currentYear}
            </h3>
            <p className="card-subtitle">Haz clic en un día para filtrar el cronograma</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Store filter dropdown */}
            {userRole === 'admin' && (
              <div ref={storeRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setStoreDropOpen(o => !o)}
                  className="store-pill-btn"
                  style={{ padding: '7px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <i className="fas fa-store" style={{ color: 'var(--accent-coral)', fontSize: '13px' }} />
                  <span style={{ fontSize: '12px', fontWeight: '700' }}>
                    Tienda: {calendarStoreFilter.length === STORES.length ? 'Todas' : (calendarStoreFilter.length > 0 ? calendarStoreFilter.join(', ') : 'Ninguna')}
                  </span>
                  <i className={`fas fa-chevron-${storeDropOpen ? 'up' : 'down'}`} style={{ fontSize: '9px', opacity: 0.6 }} />
                </button>

                {storeDropOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: '#fff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', padding: '8px', zIndex: 200, width: '220px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button onClick={toggleAllStores} style={{ padding: '6px', fontSize: '11px', fontWeight: '700', background: calendarStoreFilter.length === STORES.length ? 'var(--accent-coral)' : '#F8F6F2', color: calendarStoreFilter.length === STORES.length ? '#fff' : 'var(--text-secondary)', border: '1px solid ' + (calendarStoreFilter.length === STORES.length ? 'var(--accent-coral)' : 'var(--border-light)'), borderRadius: '6px', cursor: 'pointer', width: '100%' }}>
                      Todas las tiendas
                    </button>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                      {STORES.map(s => {
                        const isSelected = calendarStoreFilter.includes(s);
                        return (
                          <button key={s} onClick={() => toggleStoreFilter(s)} style={{ padding: '5px', fontSize: '11px', fontWeight: '700', background: isSelected ? 'var(--accent-coral)' : '#F8F6F2', color: isSelected ? '#fff' : 'var(--text-secondary)', border: '1px solid ' + (isSelected ? 'var(--accent-coral)' : 'var(--border-light)'), borderRadius: '6px', cursor: 'pointer' }}>
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button className="topbar-btn btn-outline" style={{ padding: '6px 10px' }} onClick={handlePrevMonth}>
              <i className="fas fa-chevron-left"></i>
            </button>
            <button className="topbar-btn btn-outline" style={{ padding: '6px 14px', fontSize: '12px', fontWeight: '700' }} onClick={handleGoToday}>
              Hoy
            </button>
            <button className="topbar-btn btn-outline" style={{ padding: '6px 10px' }} onClick={handleNextMonth}>
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>

        {/* Calendar grid */}
        <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--bg-body)', borderBottom: '1px solid var(--border-light)', textAlign: 'center', padding: '8px 0' }}>
            {['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'].map(d => (
              <span key={d} style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{d}</span>
            ))}
          </div>

          <div className="calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '90px', background: '#FFFFFF' }}>
            {gridDays.map((day, idx) => {
              const dateKey = day ? `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}` : '';
              const isToday     = dateKey === todayISO;
              const isSelected  = dateKey === selectedDayFilter;
              const dayEvents   = day ? filteredEvents.filter(e => e.fecha === dateKey) : [];

              return (
                <div
                  key={idx}
                  onClick={() => handleDayClick(day)}
                  style={{
                    borderRight: '1px solid var(--border-card)',
                    borderBottom: '1px solid var(--border-card)',
                    padding: '8px',
                    background: isSelected ? 'rgba(79,70,229,0.06)' : isToday ? 'rgba(255,109,77,0.02)' : '#FFFFFF',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                    cursor: day ? 'pointer' : 'default',
                    transition: 'background 0.15s',
                    outline: isSelected ? '2px solid #4f46e5' : 'none',
                    outlineOffset: '-2px',
                    borderRadius: isSelected ? '4px' : '0'
                  }}
                  className={day ? 'calendar-cell-hover' : ''}
                >
                  {/* Day number */}
                  {day && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2px' }}>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: isToday ? 'var(--accent-coral)' : isSelected ? '#4f46e5' : 'var(--text-primary)', background: isToday ? 'rgba(255,109,77,0.12)' : isSelected ? 'rgba(79,70,229,0.12)' : 'transparent', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {day}
                      </span>
                      {dayEvents.length > 0 && (
                        <span style={{ fontSize: '9px', fontWeight: '800', color: isSelected ? '#4f46e5' : '#94a3b8', background: isSelected ? 'rgba(79,70,229,0.12)' : '#f1f5f9', padding: '1px 5px', borderRadius: '10px' }}>
                          {dayEvents.length}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Event dots/chips */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
                    {dayEvents.map((evt, eIdx) => {
                      const pColor = evt.prioridad === 'Alta' ? '#EF4444' : evt.prioridad === 'Media' ? '#D97706' : '#2563EB';
                      const pBg    = evt.prioridad === 'Alta' ? 'rgba(239,68,68,0.08)' : evt.prioridad === 'Media' ? 'rgba(245,158,11,0.08)' : 'rgba(59,130,246,0.08)';
                      const label  = evt.replicarGlobal || evt.tienda === 'Todos' ? `[GLOBAL] ${evt.titulo}` : `[${evt.tienda}] ${evt.titulo}`;
                      return (
                        <div key={eIdx} className="calendar-event-item"
                          onClick={(e) => handleEventClick(e, evt)}
                          title={`${label} (${evt.hora}) — ${evt.descripcion}`}
                          style={{ fontSize: '8.5px', fontWeight: '800', background: pBg, color: pColor, padding: '2px 5px', borderRadius: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', borderLeft: `2.5px solid ${pColor}`, transition: 'opacity 0.2s' }}>
                          {label}
                        </div>
                      );
                    })}
                    {dayEvents.length === 0 && day && (
                      <div style={{ display: 'flex', gap: '3px', marginTop: '2px' }}>
                        {/* empty dot placeholder for visual consistency */}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── CHRONOGRAM SECTION ────────────────────────────────────────────── */}
      <div>
        {/* Filter banner */}
        {selectedDayFilter && (
          <div style={{ background: 'linear-gradient(135deg,#eef2ff,#f0f4ff)', border: '1px solid #c7d2fe', borderRadius: '12px', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '28px', height: '28px', background: '#4f46e5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="fas fa-filter" style={{ color: '#fff', fontSize: '11px' }}></i>
              </div>
              <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>
                Mostrando solo actividades para el día:{' '}
                <strong style={{ color: '#1e293b', fontWeight: '800' }}>
                  {new Date(selectedDayFilter + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                </strong>
              </span>
            </div>
            <button
              onClick={() => setSelectedDayFilter(null)}
              style={{ fontSize: '12px', fontWeight: '700', color: '#4f46e5', background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.2)', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s' }}
            >
              Ver todo el mes <i className="fas fa-times" style={{ fontSize: '10px' }}></i>
            </button>
          </div>
        )}

        {/* Chronogram header card */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '18px 24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg,#dcfce7,#bbf7d0)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="fas fa-stream" style={{ color: '#16a34a', fontSize: '17px' }}></i>
              </div>
              <div>
                <div style={{ fontWeight: '800', fontSize: '15px', color: '#1e293b' }}>Cronograma de Actividades</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '1px' }}>Listado lineal y temporal de compromisos</div>
              </div>
            </div>
            {/* Legend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {[['#94a3b8','Pasado'],['#4f46e5','Hoy'],['#f59e0b','Futuro']].map(([color, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }}></div>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline */}
        {chronogramGroups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 24px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <i className="fas fa-calendar-times" style={{ fontSize: '44px', display: 'block', marginBottom: '14px', opacity: 0.25, color: '#64748b' }}></i>
            <p style={{ fontWeight: '800', color: '#64748b', margin: '0 0 6px', fontSize: '15px' }}>Sin actividades para este período</p>
            <p style={{ fontSize: '12px', margin: 0, color: '#94a3b8' }}>
              {selectedDayFilter ? 'No hay eventos para este día.' : `Haz clic en "+ Añadir Actividad" para registrar tu primer evento de ${monthNames[currentMonth]}.`}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {/* Vertical timeline backbone */}
            <div style={{ position: 'absolute', left: '103px', top: 0, bottom: 0, width: '2px', background: 'linear-gradient(180deg,#e2e8f0,#e2e8f0)', zIndex: 0 }}></div>

            {chronogramGroups.map(([dateKey, dayEvts], groupIdx) => {
              const date     = new Date(dateKey + 'T12:00:00');
              const isToday  = dateKey === todayISO;
              const isPast   = dateKey < todayISO;
              const dotColor = isToday ? '#4f46e5' : isPast ? '#94a3b8' : '#f59e0b';
              const dayName  = DAY_NAMES_SHORT[date.getDay()];
              const dayNum   = date.getDate();
              const fullLabel = `${DAY_NAMES_FULL[date.getDay()]}, ${dayNum} de ${MONTH_NAMES_FULL[date.getMonth()]}`;

              return (
                <div key={dateKey} style={{ display: 'flex', gap: '0', marginBottom: groupIdx < chronogramGroups.length - 1 ? '32px' : '0', position: 'relative', zIndex: 1 }}>
                  {/* Left: day label */}
                  <div style={{ width: '80px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '14px', gap: '2px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: isToday ? '#4f46e5' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{dayName}</span>
                    <span style={{ fontSize: '34px', fontWeight: '900', color: isToday ? '#4f46e5' : '#1e293b', lineHeight: 1 }}>{dayNum}</span>
                  </div>

                  {/* Timeline dot */}
                  <div style={{ width: '48px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '18px' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: dotColor, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 0 4px ${dotColor}20`, zIndex: 2, flexShrink: 0 }}>
                      <i className="fas fa-play" style={{ color: '#fff', fontSize: '10px', marginLeft: '2px' }}></i>
                    </div>
                  </div>

                  {/* Right: date header + event cards */}
                  <div style={{ flex: 1, paddingTop: '10px', paddingLeft: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Date header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '16px', fontWeight: '800', color: isToday ? '#4f46e5' : '#1e293b' }}>{fullLabel}</span>
                      {isToday && (
                        <span style={{ fontSize: '10px', fontWeight: '800', color: '#4f46e5', background: '#ede9fe', padding: '3px 8px', borderRadius: '6px', letterSpacing: '0.04em' }}>DÍA DE HOY</span>
                      )}
                      {isPast && (
                        <span style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px' }}>PASADO</span>
                      )}
                      {!isToday && !isPast && (
                        <span style={{ fontSize: '10px', fontWeight: '700', color: '#d97706', background: '#fef3c7', padding: '3px 8px', borderRadius: '6px' }}>PRÓXIMO</span>
                      )}
                    </div>

                    {/* Event cards */}
                    {dayEvts.map(evt => {
                      const pColor = evt.prioridad === 'Alta' ? '#EF4444' : evt.prioridad === 'Media' ? '#D97706' : '#2563EB';
                      const pBg    = evt.prioridad === 'Alta' ? '#fee2e2' : evt.prioridad === 'Media' ? '#fef3c7' : '#dbeafe';
                      const isGlobal = evt.replicarGlobal || evt.tienda === 'Todos';
                      return (
                        <div key={evt.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px 22px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', transition: 'box-shadow 0.2s,transform 0.2s' }}
                          onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                          {/* Card top row: badges + time */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '11px', fontWeight: '800', color: '#fff', background: isGlobal ? '#4f46e5' : '#1e293b', padding: '4px 9px', borderRadius: '6px', letterSpacing: '0.03em' }}>
                                TIENDA: {isGlobal ? 'GLOBAL' : evt.tienda}
                              </span>
                              <span style={{ fontSize: '11px', fontWeight: '700', color: pColor, background: pBg, padding: '4px 9px', borderRadius: '6px' }}>
                                {evt.prioridad}
                              </span>
                              {isToday && (
                                <span style={{ fontSize: '10px', fontWeight: '800', color: '#4f46e5', background: '#ede9fe', padding: '3px 8px', borderRadius: '6px' }}>HOY</span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b', flexShrink: 0 }}>
                              <i className="fas fa-clock" style={{ fontSize: '12px' }}></i>
                              <span style={{ fontSize: '13px', fontWeight: '700' }}>{evt.hora} hrs</span>
                            </div>
                          </div>

                          {/* Title */}
                          <div style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b', marginBottom: evt.descripcion ? '8px' : '12px', lineHeight: 1.3 }}>{evt.titulo}</div>

                          {/* Description */}
                          {evt.descripcion && (
                            <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, marginBottom: '14px' }}>{evt.descripcion}</div>
                          )}

                          {/* Edit button */}
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              onClick={(e) => handleEventClick(e, evt)}
                              style={{ fontSize: '12px', fontWeight: '700', color: '#4f46e5', background: 'rgba(79,70,229,0.07)', border: '1px solid rgba(79,70,229,0.15)', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(79,70,229,0.14)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(79,70,229,0.07)'; }}
                            >
                              <i className="fas fa-edit" style={{ fontSize: '11px' }}></i> Editar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── EVENT MODAL ───────────────────────────────────────────────────── */}
      {isEventModalOpen && (
        <div className="modal-overlay active" style={{ zIndex: 10000 }}>
          <div className="modal-box" style={{ maxWidth: '480px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className={`fas ${editingEventId !== null ? 'fa-edit' : 'fa-calendar-plus'}`} style={{ color: '#4f46e5' }}></i>
                {editingEventId !== null ? 'Editar Evento' : `Registrar Evento · ${selectedDayForEvent?.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}`}
              </h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '16px', lineHeight: 1 }} onClick={() => setIsEventModalOpen(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSaveEvent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ textAlign: 'left' }}>
                <label className="form-label" style={{ fontSize: '10.5px' }}>Título del Evento</label>
                <input type="text" className="form-control" placeholder="Ej: Entrega de Trofeos..." value={eventForm.titulo} onChange={e => setEventForm(p => ({ ...p, titulo: e.target.value }))} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ textAlign: 'left' }}>
                  <label className="form-label" style={{ fontSize: '10.5px' }}>Hora</label>
                  <input type="time" className="form-control" value={eventForm.hora} onChange={e => setEventForm(p => ({ ...p, hora: e.target.value }))} required />
                </div>
                <div className="form-group" style={{ textAlign: 'left' }}>
                  <label className="form-label" style={{ fontSize: '10.5px' }}>Tienda</label>
                  <select className="select-filter" value={eventForm.tienda} onChange={e => setEventForm(p => ({ ...p, tienda: e.target.value }))} style={{ width: '100%', padding: '10px' }} disabled={eventForm.replicarGlobal && userRole === 'admin'}>
                    {STORES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ textAlign: 'left' }}>
                  <label className="form-label" style={{ fontSize: '10.5px' }}>Prioridad</label>
                  <select className="select-filter" value={eventForm.prioridad} onChange={e => setEventForm(p => ({ ...p, prioridad: e.target.value }))} style={{ width: '100%', padding: '10px' }}>
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ textAlign: 'left' }}>
                <label className="form-label" style={{ fontSize: '10.5px' }}>Descripción</label>
                <textarea className="form-control" placeholder="Detalles sobre el evento..." rows="3" value={eventForm.descripcion} onChange={e => setEventForm(p => ({ ...p, descripcion: e.target.value }))} />
              </div>

              {userRole === 'admin' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(79,70,229,0.05)', padding: '10px 14px', borderRadius: '8px', border: '1px dashed rgba(79,70,229,0.2)' }}>
                  <input type="checkbox" id="chk-replicar" checked={eventForm.replicarGlobal} onChange={e => setEventForm(p => ({ ...p, replicarGlobal: e.target.checked }))} style={{ cursor: 'pointer' }} />
                  <label htmlFor="chk-replicar" style={{ fontSize: '11.5px', fontWeight: '700', color: '#4f46e5', cursor: 'pointer' }}>
                    📢 Replicar en todas las tiendas (14 sucursales)
                  </label>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" className="topbar-btn btn-outline" onClick={() => setIsEventModalOpen(false)}>Cancelar</button>
                <button type="submit" className="topbar-btn btn-primary">{editingEventId !== null ? 'Guardar Cambios' : 'Registrar Evento'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
