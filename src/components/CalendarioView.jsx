import React, { useState, useEffect, useRef, useMemo } from 'react';
import Chart from 'chart.js/auto';

// weekly tasks mapping
const WEEK_TASKS = {
  Lun: [
    { id: 1, name: 'Revisión y gestión de órdenes para la semana', icon: '📋' },
    { id: 2, name: 'Seguimiento a órdenes de Ruta de Camión', icon: '🚚' },
    { id: 3, name: 'Ejecución y contacto a clientes del 80/20', icon: '🎯' },
    { id: 4, name: 'Ejecución y contacto a Clientes del Proyecto', icon: '🚀' },
    { id: 5, name: 'Ejecución de Seguimiento de Cartera o Cartera Muerta', icon: '👤' }
  ],
  Mar: [
    { id: 1, name: 'Seguimiento de contacto a clientes del 80/20', icon: '🎯' },
    { id: 2, name: 'Seguimiento de contacto a Clientes del Proyecto', icon: '🚀' },
    { id: 3, name: 'Seguimientos a Clientes Prospectados', icon: '👥' },
    { id: 4, name: 'Primer contacto a Organizadores de Carreras', icon: '🏁' }
  ],
  Mie: [
    { id: 1, name: 'Creación de órdenes para llenado de Sala', icon: '🏠' },
    { id: 2, name: 'Seguimiento de contacto a clientes del 80/20', icon: '🎯' },
    { id: 3, name: 'Seguimiento de contacto a Clientes del Proyecto', icon: '🚀' },
    { id: 4, name: 'Seguimientos a Clientes Prospectados', icon: '👥' },
    { id: 5, name: 'Primer contacto a Organizadores de Carreras', icon: '🏁' }
  ],
  Jue: [
    { id: 1, name: 'Seguimiento de contacto a clientes del 80/20', icon: '🎯' },
    { id: 2, name: 'Seguimiento de contacto a Clientes del Proyecto', icon: '🚀' },
    { id: 3, name: 'Seguimientos a Clientes Prospectados', icon: '👥' },
    { id: 4, name: 'Primer contacto a Organizadores de Carreras', icon: '🏁' }
  ],
  Vie: [
    { id: 1, name: 'Cierre de todas las actividades', icon: '🔒' },
    { id: 2, name: 'Enviar los cierres al Grupo de Supervisores', icon: '📤' }
  ],
  Sab: [
    { id: 1, name: 'Recopilación de información de clientes a contactar semana Siguiente', icon: '📂' },
    { id: 2, name: 'Segmentación de Clientes a contactar semana Siguiente', icon: '📊' },
    { id: 3, name: 'Presentar Proyecto', icon: '🚀' },
    { id: 4, name: 'Presentar 80/20', icon: '🎯' },
    { id: 5, name: 'Prospección de Clientes', icon: '🔍' }
  ]
};

// Initial mock events (some pre-loaded to look natural)
const INITIAL_EVENTS = [
  { id: 'ev1', fecha: '2026-06-02', titulo: 'Entrega Medallas Ciclismo', hora: '10:00', prioridad: 'Alta', descripcion: 'Despacho de medallas personalizadas para competencia en Quetzaltenango.', tienda: 'CB', creadoPor: 'margarita.cb@tuempresa.com', replicarGlobal: false },
  { id: 'ev2', fecha: '2026-06-05', titulo: 'Corte Contable Quincenal', hora: '17:00', prioridad: 'Media', descripcion: 'Revisión y cierre de contabilidad del período.', tienda: 'Todos', creadoPor: 'admin@tuempresa.com', replicarGlobal: true },
  { id: 'ev3', fecha: '2026-06-08', titulo: 'Despacho Trofeos Copa Oro', hora: '11:30', prioridad: 'Alta', descripcion: 'Despacho de copas premium grabadas para la final de fútbol.', tienda: 'JT', creadoPor: 'jose.jt@tuempresa.com', replicarGlobal: false },
  { id: 'ev4', fecha: '2026-06-10', titulo: 'Revisión Catálogos Nuevos', hora: '09:00', prioridad: 'Baja', descripcion: 'Revisión física de los nuevos marcos y muestras de acrílico.', tienda: 'Z3', creadoPor: 'zoila.z3@tuempresa.com', replicarGlobal: false },
  { id: 'ev5', fecha: '2026-06-15', titulo: 'Depósito Mensual Cierre', hora: '16:00', prioridad: 'Alta', descripcion: 'Corte y depósito final del mes.', tienda: 'Todos', creadoPor: 'admin@tuempresa.com', replicarGlobal: true }
];

