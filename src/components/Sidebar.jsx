import logoImg from '../assets/logo.png';

export default function Sidebar({ currentView, setView, openCount, onLogout, userRole, activeStore }) {
  const profileName = userRole === 'admin' ? 'Rafael Herrera' : `Asesor Tienda ${activeStore}`;
  const profileRole = userRole === 'admin' ? 'Administrador' : 'Asesor de Ventas';
  const profileAvatar = userRole === 'admin' 
    ? 'https://i.pravatar.cc/150?u=rafael' 
    : `https://api.dicebear.com/7.x/initials/svg?seed=${activeStore}&backgroundColor=ff6d4d`;

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
        <span className="nav-section-title">Principal</span>
        <a
          href="#"
          className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={(e) => { e.preventDefault(); setView('dashboard'); }}
        >
          <i className="fas fa-th-large"></i>
          <span>Dashboard</span>
        </a>

        {/* SECTION: Tareas */}
        <span className="nav-section-title">Tareas</span>
        <a
          href="#"
          className={`nav-item ${currentView === 'tareas' ? 'active' : ''}`}
          onClick={(e) => { e.preventDefault(); setView('tareas'); }}
        >
          <i className="fas fa-tasks"></i>
          <span>Tareas</span>
        </a>

        {/* SECTION: Operaciones Administrativas */}
        <span className="nav-section-title">Operaciones Administrativas</span>
        <a
          href="#"
          className={`nav-item ${currentView === 'calendario' ? 'active' : ''}`}
          onClick={(e) => { e.preventDefault(); setView('calendario'); }}
        >
          <i className="fas fa-calendar-alt"></i>
          <span>Calendario</span>
        </a>
        <a
          href="#"
          className={`nav-item ${currentView === 'rendimiento-programado' ? 'active' : ''}`}
          onClick={(e) => { e.preventDefault(); setView('rendimiento-programado'); }}
        >
          <i className="fas fa-chart-line"></i>
          <span>Análisis de Cumplimiento</span>
        </a>

        {/* SECTION: Ventas */}
        <span className="nav-section-title">Ventas</span>
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
        <a
          href="#"
          className={`nav-item ${currentView === '80-20' ? 'active' : ''}`}
          onClick={(e) => { e.preventDefault(); setView('80-20'); }}
        >
          <i className="fas fa-percentage"></i>
          <span>80/20</span>
        </a>
        <a
          href="#"
          className={`nav-item ${currentView === 'proyecto' ? 'active' : ''}`}
          onClick={(e) => { e.preventDefault(); setView('proyecto'); }}
        >
          <i className="fas fa-project-diagram"></i>
          <span>Proyecto</span>
        </a>
        <a
          href="#"
          className={`nav-item ${currentView === 'carreras' ? 'active' : ''}`}
          onClick={(e) => { e.preventDefault(); setView('carreras'); }}
        >
          <i className="fas fa-store-alt"></i>
          <span>Carreras</span>
        </a>
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

