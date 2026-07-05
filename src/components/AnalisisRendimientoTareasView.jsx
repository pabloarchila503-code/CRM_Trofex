import { useMemo, useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';

const STORES = [
  'CB', 'CHM', 'CHQ', 'ESC', 'HH', 'JT', 'MZ', 'PT', 'PTB', 'SJ', 'SMA', 'VN', 'XL', 'Z3'
];

export default function AnalisisRendimientoTareasView({
  selectedStores = [],
  selectedMonths = [],
  userRole = 'store',
  checkedTasks = {},
  weeklyTasks = {},
  timeRange = '1 semana',
  speechStats = {}
}) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const todayIso = new Date().toISOString().slice(0, 10);
  const isToday = selectedDate === todayIso;
  
  const storeCode = selectedStores.length === 14 ? 'Todos' : selectedStores[0];

  const getDayName = (dateStr) => {
    // Para una fecha dada, obtener su nombre de día para buscar en weeklyTasks
    // Ojo: new Date(dateStr) puede tener desfase horario, usamos parse manual
    const [y, m, d] = dateStr.split('-');
    const dateObj = new Date(y, m - 1, d);
    const day = dateObj.getDay();
    const dayMap = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    return dayMap[day] === 'Dom' ? 'Lun' : dayMap[day]; // Dom defaults to Lun
  };

  const selectedDayName = getDayName(selectedDate);
  const assignedTasksCount = weeklyTasks[selectedDayName]?.length || 5;

  // Compute compliance statistics for all 14 stores
  const storeStatistics = useMemo(() => {
    return STORES.map(code => {
      let completed = 0;
      
      if (isToday) {
        const tasksForStore = checkedTasks[code]?.[selectedDayName] || {};
        completed = Object.values(tasksForStore).filter(Boolean).length;
      }
      
      let mockCompleted = completed;
      if (completed === 0) {
        let hash = 0;
        const str = code + selectedDate + 'tareas'; // seed distintivo para que no sea idéntico al checklist
        for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
        const x = Math.sin(hash) * 10000;
        const random = x - Math.floor(x);
        
        // Simular que en promedio hacen el 40-100% de las tareas
        const minTasks = Math.floor(assignedTasksCount * 0.4);
        mockCompleted = Math.min(assignedTasksCount, Math.max(0, Math.floor(minTasks + random * (assignedTasksCount - minTasks + 1))));
      }
      
      const pct = assignedTasksCount > 0 ? Math.round((mockCompleted / assignedTasksCount) * 100) : 0;
      return {
        code,
        storeName: 'TX.' + code,
        assigned: assignedTasksCount,
        completed: mockCompleted,
        pct,
        status: pct >= 80 ? 'ÓPTIMO' : 'CRÍTICO'
      };
    });
  }, [checkedTasks, isToday, selectedDate, selectedDayName, assignedTasksCount]);

  // Network average compliance
  const complianceAverages = useMemo(() => {
    const totalAssigned = 14 * assignedTasksCount;
    const totalCompleted = storeStatistics.reduce((sum, s) => sum + s.completed, 0);
    const avgCompliance = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;
    
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
  }, [storeStatistics, assignedTasksCount]);

  const barChartRef = useRef(null);
  const lineChartRef = useRef(null);
  const doughnutChartRef = useRef(null);
  const speechBarChartRef = useRef(null);

  const barChartInstance = useRef(null);
  const lineChartInstance = useRef(null);
  const doughnutChartInstance = useRef(null);
  const speechBarChartInstance = useRef(null);

  // Render Chart.js dynamic reports
  useEffect(() => {
    if (userRole === 'admin') {
      // 1. Bar Chart: Rendimiento por Tienda - Hoy/Seleccionado
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
              backgroundColor: labels.map(l => l === storeCode ? 'rgba(139, 92, 246, 0.8)' : 'rgba(139, 92, 246, 0.25)'),
              borderColor: '#8B5CF6',
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
              tooltip: { callbacks: { label: ctx => ` Rendimiento: ${ctx.raw}%` } }
            },
            scales: {
              x: { grid: { display: false }, ticks: { font: { family: 'Outfit, Inter, sans-serif', size: 11, weight: '700' }, color: '#64748B' } },
              y: { grid: { color: '#F1F5F9' }, min: 0, max: 100, ticks: { callback: v => v + '%', font: { family: 'Outfit, Inter, sans-serif', size: 11, weight: '600' }, color: '#64748B' } }
            }
          }
        });
      }

      // 2. Line Chart: Evolución de Rendimiento (Red Completa)
      if (lineChartRef.current) {
        if (lineChartInstance.current) {
          lineChartInstance.current.destroy();
        }
        const ctx = lineChartRef.current.getContext('2d');
        
        const isMonthlyFilter = selectedMonths.length > 0;
        let generatedLabels = [];
        let generatedData = [];

        if (isMonthlyFilter) {
          const mNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
          const mIndex = mNames.findIndex(m => selectedMonths[0].startsWith(m));
          const targetMonth = mIndex >= 0 ? mIndex : new Date().getMonth();
          const targetYear = new Date().getFullYear();
          const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

          for (let d = 1; d <= daysInMonth; d += 2) {
            generatedLabels.push(`${String(d).padStart(2, '0')}/${String(targetMonth + 1).padStart(2, '0')}`);
            const seed = targetMonth + d + 50; // offset para que no sea igual
            const x = Math.sin(seed) * 10000;
            const rand = x - Math.floor(x);
            generatedData.push(Math.round(50 + (rand * 45)));
          }
        } else {
          const rawLabels = ['09/05', '11/05', '13/05', '15/05', '17/05', '19/05', '21/05', '23/05', '25/05', '27/05', '29/05', '31/05', '02/06', '04/06', '06/06'];
          const rawData = [4, 3, 5, 4, 3, 6, 5, 8, 7, 9, 10, 15, 18, 22, complianceAverages.avgCompliance];
          
          const sliceCount = 
            timeRange === '1 día' ? 1 :
            timeRange === '1 semana' ? 7 :
            timeRange === 'Quincenal' ? 15 : 30;

          generatedLabels = rawLabels.slice(-sliceCount);
          generatedData = rawData.slice(-sliceCount);
        }
        
        const gradient = ctx.createLinearGradient(0, 0, 0, 200);
        gradient.addColorStop(0, 'rgba(139, 92, 246, 0.15)');
        gradient.addColorStop(1, 'rgba(139, 92, 246, 0.01)');

        lineChartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: generatedLabels,
            datasets: [{
              data: generatedData,
              borderColor: '#8B5CF6',
              borderWidth: 2.5,
              backgroundColor: gradient,
              fill: true,
              tension: 0.35,
              pointBackgroundColor: '#8B5CF6',
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
              x: { grid: { display: false }, ticks: { font: { family: 'Outfit, Inter, sans-serif', size: 11, weight: '700' }, color: '#64748B' } },
              y: { grid: { color: '#F1F5F9' }, min: 0, max: 100, ticks: { callback: v => v + '%', font: { family: 'Outfit, Inter, sans-serif', size: 11, weight: '600' }, color: '#64748B' } }
            }
          }
        });
      }

      // 3. Doughnut Chart: Uso global de Speech (Copiar vs WhatsApp)
      if (doughnutChartRef.current) {
        if (doughnutChartInstance.current) doughnutChartInstance.current.destroy();
        const ctx = doughnutChartRef.current.getContext('2d');
        
        let totalCopy = 0;
        let totalWhatsApp = 0;
        STORES.forEach(code => {
          if (speechStats[code]) {
            totalCopy += speechStats[code].copy || 0;
            totalWhatsApp += speechStats[code].whatsapp || 0;
          }
        });

        doughnutChartInstance.current = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['WhatsApp', 'Copiar'],
            datasets: [{
              data: [totalWhatsApp, totalCopy],
              backgroundColor: ['#25D366', '#8B5CF6'],
              borderWidth: 0,
              hoverOffset: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
              legend: { position: 'bottom', labels: { usePointStyle: true, font: { family: 'Outfit, Inter, sans-serif', size: 11, weight: '600' } } }
            }
          }
        });
      }

      // 4. Bar Chart Horizontal: Ranking de Uso de Speech por Tienda
      if (speechBarChartRef.current) {
        if (speechBarChartInstance.current) speechBarChartInstance.current.destroy();
        const ctx = speechBarChartRef.current.getContext('2d');
        
        // Sort stores by total speech interactions
        const sortedStores = STORES.map(code => {
          const stats = speechStats[code] || { copy: 0, whatsapp: 0 };
          return {
            code,
            copy: stats.copy || 0,
            whatsapp: stats.whatsapp || 0,
            total: (stats.copy || 0) + (stats.whatsapp || 0)
          };
        }).sort((a, b) => b.total - a.total); // Highest first

        speechBarChartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: sortedStores.map(s => s.code),
            datasets: [
              {
                label: 'WhatsApp',
                data: sortedStores.map(s => s.whatsapp),
                backgroundColor: '#25D366',
                borderRadius: 4
              },
              {
                label: 'Copiar',
                data: sortedStores.map(s => s.copy),
                backgroundColor: '#8B5CF6',
                borderRadius: 4
              }
            ]
          },
          options: {
            indexAxis: 'y', // Horizontal bar chart
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { mode: 'index', intersect: false }
            },
            scales: {
              x: { stacked: true, grid: { color: '#F1F5F9' }, ticks: { font: { family: 'Outfit, Inter, sans-serif', size: 10 } } },
              y: { stacked: true, grid: { display: false }, ticks: { font: { family: 'Outfit, Inter, sans-serif', size: 11, weight: '700' } } }
            }
          }
        });
      }
    }

    return () => {
      if (barChartInstance.current) barChartInstance.current.destroy();
      if (lineChartInstance.current) lineChartInstance.current.destroy();
      if (doughnutChartInstance.current) doughnutChartInstance.current.destroy();
      if (speechBarChartInstance.current) speechBarChartInstance.current.destroy();
    };
  }, [storeStatistics, complianceAverages, storeCode, userRole, timeRange, selectedMonths, speechStats]);

  if (userRole !== 'admin') {
    return (
      <div className="view-section active" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '40px' }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fas fa-lock" style={{ fontSize: '48px', color: 'var(--text-muted)', marginBottom: '16px' }}></i>
          <h2 style={{ color: 'var(--text-primary)' }}>Acceso Denegado</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Esta sección es exclusiva para administradores.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="view-section active" style={{ background: 'linear-gradient(180deg,#f0f4ff 0%,#f8fafc 100%)', minHeight: '100%' }}>
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* ===== HEADER ===== */}
        <div style={{
          background: 'linear-gradient(135deg,#312e81 0%,#4f46e5 55%,#7c3aed 100%)',
          borderRadius: '20px', padding: '24px 32px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0 8px 32px rgba(79,70,229,0.35)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
              <i className="fas fa-tasks" style={{ color: '#fff', fontSize: '22px' }}></i>
            </div>
            <div>
              <h2 style={{ color: '#fff', fontWeight: '900', fontSize: '22px', margin: 0, letterSpacing: '-0.4px' }}>
                Análisis de Rendimiento
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.65)', margin: '3px 0 0', fontSize: '13px', fontWeight: '500' }}>
                Dashboard de Tareas Operativas · <strong style={{ color: 'rgba(255,255,255,0.9)' }}>{selectedDayName}</strong> {selectedDate}
              </p>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.14)', borderRadius: '12px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(255,255,255,0.22)' }}>
            <i className="fas fa-calendar-day" style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px' }}></i>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ background: 'transparent', border: 'none', fontSize: '13px', fontWeight: '700', color: '#fff', outline: 'none', cursor: 'pointer', colorScheme: 'dark' }}
            />
          </div>
        </div>

        {/* ===== KPI CARDS ===== */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
          {[
            { label: 'Rendimiento Red', value: `${complianceAverages.avgCompliance}%`, sub: 'Promedio todas las tiendas', icon: 'fa-chart-line', bg: 'linear-gradient(135deg,#4338ca,#7c3aed)' },
            { label: 'Mejor Tienda', value: complianceAverages.bestStore, sub: `Día ${selectedDate}`, icon: 'fa-trophy', bg: 'linear-gradient(135deg,#b45309,#f59e0b)' },
            { label: 'Tareas Completadas', value: complianceAverages.totalCompleted, sub: `de ${complianceAverages.totalAssigned} · ${selectedDayName}`, icon: 'fa-check-circle', bg: 'linear-gradient(135deg,#065f46,#10b981)' },
            { label: 'Tiendas Óptimas', value: `${complianceAverages.storesAbove80} / 14`, sub: 'Rendimiento ≥ 80%', icon: 'fa-store', bg: 'linear-gradient(135deg,#9d174d,#ec4899)' }
          ].map((kpi, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', display: 'flex', gap: '14px', alignItems: 'flex-start', transition: 'transform 0.2s,box-shadow 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.11)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'; }}
            >
              <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                <i className={`fas ${kpi.icon}`} style={{ color: '#fff', fontSize: '19px' }}></i>
              </div>
              <div>
                <div style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{kpi.label}</div>
                <div style={{ fontSize: '22px', fontWeight: '900', color: '#1e293b', lineHeight: 1.2, marginTop: '2px' }}>{kpi.value}</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{kpi.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ===== AGENDA + STORE GRID ===== */}
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>

          {/* Agenda del Día */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', paddingBottom: '12px', borderBottom: '2px solid #f1f5f9' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4f46e5' }}></div>
              <span style={{ fontWeight: '800', fontSize: '13px', color: '#1e293b' }}>Agenda del Día</span>
              <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '4px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '6px', fontWeight: '700' }}>{selectedDayName}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {(weeklyTasks[selectedDayName] || []).map((task, idx) => (
                <div key={task.id} style={{
                  display: 'flex', gap: '10px', padding: '10px 12px',
                  borderRadius: '10px',
                  background: idx % 2 === 0 ? '#fafbff' : '#fff',
                  border: '1px solid #f1f5f9',
                  transition: 'all 0.15s'
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#ede9fe'; e.currentTarget.style.borderColor = '#c4b5fd'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = idx % 2 === 0 ? '#fafbff' : '#fff'; e.currentTarget.style.borderColor = '#f1f5f9'; }}
                >
                  <span style={{ fontSize: '20px', flexShrink: 0, lineHeight: 1.2 }}>{task.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', lineHeight: 1.3, marginBottom: '4px' }}>{task.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <i className="fas fa-clock" style={{ color: '#94a3b8', fontSize: '9px' }}></i>
                      <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>{task.horaInicio} – {task.horaFin}</span>
                      {task.obligatoria && (
                        <span style={{ fontSize: '8px', fontWeight: '800', color: '#7c3aed', background: '#ede9fe', padding: '2px 5px', borderRadius: '4px', textTransform: 'uppercase' }}>Oblig.</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {(!weeklyTasks[selectedDayName] || weeklyTasks[selectedDayName].length === 0) && (
                <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '13px' }}>
                  <i className="fas fa-calendar-times" style={{ fontSize: '32px', display: 'block', marginBottom: '8px', opacity: 0.5 }}></i>
                  Sin tareas para {selectedDayName}
                </div>
              )}
            </div>
          </div>

          {/* Estado de la Red - Store Grid */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', paddingBottom: '12px', borderBottom: '2px solid #f1f5f9' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
              <span style={{ fontWeight: '800', fontSize: '13px', color: '#1e293b' }}>Estado de la Red</span>
              <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '4px' }}>· {selectedDate}</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#059669', background: '#dcfce7', padding: '2px 10px', borderRadius: '6px' }}>
                  {complianceAverages.storesAbove80} óptimas
                </span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#dc2626', background: '#fee2e2', padding: '2px 10px', borderRadius: '6px' }}>
                  {14 - complianceAverages.storesAbove80} críticas
                </span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(125px,1fr))', gap: '10px' }}>
              {storeStatistics.map(store => {
                const ok = store.pct >= 80;
                return (
                  <div key={store.code} style={{
                    borderRadius: '12px', padding: '14px 10px', textAlign: 'center',
                    background: ok ? 'linear-gradient(135deg,#f0fdf4,#dcfce7)' : 'linear-gradient(135deg,#fef2f2,#fee2e2)',
                    border: `1.5px solid ${ok ? '#86efac' : '#fca5a5'}`,
                    transition: 'transform 0.2s,box-shadow 0.2s',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.05)'; }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: '900', color: '#1e293b', marginBottom: '4px' }}>{store.code}</div>
                    <div style={{ fontSize: '28px', fontWeight: '900', color: ok ? '#059669' : '#ef4444', lineHeight: 1, marginBottom: '4px' }}>{store.pct}<span style={{ fontSize: '14px' }}>%</span></div>
                    <div style={{ fontSize: '10px', color: ok ? '#065f46' : '#991b1b', fontWeight: '700' }}>{store.completed}/{store.assigned} tareas</div>
                    <div style={{ height: '5px', background: ok ? '#bbf7d0' : '#fecaca', borderRadius: '3px', margin: '8px 0 6px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${store.pct}%`, background: ok ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#ef4444,#f87171)', borderRadius: '3px', transition: 'width 1s ease' }}></div>
                    </div>
                    <span style={{ fontSize: '9px', fontWeight: '800', padding: '2px 7px', borderRadius: '5px', color: ok ? '#065f46' : '#991b1b', background: ok ? '#bbf7d0' : '#fecaca' }}>
                      {ok ? '✓ ÓPTIMO' : '⚠ CRÍTICO'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ===== CHARTS ROW ===== */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8B5CF6' }}></div>
              <span style={{ fontWeight: '800', fontSize: '13px', color: '#1e293b' }}>Rendimiento por Tienda</span>
              <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: 'auto', fontWeight: '600' }}>{selectedDate}</span>
            </div>
            <div style={{ height: '230px' }}><canvas ref={barChartRef} /></div>
          </div>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#A78BFA' }}></div>
              <span style={{ fontWeight: '800', fontSize: '13px', color: '#1e293b' }}>Evolución Red Completa</span>
            </div>
            <div style={{ height: '230px' }}><canvas ref={lineChartRef} /></div>
          </div>
        </div>

        {/* ===== SPEECH SECTION ===== */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#25D366' }}></div>
              <span style={{ fontWeight: '800', fontSize: '13px', color: '#1e293b' }}>Distribución Global Speech</span>
            </div>
            <div style={{ height: '230px' }}><canvas ref={doughnutChartRef} /></div>
          </div>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8B5CF6' }}></div>
              <span style={{ fontWeight: '800', fontSize: '13px', color: '#1e293b' }}>Interacciones de Speech por Tienda</span>
            </div>
            <div style={{ height: '230px' }}><canvas ref={speechBarChartRef} /></div>
          </div>
        </div>

        {/* ===== TABLA DE REGISTRO ===== */}
        <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '2px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4f46e5' }}></div>
              <span style={{ fontWeight: '800', fontSize: '13px', color: '#1e293b' }}>Registro de Rendimiento</span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>· {selectedDate}</span>
            </div>
            <button className="topbar-btn btn-outline" style={{ padding: '7px 14px', fontSize: '11px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="fas fa-file-export"></i>Exportar CSV
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Fecha', 'Tienda', 'Código', 'Asignadas', 'Completadas', '% Rendimiento', 'Estado'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: ['Asignadas','Completadas','% Rendimiento'].includes(h) ? 'center' : 'left', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {storeStatistics.map((row, idx) => (
                  <tr key={row.code} style={{ background: idx % 2 === 0 ? '#fff' : '#fafbff', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#fafbff'}
                  >
                    <td style={{ padding: '11px 14px', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #f1f5f9' }}>
                      {selectedDate}
                      {isToday && <span style={{ fontSize: '8px', fontWeight: '800', color: '#fff', background: '#4f46e5', padding: '1px 5px', borderRadius: '4px', marginLeft: '6px' }}>VIVO</span>}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: '14px', fontWeight: '900', color: '#1e293b', borderBottom: '1px solid #f1f5f9' }}>{row.code}</td>
                    <td style={{ padding: '11px 14px', fontSize: '12px', color: '#64748b', borderBottom: '1px solid #f1f5f9' }}>{row.storeName}</td>
                    <td style={{ padding: '11px 14px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#1e293b', borderBottom: '1px solid #f1f5f9' }}>{row.assigned}</td>
                    <td style={{ padding: '11px 14px', textAlign: 'center', fontSize: '13px', fontWeight: '800', color: row.completed > 0 ? '#1e293b' : '#94a3b8', borderBottom: '1px solid #f1f5f9' }}>{row.completed}</td>
                    <td style={{ padding: '11px 14px', textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '15px', fontWeight: '900', color: row.pct >= 80 ? '#059669' : '#ef4444' }}>{row.pct}%</span>
                    </td>
                    <td style={{ padding: '11px 14px', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: '10px', fontWeight: '800', padding: '4px 10px', borderRadius: '7px', color: row.pct >= 80 ? '#065f46' : '#991b1b', background: row.pct >= 80 ? '#dcfce7' : '#fee2e2', whiteSpace: 'nowrap' }}>
                        {row.pct >= 80 ? '✓ ÓPTIMO' : '⚠ CRÍTICO'}
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
  );
}
