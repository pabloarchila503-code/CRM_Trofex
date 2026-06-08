/**
 * app.js — CRM Dashboard MVP · Main Application Logic
 * =====================================================
 * Handles: KPI calculation, Chart.js rendering, table rendering,
 * add/edit/delete deal CRUD, and real-time DOM updates.
 */

/* ============================================================
   STATE
============================================================ */
let deals = JSON.parse(JSON.stringify(window.mockData.deals));
const { users, stages, customers } = window.mockData;

let chartInstances = {};
let editingDealId = null;
let activeFilterStatus = 'all';
let activeFilterStage = 'all';
let searchQuery = '';

/* ============================================================
   HELPERS
============================================================ */
function formatCurrency(n) {
  if (n >= 1_000_000) return '€' + (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000)     return '€' + (n / 1_000).toFixed(1) + 'k';
  return '€' + n.toFixed(0);
}

function getUser(id)     { return users.find(u => u.id === id) || {}; }
function getStage(id)    { return stages.find(s => s.id === id) || {}; }
function getCustomer(id) { return customers.find(c => c.id === id) || {}; }

function getMonthLabel(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
}

/* ============================================================
   KPI CALCULATIONS
============================================================ */
function calcKPIs() {
  const wonDeals  = deals.filter(d => d.status === 'won');
  const lostDeals = deals.filter(d => d.status === 'lost');
  const openDeals = deals.filter(d => d.status === 'open');
  const closedDeals = wonDeals.concat(lostDeals);

  const totalRevenue = wonDeals.reduce((s, d) => s + d.amount, 0);
  const activeDeals  = openDeals.length;
  const winRate      = closedDeals.length > 0
    ? (wonDeals.length / closedDeals.length) * 100
    : 0;
  const avgDealSize  = wonDeals.length > 0
    ? totalRevenue / wonDeals.length
    : 0;

  // Previous month comparison (simulate +/- trend)
  const now = new Date();
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0);
  const prevWon = deals.filter(d => {
    if (d.status !== 'won' || !d.closed_at) return false;
    const cd = new Date(d.closed_at);
    return cd >= prevMonthStart && cd <= prevMonthEnd;
  });
  const prevRevenue = prevWon.reduce((s, d) => s + d.amount, 0);
  const revTrend = prevRevenue > 0
    ? ((totalRevenue - prevRevenue) / prevRevenue) * 100
    : 12;

  return { totalRevenue, activeDeals, winRate, avgDealSize, revTrend };
}

/* ============================================================
   RENDER KPIs
============================================================ */
function renderKPIs() {
  const { totalRevenue, activeDeals, winRate, avgDealSize, revTrend } = calcKPIs();

  animateCount('kpi-revenue',  totalRevenue, v => formatCurrency(v));
  animateCount('kpi-active',   activeDeals,  v => Math.round(v));
  animateCount('kpi-winrate',  winRate,      v => v.toFixed(1) + '%');
  animateCount('kpi-avgsize',  avgDealSize,  v => formatCurrency(v));

  // Revenue trend badge
  const trendEl = document.getElementById('kpi-revenue-trend');
  if (trendEl) {
    const positive = revTrend >= 0;
    trendEl.className = 'kpi-trend ' + (positive ? 'positive' : 'negative');
    trendEl.innerHTML = `<i class="fas fa-arrow-${positive ? 'up' : 'down'}"></i> ${Math.abs(revTrend).toFixed(1)}%`;
  }
}

