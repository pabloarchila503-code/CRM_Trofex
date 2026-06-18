import { useMemo, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

export default function RendimientoProgramadoView({ activeStore = 'Todos', checkedTasks = {}, weeklyTasks = {}, timeRange = 'Mensual' }) {
  const storeCode = activeStore === 'Todos' ? 'CB' : activeStore;

  // Dynamic Cronograma History Simulation (30 days)
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
      const assigned = weeklyTasks[dayKey]?.length || 0;
      
      // Seed random completion count
      const completed = Math.min(assigned, Math.max(0, Math.floor(assigned - random() * 2)));
      const pct = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;
      
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
      const todayAssigned = weeklyTasks[todayKey]?.length || 0;
      
      // Calculate checked count for today
      const storeChecks = checkedTasks[storeCode] || {};
      const todayChecks = storeChecks[todayKey] || {};
      const todayCompleted = Object.values(todayChecks).filter(Boolean).length;
      const todayPct = todayAssigned > 0 ? Math.round((todayCompleted / todayAssigned) * 100) : 0;
      
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
  }, [storeCode, checkedTasks, weeklyTasks]);

  const filteredCronogramaHistory = useMemo(() => {
    const sliceCount = 
      timeRange === '1 día' ? 1 :
      timeRange === '1 semana' ? 7 :
      timeRange === 'Quincenal' ? 15 : 30;
    return cronogramaHistory.slice(-sliceCount);
  }, [cronogramaHistory, timeRange]);

  // Calculate KPIs
  const avgCronogramaCompliance = useMemo(() => {
    if (filteredCronogramaHistory.length === 0) return 0;
    const sum = filteredCronogramaHistory.reduce((s, h) => s + h.pct, 0);
    return Math.round(sum / filteredCronogramaHistory.length);
  }, [filteredCronogramaHistory]);

  const todayRecord = useMemo(() => {
    return cronogramaHistory[cronogramaHistory.length - 1] || { completed: 0, assigned: 0, pct: 0 };
  }, [cronogramaHistory]);

  const optimalDaysCount = useMemo(() => {
    return filteredCronogramaHistory.filter(h => h.pct >= 80).length;
  }, [filteredCronogramaHistory]);

  const lineChartRef = useRef(null);
  const lineChartInstance = useRef(null);

  // Render Chart.js dynamic report
  useEffect(() => {
    if (lineChartRef.current) {
      if (lineChartInstance.current) {
        lineChartInstance.current.destroy();
      }
      
      const ctx = lineChartRef.current.getContext('2d');
      const labels = filteredCronogramaHistory.map(h => h.displayDate);
      const data = filteredCronogramaHistory.map(h => h.pct);
      
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
  }, [filteredCronogramaHistory]);

  return (
    <div className="view-section active">
      <p className="section-label">Tareas Operativas — Análisis de Cumplimiento</p>

      {/* Dashboard de Rendimiento de Cronograma */}
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
            <span className="stage-badge" style={{ background: 'var(--bg-body)', color: 'var(--text-secondary)', fontSize: '10px', fontWeight: '700' }}>{timeRange === 'Mensual' ? 'Últimos 30 días' : timeRange}</span>
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
                De {filteredCronogramaHistory.length} días hábiles registrados
              </div>
            </div>
          </div>

          {/* Line Chart */}
          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: '10px', padding: '16px', marginBottom: '24px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3B82F6' }}></span>
              Mi Evolución de Cumplimiento de Cronograma — {timeRange === 'Mensual' ? 'Últimos 30 días' : timeRange}
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
                  {[...filteredCronogramaHistory].reverse().map((row, idx) => (
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
    </div>
  );
}
