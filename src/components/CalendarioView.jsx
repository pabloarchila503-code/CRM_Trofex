import { useState, useMemo } from 'react';

const STORES = ['CB', 'CHM', 'CHQ', 'ESC', 'HH', 'JT', 'MZ', 'PT', 'PTB', 'SJ', 'SMA', 'VN', 'XL', 'Z3'];

// Initial mock events (some pre-loaded to look natural)
const INITIAL_EVENTS = [
  { id: 'ev1', fecha: '2026-06-02', titulo: 'Entrega Medallas Ciclismo', hora: '10:00', prioridad: 'Alta', descripcion: 'Despacho de medallas personalizadas para competencia en Quetzaltenango.', tienda: 'CB', creadoPor: 'margarita.cb@tuempresa.com', replicarGlobal: false },
  { id: 'ev2', fecha: '2026-06-05', titulo: 'Corte Contable Quincenal', hora: '17:00', prioridad: 'Media', descripcion: 'Revisión y cierre de contabilidad del período.', tienda: 'Todos', creadoPor: 'admin@tuempresa.com', replicarGlobal: true },
  { id: 'ev3', fecha: '2026-06-08', titulo: 'Despacho Trofeos Copa Oro', hora: '11:30', prioridad: 'Alta', descripcion: 'Despacho de copas premium grabadas para la final de fútbol.', tienda: 'JT', creadoPor: 'jose.jt@tuempresa.com', replicarGlobal: false },
  { id: 'ev4', fecha: '2026-06-10', titulo: 'Revisión Catálogos Nuevos', hora: '09:00', prioridad: 'Baja', descripcion: 'Revisión física de los nuevos marcos y muestras de acrílico.', tienda: 'Z3', creadoPor: 'zoila.z3@tuempresa.com', replicarGlobal: false },
  { id: 'ev5', fecha: '2026-06-15', titulo: 'Depósito Mensual Cierre', hora: '16:00', prioridad: 'Alta', descripcion: 'Corte y depósito final del mes.', tienda: 'Todos', creadoPor: 'admin@tuempresa.com', replicarGlobal: true }
];

