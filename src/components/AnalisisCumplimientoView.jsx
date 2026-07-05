import { useMemo, useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';

const STORES = [
  'CB', 'CHM', 'CHQ', 'ESC', 'HH', 'JT', 'MZ', 'PT', 'PTB', 'SJ', 'SMA', 'VN', 'XL', 'Z3'
];

export default function AnalisisCumplimientoView({
  selectedStores = [],
  selectedMonths = [],
  userRole = 'store',
  storeChecklists = {},
  timeRange = '1 semana',
  checklistTasks = []
}) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const todayIso = new Date().toISOString().slice(0, 10);
  const isToday = selectedDate === todayIso;
  
  const storeCode = selectedStores.length === 14 ? 'Todos' : selectedStores[0];

  const currentChecklist = useMemo(() => {
    return storeChecklists[storeCode] || {};
  }, [storeChecklists, storeCode]);

  const completedCount = useMemo(() => {
    return Object.values(currentChecklist).filter(Boolean).length;
  }, [currentChecklist]);

  const completionPercent = useMemo(() => {
    return checklistTasks.length > 0
      ? Math.round((completedCount / checklistTasks.length) * 100)
      : 0;
  }, [completedCount, checklistTasks]);

  // Compute compliance statistics for all 14 stores
  const storeStatistics = useMemo(() => {
    return STORES.map(code => {
      let completed = 0;
      
      if (isToday) {
        const checklist = storeChecklists[code] || {};
        completed = Object.values(checklist).filter(Boolean).length;
      }
      
      let mockCompleted = completed;
      if (completed === 0) {
        let hash = 0;
        const str = code + selectedDate;
        for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
        const x = Math.sin(hash) * 10000;
        const random = x - Math.floor(x);
        
        let baseTasks = 8;
        if (code === 'JT') baseTasks = 10;
        if (code === 'CHQ') baseTasks = 5;
        if (code === 'CB') baseTasks = 7;
        
        mockCompleted = Math.min(13, Math.max(0, Math.floor(baseTasks + random * 5 - 2)));
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
  }, [storeChecklists, isToday, selectedDate]);

  // Network average compliance
  const complianceAverages = useMemo(() => {
    const totalAssigned = 14 * 13;
    const totalCompleted = storeStatistics.reduce((sum, s) => sum + s.completed, 0);
    const avgCompliance = Math.round((totalCompleted / totalAssigned) * 100);
    
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

  // Generate 30-day history for individual store private view
  const storeHistory = useMemo(() => {
    const history = [];
    const today = new Date();
    
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
    
    const todayCompleted = completedCount;
    const todayPct = checklistTasks.length > 0 ? Math.round((todayCompleted / checklistTasks.length) * 100) : 0;
    let todayStatus = 'CRÍTICO';
    if (todayPct >= 80) todayStatus = 'ÓPTIMO';
    else if (todayPct >= 60) todayStatus = 'ACEPTABLE';
    
    history.push({
      date: today.toISOString().slice(0, 10),
      displayDate: today.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
      assigned: checklistTasks.length || 13,
      completed: todayCompleted,
      pct: todayPct,
      status: todayStatus,
      isToday: true
    });
    
    return history;
  }, [storeCode, completedCount, checklistTasks]);

  const filteredStoreHistory = useMemo(() => {
    const sliceCount = 
      timeRange === '1 día' ? 1 :
      timeRange === '1 semana' ? 7 :
      timeRange === 'Quincenal' ? 15 : 30;
    return storeHistory.slice(-sliceCount);
  }, [storeHistory, timeRange]);

  const avgStoreCompliance = useMemo(() => {
    if (filteredStoreHistory.length === 0) return 0;
    const sum = filteredStoreHistory.reduce((s, h) => s + h.pct, 0);
    return Math.round(sum / filteredStoreHistory.length);
  }, [filteredStoreHistory]);

  const optimalDaysCount = useMemo(() => {
    return filteredStoreHistory.filter(h => h.pct >= 80).length;
  }, [filteredStoreHistory]);

  const todayRecord = useMemo(() => {
    return storeHistory[storeHistory.length - 1] || { completed: 0, assigned: 13 };
  }, [storeHistory]);

  const barChartRef = useRef(null);
  const lineChartRef = useRef(null);
  const privateLineChartRef = useRef(null);
  const barChartInstance = useRef(null);
  const lineChartInstance = useRef(null);
  const privateLineChartInstance = useRef(null);

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
              x: { grid: { display: false }, ticks: { font: { family: 'Outfit, Inter, sans-serif', size: 11, weight: '700' }, color: '#64748B' } },
              y: { grid: { color: '#F1F5F9' }, min: 0, max: 100, ticks: { callback: v => v + '%', font: { family: 'Outfit, Inter, sans-serif', size: 11, weight: '600' }, color: '#64748B' } }
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
            const seed = targetMonth + d;
            const x = Math.sin(seed) * 10000;
            const rand = x - Math.floor(x);
            generatedData.push(Math.round(40 + (rand * 40)));
          }
        } else {
          const rawLabels = ['09/05', '11/05', '13/05', '15/05', '17/05', '19/05', '21/05', '23/05', '25/05', '27/05', '29/05', '31/05', '02/06', '04/06', '06/06'];
          const rawData = [2, 1, 3, 2, 2, 4, 3, 5, 4, 6, 8, 12, 16, 20, complianceAverages.avgCompliance];
          
          const sliceCount = 
            timeRange === '1 día' ? 1 :
            timeRange === '1 semana' ? 7 :
            timeRange === 'Quincenal' ? 15 : 30;

          generatedLabels = rawLabels.slice(-sliceCount);
          generatedData = rawData.slice(-sliceCount);
        }
        
        const gradient = ctx.createLinearGradient(0, 0, 0, 200);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.15)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.01)');

        lineChartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: generatedLabels,
            datasets: [{
              data: generatedData,
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
        const labels = filteredStoreHistory.map(h => h.displayDate);
        const data = filteredStoreHistory.map(h => h.pct);
        
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
  }, [storeStatistics, complianceAverages, storeCode, userRole, filteredStoreHistory, timeRange]);

  return (
    <div className="view-section active">
      {/* Compliance Analytics Section (Panel de Avance) - Visibilidad Condicionada por Rol */}
      {userRole === 'admin' ? (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header" style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#d32f2f', fontSize: '18px' }}>
                <i className="fas fa-database"></i>
              </span>
              <div>
                <h3 className="card-title" style={{ fontSize: '15px' }}>Análisis de Cumplimiento (Mes en curso)</h3>
                <p className="card-subtitle">Monitoreo y registro diario de avance por sucursales</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  background: 'var(--bg-body)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: 'var(--text-secondary)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
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
                  Registro Reciente
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
              <span className="stage-badge" style={{ background: 'var(--bg-body)', color: 'var(--text-secondary)', fontSize: '10px', fontWeight: '700' }}>{timeRange === 'Mensual' ? 'Últimos 30 días' : timeRange}</span>
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
                  {optimalDaysCount} de {filteredStoreHistory.length}
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
                  Mi Evolución de Cumplimiento — {timeRange === 'Mensual' ? 'Últimos 30 días' : timeRange}
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
                    {[...filteredStoreHistory].reverse().map((row, idx) => (
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