function animateCount(id, target, formatter) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = 0;
  const duration = 900;
  const startTime = performance.now();
  function step(now) {
    const t = Math.min((now - startTime) / duration, 1);
    const ease = t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
    el.textContent = formatter(start + (target - start) * ease);
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ============================================================
   CHART — Revenue by Pipeline Stage (Bar)
============================================================ */
function buildPipelineChart() {
  const ctx = document.getElementById('pipelineChart');
  if (!ctx) return;

  // Sum amounts by stage (only open + won for pipeline view)
  const stageMap = {};
  stages.forEach(s => { stageMap[s.id] = { name: s.name, total: 0, color: s.color }; });
  deals.forEach(d => {
    if (stageMap[d.stage_id]) stageMap[d.stage_id].total += d.amount;
  });

  const labels = stages.map(s => s.name);
  const values = stages.map(s => stageMap[s.id].total);
  const colors = stages.map(s => s.color);

  if (chartInstances.pipeline) { chartInstances.pipeline.destroy(); }

  chartInstances.pipeline = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Valor del Pipeline (€)',
        data: values,
        backgroundColor: colors.map(c => c + 'CC'),
        borderColor: colors,
        borderWidth: 2,
        borderRadius: 10,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ' ' + formatCurrency(ctx.raw)
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#64748B', font: { family: 'Inter', size: 11, weight: '600' } }
        },
        y: {
          grid: { color: '#F1F5F9' },
          ticks: {
            color: '#64748B',
            font: { family: 'Inter', size: 11 },
            callback: v => formatCurrency(v)
          }
        }
      }
    }
  });
}

/* ============================================================
   CHART — Sales Evolution (Line)
============================================================ */
function buildTrendChart() {
  const ctx = document.getElementById('trendChart');
  if (!ctx) return;

  // Group won revenue by month
  const monthMap = {};
  deals.filter(d => d.status === 'won' && d.closed_at).forEach(d => {
    const key = getMonthLabel(d.closed_at);
    monthMap[key] = (monthMap[key] || 0) + d.amount;
  });

  // Sort by date
  const allDates = deals
    .filter(d => d.status === 'won' && d.closed_at)
    .map(d => new Date(d.closed_at));
  allDates.sort((a, b) => a - b);

  const orderedLabels = [];
  allDates.forEach(d => {
    const label = d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
    if (!orderedLabels.includes(label)) orderedLabels.push(label);
  });

  const values = orderedLabels.map(k => monthMap[k] || 0);

  if (chartInstances.trend) { chartInstances.trend.destroy(); }

  // Gradient fill
  const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, 'rgba(255, 109, 77, 0.35)');
  gradient.addColorStop(1, 'rgba(255, 109, 77, 0.02)');

  chartInstances.trend = new Chart(ctx, {
    type: 'line',
    data: {
      labels: orderedLabels,
      datasets: [{
        label: 'Ingresos Ganados (€)',
        data: values,
        borderColor: '#FF6D4D',
        borderWidth: 3,
        backgroundColor: gradient,
        fill: true,
        tension: 0.45,
        pointBackgroundColor: '#FF6D4D',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => ' ' + formatCurrency(ctx.raw) }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#64748B', font: { family: 'Inter', size: 11, weight: '600' } }
        },
        y: {
          grid: { color: '#F1F5F9' },
          ticks: {
            color: '#64748B',
            font: { family: 'Inter', size: 11 },
            callback: v => formatCurrency(v)
          }
        }
      }
    }
  });
}

