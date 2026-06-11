import React, { useState, useEffect, useRef } from 'react';
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

    const labels = ['1. Prospecciones', '2. Cotizaciones', '3. Seguimiento', '4. Cerrados'];
    const values = [total, cotizaciones, seguimiento, cerrados];
    const colors = ['#94A3B8', '#F59E0B', '#FF6D4D', '#10B981'];

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


const MOCK_PROSPECCIONES = [
  { id: 2, Numeración: 1, Empresa: "Distribuidora El Sol", Cliente: "Carlos Gómez", Teléfono: "+502 5555-1234", Email: "carlos@elsol.com.gt", Etapa: "Cotizado", Monto: 12500.00, Fecha: "2026-06-08", Tienda: "CB" },
  { id: 3, Numeración: 2, Empresa: "Constructora Alfa", Cliente: "Ana Martínez", Teléfono: "+502 4444-5678", Email: "amartinez@alfa.com.gt", Etapa: "Cerrado", Monto: 45000.00, Fecha: "2026-06-09", Tienda: "CHQ" },
  { id: 4, Numeración: 3, Empresa: "Tecnología Avanzada", Cliente: "Luis Rodríguez", Teléfono: "+502 3333-9012", Email: "lrodriguez@tec.com.gt", Etapa: "Prospectado", Monto: 8000.00, Fecha: "2026-06-07", Tienda: "JT" },
  { id: 5, Numeración: 4, Empresa: "Supermercados La Torre", Cliente: "Marta Estrada", Teléfono: "+502 2222-3456", Email: "mestrada@latorre.com.gt", Etapa: "Contactado", Monto: 15000.00, Fecha: "2026-06-08", Tienda: "CB" },
  { id: 6, Numeración: 5, Empresa: "Restaurante Portal", Cliente: "Juan Pérez", Teléfono: "+502 7777-7890", Email: "jperez@portal.com.gt", Etapa: "Perdido", Monto: 5000.00, Fecha: "2026-06-05", Tienda: "PTB" }
];

const TIENDAS = ['CB', 'CHM', 'CHQ', 'ESC', 'HH', 'JT', 'MZ', 'PT', 'PTB', 'SJ', 'SMA', 'VN', 'XL', 'Z3'];

