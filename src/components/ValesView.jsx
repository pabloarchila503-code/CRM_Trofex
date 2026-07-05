import { useState, useMemo, useEffect } from 'react';

// STORES
const STORES = ['CB', 'CHM', 'CHQ', 'ESC', 'HH', 'JT', 'MZ', 'PT', 'PTB', 'SJ', 'SMA', 'VN', 'XL', 'Z3'];

// Inicial de vales ficticios para poblar si no hay en localStorage
const INITIAL_VALES = [
  { id: 'v1', tienda: 'CB', noVale: 'VAL-001', producto: 'Medalla Fundida', fechaIngreso: '2026-07-01', fechaSalida: '2026-07-05', proceso: 'Entregado', archivoCargaUrl: '', archivoDescargaUrl: '' },
  { id: 'v2', tienda: 'JT', noVale: 'VAL-002', producto: 'Vidrio', fechaIngreso: '2026-07-03', fechaSalida: '2026-07-06', proceso: 'en tiempo', archivoCargaUrl: '', archivoDescargaUrl: '' },
  { id: 'v3', tienda: 'Z3', noVale: 'VAL-003', producto: 'Pin Fundido', fechaIngreso: '2026-06-28', fechaSalida: '2026-07-02', proceso: 'tarde', archivoCargaUrl: '', archivoDescargaUrl: '' }
];

