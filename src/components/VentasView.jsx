
import { useState, useMemo, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';

if (ChartDataLabels) {
  Chart.register(ChartDataLabels);
}

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const TIENDAS = ['CB', 'CHM', 'CHQ', 'ESC', 'HH', 'JT', 'MZ', 'PT', 'PTB', 'SJ', 'SMA', 'VN', 'XL', 'Z3'];

const CHART_COLORS = {
  prospectados: '#94A3B8', // Gris
  contactados: '#60A5FA',  // Azul
  cotizados: '#FBBF24',    // Amarillo
  cerrados: '#34D399',     // Verde
  perdidos: '#F87171'      // Rojo
};

const tdStyle = { padding: '12px 16px', borderBottom: '1px solid var(--border-light)', fontSize: '13px' };
const thStyle = { padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' };

function EtapasChart({ datos }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (chartInstanceRef.current) chartInstanceRef.current.destroy();

    const dataArr = [datos.prospectados, datos.contactados, datos.cotizados, datos.cerrados, datos.perdidos];
    const labels = ['Prospectados', 'Contactados', 'Cotizados', 'Cerrados', 'Perdidos'];
    const bgColors = [CHART_COLORS.prospectados, CHART_COLORS.contactados, CHART_COLORS.cotizados, CHART_COLORS.cerrados, CHART_COLORS.perdidos];

    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: dataArr,
          backgroundColor: bgColors,
          borderRadius: 6,
          barPercentage: 0.7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1E293B',
            padding: 12,
            titleFont: { size: 13, family: "'Inter', sans-serif" },
            bodyFont: { size: 14, weight: 'bold', family: "'Inter', sans-serif" },
            callbacks: {
              label: (ctx) => ` ${ctx.raw} Clientes`
            }
          },
          datalabels: {
            color: '#fff',
            font: { weight: 'bold', size: 14, family: "'Inter', sans-serif" },
            anchor: 'center',
            align: 'center',
            formatter: (val) => val > 0 ? val : ''
          }
        },
        scales: {
          y: { 
            beginAtZero: true, 
            grid: { color: '#F1F5F9', drawBorder: false },
            ticks: { font: { family: "'Inter', sans-serif", size: 11 }, color: '#64748B' }
          },
          x: { 
            grid: { display: false },
            ticks: { font: { family: "'Inter', sans-serif", size: 12, weight: '600' }, color: '#475569' }
          }
        }
      }
    });

    return () => {
      if (chartInstanceRef.current) chartInstanceRef.current.destroy();
    };
  }, [datos]);

  return <canvas ref={canvasRef}></canvas>;
}

