import React, { useState, useEffect, useRef, useMemo } from 'react';
import Chart from 'chart.js/auto';

// Core tasks list
const CORE_TASKS = [
  { id: 1, name: 'Barrer la Sala', desc: 'Limpieza inicial del suelo para una excelente primera impresión física.', block: 1, icon: '🧹' },
  { id: 2, name: 'Trapear la Sala', desc: 'Eliminar marcas, dar brillo a las superficies antes de recibir visitas.', block: 1, icon: '🪣' },
  { id: 3, name: 'Limpiar Estantería y Muestras', desc: 'Limpieza de vitrinas de trofeos, medallas y marcos de muestra.', block: 1, icon: '🧼' },
  { id: 4, name: 'Verificación de Órdenes del Día', desc: 'Sincronización con producción para confirmar despachos programados hoy.', block: 1, icon: '📄' },
  { id: 5, name: 'Seguimiento a Clientes de WhatsApp', desc: 'Atender consultas web, responder cotizaciones pendientes y envíos de fotos.', block: 4, icon: '💬' },
  { id: 6, name: 'Realizar el Depósito Bancario', desc: 'Preparación de efectivo/cheques de caja y envío al banco de forma segura.', block: 5, icon: '🏦' },
  { id: 7, name: 'Registrar lo Depositado en el Sistema', desc: 'Subir la boleta o captura bancaria al CRM para cerrar la bitácora financiera.', block: 5, icon: '📝' }
];

// Time routines blocks
const TIME_BLOCKS = [
  { id: 1, range: '08:30 - 09:15', name: 'Apertura, Limpieza y Logística', desc: 'Puesta a punto física de la sala y chequeo de rutas.' },
  { id: 2, range: '09:15 - 13:00', name: 'Enfoque Técnico y Diseño', desc: 'Diseño de productos personalizados and atención reactiva.', badge: 'ARTES', badgeColor: 'rgba(59, 130, 246, 0.14)', badgeTextColor: '#3B82F6' },
  { id: 3, range: '13:00 - 14:00', name: 'Tiempo de Almuerzo y Descanso', desc: 'Tiempo para comer y descansar.', icon: '🍴' },
  { id: 4, range: '14:00 - 16:30', name: 'Prospección y Enfoque Comercial', desc: 'Llamadas telefónicas de prospección y chats proactivos.', badge: '80/20 & PROY.', badgeColor: 'rgba(16, 185, 129, 0.14)', badgeTextColor: '#10B981' },
  { id: 5, range: '16:30 - 17:30', name: 'Cierre Administrativo y CRM', desc: 'Reporte de depósitos, actualización de CRM y planificación.' }
];

const STORES = ['CB', 'CHM', 'CHQ', 'ESC', 'HH', 'JT', 'MZ', 'PT', 'PTB', 'SJ', 'SMA', 'VN', 'XL', 'Z3'];

