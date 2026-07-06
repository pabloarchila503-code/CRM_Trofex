import { useState, useEffect, useCallback, useMemo } from 'react';

// =====================================================================
// CONFIGURACIÓN DEL BACKEND (Google Apps Script Web App)
// =====================================================================
// Pega aquí la URL de tu despliegue de Apps Script (Implementar > Nueva
// implementación > Aplicación web), algo como:
// https://script.google.com/macros/s/AKfycb..../exec
// Mientras esto esté vacío, el módulo funciona en modo local/demo
// (los archivos no se suben realmente a Drive).
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwSzOB7Eqz8uxj8maGwSDu_ArLdk6hwbPTJSH_innNtoNzhydvcZBLiETQQzkW3bzrK/exec';

const PRODUCTOS = ['Medalla Fundida', 'Pin Fundido', 'Plasma Metal', 'Vidrio', 'Fotograbado', 'Producto especial', 'Protextil'];
const PROCESOS = ['en tiempo', 'tarde', 'Entregado'];
const STORES = ['CB', 'CHM', 'CHQ', 'ESC', 'HH', 'JT', 'MZ', 'PT', 'PTB', 'SJ', 'SMA', 'VN', 'XL', 'Z3'];

// Enlaces reales a las carpetas raíz de Drive (para el botón "Abrir Carpeta en Drive")
const CARPETA_CARGA_URL = 'https://drive.google.com/drive/folders/1biBNC5T018q_2AYMFixiiAdxsYK_g72Z';
const CARPETA_DESCARGA_URL = 'https://drive.google.com/drive/folders/1AEgVPJKB2vvU-XGtsb768BfnvOr5g7nh';