export default function CalendarioView({ 
  activeStore = 'Todos', 
  userRole = 'admin'
}) {
  const storeCode = activeStore === 'Todos' ? 'CB' : activeStore;
  
  // Date states
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayForEvent, setSelectedDayForEvent] = useState(null); // Date object for clicked day
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [editingEventId, setEditingEventId] = useState(null); // ID of the event being edited
  const [calendarStoreFilter, setCalendarStoreFilter] = useState('Todos'); // Local store filter dropdown
  
  // Modal states
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventForm, setEventForm] = useState({ titulo: '', hora: '12:00', prioridad: 'Media', descripcion: '', tienda: 'CB', replicarGlobal: false });

  // Monthly Calendar logic
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startDayOffset = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun, 1 = Mon
  const gridOffset = startDayOffset === 0 ? 6 : startDayOffset - 1; // Map Sunday to 6, Mon to 0

  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blankDays = Array.from({ length: gridOffset }, () => null);
  const gridDays = [...blankDays, ...calendarDays];

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Click on calendar day cell (Create mode)
  const handleDayClick = (day) => {
    if (!day) return;
    const clickedDate = new Date(currentYear, currentMonth, day);
    setSelectedDayForEvent(clickedDate);
    setEditingEventId(null); // Reset edit state
    setEventForm({ 
      titulo: '', 
      hora: '12:00', 
      prioridad: 'Media', 
      descripcion: '', 
      tienda: storeCode, // Default to logged-in store or CB
      replicarGlobal: false 
    });
    setIsEventModalOpen(true);
  };

  // Click on event item (Edit mode)
  const handleEventClick = (e, evt) => {
    e.stopPropagation(); // Prevent opening the day creation modal
    const eventDate = new Date(evt.fecha + 'T12:00:00');
    setSelectedDayForEvent(eventDate);
    setEditingEventId(evt.id);
    setEventForm({
      titulo: evt.titulo,
      hora: evt.hora,
      prioridad: evt.prioridad,
      descripcion: evt.descripcion || '',
      tienda: evt.replicarGlobal ? 'CB' : evt.tienda,
      replicarGlobal: evt.replicarGlobal || false
    });
    setIsEventModalOpen(true);
  };

  // Save/Update calendar event
  const handleSaveEvent = (e) => {
    e.preventDefault();
    if (!eventForm.titulo.trim()) {
      alert('Por favor, ingresa el título del evento.');
      return;
    }

    const isoDateStr = selectedDayForEvent.toISOString().slice(0, 10);
    
    if (editingEventId !== null) {
      // Edit Mode
      setEvents(prev => prev.map(evt => {
        if (evt.id === editingEventId) {
          return {
            ...evt,
            titulo: eventForm.titulo,
            hora: eventForm.hora,
            prioridad: eventForm.prioridad,
            descripcion: eventForm.descripcion,
            tienda: eventForm.replicarGlobal && userRole === 'admin' ? 'Todos' : eventForm.tienda,
            replicarGlobal: eventForm.replicarGlobal && userRole === 'admin'
          };
        }
        return evt;
      }));
      alert('Evento actualizado exitosamente en la base de datos (BD_Calendario_Eventos).');
    } else {
      // Create Mode
      const newEvent = {
        id: 'ev' + Date.now(),
        fecha: isoDateStr,
        titulo: eventForm.titulo,
        hora: eventForm.hora,
        prioridad: eventForm.prioridad,
        descripcion: eventForm.descripcion,
        tienda: eventForm.replicarGlobal && userRole === 'admin' ? 'Todos' : eventForm.tienda,
        creadoPor: userRole === 'admin' ? 'admin@tuempresa.com' : `${storeCode.toLowerCase()}@tuempresa.com`,
        replicarGlobal: eventForm.replicarGlobal && userRole === 'admin'
      };

      setEvents(prev => [...prev, newEvent]);
      alert(`Evento registrado exitosamente en la base de datos de Google Sheets (BD_Calendario_Eventos). ${newEvent.replicarGlobal ? 'Replicado en las 14 tiendas.' : ''}`);
    }

    setIsEventModalOpen(false);
    setEditingEventId(null);
  };

  // Filter events by global activeStore for data access
  const filteredEvents = useMemo(() => {
    return events.filter(evt => {
      if (activeStore === 'Todos') return true;
      return evt.tienda === activeStore || evt.tienda === 'Todos' || evt.replicarGlobal;
    });
  }, [events, activeStore]);
  return (
    <div className="view-section active">
      <p className="section-label">Operaciones Administrativas — Calendario de Eventos</p>

      {/* 3. Calendario Mensual de Operaciones (Medio) */}
      <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 className="card-title" style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-calendar-alt" style={{ color: 'var(--accent-coral)' }}></i>
              Calendario Mensual de Eventos
            </h3>
            <p className="card-subtitle">Haz clic en cualquier día para registrar un nuevo evento en Sheets</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Local Store Filter Dropdown */}
            <select
              value={calendarStoreFilter}
              onChange={(e) => setCalendarStoreFilter(e.target.value)}
              className="select-filter"
              style={{ 
                padding: '6px 12px', 
                fontSize: '12px', 
                fontWeight: '700',
                borderColor: 'var(--border-light)',
                background: 'var(--bg-body)',
                color: 'var(--text-primary)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                marginRight: '8px'
              }}
            >
              <option value="Todos">Todas las Tiendas</option>
              {STORES.map(store => (
                <option key={store} value={store}>{store}</option>
              ))}
            </select>

            <button className="topbar-btn btn-outline" style={{ padding: '6px 10px' }} onClick={handlePrevMonth}>
              <i className="fas fa-chevron-left"></i>
            </button>
            <span style={{ fontSize: '13px', fontWeight: '800', minWidth: '110px', textAlign: 'center' }}>
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button className="topbar-btn btn-outline" style={{ padding: '6px 10px' }} onClick={handleNextMonth}>
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>

        {/* Monthly Calendar Grid */}
        <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            background: 'var(--bg-body)', 
            borderBottom: '1px solid var(--border-light)',
            textAlign: 'center',
            padding: '8px 0'
          }}>
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
              <span key={d} style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                {d}
              </span>
            ))}
          </div>

          <div className="calendar-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            gridAutoRows: '100px',
            background: '#FFFFFF'
          }}>
            {gridDays.map((day, idx) => {
              const isToday = day === new Date().getDate() && currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear();
              const dateKey = day ? `${currentYear}-${(currentMonth+1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}` : '';
              
              const dayEvents = day ? filteredEvents.filter(e => e.fecha === dateKey) : [];

              return (
                <div 
                  key={idx} 
                  onClick={() => handleDayClick(day)}
                  style={{ 
                    borderRight: '1px solid var(--border-card)',
                    borderBottom: '1px solid var(--border-card)',
                    padding: '8px',
                    background: isToday ? 'rgba(255, 109, 77, 0.02)' : '#FFFFFF',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    cursor: day ? 'pointer' : 'default',
                    transition: 'background 0.15s ease'
                  }}
                  className={day ? "calendar-cell-hover" : ""}
                >
                  {day && (
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: '800', 
                      color: isToday ? 'var(--accent-coral)' : 'var(--text-primary)',
                      background: isToday ? 'rgba(255, 109, 77, 0.12)' : 'transparent',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '4px'
                    }}>
                      {day}
                    </span>
                  )}

                  <div className="calendar-event-container" style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
                    {dayEvents.map((evt, eIdx) => {
                      let priorityColor = '#2563EB'; // Baja
                      let priorityBg = 'rgba(59, 130, 246, 0.08)';
                      
                      if (evt.prioridad === 'Alta') {
                        priorityColor = '#EF4444';
                        priorityBg = 'rgba(239, 68, 68, 0.08)';
                      } else if (evt.prioridad === 'Media') {
                        priorityColor = '#D97706';
                        priorityBg = 'rgba(245, 158, 11, 0.08)';
                      }

                      // Focus Opacity calculation
                      const isMatched = calendarStoreFilter === 'Todos' || 
                                        evt.tienda === calendarStoreFilter || 
                                        evt.tienda === 'Todos' || 
                                        evt.replicarGlobal;
                      const eventOpacity = isMatched ? 1 : 0.2;

                      // Display Label with bracketed store code
                      const displayTitle = evt.replicarGlobal || evt.tienda === 'Todos'
                        ? `[GLOBAL] ${evt.titulo}`
                        : `[${evt.tienda || 'CB'}] ${evt.titulo}`;

                      return (
                        <div 
                          key={eIdx}
                          className="calendar-event-item"
                          style={{
                            fontSize: '8.5px',
                            fontWeight: '800',
                            background: priorityBg,
                            color: priorityColor,
                            padding: '2px 5px',
                            borderRadius: '4px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            borderLeft: `2.5px solid ${priorityColor}`,
                            opacity: eventOpacity,
                            transition: 'opacity 0.2s ease'
                          }}
                          title={`${displayTitle} (${evt.hora}) - ${evt.descripcion}`}
                          onClick={(e) => handleEventClick(e, evt)}
                        >
                          {displayTitle}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. MODAL: Event Creator / Editor Modal */}
      {isEventModalOpen && (
        <div className="modal-overlay active" style={{ zIndex: 10000 }}>
          <div className="modal-box" style={{ maxWidth: '460px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
                {editingEventId !== null ? '📝 Editar Evento' : `📅 Registrar Nuevo Evento para ${selectedDayForEvent?.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}`}
              </h3>
              <i className="fas fa-times" style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setIsEventModalOpen(false)}></i>
            </div>
            
            <form onSubmit={handleSaveEvent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ textAlign: 'left' }}>
                <label className="form-label" style={{ fontSize: '10.5px' }}>Título del Evento</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ej: Entrega de Trofeos..." 
                  value={eventForm.titulo}
                  onChange={(e) => setEventForm(prev => ({ ...prev, titulo: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ textAlign: 'left' }}>
                  <label className="form-label" style={{ fontSize: '10.5px' }}>Hora Programada</label>
                  <input 
                    type="time" 
                    className="form-control" 
                    value={eventForm.hora}
                    onChange={(e) => setEventForm(prev => ({ ...prev, hora: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group" style={{ textAlign: 'left' }}>
                  <label className="form-label" style={{ fontSize: '10.5px' }}>Tienda</label>
                  <select 
                    className="select-filter" 
                    value={eventForm.tienda || storeCode}
                    onChange={(e) => setEventForm(prev => ({ ...prev, tienda: e.target.value }))}
                    style={{ width: '100%', padding: '10px' }}
                    disabled={eventForm.replicarGlobal && userRole === 'admin'}
                  >
                    {STORES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ textAlign: 'left' }}>
                  <label className="form-label" style={{ fontSize: '10.5px' }}>Prioridad</label>
                  <select 
                    className="select-filter" 
                    value={eventForm.prioridad}
                    onChange={(e) => setEventForm(prev => ({ ...prev, prioridad: e.target.value }))}
                    style={{ width: '100%', padding: '10px' }}
                  >
                    <option value="Baja">Baja (Verde/Azul)</option>
                    <option value="Media">Media (Amarillo)</option>
                    <option value="Alta">Alta (Rojo)</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ textAlign: 'left' }}>
                <label className="form-label" style={{ fontSize: '10.5px' }}>Descripción</label>
                <textarea 
                  className="form-control" 
                  placeholder="Detalles sobre el evento, entregas o cierres..." 
                  rows="3"
                  value={eventForm.descripcion}
                  onChange={(e) => setEventForm(prev => ({ ...prev, descripcion: e.target.value }))}
                />
              </div>

              {/* Admin replication checkbox */}
              {userRole === 'admin' && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  background: 'rgba(255, 109, 77, 0.05)', 
                  padding: '10px 14px', 
                  borderRadius: '6px',
                  border: '1px dashed rgba(255, 109, 77, 0.2)',
                  marginTop: '4px'
                }}>
                  <input 
                    type="checkbox" 
                    id="chk-replicar"
                    checked={eventForm.replicarGlobal}
                    onChange={(e) => setEventForm(prev => ({ ...prev, replicarGlobal: e.target.checked }))}
                    style={{ cursor: 'pointer' }}
                  />
                  <label htmlFor="chk-replicar" style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--accent-coral)', cursor: 'pointer' }}>
                    📢 Replicar en todas las tiendas (14 sucursales)
                  </label>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="topbar-btn btn-outline" onClick={() => setIsEventModalOpen(false)}>Cancelar</button>
                <button type="submit" className="topbar-btn btn-primary">
                  {editingEventId !== null ? 'Guardar Cambios' : 'Registrar Evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
}
