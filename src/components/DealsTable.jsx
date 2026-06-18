import { useState } from 'react';

export default function DealsTable({ 
  deals, 
  stages, 
  users, 
  customers, 
  onEditDeal, 
  onDeleteDeal,
  title = "Gestor de Oportunidades",
  showStageFilter = true,
  iconClass = "fas fa-list",
  accentColor = "var(--accent-blue)"
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStage, setFilterStage] = useState('all');

  const getCustomer = (id) => customers.find(c => c.id === id) || {};
  const getUser = (id) => users.find(u => u.id === id) || {};
  const getStage = (id) => stages.find(s => s.id === id) || {};

  const formatCurrency = (val) => {
    if (val >= 1_000_000) return 'Q' + (val / 1_000_000).toFixed(2) + 'M';
    if (val >= 1_000)     return 'Q' + (val / 1_000).toFixed(1) + 'k';
    return 'Q' + val.toFixed(0);
  };

  // Filter and sort deals
  const filteredDeals = (() => {
    let d = [...deals];
    
    if (filterStatus !== 'all') {
      d = d.filter(x => x.status === filterStatus);
    }
    
    if (filterStage !== 'all') {
      d = d.filter(x => x.stage_id === filterStage);
    }
    
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      d = d.filter(x => {
        const cust = getCustomer(x.customer_id);
        return x.title.toLowerCase().includes(q) ||
               (cust.company_name || '').toLowerCase().includes(q);
      });
    }
    
    // Sort: open first, then by amount desc
    d.sort((a, b) => {
      const order = { open: 0, won: 1, lost: 2 };
      if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
      return b.amount - a.amount;
    });
    
    return d;
  })();

  return (
    <div className="card table-card">
      <div className="table-card-header">
        <div className="card-title">
          <i className={iconClass} style={{ color: accentColor }}></i>
          {title}
          <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '6px' }}>
            · edita y los KPIs se actualizarán al momento
          </span>
        </div>
        
        <div className="table-controls">
          <div className="search-wrap">
            <i className="fas fa-search"></i>
            <input
              type="text"
              className="search-input"
              placeholder="Buscar oportunidad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <select
            className="select-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Todos los estados</option>
            <option value="open">Abiertos</option>
            <option value="won">Ganados</option>
            <option value="lost">Perdidos</option>
          </select>
          
          {showStageFilter && (
            <select
              className="select-filter"
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
            >
              <option value="all">Todas las etapas</option>
              {stages.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>
      
      <div className="table-responsive">
        <table className="deals-table" role="grid" aria-label="Tabla de oportunidades">
          <thead>
            <tr>
              <th scope="col">Oportunidad</th>
              <th scope="col">Responsable</th>
              <th scope="col">Etapa</th>
              <th scope="col">Importe</th>
              <th scope="col">Estado</th>
              <th scope="col">Fecha</th>
              <th scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody id="deals-tbody">
            {filteredDeals.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state">
                  <i className="fas fa-search"></i>
                  <br />
                  No se encontraron oportunidades
                </td>
              </tr>
            ) : (
              filteredDeals.map(d => {
                const cust = getCustomer(d.customer_id);
                const owner = getUser(d.owner_id);
                const stage = getStage(d.stage_id);
                
                const statusClass = { won: 'status-won', lost: 'status-lost', open: 'status-open' }[d.status] || '';
                const statusLabel = { won: 'Ganado', lost: 'Perdido', open: 'Abierto' }[d.status] || d.status;
                
                const date = d.closed_at
                  ? new Date(d.closed_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })
                  : (d.expected_close_date ? d.expected_close_date.slice(0, 10) : '—');
                  
                return (
                  <tr key={d.id} className="deal-row">
                    <td>
                      <div class="deal-title-cell">
                        <span className="deal-name">{d.title}</span>
                        <span className="deal-company">{cust.company_name || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="rep-cell">
                        <img src={owner.avatar_url || ''} alt={owner.full_name || ''} />
                        <span>{owner.full_name || '—'}</span>
                      </div>
                    </td>
                    <td>
                      <span className="stage-badge" style={{ background: `${stage.color}22`, color: stage.color }}>
                        {stage.name || '—'}
                      </span>
                    </td>
                    <td className="amount-cell">{formatCurrency(d.amount)}</td>
                    <td>
                      <span className={`status-badge ${statusClass}`}>{statusLabel}</span>
                    </td>
                    <td className="date-cell">{date}</td>
                    <td className="actions-cell">
                      <button
                        className="action-btn edit-btn"
                        title="Editar"
                        onClick={() => onEditDeal(d.id)}
                      >
                        <i className="fas fa-pencil-alt"></i>
                      </button>
                      <button
                        className="action-btn delete-btn"
                        title="Eliminar"
                        onClick={() => onDeleteDeal(d.id)}
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
