import React from 'react';
import logoImg from '../assets/logo.png';

export default function Sidebar({ currentView, setView, openCount, onLogout, userRole, activeStore }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-th-large', section: 'Principal' },
    { id: 'tareas', label: 'Tareas', icon: 'fas fa-tasks', section: 'Principal' },
    { id: 'calendario', label: 'Calendario', icon: 'fas fa-calendar-alt', section: 'Operaciones Administrativas' },
    { id: 'rendimiento-programado', label: 'Rendimiento Programado', icon: 'fas fa-chart-line', section: 'Operaciones Administrativas' },
    { id: 'prospecciones', label: 'Prospecciones', icon: 'fas fa-handshake', section: 'Ventas', badge: true },
    { id: '80-20', label: '80/20', icon: 'fas fa-percentage', section: 'Ventas' },
    { id: 'proyecto', label: 'Proyecto', icon: 'fas fa-project-diagram', section: 'Ventas' },
    { id: 'carreras', label: 'Carreras', icon: 'fas fa-store-alt', section: 'Ventas' }
  ];

  // Group items by section
  const sections = ['Principal', 'Operaciones Administrativas', 'Ventas'];

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
        {sections.map(sec => {
          const items = navItems.filter(item => item.section === sec);
          return (
            <React.Fragment key={sec}>
              <span className="nav-section-title">{sec}</span>
              {items.map(item => {
                const isActive = item.id === currentView;
                const handleClick = (e) => {
                  e.preventDefault();
                  if (!item.disabled) {
                    setView(item.id);
                  }
                };

                return (
                  <a
                    key={item.id}
                    href="#"
                    className={`nav-item ${isActive ? 'active' : ''} ${item.disabled ? 'disabled-nav-item' : ''}`}
                    onClick={handleClick}
                    style={item.disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                  >
                    <i className={item.icon}></i>
                    <span>{item.label}</span>
                    {item.badge && openCount > 0 && (
                      <span className="nav-badge" id="open-count">{openCount}</span>
                    )}
                  </a>
                );
              })}
            </React.Fragment>
          );
        })}
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