/* ============================================================
   CHART — Win Rate Donut
============================================================ */
function buildDonutChart() {
  const ctx = document.getElementById('donutChart');
  if (!ctx) return;

  const won  = deals.filter(d => d.status === 'won').length;
  const lost = deals.filter(d => d.status === 'lost').length;
  const open = deals.filter(d => d.status === 'open').length;

  if (chartInstances.donut) { chartInstances.donut.destroy(); }

  chartInstances.donut = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Ganados', 'Perdidos', 'Abiertos'],
      datasets: [{
        data: [won, lost, open],
        backgroundColor: ['#10B981', '#EF4444', '#60A5FA'],
        borderWidth: 0,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#475569',
            font: { family: 'Inter', size: 11, weight: '600' },
            padding: 16,
            boxWidth: 10,
            boxHeight: 10,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw} deals` }
        }
      }
    }
  });

  // Center text
  const total = won + lost + open;
  const rate  = total ? ((won / (won + lost)) * 100).toFixed(0) : '0';
  const lbl   = document.getElementById('donut-center');
  if (lbl) { lbl.textContent = rate + '%'; }
}

/* ============================================================
   DEALS TABLE
============================================================ */
function getFilteredDeals() {
  let d = [...deals];
  if (activeFilterStatus !== 'all') d = d.filter(x => x.status === activeFilterStatus);
  if (activeFilterStage  !== 'all') d = d.filter(x => x.stage_id === activeFilterStage);
  if (searchQuery) {
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
}

function renderDealsTable() {
  const tbody = document.getElementById('deals-tbody');
  if (!tbody) return;
  const filtered = getFilteredDeals();

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state"><i class="fas fa-search"></i><br>No se encontraron oportunidades</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(d => {
    const cust  = getCustomer(d.customer_id);
    const owner = getUser(d.owner_id);
    const stage = getStage(d.stage_id);
    const statusClass = { won: 'status-won', lost: 'status-lost', open: 'status-open' }[d.status] || '';
    const statusLabel = { won: 'Ganado', lost: 'Perdido', open: 'Abierto' }[d.status] || d.status;
    const date = d.closed_at
      ? new Date(d.closed_at).toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'2-digit' })
      : (d.expected_close_date ? d.expected_close_date.slice(0, 10) : '—');

    return `
      <tr class="deal-row" data-id="${d.id}">
        <td>
          <div class="deal-title-cell">
            <span class="deal-name">${d.title}</span>
            <span class="deal-company">${cust.company_name || '—'}</span>
          </div>
        </td>
        <td>
          <div class="rep-cell">
            <img src="${owner.avatar_url || ''}" alt="${owner.full_name || ''}">
            <span>${owner.full_name || '—'}</span>
          </div>
        </td>
        <td>
          <span class="stage-badge" style="background:${stage.color}22;color:${stage.color};">
            ${stage.name || '—'}
          </span>
        </td>
        <td class="amount-cell">${formatCurrency(d.amount)}</td>
        <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
        <td class="date-cell">${date}</td>
        <td class="actions-cell">
          <button class="action-btn edit-btn" title="Editar" onclick="openEditModal('${d.id}')">
            <i class="fas fa-pencil-alt"></i>
          </button>
          <button class="action-btn delete-btn" title="Eliminar" onclick="deleteDeal('${d.id}')">
            <i class="fas fa-trash-alt"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

/* ============================================================
   TOP DEALS SIDEBAR
============================================================ */
function renderTopDeals() {
  const container = document.getElementById('top-deals-list');
  if (!container) return;

  const top = [...deals]
    .filter(d => d.status === 'won')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  container.innerHTML = top.map((d, i) => {
    const cust  = getCustomer(d.customer_id);
    const owner = getUser(d.owner_id);
    const maxAmt = top[0].amount;
    const pct = ((d.amount / maxAmt) * 100).toFixed(0);
    const colors = ['#FF6D4D', '#F59E0B', '#10B981', '#60A5FA', '#8B5CF6'];
    return `
      <div class="top-deal-item">
        <div class="top-deal-rank" style="background:${colors[i]}22;color:${colors[i]};">${i + 1}</div>
        <div class="top-deal-info">
          <div class="top-deal-title">${d.title}</div>
          <div class="top-deal-company">${cust.company_name || '—'} · ${owner.full_name || '—'}</div>
          <div class="top-deal-bar-wrap">
            <div class="top-deal-bar" style="width:${pct}%;background:${colors[i]};"></div>
          </div>
        </div>
        <div class="top-deal-amount">${formatCurrency(d.amount)}</div>
      </div>
    `;
  }).join('');
}

/* ============================================================
   RECENT LEADS SIDEBAR
============================================================ */
function renderRecentLeads() {
  const container = document.getElementById('recent-leads-list');
  if (!container) return;

  const recent = [...deals]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 6);

  container.innerHTML = recent.map(d => {
    const cust  = getCustomer(d.customer_id);
    const owner = getUser(d.owner_id);
    const stage = getStage(d.stage_id);
    return `
      <div class="lead-item">
        <img src="${owner.avatar_url}" alt="${owner.full_name}" class="lead-avatar">
        <div class="lead-info">
          <div class="lead-name">${cust.contact_person || '—'}</div>
          <div class="lead-company">${cust.company_name || '—'}</div>
        </div>
        <span class="stage-badge small" style="background:${stage.color}22;color:${stage.color};">${stage.name}</span>
      </div>
    `;
  }).join('');
}

/* ============================================================
   TEAM PERFORMANCE
============================================================ */
function renderTeamPerformance() {
  const container = document.getElementById('team-performance-list');
  if (!container) return;

  const repStats = users
    .filter(u => u.role === 'sales_rep')
    .map(u => {
      const myDeals = deals.filter(d => d.owner_id === u.id);
      const won = myDeals.filter(d => d.status === 'won');
      const revenue = won.reduce((s, d) => s + d.amount, 0);
      const quota = u.quota_amount;
      const pct = Math.min((revenue / quota) * 100, 100).toFixed(0);
      return { ...u, revenue, quota, pct: Number(pct), wonCount: won.length };
    })
    .sort((a, b) => b.revenue - a.revenue);

  container.innerHTML = repStats.map((r, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
    const barColor = r.pct >= 80 ? '#10B981' : r.pct >= 50 ? '#F59E0B' : '#EF4444';
    return `
      <div class="team-item">
        <img src="${r.avatar_url}" alt="${r.full_name}" class="team-avatar">
        <div class="team-info">
          <div class="team-name">${medal} ${r.full_name}</div>
          <div class="team-bar-row">
            <div class="team-bar-wrap">
              <div class="team-bar" style="width:${r.pct}%;background:${barColor};"></div>
            </div>
            <span class="team-pct" style="color:${barColor};">${r.pct}%</span>
          </div>
        </div>
        <div class="team-revenue">${formatCurrency(r.revenue)}</div>
      </div>
    `;
  }).join('');
}

/* ============================================================
   PIPELINE KANBAN VIEW
============================================================ */
function renderPipelineKanban() {
  const container = document.getElementById('pipeline-kanban');
  if (!container) return;

  container.innerHTML = stages.map(stage => {
    const stageDeals = deals.filter(d => d.stage_id === stage.id);
    const total = stageDeals.reduce((s, d) => s + d.amount, 0);
    const cards = stageDeals.slice(0, 6).map(d => {
      const cust  = getCustomer(d.customer_id);
      const owner = getUser(d.owner_id);
      const statusClass = { won: 'status-won', lost: 'status-lost', open: 'status-open' }[d.status] || '';
      return `
        <div class="kanban-card">
          <div class="kanban-card-title">${d.title}</div>
          <div class="kanban-card-company">${cust.company_name || '—'}</div>
          <div class="kanban-card-footer">
            <img src="${owner.avatar_url || ''}" alt="" class="kanban-avatar">
            <span class="status-badge ${statusClass}" style="font-size:9px;padding:2px 7px;">${{ won:'Ganado', lost:'Perdido', open:'Abierto' }[d.status]}</span>
            <span class="kanban-amount">${formatCurrency(d.amount)}</span>
          </div>
        </div>
      `;
    }).join('');

    const more = stageDeals.length > 6 ? `<div class="kanban-more">+${stageDeals.length - 6} más</div>` : '';

    return `
      <div class="kanban-column">
        <div class="kanban-col-header" style="border-top:3px solid ${stage.color};">
          <div class="kanban-col-name">${stage.name}</div>
          <div class="kanban-col-meta">
            <span class="kanban-count">${stageDeals.length}</span>
            <span class="kanban-total">${formatCurrency(total)}</span>
          </div>
        </div>
        <div class="kanban-cards">
          ${cards}
          ${more}
        </div>
      </div>
    `;
  }).join('');

  // Also build the big pipeline chart
  buildBigPipelineChart();
}

function buildBigPipelineChart() {
  const ctx = document.getElementById('pipelineChartBig');
  if (!ctx) return;

  const stageMap = {};
  stages.forEach(s => { stageMap[s.id] = { name: s.name, total: 0, color: s.color }; });
  deals.forEach(d => { if (stageMap[d.stage_id]) stageMap[d.stage_id].total += d.amount; });

  const labels = stages.map(s => s.name);
  const values = stages.map(s => stageMap[s.id].total);
  const colors = stages.map(s => s.color);

  if (chartInstances.pipelineBig) chartInstances.pipelineBig.destroy();

  chartInstances.pipelineBig = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Valor (€)',
        data: values,
        backgroundColor: colors.map(c => c + 'BB'),
        borderColor: colors,
        borderWidth: 2,
        borderRadius: 12,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ' ' + formatCurrency(ctx.raw) } } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#64748B', font: { family: 'Inter', size: 12, weight: '600' } } },
        y: { grid: { color: '#F1F5F9' }, ticks: { color: '#64748B', font: { family: 'Inter', size: 11 }, callback: v => formatCurrency(v) } }
      }
    }
  });
}

