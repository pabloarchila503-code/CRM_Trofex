import React, { useMemo } from 'react';
import KPICards from './KPICards';
import SalesTargetChart from './SalesTargetChart';
import { AnalisisChart, ProyectosChart, ProspectosChart, CarretasChart } from './Charts';

// Mapeo de número de mes → nombre
const MONTH_NAMES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

export default function DashboardView({
  deals,
  stages,
  users,
  customers,
  kpis,
  onEditDeal,
  onDeleteDeal,
  salesTargetData,
  onOpenStoreEditor,
  activeStore,
  userRole,
  selectedStores,
  selectedMonths,
}) {
  const isAdmin = userRole === 'admin';

  // ── Filtrar deals por stores y meses seleccionados (solo Admin usa multi-select) ──
  const filteredDeals = useMemo(() => {
    let result = deals;

    if (isAdmin) {
      // Filtro por tiendas
      if (selectedStores && selectedStores.length > 0) {
        result = result.filter(d => selectedStores.includes(d.store_code));
      }
      // Filtro por meses
      if (selectedMonths && selectedMonths.length > 0) {
        result = result.filter(d => {
          const monthIdx  = new Date(d.created_at).getMonth(); // 0-11
          const monthName = MONTH_NAMES[monthIdx];
          return selectedMonths.includes(monthName);
        });
      }
    }
    // Para rol Store, deals ya vienen filtrados desde App.jsx
    return result;
  }, [deals, selectedStores, selectedMonths, isAdmin]);

  // ── Calcular sumatorias de las 4 áreas del CRM ─────────────────────────────
  const areaSummary = useMemo(() => {
    const d = filteredDeals;

    // Prospecciones: total prospectados = todos los deals del período
    const prospectados  = d.length;
    const contactados   = d.filter(x => ['s2','s3','s4','s5'].includes(x.stage_id)).length;
    const cotizados     = d.filter(x => ['s3','s4','s5'].includes(x.stage_id)).length;
    const cerrados      = d.filter(x => x.status === 'won').length;
    const perdidos      = d.filter(x => x.status === 'lost').length;
    const noContactados = d.filter(x => x.stage_id === 's1' && x.status === 'open').length;
    const empresas      = new Set(d.map(x => x.customer_id)).size;

    return {
      prospecciones: { prospectados, contactados, cotizados, cerrados, perdidos },
      '8020':        { noContactados, contactados, cotizados, cerrados, perdidos },
      proyectos:     { empresas, contactados, cotizados, cerrados, perdidos },
      carreras:      { noContactados, contactados, cotizados, cerrados, perdidos },
    };
  }, [filteredDeals]);

  return (
    <div className="view-section active" id="view-dashboard">
      <p className="section-label">
        RESUMEN DE RENDIMIENTO <span style={{ fontWeight: '500', opacity: 0.7 }}>(Prospecciones, 80/20, Proyecto y Carreras)</span>
      </p>

      {/* ── KPI Cards (4 Áreas) ── */}
      <KPICards areaSummary={areaSummary} />

      {/* ── Filtro activo indicador (Admin) ── */}
      {isAdmin && (selectedStores?.length > 0 || selectedMonths?.length > 0) && (
        <div style={{
          margin: '0 0 16px 0', padding: '8px 14px',
          background: 'rgba(255,109,77,0.07)', borderRadius: 'var(--radius-md)',
          border: '1px dashed var(--accent-coral)',
          fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '8px', flexWrap: 'wrap',
        }}>
          <i className="fas fa-filter" style={{ color: 'var(--accent-coral)' }} />
          <span>Filtrando por:</span>
          {selectedStores?.length > 0 && <strong>Tiendas: {selectedStores.join(', ')}</strong>}
          {selectedMonths?.length > 0 && <strong>Meses: {selectedMonths.join(', ')}</strong>}
        </div>
      )}

      {/* ── Sales Target Chart ── */}
      <SalesTargetChart
        data={salesTargetData}
        onOpenEditor={onOpenStoreEditor}
        activeStore={activeStore}
      />

      {/* ── 4 Gráficas 2×2 ── */}
      <div className="charts-grid-2x2">
        {/* Gráfica 1: Prospecciones (Embudo) */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <span className="card-title-dot" style={{ background: '#94A3B8' }} />
                Prospecciones
              </div>
              <div className="card-subtitle">Embudo de clientes potenciales</div>
            </div>
            <button className="card-menu-btn"><i className="fas fa-ellipsis-h" /></button>
          </div>
          <div className="chart-wrap">
            <div className="chart-lg">
              <ProspectosChart deals={filteredDeals} />
            </div>
          </div>
        </div>

        {/* Gráfica 2: Análisis 80/20 */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <span className="card-title-dot" style={{ background: '#3B82F6' }} />
                Análisis 80/20
              </div>
              <div className="card-subtitle">Conversión de clientes y cotizaciones</div>
            </div>
            <button className="card-menu-btn"><i className="fas fa-ellipsis-h" /></button>
          </div>
          <div className="chart-wrap">
            <div className="chart-lg">
              <AnalisisChart deals={filteredDeals} />
            </div>
          </div>
        </div>

        {/* Gráfica 3: Proyectos */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <span className="card-title-dot" style={{ background: '#F59E0B' }} />
                Proyectos
              </div>
              <div className="card-subtitle">Estatus de cotizaciones corporativas</div>
            </div>
            <button className="card-menu-btn"><i className="fas fa-ellipsis-h" /></button>
          </div>
          <div className="chart-wrap">
            <div className="chart-lg">
              <ProyectosChart deals={filteredDeals} />
            </div>
          </div>
        </div>

        {/* Gráfica 4: Carreras */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <span className="card-title-dot" style={{ background: '#EC4899' }} />
                Carreras
              </div>
              <div className="card-subtitle">Puntos de venta y kioscos</div>
            </div>
            <button className="card-menu-btn"><i className="fas fa-ellipsis-h" /></button>
          </div>
          <div className="chart-wrap">
            <div className="chart-lg">
              <CarretasChart deals={filteredDeals} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
