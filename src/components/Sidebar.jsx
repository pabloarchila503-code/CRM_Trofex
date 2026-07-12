import logoImg from '../assets/logo.png';

export default function Sidebar({ currentView, setView, openCount, onLogout, userRole, selectedStores, userName }) {
  const profileName = userName ? userName : (userRole === 'admin' ? 'Administrador' : (userRole === 'exportador' ? 'Exportador' : (userRole === 'diseno' ? 'Diseñador' : (selectedStores.length >= 14 ? 'Red General' : (selectedStores.length > 1 ? 'Múltiples Tiendas' : `Asesor Tienda ${selectedStores[0]}`)))));
  const profileRole = userRole === 'admin' ? 'Administrador' : (userRole === 'exportador' ? 'Exportador / Logística' : (userRole === 'diseno' ? 'Diseño e Imagen' : 'Asesor de Ventas'));
  const profileAvatar = userRole === 'admin' 
    ? 'https://i.pravatar.cc/150?u=rafael' 
    : (userRole === 'exportador'
      ? 'https://api.dicebear.com/7.x/initials/svg?seed=exportador&backgroundColor=10b981'
      : (userRole === 'diseno' 
        ? 'https://api.dicebear.com/7.x/initials/svg?seed=diseno&backgroundColor=3b82f6'
        : `https://api.dicebear.com/7.x/initials/svg?seed=${selectedStores[0] || 'CB'}&backgroundColor=ff6d4d`));

  // Cargar configuración de permisos desde localStorage
  const getPermissions = () => {
    const saved = localStorage.getItem('TROFEX_USER_PERMISSIONS_CONFIG');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    // Valores predeterminados
    return {
      store: {
        dashboard: true, productos: false, tendencias: false, tareas: true, vales: true,
        'analisis-rendimiento': false, calendario: true, 'rendimiento-programado': false,
        prospecciones: true, '80-20': true, proyecto: true, carreras: true
      },
      diseno: {
        dashboard: false, productos: false, tendencias: false, tareas: false, vales: true,
        'analisis-rendimiento': false, calendario: true, 'rendimiento-programado': false,
        prospecciones: false, '80-20': false, proyecto: false, carreras: false
      },
      exportador: {
        dashboard: true, productos: false, tendencias: false, tareas: false, vales: false,
        'analisis-rendimiento': false, calendario: true, 'rendimiento-programado': false,
        prospecciones: false, '80-20': false, proyecto: false, carreras: false
      }
    };
  };

  const perms = getPermissions();

  // Función para determinar si una pestaña debe ser visible para el rol actual
  const isVisible = (viewId) => {
    if (userRole === 'admin') return true; // Admin ve todo
    if (userRole === 'exportador') {
      return perms.exportador ? perms.exportador[viewId] !== false : (viewId === 'calendario' || viewId === 'dashboard');
    }
    if (userRole === 'diseno') return perms.diseno[viewId] !== false;
    return perms.store[viewId] !== false; // por defecto 'store'
  };

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand" style={{ padding: '16px 15px', justifyContent: 'center', display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <img 
          src={logoImg} 
          alt="Trofex Logo" 
          style={{ maxWidth: '100%', maxHeight: '42px', objectFit: 'contain' }} 
        />
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {/* SECTION: Principal */}
        {(isVisible('dashboard') || (userRole === 'admin' && (isVisible('productos') || isVisible('tendencias')))) && (
          <span className="nav-section-title">Principal</span>
        )}
        
        {isVisible('dashboard') && (
          <a
            href="#"
            className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); setView('dashboard'); }}
          >
            <i className="fas fa-th-large"></i>
            <span>Dashboard</span>
          </a>
        )}

        {userRole === 'admin' && (
          <>
            {isVisible('productos') && (
              <a
                href="#"
                className={`nav-item ${currentView === 'productos' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setView('productos'); }}
              >
                <i className="fas fa-box-open"></i>
                <span>Tendencia de Producto</span>
              </a>
            )}
            {isVisible('tendencias') && (
              <a
                href="#"
                className={`nav-item ${currentView === 'tendencias' ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); setView('tendencias'); }}
              >
                <i className="fas fa-chart-area"></i>
                <span>Histórico de Productos Vendidos</span>
              </a>
            )}
          </>
        )}

        {/* SECTION: Tareas */}
        {(isVisible('tareas') || isVisible('vales') || (userRole === 'admin' && isVisible('analisis-rendimiento'))) && (
          <span className="nav-section-title">Tareas</span>
        )}

        {isVisible('tareas') && (
          <a
            href="#"
            className={`nav-item ${currentView === 'tareas' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); setView('tareas'); }}
          >
            <i className="fas fa-tasks"></i>
            <span>Tareas</span>
          </a>
        )}

        {isVisible('vales') && (
          <a
            href="#"
            className={`nav-item ${currentView === 'vales' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); setView('vales'); }}
          >
            <i className="fas fa-palette"></i>
            <span>Vales de Artes</span>
          </a>
        )}

        {userRole === 'admin' && isVisible('analisis-rendimiento') && (
          <a
            href="#"
            className={`nav-item ${currentView === 'analisis-rendimiento' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); setView('analisis-rendimiento'); }}
          >
            <i className="fas fa-chart-pie"></i>
            <span>Análisis de Rendimiento</span>
          </a>
        )}

        {/* SECTION: Operaciones Administrativas */}
        {(isVisible('calendario') || (userRole === 'admin' && isVisible('rendimiento-programado'))) && (
          <span className="nav-section-title">Operaciones Administrativas</span>
        )}

        {isVisible('calendario') && (
          <a
            href="#"
            className={`nav-item ${currentView === 'calendario' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); setView('calendario'); }}
          >
            <i className="fas fa-calendar-alt"></i>
            <span>Calendario</span>
          </a>
        )}

        {userRole === 'admin' && isVisible('rendimiento-programado') && (
          <a
            href="#"
            className={`nav-item ${currentView === 'rendimiento-programado' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); setView('rendimiento-programado'); }}
          >
            <i className="fas fa-chart-line"></i>
            <span>Análisis de Cumplimiento</span>
          </a>
        )}

        {/* SECTION: Ventas */}
        {(isVisible('prospecciones') || isVisible('80-20') || isVisible('proyecto') || isVisible('carreras')) && (
          <span className="nav-section-title">Ventas</span>
        )}

        {isVisible('prospecciones') && (
          <a
            href="#"
            className={`nav-item ${currentView === 'prospecciones' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); setView('prospecciones'); }}
          >
            <i className="fas fa-handshake"></i>
            <span>Prospecciones</span>
            {openCount > 0 && (
              <span className="nav-badge" id="open-count">{openCount}</span>
            )}
          </a>
        )}

        {isVisible('80-20') && (
          <a
            href="#"
            className={`nav-item ${currentView === '80-20' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); setView('80-20'); }}
          >
            <i className="fas fa-percentage"></i>
            <span>80/20</span>
          </a>
        )}

        {isVisible('proyecto') && (
          <a
            href="#"
            className={`nav-item ${currentView === 'proyecto' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); setView('proyecto'); }}
          >
            <i className="fas fa-project-diagram"></i>
            <span>Proyecto</span>
          </a>
        )}

        {isVisible('carreras') && (
          <a
            href="#"
            className={`nav-item ${currentView === 'carreras' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); setView('carreras'); }}
          >
            <i className="fas fa-store-alt"></i>
            <span>Carreras</span>
          </a>
        )}
        
        {userRole === 'admin' && (
          <>
            <span className="nav-section-title">Ajustes</span>
            <a
              href="#"
              className={`nav-item ${currentView === 'admin-settings' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); setView('admin-settings'); }}
            >
              <i className="fas fa-user-shield"></i>
              <span>Panel Administrador</span>
            </a>
          </>
        )}
      </nav>

      {/* Footer (User) */}
      <div className="sidebar-footer">
        <img src={profileAvatar} alt={profileName} style={{ borderRadius: '50%', objectFit: 'cover' }} />
        <div className="sidebar-footer-info">
          <div className="sidebar-footer-name" title={profileName}>{profileName}</div>
          <div className="sidebar-footer-role">{profileRole}</div>
        </div>
        <i className="fas fa-sign-out-alt logout-btn" title="Cerrar sesión" onClick={onLogout}></i>
      </div>
    </aside>
  );
}