/* ============================================================
   SECOND DEALS TABLE (view-deals section)
============================================================ */
function renderDealsTable2() {
  const tbody = document.getElementById('deals-tbody-2');
  if (!tbody) return;
  const filtered = getFilteredDeals();
  tbody.innerHTML = filtered.map(d => {
    const cust  = getCustomer(d.customer_id);
    const owner = getUser(d.owner_id);
    const stage = getStage(d.stage_id);
    const statusClass = { won: 'status-won', lost: 'status-lost', open: 'status-open' }[d.status] || '';
    const statusLabel = { won: 'Ganado', lost: 'Perdido', open: 'Abierto' }[d.status] || d.status;
    const date = d.closed_at
      ? new Date(d.closed_at).toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'2-digit' })
      : (d.expected_close_date ? d.expected_close_date.slice(0,10) : '—');
    return `
      <tr class="deal-row">
        <td><div class="deal-title-cell"><span class="deal-name">${d.title}</span><span class="deal-company">${cust.company_name || '—'}</span></div></td>
        <td><div class="rep-cell"><img src="${owner.avatar_url||''}" alt=""><span>${owner.full_name || '—'}</span></div></td>
        <td><span class="stage-badge" style="background:${stage.color}22;color:${stage.color};">${stage.name || '—'}</span></td>
        <td class="amount-cell">${formatCurrency(d.amount)}</td>
        <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
        <td class="date-cell">${date}</td>
        <td class="actions-cell">
          <button class="action-btn edit-btn" title="Editar" onclick="openEditModal('${d.id}')"><i class="fas fa-pencil-alt"></i></button>
          <button class="action-btn delete-btn" title="Eliminar" onclick="deleteDeal('${d.id}')"><i class="fas fa-trash-alt"></i></button>
        </td>
      </tr>`;
  }).join('');
}

