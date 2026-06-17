import React, { useMemo } from 'react';
import logoImg from '../assets/logo.png';
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
  prospecciones = [],
}) {
  const isAdmin = userRole === 'admin';

  // ── Filtrar deals por stores (solo Admin) y meses (todos los usuarios) ──
  const filteredDeals = useMemo(() => {
    let result = deals;

    if (isAdmin) {
      // Filtro por tiendas
      if (selectedStores && selectedStores.length > 0) {
        result = result.filter(d => selectedStores.includes(d.store_code));
      }
    }

    // Filtro por meses para TODOS los roles
    if (selectedMonths && selectedMonths.length > 0) {
      result = result.filter(d => {
        const monthIdx  = new Date(d.created_at).getMonth(); // 0-11
        const monthName = MONTH_NAMES[monthIdx];
        return selectedMonths.includes(monthName);
      });
    }

    return result;
  }, [deals, selectedStores, selectedMonths, isAdmin]);

  // ── Filtrar prospecciones por stores y meses seleccionados (respetando rol y aislamiento) ──
  const filteredProspecciones = useMemo(() => {
    let result = prospecciones;

    if (isAdmin) {
      // Filtro por tiendas seleccionadas
      if (selectedStores && selectedStores.length > 0) {
        result = result.filter(p => selectedStores.includes(p.Tienda));
      }
    } else {
      // Store user: solo su propia tienda
      const storeCode = activeStore || 'CB';
      result = result.filter(p => p.Tienda === storeCode);
    }

    // Filtro por meses seleccionados para TODOS los roles
    if (selectedMonths && selectedMonths.length > 0) {
      result = result.filter(p => selectedMonths.includes(p.Mes));
    }

    return result;
  }, [prospecciones, userRole, activeStore, selectedStores, selectedMonths, isAdmin]);

  // ── Calcular KPIs ejecutivos (registros únicos + efectividad) ────────────────
  const areaSummary = useMemo(() => {
    const d = filteredDeals;

    const cerrados = d.filter(x => x.status === 'won').length;
    // Total registros únicos por área
    const total8020          = d.length;                                  // mismos registros, vista 80/20
    const totalProyectos     = new Set(d.map(x => x.customer_id)).size;  // empresas únicas
    const totalCarreras      = d.length;                                  // registros totales de carreras

    // Prospecciones values from the master database
    let totalProsp = 0;
    let cerradosProsp = 0;
    filteredProspecciones.forEach(p => {
      totalProsp += (parseInt(p.Prospectados) || 0);
      cerradosProsp += (parseInt(p.Cerrados) || 0);
    });

    const pct = (cerr, tot) =>
      tot > 0 ? Math.round((cerr / tot) * 100) : 0;

    return {
      prospecciones: { total: totalProsp, cerrados: cerradosProsp, efectividad: pct(cerradosProsp, totalProsp) },
      '8020':        { total: total8020,          cerrados, efectividad: pct(cerrados, total8020) },
      proyectos:     { total: totalProyectos,     cerrados, efectividad: pct(cerrados, totalProyectos) },
      carreras:      { total: totalCarreras,      cerrados, efectividad: pct(cerrados, totalCarreras) },
    };
  }, [filteredDeals, filteredProspecciones]);

  return (
    <div className="view-section active" id="view-dashboard">
      {/* ── Print-only Header ── */}
      <div className="print-header" style={{ display: 'none' }}>
        <div className="print-header-top" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '10px' }}>
          <img src={logoImg} alt="Trofex Logo" className="print-logo" style={{ maxHeight: '55px', objectFit: 'contain' }} />
          <div className="print-title-area">
            <h1 className="print-main-title" style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#1E293B' }}>RESUMEN DE RENDIMIENTO</h1>
            <p className="print-subtitle" style={{ fontSize: '12px', margin: '2px 0 0 0', color: '#64748B' }}>Reporte Ejecutivo Comercial de Trofex</p>
          </div>
        </div>
        <div className="print-filters-active" style={{ fontSize: '11px', color: '#475569', borderBottom: '1px solid #E2E8F0', paddingBottom: '12px', marginBottom: '16px' }}>
          <strong>Filtrado por:</strong> Tiendas ({userRole === 'admin' ? (selectedStores.length > 0 ? selectedStores.join(', ') : 'Todas') : activeStore}) | Meses: {selectedMonths.length > 0 ? selectedMonths.join(', ') : 'Todos'}
        </div>
      </div>

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
        selectedStores={selectedStores}
        selectedMonths={selectedMonths}
        userRole={userRole}
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
              <ProspectosChart prospecciones={filteredProspecciones} />
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
