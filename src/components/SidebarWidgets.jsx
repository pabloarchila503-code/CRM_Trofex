
// Helper to format currency
const formatCurrency = (val) => {
  if (val >= 1_000_000) return 'Q' + (val / 1_000_000).toFixed(2) + 'M';
  if (val >= 1_000)     return 'Q' + (val / 1_000).toFixed(1) + 'k';
  return 'Q' + val.toFixed(0);
};

// ── 1. Top Deals Ganados ─────────────────────────────────────────────
export function TopDeals({ deals, customers, users }) {
  const getCustomer = (id) => customers.find(c => c.id === id) || {};
  const getUser = (id) => users.find(u => u.id === id) || {};

  const top = [...deals]
    .filter(d => d.status === 'won')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  if (top.length === 0) {
    return (
      <div className="card">
        <div className="card-header" style={{ paddingBottom: '12px' }}>
          <div className="card-title">
            <i className="fas fa-star" style={{ color: 'var(--accent-orange)', fontSize: '12px' }}></i>
            Top Deals Ganados
          </div>
        </div>
        <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
          No hay deals ganados aún.
        </div>
      </div>
    );
  }

  const maxAmt = top[0].amount;
  const colors = ['#FF6D4D', '#F59E0B', '#10B981', '#60A5FA', '#8B5CF6'];

  return (
    <div className="card">
      <div className="card-header" style={{ paddingBottom: '12px' }}>
        <div className="card-title">
          <i className="fas fa-star" style={{ color: 'var(--accent-orange)', fontSize: '12px' }}></i>
          Top Deals Ganados
        </div>
      </div>
      <div id="top-deals-list">
        {top.map((d, i) => {
          const cust = getCustomer(d.customer_id);
          const owner = getUser(d.owner_id);
          const pct = maxAmt > 0 ? ((d.amount / maxAmt) * 100).toFixed(0) : 0;
          return (
            <div key={d.id} className="top-deal-item">
              <div className="top-deal-rank" style={{ background: `${colors[i]}22`, color: colors[i] }}>
                {i + 1}
              </div>
              <div className="top-deal-info">
                <div className="top-deal-title">{d.title}</div>
                <div className="top-deal-company">
                  {cust.company_name || '—'} · {owner.full_name || '—'}
                </div>
                <div className="top-deal-bar-wrap">
                  <div className="top-deal-bar" style={{ width: `${pct}%`, background: colors[i] }}></div>
                </div>
              </div>
              <div className="top-deal-amount">{formatCurrency(d.amount)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 2. Leads Recientes ────────────────────────────────────────────────
export function RecentLeads({ deals, customers, users, stages }) {
  const getCustomer = (id) => customers.find(c => c.id === id) || {};
  const getUser = (id) => users.find(u => u.id === id) || {};
  const getStage = (id) => stages.find(s => s.id === id) || {};

  const recent = [...deals]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 6);

  return (
    <div className="card">
      <div className="card-header" style={{ paddingBottom: '12px' }}>
        <div className="card-title">
          <i className="fas fa-user-plus" style={{ color: 'var(--accent-blue)', fontSize: '12px' }}></i>
          Leads Recientes
        </div>
      </div>
      <div id="recent-leads-list">
        {recent.map(d => {
          const cust = getCustomer(d.customer_id);
          const owner = getUser(d.owner_id);
          const stage = getStage(d.stage_id);
          return (
            <div key={d.id} className="lead-item">
              <img src={owner.avatar_url} alt={owner.full_name} className="lead-avatar" />
              <div className="lead-info">
                <div className="lead-name">{cust.contact_person || '—'}</div>
                <div className="lead-company">{cust.company_name || '—'}</div>
              </div>
              <span
                className="stage-badge small"
                style={{ background: `${stage.color}22`, color: stage.color }}
              >
                {stage.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 3. Rendimiento del Equipo ──────────────────────────────────────────
export function TeamPerformance({ deals, users }) {
  const reps = users.filter(u => u.role === 'sales_rep');

  const repStats = reps
    .map(u => {
      const myDeals = deals.filter(d => d.owner_id === u.id);
      const won = myDeals.filter(d => d.status === 'won');
      const revenue = won.reduce((s, d) => s + d.amount, 0);
      const quota = u.quota_amount;
      const pct = quota > 0 ? Math.min((revenue / quota) * 100, 100).toFixed(0) : 0;
      return { ...u, revenue, quota, pct: Number(pct), wonCount: won.length };
    })
    .sort((a, b) => b.revenue - a.revenue);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="card">
      <div className="card-header" style={{ paddingBottom: '12px' }}>
        <div className="card-title">
          <i className="fas fa-users" style={{ color: 'var(--accent-purple)', fontSize: '12px' }}></i>
          Rendimiento del Equipo
        </div>
      </div>
      <div id="team-performance-list">
        {repStats.map((r, i) => {
          const medal = medals[i] || '';
          const barColor = r.pct >= 80 ? '#10B981' : r.pct >= 50 ? '#F59E0B' : '#EF4444';
          return (
            <div key={r.id} className="team-item">
              <img src={r.avatar_url} alt={r.full_name} className="team-avatar" />
              <div className="team-info">
                <div className="team-name">
                  {medal && <span style={{ marginRight: '4px' }}>{medal}</span>}
                  {r.full_name}
                </div>
                <div className="team-bar-row">
                  <div className="team-bar-wrap">
                    <div className="team-bar" style={{ width: `${r.pct}%`, background: barColor }}></div>
                  </div>
                  <span className="team-pct" style={{ color: barColor }}>
                    {r.pct}%
                  </span>
                </div>
              </div>
              <div className="team-revenue">{formatCurrency(r.revenue)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
