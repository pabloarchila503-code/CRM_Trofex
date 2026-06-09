import React, { useState, useEffect, useMemo } from 'react';

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
  userRole = 'admin', 
  checkedTasks, 
  setCheckedTasks, 
  savedDays, 
  setSavedDays, 
  weeklyTasks, 
  setWeeklyTasks 
}) {
  const storeCode = activeStore === 'Todos' ? 'CB' : activeStore;
  
  // Date states
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayForEvent, setSelectedDayForEvent] = useState(null); // Date object for clicked day
  const [events, setEvents] = useState(INITIAL_EVENTS);
  
  // Modal states
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventForm, setEventForm] = useState({ titulo: '', hora: '12:00', prioridad: 'Media', descripcion: '', replicarGlobal: false });
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertDismissedToday, setAlertDismissedToday] = useState(false);
  
  // Admin tasks management states
  const [adminActividad, setAdminActividad] = useState('');
  const [adminDescripcion, setAdminDescripcion] = useState('');
  const [adminObligatorio, setAdminObligatorio] = useState('Sí');
  const [editingTaskId, setEditingTaskId] = useState(null);

  // Cronograma states
  const getSystemDayTab = () => {
    const day = new Date().getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    if (day === 0) return 'Lun'; // Sunday defaults to Lun
    const dayMap = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    return dayMap[day];
  };

  const [activeTab, setActiveTab] = useState(getSystemDayTab());
  
  // Clock state to trigger 16:30 alert
  const [systemTime, setSystemTime] = useState(new Date());

  // Interval for clock and warning modal
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setSystemTime(now);
      
      const currentDay = now.getDay();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      
      // 16:30 is 16 * 60 + 30 = 990 minutes
      const isWorkDay = currentDay >= 1 && currentDay <= 6; // Mon - Sat
      const todayTab = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'][currentDay];
      
      if (isWorkDay && currentMinutes >= 990 && !savedDays[todayTab] && !alertDismissedToday && !isAlertModalOpen) {
        setIsAlertModalOpen(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [savedDays, alertDismissedToday, isAlertModalOpen]);

  // Compute tasks for current selected tab
  const activeTasks = useMemo(() => {
    return weeklyTasks[activeTab] || [];
  }, [weeklyTasks, activeTab]);

  // Toggle tasks checkbox handler
  const handleToggleCronogramaTask = (taskId) => {
    if (savedDays[activeTab]) return; // locked/frozen

    setCheckedTasks(prev => {
      const dayTasks = { ...prev[activeTab] };
      dayTasks[taskId] = !dayTasks[taskId];
      return { ...prev, [activeTab]: dayTasks };
    });
  };

  // Save Progress click handler
  const handleSaveProgress = () => {
    setSavedDays(prev => ({ ...prev, [activeTab]: true }));
    // Simulate database write
    alert(`Sincronización exitosa con BD_Historial_Cronograma. Las actividades para el día ${activeTab} se han congelado.`);
  };

  // Get ISO week number
  const getWeekNumber = (d) => {
    const target = new Date(d.valueOf());
    const dayNr = (d.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target) / 604800000);
  };

  // Calculate dynamic week dates starting on Monday of this week
  const getWeekDayDates = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const distance = currentDay === 0 ? -6 : 1 - currentDay; // distance to Monday
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + distance);
    
    const dayMap = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    const dayInitials = { Lun: 'L', Mar: 'M', Mie: 'M', Jue: 'J', Vie: 'V', Sab: 'S' };
    const weekNo = getWeekNumber(today);
    
    const daysData = {};
    dayMap.forEach((day, index) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + index);
      const dayNum = d.getDate().toString().padStart(2, '0');
      const initial = dayInitials[day];
      daysData[day] = {
        label: `S${weekNo}-${initial}${dayNum}`,
        date: d
      };
    });
    
    return daysData;
  }, []);

  const monthYearLabel = useMemo(() => {
    const today = new Date();
    const monthNamesUpper = [
      'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
      'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
    ];
    return `${monthNamesUpper[today.getMonth()]} ${today.getFullYear()}`;
  }, []);

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

  // Click on calendar day cell
  const handleDayClick = (day) => {
    if (!day) return;
    const clickedDate = new Date(currentYear, currentMonth, day);
    setSelectedDayForEvent(clickedDate);
    setEventForm({ titulo: '', hora: '12:00', prioridad: 'Media', descripcion: '', replicarGlobal: false });
    setIsEventModalOpen(true);
  };

  // Save calendar event
  const handleSaveEvent = (e) => {
    e.preventDefault();
    if (!eventForm.titulo.trim()) {
      alert('Por favor, ingresa el título del evento.');
      return;
    }

    const isoDateStr = selectedDayForEvent.toISOString().slice(0, 10);
    const newEvent = {
      id: 'ev' + Date.now(),
      fecha: isoDateStr,
      titulo: eventForm.titulo,
      hora: eventForm.hora,
      prioridad: eventForm.prioridad,
      descripcion: eventForm.descripcion,
      tienda: eventForm.replicarGlobal && userRole === 'admin' ? 'Todos' : storeCode,
      creadoPor: userRole === 'admin' ? 'admin@tuempresa.com' : `${storeCode.toLowerCase()}@tuempresa.com`,
      replicarGlobal: eventForm.replicarGlobal && userRole === 'admin'
    };

    setEvents(prev => [...prev, newEvent]);
    setIsEventModalOpen(false);
    
    // Simulate App Script call
    alert(`Evento registrado exitosamente en la base de datos de Google Sheets (BD_Calendario_Eventos). ${newEvent.replicarGlobal ? 'Replicado en las 14 tiendas.' : ''}`);
  };

  // Filter events to render in calendar cells
  const filteredEvents = useMemo(() => {
    return events.filter(evt => {
      if (activeStore === 'Todos') return true;
      return evt.tienda === activeStore || evt.tienda === 'Todos' || evt.replicarGlobal;
    });
  }, [events, activeStore]);

  // Admin tasks management handlers
  const handleSaveAdminTask = (e) => {
    e.preventDefault();
    if (!adminActividad.trim()) return;

    setWeeklyTasks(prev => {
      const dayTasks = [...(prev[activeTab] || [])];
      if (editingTaskId !== null) {
        const updated = dayTasks.map(t => {
          if (t.id === editingTaskId) {
            return {
              ...t,
              name: adminActividad,
              desc: adminDescripcion,
              obligatoria: adminObligatorio === 'Sí',
              icon: t.icon || '📋'
            };
          }
          return t;
        });
        return { ...prev, [activeTab]: updated };
      } else {
        const newId = dayTasks.length > 0 ? Math.max(...dayTasks.map(t => t.id)) + 1 : 1;
        const newTask = {
          id: newId,
          name: adminActividad,
          desc: adminDescripcion,
          obligatoria: adminObligatorio === 'Sí',
          icon: '📋'
        };
        return { ...prev, [activeTab]: [...dayTasks, newTask] };
      }
    });

    setAdminActividad('');
    setAdminDescripcion('');
    setAdminObligatorio('Sí');
    setEditingTaskId(null);
  };

  const handleEditAdminTask = (task) => {
    setAdminActividad(task.name);
    setAdminDescripcion(task.desc || '');
    setAdminObligatorio(task.obligatoria ? 'Sí' : 'No');
    setEditingTaskId(task.id);
  };

  const handleDeleteAdminTask = (taskId) => {
    if (window.confirm('¿Seguro que deseas eliminar esta actividad?')) {
      setWeeklyTasks(prev => {
        const filtered = (prev[activeTab] || []).filter(t => t.id !== taskId);
        return { ...prev, [activeTab]: filtered };
      });
      if (editingTaskId === taskId) {
        setEditingTaskId(null);
        setAdminActividad('');
        setAdminDescripcion('');
        setAdminObligatorio('Sí');
      }
    }
  };

  return (
    <div className="view-section active">
      <p className="section-label">Operaciones Administrativas — Agenda y Cronograma</p>

      {/* 1. Cronograma de Actividades Semanal (Superior) */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header" style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--accent-coral)', display: 'inline-flex', padding: '5px', background: 'rgba(255, 109, 77, 0.1)', borderRadius: '6px' }}>
              <i className="fas fa-calendar-check" style={{ fontSize: '14px' }}></i>
            </span>
            <div>
              <h3 className="card-title" style={{ fontSize: '14.5px' }}>Cronograma de Actividades Obligatorias</h3>
              <p className="card-subtitle">Tareas operacionales asignadas de Lunes a Sábado</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span className="stage-badge" style={{ background: 'var(--accent-coral)', color: '#FFFFFF', fontSize: '10px', fontWeight: '800', padding: '3px 8px', textTransform: 'uppercase' }}>
              {monthYearLabel}
            </span>
            <span className="stage-badge" style={{ background: '#f8fafc', color: 'var(--text-secondary)', fontSize: '10px', border: '1.5px solid var(--border-light)', fontWeight: '700' }}>
              {activeStore === 'Todos' ? 'Red General' : `Tienda: ${activeStore}`}
            </span>
          </div>
        </div>

        <div style={{ padding: '20px' }}>
          <div className="cronograma-tabs" style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', marginBottom: '20px', gap: '4px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map(day => {
              const isActive = activeTab === day;
              const isSaved = savedDays[day];
              const tabInfo = getWeekDayDates[day] || { label: day };
              
              return (
                <button
                  key={day}
                  onClick={() => setActiveTab(day)}
                  style={{
                    padding: '10px 20px',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    border: 'none',
                    background: 'transparent',
                    borderBottom: isActive ? '3.5px solid var(--accent-coral)' : '3.5px solid transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}
                >
                  {tabInfo.label}
                  {isSaved && <span style={{ fontSize: '10px' }}>🔒</span>}
                </button>
              );
            })}
          </div>

          {/* Activities list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {activeTab === 'Mie' && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1.5px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '20px' }}>⚠️</span>
                <div style={{ textAlign: 'left' }}>
                  <strong style={{ fontSize: '12.5px', color: '#B45309', display: 'block' }}>Advertencia Comercial Semanal</strong>
                  <span style={{ fontSize: '11px', color: '#92400E' }}>
                    Si tu avance comercial y tasa de conversión son menores al 80%, debes reportar de inmediato con tu supervisor de red.
                  </span>
                </div>
              </div>
            )}

            {activeTasks.map(task => {
              const isChecked = (checkedTasks[activeTab] || {})[task.id] || false;
              const isFrozen = savedDays[activeTab];
              
              return (
                <div 
                  key={task.id}
                  onClick={() => handleToggleCronogramaTask(task.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: isChecked ? 'rgba(16, 185, 129, 0.04)' : '#FFFFFF',
                    border: isChecked ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid var(--border-light)',
                    borderRadius: '8px',
                    cursor: isFrozen ? 'not-allowed' : 'pointer',
                    opacity: isFrozen ? 0.75 : 1,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '16px' }}>{task.icon || '📋'}</span>
                    <span style={{ 
                      fontSize: '13px', 
                      fontWeight: '600', 
                      color: isChecked ? 'var(--text-primary)' : 'var(--text-secondary)',
                      textDecoration: isChecked ? 'line-through' : 'none',
                      opacity: isChecked ? 0.75 : 1
                    }}>
                      {task.name}
                    </span>
                  </div>
                  <div>
                    {task.obligatoria !== false && (
                      <span className="stage-badge" style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#EF4444', fontSize: '9px', fontWeight: '800', border: '1px solid rgba(239,68,68,0.15)', marginRight: '10px' }}>
                        Obligatorio
                      </span>
                    )}
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      disabled={isFrozen}
                      onChange={() => {}} // handled by outer container onClick
                      style={{ transform: 'scale(1.2)', cursor: isFrozen ? 'not-allowed' : 'pointer' }}
                    />
                  </div>
                </div>
              );
            })}

            {activeTasks.length === 0 && (
              <div className="empty-state">
                <i className="fas fa-clipboard-list"></i> No hay actividades registradas para este día.
              </div>
            )}
          </div>

          {activeStore !== 'Todos' && activeTasks.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                className="topbar-btn btn-primary"
                onClick={handleSaveProgress}
                disabled={savedDays[activeTab]}
                style={{
                  background: savedDays[activeTab] ? '#94A3B8' : 'linear-gradient(135deg, var(--accent-coral), #FF9070)',
                  boxShadow: savedDays[activeTab] ? 'none' : '0 4px 12px rgba(255,109,77,0.35)',
                  cursor: savedDays[activeTab] ? 'not-allowed' : 'pointer'
                }}
              >
                <i className={savedDays[activeTab] ? "fas fa-lock" : "fas fa-cloud-upload-alt"} style={{ marginRight: '8px' }}></i>
                {savedDays[activeTab] ? 'Progreso Guardado (Congelado)' : 'Guardar Progreso del Día'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Panel de Administración de Tareas Interactivo (Exclusive to Admin) */}
      {userRole === 'admin' && (
        <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ color: 'var(--accent-coral)', fontSize: '18px' }}>
              <i className="fas fa-tasks"></i>
            </span>
            <div>
              <h3 className="card-title" style={{ fontSize: '14.5px' }}>Panel de Administración de Tareas — {activeTab}</h3>
              <p className="card-subtitle">Administrar actividades obligatorias para el día seleccionado</p>
            </div>
          </div>
          
          <form onSubmit={handleSaveAdminTask} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.8fr auto', gap: '12px', alignItems: 'end', marginBottom: '20px' }}>
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="form-label" style={{ fontSize: '11px' }}>Actividad</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Nombre de la actividad" 
                value={adminActividad}
                onChange={(e) => setAdminActividad(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="form-label" style={{ fontSize: '11px' }}>Descripción</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Detalle o descripción de la tarea" 
                value={adminDescripcion}
                onChange={(e) => setAdminDescripcion(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="form-label" style={{ fontSize: '11px' }}>Obligatorio</label>
              <select 
                className="select-filter" 
                value={adminObligatorio} 
                onChange={(e) => setAdminObligatorio(e.target.value)}
                style={{ width: '100%', padding: '9px' }}
              >
                <option value="Sí">Sí</option>
                <option value="No">No</option>
              </select>
            </div>
            <button type="submit" className="topbar-btn btn-primary" style={{ height: '38px', padding: '0 16px' }}>
              {editingTaskId !== null ? 'Actualizar' : 'Agregar'}
            </button>
          </form>

          <div className="table-responsive" style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)' }}>
            <table className="deals-table">
              <thead>
                <tr style={{ background: 'var(--bg-body)' }}>
                  <th>Actividad</th>
                  <th>Descripción</th>
                  <th style={{ textAlign: 'center' }}>Obligatorio</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {activeTasks.map(task => (
                  <tr key={task.id} className="deal-row">
                    <td style={{ fontWeight: '600' }}>
                      <span style={{ marginRight: '6px' }}>{task.icon || '📋'}</span>
                      {task.name}
                    </td>
                    <td>{task.desc || '—'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`stage-badge ${task.obligatoria !== false ? 'status-won' : 'status-lost'}`} style={{ fontSize: '10px', padding: '2px 8px', fontWeight: '800' }}>
                        {task.obligatoria !== false ? 'Sí' : 'No'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="action-btn edit-btn" onClick={() => handleEditAdminTask(task)} title="Editar" style={{ marginRight: '4px' }}>
                        <i className="fas fa-edit"></i>
                      </button>
                      <button className="action-btn delete-btn" onClick={() => handleDeleteAdminTask(task.id)} title="Eliminar">
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </td>
                  </tr>
                ))}
                {activeTasks.length === 0 && (
                  <tr>
                    <td colSpan="4" className="empty-state">
                      <i className="fas fa-clipboard-list"></i> No hay actividades registradas para este día.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                            borderLeft: `2.5px solid ${priorityColor}`
                          }}
                          title={`${evt.titulo} (${evt.hora}) - ${evt.descripcion}`}
                          onClick={(e) => {
                            e.stopPropagation(); // prevent modal opening
                            alert(`Evento: ${evt.titulo}\nHora: ${evt.hora}\nPrioridad: ${evt.prioridad}\n\nDescripción: ${evt.descripcion}\nCreado por: ${evt.creadoPor}`);
                          }}
                        >
                          {evt.titulo}
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

      {/* 4. MODAL: Event Creator Modal */}
      {isEventModalOpen && (
        <div className="modal-overlay active" style={{ zIndex: 10000 }}>
          <div className="modal-box" style={{ maxWidth: '460px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
                📅 Registrar Nuevo Evento para {selectedDayForEvent?.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                <button type="submit" className="topbar-btn btn-primary">Registrar Evento</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: Critical 16:30 Warning Alert Modal */}
      {isAlertModalOpen && (
        <div className="modal-overlay active" style={{ zIndex: 11000, background: 'rgba(239, 68, 68, 0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-box" style={{ maxWidth: '420px', padding: '30px', border: '1.5px solid #EF4444', textAlign: 'center' }}>
            <div style={{ fontSize: '38px', color: '#EF4444', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>
              Advertencia de Cierre Administrativo
            </h3>
            <p style={{ fontSize: '12px', color: '#4B5563', lineHeight: '1.5', marginBottom: '24px' }}>
              Por favor, asegúrate de completar y registrar todas tus actividades obligatorias de la jornada antes del cierre administrativo.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                className="topbar-btn btn-primary" 
                style={{ background: '#EF4444', width: '100%', justifyContent: 'center', padding: '10px' }}
                onClick={() => {
                  setIsAlertModalOpen(false);
                  setAlertDismissedToday(true);
                }}
              >
                Comprendido, registraré ahora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
