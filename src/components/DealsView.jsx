import DealsTable from './DealsTable';

export default function DealsView({ deals, stages, users, customers, onEditDeal, onDeleteDeal }) {
  return (
    <div className="view-section active" id="view-deals">
      <p className="section-label">Todas las oportunidades</p>
      <DealsTable
        deals={deals}
        stages={stages}
        users={users}
        customers={customers}
        onEditDeal={onEditDeal}
        onDeleteDeal={onDeleteDeal}
        title="Gestión Completa de Oportunidades"
        showStageFilter={false}
        iconClass="fas fa-handshake"
        accentColor="var(--accent-coral)"
      />
    </div>
  );
}
