import React from 'react';
import KPICards from './KPICards';
import SalesTargetChart from './SalesTargetChart';
import { AnalisisChart, ProyectosChart, ProspectosChart, CarretasChart } from './Charts';

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
  userRole
}) {
  return (
    <div className="view-section active" id="view-dashboard">
      <p className="section-label">Resumen de rendimiento</p>
      
      {/* KPI Cards */}
      <KPICards kpis={kpis} />

      {/* Sales Target Chart (Venta/Meta Año 2026) */}
      <SalesTargetChart data={salesTargetData} onOpenEditor={onOpenStoreEditor} activeStore={activeStore} />

      {/* 4 Charts Grid (2x2) */}
      <div className="charts-grid-2x2">
        {/* Gráfica 1: Prospecciones */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <span className="card-title-dot" style={{ background: '#94A3B8' }}></span>
                Prospecciones
              </div>
              <div className="card-subtitle">Embudo de clientes potenciales</div>
            </div>
            <button className="card-menu-btn">
              <i className="fas fa-ellipsis-h"></i>
            </button>
          </div>
          <div className="chart-wrap">
            <div className="chart-lg">
              <ProspectosChart deals={deals} />
            </div>
          </div>
        </div>

        {/* Gráfica 2: Análisis 80/20 */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <span className="card-title-dot" style={{ background: '#3B82F6' }}></span>
                Análisis 80/20
              </div>
              <div className="card-subtitle">Conversión de clientes y cotizaciones</div>
            </div>
            <button className="card-menu-btn">
              <i className="fas fa-ellipsis-h"></i>
            </button>
          </div>
          <div className="chart-wrap">
            <div className="chart-lg">
              <AnalisisChart deals={deals} />
            </div>
          </div>
        </div>

        {/* Gráfica 3: Proyectos */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <span className="card-title-dot" style={{ background: '#F59E0B' }}></span>
                Proyectos
              </div>
              <div className="card-subtitle">Estatus de cotizaciones corporativas</div>
            </div>
            <button className="card-menu-btn">
              <i className="fas fa-ellipsis-h"></i>
            </button>
          </div>
          <div className="chart-wrap">
            <div className="chart-lg">
              <ProyectosChart deals={deals} />
            </div>
          </div>
        </div>

        {/* Gráfica 4: Carreras */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <span className="card-title-dot" style={{ background: '#EC4899' }}></span>
                Carreras
              </div>
              <div className="card-subtitle">Puntos de venta y kioscos</div>
            </div>
            <button className="card-menu-btn">
              <i className="fas fa-ellipsis-h"></i>
            </button>
          </div>
          <div className="chart-wrap">
            <div className="chart-lg">
              <CarretasChart deals={deals} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
