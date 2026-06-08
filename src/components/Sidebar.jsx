import React from 'react';

export default function Sidebar({ currentView, setView, openCount, onLogout, userRole, activeStore }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-th-large', section: 'Principal' },
    { id: 'tareas', label: 'Tareas', icon: 'fas fa-tasks', section: 'Principal' },
    { id: 'calendario', label: 'Calendario', icon: 'fas fa-calendar-alt', section: 'Operaciones Administrativas' },
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
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon" style={{
          background: 'linear-gradient(135deg, #d32f2f 50%, #111111 50%)',
          boxShadow: '0 4px 12px rgba(211, 47, 47, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '9px'
        }}>
          {/* Trophy SVG */}
          <svg viewBox="0 0 24 24" width="20" height="20" fill="#FFFFFF">
            <path d="M19 2H5c-1.1 0-2 .9-2 2v3c0 2.2 1.8 4 4 4h1.2c.6 1.8 2.2 3.2 4.1 3.7V18H9c-1.1 0-2 .9-2 2v2h10v-2c0-1.1-.9-2-2-2h-3.3v-3.3c1.9-.5 3.5-1.9 4.1-3.7H17c2.2 0 4-1.8 4-4V4c0-1.1-.9-2-2-2zm-12 7c-1.1 0-2-.9-2-2V4h4v3c0 1.1-.9 2-2 2zm10 0c-1.1 0-2-.9-2-2V4h4v3c0 1.1-.9 2-2 2z" />
          </svg>
        </div>
        <div className="sidebar-brand-name" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Trofex
          <span style={{ color: '#d32f2f', fontSize: '9px', fontWeight: '800', letterSpacing: '1px', marginTop: '2px' }}>
            Trofeos y Más
          </span>
        </div>
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