function mockValesIniciales() {
  return [
    { No: 1, Tienda: 'CB', NoVale: 'VAL-001', Producto: 'Medalla Fundida', FechaIngreso: '2026-07-01', FechaSalida: '2026-07-05', Proceso: 'tarde', ArchivoCargaUrl: '', ArchivoDescargaUrl: '' },
    { No: 2, Tienda: 'JT', NoVale: 'VAL-002', Producto: 'Vidrio', FechaIngreso: '2026-07-03', FechaSalida: '2026-07-06', Proceso: 'tarde', ArchivoCargaUrl: '', ArchivoDescargaUrl: '' },
    { No: 3, Tienda: 'Z3', NoVale: 'VAL-003', Producto: 'Pin Fundido', FechaIngreso: '2026-06-28', FechaSalida: '2026-07-02', Proceso: 'tarde', ArchivoCargaUrl: '', ArchivoDescargaUrl: '' },
  ];
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ValesView({ userRole, activeStore, selectedStores, showToast, userName, selectedMonths }) {
  const store = activeStore || (selectedStores && selectedStores[0]) || 'CB';
  const isAdminOrDesign = userRole === 'admin' || userRole === 'diseno';
  const [vales, setVales] = useState(mockValesIniciales());
  const [isLoading, setIsLoading] = useState(Boolean(SCRIPT_URL));
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [uploadingKey, setUploadingKey] = useState(null); // `${noVale}-${tipo}` mientras se sube un archivo
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVale, setEditingVale] = useState(null);
  const [nuevoVale, setNuevoVale] = useState({ tienda: store || 'CB', noVale: '', producto: PRODUCTOS[0], fechaSalida: '' });

  const [fileToUpload, setFileToUpload] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState('listado'); // 'listado' | 'dashboard'

  useEffect(() => {
    setNuevoVale(prev => ({ ...prev, tienda: store }));
  }, [store]);

  const notify = useCallback((msg, type = 'success') => {
    if (showToast) showToast(msg, type);
    else alert(msg);
  }, [showToast]);

  const cargarVales = useCallback(async () => {
    if (!SCRIPT_URL) return; // Modo local/demo: se queda con el mock inicial
    const rol = userRole === 'admin' ? 'admin' : userRole === 'diseno' ? 'diseno' : 'store';
    const url = `${SCRIPT_URL}?action=vales&rol=${encodeURIComponent(rol)}&tienda=${encodeURIComponent(store || '')}`;
    try {
      const res = await fetch(url).then(r => r.json());
      if (res.status === 'success') {
        setVales(res.datos || []);
        setIsBackendConnected(true);
      } else {
        notify('No se pudieron cargar los vales: ' + res.message, 'error');
      }
    } catch {
      notify('No se pudo conectar con el backend de Drive. Mostrando datos de demostración.', 'error');
      setIsBackendConnected(false);
    }
  }, [userRole, store, notify]);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial estándar de datos remotos
    cargarVales().finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [cargarVales]);

  // Filtrado por rol y por mes (si se especifica)
  const valesVisibles = useMemo(() => {
    let filtered = isAdminOrDesign
      ? vales
      : vales.filter(v => String(v.Tienda).toUpperCase() === String(store).toUpperCase());

    if (selectedMonths && selectedMonths.length > 0) {
      const monthsList = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      filtered = filtered.filter(v => {
        if (!v.FechaIngreso) return false;
        const parts = v.FechaIngreso.split('-');
        if (parts.length < 2) return false;
        const monthIndex = parseInt(parts[1], 10) - 1; // 0-11
        if (monthIndex >= 0 && monthIndex < 12) {
          const monthName = monthsList[monthIndex];
          return selectedMonths.includes(monthName);
        }
        return false;
      });
    }
    return filtered;
  }, [vales, isAdminOrDesign, store, selectedMonths]);

  const conteoDashboard = useMemo(() => {
    const base = { total: valesVisibles.length, 'en tiempo': 0, tarde: 0, Entregado: 0 };
    valesVisibles.forEach(v => {
      if (base[v.Proceso] !== undefined) base[v.Proceso] += 1;
    });
    return base;
  }, [valesVisibles]);

  const handleCrearVale = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    const tiendaFinal = isAdminOrDesign ? (nuevoVale.tienda || store || 'CB') : (store || 'CB');
    const datos = {
      tienda: tiendaFinal,
      noVale: nuevoVale.noVale ? nuevoVale.noVale.trim() : '',
      producto: nuevoVale.producto,
      fechaIngreso: new Date().toISOString().slice(0, 10),
      fechaSalida: nuevoVale.fechaSalida,
    };

    if (!SCRIPT_URL) {
      // Modo local/demo
      const numero = vales.length + 1;
      const noValeDemo = datos.noVale || ('VAL-' + String(numero).padStart(3, '0'));
      setVales(prev => [...prev, {
        No: numero,
        Tienda: datos.tienda,
        NoVale: noValeDemo,
        Producto: datos.producto,
        FechaIngreso: datos.fechaIngreso,
        FechaSalida: datos.fechaSalida,
        Proceso: 'en tiempo',
        ArchivoCargaUrl: '',
        ArchivoDescargaUrl: '',
      }]);
      notify('Vale creado (modo demo, aún no conectado a Drive real).');
      setIsModalOpen(false);
      setIsCreating(false);
      setFileToUpload(null);
      return;
    }

    try {
      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'crearVale', datos }),
      }).then(r => r.json());

      if (res.status === 'success') {
        const createdNoVale = res.noVale;
        
        // Si hay un archivo seleccionado para cargar, subirlo automáticamente
        if (fileToUpload) {
          notify(`Vale ${createdNoVale} creado. Subiendo archivo...`);
          try {
            const base64Data = await fileToBase64(fileToUpload);
            const uploadRes = await fetch(SCRIPT_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({
                action: 'subirArchivoVale',
                datos: {
                  noVale: createdNoVale,
                  tipo: 'carga',
                  fileName: fileToUpload.name,
                  mimeType: fileToUpload.type,
                  base64Data: base64Data,
                  tienda: tiendaFinal
                }
              })
            }).then(r => r.json());

            if (uploadRes.status === 'success') {
              notify(`Vale ${createdNoVale} y archivo creados con éxito.`);
            } else {
              notify(`Vale creado, pero falló la subida del archivo: ${uploadRes.message}`, 'error');
            }
          } catch (uploadErr) {
            notify('Vale creado, pero falló la conversión del archivo.', 'error');
          }
        } else {
          notify(res.message);
        }
        
        cargarVales();
        setIsModalOpen(false);
        setFileToUpload(null);
      } else {
        notify('Error al crear el vale: ' + res.message, 'error');
      }
    } catch (err) {
      notify('No se pudo contactar al backend para crear el vale.', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    if (!editingVale) return;

    const { NoVale, Proceso, FechaSalida } = editingVale;
    setVales(prev => prev.map(v => v.NoVale === NoVale ? { ...v, Proceso, FechaSalida } : v));
    setEditingVale(null);
    notify(`Vale ${NoVale} actualizado correctamente.`);

    if (!SCRIPT_URL) return;
    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'editarVale', noVale: NoVale, proceso: Proceso, fechaSalida: FechaSalida })
      });
    } catch {
      notify('No se pudo guardar la edición en Drive.', 'error');
    }
  };

  const handleEliminarVale = async () => {
    if (!editingVale) return;
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el vale "${editingVale.NoVale}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    const noVale = editingVale.NoVale;
    setVales(prev => prev.filter(v => v.NoVale !== noVale));
    setEditingVale(null);
    notify(`Vale ${noVale} eliminado correctamente.`);

    if (!SCRIPT_URL) return;
    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'eliminarVale', noVale })
      });
    } catch {
      notify('No se pudo eliminar el vale en el servidor.', 'error');
    }
  };

  const handleProcesoChange = (noVale, proceso) => {
    setVales(prev => prev.map(v => v.NoVale === noVale ? { ...v, Proceso: proceso } : v));
    if (!SCRIPT_URL) return; // modo demo, solo cambia en memoria
    fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'actualizarProcesoVale', noVale, proceso }),
    }).catch(() => notify('No se pudo guardar el cambio de proceso en el servidor.', 'error'));
  };

  const handleUpload = (noVale, tipo) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*/*';
    input.onchange = async (ev) => {
      const file = ev.target.files[0];
      if (!file) return;

      const key = `${noVale}-${tipo}`;
      setUploadingKey(key);

      if (!SCRIPT_URL) {
        // Modo local/demo: simula la subida (no llega a Drive real)
        setTimeout(() => {
          setUploadingKey(null);
          notify(`Modo demo: "${file.name}" no se subió realmente a Drive porque falta configurar SCRIPT_URL en ValesView.jsx.`, 'error');
        }, 800);
        return;
      }

      try {
        const base64 = await fileToBase64(file);
        const res = await fetch(SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'subirArchivoVale',
            datos: {
              noVale,
              tipo, // 'carga' | 'descarga'
              base64,
              mimeType: file.type,
              fileName: file.name,
            },
          }),
        }).then(r => r.json());

        if (res.status === 'success') {
          notify(res.message);
          setVales(prev => prev.map(v => v.NoVale === noVale
            ? { ...v, [tipo === 'carga' ? 'ArchivoCargaUrl' : 'ArchivoDescargaUrl']: res.url }
            : v));
        } else {
          notify('Error al subir el archivo: ' + res.message, 'error');
        }
      } catch {
        notify('No se pudo subir el archivo. Revisa tu conexión con el backend.', 'error');
      } finally {
        setUploadingKey(null);
      }
    };
    input.click();
  };

  const procesoColor = (proceso) => {
    if (proceso === 'Entregado') return { color: '#16a34a', bg: 'rgba(22,163,74,0.1)' };
    if (proceso === 'tarde') return { color: '#dc2626', bg: 'rgba(220,38,38,0.1)' };
    return { color: '#d97706', bg: 'rgba(217,119,6,0.1)' }; // en tiempo
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {!SCRIPT_URL && (
        <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '10px', padding: '10px 16px', marginBottom: '16px', fontSize: '12px', color: '#92400E', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fas fa-triangle-exclamation"></i>
          Modo demostración: falta configurar <code>SCRIPT_URL</code> en <code>ValesView.jsx</code> con tu Web App de Google Apps Script. Los archivos no se están subiendo realmente a Drive todavía.
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px', background: 'var(--bg-body)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>🎨</span>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Vales de Artes - Diseño</h1>
              <p style={{ fontSize: '13px', margin: '2px 0 0', opacity: 0.9 }}>Gestión, seguimiento y control de diseños solicitados para producción</p>
            </div>
          </div>
        </div>
        <button className="topbar-btn btn-primary" style={{ background: '#fff', color: '#4f46e5', fontWeight: 700 }} onClick={() => {
          setNuevoVale({ tienda: store || STORES[0], producto: PRODUCTOS[0], fechaSalida: '' });
          setIsModalOpen(true);
        }}>
          <i className="fas fa-plus" style={{ marginRight: '6px' }}></i> Solicitar Vale de Arte
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border-light)' }}>
        {[
          { id: 'listado', label: 'Listado General', icon: 'fa-list' },
          { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 700,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #4f46e5' : '2px solid transparent',
              color: activeTab === tab.id ? '#4f46e5' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <i className={`fas ${tab.icon}`}></i> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px', marginBottom: '24px' }}>
            <div className="card" style={{ padding: '20px', borderTop: '3px solid #4f46e5' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Total de Vales</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#4f46e5' }}>{conteoDashboard.total}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {isAdminOrDesign ? 'Todas las tiendas' : `Tienda ${store}`}
              </div>
            </div>
            <div className="card" style={{ padding: '20px', borderTop: '3px solid #d97706' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>En Tiempo</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#d97706' }}>{conteoDashboard['en tiempo']}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Vales dentro del plazo</div>
            </div>
            <div className="card" style={{ padding: '20px', borderTop: '3px solid #dc2626' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Tarde</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#dc2626' }}>{conteoDashboard.tarde}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Vales fuera del plazo</div>
            </div>
            <div className="card" style={{ padding: '20px', borderTop: '3px solid #16a34a' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Entregado</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#16a34a' }}>{conteoDashboard.Entregado}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Vales completados</div>
            </div>
          </div>

          {isAdminOrDesign && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)' }}>
                <h3 className="card-title" style={{ fontSize: '14px', margin: 0 }}>Vales por Tienda</h3>
              </div>
              <div style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {STORES.map(s => {
                  const cantidad = valesVisibles.filter(v => String(v.Tienda).toUpperCase() === s).length;
                  if (cantidad === 0) return null;
                  return (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-body)', padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                      <span style={{ fontWeight: 800, fontSize: '12px', color: '#4f46e5' }}>{s}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{cantidad} {cantidad === 1 ? 'vale' : 'vales'}</span>
                    </div>
                  );
                })}
                {valesVisibles.length === 0 && (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No hay vales registrados todavía.</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'listado' && (
      <>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: '1 1 320px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <i className="fab fa-google-drive" style={{ fontSize: '22px', color: '#3b82f6' }}></i>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '13px' }}>Vales de Carga (Tiendas)</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Carpeta en Drive donde las tiendas suben solicitudes de vales de arte.</div>
          </div>
          {isAdminOrDesign && (
            <a href={CARPETA_CARGA_URL} target="_blank" rel="noreferrer" className="topbar-btn btn-outline" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>
              Abrir Carpeta
            </a>
          )}
        </div>
        <div className="card" style={{ flex: '1 1 320px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <i className="fab fa-google-drive" style={{ fontSize: '22px', color: '#16a34a' }}></i>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '13px' }}>Vales de Descarga (Diseño)</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Carpeta en Drive donde el diseñador sube las propuestas terminadas.</div>
          </div>
          {isAdminOrDesign && (
            <a href={CARPETA_DESCARGA_URL} target="_blank" rel="noreferrer" className="topbar-btn btn-outline" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>
              Abrir Carpeta
            </a>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)' }}>
          <h3 className="card-title" style={{ fontSize: '14px', margin: 0 }}>Listado General de Vales de Arte</h3>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#4f46e5', background: 'rgba(79,70,229,0.1)', padding: '4px 10px', borderRadius: '20px' }}>
            {isLoading ? 'Cargando...' : `${valesVisibles.length} vales`}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-body)', textAlign: 'left' }}>
                {['No.', 'Tienda', 'No. Vale', 'Producto', 'Fecha Ingreso', 'Fecha Salida', 'Proceso', 'Subir Carga (Tiendas)', 'Subir Descarga (Diseñador)', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {valesVisibles.map((v, idx) => {
                const pc = procesoColor(v.Proceso);
                const cargandoCarga = uploadingKey === `${v.NoVale}-carga`;
                const cargandoDescarga = uploadingKey === `${v.NoVale}-descarga`;
                return (
                  <tr key={v.NoVale} style={{ borderTop: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '12px 16px', fontSize: '12px' }}>{idx + 1}</td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#4f46e5' }}>{v.Tienda}</td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700 }}>{v.NoVale}</td>
                    <td style={{ padding: '12px 16px', fontSize: '12px' }}>{v.Producto}</td>
                    <td style={{ padding: '12px 16px', fontSize: '12px' }}>{v.FechaIngreso}</td>
                    <td style={{ padding: '12px 16px', fontSize: '12px' }}>{v.FechaSalida}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {isAdminOrDesign ? (
                        <select
                          value={v.Proceso}
                          onChange={(e) => handleProcesoChange(v.NoVale, e.target.value)}
                          style={{ fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-light)' }}
                        >
                          {PROCESOS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      ) : (
                        <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '6px', color: pc.color, background: pc.bg, textTransform: 'uppercase' }}>
                          {v.Proceso}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {v.ArchivoCargaUrl ? (
                        <a href={v.ArchivoCargaUrl} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 700, textDecoration: 'none' }}>
                          <i className="fas fa-file"></i> Ver Arte Carga
                        </a>
                      ) : userRole === 'diseno' ? (
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Sin archivo</span>
                      ) : (
                        <button
                          onClick={() => handleUpload(v.NoVale, 'carga')}
                          disabled={cargandoCarga}
                          className="topbar-btn btn-outline"
                          style={{ fontSize: '10px', padding: '4px 10px', color: '#3b82f6', borderColor: '#3b82f6' }}
                        >
                          {cargandoCarga ? 'Subiendo...' : 'Subir Carga'}
                        </button>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {v.ArchivoDescargaUrl ? (
                        <a href={v.ArchivoDescargaUrl} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700, textDecoration: 'none' }}>
                          <i className="fas fa-download"></i> Descargar Arte Final
                        </a>
                      ) : isAdminOrDesign ? (
                        <button
                          onClick={() => handleUpload(v.NoVale, 'descarga')}
                          disabled={cargandoDescarga}
                          className="topbar-btn btn-outline"
                          style={{ fontSize: '10px', padding: '4px 10px', color: '#16a34a', borderColor: '#16a34a' }}
                        >
                          {cargandoDescarga ? 'Subiendo...' : 'Subir Descarga'}
                        </button>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Pendiente</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => setEditingVale({ ...v })}
                        className="topbar-btn btn-outline"
                        style={{ fontSize: '11px', padding: '4px 10px', color: '#4f46e5', borderColor: '#4f46e5', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <i className="fas fa-edit"></i> Editar
                      </button>
                    </td>
                  </tr>
                );
              })}
              {valesVisibles.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                    No hay vales de arte registrados todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(30,41,59,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ width: '420px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
              <h3 className="card-title" style={{ fontSize: '15px', margin: 0 }}>Solicitar Vale de Arte</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleCrearVale} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {isAdminOrDesign ? (
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Tienda</label>
                  <select className="form-control" value={nuevoVale.tienda} onChange={(e) => setNuevoVale(s => ({ ...s, tienda: e.target.value }))}>
                    {STORES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Tienda (Solicitante)</label>
                  <input type="text" className="form-control" disabled value={store || 'CB'} style={{ background: '#f1f5f9', fontWeight: 700, color: '#4f46e5' }} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>No. de Vale (Ej. VAL-004 o 12345)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. VAL-004 (dejar vacío para automático)"
                  value={nuevoVale.noVale || ''}
                  onChange={(e) => setNuevoVale(s => ({ ...s, noVale: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Producto</label>
                <select className="form-control" value={nuevoVale.producto} onChange={(e) => setNuevoVale(s => ({ ...s, producto: e.target.value }))}>
                  {PRODUCTOS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Fecha de Salida Estimada</label>
                <input type="date" className="form-control" required value={nuevoVale.fechaSalida} onChange={(e) => setNuevoVale(s => ({ ...s, fechaSalida: e.target.value }))} />
              </div>
              
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '11px', fontWeight: 700 }}>Archivo de Carga (Opcional - Imagen o PDF)</label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file) setFileToUpload(file);
                  }}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '*/*';
                    input.onchange = (ev) => {
                      const file = ev.target.files[0];
                      if (file) setFileToUpload(file);
                    };
                    input.click();
                  }}
                  style={{
                    border: isDragOver ? '2px dashed #4f46e5' : '2px dashed var(--border-light)',
                    background: isDragOver ? '#f3f2ff' : 'var(--bg-body)',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <i className="fas fa-cloud-upload-alt" style={{ fontSize: '24px', color: fileToUpload ? '#4f46e5' : 'var(--text-muted)', marginBottom: '8px' }}></i>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: fileToUpload ? '700' : '500', color: fileToUpload ? '#4f46e5' : 'var(--text-muted)' }}>
                    {fileToUpload ? `📄 ${fileToUpload.name} (${(fileToUpload.size / 1024).toFixed(1)} KB)` : 'Arrastra tu archivo aquí o haz clic para seleccionarlo'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '14px' }}>
                <button type="button" className="topbar-btn btn-outline" disabled={isCreating} onClick={() => { setIsModalOpen(false); setFileToUpload(null); }}>Cancelar</button>
                <button type="submit" className="topbar-btn btn-primary" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                      Procesando...
                    </>
                  ) : 'Solicitar Vale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingVale && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(30,41,59,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ width: '450px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
              <div>
                <h3 className="card-title" style={{ fontSize: '16px', margin: 0, color: '#4f46e5' }}>Editar Vale: {editingVale.NoVale}</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tienda: <strong>{editingVale.Tienda}</strong></span>
              </div>
              <button onClick={() => setEditingVale(null)} style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
            </div>

            <form onSubmit={handleGuardarEdicion} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  No. de Vale (No editable)
                </label>
                <input
                  type="text"
                  disabled
                  value={editingVale.NoVale || ''}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: '#f8fafc', color: '#64748b', fontWeight: 700, fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Producto (No editable)
                </label>
                <input
                  type="text"
                  disabled
                  value={editingVale.Producto || ''}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: '#f8fafc', color: '#64748b', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Fecha de Ingreso (No editable)
                </label>
                <input
                  type="text"
                  disabled
                  value={editingVale.FechaIngreso || ''}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: '#f8fafc', color: '#64748b', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Estado / Proceso
                </label>
                <select
                  value={editingVale.Proceso || 'en tiempo'}
                  onChange={(e) => setEditingVale({ ...editingVale, Proceso: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-body)', fontSize: '13px', fontWeight: 700 }}
                >
                  {PROCESOS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Fecha de Salida Estimada
                </label>
                <input
                  type="date"
                  value={editingVale.FechaSalida || ''}
                  onChange={(e) => setEditingVale({ ...editingVale, FechaSalida: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-body)', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <button type="button" onClick={handleEliminarVale} className="topbar-btn btn-outline" style={{ padding: '8px 16px', color: '#ef4444', borderColor: '#ef4444' }}>
                  <i className="fas fa-trash-alt"></i> Eliminar
                </button>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => setEditingVale(null)} className="topbar-btn btn-outline" style={{ padding: '8px 16px' }}>
                    Cancelar
                  </button>
                  <button type="submit" className="topbar-btn btn-primary" style={{ padding: '8px 20px', background: '#4f46e5', color: '#fff' }}>
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {isBackendConnected && (
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '10px' }}>
          <i className="fas fa-check-circle" style={{ color: '#16a34a' }}></i> Conectado al backend de Google Drive.
        </p>
      )}
    </div>
  );
}
