import React, { useState, useEffect, useRef, useMemo } from 'react';
import Chart from 'chart.js/auto';

// ─── CONSTANTES ────────────────────────────────────────────────────────────────
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const TIENDAS = ['CB', 'CHM', 'CHQ', 'ESC', 'HH', 'JT', 'MZ', 'PT', 'PTB', 'SJ', 'SMA', 'VN', 'XL', 'Z3'];

// Paleta semáforo
const CHART_COLORS = {
  prospectados: '#94A3B8', // Gris
  contactados:  '#3B82F6', // Azul
  cotizados:    '#F59E0B', // Amarillo
  cerrados:     '#10B981', // Verde
  perdidos:     '#EF4444', // Rojo
};

// ─── MOCK DATA ──────────────────────────────────────────────────────────────────
const generarMockProspecciones = () => {
  const db = [];
  let num = 1;
  TIENDAS.forEach((store, sIdx) => {
    MESES.forEach((month, mIdx) => {
      const seed = (sIdx * 12 + mIdx) * 31;
      const prospectados = 20 + (seed % 30);
      const contactados  = Math.floor(prospectados * 0.75);
      const cotizados    = Math.floor(contactados  * 0.6);
      const cerrados     = Math.floor(cotizados    * 0.5) + 1;
      const perdidos     = Math.floor((prospectados - cerrados) * 0.25);
      db.push({
        id: num,
        Numeración: num++,
        Mes: month,
        Tienda: store,
        Prospectados: prospectados,
        Contactados:  contactados,
        Cotizados:    cotizados,
        Cerrados:     cerrados,
        Perdidos:     perdidos,
      });
    });
  });
  return db;
};

// ─── GRÁFICA ANUAL (BARRAS HORIZONTALES – resumen consolidado) ─────────────────
function AnnualSummaryChart({ totals }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }

    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Prospectados', 'Contactados', 'Cotizados', 'Cerrados', 'Perdidos'],
        datasets: [{
          data: [
            totals.prospectados,
            totals.contactados,
            totals.cotizados,
            totals.cerrados,
            totals.perdidos,
          ],
          backgroundColor: [
            CHART_COLORS.prospectados + 'CC',
            CHART_COLORS.contactados  + 'CC',
            CHART_COLORS.cotizados    + 'CC',
            CHART_COLORS.cerrados     + 'CC',
            CHART_COLORS.perdidos     + 'CC',
          ],
          borderColor: Object.values(CHART_COLORS),
          borderWidth: 1.5,
          borderRadius: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { mode: 'index' },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#64748B', font: { family: 'Inter', size: 11, weight: '600' } },
          },
          y: {
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: { color: '#94A3B8', font: { family: 'Inter', size: 10 } },
          },
        },
      },
    });

    return () => { if (chartRef.current) { chartRef.current.destroy(); } };
  }, [totals]);

  return <canvas ref={canvasRef} />;
}

