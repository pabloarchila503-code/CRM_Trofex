import DealsTable from './DealsTable';
import { ProyectosChart, CarretasChart } from './Charts';
import Analisis8020View from './Analisis8020View';

export default function VentasView({ 
  subView, // 'prospecciones' | '80-20' | 'proyecto' | 'carreras'
  deals, 
  stages, 
  users, 
  customers, 
  onEditDeal, 
  onDeleteDeal,
  showToast
}) {
  return (
    <div className="view-section active">
      {subView === 'prospecciones' && (
        <div>
          <p className="section-label">Ventas — Prospecciones</p>
          <DealsTable
            deals={deals}
            stages={stages}
            users={users}
            customers={customers}
            onEditDeal={onEditDeal}
            onDeleteDeal={onDeleteDeal}
            title="Prospecciones & Oportunidades"
            showStageFilter={true}
            iconClass="fas fa-handshake"
            accentColor="var(--accent-coral)"
          />
        </div>
      )}

      {subView === '80-20' && (
        <Analisis8020View showToast={showToast} />
      )}

      {subView === 'proyecto' && (
        <div>
          <p className="section-label">Ventas — Proyecto</p>
          <div className="card" style={{ padding: '24px' }}>
            <div className="card-header" style={{ padding: 0, marginBottom: '20px' }}>
              <div>
                <h3 className="card-title" style={{ fontSize: '15px' }}>Proyectos Especiales y Corporativos</h3>
                <p className="card-subtitle font-normal text-muted mt-1">Conteo y control de cotizaciones para proyectos grandes y empresas</p>
              </div>
            </div>
            <div className="chart-wrap" style={{ padding: 0 }}>
              <div style={{ height: '360px' }}>
                <ProyectosChart deals={deals} />
              </div>
            </div>
          </div>
        </div>
      )}

      {subView === 'carreras' && (
        <div>
          <p className="section-label">Ventas — Carreras (Puntos de Venta / Kioscos)</p>
          <div className="card" style={{ padding: '24px' }}>
            <div className="card-header" style={{ padding: 0, marginBottom: '20px' }}>
              <div>
                <h3 className="card-title" style={{ fontSize: '15px' }}>Desempeño Operativo de Carreras / Kioscos</h3>
                <p className="card-subtitle font-normal text-muted mt-1">Estado de cotizaciones generadas en puntos de venta físicos</p>
              </div>
            </div>
            <div className="chart-wrap" style={{ padding: 0 }}>
              <div style={{ height: '360px' }}>
                <CarretasChart deals={deals} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