/* ============================================================
   UPDATE OPEN COUNT BADGE
============================================================ */
function updateOpenCount() {
  const badge = document.getElementById('open-count');
  if (badge) badge.textContent = deals.filter(d => d.status === 'open').length;
}

/* ============================================================
   FULL REFRESH
============================================================ */
function refresh() {
  renderKPIs();
  buildPipelineChart();
  buildTrendChart();
  buildDonutChart();
  renderDealsTable();
  renderDealsTable2();
  renderTopDeals();
  renderRecentLeads();
  renderTeamPerformance();
  renderPipelineKanban();
  updateOpenCount();
}

/* ============================================================
   DEAL CRUD
============================================================ */
function populateFormDropdowns() {
  // Customer select
  const custSel = document.getElementById('modal-customer');
  if (custSel) {
    custSel.innerHTML = customers.map(c =>
      `<option value="${c.id}">${c.company_name}</option>`
    ).join('');
  }
  // Owner select
  const ownerSel = document.getElementById('modal-owner');
  if (ownerSel) {
    ownerSel.innerHTML = users.filter(u => u.role === 'sales_rep').map(u =>
      `<option value="${u.id}">${u.full_name}</option>`
    ).join('');
  }
  // Stage select
  const stageSel = document.getElementById('modal-stage');
  if (stageSel) {
    stageSel.innerHTML = stages.map(s =>
      `<option value="${s.id}">${s.name}</option>`
    ).join('');
  }
}

