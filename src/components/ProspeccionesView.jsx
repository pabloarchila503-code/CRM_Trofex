import React, { useState, useEffect, useRef, useMemo } from 'react';
import Chart from 'chart.js/auto';

// Custom Datalabels Plugin for Funnel Chart
const customDatalabelsFunnelPlugin = {
  id: 'customDatalabelsFunnel',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    ctx.save();
    
    chart.data.datasets.forEach((dataset, i) => {
      const meta = chart.getDatasetMeta(i);
      meta.data.forEach((element, index) => {
        const raw = dataset.data[index];
        let val = 0;
        let percentageText = '';
        
        if (Array.isArray(raw)) {
          val = Math.round(raw[1] - raw[0]);
          const firstRaw = dataset.data[0];
          const total = firstRaw[1] - firstRaw[0];
          const pct = total > 0 ? Math.round((val / total) * 100) : 0;
          percentageText = ` (${pct}%)`;
        } else {
          val = raw;
        }
        
        const labelText = `${val}${percentageText}`;
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.shadowBlur = 3;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        
        const labelX = (element.x + element.base) / 2;
        const labelY = element.y;
        
        if (element.x - element.base > 45 && val > 0) {
          ctx.fillText(labelText, labelX, labelY);
        } else if (val > 0) {
          ctx.fillStyle = '#1E293B';
          ctx.textAlign = 'left';
          ctx.shadowBlur = 0;
          ctx.fillText(labelText, element.x + 6, labelY);
        }
      });
    });
    ctx.restore();
  }
};

