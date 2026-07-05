/**
 * ENGINE ANALÍTICO UNIVERSAL PARA DASHBOARDS SAAS DE ALTA GAMA
 * 
 * Función modular y reutilizable para renderizar KPIs en embudo, 
 * análisis de fugas (con alerta de perdidos) y tablas detalladas con semáforos.
 */

// Paleta semáforo estándar
const CHART_COLORS = {
  prospectados: '#94A3B8', // Gris
  contactados:  '#3B82F6', // Azul
  cotizados:    '#F59E0B', // Amarillo
  cerrados:     '#10B981', // Verde
  perdidos:     '#EF4444', // Rojo
};

/**
 * Renderiza de forma dinámica un Dashboard Inteligente en el elemento DOM seleccionado.
 * 
 * @param {HTMLElement|string} containerRef - Elemento DOM o ID del contenedor.
 * @param {Array<Object>} datos - Array con los datos del área correspondiente.
 * @param {Object} configuracion - Configuración personalizada.
 */
export function renderizarDashboardInteligente(containerRef, datos, configuracion) {
  const container = typeof containerRef === 'string' ? document.getElementById(containerRef) : containerRef;
  if (!container) {
    console.error(`Contenedor no encontrado.`);
    return;
  }

  const config = {
    etapas: [
      { key: 'prospectados', label: 'Prospectados', color: CHART_COLORS.prospectados, bg: 'rgba(148, 163, 184, 0.05)' },
      { key: 'contactados',  label: 'Contactados',  color: CHART_COLORS.contactados,  bg: 'rgba(59, 130, 246, 0.05)' },
      { key: 'cotizados',    label: 'Cotizados',    color: CHART_COLORS.cotizados,    bg: 'rgba(245, 158, 11, 0.05)' },
      { key: 'cerrados',     label: 'Cerrados',     color: CHART_COLORS.cerrados,     bg: 'rgba(16, 185, 129, 0.05)' },
      { key: 'perdidos',     label: 'Perdidos',     color: CHART_COLORS.perdidos,     bg: 'rgba(239, 68, 68, 0.05)' }
    ],
    thresholdFuga: 30,
    esRaw: false,
    campoEtapa: 'Etapa',
    campoAgrupador: 'Tienda',
    mapeoEtapas: {},
    tabla: {
      titulo: 'Detalle de Rendimiento',
      subtitulo: 'Desglose y tasas de conversión',
      mostrarRanking: true,
      criterioOrden: 'conversion',
      semaforoLimites: { verde: 20, amarillo: 10 }
    },
    ...configuracion
  };

  // 1. Inyectar estilos CSS
  inyectarEstilosDashboard();

  // 2. Procesar y agrupar datos
  const { totales, filasAgrupadas } = procesarDatos(datos, config);

  // 3. Conversión Global
  const conversionGlobal = totales.prospectados > 0 
    ? ((totales.cerrados / totales.prospectados) * 100).toFixed(1) 
    : '0.0';

  // 4. Renderizar contenido
  container.innerHTML = `
    <div class="dashboard-inteligente-wrapper">
      
      <!-- ENCABEZADO ANALÍTICO -->
      <div class="db-resumen-header">
        <div>
          <h3 class="db-resumen-title">${config.tabla.titulo}</h3>
          <p class="db-resumen-subtitle">${config.tabla.subtitulo}</p>
        </div>
        <div class="db-conversion-badge">
          <div class="db-conversion-label">Tasa de Conversión Global</div>
          <div class="db-conversion-value">${conversionGlobal}%</div>
        </div>
      </div>

      <!-- TARJETAS DE KPI (EMBUDO VISUAL) -->
      <div class="db-kpis-funnel">
        ${config.etapas.map((etapa, idx) => {
          const val = totales[etapa.key] || 0;
          return `
            <div class="db-kpi-item">
              <div class="db-kpi-card" style="background-color: ${etapa.bg}; border-color: ${etapa.color}25">
                <div class="db-kpi-label">${etapa.label}</div>
                <div class="db-kpi-value" style="color: ${etapa.color}">${val}</div>
              </div>
              ${idx < config.etapas.length - 1 ? `
                <div class="db-funnel-arrow">
                  <i class="fas fa-chevron-right"></i>
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>

      <!-- BANNER DE OPORTUNIDAD Y ALERTAS -->
      ${renderizarBannerDeOportunidad(totales, config)}

      <!-- TABLA DETALLADA CON SEMÁFOROS Y RANKING -->
      <div class="db-table-responsive">
        <table class="db-table-resumen">
          <thead>
            <tr>
              <th>No.</th>
              <th>${config.campoAgrupador}</th>
              ${config.etapas.map(e => `<th style="color: ${e.color}">${e.label}</th>`).join('')}
              <th>Tasa Conversión</th>
            </tr>
          </thead>
          <tbody>
            ${filasAgrupadas.map((fila, idx) => {
              const semStyle = obtenerSemaforoStyle(fila.conversion, config.tabla.semaforoLimites);
              const rank = config.tabla.mostrarRanking 
                ? (idx === 0 ? '<span class="db-rank-best">⭐</span>' : (idx === filasAgrupadas.length - 1 ? '<span class="db-rank-worst">🚩</span>' : ''))
                : '';
              
              return `
                <tr>
                  <td>${idx + 1}</td>
                  <td>
                    <span class="db-row-agrupador-label">${fila.agrupador}</span>
                    ${rank}
                  </td>
                  ${config.etapas.map(e => `<td>${fila[e.key] || 0}</td>`).join('')}
                  <td>
                    <span class="db-semaforo-badge" style="background-color: ${semStyle.bg}; color: ${semStyle.color}">
                      ${fila.conversion.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

    </div>
  `;
}

function procesarDatos(datos, config) {
  const totales = {};
  config.etapas.forEach(e => { totales[e.key] = 0; });

  const agrupado = {};

  datos.forEach(item => {
    const agrupadorVal = item[config.campoAgrupador] || 'General';

    if (!agrupado[agrupadorVal]) {
      agrupado[agrupadorVal] = { agrupador: agrupadorVal, conversion: 0 };
      config.etapas.forEach(e => { agrupado[agrupadorVal][e.key] = 0; });
    }

    if (config.esRaw) {
      const rawEtapa = item[config.campoEtapa];
      const stageKey = config.mapeoEtapas[rawEtapa] || (rawEtapa ? rawEtapa.toLowerCase() : null);
      if (stageKey && totales[stageKey] !== undefined) {
        totales[stageKey]++;
        agrupado[agrupadorVal][stageKey]++;
      }
    } else {
      config.etapas.forEach(e => {
        // Mapeo sensible a mayúsculas/minúsculas para prospecciones/otras tablas
        const val = parseInt(item[e.label]) || parseInt(item[e.label.toLowerCase()]) || parseInt(item[e.key]) || parseInt(item[e.key.toUpperCase()]) || 0;
        totales[e.key] += val;
        agrupado[agrupadorVal][e.key] += val;
      });
    }
  });

  const filasAgrupadas = Object.values(agrupado).map(fila => {
    const prosp = fila.prospectados || fila[config.etapas[0].key] || 0;
    const cerr = fila.cerrados || fila[config.etapas[config.etapas.length - 2]?.key] || 0;
    fila.conversion = prosp > 0 ? (cerr / prosp) * 100 : 0;
    return fila;
  });

  if (config.tabla.criterioOrden === 'conversion') {
    filasAgrupadas.sort((a, b) => b.conversion - a.conversion);
  }

  return { totales, filasAgrupadas };
}

function renderizarBannerDeOportunidad(totales, config) {
  const fugas = [];
  
  for (let i = 1; i < config.etapas.length; i++) {
    const prevKey = config.etapas[i-1].key;
    const currKey = config.etapas[i].key;
    if (currKey === 'perdidos') continue;

    const prevVal = totales[prevKey] || 0;
    const currVal = totales[currKey] || 0;

    if (prevVal > 0) {
      const caida = Math.round(((prevVal - currVal) / prevVal) * 100);
      fugas.push({
        desde: config.etapas[i-1].label,
        hasta: config.etapas[i].label,
        caida,
        esAlerta: caida > config.thresholdFuga
      });
    }
  }

  const alertas = fugas.filter(f => f.esAlerta);

  const contactados = totales.contactados || 0;
  const perdidos = totales.perdidos || 0;
  const hasPerdidos = contactados > 0;
  const perdidosPercent = hasPerdidos ? ((perdidos / contactados) * 100).toFixed(1) : '0.0';

  if (alertas.length === 0 && !hasPerdidos) return '';

  const peor = alertas.length > 0 
    ? alertas.reduce((max, f) => f.caida > max.caida ? f : max, alertas[0])
    : null;

  return `
    <div class="db-oportunidad-container">
      ${peor ? `
        <div class="db-oportunidad-banner">
          <span class="db-oportunidad-icon">🎯</span>
          <div>
            <div class="db-oportunidad-banner-title">Mayor área de oportunidad</div>
            <div class="db-oportunidad-banner-text">
              Convertir <span class="db-text-highlight">${peor.desde}</span> a <span class="db-text-highlight">${peor.hasta}</span>
              &nbsp;— Caída del <span class="db-text-danger">${peor.caida}%</span>
            </div>
          </div>
        </div>
      ` : ''}

      <div class="db-oportunidad-badges">
        ${alertas.map(f => `
          <span class="db-alerta-badge">
            ⚠️ ${f.desde} → ${f.hasta}: -${f.caida}%
          </span>
        `).join('')}
        ${hasPerdidos ? `
          <span class="db-alerta-badge">
            ⚠️ Contactados → Perdidos: -${perdidosPercent}%
          </span>
        ` : ''}
      </div>
    </div>
  `;
}

function obtenerSemaforoStyle(tasa, limites) {
  if (tasa >= limites.verde) {
    return { bg: 'rgba(16,185,129,0.12)', color: '#047857' };
  }
  if (tasa >= limites.amarillo) {
    return { bg: 'rgba(245,158,11,0.12)', color: '#B45309' };
  }
  return { bg: 'rgba(239,68,68,0.12)', color: '#B91C1C' };
}

function inyectarEstilosDashboard() {
  const cssId = 'db-inteligente-styles';
  if (document.getElementById(cssId)) return;

  const style = document.createElement('style');
  style.id = cssId;
  style.textContent = `
    .dashboard-inteligente-wrapper {
      font-family: 'Inter', -apple-system, sans-serif;
      color: #1E293B;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .db-resumen-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
    .db-resumen-title {
      font-size: 18px;
      font-weight: 800;
      color: #0F172A;
      margin: 0;
    }
    .db-resumen-subtitle {
      font-size: 12px;
      color: #64748B;
      margin: 4px 0 0 0;
    }
    .db-conversion-badge {
      background: rgba(255, 109, 77, 0.1);
      color: #FF6D4D;
      padding: 10px 18px;
      border-radius: 8px;
      text-align: center;
    }
    .db-conversion-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .db-conversion-value {
      font-size: 24px;
      font-weight: 800;
      margin-top: 2px;
    }
    .db-kpis-funnel {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      width: 100%;
      margin-bottom: 24px;
    }
    .db-kpi-item {
      display: flex;
      align-items: center;
      position: relative;
    }
    .db-kpi-card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 16px;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.04);
      padding: 24px 20px;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      height: 100%;
      min-height: 110px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .db-kpi-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
    }
    .db-kpi-card:hover {
      transform: translateY(-2px);
    }
    .db-kpi-label {
      font-size: 11px;
      color: #64748B;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .db-kpi-value {
      font-size: 22px;
      font-weight: 800;
      margin-top: 6px;
      line-height: 1;
    }
    .db-funnel-arrow {
      display: flex;
      align-items: center;
      justify-content: center;
      padding-left: 8px;
      padding-right: 2px;
    }
    .db-funnel-arrow i {
      color: #CBD5E1;
      font-size: 14px;
    }
    .db-oportunidad-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .db-oportunidad-banner {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      background: linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%);
      box-shadow: 0 2px 6px rgba(245, 158, 11, 0.05);
      border-radius: 10px;
      padding: 12px 16px;
    }
    .db-oportunidad-icon {
      font-size: 18px;
      flex-shrink: 0;
    }
    .db-oportunidad-banner-title {
      font-weight: 800;
      font-size: 12.5px;
      color: #92400E;
    }
    .db-oportunidad-banner-text {
      font-size: 12px;
      color: #78350F;
      margin-top: 2px;
      font-weight: 700;
    }
    .db-text-highlight {
      font-weight: 800;
      text-decoration: underline;
    }
    .db-text-danger {
      color: #DC2626;
      font-weight: 800;
    }
    .db-oportunidad-badges {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 4px;
    }
    .db-alerta-badge {
      background: rgba(239, 68, 68, 0.08);
      color: #B91C1C;
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 20px;
      padding: 4px 12px;
      font-size: 11px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .db-table-responsive {
      overflow-x: auto;
      border-radius: 8px;
      border: 1px solid #E2E8F0;
    }
    .db-table-resumen {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      text-align: left;
    }
    .db-table-resumen th {
      background: #F8FAFC;
      padding: 12px 16px;
      font-weight: 700;
      color: #475569;
      border-bottom: 1px solid #E2E8F0;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.5px;
    }
    .db-table-resumen td {
      padding: 12px 16px;
      border-bottom: 1px solid #E2E8F0;
      color: #334155;
    }
    .db-table-resumen tr:last-child td {
      border-bottom: none;
    }
    .db-row-agrupador-label {
      font-weight: 800;
      color: #0F172A;
    }
    .db-semaforo-badge {
      font-weight: 700;
      font-size: 11px;
      padding: 3px 10px;
      border-radius: 12px;
      display: inline-block;
    }
    .db-rank-best {
      margin-left: 6px;
      font-size: 12px;
    }
    .db-rank-worst {
      margin-left: 6px;
      font-size: 12px;
    }
  `;
  document.head.appendChild(style);
}
