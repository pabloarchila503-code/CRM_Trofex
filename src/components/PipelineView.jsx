import { BigPipelineChart } from './Charts';
import DealsTable from './DealsTable';

export default function PipelineView({ deals, stages, users, customers, onEditDeal, onDeleteDeal }) {
  const getCustomer = (id) => customers.find(c => c.id === id) || {};
  const getUser = (id) => users.find(u => u.id === id) || {};

  const formatCurrency = (val) => {
    if (val >= 1_000_000) return 'Q' + (val / 1_000_000).toFixed(2) + 'M';
    if (val >= 1_000)     return 'Q' + (val / 1_000).toFixed(1) + 'k';
    return 'Q' + val.toFixed(0);
  };

  return (
    <div className="view-section active" id="view-pipeline">
      <p className="section-label">Vista del Pipeline por Etapa</p>

      {/* Pipeline Kanban */}
      <div id="pipeline-kanban" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', alignItems: 'start' }}>
        {stages.map(stage => {
          const stageDeals = deals.filter(d => d.stage_id === stage.id);
          const total = stageDeals.reduce((s, d) => s + d.amount, 0);
          const visibleDeals = stageDeals.slice(0, 6);
          const moreCount = stageDeals.length > 6 ? stageDeals.length - 6 : 0;

          return (
            <div key={stage.id} className="kanban-column">
              <div className="kanban-col-header" style={{ borderTop: `3px solid ${stage.color}` }}>
                <div className="kanban-col-name">{stage.name}</div>
                <div className="kanban-col-meta">
                  <span className="kanban-count">{stageDeals.length}</span>
                  <span className="kanban-total">{formatCurrency(total)}</span>
                </div>
              </div>
              <div className="kanban-cards">
                {visibleDeals.map(d => {
                  const cust = getCustomer(d.customer_id);
                  const owner = getUser(d.owner_id);
                  
                  const statusClass = { won: 'status-won', lost: 'status-lost', open: 'status-open' }[d.status] || '';
                  const statusLabel = { won: 'Ganado', lost: 'Perdido', open: 'Abierto' }[d.status] || d.status;

                  return (
                    <div key={d.id} className="kanban-card">
                      <div className="kanban-card-title">{d.title}</div>
                      <div className="kanban-card-company">{cust.company_name || '—'}</div>
                      <div className="kanban-card-footer">
                        <img src={owner.avatar_url || ''} alt={owner.full_name || ''} className="kanban-avatar" />
                        <span className={`status-badge ${statusClass}`} style={{ fontSize: '9px', padding: '2px 7px' }}>
                          {statusLabel}
                        </span>
                        <span className="kanban-amount">{formatCurrency(d.amount)}</span>
                      </div>
                    </div>
                  );
                })}
                {moreCount > 0 && (
                  <div className="kanban-more">+{moreCount} más</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pipeline Chart Big */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Valor Total del Pipeline por Etapa</div>
            <div className="card-subtitle">Suma de todos los deals en cada etapa</div>
          </div>
        </div>
        <div className="chart-wrap">
          <div style={{ height: '280px' }}>
            <BigPipelineChart deals={deals} stages={stages} />
          </div>
        </div>
      </div>

      {/* Relocated Deals Table */}
      <div style={{ marginTop: '24px' }}>
        <DealsTable
          deals={deals}
          stages={stages}
          users={users}
          customers={customers}
          onEditDeal={onEditDeal}
          onDeleteDeal={onDeleteDeal}
          title="Gestor de Oportunidades"
          showStageFilter={true}
          iconClass="fas fa-list"
          accentColor="var(--accent-blue)"
        />
      </div>
    </div>
  );
}