export default function CalendarioView({ activeStore = 'Todos', userRole = 'admin' }) {
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
  
  // Cronograma states
  const getSystemDayTab = () => {
    const day = new Date().getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    if (day === 0) return 'Lun'; // Sunday defaults to Lun
    const dayMap = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    return dayMap[day];
  };

  const [activeTab, setActiveTab] = useState(getSystemDayTab());
  
  // Task check state: day -> taskId -> boolean
  const [checkedTasks, setCheckedTasks] = useState({
    Lun: { 1: false, 2: false, 3: false, 4: false, 5: false },
    Mar: { 1: false, 2: false, 3: false, 4: false },
    Mie: { 1: false, 2: false, 3: false, 4: false, 5: false },
    Jue: { 1: false, 2: false, 3: false, 4: false },
    Vie: { 1: false, 2: false },
    Sab: { 1: false, 2: false, 3: false, 4: false, 5: false }
  });
  
  // Freeze states for cronograma days
  const [savedDays, setSavedDays] = useState({
    Lun: false, Mar: false, Mie: false, Jue: false, Vie: false, Sab: false
  });

  // Clock state to trigger 16:30 alert
  const [systemTime, setSystemTime] = useState(new Date());
  const lineChartRef = useRef(null);
  const lineChartInstance = useRef(null);

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
    return WEEK_TASKS[activeTab] || [];
  }, [activeTab]);

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

  // Monthly Calendar logic
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  // June 2026 starts on Monday
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

  // Bottom Dashboard: Dynamic Cronograma History Simulation (30 days)
  const cronogramaHistory = useMemo(() => {
    const history = [];
    const today = new Date();
    
    // Seeded random number generator
    const seedRandom = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return () => {
        const x = Math.sin(hash++) * 10000;
        return x - Math.floor(x);
      };
    };
    
    const random = seedRandom(storeCode + "_cronograma");
    
    for (let i = 29; i >= 1; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
      const isoDateStr = date.toISOString().slice(0, 10);
      
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0) continue; // Skip Sunday
      
      const dayMap = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
      const dayKey = dayMap[dayOfWeek];
      const assigned = WEEK_TASKS[dayKey]?.length || 4;
      
      // Seed random completion count
      const completed = Math.min(assigned, Math.max(0, Math.floor(assigned - random() * 2)));
      const pct = Math.round((completed / assigned) * 100);
      
      let status = 'CRÍTICO';
      if (pct >= 80) status = 'ÓPTIMO';
      else if (pct >= 60) status = 'ACEPTABLE';
      
      history.push({
        date: isoDateStr,
        displayDate: dateStr,
        dayOfWeek: dayKey,
        assigned,
        completed,
        pct,
        status
      });
    }
    
    // Add today's live record as the last element (if today is work day)
    const todayDayOfWeek = today.getDay();
    if (todayDayOfWeek !== 0) {
      const todayDayMap = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
      const todayKey = todayDayMap[todayDayOfWeek];
      const todayAssigned = WEEK_TASKS[todayKey]?.length || 5;
      
      // Calculate checked count for today
      const todayChecks = checkedTasks[todayKey] || {};
      const todayCompleted = Object.values(todayChecks).filter(Boolean).length;
      const todayPct = Math.round((todayCompleted / todayAssigned) * 100);
      
      let todayStatus = 'CRÍTICO';
      if (todayPct >= 80) todayStatus = 'ÓPTIMO';
      else if (todayPct >= 60) todayStatus = 'ACEPTABLE';
      
      history.push({
        date: today.toISOString().slice(0, 10),
        displayDate: today.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
        dayOfWeek: todayKey,
        assigned: todayAssigned,
        completed: todayCompleted,
        pct: todayPct,
        status: todayStatus,
        isToday: true
      });
    }
    
    return history;
  }, [storeCode, checkedTasks]);

  // Calculate KPIs
  const avgCronogramaCompliance = useMemo(() => {
    if (cronogramaHistory.length === 0) return 0;
    const sum = cronogramaHistory.reduce((s, h) => s + h.pct, 0);
    return Math.round(sum / cronogramaHistory.length);
  }, [cronogramaHistory]);

  const todayRecord = useMemo(() => {
    return cronogramaHistory[cronogramaHistory.length - 1] || { completed: 0, assigned: 5, pct: 0 };
  }, [cronogramaHistory]);

  const optimalDaysCount = useMemo(() => {
    return cronogramaHistory.filter(h => h.pct >= 80).length;
  }, [cronogramaHistory]);

  // Render Chart.js dynamic report
  useEffect(() => {
    if (lineChartRef.current) {
      if (lineChartInstance.current) {
        lineChartInstance.current.destroy();
      }
      
      const ctx = lineChartRef.current.getContext('2d');
      const labels = cronogramaHistory.map(h => h.displayDate);
      const data = cronogramaHistory.map(h => h.pct);
      
      const gradient = ctx.createLinearGradient(0, 0, 0, 200);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.15)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.01)');

      lineChartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            data,
            borderColor: '#3B82F6',
            borderWidth: 2.5,
            backgroundColor: gradient,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#3B82F6',
            pointBorderColor: '#fff',
            pointRadius: 3,
            pointHoverRadius: 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: ctx => ` Cumplimiento: ${ctx.raw}%` } }
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 8 }, color: '#94A3B8' } },
            y: { grid: { color: '#F1F5F9' }, min: 0, max: 100, ticks: { callback: v => v + '%', font: { family: 'Inter', size: 9 }, color: '#64748B' } }
          }
        }
      });
    }

    return () => {
      if (lineChartInstance.current) lineChartInstance.current.destroy();
    };
  }, [cronogramaHistory]);

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
          <span className="stage-badge" style={{ background: '#f8fafc', color: 'var(--text-secondary)', fontSize: '10px', border: '1.5px solid var(--border-light)', fontWeight: '700' }}>
            {activeStore === 'Todos' ? 'Red General' : `Tienda: ${activeStore}`}
          </span>
        </div>

        <div style={{ padding: '20px' }}>
          {/* Tabs header */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', marginBottom: '20px', gap: '4px' }}>
            {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map(day => {
              const isActive = activeTab === day;
              const isSaved = savedDays[day];
              
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
                    transition: 'all 0.2s ease'
                  }}
                >
                  {day}
                  {isSaved && <span style={{ fontSize: '10px' }}>🔒</span>}
                </button>
              );
            })}
          </div>

          {/* Activities list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#3B82F6', background: 'rgba(59, 130, 246, 0.08)', padding: '5px 12px', borderRadius: '4px', alignSelf: 'flex-start', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Actividades Obligatorias del {activeTab === 'Mie' ? 'Miércoles' : activeTab === 'Sab' ? 'Sábado' : activeTab}
            </div>

            {activeTasks.map(task => {
              const isChecked = !!checkedTasks[activeTab]?.[task.id];
              const isLocked = savedDays[activeTab] || activeStore === 'Todos';
              
              return (
                <div 
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px 16px',
                    background: '#FFFFFF',
                    border: isLocked ? '1px solid var(--border-light)' : (isChecked ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid var(--border-card)'),
                    borderRadius: 'var(--radius-sm)',
                    opacity: isLocked ? 0.65 : 1,
                    transition: 'all 0.2s ease',
                    boxShadow: isChecked ? '0 1px 4px rgba(59,130,246,0.05)' : 'none'
                  }}
                >
                  <input
                    type="checkbox"
                    id={`cron-task-${task.id}`}
                    checked={isChecked}
                    disabled={isLocked}
                    onChange={() => handleToggleCronogramaTask(task.id)}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                      accentColor: '#3B82F6'
                    }}
                  />
                  <label 
                    htmlFor={`cron-task-${task.id}`}
                    style={{
                      flex: 1,
                      fontSize: '12.5px',
                      fontWeight: '700',
                      color: isChecked ? 'var(--text-muted)' : 'var(--text-primary)',
                      textDecoration: isChecked ? 'line-through' : 'none',
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>{task.icon} {task.name}</span>
                  </label>
                </div>
              );
            })}

            {/* Permanent Warning Alert on Wednesdays */}
            {activeTab === 'Mie' && (
              <div style={{ 
                background: '#FFFBEB', 
                border: '1.5px solid #FDE68A', 
                padding: '14px 18px', 
                borderRadius: '8px', 
                color: '#B45309', 
                fontSize: '11.5px', 
                marginTop: '10px', 
                lineHeight: '1.5',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}>
                <span style={{ fontSize: '16px', marginTop: '-1px' }}>⚠️</span>
                <div>
                  <strong>Identificación y Análisis del Progreso:</strong> Obligatorio evaluar si la tasa de conversión es baja. Si el Speech de Google Docs o las muestras del catálogo no están reteniendo al cliente, reportar inmediatamente a supervisión para pivotar la narrativa comercial.
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          {activeStore !== 'Todos' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
              <button
                className="topbar-btn btn-primary"
                onClick={handleSaveProgress}
                disabled={savedDays[activeTab]}
                style={{
                  fontSize: '12.5px',
                  padding: '8px 18px',
                  background: savedDays[activeTab] ? '#94A3B8' : 'var(--accent-coral)',
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

      {/* 2. Calendario Mensual de Operaciones (Medio) */}
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

          <div style={{ 
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

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
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

      {/* 3. Dashboard de Rendimiento de Cronograma (Inferior) */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header" style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#3B82F6', fontSize: '18px' }}>
              <i className="fas fa-database"></i>
            </span>
            <div>
              <h3 className="card-title" style={{ fontSize: '14.5px' }}>BD_Historial_Cronograma — Análisis de Cumplimiento</h3>
              <p className="card-subtitle">Control de efectividad en cronograma semanal</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <span className="stage-badge" style={{ background: 'var(--bg-body)', color: 'var(--text-secondary)', fontSize: '10px', fontWeight: '700' }}>{storeCode}</span>
            <span className="stage-badge" style={{ background: 'var(--bg-body)', color: 'var(--text-secondary)', fontSize: '10px', fontWeight: '700' }}>Últimos 30 días</span>
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          {/* KPI upper grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }} className="grid-responsive-sm">
            <div style={{ background: 'var(--bg-body)', padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Cumplimiento Promedio
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
                {avgCronogramaCompliance}%
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Efectividad global en cronograma
              </div>
            </div>

            <div style={{ background: 'var(--bg-body)', padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Tareas Completadas Hoy
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
                {todayRecord.completed} de {todayRecord.assigned}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: '600' }}>
                {todayRecord.pct}% completado hoy
              </div>
            </div>

            <div style={{ background: 'var(--bg-body)', padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Días de Cumplimiento Óptimo (80%+)
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
                {optimalDaysCount} días
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                De {cronogramaHistory.length} días hábiles registrados
              </div>
            </div>
          </div>

          {/* Line Chart */}
          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: '10px', padding: '16px', marginBottom: '24px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3B82F6' }}></span>
              Mi Evolución de Cumplimiento de Cronograma — Últimos 30 días
            </div>
            <div style={{ height: '220px' }}>
              <canvas ref={lineChartRef} />
            </div>
          </div>

          {/* History Table */}
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-purple)' }}></span>
              Historial de Registros de Cronograma
            </div>

            <div className="table-responsive" style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)' }}>
              <table className="deals-table">
                <thead>
                  <tr style={{ background: 'var(--bg-body)' }}>
                    <th>Fecha</th>
                    <th style={{ textAlign: 'center' }}>Día</th>
                    <th style={{ textAlign: 'center' }}>Asignadas</th>
                    <th style={{ textAlign: 'center' }}>Completadas</th>
                    <th style={{ textAlign: 'center' }}>% Cumplimiento</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {[...cronogramaHistory].reverse().map((row, idx) => (
                    <tr key={idx} className="deal-row" style={row.isToday ? { background: 'rgba(255, 109, 77, 0.02)' } : {}}>
                      <td style={{ fontWeight: '600' }}>
                        {row.date}
                        {row.isToday && (
                          <span style={{ 
                            fontSize: '8px', 
                            fontWeight: '800', 
                            color: '#FFFFFF', 
                            background: '#3B82F6', 
                            padding: '1px 4px', 
                            borderRadius: '4px', 
                            marginLeft: '6px'
                          }}>
                            HOY
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: '600' }}>{row.dayOfWeek}</td>
                      <td style={{ textAlign: 'center', fontWeight: '600' }}>{row.assigned}</td>
                      <td style={{ textAlign: 'center', fontWeight: '700' }}>{row.completed}</td>
                      <td style={{ 
                        textAlign: 'center', 
                        fontWeight: '800',
                        color: row.pct >= 80 ? '#059669' : (row.pct >= 60 ? '#D97706' : '#EF4444')
                      }}>
                        {row.pct}%
                      </td>
                      <td>
                        <span className={`status-badge ${row.pct >= 80 ? 'status-won' : (row.pct >= 60 ? 'status-open' : 'status-lost')}`} style={{ fontSize: '9px', fontWeight: '800', padding: '2px 7px' }}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
