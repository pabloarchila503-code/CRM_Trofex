import { useState, useEffect } from 'react';

const MENU_ITEMS = [
  { id: 'dashboard', name: 'Dashboard', category: 'Principal' },
  { id: 'productos', name: 'Tendencia de Producto', category: 'Principal' },
  { id: 'tendencias', name: 'Histórico de Productos Vendidos', category: 'Principal' },
  { id: 'tareas', name: 'Tareas', category: 'Tareas' },
  { id: 'vales', name: 'Vales de Artes', category: 'Tareas' },
  { id: 'analisis-rendimiento', name: 'Análisis de Rendimiento', category: 'Tareas' },
  { id: 'calendario', name: 'Calendario', category: 'Operaciones' },
  { id: 'rendimiento-programado', name: 'Análisis de Cumplimiento', category: 'Operaciones' },
  { id: 'prospecciones', name: 'Prospecciones', category: 'Ventas' },
  { id: '80-20', name: '80/20', category: 'Ventas' },
  { id: 'proyecto', name: 'Proyecto', category: 'Ventas' },
  { id: 'carreras', name: 'Carreras', category: 'Ventas' }
];

export default function AdminSettingsView() {
  const [permissions, setPermissions] = useState(() => {
    const saved = localStorage.getItem('TROFEX_USER_PERMISSIONS_CONFIG');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    // Configuración por defecto de permisos por rol
    return {
      store: {
        dashboard: true,
        productos: false,
        tendencias: false,
        tareas: true,
        vales: true,
        'analisis-rendimiento': false,
        calendario: true,
        'rendimiento-programado': false,
        prospecciones: true,
        '80-20': true,
        proyecto: true,
        carreras: true
      },
      diseno: {
        dashboard: false,
        productos: false,
        tendencias: false,
        tareas: false,
        vales: true,
        'analisis-rendimiento': false,
        calendario: true,
        'rendimiento-programado': false,
        prospecciones: false,
        '80-20': false,
        proyecto: false,
        carreras: false
      }
    };
  });

  useEffect(() => {
    localStorage.setItem('TROFEX_USER_PERMISSIONS_CONFIG', JSON.stringify(permissions));
  }, [permissions]);

  const togglePermission = (role, viewId) => {
    setPermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [viewId]: !prev[role][viewId]
      }
    }));
  };

  const resetToDefault = () => {
    if (window.confirm('¿Deseas restaurar los accesos predeterminados?')) {
      const defaults = {
        store: {
          dashboard: true,
          productos: false,
          tendencias: false,
          tareas: true,
          vales: true,
          'analisis-rendimiento': false,
          calendario: true,
          'rendimiento-programado': false,
          prospecciones: true,
          '80-20': true,
          proyecto: true,
          carreras: true
        },
        diseno: {
          dashboard: false,
          productos: false,
          tendencias: false,
          tareas: false,
          vales: true,
          'analisis-rendimiento': false,
          calendario: true,
          'rendimiento-programado': false,
          prospecciones: false,
          '80-20': false,
          proyecto: false,
          carreras: false
        }
      };
      setPermissions(defaults);
      alert('Accesos restaurados.');
    }
  };

  return (
    <div className="view-section active" style={{ background: '#f8fafc', minHeight: '100%', padding: '24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* ===== HEADER ===== */}
        <div style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
          borderRadius: '16px', padding: '24px 32px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0 4px 20px rgba(30,27,75,0.25)'
        }}>
          <div>
            <h2 style={{ color: '#fff', fontWeight: '900', fontSize: '20px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fas fa-user-shield"></i> Panel de Control de Accesos
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', margin: '4px 0 0', fontSize: '13px' }}>
              Configura qué módulos y pestañas puede visualizar cada tipo de perfil en el CRM
            </p>
          </div>
          <button
            onClick={resetToDefault}
            className="topbar-btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', color: '#fff', borderColor: 'rgba(255,255,255,0.3)', background: 'transparent', fontWeight: '700', cursor: 'pointer' }}
          >
            <i className="fas fa-undo"></i> Restaurar Valores
          </button>
        </div>

        {/* ===== CONTENEDOR CONFIGURADOR ===== */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          
          {/* PERFIL ASESOR TIENDAS */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px' }}>
              <div style={{ width: '42px', height: '42px', background: 'rgba(255,109,77,0.1)', color: '#ff6d4d', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                <i className="fas fa-store"></i>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>Perfil: Asesor de Tiendas</h3>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Rol: `store`</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {MENU_ITEMS.map(item => {
                const isAllowed = permissions.store[item.id] !== false;
                return (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#fafafa', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{item.name}</div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', marginTop: '2px' }}>Categoría: {item.category}</div>
                    </div>
                    
                    <button
                      onClick={() => togglePermission('store', item.id)}
                      style={{
                        padding: '6px 14px', borderRadius: '8px', border: 'none', fontSize: '11px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s',
                        background: isAllowed ? '#dcfce7' : '#fee2e2',
                        color: isAllowed ? '#15803d' : '#b91c1c'
                      }}
                    >
                      {isAllowed ? '✓ Visible' : '✕ Oculto'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PERFIL DISEÑADOR */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px' }}>
              <div style={{ width: '42px', height: '42px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                <i className="fas fa-palette"></i>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>Perfil: Diseñador</h3>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Rol: `diseno`</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {MENU_ITEMS.map(item => {
                const isAllowed = permissions.diseno[item.id] !== false;
                return (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#fafafa', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>{item.name}</div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', marginTop: '2px' }}>Categoría: {item.category}</div>
                    </div>
                    
                    <button
                      onClick={() => togglePermission('diseno', item.id)}
                      style={{
                        padding: '6px 14px', borderRadius: '8px', border: 'none', fontSize: '11px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s',
                        background: isAllowed ? '#dcfce7' : '#fee2e2',
                        color: isAllowed ? '#15803d' : '#b91c1c'
                      }}
                    >
                      {isAllowed ? '✓ Visible' : '✕ Oculto'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