export default function VentasView({ subView, deals = [], manualData = [], isAdmin = false, selectedStores = [], showToast, onSaveManualData }) {
  const [activeMonth, setActiveMonth] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMes, setModalMes] = useState('');
  const [formProspectados, setFormProspectados] = useState('');
  const [formContactados, setFormContactados] = useState('');
  const [formCotizados, setFormCotizados] = useState('');
  const [formCerrados, setFormCerrados] = useState('');
  const [formPerdidos, setFormPerdidos] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTable, setShowTable] = useState(false);

  // storeName for the modal save payload
  const storeName = isAdmin ? 'Todos' : (selectedStores[0] || 'CB');

  useEffect(() => {
    setActiveMonth(null);
    setShowTable(false);
  }, [subView]);

  const allowedStores = isAdmin ? TIENDAS : selectedStores;

  const handleOpenAddModal = (mes) => {
    setModalMes(mes);
    setFormProspectados('');
    setFormContactados('');
    setFormCotizados('');
    setFormCerrados('');
    setFormPerdidos('');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
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

    if (onSaveManualData) {
      const success = await onSaveManualData(payload);
      if (success) {
        setIsModalOpen(false);
      }
    } else {
      showToast('Error: Función de guardado no conectada.', 'error');
    }
    setIsLoading(false);
  }  // Agrupación por Mes y Tienda (leyendo de manualData)
  const mesesAgg = useMemo(() => {
    const agg = {};
    MESES.forEach(m => {
      agg[m] = { 
        total: { prospectados: 0, contactados: 0, cotizados: 0, cerrados: 0, perdidos: 0 },
        tiendas: {} 
      };
      TIENDAS.forEach(t => {
        agg[m].tiendas[t] = { prospectados: 0, contactados: 0, cotizados: 0, cerrados: 0, perdidos: 0 };
      });
    });

    if (manualData && manualData.length > 0) {
      manualData.forEach(d => {
        const mName = d.Mes;
        const t = d.Tienda;
        
        // Filtrar por acceso a tiendas
        if (!isAdmin && !allowedStores.includes(String(t || '').trim().toUpperCase())) return;
        
        if (agg[mName] && agg[mName].tiendas[t]) {
          const prosp = parseInt(d.Prospectados) || 0;
          const cont  = parseInt(d.Contactados) || 0;
          const cotiz = parseInt(d.Cotizados) || 0;
          const cerr  = parseInt(d.Cerrados) || 0;
          const perd  = parseInt(d.Perdidos) || 0;

          agg[mName].total.prospectados += prosp;
          agg[mName].tiendas[t].prospectados += prosp;

          agg[mName].total.contactados += cont;
          agg[mName].tiendas[t].contactados += cont;

          agg[mName].total.cotizados += cotiz;
          agg[mName].tiendas[t].cotizados += cotiz;

          agg[mName].total.cerrados += cerr;
          agg[mName].tiendas[t].cerrados += cerr;

          agg[mName].total.perdidos += perd;
          agg[mName].tiendas[t].perdidos += perd;
        }
      });
    }
    return agg;
  }, [manualData, isAdmin, allowedStores]);

  // Agrupación global (suma de todos los meses)
  const totalGlobal = useMemo(() => {
    const counts = { prospectados: 0, contactados: 0, cotizados: 0, cerrados: 0, perdidos: 0 };
    Object.values(mesesAgg).forEach(m => {
      counts.prospectados += m.total.prospectados;
      counts.contactados += m.total.contactados;
      counts.cotizados += m.total.cotizados;
      counts.cerrados += m.total.cerrados;
      counts.perdidos += m.total.perdidos;
    });
    return counts;
  }, [mesesAgg]);

  const tasaGlobal = totalGlobal.prospectados > 0 
    ? ((totalGlobal.cerrados / totalGlobal.prospectados) * 100).toFixed(1) 
    : '0.0';

  const convColor = (val) => {
    if (val >= 60) return '#059669'; 
    if (val >= 30) return '#D97706'; 
    return '#DC2626'; 
  };

  const handleMonthClick = (m) => {
    if (activeMonth === m) {
      setActiveMonth(null);
      setShowTable(false);
    } else {
      setActiveMonth(m);
      setShowTable(true);
    }
  };

  const isProyecto = subView === 'proyecto';
  const title = isProyecto ? 'Proyectos Especiales y Corporativos' : 'Desempeño Operativo de Carreras';
  const subtitle = isProyecto ? 'Gestión Institucional e industrial de grandes cuentas' : 'Venta presencial y gestión con organizadores de eventos';

  return (
    <div className="view-section active animate-fade-in" id="ventas-view">
      
      {/* ─── BANNER ACUMULADO GLOBAL ─── */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #FFF8F5 0%, #FFFFFF 100%)',
        borderLeft: '5px solid var(--accent-coral)',
        padding: '24px',
        marginBottom: '28px',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>{subtitle}</p>
          </div>
          <div style={{ background: 'rgba(255,109,77,0.1)', color: 'var(--accent-coral)', padding: '12px 20px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Efectividad General</div>
            <div style={{ fontSize: '28px', fontWeight: '800' }}>{tasaGlobal}%</div>
          </div>
        </div>

        {/* KPIs mini */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { label: 'Prospectados', val: totalGlobal.prospectados, color: CHART_COLORS.prospectados },
            { label: 'Contactados',  val: totalGlobal.contactados,  color: CHART_COLORS.contactados  },
            { label: 'Cotizados',    val: totalGlobal.cotizados,    color: CHART_COLORS.cotizados    },
            { label: 'Cerrados',     val: totalGlobal.cerrados,     color: CHART_COLORS.cerrados     },
            { label: 'Perdidos',     val: totalGlobal.perdidos,     color: CHART_COLORS.perdidos     },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ padding: '8px 4px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>{label}</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color, marginTop: '4px' }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Gráfica Principal Sumatoria */}
        <div style={{ height: '300px', position: 'relative' }}>
          <EtapasChart datos={totalGlobal} />
        </div>
      </div>

      {/* ─── CUADRÍCULA POR MESES ─── */}
      <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '14px' }}>
        <i className="far fa-calendar-alt" style={{ marginRight: '8px', color: 'var(--accent-coral)' }}></i>
        Rendimiento por Mes — Haz clic para expandir
      </h4>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          {[0, 1, 2].map((rowIdx) => {
            const chunk = MESES.slice(rowIdx * 4, rowIdx * 4 + 4);
            const isRowActive = chunk.includes(activeMonth) && activeMonth;
            
            return (
              <div key={rowIdx} style={{ marginBottom: isRowActive ? '0' : '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
                  {chunk.map((m) => {
            const stats = mesesAgg[m].total;
            const conversion = stats.prospectados > 0 ? (stats.cerrados / stats.prospectados) * 100 : 0;
            const isOpen = activeMonth === m;

            return (
              <div
                key={m}
                onClick={() => handleMonthClick(m)}
                className="card"
                style={{
                  padding: '18px', cursor: 'pointer', transition: 'all 0.2s',
                  border: isOpen ? '2px solid var(--accent-coral)' : '1px solid var(--border-light)',
                  boxShadow: isOpen ? '0 4px 18px rgba(255,109,77,0.18)' : 'none',
                  transform: isOpen ? 'translateY(-2px)' : 'none',
                  background: isOpen ? 'linear-gradient(135deg, #FFF8F5 0%, #fff 100%)' : '#FFFFFF',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>{m}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ background: `${convColor(conversion)}18`, color: convColor(conversion), fontWeight: '700', fontSize: '11px', padding: '3px 8px', borderRadius: '12px' }}>
                      {Number(conversion || 0).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div style={{ height: '4px', background: 'var(--border-light)', borderRadius: '2px', overflow: 'hidden', marginBottom: '10px' }}>
                  <div style={{ height: '100%', width: `${Math.min(conversion, 100)}%`, background: convColor(conversion), transition: 'width 0.35s' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>Prosp.: <strong>{stats.prospectados}</strong></span>
                  <span>Cerrados: <strong style={{ color: '#047857' }}>{stats.cerrados}</strong></span>
                </div>
              </div>
            );
          })}
        </div>

                {/* ─── PANEL ACORDEÓN: se expande si activeMonth está en esta fila ─── */}
                {isRowActive && (
                  <div className="card" style={{ marginTop: '12px', marginBottom: '14px', animation: 'fadeInDown 0.3s ease-out', borderTop: '4px solid var(--accent-coral)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800' }}>
                  <i className="fas fa-chart-line" style={{ color: 'var(--accent-coral)', marginRight: '6px' }}></i> 
                  Detalle — {activeMonth}
                </h4>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Rendimiento comparativo de todas las sucursales en este mes</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveMonth(null); }}
                style={{
                  background: 'none', border: '1px solid var(--border-light)', padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                  color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                <i className="fas fa-times"></i> Cerrar
              </button>
            </div>

            {/* Gráfica del mes seleccionado */}
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ height: '260px' }}>
                <EtapasChart datos={mesesAgg[activeMonth].total} />
              </div>
            </div>

            {/* Tabla de Tiendas */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-body)' }}>
                    <th style={thStyle}>No.</th>
                    <th style={thStyle}>TX.</th>
                    <th style={{ ...thStyle, color: CHART_COLORS.prospectados }}>Prospectados</th>
                    <th style={{ ...thStyle, color: CHART_COLORS.prospectados }}>%</th>
                    <th style={{ ...thStyle, color: CHART_COLORS.contactados  }}>Contactados</th>
                    <th style={{ ...thStyle, color: CHART_COLORS.contactados  }}>%</th>
                    <th style={{ ...thStyle, color: CHART_COLORS.cotizados    }}>Cotizados</th>
                    <th style={{ ...thStyle, color: CHART_COLORS.cotizados    }}>%</th>
                    <th style={{ ...thStyle, color: CHART_COLORS.cerrados     }}>Cerrados</th>
                    <th style={{ ...thStyle, color: CHART_COLORS.cerrados     }}>%</th>
                    <th style={{ ...thStyle, color: CHART_COLORS.perdidos     }}>Perdidos</th>
                    <th style={{ ...thStyle, color: CHART_COLORS.perdidos     }}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const rowData = [];
                    const dTiendas = mesesAgg[activeMonth].tiendas;
                    TIENDAS.forEach(t => {
                      if (!isAdmin && !selectedStores.includes(t)) return;
                      const stats = dTiendas[t];
                      // Calculate conversions for sorting
                      const convCerrados = stats.cotizados > 0 ? (stats.cerrados / stats.cotizados) * 100 : 0;
                      rowData.push({ tienda: t, stats, convCerrados });
                    });

                    // Order by cerrados % ascending to match image layout
                    rowData.sort((a, b) => a.convCerrados - b.convCerrados);

                    return rowData.map((row, idx) => {
                      const st = row.stats;
                      return (
                        <tr key={row.tienda} style={{ transition: 'background 0.2s', borderBottom: '1px solid var(--border-light)' }}>
                          <td style={tdStyle}>{idx + 1}</td>
                          <td style={{ ...tdStyle, fontWeight: '700', color: 'var(--accent-coral)' }}>{row.tienda}</td>
                          <td style={tdStyle}>{st.prospectados}</td>
                          <td style={{ ...tdStyle, color: CHART_COLORS.prospectados }}>100%</td>
                          <td style={{ ...tdStyle, color: CHART_COLORS.contactados, fontWeight: '600' }}>{st.contactados}</td>
                          <td style={{ ...tdStyle, color: CHART_COLORS.contactados }}>{st.prospectados > 0 ? Math.round((st.contactados/st.prospectados)*100) : 0}%</td>
                          <td style={{ ...tdStyle, color: CHART_COLORS.cotizados, fontWeight: '600' }}>{st.cotizados}</td>
                          <td style={{ ...tdStyle, color: CHART_COLORS.cotizados }}>{st.contactados > 0 ? Math.round((st.cotizados/st.contactados)*100) : 0}%</td>
                          <td style={{ ...tdStyle, color: CHART_COLORS.cerrados, fontWeight: '700' }}>{st.cerrados}</td>
                          <td style={{ ...tdStyle, color: CHART_COLORS.cerrados }}>{st.cotizados > 0 ? Math.round((st.cerrados/st.cotizados)*100) : 0}%</td>
                          <td style={{ ...tdStyle, color: CHART_COLORS.perdidos, fontWeight: '600' }}>{st.perdidos}</td>
                          <td style={{ ...tdStyle, color: CHART_COLORS.perdidos }}>{st.contactados > 0 ? Math.round((st.perdidos/st.contactados)*100) : 0}%</td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>

            {/* ─── BOTÓN AGREGAR (SOLO TIENDAS) ─── */}
            {!isAdmin && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 24px 24px 0' }}>
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
          </div>
        )}
              </div>
            );
          })}
        </div>
      
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          borderBottom: '1px solid var(--border-light)', paddingBottom: '12px',
                          marginBottom: '22px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>
                  <i className="fas fa-plus-circle" style={{ marginRight: '8px', color: 'var(--accent-coral)' }}></i>
                  Agregar Datos del Mes
                </h3>
                <div style={{ margin: '8px 0 0 0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                    Mes: <strong style={{ color: 'var(--text-primary)' }}>{modalMes}</strong>
                  </p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer',
                         color: 'var(--text-muted)', lineHeight: 1 }}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'Total de Prospectados', key: 'formProspectados', val: formProspectados, set: setFormProspectados, color: CHART_COLORS.prospectados },
                { label: 'Contactados',  key: 'formContactados',  val: formContactados,  set: setFormContactados,  color: CHART_COLORS.contactados  },
                { label: 'Cotizados',    key: 'formCotizados',    val: formCotizados,    set: setFormCotizados,    color: CHART_COLORS.cotizados    },
                { label: 'Cerrados',     key: 'formCerrados',     val: formCerrados,     set: setFormCerrados,     color: CHART_COLORS.cerrados     },
                { label: 'Perdidos',     key: 'formPerdidos',     val: formPerdidos,     set: setFormPerdidos,     color: CHART_COLORS.perdidos     },
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
    </div>
  );
}