function FunnelMiniChart({ data }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const total = data.total || 0;
    const cotizaciones = data.cotizado || 0;
    const seguimiento = data.seguimiento || 0;
    const cerrados = data.cerrado || 0;

    if (total === 0) return;

    const labels = ['1. Prospectados', '2. Contactados', '3. Cotizados', '4. Cerrados'];
    const values = [total, seguimiento, cotizaciones, cerrados];
    const colors = ['#94A3B8', '#3B82F6', '#F59E0B', '#10B981'];

    const dataValues = values.map(val => {
      if (total === 0) return [0, 0];
      const start = (total - val) / 2;
      const end = start + val;
      return [start, end];
    });

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: dataValues,
          backgroundColor: colors.map(c => c + 'CC'),
          borderColor: colors,
          borderWidth: 1.5,
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (items) => labels[items[0].dataIndex],
              label: (item) => ` Conteo: ${values[item.dataIndex]}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { display: false }
          },
          y: {
            grid: { display: false },
            ticks: {
              color: '#64748B',
              font: { family: 'Inter', size: 10, weight: '600' }
            }
          }
        }
      },
      plugins: [customDatalabelsFunnelPlugin]
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [data]);

  const total = data.total || 0;
  if (total === 0) {
    return (
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', color: 'var(--text-muted)', gap: '10px', minHeight: '180px'
      }}>
        <i className="fas fa-chart-bar fa-2x"></i>
        <span style={{ fontSize: '13px' }}>No hay datos suficientes para graficar el embudo</span>
      </div>
    );
  }

  return <canvas ref={canvasRef} />;
}

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const TIENDAS = ['CB', 'CHM', 'CHQ', 'ESC', 'HH', 'JT', 'MZ', 'PT', 'PTB', 'SJ', 'SMA', 'VN', 'XL', 'Z3'];

const generarMockProspecciones = () => {
  const db = [];
  let num = 1;
  TIENDAS.forEach((store, sIdx) => {
    MESES.forEach((month, mIdx) => {
      const seed = (sIdx * 12 + mIdx) * 31;
      const prospectados = 20 + (seed % 30);
      const contactados = Math.floor(prospectados * 0.75);
      const cotizados = Math.floor(contactados * 0.6);
      const cerrados = Math.floor(cotizados * 0.5) + 1;
      const perdidos = Math.floor((prospectados - cerrados) * 0.25);
      
      db.push({
        id: num,
        Numeración: num++,
        Mes: month,
        Tienda: store,
        Prospectados: prospectados,
        Contactados: contactados,
        Cotizados: cotizados,
        Cerrados: cerrados,
        Perdidos: perdidos
      });
    });
  });
  return db;
};

export default function ProspeccionesView({ showToast, userRole, activeStore }) {
  const [prospecciones, setProspecciones] = useState([]);
  const [userRol, setUserRol] = useState('Vendedor'); // Rol del backend ('Administrador' o 'Vendedor')
  const [userTienda, setUserTienda] = useState(''); // Tienda asignada
  const isAdmin = String(userRol).trim().toLowerCase() === 'administrador';
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeMonth, setActiveMonth] = useState(null); // Mes activo seleccionado

  // Mapear props de la sesión si están disponibles
  const initialMockRol = userRole === 'admin' ? 'Administrador' : 'Vendedor';
  const initialMockTienda = userRole === 'admin' ? 'Todos' : (activeStore || 'CB');

  // Estados locales para simulación / pruebas locales
  const [mockUserRol, setMockUserRol] = useState(initialMockRol);
  const [mockUserTienda, setMockUserTienda] = useState(initialMockTienda);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMes, setFormMes] = useState('');
  const [formProspectados, setFormProspectados] = useState('');
  const [formContactados, setFormContactados] = useState('');
  const [formCotizados, setFormCotizados] = useState('');
  const [formCerrados, setFormCerrados] = useState('');
  const [formPerdidos, setFormPerdidos] = useState('');

  // Sincronizar estados locales de prueba cuando cambian las props de sesión principal
  useEffect(() => {
    if (userRole) {
      const mappedRol = userRole === 'admin' ? 'Administrador' : 'Vendedor';
      const mappedTienda = userRole === 'admin' ? 'Todos' : (activeStore || 'CB');
      setMockUserRol(mappedRol);
      setMockUserTienda(mappedTienda);
    }
  }, [userRole, activeStore]);

  const isGas = typeof google !== 'undefined' && google.script && google.script.run;

  // ─── CARGAR DATOS ──────────────────────────────────────
  const loadData = (silent = false) => {
    if (!silent) setIsLoading(true);
    
    if (isGas) {
      google.script.run
        .withSuccessHandler((response) => {
          setUserRol(response.rol);
          setUserTienda(response.tienda);
          setProspecciones(response.data || []);
          setIsLoading(false);
          setIsSyncing(false);
        })
        .withFailureHandler((err) => {
          showToast("Error al cargar prospecciones: " + err.message, "error");
          setIsLoading(false);
          setIsSyncing(false);
        })
        .obtenerProspecciones();
    } else {
      // Emulador de desarrollo local
      setTimeout(() => {
        if (!localStorage.getItem('MOCK_PROSPECCIONES_DB')) {
          localStorage.setItem('MOCK_PROSPECCIONES_DB', JSON.stringify(generarMockProspecciones()));
        }
        const db = JSON.parse(localStorage.getItem('MOCK_PROSPECCIONES_DB') || '[]');
        
        // Simular filtrado por tienda en el emulador
        const filtrado = mockUserRol === 'Administrador'
          ? db
          : db.filter(item => item.Tienda === mockUserTienda);
          
        setProspecciones(filtrado);
        setUserRol(mockUserRol);
        setUserTienda(mockUserTienda);
        setIsLoading(false);
        setIsSyncing(false);
      }, 500);
    }
  };

  useEffect(() => {
    loadData();
  }, [mockUserRol, mockUserTienda]);

  const handleSyncManual = () => {
    setIsSyncing(true);
    showToast("Sincronizando con la base de datos...", "info");
    loadData(true);
  };

  // ─── CALCULO DE TOTAL ANUAL ──────────────────────────────
  const totalAnual = useMemo(() => {
    return prospecciones.reduce((acc, curr) => {
      return {
        prospectados: acc.prospectados + (parseInt(curr.Prospectados) || 0),
        contactados: acc.contactados + (parseInt(curr.Contactados) || 0),
        cotizados: acc.cotizados + (parseInt(curr.Cotizados) || 0),
        cerrados: acc.cerrados + (parseInt(curr.Cerrados) || 0),
        perdidos: acc.perdidos + (parseInt(curr.Perdidos) || 0)
      };
    }, { prospectados: 0, contactados: 0, cotizados: 0, cerrados: 0, perdidos: 0 });
  }, [prospecciones]);

  const tasaConversionAnual = useMemo(() => {
    if (totalAnual.prospectados === 0) return 0;
    return ((totalAnual.cerrados / totalAnual.prospectados) * 100).toFixed(1);
  }, [totalAnual]);

  // Calcular agregados de meses para la cuadrícula 4x3
  const mesesAgg = useMemo(() => {
    const res = {};
    MESES.forEach(m => {
      res[m] = { prospectados: 0, contactados: 0, cotizados: 0, cerrados: 0, perdidos: 0 };
    });
    
    prospecciones.forEach(p => {
      const m = p.Mes;
      if (res[m]) {
        res[m].prospectados += (parseInt(p.Prospectados) || 0);
        res[m].contactados += (parseInt(p.Contactados) || 0);
        res[m].cotizados += (parseInt(p.Cotizados) || 0);
        res[m].cerrados += (parseInt(p.Cerrados) || 0);
        res[m].perdidos += (parseInt(p.Perdidos) || 0);
      }
    });

    return res;
  }, [prospecciones]);

  // Lista detallada de sucursales para el Administrador en el mes activo
  const adminMonthDetails = useMemo(() => {
    if (!activeMonth || !isAdmin) return [];
    
    // Filtrar registros por el mes seleccionado
    const records = prospecciones.filter(p => p.Mes.toLowerCase() === activeMonth.toLowerCase());
    
    const mapped = records.map(r => {
      const prospectados = parseInt(r.Prospectados) || 0;
      const cerrados = parseInt(r.Cerrados) || 0;
      const conversion = prospectados > 0 ? (cerrados / prospectados) * 100 : 0;
      return {
        tienda: r.Tienda,
        prospectados,
        contactados: parseInt(r.Contactados) || 0,
        cotizados: parseInt(r.Cotizados) || 0,
        cerrados,
        perdidos: parseInt(r.Perdidos) || 0,
        conversion
      };
    });

    // Ordenar de menor a mayor tasa de conversión (Cerrados / Prospectados)
    return mapped.sort((a, b) => a.conversion - b.conversion);
  }, [activeMonth, prospecciones, isAdmin]);

  // Datos del mes activo para la sucursal
  const storeMonthDetails = useMemo(() => {
    if (!activeMonth || isAdmin) return null;
    
    const record = prospecciones.find(p => p.Mes.toLowerCase() === activeMonth.toLowerCase());
    if (!record) return null;

    const prospectados = parseInt(record.Prospectados) || 0;
    const contactados = parseInt(record.Contactados) || 0;
    const cotizados = parseInt(record.Cotizados) || 0;
    const cerrados = parseInt(record.Cerrados) || 0;
    const perdidos = parseInt(record.Perdidos) || 0;
    const conversion = prospectados > 0 ? (cerrados / prospectados) * 100 : 0;

    return {
      prospectados,
      contactados,
      cotizados,
      cerrados,
      perdidos,
      conversion
    };
  }, [activeMonth, prospecciones, isAdmin]);

  // Manejar apertura del modal de edición
  const handleOpenEditModal = () => {
    if (isAdmin || !activeMonth) return;
    const details = storeMonthDetails;
    if (!details) return;

    setFormMes(activeMonth);
    setFormProspectados(details.prospectados);
    setFormContactados(details.contactados);
    setFormCotizados(details.cotizados);
    setFormCerrados(details.cerrados);
    setFormPerdidos(details.perdidos);
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    
    const prospectadosVal = parseInt(formProspectados);
    const contactadosVal = parseInt(formContactados);
    const cotizadosVal = parseInt(formCotizados);
    const cerradosVal = parseInt(formCerrados);
    const perdidosVal = parseInt(formPerdidos);

    if (isNaN(prospectadosVal) || isNaN(contactadosVal) || isNaN(cotizadosVal) || isNaN(cerradosVal) || isNaN(perdidosVal)) {
      showToast("Por favor ingresa únicamente valores numéricos enteros.", "error");
      return;
    }
    
    if (prospectadosVal < 0 || contactadosVal < 0 || cotizadosVal < 0 || cerradosVal < 0 || perdidosVal < 0) {
      showToast("Los valores numéricos no pueden ser negativos.", "error");
      return;
    }

    const payload = {
      mes: formMes,
      tienda: mockUserTienda,
      prospectados: prospectadosVal,
      contactados: contactadosVal,
      cotizados: cotizadosVal,
      cerrados: cerradosVal,
      perdidos: perdidosVal
    };

    setIsLoading(true);
    setIsModalOpen(false);

    if (isGas) {
      google.script.run
        .withSuccessHandler((response) => {
          if (response.status === 'success') {
            showToast("Valores mensuales actualizados exitosamente.", "success");
            setUserRol(response.response.rol);
            setUserTienda(response.response.tienda);
            setProspecciones(response.response.data || []);
          } else {
            showToast("Error al guardar: " + response.message, "error");
          }
          setIsLoading(false);
        })
        .withFailureHandler((err) => {
          showToast("Error al guardar: " + err.message, "error");
          setIsLoading(false);
        })
        .guardarValoresMensuales(payload);
    } else {
      // Emulador local
      setTimeout(() => {
        let db = JSON.parse(localStorage.getItem('MOCK_PROSPECCIONES_DB') || '[]');
        
        let found = false;
        db = db.map(item => {
          if (item.Mes.toLowerCase() === payload.mes.toLowerCase() && item.Tienda.toLowerCase() === payload.tienda.toLowerCase()) {
            found = true;
            return {
              ...item,
              Prospectados: payload.prospectados,
              Contactados: payload.contactados,
              Cotizados: payload.cotizados,
              Cerrados: payload.cerrados,
              Perdidos: payload.perdidos
            };
          }
          return item;
        });

        if (!found) {
          const nextId = db.length > 0 ? Math.max(...db.map(d => d.id)) + 1 : 1;
          db.push({
            id: nextId,
            Numeración: nextId,
            Mes: payload.mes,
            Tienda: payload.tienda,
            Prospectados: payload.prospectados,
            Contactados: payload.contactados,
            Cotizados: payload.cotizados,
            Cerrados: payload.cerrados,
            Perdidos: payload.perdidos
          });
        }

        localStorage.setItem('MOCK_PROSPECCIONES_DB', JSON.stringify(db));

        const filtrado = mockUserRol === 'Administrador'
          ? db
          : db.filter(item => item.Tienda === mockUserTienda);

        setProspecciones(filtrado);
        showToast("Valores mensuales actualizados exitosamente.", "success");
        setIsLoading(false);
      }, 500);
    }
  };

  const getConversionColor = (percentage) => {
    if (percentage >= 50) return '#10B981'; // Verde
    if (percentage >= 25) return '#F59E0B'; // Naranja/Ambar
    return '#EF4444'; // Rojo
  };

  const handleMockRoleChange = (val) => {
    if (val === 'Administrador') {
      setMockUserRol('Administrador');
      setMockUserTienda('Todos');
    } else if (val === 'Vendedor_CB') {
      setMockUserRol('Vendedor');
      setMockUserTienda('CB');
    } else if (val === 'Vendedor_JT') {
      setMockUserRol('Vendedor');
      setMockUserTienda('JT');
    }
    setActiveMonth(null);
  };

  return (
    <div style={{ position: 'relative' }}>
      
      {/* SIMULATOR BAR (only visible in local preview) */}
      {!isGas && (
        <div className="simulator-bar" style={{
          background: '#FFFBEB',
          borderBottom: '1px solid #FDE68A',
          padding: '8px 28px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '12px',
          color: '#78350F',
          fontWeight: '500',
          marginBottom: '20px',
          borderRadius: 'var(--radius-md)'
        }}>
          <i className="fas fa-tools"></i>
          <span><strong>Entorno local (Simulador de Roles):</strong></span>
          <select 
            className="select-filter" 
            value={mockUserRol === 'Administrador' ? 'Administrador' : `Vendedor_${mockUserTienda}`}
            onChange={(e) => handleMockRoleChange(e.target.value)} 
            style={{ background: '#fff', borderColor: '#FCD34D' }}
          >
            <option value="Administrador">Perfil: Administrador</option>
            <option value="Vendedor_CB">Perfil: Asesor CB (Tienda CB)</option>
            <option value="Vendedor_JT">Perfil: Asesor JT (Tienda JT)</option>
          </select>
        </div>
      )}

      {/* HEADER DE LA SECCIÓN */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <p className="section-label">Ventas — Control de Prospecciones Mensuales</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="topbar-btn btn-outline" onClick={handleSyncManual} disabled={isLoading}>
            <i className={`fas fa-sync-alt ${isSyncing ? 'fa-spin' : ''}`}></i> Actualizar vista
          </button>
        </div>
      </div>

      {/* ─── BANNER DE TOTAL ANUAL ─── */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #FFF8F5 0%, #FFFFFF 100%)',
        borderLeft: '5px solid var(--accent-coral)',
        padding: '24px',
        marginBottom: '24px',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
              Resumen Acumulado Anual
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Consolidado general del año para {isAdmin ? 'todas las sucursales' : `tienda ${userTienda}`}
            </p>
          </div>
          <div style={{ 
            background: 'rgba(255, 109, 77, 0.1)', 
            color: 'var(--accent-coral)', 
            padding: '12px 20px', 
            borderRadius: 'var(--radius-md)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tasa de Conversión Anual</div>
            <div style={{ fontSize: '28px', fontWeight: '800' }}>{tasaConversionAnual}%</div>
          </div>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '16px',
          marginTop: '20px'
        }} className="kpis-annual-grid">
          <div style={{ padding: '8px 4px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Prospectados</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#475569', marginTop: '4px' }}>{totalAnual.prospectados}</div>
          </div>
          <div style={{ padding: '8px 4px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Contactados</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#2563EB', marginTop: '4px' }}>{totalAnual.contactados}</div>
          </div>
          <div style={{ padding: '8px 4px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Cotizados</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#B45309', marginTop: '4px' }}>{totalAnual.cotizados}</div>
          </div>
          <div style={{ padding: '8px 4px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Cerrados</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#047857', marginTop: '4px' }}>{totalAnual.cerrados}</div>
          </div>
          <div style={{ padding: '8px 4px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>Perdidos</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#B91C1C', marginTop: '4px' }}>{totalAnual.perdidos}</div>
          </div>
        </div>
      </div>

      {/* Loader Spinner Overlay */}
      {isLoading && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
          borderRadius: 'var(--radius-lg)'
        }}>
          <div style={{
            width: '40px', height: '40px', border: '4px solid var(--border-light)',
            borderTopColor: 'var(--accent-coral)', borderRadius: '50%', animation: 'spin 0.8s linear infinite'
          }}></div>
        </div>
      )}

      {/* ─── CUADRÍCULA DE MESES (4x3) ─── */}
      <div className="months-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '20px'
      }}>
        {MESES.map((month) => {
          const stats = mesesAgg[month] || { prospectados: 0, contactados: 0, cotizados: 0, cerrados: 0, perdidos: 0 };
          const conversion = stats.prospectados > 0 ? (stats.cerrados / stats.prospectados) * 100 : 0;
          const isSelected = activeMonth === month;
          
          return (
            <div 
              key={month}
              onClick={() => setActiveMonth(isSelected ? null : month)}
              className="card"
              style={{
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                border: isSelected ? '2px solid var(--accent-coral)' : '1px solid var(--border-light)',
                boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                transform: isSelected ? 'scale(1.02)' : 'none',
                background: '#FFFFFF',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>{month}</span>
                <span className="stage-badge" style={{ 
                  background: `${getConversionColor(conversion)}15`, 
                  color: getConversionColor(conversion),
                  fontWeight: '700',
                  fontSize: '11px',
                  padding: '3px 8px',
                  borderRadius: '12px'
                }}>
                  {conversion.toFixed(0)}% conv
                </span>
              </div>
              
              <div style={{ height: '4px', background: 'var(--border-light)', borderRadius: '2px', overflow: 'hidden', marginBottom: '12px' }}>
                <div style={{ 
                  height: '100%', 
                  width: `${Math.min(conversion, 100)}%`, 
                  background: getConversionColor(conversion),
                  transition: 'width 0.3s ease-out'
                }}></div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>Prospectos: <strong>{stats.prospectados}</strong></span>
                <span>Cerrados: <strong style={{ color: '#047857' }}>{stats.cerrados}</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── DETALLE DEL MES ACTIVO ─── */}
      {activeMonth && (
        <div className="card active-month-details" style={{
          padding: '24px',
          marginTop: '24px',
          animation: 'fadeInUp 0.3s ease-out',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          background: '#FFFFFF',
          borderTop: '4px solid var(--accent-coral)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '14px', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                Detalles del Mes — {activeMonth}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                {isAdmin ? 'Análisis comparativo de sucursales' : `Análisis mensual para Asesor ${userTienda}`}
              </p>
            </div>
            <button 
              className="topbar-btn btn-outline" 
              onClick={() => setActiveMonth(null)}
              style={{ padding: '6px 12px', fontSize: '11px' }}
            >
              Cerrar detalles
            </button>
          </div>

          {/* VISTA ADMINISTRADOR: LISTA COMPARATIVA ORDENADA */}
          {isAdmin && (
            <div>
              <div style={{ marginBottom: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                💡 <em>Las sucursales se muestran ordenadas ascendentemente (del rendimiento más bajo al más alto) basándose en su tasa de conversión mensual.</em>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {adminMonthDetails.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No hay datos registrados para este mes.
                  </div>
                ) : (
                  adminMonthDetails.map((storeData, idx) => (
                    <div 
                      key={storeData.tienda}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 18px',
                        background: 'var(--bg-cream)',
                        borderRadius: 'var(--radius-md)',
                        borderLeft: `4px solid ${getConversionColor(storeData.conversion)}`
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', width: '30px' }}>
                          #{idx + 1}
                        </span>
                        <span className="stage-badge" style={{ 
                          background: 'rgba(59, 130, 246, 0.1)', 
                          color: '#2563eb',
                          fontWeight: '800',
                          padding: '4px 10px',
                          borderRadius: '6px'
                        }}>
                          Tienda {storeData.tienda}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Prospectados: <strong>{storeData.prospectados}</strong> | Cerrados: <strong>{storeData.cerrados}</strong>
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '100px', background: 'rgba(0,0,0,0.05)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ 
                            height: '100%', 
                            width: `${Math.min(storeData.conversion, 100)}%`, 
                            background: getConversionColor(storeData.conversion) 
                          }}></div>
                        </div>
                        <span style={{ 
                          fontSize: '13px', 
                          fontWeight: '800', 
                          color: getConversionColor(storeData.conversion),
                          minWidth: '50px',
                          textAlign: 'right'
                        }}>
                          {storeData.conversion.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* VISTA TIENDA: DETALLE DE RENDIMIENTO PROPIO, GRÁFICO DE CONO Y BOTÓN ACTUALIZAR */}
          {!isAdmin && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1.8fr',
              gap: '24px'
            }} className="store-month-details-layout">
              {/* Desglose Métricas */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '14px', color: 'var(--text-primary)' }}>
                  Rendimiento y Métricas
                </h4>
                
                {storeMonthDetails ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid rgba(0,0,0,0.04)', paddingBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Prospectados Totales:</span>
                      <span style={{ fontWeight: '700' }}>{storeMonthDetails.prospectados}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid rgba(0,0,0,0.04)', paddingBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Contactados:</span>
                      <span style={{ fontWeight: '700', color: '#2563EB' }}>{storeMonthDetails.contactados}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid rgba(0,0,0,0.04)', paddingBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Cotizados:</span>
                      <span style={{ fontWeight: '700', color: '#B45309' }}>{storeMonthDetails.cotizados}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid rgba(0,0,0,0.04)', paddingBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Cerrados (Ventas):</span>
                      <span style={{ fontWeight: '700', color: '#047857' }}>{storeMonthDetails.cerrados}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid rgba(0,0,0,0.04)', paddingBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Perdidos:</span>
                      <span style={{ fontWeight: '700', color: '#B91C1C' }}>{storeMonthDetails.perdidos}</span>
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      fontSize: '14px', 
                      marginTop: '8px', 
                      padding: '10px',
                      background: 'var(--bg-cream)',
                      borderRadius: '6px'
                    }}>
                      <span style={{ fontWeight: '700' }}>Porcentaje de Conversión:</span>
                      <span style={{ fontWeight: '800', color: getConversionColor(storeMonthDetails.conversion) }}>
                        {storeMonthDetails.conversion.toFixed(1)}%
                      </span>
                    </div>

                    <button 
                      className="topbar-btn btn-primary" 
                      onClick={handleOpenEditModal}
                      style={{ marginTop: '14px', width: '100%', justifyContent: 'center' }}
                    >
                      <i className="fas fa-edit"></i> Actualizar Totales del Mes
                    </button>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)' }}>No hay datos registrados para este mes.</div>
                )}
              </div>

              {/* Gráfica de Embudo */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '14px', color: 'var(--text-primary)' }}>
                  Gráfica del Embudo Conversión ({activeMonth})
                </h4>
                <div style={{ height: '200px', position: 'relative' }}>
                  {storeMonthDetails ? (
                    <FunnelMiniChart data={{
                      total: storeMonthDetails.prospectados,
                      cotizado: storeMonthDetails.cotizados,
                      seguimiento: storeMonthDetails.contactados,
                      cerrado: storeMonthDetails.cerrados
                    }} />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No hay datos suficientes para graficar</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL DE INGRESO (SOLO PARA TIENDAS) ─── */}
      {isModalOpen && (
        <div className="modal-backdrop" style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div className="card" style={{
            width: '100%', maxWidth: '420px', padding: '24px',
            animation: 'zoomIn 0.2s ease-out', borderRadius: 'var(--radius-lg)', background: '#FFFFFF'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>
                Actualizar Datos — {formMes}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: '600', fontSize: '12px' }}>Total Prospectados</label>
                <input 
                  type="number" 
                  className="form-control" 
                  min="0"
                  step="1"
                  required
                  value={formProspectados}
                  onChange={(e) => setFormProspectados(e.target.value)}
                  placeholder="Ej: 50"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: '600', fontSize: '12px' }}>Total Contactados</label>
                <input 
                  type="number" 
                  className="form-control" 
                  min="0"
                  step="1"
                  required
                  value={formContactados}
                  onChange={(e) => setFormContactados(e.target.value)}
                  placeholder="Ej: 40"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: '600', fontSize: '12px' }}>Total Cotizados</label>
                <input 
                  type="number" 
                  className="form-control" 
                  min="0"
                  step="1"
                  required
                  value={formCotizados}
                  onChange={(e) => setFormCotizados(e.target.value)}
                  placeholder="Ej: 30"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: '600', fontSize: '12px' }}>Total Cerrados (Ventas)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  min="0"
                  step="1"
                  required
                  value={formCerrados}
                  onChange={(e) => setFormCerrados(e.target.value)}
                  placeholder="Ej: 15"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: '600', fontSize: '12px' }}>Total Perdidos</label>
                <input 
                  type="number" 
                  className="form-control" 
                  min="0"
                  step="1"
                  required
                  value={formPerdidos}
                  onChange={(e) => setFormPerdidos(e.target.value)}
                  placeholder="Ej: 5"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="topbar-btn btn-outline" onClick={() => setIsModalOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>
                  Cancelar
                </button>
                <button type="submit" className="topbar-btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