// ─── GRÁFICA DE BARRAS VERTICALES POR MES (semáforo) ──────────────────────────
function MonthBarChart({ data, chartId }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }

    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Prospectados', 'Contactados', 'Cotizados', 'Cerrados', 'Perdidos'],
        datasets: [{
          label: 'Cantidad',
          data: [
            data.prospectados,
            data.contactados,
            data.cotizados,
            data.cerrados,
            data.perdidos,
          ],
          backgroundColor: [
            CHART_COLORS.prospectados + 'CC',
            CHART_COLORS.contactados  + 'CC',
            CHART_COLORS.cotizados    + 'CC',
            CHART_COLORS.cerrados     + 'CC',
            CHART_COLORS.perdidos     + 'CC',
          ],
          borderColor: Object.values(CHART_COLORS),
          borderWidth: 2,
          borderRadius: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (item) => ` ${item.label}: ${item.raw}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#64748B', font: { family: 'Inter', size: 10, weight: '600' } },
          },
          y: {
            grid: { color: 'rgba(0,0,0,0.05)' },
            beginAtZero: true,
            ticks: { color: '#94A3B8', font: { family: 'Inter', size: 10 } },
          },
        },
      },
    });

    return () => { if (chartRef.current) { chartRef.current.destroy(); } };
  }, [data, chartId]);

  return <canvas ref={canvasRef} />;
}

// ─── HELPER: color de conversión ───────────────────────────────────────────────
const convColor = (pct) => {
  if (pct >= 50) return '#10B981';
  if (pct >= 25) return '#F59E0B';
  return '#EF4444';
};

// ═══════════════════════════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
export default function ProspeccionesView({
  showToast,
  userRole,
  activeStore,
  prospecciones = [],
  setProspecciones
}) {
  // ── Rol y tienda reales (desde props de sesión)
  const isAdmin   = String(userRole).trim().toLowerCase() === 'admin';
  const storeName = isAdmin ? 'Todos' : (activeStore || 'CB');

  // ── Estado de datos
  const [isLoading,  setIsLoading]  = useState(false);
  const [isSyncing,  setIsSyncing]  = useState(false);

  // ── Local filtered version for accordion and tables
  const filteredProspecciones = useMemo(() => {
    return isAdmin ? prospecciones : prospecciones.filter(r => r.Tienda === storeName);
  }, [prospecciones, isAdmin, storeName]);

  // ── Acordeón: mes activo
  const [activeMonth, setActiveMonth] = useState(null);

  // ── Modal de ingreso (solo tiendas)
  const [isModalOpen,     setIsModalOpen]     = useState(false);
  const [modalMes,        setModalMes]        = useState('');
  const [formProspectados,setFormProspectados]= useState('');
  const [formContactados, setFormContactados] = useState('');
  const [formCotizados,   setFormCotizados]   = useState('');
  const [formCerrados,    setFormCerrados]    = useState('');
  const [formPerdidos,    setFormPerdidos]    = useState('');

  const isGas = typeof google !== 'undefined' && google.script && google.script.run;

  // ── Carga de datos ──────────────────────────────────────────────────────────
  const loadData = (silent = false) => {
    if (!silent) setIsLoading(true);

    if (isGas) {
      google.script.run
        .withSuccessHandler((response) => {
          setProspecciones(response.data || []);
          setIsLoading(false);
          setIsSyncing(false);
        })
        .withFailureHandler((err) => {
          showToast('Error al cargar prospecciones: ' + err.message, 'error');
          setIsLoading(false);
          setIsSyncing(false);
        })
        .obtenerProspecciones();
    } else {
      // Emulador local
      setTimeout(() => {
        if (!localStorage.getItem('MOCK_PROSPECCIONES_DB')) {
          localStorage.setItem('MOCK_PROSPECCIONES_DB', JSON.stringify(generarMockProspecciones()));
        }
        const db = JSON.parse(localStorage.getItem('MOCK_PROSPECCIONES_DB') || '[]');
        setProspecciones(db);
        setIsLoading(false);
        setIsSyncing(false);
      }, 400);
    }
  };

  useEffect(() => { loadData(); }, [isAdmin, storeName]);

  const handleSyncManual = () => {
    setIsSyncing(true);
    showToast('Sincronizando con la base de datos...', 'info');
    loadData(true);
  };

  // ── Totales anuales ─────────────────────────────────────────────────────────
  const totalAnual = useMemo(() =>
    filteredProspecciones.reduce((acc, r) => ({
      prospectados: acc.prospectados + (parseInt(r.Prospectados) || 0),
      contactados:  acc.contactados  + (parseInt(r.Contactados)  || 0),
      cotizados:    acc.cotizados    + (parseInt(r.Cotizados)    || 0),
      cerrados:     acc.cerrados     + (parseInt(r.Cerrados)     || 0),
      perdidos:     acc.perdidos     + (parseInt(r.Perdidos)     || 0),
    }), { prospectados: 0, contactados: 0, cotizados: 0, cerrados: 0, perdidos: 0 }),
  [filteredProspecciones]);

  const tasaAnual = useMemo(() =>
    totalAnual.prospectados > 0
      ? ((totalAnual.cerrados / totalAnual.prospectados) * 100).toFixed(1)
      : '0.0',
  [totalAnual]);

  // ── Agregados por mes ───────────────────────────────────────────────────────
  const mesesAgg = useMemo(() => {
    const res = {};
    MESES.forEach(m => { res[m] = { prospectados: 0, contactados: 0, cotizados: 0, cerrados: 0, perdidos: 0 }; });
    filteredProspecciones.forEach(r => {
      const m = r.Mes;
      if (res[m]) {
        res[m].prospectados += (parseInt(r.Prospectados) || 0);
        res[m].contactados  += (parseInt(r.Contactados)  || 0);
        res[m].cotizados    += (parseInt(r.Cotizados)    || 0);
        res[m].cerrados     += (parseInt(r.Cerrados)     || 0);
        res[m].perdidos     += (parseInt(r.Perdidos)     || 0);
      }
    });
    return res;
  }, [filteredProspecciones]);

  // ── Detalle mes: Admin → todas sucursales ordenadas; Tienda → solo la propia ─
  const adminMonthDetails = useMemo(() => {
    if (!activeMonth || !isAdmin) return [];
    return filteredProspecciones
      .filter(r => r.Mes.toLowerCase() === activeMonth.toLowerCase())
      .map((r, idx) => {
        const prosp = parseInt(r.Prospectados) || 0;
        const cerr  = parseInt(r.Cerrados)     || 0;
        return {
          num:           idx + 1,
          tienda:        r.Tienda,
          prospectados:  prosp,
          contactados:   parseInt(r.Contactados) || 0,
          cotizados:     parseInt(r.Cotizados)   || 0,
          cerrados:      cerr,
          perdidos:      parseInt(r.Perdidos)    || 0,
          conversion:    prosp > 0 ? (cerr / prosp) * 100 : 0,
        };
      })
      .sort((a, b) => a.conversion - b.conversion)
      .map((r, idx) => ({ ...r, num: idx + 1 }));
  }, [activeMonth, filteredProspecciones, isAdmin]);

  const storeMonthDetail = useMemo(() => {
    if (!activeMonth || isAdmin) return null;
    const r = filteredProspecciones.find(p => p.Mes.toLowerCase() === activeMonth.toLowerCase());
    if (!r) return null;
    const prosp = parseInt(r.Prospectados) || 0;
    const cerr  = parseInt(r.Cerrados)     || 0;
    return {
      tienda:       r.Tienda,
      prospectados: prosp,
      contactados:  parseInt(r.Contactados) || 0,
      cotizados:    parseInt(r.Cotizados)   || 0,
      cerrados:     cerr,
      perdidos:     parseInt(r.Perdidos)    || 0,
      conversion:   prosp > 0 ? (cerr / prosp) * 100 : 0,
    };
  }, [activeMonth, filteredProspecciones, isAdmin]);

  // ── Modal: abrir con mes ────────────────────────────────────────────────────
  const handleOpenAddModal = (mes) => {
    if (isAdmin) return;
    const existing = storeMonthDetail;
    setModalMes(mes);
    setFormProspectados(existing ? String(existing.prospectados) : '');
    setFormContactados (existing ? String(existing.contactados)  : '');
    setFormCotizados   (existing ? String(existing.cotizados)    : '');
    setFormCerrados    (existing ? String(existing.cerrados)     : '');
    setFormPerdidos    (existing ? String(existing.perdidos)     : '');
    setIsModalOpen(true);
  };

  // ── Modal: guardar ──────────────────────────────────────────────────────────
  const handleSave = (e) => {
    e.preventDefault();
    const vals = {
      prospectados: parseInt(formProspectados),
      contactados:  parseInt(formContactados),
      cotizados:    parseInt(formCotizados),
      cerrados:     parseInt(formCerrados),
      perdidos:     parseInt(formPerdidos),
    };
    if (Object.values(vals).some(isNaN)) {
      showToast('Por favor ingresa únicamente valores numéricos enteros.', 'error'); return;
    }
    if (Object.values(vals).some(v => v < 0)) {
      showToast('Los valores no pueden ser negativos.', 'error'); return;
    }

    const payload = { mes: modalMes, tienda: storeName, ...vals };
    setIsLoading(true);
    setIsModalOpen(false);

    if (isGas) {
      google.script.run
        .withSuccessHandler((res) => {
          if (res.status === 'success') {
            showToast('Valores mensuales actualizados.', 'success');
            setProspecciones(res.response.data || []);
          } else {
            showToast('Error al guardar: ' + res.message, 'error');
          }
          setIsLoading(false);
        })
        .withFailureHandler((err) => {
          showToast('Error al guardar: ' + err.message, 'error');
          setIsLoading(false);
        })
        .guardarValoresMensuales(payload);
    } else {
      setTimeout(() => {
        let db = JSON.parse(localStorage.getItem('MOCK_PROSPECCIONES_DB') || '[]');
        let found = false;
        db = db.map(item => {
          if (item.Mes.toLowerCase() === payload.mes.toLowerCase() &&
              item.Tienda.toLowerCase() === payload.tienda.toLowerCase()) {
            found = true;
            return { ...item, Prospectados: vals.prospectados, Contactados: vals.contactados,
                      Cotizados: vals.cotizados, Cerrados: vals.cerrados, Perdidos: vals.perdidos };
          }
          return item;
        });
        if (!found) {
          const nextId = db.length > 0 ? Math.max(...db.map(d => d.id)) + 1 : 1;
          db.push({ id: nextId, Numeración: nextId, Mes: payload.mes, Tienda: payload.tienda,
                    ...{ Prospectados: vals.prospectados, Contactados: vals.contactados,
                         Cotizados: vals.cotizados, Cerrados: vals.cerrados, Perdidos: vals.perdidos } });
        }
        localStorage.setItem('MOCK_PROSPECCIONES_DB', JSON.stringify(db));
        setProspecciones(db);
        showToast('Valores mensuales actualizados exitosamente.', 'success');
        setIsLoading(false);
      }, 400);
    }
  };

  // ── Toggle acordeón ─────────────────────────────────────────────────────────
  const handleMonthClick = (month) => {
    setActiveMonth(prev => (prev === month ? null : month));
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ position: 'relative' }}>

      {/* ─── SPINNER OVERLAY ─── */}
      {isLoading && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 20, borderRadius: 'var(--radius-lg)',
        }}>
          <div style={{
            width: '40px', height: '40px',
            border: '4px solid var(--border-light)',
            borderTopColor: 'var(--accent-coral)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
      )}

      {/* ─── HEADER ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <p className="section-label">Ventas — Control de Prospecciones Mensuales</p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            {isAdmin ? 'Vista consolidada de todas las sucursales' : `Vista personal — Tienda ${storeName}`}
          </p>
        </div>
        <button className="topbar-btn btn-outline" onClick={handleSyncManual} disabled={isLoading}>
          <i className={`fas fa-sync-alt ${isSyncing ? 'fa-spin' : ''}`}></i> Actualizar
        </button>
      </div>

      {/* ─── BANNER RESUMEN ANUAL ─── */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #FFF8F5 0%, #FFFFFF 100%)',
        borderLeft: '5px solid var(--accent-coral)',
        padding: '24px',
        marginBottom: '28px',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
              Resumen Acumulado Anual
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              {isAdmin ? 'Consolidado de todas las sucursales' : `Tienda ${storeName}`}
            </p>
          </div>
          <div style={{
            background: 'rgba(255,109,77,0.1)', color: 'var(--accent-coral)',
            padding: '12px 20px', borderRadius: 'var(--radius-md)', textAlign: 'center',
          }}>
            <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Tasa de Conversión Anual
            </div>
            <div style={{ fontSize: '28px', fontWeight: '800' }}>{tasaAnual}%</div>
          </div>
        </div>

        {/* KPIs mini */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '20px' }}
             className="kpis-annual-grid">
          {[
            { label: 'Prospectados', val: totalAnual.prospectados, color: CHART_COLORS.prospectados },
            { label: 'Contactados',  val: totalAnual.contactados,  color: CHART_COLORS.contactados  },
            { label: 'Cotizados',    val: totalAnual.cotizados,    color: CHART_COLORS.cotizados    },
            { label: 'Cerrados',     val: totalAnual.cerrados,     color: CHART_COLORS.cerrados     },
            { label: 'Perdidos',     val: totalAnual.perdidos,     color: CHART_COLORS.perdidos     },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ padding: '8px 4px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>{label}</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color, marginTop: '4px' }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Gráfica anual */}
        <div style={{ height: '180px', position: 'relative' }}>
          <AnnualSummaryChart totals={totalAnual} />
        </div>
      </div>

      {/* ─── CUADRÍCULA 4×3 DE MESES ─── */}
      <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)',
                   marginBottom: '14px' }}>
        <i className="fas fa-calendar-alt" style={{ marginRight: '8px', color: 'var(--accent-coral)' }}></i>
        Rendimiento por Mes — Haz clic para expandir
      </h4>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Filas de 4 meses */}
        {[0, 1, 2].map(rowIdx => (
          <div key={rowIdx}>
            {/* Fila de tarjetas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
              {MESES.slice(rowIdx * 4, rowIdx * 4 + 4).map((month) => {
                const stats      = mesesAgg[month] || { prospectados: 0, contactados: 0, cotizados: 0, cerrados: 0, perdidos: 0 };
                const conversion = stats.prospectados > 0
                  ? (stats.cerrados / stats.prospectados) * 100 : 0;
                const isOpen     = activeMonth === month;

                return (
                  <div
                    key={month}
                    onClick={() => handleMonthClick(month)}
                    className="card"
                    style={{
                      padding: '18px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      border: isOpen
                        ? '2px solid var(--accent-coral)'
                        : '1px solid var(--border-light)',
                      boxShadow: isOpen ? '0 4px 18px rgba(255,109,77,0.18)' : 'none',
                      transform: isOpen ? 'translateY(-2px)' : 'none',
                      background: isOpen
                        ? 'linear-gradient(135deg, #FFF8F5 0%, #fff 100%)'
                        : '#FFFFFF',
                      borderRadius: 'var(--radius-md)',
                      userSelect: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                                  alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>
                        {month}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          background: `${convColor(conversion)}18`,
                          color: convColor(conversion),
                          fontWeight: '700', fontSize: '11px',
                          padding: '3px 8px', borderRadius: '12px',
                        }}>
                          {conversion.toFixed(0)}%
                        </span>
                        <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}
                           style={{ fontSize: '10px', color: 'var(--text-muted)', transition: 'transform 0.2s' }} />
                      </div>
                    </div>

                    {/* Barra de conversión */}
                    <div style={{ height: '4px', background: 'var(--border-light)',
                                  borderRadius: '2px', overflow: 'hidden', marginBottom: '10px' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(conversion, 100)}%`,
                        background: convColor(conversion),
                        transition: 'width 0.35s ease-out',
                      }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between',
                                  fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>Prospectos: <strong>{stats.prospectados}</strong></span>
                      <span>Cerrados: <strong style={{ color: '#047857' }}>{stats.cerrados}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ─── PANEL ACORDEÓN: se expande si activeMonth está en esta fila ─── */}
            {MESES.slice(rowIdx * 4, rowIdx * 4 + 4).includes(activeMonth) && activeMonth && (() => {
              const monthData = mesesAgg[activeMonth] || { prospectados: 0, contactados: 0, cotizados: 0, cerrados: 0, perdidos: 0 };

              return (
                <div
                  key={`panel-${activeMonth}`}
                  className="month-accordion-panel"
                  style={{
                    marginTop: '12px',
                    background: '#FFFFFF',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-md)',
                    borderTop: '4px solid var(--accent-coral)',
                    overflow: 'hidden',
                    animation: 'accordionSlideDown 0.3s ease-out',
                  }}
                >
                  <div style={{ padding: '24px' }}>

                    {/* Panel header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                                  alignItems: 'center', marginBottom: '20px',
                                  paddingBottom: '14px', borderBottom: '1px solid var(--border-light)' }}>
                      <div>
                        <h3 style={{ fontSize: '17px', fontWeight: '800',
                                     color: 'var(--text-primary)', margin: 0 }}>
                          <i className="fas fa-chart-bar" style={{ marginRight: '8px', color: 'var(--accent-coral)' }}></i>
                          Detalle — {activeMonth}
                        </h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                          {isAdmin
                            ? 'Rendimiento comparativo de todas las sucursales (ordenado de menor a mayor % cerrados)'
                            : `Rendimiento personal — Tienda ${storeName}`}
                        </p>
                      </div>
                      <button
                        className="topbar-btn btn-outline"
                        onClick={(e) => { e.stopPropagation(); setActiveMonth(null); }}
                        style={{ padding: '6px 12px', fontSize: '11px' }}
                      >
                        <i className="fas fa-times" style={{ marginRight: '4px' }}></i>
                        Cerrar
                      </button>
                    </div>

                    {/* ─── GRÁFICA DE BARRAS VERTICALES (semáforo) ─── */}
                    <div style={{ height: '220px', marginBottom: '24px', position: 'relative' }}>
                      <MonthBarChart data={monthData} chartId={activeMonth} />
                    </div>

                    {/* ─── TABLA ─── */}
                    <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
                      <table style={{
                        width: '100%', borderCollapse: 'collapse',
                        fontSize: '13px', fontFamily: 'Inter, sans-serif',
                      }}>
                        <thead>
                          <tr style={{ background: 'var(--bg-cream)' }}>
                            <th style={thStyle}>No.</th>
                            {isAdmin && <th style={thStyle}>TX.</th>}
                            <th style={{ ...thStyle, color: CHART_COLORS.prospectados }}>Prospectados</th>
                            <th style={{ ...thStyle, color: CHART_COLORS.contactados  }}>Contactados</th>
                            <th style={{ ...thStyle, color: CHART_COLORS.cotizados    }}>Cotizados</th>
                            <th style={{ ...thStyle, color: CHART_COLORS.cerrados     }}>Cerrados</th>
                            <th style={{ ...thStyle, color: CHART_COLORS.perdidos     }}>Perdidos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {isAdmin ? (
                            adminMonthDetails.length === 0 ? (
                              <tr>
                                <td colSpan={7} style={{ ...tdStyle, textAlign: 'center',
                                                         color: 'var(--text-muted)', padding: '20px' }}>
                                  No hay datos registrados para este mes.
                                </td>
                              </tr>
                            ) : (
                              adminMonthDetails.map((row) => (
                                <tr key={row.tienda} style={{ borderBottom: '1px solid var(--border-light)' }}
                                    className="table-row-hover">
                                  <td style={tdStyle}>{row.num}</td>
                                  <td style={{ ...tdStyle }}>
                                    <span style={{
                                      background: 'rgba(59,130,246,0.1)', color: '#2563EB',
                                      fontWeight: '700', padding: '3px 10px',
                                      borderRadius: '6px', fontSize: '12px',
                                    }}>{row.tienda}</span>
                                  </td>
                                  <td style={tdStyle}>{row.prospectados}</td>
                                  <td style={{ ...tdStyle, color: CHART_COLORS.contactados, fontWeight: '600' }}>{row.contactados}</td>
                                  <td style={{ ...tdStyle, color: CHART_COLORS.cotizados,   fontWeight: '600' }}>{row.cotizados}</td>
                                  <td style={{ ...tdStyle, color: CHART_COLORS.cerrados,    fontWeight: '700' }}>{row.cerrados}</td>
                                  <td style={{ ...tdStyle, color: CHART_COLORS.perdidos,    fontWeight: '600' }}>{row.perdidos}</td>
                                </tr>
                              ))
                            )
                          ) : (
                            storeMonthDetail ? (
                              <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                                <td style={tdStyle}>1</td>
                                <td style={tdStyle}>{storeMonthDetail.prospectados}</td>
                                <td style={{ ...tdStyle, color: CHART_COLORS.contactados, fontWeight: '600' }}>{storeMonthDetail.contactados}</td>
                                <td style={{ ...tdStyle, color: CHART_COLORS.cotizados,   fontWeight: '600' }}>{storeMonthDetail.cotizados}</td>
                                <td style={{ ...tdStyle, color: CHART_COLORS.cerrados,    fontWeight: '700' }}>{storeMonthDetail.cerrados}</td>
                                <td style={{ ...tdStyle, color: CHART_COLORS.perdidos,    fontWeight: '600' }}>{storeMonthDetail.perdidos}</td>
                              </tr>
                            ) : (
                              <tr>
                                <td colSpan={6} style={{ ...tdStyle, textAlign: 'center',
                                                         color: 'var(--text-muted)', padding: '20px' }}>
                                  No hay datos registrados para este mes.
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* ─── BOTÓN AGREGAR (SOLO TIENDAS) ─── */}
                    {!isAdmin && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          className="topbar-btn btn-primary"
                          onClick={(e) => { e.stopPropagation(); handleOpenAddModal(activeMonth); }}
                          style={{ padding: '10px 22px', fontSize: '13px', fontWeight: '700' }}
                        >
                          <i className="fas fa-plus" style={{ marginRight: '6px' }}></i>
                          Agregar Datos del Mes
                        </button>
                      </div>
                    )}

                  </div>{/* /padding */}
                </div>
              );
            })()}
          </div>
        ))}
      </div>{/* /columnas */}

      {/* ─── MODAL DE INGRESO (SOLO TIENDAS) ─── */}
      {isModalOpen && (
        <div className="modal-backdrop" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div className="card" style={{
            width: '100%', maxWidth: '440px', padding: '28px',
            animation: 'zoomIn 0.2s ease-out',
            borderRadius: 'var(--radius-lg)',
            background: '#FFFFFF',
            boxShadow: 'var(--shadow-xl)',
          }}>
            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          borderBottom: '1px solid var(--border-light)', paddingBottom: '12px',
                          marginBottom: '22px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>
                  <i className="fas fa-plus-circle" style={{ marginRight: '8px', color: 'var(--accent-coral)' }}></i>
                  Agregar Datos del Mes
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Mes: <strong>{modalMes}</strong> · Tienda: <strong>{storeName}</strong>
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer',
                         color: 'var(--text-muted)', lineHeight: 1 }}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'Total Prospectados', key: 'formProspectados', val: formProspectados, set: setFormProspectados, color: CHART_COLORS.prospectados },
                { label: 'Total Contactados',  key: 'formContactados',  val: formContactados,  set: setFormContactados,  color: CHART_COLORS.contactados  },
                { label: 'Total Cotizados',    key: 'formCotizados',    val: formCotizados,    set: setFormCotizados,    color: CHART_COLORS.cotizados    },
                { label: 'Total Cerrados',     key: 'formCerrados',     val: formCerrados,     set: setFormCerrados,     color: CHART_COLORS.cerrados     },
                { label: 'Total Perdidos',     key: 'formPerdidos',     val: formPerdidos,     set: setFormPerdidos,     color: CHART_COLORS.perdidos     },
              ].map(({ label, key, val, set, color }) => (
                <div key={key} className="form-group">
                  <label className="form-label" style={{ fontWeight: '600', fontSize: '12px', color }}>
                    {label}
                  </label>
                  <input
                    type="number" min="0" step="1" required
                    className="form-control"
                    value={val}
                    onChange={(e) => set(e.target.value)}
                    placeholder="Ej: 0"
                    style={{ width: '100%', padding: '10px 12px',
                             borderRadius: '8px', border: `1.5px solid ${color}44`,
                             outline: 'none', fontSize: '14px',
                             fontFamily: 'Inter, sans-serif' }}
                  />
                </div>
              ))}

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button type="button" className="topbar-btn btn-outline"
                        onClick={() => setIsModalOpen(false)}
                        style={{ flex: 1, justifyContent: 'center' }}>
                  Cancelar
                </button>
                <button type="submit" className="topbar-btn btn-primary"
                        style={{ flex: 1, justifyContent: 'center' }}>
                  <i className="fas fa-save" style={{ marginRight: '6px' }}></i>
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ESTILOS DE TABLA (objetos reutilizables) ───────────────────────────────────
const thStyle = {
  padding: '10px 14px',
  textAlign: 'left',
  fontWeight: '700',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  color: 'var(--text-secondary)',
  borderBottom: '2px solid var(--border-light)',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '10px 14px',
  fontSize: '13px',
  color: 'var(--text-primary)',
};
