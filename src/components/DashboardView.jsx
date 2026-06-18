import { useMemo } from 'react';
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
  }, [prospecciones, activeStore, selectedStores, selectedMonths, isAdmin]);

  // ── Calcular sumatorias globales para las 5 tarjetas del Embudo Maestro ──
  const globalSums = useMemo(() => {
    // 1. Prospecciones (Master DB)
    let prospProsp = 0;
    let contProsp  = 0;
    let cotProsp   = 0;
    let cerrProsp  = 0;
    let perdProsp  = 0;

    filteredProspecciones.forEach(p => {
      prospProsp += (parseInt(p.Prospectados) || 0);
      contProsp  += (parseInt(p.Contactados) || 0);
      cotProsp   += (parseInt(p.Cotizados) || 0);
      cerrProsp  += (parseInt(p.Cerrados) || 0);
      perdProsp  += (parseInt(p.Perdidos) || 0);
    });

    // 2. 80/20, Proyectos, y Carreras (se obtienen de filteredDeals)
    const countByStage = (stageId) => {
      return filteredDeals.filter(d => d.stage_id === stageId).length;
    };

    const prospDeals = countByStage('s1');
    const contDeals  = countByStage('s2');
    const cotDeals   = countByStage('s3');
    const cerrDeals  = countByStage('s4');
    const perdDeals  = countByStage('s5');

    // Sumatoria global por etapa en las 4 áreas:
    // Prospectados = Prospecciones + 80/20 + Proyectos + Carreras
    const totalProspectados = prospProsp + prospDeals + prospDeals + prospDeals;
    const totalContactados  = contProsp + contDeals + contDeals + contDeals;
    const totalCotizados    = cotProsp + cotDeals + cotDeals + cotDeals;
    const totalCerrados     = cerrProsp + cerrDeals + cerrDeals + cerrDeals;
    const totalPerdidos     = perdProsp + perdDeals + perdDeals + perdDeals;

    return {
      prospectados: totalProspectados,
      contactados:  totalContactados,
      cotizados:    totalCotizados,
      cerrados:     totalCerrados,
      perdidos:     totalPerdidos,
    };
  }, [filteredDeals, filteredProspecciones]);

  // ── Calcular la efectividad de ventas para la gráfica de Prospecciones (Cerrados / Cotizados) ──
  const prospeccionesEfectividad = useMemo(() => {
    let cotizados = 0;
    let cerrados = 0;
    filteredProspecciones.forEach(p => {
      cotizados += (parseInt(p.Cotizados) || 0);
      cerrados  += (parseInt(p.Cerrados) || 0);
    });
    if (cotizados === 0) return 0;
    return Math.round((cerrados / cotizados) * 100);
  }, [filteredProspecciones]);

  // ── Calcular la efectividad de ventas para las gráficas basadas en Deals (Cerrados / Cotizados) ──
  const dealsEfectividad = useMemo(() => {
    const cotizados = filteredDeals.filter(d => d.stage_id === 's3').length;
    const cerrados  = filteredDeals.filter(d => d.status === 'won').length;
    if (cotizados === 0) return 0;
    return Math.round((cerrados / cotizados) * 100);
  }, [filteredDeals]);

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

      {/* ── KPI Cards (5 Etapas / Embudo Maestro) ── */}
      <KPICards globalSums={globalSums} />

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
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="card-title">
                <span className="card-title-dot" style={{ background: '#94A3B8' }} />
                Prospecciones
              </div>
              <div className="card-subtitle">Embudo de clientes potenciales</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                background: 'rgba(16,185,129,0.12)',
                color: '#059669',
                fontSize: '11px',
                fontWeight: '700',
                padding: '4px 10px',
                borderRadius: '12px',
                whiteSpace: 'nowrap',
              }}>
                Efectividad de Cierre: {prospeccionesEfectividad}%
              </span>
              <button className="card-menu-btn"><i className="fas fa-ellipsis-h" /></button>
            </div>
          </div>
          <div className="chart-wrap">
            <div className="chart-lg">
              <ProspectosChart prospecciones={filteredProspecciones} />
            </div>
          </div>
        </div>

        {/* Gráfica 2: Análisis 80/20 */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="card-title">
                <span className="card-title-dot" style={{ background: '#3B82F6' }} />
                Análisis 80/20
              </div>
              <div className="card-subtitle">Conversión de clientes y cotizaciones</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                background: 'rgba(16,185,129,0.12)',
                color: '#059669',
                fontSize: '11px',
                fontWeight: '700',
                padding: '4px 10px',
                borderRadius: '12px',
                whiteSpace: 'nowrap',
              }}>
                Efectividad de Cierre: {dealsEfectividad}%
              </span>
              <button className="card-menu-btn"><i className="fas fa-ellipsis-h" /></button>
            </div>
          </div>
          <div className="chart-wrap">
            <div className="chart-lg">
              <AnalisisChart deals={filteredDeals} />
            </div>
          </div>
        </div>

        {/* Gráfica 3: Proyectos */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="card-title">
                <span className="card-title-dot" style={{ background: '#F59E0B' }} />
                Proyectos
              </div>
              <div className="card-subtitle">Estatus de cotizaciones corporativas</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                background: 'rgba(16,185,129,0.12)',
                color: '#059669',
                fontSize: '11px',
                fontWeight: '700',
                padding: '4px 10px',
                borderRadius: '12px',
                whiteSpace: 'nowrap',
              }}>
                Efectividad de Cierre: {dealsEfectividad}%
              </span>
              <button className="card-menu-btn"><i className="fas fa-ellipsis-h" /></button>
            </div>
          </div>
          <div className="chart-wrap">
            <div className="chart-lg">
              <ProyectosChart deals={filteredDeals} />
            </div>
          </div>
        </div>

        {/* Gráfica 4: Carreras */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="card-title">
                <span className="card-title-dot" style={{ background: '#EC4899' }} />
                Carreras
              </div>
              <div className="card-subtitle">Puntos de venta y kioscos</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                background: 'rgba(16,185,129,0.12)',
                color: '#059669',
                fontSize: '11px',
                fontWeight: '700',
                padding: '4px 10px',
                borderRadius: '12px',
                whiteSpace: 'nowrap',
              }}>
                Efectividad de Cierre: {dealsEfectividad}%
              </span>
              <button className="card-menu-btn"><i className="fas fa-ellipsis-h" /></button>
            </div>
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
