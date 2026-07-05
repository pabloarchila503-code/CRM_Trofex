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
  analisis8020ManualData = [],
  proyectoManualData = [],
  carrerasManualData = [],
  timeRange = 'Mensual',
}) {
  const isAdmin = userRole === 'admin';

  // ── Filtrar deals por stores (solo Admin) y meses y rango de tiempo (todos los usuarios) ──
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

    // Filtro por rango de tiempo (1 día, 1 semana, Quincenal, Mensual)
    result = result.filter(d => {
      const createdDate = new Date(d.created_at);
      const now = new Date();
      const diffTime = now - createdDate;
      const diffDays = diffTime / (1000 * 60 * 60 * 24);

      if (timeRange === '1 día') {
        return diffDays >= 0 && diffDays <= 1;
      }
      if (timeRange === '1 semana') {
        return diffDays >= 0 && diffDays <= 7;
      }
      if (timeRange === 'Quincenal') {
        return diffDays >= 0 && diffDays <= 15;
      }
      if (timeRange === 'Mensual') {
        return diffDays >= 0 && diffDays <= 30;
      }
      return true;
    });

    return result;
  }, [deals, selectedStores, selectedMonths, isAdmin, timeRange]);

  // ── Helper para filtrar y escalar cualquier dataset manual (Prospecciones, 80/20, Proyecto, Carreras) ──
  const filterAndScaleManualData = (dataArray) => {
    let result = dataArray || [];

    if (isAdmin) {
      // Filtro por tiendas seleccionadas
      if (selectedStores && selectedStores.length > 0) {
        result = result.filter(p => selectedStores.includes(String(p.Tienda || '').trim().toUpperCase()));
      }
    } else {
      // Store user: solo su propia tienda
      const storeCode = String(activeStore || 'CB').trim().toUpperCase();
      result = result.filter(p => String(p.Tienda || '').trim().toUpperCase() === storeCode);
    }

    // Filtro por meses seleccionados para TODOS los roles
    if (selectedMonths && selectedMonths.length > 0) {
      result = result.filter(p => selectedMonths.includes(p.Mes));
    }

    // Escalar los valores de las metas según el periodo de tiempo
    const scaleFactor = 
      timeRange === '1 día' ? (1 / 30) : 
      timeRange === '1 semana' ? (7 / 30) : 
      timeRange === 'Quincenal' ? (15 / 30) : 1;

    if (scaleFactor !== 1) {
      return result.map(p => ({
        ...p,
        Prospectados: Math.round((parseInt(p.Prospectados) || 0) * scaleFactor),
        Contactados: Math.round((parseInt(p.Contactados) || 0) * scaleFactor),
        Cotizados: Math.round((parseInt(p.Cotizados) || 0) * scaleFactor),
        Cerrados: Math.round((parseInt(p.Cerrados) || 0) * scaleFactor),
        Perdidos: Math.round((parseInt(p.Perdidos) || 0) * scaleFactor),
      }));
    }

    return result;
  };

  const filteredProspecciones = useMemo(() => filterAndScaleManualData(prospecciones), [prospecciones, activeStore, selectedStores, selectedMonths, isAdmin, timeRange]);
  const filteredAnalisis8020 = useMemo(() => filterAndScaleManualData(analisis8020ManualData), [analisis8020ManualData, activeStore, selectedStores, selectedMonths, isAdmin, timeRange]);
  const filteredProyecto = useMemo(() => filterAndScaleManualData(proyectoManualData), [proyectoManualData, activeStore, selectedStores, selectedMonths, isAdmin, timeRange]);
  const filteredCarreras = useMemo(() => filterAndScaleManualData(carrerasManualData), [carrerasManualData, activeStore, selectedStores, selectedMonths, isAdmin, timeRange]);

  // ── Calcular sumatorias globales para las 5 tarjetas del Embudo Maestro ──
  const globalSums = useMemo(() => {
    let totalProspectados = 0;
    let totalContactados = 0;
    let totalCotizados = 0;
    let totalCerrados = 0;

    const aggregateData = (data) => {
      data.forEach(p => {
        totalProspectados += (parseInt(p.Prospectados) || 0);
        totalContactados  += (parseInt(p.Contactados) || 0);
        totalCotizados    += (parseInt(p.Cotizados) || 0);
        totalCerrados     += (parseInt(p.Cerrados) || 0);
      });
    };

    aggregateData(filteredProspecciones);
    aggregateData(filteredAnalisis8020);
    aggregateData(filteredProyecto);
    aggregateData(filteredCarreras);

    return {
      prospectados: totalProspectados,
      contactados:  totalContactados,
      cotizados:    totalCotizados,
      cerrados:     totalCerrados,
      no_cerrados:  Math.max(0, totalCotizados - totalCerrados),
    };
  }, [filteredProspecciones, filteredAnalisis8020, filteredProyecto, filteredCarreras]);

  // ── Calcular la efectividad de ventas para la gráfica de Prospecciones (Cerrados / Cotizados) ──
  // ── Helper para calcular efectividad ──
  const calcEfectividad = (dataArray) => {
    let cotizados = 0;
    let cerrados = 0;
    dataArray.forEach(p => {
      cotizados += (parseInt(p.Cotizados) || 0);
      cerrados  += (parseInt(p.Cerrados) || 0);
    });
    if (cotizados === 0) return 0;
    return Math.round((cerrados / cotizados) * 100);
  };

  const prospeccionesEfectividad = useMemo(() => calcEfectividad(filteredProspecciones), [filteredProspecciones]);
  const analisis8020Efectividad  = useMemo(() => calcEfectividad(filteredAnalisis8020), [filteredAnalisis8020]);
  const proyectosEfectividad     = useMemo(() => calcEfectividad(filteredProyecto), [filteredProyecto]);
  const carrerasEfectividad      = useMemo(() => calcEfectividad(filteredCarreras), [filteredCarreras]);

  return (
    <div className="view-section active" id="view-dashboard">
      {/* ── Print-only Header ── */}
      <div className="print-header" style={{ display: 'none' }}>
        <div className="print-header-top" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '4px' }}>
          <img src={logoImg} alt="Trofex Logo" className="print-logo" style={{ maxHeight: '40px', objectFit: 'contain' }} />
          <div className="print-title-area">
            <h1 className="print-main-title" style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: '#1E293B' }}>RESUMEN DE RENDIMIENTO</h1>
            <p className="print-subtitle" style={{ fontSize: '10px', margin: '2px 0 0 0', color: '#64748B' }}>Reporte Ejecutivo Comercial de Trofex</p>
          </div>
        </div>
        <div className="print-filters-active" style={{ fontSize: '10px', color: '#475569', borderBottom: '1px solid #E2E8F0', paddingBottom: '6px', marginBottom: '10px' }}>
          <strong>Filtrado por:</strong> Tiendas ({userRole === 'admin' ? (selectedStores.length > 0 ? selectedStores.join(', ') : 'Todas') : activeStore}) | Meses: {selectedMonths.length > 0 ? selectedMonths.join(', ') : 'Todos'}
        </div>
      </div>

      <p className="section-label">
        RESUMEN DE RENDIMIENTO <span style={{ fontWeight: '500', opacity: 0.7 }}>(Prospecciones, 80/20, Proyecto y Carreras)</span>
      </p>

      {/* ── KPI Cards (5 Etapas / Embudo Maestro) ── */}
      <KPICards globalSums={globalSums} />


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
                Efectividad de Cierre: {analisis8020Efectividad}%
              </span>
              <button className="card-menu-btn"><i className="fas fa-ellipsis-h" /></button>
            </div>
          </div>
          <div className="chart-wrap">
            <div className="chart-lg">
              <AnalisisChart data={filteredAnalisis8020} />
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
                Efectividad de Cierre: {proyectosEfectividad}%
              </span>
              <button className="card-menu-btn"><i className="fas fa-ellipsis-h" /></button>
            </div>
          </div>
          <div className="chart-wrap">
            <div className="chart-lg">
              <ProyectosChart data={filteredProyecto} />
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
                Efectividad de Cierre: {carrerasEfectividad}%
              </span>
              <button className="card-menu-btn"><i className="fas fa-ellipsis-h" /></button>
            </div>
          </div>
          <div className="chart-wrap">
            <div className="chart-lg">
              <CarretasChart data={filteredCarreras} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