export default function ValesView({ selectedStores = [], userRole = 'admin', userName = '' }) {
  const [vales, setVales] = useState(() => {
    const saved = localStorage.getItem('TROFEX_VALES_DB');
    return saved ? JSON.parse(saved) : INITIAL_VALES;
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form para solicitar Vale (Tiendas o Admin)
  const [form, setForm] = useState({
    tienda: selectedStores[0] || 'CB',
    noVale: '',
    producto: 'Medalla Fundida',
    fechaIngreso: new Date().toISOString().slice(0, 10),
    fechaSalida: '',
    proceso: 'en tiempo'
  });

  useEffect(() => {
    localStorage.setItem('TROFEX_VALES_DB', JSON.stringify(vales));
  }, [vales]);

  const handleCreateVale = (e) => {
    e.preventDefault();
    if (!form.noVale.trim() || !form.fechaSalida) {
      alert('Por favor, ingresa el número de vale y la fecha de salida estimada.');
      return;
    }

    const nuevoVale = {
      id: 'val-' + Date.now(),
      tienda: userRole === 'diseno' ? form.tienda : (selectedStores[0] || 'CB'),
      noVale: form.noVale,
      producto: form.producto,
      fechaIngreso: form.fechaIngreso,
      fechaSalida: form.fechaSalida,
      proceso: form.proceso,
      archivoCargaUrl: '',
      archivoDescargaUrl: ''
    };

    setVales(prev => [nuevoVale, ...prev]);
    setIsModalOpen(false);
    setForm({
      tienda: selectedStores[0] || 'CB',
      noVale: '',
      producto: 'Medalla Fundida',
      fechaIngreso: new Date().toISOString().slice(0, 10),
      fechaSalida: '',
      proceso: 'en tiempo'
    });
  };

  const handleUpdateProceso = (id, nuevoProceso) => {
    setVales(prev => prev.map(v => v.id === id ? { ...v, proceso: nuevoProceso } : v));
  };

  // Filtrado de vales:
  // - Diseñador y Admin: ven todos.
  // - Tiendas: solo los suyos.
  const filteredVales = useMemo(() => {
    if (userRole === 'admin' || userRole === 'diseno') {
      return vales;
    }
    return vales.filter(v => selectedStores.includes(v.tienda));
  }, [vales, userRole, selectedStores]);

  // Manejo de la simulación de subida de archivos a Drive
  const handleSimulatedUpload = (valeId, fieldName) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setIsUploading(true);
      setTimeout(() => {
        setIsUploading(false);
        const folderType = fieldName === 'archivoCargaUrl' ? 'Vales de Carga' : 'Vales de Descarga';
        const dummyUrl = `https://drive.google.com/drive/folders/dummy-id-folder`;
        
        setVales(prev => prev.map(v => {
          if (v.id === valeId) {
            return { ...v, [fieldName]: dummyUrl };
          }
          return v;
        }));

        alert(`Archivo "${file.name}" subido con éxito al Google Drive de Trofex en la carpeta: "${folderType}/${selectedStores[0] || 'CB'}".`);
      }, 1500);
    };
    input.click();
  };

  return (
    <div className="view-section active" style={{ background: '#f8fafc', minHeight: '100%', padding: '24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* ===== HEADER ===== */}
        <div style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
          borderRadius: '16px', padding: '24px 32px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0 4px 20px rgba(30,58,138,0.25)'
        }}>
          <div>
            <h2 style={{ color: '#fff', fontWeight: '900', fontSize: '20px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fas fa-palette"></i> Vales de Artes
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', margin: '4px 0 0', fontSize: '13px' }}>
              Gestión, seguimiento y control de diseños solicitados para producción
            </p>
          </div>
          {userRole !== 'diseno' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="topbar-btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', background: '#ffffff', color: '#1e3a8a', fontWeight: '800', border: 'none', cursor: 'pointer' }}
            >
              <i className="fas fa-plus"></i> Solicitar Vale de Arte
            </button>
          )}
        </div>

        {/* ===== INFORMACIÓN DE CARPETAS DE DRIVE ===== */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '40px', height: '40px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
              <i className="fab fa-google-drive"></i>
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#1e293b' }}>Vales de Carga (Tiendas)</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Carpeta en Drive donde las tiendas suben solicitudes de vales de arte.
              </div>
            </div>
          </div>
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '40px', height: '40px', background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
              <i className="fab fa-google-drive"></i>
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#1e293b' }}>Vales de Descarga (Diseño)</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Carpeta en Drive donde el diseñador sube las propuestas terminadas.
              </div>
            </div>
          </div>
        </div>

        {/* ===== TABLA / CONTROL DE VALES ===== */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Listado General de Vales de Arte</h3>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#4f46e5', background: '#f0f4ff', padding: '4px 10px', borderRadius: '6px' }}>
              {filteredVales.length} vales
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['No.', 'Tienda', 'No. Vale', 'Producto', 'Fecha Ingreso', 'Fecha Salida', 'Proceso', 'Subir Carga (Tiendas)', 'Subir Descarga (Diseñador)'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredVales.map((vale, idx) => {
                  let procColor = '#10b981'; // en tiempo
                  let procBg = '#dcfce7';
                  if (vale.proceso === 'tarde') { procColor = '#ef4444'; procBg = '#fee2e2'; }
                  else if (vale.proceso === 'Entregado') { procColor = '#3b82f6'; procBg = '#dbeafe'; }

                  return (
                    <tr key={vale.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '800', color: '#1e293b' }}>{idx + 1}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '900', color: '#4f46e5' }}>{vale.tienda}</td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>{vale.noVale}</td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: '#475569', fontWeight: '600' }}>{vale.producto}</td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b' }}>{vale.fechaIngreso}</td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b' }}>{vale.fechaSalida}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {userRole === 'diseno' || userRole === 'admin' ? (
                          <select
                            value={vale.proceso}
                            onChange={(e) => handleUpdateProceso(vale.id, e.target.value)}
                            style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', border: '1px solid #e2e8f0', outline: 'none' }}
                          >
                            <option value="en tiempo">en tiempo</option>
                            <option value="tarde">tarde</option>
                            <option value="Entregado">Entregado</option>
                          </select>
                        ) : (
                          <span style={{ fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', color: procColor, background: procBg, textTransform: 'uppercase' }}>
                            {vale.proceso}
                          </span>
                        )}
                      </td>
                      
                      {/* Tienda: sube a Vales de Carga */}
                      <td style={{ padding: '12px 16px' }}>
                        {vale.archivoCargaUrl ? (
                          <a href={vale.archivoCargaUrl} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#3b82f6', fontWeight: '700', textDecoration: 'none' }}>
                            <i className="fas fa-file-pdf"></i> Ver Arte Carga
                          </a>
                        ) : (
                          userRole !== 'diseno' ? (
                            <button
                              onClick={() => handleSimulatedUpload(vale.id, 'archivoCargaUrl')}
                              style={{ padding: '4px 8px', fontSize: '10px', border: '1px dashed #3b82f6', color: '#3b82f6', background: 'rgba(59,130,246,0.05)', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}
                            >
                              <i className="fas fa-cloud-upload-alt"></i> Subir Carga
                            </button>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Sin archivo</span>
                          )
                        )}
                      </td>

                      {/* Diseñador: sube a Vales de Descarga */}
                      <td style={{ padding: '12px 16px' }}>
                        {vale.archivoDescargaUrl ? (
                          <a href={vale.archivoDescargaUrl} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#10b981', fontWeight: '700', textDecoration: 'none' }}>
                            <i className="fas fa-file-pdf"></i> Descargar Arte Final
                          </a>
                        ) : (
                          userRole === 'diseno' || userRole === 'admin' ? (
                            <button
                              onClick={() => handleSimulatedUpload(vale.id, 'archivoDescargaUrl')}
                              style={{ padding: '4px 8px', fontSize: '10px', border: '1px dashed #10b981', color: '#10b981', background: 'rgba(16,185,129,0.05)', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}
                            >
                              <i className="fas fa-cloud-upload-alt"></i> Subir Descarga
                            </button>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Sin propuesta</span>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredVales.length === 0 && (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', fontSize: '13px' }}>
                      No tienes solicitudes de vales de artes activas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ===== MODAL PARA SOLICITAR VALE ===== */}
      {isModalOpen && (
        <div className="modal-overlay active" style={{ zIndex: 10000 }}>
          <div className="modal-box" style={{ maxWidth: '440px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Solicitar Vale de Arte</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>&times;</button>
            </div>
            
            <form onSubmit={handleCreateVale} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {userRole === 'admin' && (
                <div className="form-group" style={{ textAlign: 'left' }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>Tienda Solicitante</label>
                  <select
                    className="select-filter"
                    value={form.tienda}
                    onChange={e => setForm(prev => ({ ...prev, tienda: e.target.value }))}
                    style={{ width: '100%', padding: '8px' }}
                  >
                    {STORES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}

              <div className="form-group" style={{ textAlign: 'left' }}>
                <label className="form-label" style={{ fontSize: '11px' }}>Número de Vale</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: VAL-105"
                  value={form.noVale}
                  onChange={e => setForm(prev => ({ ...prev, noVale: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group" style={{ textAlign: 'left' }}>
                <label className="form-label" style={{ fontSize: '11px' }}>Producto</label>
                <select
                  className="select-filter"
                  value={form.producto}
                  onChange={e => setForm(prev => ({ ...prev, producto: e.target.value }))}
                  style={{ width: '100%', padding: '8px' }}
                >
                  {['Medalla Fundida', 'Pin Fundido', 'Plasma Metal', 'Vidrio', 'Fotograbado', 'Producto especial', 'Protextil'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ textAlign: 'left' }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>Fecha Ingreso</label>
                  <input
                    type="date"
                    className="form-control"
                    value={form.fechaIngreso}
                    disabled
                  />
                </div>
                <div className="form-group" style={{ textAlign: 'left' }}>
                  <label className="form-label" style={{ fontSize: '11px' }}>Fecha Salida (Entrega)</label>
                  <input
                    type="date"
                    className="form-control"
                    value={form.fechaSalida}
                    onChange={e => setForm(prev => ({ ...prev, fechaSalida: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="topbar-btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="topbar-btn btn-primary">Crear Solicitud</button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
