/* global google */
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef, useMemo } from 'react';
import Chart from 'chart.js/auto';

// Simple Donut Chart for Stage Distribution
function EtapasDonutChart({ datos }) {
  const canvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const hasData = datos && datos.length > 0;

  useEffect(() => {
    if (!canvasRef.current || !hasData) return;

    // Calculate distribution
    const conteos = {
      'No contactado': 0,
      'Contactado': 0,
      'Cotizado': 0,
      'Cerrado': 0,
      'Perdido': 0
    };

    datos.forEach(item => {
      const etapa = item.Etapa || 'No contactado';
      if (conteos[etapa] !== undefined) {
        conteos[etapa]++;
      }
    });

    const labels = Object.keys(conteos);
    const values = Object.values(conteos);
    const colors = ['#94A3B8', '#3B82F6', '#8B5CF6', '#10B981', '#EF4444'];

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    chartInstanceRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#FFFFFF'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 10,
              font: { family: 'Inter', size: 10, weight: '500' },
              color: '#64748B'
            }
          }
        },
        cutout: '65%'
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [datos, hasData]);

  if (!hasData) {
    return (
      <div style={{
        height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', color: 'var(--text-muted)', gap: '10px', minHeight: '180px'
      }}>
        <i className="fas fa-chart-pie fa-2x"></i>
        <span style={{ fontSize: '13px' }}>No hay datos suficientes para graficar la distribución</span>
      </div>
    );
  }

  return <canvas ref={canvasRef} style={{ maxWidth: '240px', maxHeight: '240px' }} />;
}

const MOCK_8020_DB = [
  { id: 2, Orden: "1001", Cliente: "Constructora Nacional", Total: 50000.00, Etapa: "Cerrado", Tienda: "CB" },
  { id: 3, Orden: "1002", Cliente: "Corporación Multi-Inversiones", Total: 35000.00, Etapa: "Cotizado", Tienda: "CB" },
  { id: 4, Orden: "1003", Cliente: "Ingenio Pantaleón", Total: 15000.00, Etapa: "Contactado", Tienda: "CB" },
  { id: 5, Orden: "1004", Cliente: "Restaurantes Campero", Total: 8000.00, Etapa: "No contactado", Tienda: "CB" },
  { id: 6, Orden: "1005", Cliente: "Tienda La Barata", Total: 5000.00, Etapa: "Perdido", Tienda: "CB" },
  { id: 7, Orden: "1006", Cliente: "Hoteles Camino Real", Total: 42000.00, Etapa: "Cerrado", Tienda: "JT" },
  { id: 8, Orden: "1007", Cliente: "Distribuidora El Sol", Total: 28000.00, Etapa: "Cotizado", Tienda: "JT" },
  { id: 9, Orden: "1008", Cliente: "Manufacturas Modas", Total: 12000.00, Etapa: "Contactado", Tienda: "JT" }
];