export default function ProspeccionesView({ showToast }) {
  const [prospecciones, setProspecciones] = useState([]);
  const [userRol, setUserRol] = useState('Vendedor'); // Rol retornado por el servidor ('Administrador' o 'Vendedor') - Iniciado como Vendedor por defecto
  const [userTienda, setUserTienda] = useState(''); // Tienda del usuario
  const isAdmin = String(userRol).trim().toLowerCase() === 'administrador';
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState('all');
  const [filterTienda, setFilterTienda] = useState('all'); // Filtro exclusivo de Administrador

  // Estados locales para simulación / pruebas locales
  const [mockUserRol, setMockUserRol] = useState('Administrador');
  const [mockUserTienda, setMockUserTienda] = useState('Todos');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wasValidated, setWasValidated] = useState(false);
  const [formId, setFormId] = useState('');
  const [formEmpresa, setFormEmpresa] = useState('');
  const [formCliente, setFormCliente] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formEtapa, setFormEtapa] = useState('');
  const [formMonto, setFormMonto] = useState('');
  const [formFecha, setFormFecha] = useState('');

  const isGas = typeof google !== 'undefined' && google.script && google.script.run;

  // ─── CARGAR DATOS ──────────────────────────────────────
  const loadData = (silent = false) => {
    if (!silent) setIsLoading(true);
    
    if (isGas) {
      google.script.run
        .withSuccessHandler((response) => {
          // El backend seguro retorna: { rol, tienda, data }
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
          localStorage.setItem('MOCK_PROSPECCIONES_DB', JSON.stringify(MOCK_PROSPECCIONES));
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

  // ─── ACCIONES DE MODAL ──────────────────────────────────
  const handleOpenModal = (item = null) => {
    setWasValidated(false);
    if (item) {
      // MODO EDICIÓN
      setFormId(item.id);
      setFormEmpresa(item.Empresa || '');
      setFormCliente(item.Cliente || '');
      setFormTelefono(item.Teléfono || '');
      setFormEmail(item.Email || '');
      setFormEtapa(item.Etapa || 'Prospectado');
      setFormMonto(item.Monto || '');
      setFormFecha(item.Fecha ? item.Fecha.slice(0, 10) : new Date().toISOString().slice(0, 10));
    } else {
      // MODO NUEVO
      setFormId('');
      setFormEmpresa('');
      setFormCliente('');
      setFormTelefono('');
      setFormEmail('');
      setFormEtapa('');
      setFormMonto('');
      setFormFecha(new Date().toISOString().slice(0, 10));
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // ─── GUARDAR (AGREGAR O EDITAR) ──────────────────────────
  const handleSave = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    if (!form.checkValidity()) {
      setWasValidated(true);
      showToast("Por favor complete los campos obligatorios con formatos válidos.", "error");
      return;
    }

    const datos = {
      empresa: formEmpresa.trim(),
      cliente: formCliente.trim(),
      telefono: formTelefono.trim(),
      email: formEmail.trim(),
      etapa: formEtapa,
      monto: parseFloat(formMonto) || 0,
      fecha: formFecha
    };

    setIsLoading(true);
    setIsModalOpen(false);

    if (formId) {
      // GUARDAR EDICIÓN (Vendedor o Admin)
      if (isGas) {
        google.script.run
          .withSuccessHandler((response) => {
            if (response.status === 'success') {
              showToast("Guardado exitoso.", "success");
              // La respuesta contiene el obtenerProspecciones() seguro actualizado
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
          .editarProspeccion(formId, datos);
      } else {
        // Emulador local
        setTimeout(() => {
          let db = JSON.parse(localStorage.getItem('MOCK_PROSPECCIONES_DB') || '[]');
          
          db = db.map(d => {
            if (d.id == formId) {
              // El Admin edita pero preserva la tienda original del registro
              const originalTienda = d.Tienda || 'CB';
              return {
                ...d,
                Empresa: datos.empresa,
                Cliente: datos.cliente,
                Teléfono: datos.telefono,
                Email: datos.email,
                Etapa: datos.etapa,
                Monto: datos.monto,
                Fecha: datos.fecha,
                Tienda: originalTienda // Conservar tienda original
              };
            }
            return d;
          });
          
          localStorage.setItem('MOCK_PROSPECCIONES_DB', JSON.stringify(db));
          
          // Re-cargar aplicando filtros de rol
          const filtrado = mockUserRol === 'Administrador'
            ? db
            : db.filter(item => item.Tienda === mockUserTienda);
            
          setProspecciones(filtrado);
          showToast("Guardado exitoso.", "success");
          setIsLoading(false);
        }, 500);
      }
    } else {
      // AGREGAR NUEVA PROSPECCIÓN (Solo vendedores)
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
          .agregarProspeccion(datos);
      } else {
        // Emulador local
        setTimeout(() => {
          const db = JSON.parse(localStorage.getItem('MOCK_PROSPECCIONES_DB') || '[]');
          const newId = db.length > 0 ? Math.max(...db.map(d => d.id)) + 1 : 2;
          const newNum = db.length > 0 ? Math.max(...db.map(d => d.Numeración)) + 1 : 1;
          
          const record = {
            id: newId,
            Numeración: newNum,
            Empresa: datos.empresa,
            Cliente: datos.cliente,
            Teléfono: datos.telefono,
            Email: datos.email,
            Etapa: datos.etapa,
            Monto: datos.monto,
            Fecha: datos.fecha,
            Tienda: mockUserTienda // Sucursal activa del vendedor
          };
          
          db.push(record);
          localStorage.setItem('MOCK_PROSPECCIONES_DB', JSON.stringify(db));
          
          const filtrado = db.filter(item => item.Tienda === mockUserTienda);
          setProspecciones(filtrado);
          showToast("Guardado exitoso.", "success");
          setIsLoading(false);
        }, 500);
      }
    }
  };

  // ─── ELIMINAR (Solo Administrador) ──────────────────────────
  const handleDelete = (item) => {
    // Validación preventiva en cliente
    if (!isAdmin) {
      showToast("Error: No tienes permisos para eliminar registros.", "error");
      return;
    }

    const label = `"${item.Empresa}" (${item.Cliente})`;
    if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente la prospección para ${label}?`)) {
      setIsLoading(true);
      
      if (isGas) {
        google.script.run
          .withSuccessHandler((response) => {
            if (response.status === 'success') {
              showToast("Eliminado correctamente.", "success");
              setUserRol(response.response.rol);
              setUserTienda(response.response.tienda);
              setProspecciones(response.response.data || []);
            } else {
              showToast("Error al eliminar: " + response.message, "error");
            }
            setIsLoading(false);
          })
          .withFailureHandler((err) => {
            showToast("Error al eliminar: " + err.message, "error");
            setIsLoading(false);
          })
          .eliminarProspeccion(item.id);
      } else {
        // Emulador local
        setTimeout(() => {
          let db = JSON.parse(localStorage.getItem('MOCK_PROSPECCIONES_DB') || '[]');
          db = db.filter(d => d.id != item.id);
          db.forEach((d, idx) => { d.Numeración = idx + 1; });
          localStorage.setItem('MOCK_PROSPECCIONES_DB', JSON.stringify(db));
          
          setProspecciones(db);
          showToast("Eliminado correctamente.", "success");
          setIsLoading(false);
        }, 500);
      }
    }
  };

  // ─── FILTRADO & BUSQUEDA EN CLIENTE ───────────────────────
  const filteredProspecciones = (() => {
    let list = [...prospecciones];

    // Solo el Admin puede aplicar filtro por tienda/sucursal
    if (isAdmin && filterTienda !== 'all') {
      list = list.filter(item => (item.Tienda || '').toUpperCase() === filterTienda.toUpperCase());
    }

    if (filterStage !== 'all') {
      list = list.filter(item => (item.Etapa || '').toLowerCase() === filterStage);
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => 
        (item.Empresa || '').toLowerCase().includes(q) ||
        (item.Cliente || '').toLowerCase().includes(q) ||
        (item.Email || '').toLowerCase().includes(q)
      );
    }

    return list;
  })();

  // ─── UTILITIES ────────────────────────────────────────────
  const formatMoneda = (monto) => {
    const valor = parseFloat(monto);
    if (isNaN(valor)) return 'Q0.00';
    return 'Q' + valor.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return '—';
    try {
      const partes = fechaStr.split('-');
      if (partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0].slice(-2)}`;
      }
      const d = new Date(fechaStr);
      if (isNaN(d.getTime())) return fechaStr;
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
    } catch(e) {
      return fechaStr;
    }
  };

  const getStageBadgeColorStyle = (etapa) => {
    const stageLower = (etapa || '').toLowerCase();
    switch (stageLower) {
      case 'prospectado': return { background: 'rgba(148, 163, 184, 0.12)', color: '#475569' };
      case 'contactado': return { background: 'rgba(59, 130, 246, 0.12)', color: '#1d4ed8' };
      case 'cotizado': return { background: 'rgba(245, 158, 11, 0.12)', color: '#b45309' };
      case 'cerrado': return { background: 'rgba(16, 185, 129, 0.12)', color: '#047857' };
      case 'perdido': return { background: 'rgba(239, 68, 68, 0.12)', color: '#b91c1c' };
      default: return { background: 'rgba(148, 163, 184, 0.12)', color: '#475569' };
    }
  };

  // Manejador del simulador de roles en local
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
      
      {/* 🛠️ SIMULADOR DE ROLES (Exclusivo en desarrollo local) */}
      {!isGas && (
        <div style={{
          background: '#FFFBEB', border: '1px solid #FDE68A', padding: '10px 16px',
          borderRadius: '10px', marginBottom: '18px', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px'
        }}>
          <span style={{ fontSize: '11.5px', color: '#B45309', fontWeight: '700' }}>
            <i className="fas fa-shield-alt" style={{ marginRight: '6px' }}></i>
            Vista de Pruebas: Simula perfiles comerciales en tiempo real
          </span>
          <select 
            value={mockUserRol === 'Administrador' ? 'Administrador' : `Vendedor_${mockUserTienda}`} 
            onChange={(e) => handleMockRoleChange(e.target.value)}
            style={{
              padding: '5px 10px', fontSize: '11.5px', border: '1.5px solid #F59E0B',
              borderRadius: '6px', background: '#fff', fontWeight: '700', color: '#B45309', cursor: 'pointer'
            }}
          >
            <option value="Administrador">Perfil: Administrador (Ver Todo / Eliminar Habilitado / No Agregar)</option>
            <option value="Vendedor_CB">Perfil: Asesor CB (Filtro CB / Agregar Habilitado / No Eliminar)</option>
            <option value="Vendedor_JT">Perfil: Asesor JT (Filtro JT / Agregar Habilitado / No Eliminar)</option>
          </select>
        </div>
      )}

      {/* HEADER DE LA SECCIÓN */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <p className="section-label">Ventas — Control de Prospecciones</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="topbar-btn btn-outline" onClick={handleSyncManual} disabled={isLoading}>
            <i className={`fas fa-sync-alt ${isSyncing ? 'fa-spin' : ''}`}></i> Actualizar vista
          </button>
          
          {/* BOTÓN AGREGAR: Oculto para Administrador, visible para vendedores */}
          {!isAdmin && (
            <button className="topbar-btn btn-primary" onClick={() => handleOpenModal()}>
              <i className="fas fa-plus"></i> + Nueva Prospección
            </button>
          )}
        </div>
      </div>

      {/* MINIDASHBOARD CARD: Funnel Chart */}
      <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
        <div className="card-header" style={{ marginBottom: '14px', borderBottom: 'none', padding: 0 }}>
          <div>
            <div className="card-title">
              <span className="card-title-dot" style={{ background: 'var(--accent-coral)' }}></span>
              Embudo de Prospecciones Comerciales
            </div>
            <div className="card-subtitle">Conversión y estatus acumulado de prospectos</div>
          </div>
        </div>
        <div style={{ height: '180px', position: 'relative' }}>
          <FunnelMiniChart data={{
            total: filteredProspecciones.length,
            cotizado: filteredProspecciones.filter(p => ['cotizado', 'cerrado', 'perdido'].includes((p.Etapa || '').toLowerCase())).length,
            seguimiento: filteredProspecciones.filter(p => ['contactado', 'cotizado', 'cerrado'].includes((p.Etapa || '').toLowerCase())).length,
            cerrado: filteredProspecciones.filter(p => (p.Etapa || '').toLowerCase() === 'cerrado').length
          }} />
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
          <div className="spinner" style={{
            width: '36px', height: '36px', border: '3.5px solid var(--border-light)',
            borderTopColor: 'var(--accent-coral)', borderRadius: '50%', animation: 'spin 0.8s linear infinite'
          }}></div>
        </div>

        <div className="table-card-header">
          <div className="card-title">
            <i className="fas fa-handshake" style={{ color: 'var(--accent-coral)' }}></i>
            Registro de Prospectos Activos
            <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '8px' }}>
              · {isAdmin ? 'Perfil Administrador (Vista Consolidada)' : `Perfil Tienda: ${userTienda}`}
            </span>
          </div>
          
          <div className="table-controls">
            <div className="search-wrap">
              <i className="fas fa-search"></i>
              <input
                type="text"
                className="search-input"
                placeholder="Buscar por cliente o empresa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* FILTRO POR TIENDA: Visible ÚNICAMENTE para Administrador */}
            {isAdmin && (
              <select
                className="select-filter"
                value={filterTienda}
                onChange={(e) => setFilterTienda(e.target.value)}
              >
                <option value="all">Filtrar por Tienda (Todas)</option>
                {TIENDAS.map(store => (
                  <option key={store} value={store}>Tienda {store}</option>
                ))}
              </select>
            )}

            <select
              className="select-filter"
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
            >
              <option value="all">Todas las etapas</option>
              <option value="prospectado">Prospectado</option>
              <option value="contactado">Contactado</option>
              <option value="cotizado">Cotizado</option>
              <option value="cerrado">Cerrado</option>
              <option value="perdido">Perdido</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="deals-table" role="grid" aria-label="Tabla de prospecciones">
            <thead>
              <tr>
                {/* COLUMNA TIENDA: Visible ÚNICAMENTE para Administrador */}
                {isAdmin && <th scope="col">Tienda/Sucursal</th>}
                <th scope="col">No.</th>
                <th scope="col">Empresa o Entidad</th>
                <th scope="col">Nombre del Cliente</th>
                <th scope="col">Teléfono</th>
                <th scope="col">E-mail</th>
                <th scope="col">Etapa</th>
                <th scope="col">Monto</th>
                <th scope="col">Fecha</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProspecciones.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 10 : 9} className="empty-state">
                    <i className="fas fa-search"></i>
                    <br />
                    No se encontraron prospectos
                  </td>
                </tr>
              ) : (
                filteredProspecciones.map(item => (
                  <tr key={item.id} className="deal-row">
                    {/* CELDA TIENDA: Visible ÚNICAMENTE para Administrador */}
                    {isAdmin && (
                      <td style={{ fontWeight: '700', color: 'var(--accent-blue)' }}>
                        <span className="stage-badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' }}>
                          {item.Tienda || '—'}
                        </span>
                      </td>
                    )}
                    <td className="num-cell">{item.Numeración || item.id - 1}</td>
                    <td className="company-cell">{item.Empresa || '—'}</td>
                    <td className="client-cell">{item.Cliente || '—'}</td>
                    <td className="phone-cell">{item.Teléfono || '—'}</td>
                    <td className="email-cell">{item.Email || '—'}</td>
                    <td>
                      <span
                        className="stage-badge"
                        style={getStageBadgeColorStyle(item.Etapa)}
                      >
                        {item.Etapa || 'Prospectado'}
                      </span>
                    </td>
                    <td className="amount-cell">{formatMoneda(item.Monto)}</td>
                    <td className="date-cell">{formatFecha(item.Fecha)}</td>
                    <td className="actions-cell">
                      {/* Editar: Visible para todos */}
                      <button
                        className="action-btn edit-btn"
                        title="Editar"
                        onClick={() => handleOpenModal(item)}
                      >
                        <i className="fas fa-pencil-alt"></i>
                      </button>

                      {/* Eliminar: Visible ÚNICAMENTE para Administrador */}
                      {isAdmin && (
                        <button
                          className="action-btn delete-btn"
                          title="Eliminar permanentemente"
                          onClick={() => handleDelete(item)}
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
              <h3 id="modal-title">{formId ? 'Editar Prospección' : 'Nueva Prospección'}</h3>
              <button className="modal-close" aria-label="Cerrar modal" onClick={handleCloseModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSave} className={wasValidated ? 'was-validated' : ''} noValidate>
              <div className="modal-body">
                
                <div className="form-group">
                  <label className="form-label" htmlFor="field-empresa">
                    Empresa o Entidad
                  </label>
                  <input
                    type="text"
                    id="field-empresa"
                    className="form-control"
                    placeholder="Ej: Embotelladora Central"
                    value={formEmpresa}
                    onChange={(e) => setFormEmpresa(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="field-cliente">
                    Nombre del Cliente
                  </label>
                  <input
                    type="text"
                    id="field-cliente"
                    className="form-control"
                    placeholder="Ej: Ing. René Arriola"
                    value={formCliente}
                    onChange={(e) => setFormCliente(e.target.value)}
                    required
                  />
                </div>

                <div className="modal-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="field-telefono">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      id="field-telefono"
                      className="form-control"
                      placeholder="Ej: 502 5555-4321"
                      value={formTelefono}
                      onChange={(e) => setFormTelefono(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="field-email">
                      E-mail
                    </label>
                    <input
                      type="email"
                      id="field-email"
                      className="form-control"
                      placeholder="Ej: cliente@correo.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="modal-row">
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
                      <option value="Prospectado">Prospectado</option>
                      <option value="Contactado">Contactado</option>
                      <option value="Cotizado">Cotizado</option>
                      <option value="Cerrado">Cerrado</option>
                      <option value="Perdido">Perdido</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ display: formEtapa === 'Cotizado' ? 'block' : 'none' }}>
                    <label className="form-label" htmlFor="field-monto">
                      Monto (Q)
                    </label>
                    <input
                      type="number"
                      id="field-monto"
                      className="form-control"
                      placeholder="Ej: 15500.00"
                      value={formMonto}
                      onChange={(e) => setFormMonto(e.target.value)}
                      min="0"
                      step="0.01"
                      disabled={formEtapa !== 'Cotizado'}
                      required={formEtapa === 'Cotizado'}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="field-fecha">
                    Fecha de Registro
                  </label>
                  <input
                    type="date"
                    id="field-fecha"
                    className="form-control"
                    value={formFecha}
                    readOnly
                    required
                  />
                </div>

              </div>

              <div className="modal-foot">
                <button type="button" className="topbar-btn btn-outline" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="topbar-btn btn-primary">
                  <i className="fas fa-save"></i> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