export default function TareasView({ 
  activeStore, 
  userRole, 
  storeChecklists, 
  onToggleTask,
  onSaveToSheets 
}) {
  // Simulated time states
  const [simulatedTimeChoice, setSimulatedTimeChoice] = useState('real'); // 'real' or simulated values
  const [systemTime, setSystemTime] = useState(new Date());

  // Refs for compliance charts
  const barChartRef = useRef(null);
  const lineChartRef = useRef(null);
  const privateLineChartRef = useRef(null);
  const barChartInstance = useRef(null);
  const lineChartInstance = useRef(null);
  const privateLineChartInstance = useRef(null);

  // Update clock every second if 'real'
  useEffect(() => {
    const timer = setInterval(() => {
      if (simulatedTimeChoice === 'real') {
        setSystemTime(new Date());
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [simulatedTimeChoice]);

  // Compute active hour/minute based on choice
  const { hour, minute, timeStr } = useMemo(() => {
    if (simulatedTimeChoice === 'real') {
      return {
        hour: systemTime.getHours(),
        minute: systemTime.getMinutes(),
        timeStr: systemTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
    } else {
      const [h, m] = simulatedTimeChoice.split(':').map(Number);
      return {
        hour: h,
        minute: m,
        timeStr: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} (Simulada)`
      };
    }
  }, [simulatedTimeChoice, systemTime]);

  // Rule of freezing at 9:15 AM
  const aperturaFrozen = useMemo(() => {
    const currentMinutes = hour * 60 + minute;
    return currentMinutes >= 555; // 09:15 in minutes is 9 * 60 + 15 = 555
  }, [hour, minute]);

  // Calculate active block
  const activeBlockId = useMemo(() => {
    const minutes = hour * 60 + minute;
    if (minutes >= 510 && minutes < 555) return 1;   // 08:30 - 09:15
    if (minutes >= 555 && minutes < 780) return 2;   // 09:15 - 13:00
    if (minutes >= 780 && minutes < 840) return 3;   // 13:00 - 14:00
    if (minutes >= 840 && minutes < 990) return 4;   // 14:00 - 16:30
    if (minutes >= 990 && minutes < 1050) return 5;  // 16:30 - 17:30
    return null;
  }, [hour, minute]);

  // Checklist for selected store
  const storeCode = activeStore === 'Todos' ? 'CB' : activeStore;
  const currentChecklist = storeChecklists[storeCode] || {};

  const completedCount = useMemo(() => {
    return Object.values(currentChecklist).filter(Boolean).length;
  }, [currentChecklist]);

  const completionPercent = Math.round((completedCount / 7) * 100);

  // Generar historial de 30 días para la vista privada del asesor
  const storeHistory = useMemo(() => {
    const history = [];
    const today = new Date();
    
    // Seeded random number generator based on storeCode to ensure stable history
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
    
    const random = seedRandom(storeCode);
    
    for (let i = 29; i >= 1; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
      const isoDateStr = date.toISOString().slice(0, 10);
      
      // Let's generate a realistic number of completed tasks (between 5 and 13 out of 13)
      let baseTasks = 8;
      if (storeCode === 'JT') baseTasks = 10;
      if (storeCode === 'CHQ') baseTasks = 5;
      if (storeCode === 'CB') baseTasks = 7;
      
      const completed = Math.min(13, Math.max(0, Math.floor(baseTasks + random() * 5 - 2)));
      const pct = Math.round((completed / 13) * 100);
      let status = 'CRÍTICO';
      if (pct >= 80) status = 'ÓPTIMO';
      else if (pct >= 60) status = 'ACEPTABLE';
      
      history.push({
        date: isoDateStr,
        displayDate: dateStr,
        assigned: 13,
        completed,
        pct,
        status
      });
    }
    
    // Add today's live record as the last element
    const todayCompleted = completedCount; // directly equals checklist checked count to match administrative statistics
    const todayPct = Math.round((todayCompleted / 13) * 100);
    let todayStatus = 'CRÍTICO';
    if (todayPct >= 80) todayStatus = 'ÓPTIMO';
    else if (todayPct >= 60) todayStatus = 'ACEPTABLE';
    
    history.push({
      date: today.toISOString().slice(0, 10),
      displayDate: today.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
      assigned: 13,
      completed: todayCompleted,
      pct: todayPct,
      status: todayStatus,
      isToday: true
    });
    
    return history;
  }, [storeCode, storeChecklists, completedCount]);

  const avgStoreCompliance = useMemo(() => {
    if (storeHistory.length === 0) return 0;
    const sum = storeHistory.reduce((s, h) => s + h.pct, 0);
    return Math.round(sum / storeHistory.length);
  }, [storeHistory]);

  const optimalDaysCount = useMemo(() => {
    return storeHistory.filter(h => h.pct >= 80).length;
  }, [storeHistory]);

  const todayRecord = useMemo(() => {
    return storeHistory[storeHistory.length - 1];
  }, [storeHistory]);

  // Compute compliance statistics for all 14 stores
  const storeStatistics = useMemo(() => {
    return STORES.map(code => {
      const checklist = storeChecklists[code] || {};
      const completed = Object.values(checklist).filter(Boolean).length;
      
      // Map core completed to out of 13 tasks (matching Sheets mock)
      // If store is JT: core has 5 completed -> 5 / 13 = 38%
      // If store is CHQ: core has 1 completed -> 1 / 13 = 8%
      // For others we have some default base mocks to add up to 23% network average
      let mockCompleted = completed;
      if (completed === 0) {
        // Initialize other stores with small mock completion counts to reach 23% average
        if (code === 'MZ' || code === 'PTB' || code === 'SMA' || code === 'XL') mockCompleted = 3; // 23%
        if (code === 'PT' || code === 'SJ' || code === 'VN' || code === 'Z3') mockCompleted = 4; // 31%
      }
      
      const pct = Math.round((mockCompleted / 13) * 100);
      return {
        code,
        storeName: 'TX.' + code,
        assigned: 13,
        completed: mockCompleted,
        pct,
        status: pct >= 80 ? 'ÓPTIMO' : 'CRÍTICO'
      };
    });
  }, [storeChecklists]);

  // Network average compliance
  const complianceAverages = useMemo(() => {
    const totalAssigned = 14 * 13; // 182
    const totalCompleted = storeStatistics.reduce((sum, s) => sum + s.completed, 0);
    const avgCompliance = Math.round((totalCompleted / totalAssigned) * 100);
    
    // Find best store
    let bestStore = storeStatistics[0];
    storeStatistics.forEach(s => {
      if (s.pct > bestStore.pct) bestStore = s;
    });

    const storesAbove80 = storeStatistics.filter(s => s.pct >= 80).length;

    return {
      avgCompliance,
      bestStore: `${bestStore.code} (${bestStore.pct}%)`,
      totalCompleted,
      totalAssigned,
      storesAbove80
    };
  }, [storeStatistics]);

  // Render Chart.js dynamic reports
  useEffect(() => {
    if (userRole === 'admin') {
      // 1. Bar Chart: Rendimiento por Tienda - Hoy
      if (barChartRef.current) {
        if (barChartInstance.current) {
          barChartInstance.current.destroy();
        }
        const ctx = barChartRef.current.getContext('2d');
        const labels = storeStatistics.map(s => s.code);
        const data = storeStatistics.map(s => s.pct);
        
        barChartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              data,
              backgroundColor: labels.map(l => l === storeCode ? 'rgba(255, 109, 77, 0.8)' : 'rgba(255, 109, 77, 0.25)'),
              borderColor: '#FF6D4D',
              borderWidth: 1.5,
              borderRadius: 6,
              borderSkipped: false
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
              x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 9, weight: '700' }, color: '#64748B' } },
              y: { grid: { color: '#F1F5F9' }, min: 0, max: 100, ticks: { callback: v => v + '%', font: { family: 'Inter', size: 9 }, color: '#64748B' } }
            }
          }
        });
      }

      // 2. Line Chart: Evolución de Cumplimiento (Red Completa)
      if (lineChartRef.current) {
        if (lineChartInstance.current) {
          lineChartInstance.current.destroy();
        }
        const ctx = lineChartRef.current.getContext('2d');
        
        // Dates matching image 049b5e
        const labels = ['09/05', '11/05', '13/05', '15/05', '17/05', '19/05', '21/05', '23/05', '25/05', '27/05', '29/05', '31/05', '02/06', '04/06', '06/06'];
        // Mock progress showing flat progress rising to current network average at the end
        const data = [2, 1, 3, 2, 2, 4, 3, 5, 4, 6, 8, 12, 16, 20, complianceAverages.avgCompliance];
        
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
              pointRadius: 4,
              pointHoverRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { label: ctx => ` Promedio Red: ${ctx.raw}%` } }
            },
            scales: {
              x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 8 }, color: '#94A3B8' } },
              y: { grid: { color: '#F1F5F9' }, min: 0, max: 100, ticks: { callback: v => v + '%', font: { family: 'Inter', size: 9 }, color: '#64748B' } }
            }
          }
        });
      }
    } else {
      // Render Private Line Chart: Mi Evolución de Cumplimiento
      if (privateLineChartRef.current) {
        if (privateLineChartInstance.current) {
          privateLineChartInstance.current.destroy();
        }
        const ctx = privateLineChartRef.current.getContext('2d');
        const labels = storeHistory.map(h => h.displayDate);
        const data = storeHistory.map(h => h.pct);
        
        const gradient = ctx.createLinearGradient(0, 0, 0, 200);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.15)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0.01)');

        privateLineChartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              data,
              borderColor: '#10B981',
              borderWidth: 2.5,
              backgroundColor: gradient,
              fill: true,
              tension: 0.35,
              pointBackgroundColor: '#10B981',
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
    }

    return () => {
      if (barChartInstance.current) barChartInstance.current.destroy();
      if (lineChartInstance.current) lineChartInstance.current.destroy();
      if (privateLineChartInstance.current) privateLineChartInstance.current.destroy();
    };
  }, [storeStatistics, complianceAverages, storeCode, userRole, storeHistory]);

  return (
    <div className="view-section active">
      
      {/* Simulation Header Clock control */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '20px' }}>⏱️</div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700' }}>Control de Tiempo del Sistema</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Hora activa: <strong style={{ color: 'var(--text-primary)' }}>{timeStr}</strong>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)' }}>Simular Hora:</span>
          <select
            className="select-filter"
            value={simulatedTimeChoice}
            onChange={(e) => setSimulatedTimeChoice(e.target.value)}
            style={{ padding: '6px 12px', fontSize: '12px', minWidth: '180px' }}
          >
            <option value="real">Real (Reloj del Sistema)</option>
            <option value="08:45">08:45 AM (Bloque 1 - Limpieza)</option>
            <option value="10:30">10:30 AM (Bloque 2 - Diseño · Congelado)</option>
            <option value="13:30">13:30 PM (Bloque 3 - Almuerzo · Congelado)</option>
            <option value="15:00">15:00 PM (Bloque 4 - Comercial · Congelado)</option>
            <option value="17:00">17:00 PM (Bloque 5 - Cierre · Congelado)</option>
          </select>
        </div>
      </div>

      {/* Main Checklist and blocks layout (2 columns) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '24px', alignItems: 'stretch' }} className="grid-responsive-md">
        
        {/* Column Left: Checklist */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#10B981', display: 'inline-flex', padding: '5px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px' }}>
                <i className="fas fa-check-double" style={{ fontSize: '14px' }}></i>
              </span>
              <div>
                <h3 className="card-title" style={{ fontSize: '14px' }}>Checklist Operativo Diario</h3>
                <p className="card-subtitle">Tienda seleccionada: {storeCode}</p>
              </div>
            </div>
            {activeStore === 'Todos' ? (
              <span className="stage-badge" style={{ background: '#f1f5f9', color: '#64748B', fontSize: '10px' }}>Consolidado</span>
            ) : (
              <span className="stage-badge" style={{ 
                background: completionPercent === 100 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)', 
                color: completionPercent === 100 ? '#059669' : '#2563EB', 
                fontSize: '11px',
                fontWeight: '700'
              }}>
                {completionPercent}% Completado
              </span>
            )}
          </div>

          <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeStore === 'Todos' && (
              <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: '1.5px dashed var(--border-light)', textAlign: 'center', marginBottom: '10px' }}>
                <i className="fas fa-info-circle" style={{ color: 'var(--accent-blue)', fontSize: '20px', marginBottom: '6px', display: 'block' }}></i>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  Modo consolidado. Selecciona una tienda en la barra superior para editar el checklist diario.
                </span>
              </div>
            )}
            
            {CORE_TASKS.map(task => {
              const isTaskBlock1 = task.block === 1;
              const isFrozen = isTaskBlock1 && aperturaFrozen;
              const isChecked = !!currentChecklist[task.id];
              const isDisabled = activeStore === 'Todos' || isFrozen;

              return (
                <div 
                  key={task.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    padding: '12px 16px',
                    background: '#FFFFFF',
                    border: isFrozen ? '1px solid var(--border-light)' : (isChecked ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-card)'),
                    borderRadius: 'var(--radius-sm)',
                    opacity: isFrozen ? 0.55 : 1,
                    transition: 'all 0.2s ease',
                    boxShadow: isChecked ? '0 1px 4px rgba(16,185,129,0.05)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '2px' }}>
                    <input
                      type="checkbox"
                      id={`task-${task.id}`}
                      checked={isChecked}
                      disabled={isDisabled}
                      onChange={() => onToggleTask(storeCode, task.id)}
                      style={{
                        width: '16px',
                        height: '16px',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        accentColor: '#FF6D4D'
                      }}
                    />
                  </div>
                  <label 
                    htmlFor={`task-${task.id}`} 
                    style={{ 
                      flex: 1, 
                      cursor: isDisabled ? 'not-allowed' : 'pointer', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '2px' 
                    }}
                  >
                    <span style={{ 
                      fontSize: '12.5px', 
                      fontWeight: '700', 
                      color: isChecked ? 'var(--text-muted)' : 'var(--text-primary)',
                      textDecoration: isChecked ? 'line-through' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span>{task.icon} {task.name}</span>
                      {isFrozen && (
                        <span style={{ 
                          fontSize: '9px', 
                          fontWeight: '800', 
                          color: '#EF4444', 
                          background: 'rgba(239, 68, 68, 0.1)', 
                          padding: '1px 5px', 
                          borderRadius: '4px',
                          textTransform: 'uppercase'
                        }}>
                          🔒 Congelado
                        </span>
                      )}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {task.desc}
                    </span>
                  </label>
                </div>
              );
            })}
          </div>

          {/* Save to sheets trigger */}
          {activeStore !== 'Todos' && (
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
              <button 
                className="topbar-btn btn-primary"
                onClick={() => onSaveToSheets(storeCode, completedCount, 7, currentChecklist)}
                style={{ fontSize: '12px', padding: '8px 16px' }}
              >
                <i className="fas fa-cloud-upload-alt" style={{ marginRight: '6px' }}></i>
                Guardar en Sheets (BD)
              </button>
            </div>
          )}
        </div>

        {/* Column Right: Time Routine Monitoring */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--accent-coral)', display: 'inline-flex', padding: '5px', background: 'rgba(255, 109, 77, 0.1)', borderRadius: '6px' }}>
                <i className="far fa-clock" style={{ fontSize: '14px' }}></i>
              </span>
              <div>
                <h3 className="card-title" style={{ fontSize: '14px' }}>Monitoreo de Bloques de Tiempo</h3>
                <p className="card-subtitle">Rutina y enfoque operativo diario</p>
              </div>
            </div>
            <span className="stage-badge" style={{ background: '#f8fafc', color: 'var(--text-secondary)', fontSize: '10px', border: '1.5px solid var(--border-light)' }}>RUTINA DE TIENDA</span>
          </div>

          <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {TIME_BLOCKS.map(block => {
              const isActive = block.id === activeBlockId;
              
              return (
                <div 
                  key={block.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '14px 18px',
                    background: '#FFFFFF',
                    border: isActive ? '1.5px solid var(--accent-coral)' : '1px solid var(--border-card)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: isActive ? '0 4px 14px rgba(255, 109, 77, 0.08)' : 'none',
                    transition: 'all 0.25s ease'
                  }}
                >
                  <div style={{ 
                    padding: '8px 12px', 
                    background: isActive ? 'linear-gradient(135deg, var(--accent-coral), #FF9070)' : '#F8FAFC',
                    color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '800',
                    fontVariantNumeric: 'tabular-nums',
                    border: isActive ? 'none' : '1px solid var(--border-light)',
                    width: '100px',
                    textAlign: 'center',
                    flexShrink: 0
                  }}>
                    {block.range}
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {block.icon && <span style={{ marginRight: '6px' }}>{block.icon}</span>}
                        {block.name}
                      </span>
                      {block.badge && (
                        <span style={{ 
                          fontSize: '8px', 
                          fontWeight: '800', 
                          background: block.badgeColor, 
                          color: block.badgeTextColor,
                          padding: '1px 5px',
                          borderRadius: '4px'
                        }}>
                          {block.badge}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {block.desc}
                    </div>
                  </div>

                  <div style={{ flexShrink: 0 }}>
                    <span style={{ 
                      fontSize: '9.5px', 
                      fontWeight: '800', 
                      background: isActive ? 'rgba(255, 109, 77, 0.12)' : '#F1F5F9',
                      color: isActive ? 'var(--accent-coral)' : '#94A3B8',
                      padding: '3px 8px',
                      borderRadius: '20px',
                      textTransform: 'uppercase'
                    }}>
                      {isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Compliance Analytics Section (Panel de Avance) - Visibilidad Condicionada por Rol */}
      {userRole === 'admin' ? (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header" style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#d32f2f', fontSize: '18px' }}>
                <i className="fas fa-database"></i>
              </span>
              <div>
                <h3 className="card-title" style={{ fontSize: '15px' }}>BD_Operaciones — Análisis de Cumplimiento</h3>
                <p className="card-subtitle">Monitoreo y registro diario de avance por sucursales</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <span className="stage-badge" style={{ background: 'var(--bg-body)', color: 'var(--text-secondary)', fontSize: '10px', fontWeight: '700' }}>Todas las Tiendas</span>
              <span className="stage-badge" style={{ background: 'var(--bg-body)', color: 'var(--text-secondary)', fontSize: '10px', fontWeight: '700' }}>Últimos 30 días</span>
            </div>
          </div>

          <div style={{ padding: '24px' }}>
            
            {/* KPI Upper Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }} className="grid-responsive-sm">
              
              {/* Card 1 */}
              <div style={{ background: 'var(--bg-body)', padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Cumplimiento Promedio Red
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
                  {complianceAverages.avgCompliance}%
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Todas las tiendas · periodo seleccionado
                </div>
              </div>

              {/* Card 2 */}
              <div style={{ background: 'var(--bg-body)', padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Mejor Tienda del Día
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
                  {complianceAverages.bestStore}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Hoy ({new Date().toISOString().slice(0, 10)})
                </div>
              </div>

              {/* Card 3 */}
              <div style={{ background: 'var(--bg-body)', padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Tareas Completadas Hoy
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
                  {complianceAverages.totalCompleted}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: '600' }}>
                  de {complianceAverages.totalAssigned} asignadas
                </div>
              </div>

              {/* Card 4 */}
              <div style={{ background: 'var(--bg-body)', padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Tiendas con 80%+ Hoy
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
                  {complianceAverages.storesAbove80} de 14
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  de 14 tiendas
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }} className="grid-responsive-md">
              
              {/* Rendimiento por tienda hoy */}
              <div style={{ background: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-coral)' }}></span>
                  Rendimiento por Tienda — Hoy
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: 'auto' }}>
                    {new Date().toLocaleDateString('es-ES')}
                  </span>
                </div>
                <div style={{ height: '220px' }}>
                  <canvas ref={barChartRef} />
                </div>
              </div>

              {/* Evolución de cumplimiento red */}
              <div style={{ background: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-blue)' }}></span>
                  Evolución de Cumplimiento — Red Completa
                </div>
                <div style={{ height: '220px' }}>
                  <canvas ref={lineChartRef} />
                </div>
              </div>
            </div>

            {/* Table: BD_OPERACIONES - REGISTROS RECIENTES */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-purple)' }}></span>
                  BD_OPERACIONES — REGISTROS RECIENTES
                </div>
                <button className="topbar-btn btn-outline" style={{ padding: '6px 12px', fontSize: '11px' }}>
                  <i className="fas fa-file-export" style={{ marginRight: '6px' }}></i> Exportar CSV
                </button>
              </div>

              <div className="table-responsive" style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)' }}>
                <table className="deals-table">
                  <thead>
                    <tr style={{ background: 'var(--bg-body)' }}>
                      <th>Fecha</th>
                      <th>Código</th>
                      <th>Tienda</th>
                      <th style={{ textAlign: 'center' }}>Asignadas</th>
                      <th style={{ textAlign: 'center' }}>Completadas</th>
                      <th style={{ textAlign: 'center' }}>% Cumplimiento</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {storeStatistics.map((row) => (
                      <tr key={row.code} className="deal-row">
                        <td style={{ fontWeight: '600' }}>
                          {new Date().toISOString().slice(0, 10)}
                          <span style={{ 
                            fontSize: '8px', 
                            fontWeight: '800', 
                            color: '#FFFFFF', 
                            background: '#3B82F6', 
                            padding: '1px 4px', 
                            borderRadius: '4px', 
                            marginLeft: '6px',
                            textTransform: 'uppercase'
                          }}>
                            VIVO
                          </span>
                        </td>
                        <td style={{ fontWeight: '700' }}>{row.code}</td>
                        <td>{row.storeName}</td>
                        <td style={{ textAlign: 'center', fontWeight: '600' }}>{row.assigned}</td>
                        <td style={{ textAlign: 'center', fontWeight: '700', color: row.completed > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {row.completed}
                        </td>
                        <td style={{ 
                          textAlign: 'center', 
                          fontWeight: '800',
                          color: row.pct >= 80 ? '#059669' : '#EF4444'
                        }}>
                          {row.pct}%
                        </td>
                        <td>
                          <span className={`status-badge ${row.pct >= 80 ? 'status-won' : 'status-lost'}`} style={{ fontSize: '9px', fontWeight: '800', padding: '2px 7px' }}>
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
      ) : (
        /* Panel de Rendimiento Privado de Tienda */
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header" style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#10B981', display: 'inline-flex', padding: '5px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px' }}>
                <i className="fas fa-chart-line" style={{ fontSize: '14px' }}></i>
              </span>
              <div>
                <h3 className="card-title" style={{ fontSize: '14px' }}>Mi Rendimiento — Análisis Individual de {storeCode}</h3>
                <p className="card-subtitle">Historial de tareas y cumplimiento de la sucursal activa</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <span className="stage-badge" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', fontSize: '10px', fontWeight: '700' }}>Panel Privado (TX)</span>
              <span className="stage-badge" style={{ background: 'var(--bg-body)', color: 'var(--text-secondary)', fontSize: '10px', fontWeight: '700' }}>Últimos 30 días</span>
            </div>
          </div>

          <div style={{ padding: '24px' }}>
            
            {/* KPI Upper Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }} className="grid-responsive-sm">
              
              {/* Card 1 */}
              <div style={{ background: 'var(--bg-body)', padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Mi Cumplimiento Promedio
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
                  {avgStoreCompliance}%
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Mes actual · promedio del historial
                </div>
              </div>

              {/* Card 2 */}
              <div style={{ background: 'var(--bg-body)', padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Tareas Completadas Hoy
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
                  {todayRecord.completed} de 13
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: '600' }}>
                  {completionPercent}% de checklist diario
                </div>
              </div>

              {/* Card 3 */}
              <div style={{ background: 'var(--bg-body)', padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Días con Cumplimiento Óptimo (80%+)
                </div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
                  {optimalDaysCount} de {storeHistory.length}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  meta mensual de tienda
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ background: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }}></span>
                  Mi Evolución de Cumplimiento — Últimos 30 días
                </div>
                <div style={{ height: '220px' }}>
                  <canvas ref={privateLineChartRef} />
                </div>
              </div>
            </div>

            {/* Table: Mi Historial de Registros */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-blue)' }}></span>
                  Mi Historial de Registros
                </div>
              </div>

              <div className="table-responsive" style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)' }}>
                <table className="deals-table">
                  <thead>
                    <tr style={{ background: 'var(--bg-body)' }}>
                      <th>Fecha</th>
                      <th style={{ textAlign: 'center' }}>Asignadas</th>
                      <th style={{ textAlign: 'center' }}>Completadas</th>
                      <th style={{ textAlign: 'center' }}>% Cumplimiento</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...storeHistory].reverse().map((row, idx) => (
                      <tr key={idx} className="deal-row" style={row.isToday ? { background: 'rgba(255, 109, 77, 0.03)' } : {}}>
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
                              marginLeft: '6px',
                              textTransform: 'uppercase'
                            }}>
                              HOY (VIVO)
                            </span>
                          )}
                        </td>
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
      )}

    </div>
  );
}