function openAddModal() {
  editingDealId = null;
  document.getElementById('modal-title').textContent = 'Nueva Oportunidad';
  document.getElementById('deal-form').reset();
  populateFormDropdowns();
  document.getElementById('deal-modal').classList.add('active');
}

window.openEditModal = function(id) {
  const deal = deals.find(d => d.id === id);
  if (!deal) return;
  editingDealId = id;
  document.getElementById('modal-title').textContent = 'Editar Oportunidad';
  populateFormDropdowns();

  document.getElementById('modal-title-input').value  = deal.title;
  document.getElementById('modal-customer').value     = deal.customer_id;
  document.getElementById('modal-owner').value        = deal.owner_id;
  document.getElementById('modal-stage').value        = deal.stage_id;
  document.getElementById('modal-amount').value       = deal.amount;
  document.getElementById('modal-status').value       = deal.status;

  document.getElementById('deal-modal').classList.add('active');
};

window.deleteDeal = function(id) {
  if (!confirm('¿Eliminar esta oportunidad? Esta acción no se puede deshacer.')) return;
  deals = deals.filter(d => d.id !== id);
  refresh();
  showToast('Oportunidad eliminada', 'error');
};

function closeModal() {
  document.getElementById('deal-modal').classList.remove('active');
  editingDealId = null;
}

function handleFormSubmit(e) {
  e.preventDefault();

  const title      = document.getElementById('modal-title-input').value.trim();
  const customerId = document.getElementById('modal-customer').value;
  const ownerId    = document.getElementById('modal-owner').value;
  const stageId    = document.getElementById('modal-stage').value;
  const amount     = parseFloat(document.getElementById('modal-amount').value);
  const status     = document.getElementById('modal-status').value;

  if (!title || !customerId || !ownerId || !stageId || isNaN(amount)) {
    showToast('Por favor completa todos los campos', 'error');
    return;
  }

  if (editingDealId) {
    const idx = deals.findIndex(d => d.id === editingDealId);
    if (idx > -1) {
      deals[idx] = { ...deals[idx], title, customer_id: customerId, owner_id: ownerId, stage_id: stageId, amount, status };
      if (status === 'won' && !deals[idx].closed_at) {
        deals[idx].closed_at = new Date().toISOString();
      }
      showToast('Oportunidad actualizada', 'success');
    }
  } else {
    const newDeal = {
      id: 'd' + Date.now(),
      title, customer_id: customerId, owner_id: ownerId,
      stage_id: stageId, amount, currency: 'EUR', status,
      created_at: new Date().toISOString(),
      closed_at: status === 'won' ? new Date().toISOString() : undefined,
      expected_close_date: status !== 'won' ? new Date(Date.now() + 30 * 86400000).toISOString().slice(0,10) : undefined
    };
    deals.unshift(newDeal);
    showToast('Oportunidad creada exitosamente', 'success');
  }

  closeModal();
  refresh();
}