export default function Analisis8020View({ showToast }) {
  const [db8020, setDb8020] = useState([]);
  const [userRol, setUserRol] = useState('Vendedor'); // Administrador | Vendedor
  const [userTienda, setUserTienda] = useState('');
  const isAdmin = String(userRol).trim().toLowerCase() === 'administrador';

  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [filterTienda, setFilterTienda] = useState('all');

  // Simulator States for local testing
  const [mockUserRol, setMockUserRol] = useState('Administrador');
  const [mockUserTienda, setMockUserTienda] = useState('Todos');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wasValidated, setWasValidated] = useState(false);
  const [formId, setFormId] = useState('');
  const [formOrden, setFormOrden] = useState('');
  const [formCliente, setFormCliente] = useState('');
  const [formTotal, setFormTotal] = useState('');
  const [formEtapa, setFormEtapa] = useState('');

  const isGas = typeof google !== 'undefined' && google.script && google.script.run;

  // ─── CARGAR DATOS ──────────────────────────────────────
  const loadData = (silent = false) => {
    if (!silent) setIsLoading(true);

    if (isGas) {
      google.script.run
        .withSuccessHandler((response) => {
          setUserRol(response.rol);
          setUserTienda(response.tienda);
          setDb8020(response.datos || []);
          setIsLoading(false);
          setIsSyncing(false);
        })
        .withFailureHandler((err) => {
          showToast("Error al cargar datos 80/20: " + err.message, "error");
          setIsLoading(false);
          setIsSyncing(false);
        })
        .obtenerDatos8020();
    } else {
      // Local dev emulation
      setTimeout(() => {
        if (!localStorage.getItem('MOCK_8020_DB')) {
          localStorage.setItem('MOCK_8020_DB', JSON.stringify(MOCK_8020_DB));
        }
        const db = JSON.parse(localStorage.getItem('MOCK_8020_DB') || '[]');

        // Simulate server-side filtering
        const filtrado = mockUserRol === 'Administrador'
          ? db
          : db.filter(item => item.Tienda === mockUserTienda);

        setDb8020(filtrado);
        setUserRol(mockUserRol);
        setUserTienda(mockUserTienda);
        setIsLoading(false);
        setIsSyncing(false);
      }, 500);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mockUserRol, mockUserTienda]);

  const handleSyncManual = () => {
    setIsSyncing(true);
    showToast("Sincronizando datos...", "info");
    loadData(true);
  };

  // ─── LÓGICA DE CÁLCULO DE PARETO (MATEMÁTICA REAL) ────────────────
  const procesadosPareto = useMemo(() => {
    // Filtrar localmente por tienda si el admin selecciona una tienda específica
    let datosFiltrados = [...db8020];
    if (isAdmin && filterTienda !== 'all') {
      datosFiltrados = datosFiltrados.filter(item => (item.Tienda || '').toUpperCase() === filterTienda.toUpperCase());
    }

    if (datosFiltrados.length === 0) return [];

    // 1. Sumar el 'Total' global para obtener el 100%
    const montoGlobal = datosFiltrados.reduce((sum, item) => sum + (parseFloat(item.Total) || 0), 0);

    // 2. Ordenar registros de Mayor a Menor según su 'Total'
    const ordenados = [...datosFiltrados].sort((a, b) => (parseFloat(b.Total) || 0) - (parseFloat(a.Total) || 0));

    // 3. Recorrer de forma acumulativa para determinar clasificación
    let sumaAcumulada = 0;
    return ordenados.map((item) => {
      const total = parseFloat(item.Total) || 0;
      sumaAcumulada += total;

      let clasificacion = "Resto 20%";
      if (montoGlobal > 0 && sumaAcumulada <= montoGlobal * 0.8) {
        clasificacion = "Top 80%";
      } else if (montoGlobal > 0 && (sumaAcumulada - total) < montoGlobal * 0.8) {
        // Caso borde: Incluir al cliente que cruza el umbral del 80%
        clasificacion = "Top 80%";
      }

      return {
        ...item,
        Clasificacion: clasificacion
      };
    });
  }, [db8020, filterTienda, isAdmin]);

  // KPIs calculados
  const kpis = useMemo(() => {
    const totalMonto = procesadosPareto.reduce((sum, item) => sum + (parseFloat(item.Total) || 0), 0);
    const countTop = procesadosPareto.filter(item => item.Clasificacion === 'Top 80%').length;
    const countResto = procesadosPareto.filter(item => item.Clasificacion === 'Resto 20%').length;
    return { totalMonto, countTop, countResto };
  }, [procesadosPareto]);

  // ─── ACCIONES DE MODAL ──────────────────────────────────
  const handleOpenModal = (item = null) => {
    setWasValidated(false);
    if (item) {
      setFormId(item.id);
      setFormOrden(item.Orden || '');
      setFormCliente(item.Cliente || '');
      setFormTotal(item.Total || '');
      setFormEtapa(item.Etapa || 'No contactado');
    } else {
      setFormId('');
      setFormOrden('');
      setFormCliente('');
      setFormTotal('');
      setFormEtapa('');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // ─── GUARDAR / EDITAR REGISTRO ──────────────────────────
  const handleSave = (e) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (!form.checkValidity()) {
      setWasValidated(true);
      showToast("Por favor complete los campos obligatorios.", "error");
      return;
    }

    const datos = {
      orden: formOrden.trim(),
      cliente: formCliente.trim(),
      total: parseFloat(formTotal) || 0,
      etapa: formEtapa
    };

    setIsLoading(true);
    setIsModalOpen(false);

    if (formId) {
      // MODO EDICIÓN
      if (isGas) {
        google.script.run
          .withSuccessHandler((response) => {
            if (response.status === 'success') {
              showToast("Guardado exitoso.", "success");
              setDb8020(response.response.datos || []);
            } else {
              showToast("Error al guardar: " + response.message, "error");
            }
            setIsLoading(false);
          })
          .withFailureHandler((err) => {
            showToast("Error al guardar: " + err.message, "error");
            setIsLoading(false);
          })
          .editarRegistro8020(formId, datos);
      } else {
        // Local emulation
        setTimeout(() => {
          let db = JSON.parse(localStorage.getItem('MOCK_8020_DB') || '[]');
          db = db.map(d => {
            if (d.id == formId) {
              const originalTienda = d.Tienda || 'CB';
              return {
                ...d,
                Orden: datos.orden,
                Cliente: datos.cliente,
                Total: datos.total,
                Etapa: datos.etapa,
                Tienda: originalTienda
              };
            }
            return d;
          });
          localStorage.setItem('MOCK_8020_DB', JSON.stringify(db));
          const filtrado = mockUserRol === 'Administrador'
            ? db
            : db.filter(item => item.Tienda === mockUserTienda);
          setDb8020(filtrado);
          showToast("Guardado exitoso.", "success");
          setIsLoading(false);
        }, 500);
      }
    } else {
      // MODO AGREGAR (Sólo vendedor)
      if (isAdmin) {
        showToast("Error: El Administrador no puede agregar registros directos.", "error");
        setIsLoading(false);
        return;
      }

      if (isGas) {
        google.script.run
          .withSuccessHandler((response) => {
            if (response.status === 'success') {
              showToast("Guardado exitoso.", "success");
              setDb8020(response.response.datos || []);
            } else {
              showToast("Error al guardar: " + response.message, "error");
            }
            setIsLoading(false);
          })
          .withFailureHandler((err) => {
            showToast("Error al guardar: " + err.message, "error");
            setIsLoading(false);
          })
          .guardarRegistro8020(datos);
      } else {
        // Local emulation
        setTimeout(() => {
          const db = JSON.parse(localStorage.getItem('MOCK_8020_DB') || '[]');
          const newId = db.length > 0 ? Math.max(...db.map(d => d.id)) + 1 : 2;

          const record = {
            id: newId,
            Orden: datos.orden,
            Cliente: datos.cliente,
            Total: datos.total,
            Etapa: datos.etapa,
            Tienda: mockUserTienda
          };
          db.push(record);
          localStorage.setItem('MOCK_8020_DB', JSON.stringify(db));
          const filtrado = db.filter(item => item.Tienda === mockUserTienda);
          setDb8020(filtrado);
          showToast("Guardado exitoso.", "success");
          setIsLoading(false);
        }, 500);
      }
    }
  };

  // ─── UTILITIES ────────────────────────────────────────────
  const formatMoneda = (monto) => {
    const valor = parseFloat(monto);
    if (isNaN(valor)) return 'Q0.00';
    return 'Q' + valor.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getStageBadgeClass = (etapa) => {
    const stageLower = (etapa || '').toLowerCase().replace(' ', '-');
    switch (stageLower) {
      case 'no-contactado': return 'badge-no-contactado';
      case 'contactado': return 'badge-contactado';
      case 'cotizado': return 'badge-cotizado';
      case 'cerrado': return 'badge-cerrado';
      case 'perdido': return 'badge-perdido';
      default: return 'badge-no-contactado';
    }
  };

  // Simulator role selection handler
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
          <p className="section-label">Ventas — Análisis 80/20</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="topbar-btn btn-outline" onClick={handleSyncManual} disabled={isLoading}>
            <i className={`fas fa-sync-alt ${isSyncing ? 'fa-spin' : ''}`}></i> Actualizar vista
          </button>
          
          {/* BOTÓN AGREGAR: Oculto para Administrador, visible para vendedores */}
          {!isAdmin && (
            <button className="topbar-btn btn-primary" onClick={() => handleOpenModal()}>
              <i className="fas fa-plus"></i> + Agregar
            </button>
          )}
        </div>
      </div>

      {/* KPI CARDS GRID */}
      <div className="kpis-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div className="card kpi-card" style={{ borderTop: '4px solid var(--accent-coral)' }}>
          <div className="kpi-title">Monto Global Acumulado</div>
          <div className="kpi-value">{formatMoneda(kpis.totalMonto)}</div>
        </div>
        <div className="card kpi-card" style={{ borderTop: '4px solid var(--accent-green)' }}>
          <div className="kpi-title">Clientes Top 80%</div>
          <div className="kpi-value">{kpis.countTop}</div>
        </div>
        <div className="card kpi-card" style={{ borderTop: '4px solid var(--accent-blue)' }}>
          <div className="kpi-title">Clientes Resto 20%</div>
          <div className="kpi-value">{kpis.countResto}</div>
        </div>
      </div>

      <div className="chart-table-container" style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '20px'
      }}>
        {/* DONUT CHART CARD */}
        <div className="card" style={{ padding: '20px' }}>
          <div className="table-card-header" style={{ padding: '0 0 14px', borderBottom: 'none' }}>
            <div className="card-title">
              <span className="card-title-dot" style={{ background: 'var(--accent-purple)' }}></span>
              Distribución por Etapas de Oportunidades
            </div>
          </div>
          <div style={{ height: '240px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            <EtapasDonutChart datos={procesadosPareto} />
          </div>
        </div>

        {/* TABLE CARD */}
        <div className="card table-card" style={{ position: 'relative' }}>
          
          {/* Spinner Loader Overlay */}
          <div className={`loader-overlay ${isLoading ? 'active' : ''}`} style={{
            position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
            opacity: isLoading ? 1 : 0, pointerEvents: isLoading ? 'all' : 'none', transition: 'opacity 0.2s'
          }}>
            <div className="spinner"></div>
          </div>

          <div className="table-card-header">
            <div className="card-title">
              <i className="fas fa-percentage" style={{ color: 'var(--accent-coral)' }}></i>
              Clasificación de Clientes 80/20 (Pareto)
              <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '8px' }}>
                · {isAdmin ? 'Perfil Administrador (Vista Consolidada)' : `Perfil Tienda: ${userTienda}`}
              </span>
            </div>
            
            {/* El filtro de tiendas es visible únicamente para el Administrador */}
            {isAdmin && (
              <div className="table-controls">
                <select
                  className="select-filter"
                  value={filterTienda}
                  onChange={(e) => setFilterTienda(e.target.value)}
                >
                  <option value="all">Filtrar por Tienda (Todas)</option>
                  <option value="CB">Tienda CB</option>
                  <option value="CHM">Tienda CHM</option>
                  <option value="CHQ">Tienda CHQ</option>
                  <option value="ESC">Tienda ESC</option>
                  <option value="HH">Tienda HH</option>
                  <option value="JT">Tienda JT</option>
                  <option value="MZ">Tienda MZ</option>
                  <option value="PT">Tienda PT</option>
                  <option value="PTB">Tienda PTB</option>
                  <option value="SJ">Tienda SJ</option>
                  <option value="SMA">Tienda SMA</option>
                  <option value="VN">Tienda VN</option>
                  <option value="XL">Tienda XL</option>
                  <option value="Z3">Tienda Z3</option>
                </select>
              </div>
            )}
          </div>

          <div className="table-responsive">
            <table className="deals-table" role="grid" aria-label="Tabla de Análisis 80/20">
              <thead>
                {isAdmin ? (
                  <tr>
                    <th scope="col">No.</th>
                    <th scope="col">Tienda/Sucursal</th>
                    <th scope="col">Orden de venta</th>
                    <th scope="col">Cliente</th>
                    <th scope="col">Total</th>
                    <th scope="col">Clasificación</th>
                    <th scope="col">Etapa</th>
                  </tr>
                ) : (
                  <tr>
                    <th scope="col">No.</th>
                    <th scope="col">Orden de venta</th>
                    <th scope="col">Cliente</th>
                    <th scope="col">Total</th>
                    <th scope="col">Clasificación</th>
                    <th scope="col">Etapa</th>
                    <th scope="col">Acciones</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {procesadosPareto.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 7} className="empty-state">
                      <i className="fas fa-search"></i>
                      <br />
                      No se encontraron registros
                    </td>
                  </tr>
                ) : (
                  procesadosPareto.map((item, index) => (
                    <tr key={item.id} className="deal-row">
                      <td className="num-cell">{String(index + 1).padStart(2, '0')}</td>
                      
                      {isAdmin && (
                        <td style={{ fontWeight: '700', color: 'var(--accent-blue)' }}>
                          <span className="stage-badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' }}>
                            {item.Tienda || '—'}
                          </span>
                        </td>
                      )}

                      <td className="order-cell">{item.Orden || '—'}</td>
                      <td className="client-cell">{item.Cliente || '—'}</td>
                      <td className="amount-cell">{formatMoneda(item.Total)}</td>
                      <td>
                        <span className={`paretoclass-badge ${item.Clasificacion === 'Top 80%' ? 'pareto-top' : 'pareto-resto'}`}>
                          {item.Clasificacion}
                        </span>
                      </td>
                      <td>
                        <span className={`stage-badge ${getStageBadgeClass(item.Etapa)}`}>
                          {item.Etapa || 'No contactado'}
                        </span>
                      </td>

                      {!isAdmin && (
                        <td className="actions-cell">
                          <button
                            className="action-btn edit-btn"
                            title="Editar"
                            onClick={() => handleOpenModal(item)}
                          >
                            <i className="fas fa-pencil-alt"></i>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── MODAL DIALOG ────────────────────────────────────── */}
      {isModalOpen && (
        <div
          className={`modal-overlay ${isModalOpen ? 'active' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={(e) => {
            if (e.target.className.includes('modal-overlay')) handleCloseModal();
          }}
        >
          <div className="modal-box">
            <div className="modal-head">
              <h3 id="modal-title">{formId ? 'Editar Registro 80/20' : 'Nuevo Registro 80/20'}</h3>
              <button className="modal-close" aria-label="Cerrar modal" onClick={handleCloseModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSave} className={wasValidated ? 'was-validated' : ''} noValidate>
              <div className="modal-body">
                
                <div className="form-group">
                  <label className="form-label" htmlFor="field-orden">
                    Orden de Venta
                  </label>
                  <input
                    type="number"
                    id="field-orden"
                    className="form-control"
                    placeholder="Ej: 1025"
                    step="1"
                    value={formOrden}
                    onChange={(e) => setFormOrden(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="field-cliente">
                    Cliente
                  </label>
                  <input
                    type="text"
                    id="field-cliente"
                    className="form-control"
                    placeholder="Ej: Distribuidora El Sol"
                    value={formCliente}
                    onChange={(e) => setFormCliente(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="field-total">
                    Total (Q)
                  </label>
                  <input
                    type="number"
                    id="field-total"
                    className="form-control"
                    placeholder="Ej: 45000.00"
                    min="0"
                    step="0.01"
                    value={formTotal}
                    onChange={(e) => setFormTotal(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="field-etapa">
                    Etapa
                  </label>
                  <select
                    id="field-etapa"
                    className="form-control"
                    value={formEtapa}
                    onChange={(e) => setFormEtapa(e.target.value)}
                    required
                  >
                    <option value="" disabled>Seleccione una etapa</option>
                    <option value="No contactado">No contactado</option>
                    <option value="Contactado">Contactado</option>
                    <option value="Cotizado">Cotizado</option>
                    <option value="Cerrado">Cerrado</option>
                    <option value="Perdido">Perdido</option>
                  </select>
                </div>

              </div>

              <div className="modal-foot">
                <button type="button" class="topbar-btn btn-outline" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" class="topbar-btn btn-primary">
                  <i class="fas fa-save"></i> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