/* ============================================================
   TOAST
============================================================ */
function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${msg}`;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3200);
}

/* ============================================================
   DATE / CLOCK
============================================================ */
function updateClock() {
  const now  = new Date();
  const date = now.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const time = now.toLocaleTimeString('es-ES');
  const dateEl = document.getElementById('current-date');
  const timeEl = document.getElementById('current-time');
  if (dateEl) dateEl.textContent = date.charAt(0).toUpperCase() + date.slice(1);
  if (timeEl) timeEl.textContent = time;
}

/* ============================================================
   POPULATE STAGE FILTER
============================================================ */
function populateStageFilter() {
  const sel = document.getElementById('filter-stage');
  if (!sel) return;
  sel.innerHTML = '<option value="all">Todas las etapas</option>' +
    stages.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
}

/* ============================================================
   SIDEBAR NAVIGATION
============================================================ */
function initNav() {
  document.querySelectorAll('.nav-item[data-view]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const view = link.dataset.view;

      document.querySelectorAll('.nav-item').forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
      const target = document.getElementById('view-' + view);
      if (target) {
        target.classList.add('active');
        const pageTitles = { dashboard: 'Dashboard', pipeline: 'Pipeline', deals: 'Oportunidades' };
        document.getElementById('page-title').textContent = pageTitles[view] || view;
        // Trigger view-specific renders
        if (view === 'pipeline') renderPipelineKanban();
        if (view === 'deals') renderDealsTable2();
      }
    });
  });
}

/* ============================================================
   EVENTS
============================================================ */
function initEvents() {
  // Add deal button
  document.getElementById('btn-add-deal')?.addEventListener('click', openAddModal);

  // Modal close
  document.getElementById('btn-close-modal')?.addEventListener('click', closeModal);
  document.getElementById('btn-cancel-modal')?.addEventListener('click', closeModal);
  document.getElementById('deal-modal')?.addEventListener('click', e => {
    if (e.target.id === 'deal-modal') closeModal();
  });
  // ESC key closes modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  // Form submit
  document.getElementById('deal-form')?.addEventListener('submit', handleFormSubmit);

  // Dashboard table search
  document.getElementById('table-search')?.addEventListener('input', e => {
    searchQuery = e.target.value;
    renderDealsTable();
  });
  // Deals view table search
  document.getElementById('table-search-2')?.addEventListener('input', e => {
    searchQuery = e.target.value;
    renderDealsTable2();
  });

  // Status filter (dashboard)
  document.getElementById('filter-status')?.addEventListener('change', e => {
    activeFilterStatus = e.target.value;
    renderDealsTable();
  });
  // Status filter (deals view)
  document.getElementById('filter-status-2')?.addEventListener('change', e => {
    activeFilterStatus = e.target.value;
    renderDealsTable2();
  });

  // Stage filter
  document.getElementById('filter-stage')?.addEventListener('change', e => {
    activeFilterStage = e.target.value;
    renderDealsTable();
  });

  // Export CSV
  document.getElementById('btn-export')?.addEventListener('click', exportCSV);
}

/* ============================================================
   CSV EXPORT
============================================================ */
function exportCSV() {
  const headers = ['ID', 'Título', 'Cliente', 'Responsable', 'Etapa', 'Importe', 'Estado', 'Creado'];
  const rows = deals.map(d => [
    d.id,
    d.title,
    getCustomer(d.customer_id).company_name || '',
    getUser(d.owner_id).full_name || '',
    getStage(d.stage_id).name || '',
    d.amount,
    d.status,
    d.created_at.slice(0, 10)
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'crm-deals-export.csv';
  a.click();
  showToast('CSV exportado exitosamente', 'success');
}

/* ============================================================
   INIT
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  setInterval(updateClock, 1000);
  populateStageFilter();
  initNav();
  initEvents();
  refresh();

  // Expose for console debugging
  window.CRM = { refresh, deals, showToast };
});
