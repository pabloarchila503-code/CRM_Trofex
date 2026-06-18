/* global google */
import { useState, useMemo, useEffect } from 'react';
import { mockData } from './data/mockData';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import DashboardView from './components/DashboardView';
import TareasView from './components/TareasView';
import CalendarioView from './components/CalendarioView';
import RendimientoProgramadoView from './components/RendimientoProgramadoView';
import VentasView from './components/VentasView';
import ProspeccionesView from './components/ProspeccionesView';
import DealModal from './components/DealModal';
import StoreEditorModal from './components/StoreEditorModal';
import LockScreen from './components/LockScreen';
import Toast from './components/Toast';

// 14 stores for Venta/Meta
const STORES = [
  'CB', 'CHM', 'CHQ', 'ESC', 'HH', 'JT', 'MZ', 'PT', 'PTB', 'SJ', 'SMA', 'VN', 'XL', 'Z3'
];

// Generates initial data to match image 3 curve
function getInitialSalesTargetData() {
  return Array.from({ length: 12 }, (_, monthIdx) => {
    return STORES.map(store => {
      let venta = 0;
      let meta = 0;
      
      if (monthIdx === 1) { // Feb: Venta ~25k, Meta ~87k
        venta = store === 'CB' ? 10000 : store === 'CHQ' ? 8000 : store === 'JT' ? 7000 : 0;
        meta = 6214; 
      } else if (monthIdx === 2) { // Mar: Venta ~130k, Meta ~87k
        venta = store === 'CB' ? 30000 : store === 'CHQ' ? 25000 : store === 'JT' ? 20000 : store === 'PT' ? 15000 : store === 'PTB' ? 10000 : 6000;
        meta = 6214;
      } else if (monthIdx === 3) { // Abr: Venta ~90k, Meta ~87k
        venta = store === 'CB' ? 20000 : store === 'CHQ' ? 15000 : store === 'JT' ? 15000 : store === 'PT' ? 10000 : 6000;
        meta = 6214;
      } else if (monthIdx === 4) { // May: Venta ~95k, Meta ~90k
        venta = store === 'CB' ? 22000 : store === 'CHQ' ? 18000 : store === 'JT' ? 15000 : store === 'PT' ? 10000 : 6000;
        meta = 6428;
      } else if (monthIdx >= 6) { // Jul - Dic: Venta = 0, Meta ~98k
        venta = 0;
        meta = 7000; 
      }

      return { store, venta, meta };
    });
  });
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null); // 'admin' or 'store'
  const [activeStore, setActiveStore] = useState('CB'); // 'CB' or store code
  const [deals, setDeals] = useState(mockData.deals);
  const [currentView, setView] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDealId, setEditingDealId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [timeRange, setTimeRange] = useState('Mensual');

  // Multi-select tag filters
  const [selectedStores, setSelectedStores] = useState(['CB']); // single selected store by default
  const [selectedMonths, setSelectedMonths] = useState(() => {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const currentMonthIdx = new Date().getMonth(); // 0-11
    return [months[currentMonthIdx]];
  });

  // Tareas Checklist states for all 14 stores
  const [storeChecklists, setStoreChecklists] = useState({
    CB: {},
    CHM: {},
    CHQ: { 1: true }, // Pre-checked to match image
    ESC: {},
    HH: {},
    JT: { 1: true, 2: true, 3: true, 4: true, 5: true }, // Pre-checked to match image
    MZ: {},
    PT: {},
    PTB: {},
    SJ: {},
    SMA: {},
    VN: {},
    XL: {},
    Z3: {}
  });

  // Prospecciones State (Shared Single Source of Truth)
  const [prospecciones, setProspecciones] = useState(() => {
    if (!localStorage.getItem('MOCK_PROSPECCIONES_DB')) {
      const db = [];
      let num = 1;
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      STORES.forEach((store, sIdx) => {
        meses.forEach((month, mIdx) => {
          const seed = (sIdx * 12 + mIdx) * 31;
          const prospectados = 20 + (seed % 30);
          const contactados  = Math.floor(prospectados * 0.75);
          const cotizados    = Math.floor(contactados  * 0.6);
          const cerrados     = Math.floor(cotizados    * 0.5) + 1;
          const perdidos     = Math.floor((prospectados - cerrados) * 0.25);
          db.push({
            id: num,
            Numeración: num++,
            Mes: month,
            Tienda: store,
            Prospectados: prospectados,
            Contactados:  contactados,
            Cotizados:    cotizados,
            Cerrados:     cerrados,
            Perdidos:     perdidos,
          });
        });
      });
      localStorage.setItem('MOCK_PROSPECCIONES_DB', JSON.stringify(db));
      return db;
    }
    return JSON.parse(localStorage.getItem('MOCK_PROSPECCIONES_DB') || '[]');
  });

  useEffect(() => {
    const isGas = typeof google !== 'undefined' && google.script && google.script.run;
    if (isGas) {
      google.script.run
        .withSuccessHandler((response) => {
          if (response && response.data) {
            setProspecciones(response.data);
          }
        })
        .withFailureHandler((err) => {
          console.error('Error loading prospecciones from Google Sheets:', err);
        })
        .obtenerProspecciones();
    }
  }, []);

  // Venta/Meta state
  const [salesTargetData, setSalesTargetData] = useState(getInitialSalesTargetData());
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);

  // Lifted Cronograma states
  const [weeklyTasks, setWeeklyTasks] = useState({
    Lun: [
      { id: 1, name: 'Revisión y gestión de órdenes para la semana', icon: '📋', desc: 'Revisión y gestión de órdenes', obligatoria: true, horaInicio: '08:30', horaFin: '10:00' },
      { id: 2, name: 'Seguimiento a órdenes de Ruta de Camión', icon: '🚚', desc: 'Seguimiento a órdenes', obligatoria: true, horaInicio: '10:00', horaFin: '12:00' },
      { id: 3, name: 'Ejecución y contacto a clientes del 80/20', icon: '🎯', desc: 'Contacto a clientes', obligatoria: true, horaInicio: '13:00', horaFin: '14:30' },
      { id: 4, name: 'Ejecución y contacto a Clientes del Proyecto', icon: '🚀', desc: 'Contacto a clientes del proyecto', obligatoria: true, horaInicio: '14:30', horaFin: '16:00' },
      { id: 5, name: 'Ejecución de Seguimiento de Cartera o Cartera Muerta', icon: '👤', desc: 'Seguimiento de cartera muerta', obligatoria: true, horaInicio: '16:00', horaFin: '17:30' }
    ],
    Mar: [
      { id: 1, name: 'Seguimiento de contacto a clientes del 80/20', icon: '🎯', desc: 'Seguimiento', obligatoria: true, horaInicio: '08:30', horaFin: '10:30' },
      { id: 2, name: 'Seguimiento de contacto a Clientes del Proyecto', icon: '🚀', desc: 'Seguimiento', obligatoria: true, horaInicio: '10:30', horaFin: '12:30' },
      { id: 3, name: 'Seguimientos a Clientes Prospectados', icon: '👥', desc: 'Seguimiento', obligatoria: true, horaInicio: '13:30', horaFin: '15:30' },
      { id: 4, name: 'Primer contacto a Organizadores de Carreras', icon: '🏁', desc: 'Primer contacto', obligatoria: true, horaInicio: '15:30', horaFin: '17:30' }
    ],
    Mie: [
      { id: 1, name: 'Creación de órdenes para llenado de Sala', icon: '🏠', desc: 'Creación de órdenes', obligatoria: true, horaInicio: '08:30', horaFin: '10:00' },
      { id: 2, name: 'Seguimiento de contacto a clientes del 80/20', icon: '🎯', desc: 'Seguimiento', obligatoria: true, horaInicio: '10:00', horaFin: '12:00' },
      { id: 3, name: 'Seguimiento de contacto a Clientes del Proyecto', icon: '🚀', desc: 'Seguimiento', obligatoria: true, horaInicio: '13:00', horaFin: '14:30' },
      { id: 4, name: 'Seguimientos a Clientes Prospectados', icon: '👥', desc: 'Seguimiento', obligatoria: true, horaInicio: '14:30', horaFin: '16:00' },
      { id: 5, name: 'Primer contacto a Organizadores de Carreras', icon: '🏁', desc: 'Primer contacto', obligatoria: true, horaInicio: '16:00', horaFin: '17:30' }
    ],
    Jue: [
      { id: 1, name: 'Seguimiento de contacto a clientes del 80/20', icon: '🎯', desc: 'Seguimiento', obligatoria: true, horaInicio: '08:30', horaFin: '10:30' },
      { id: 2, name: 'Seguimiento de contacto a Clientes del Proyecto', icon: '🚀', desc: 'Seguimiento', obligatoria: true, horaInicio: '10:30', horaFin: '12:30' },
      { id: 3, name: 'Seguimientos a Clientes Prospectados', icon: '👥', desc: 'Seguimiento', obligatoria: true, horaInicio: '13:30', horaFin: '15:30' },
      { id: 4, name: 'Primer contacto a Organizadores de Carreras', icon: '🏁', desc: 'Primer contacto', obligatoria: true, horaInicio: '15:30', horaFin: '17:30' }
    ],
    Vie: [
      { id: 1, name: 'Cierre de todas las actividades', icon: '🔒', desc: 'Cierre', obligatoria: true, horaInicio: '08:30', horaFin: '12:00' },
      { id: 2, name: 'Enviar los cierres al Grupo de Supervisores', icon: '📤', desc: 'Enviar cierres', obligatoria: true, horaInicio: '13:00', horaFin: '17:30' }
    ],
    Sab: [
      { id: 1, name: 'Recopilación de información de clientes a contactar semana Siguiente', icon: '📂', desc: 'Recopilación', obligatoria: true, horaInicio: '08:30', horaFin: '10:00' },
      { id: 2, name: 'Segmentación de Clientes a contactar semana Siguiente', icon: '📊', desc: 'Segmentación', obligatoria: true, horaInicio: '10:00', horaFin: '12:00' },
      { id: 3, name: 'Presentar Proyecto', icon: '🚀', desc: 'Presentar Proyecto', obligatoria: true, horaInicio: '13:00', horaFin: '14:30' },
      { id: 4, name: 'Presentar 80/20', icon: '🎯', desc: 'Presentar 80/20', obligatoria: true, horaInicio: '14:30', horaFin: '16:00' },
      { id: 5, name: 'Prospección de Clientes', icon: '🔍', desc: 'Prospección', obligatoria: true, horaInicio: '16:00', horaFin: '17:30' }
    ]
  });

  // Nested by store: checkedTasks[storeCode][day][taskId]
  const [checkedTasks, setCheckedTasks] = useState(() => {
    const initial = {};
    STORES.forEach(store => {
      initial[store] = {
        Lun: { 1: false, 2: false, 3: false, 4: false, 5: false },
        Mar: { 1: false, 2: false, 3: false, 4: false },
        Mie: { 1: false, 2: false, 3: false, 4: false, 5: false },
        Jue: { 1: false, 2: false, 3: false, 4: false },
        Vie: { 1: false, 2: false },
        Sab: { 1: false, 2: false, 3: false, 4: false, 5: false }
      };
    });
    return initial;
  });

  // Nested by store: savedDays[storeCode][day]
  const [savedDays, setSavedDays] = useState(() => {
    const initial = {};
    STORES.forEach(store => {
      initial[store] = {
        Lun: false, Mar: false, Mie: false, Jue: false, Vie: false, Sab: false
      };
    });
    return initial;
  });

  // Auth handlers
  const handleLogin = (role, store) => {
    setUserRole(role);
    const initialStore = role === 'admin' ? 'CB' : store;
    setActiveStore(initialStore);
    setSelectedStores([initialStore]);
    setIsLoggedIn(true);
    // Force direct landing depending on role
    setView('dashboard');
    showToast(`Sesión iniciada como ${role === 'admin' ? 'Administrador' : `Asesor de Tienda (${initialStore})`}`, 'success');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    setActiveStore('CB');
    setSelectedStores(['CB']);
    setTimeRange('Mensual');
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    setSelectedMonths([months[new Date().getMonth()]]);
    showToast('Sesión cerrada con éxito', 'info');
  };

  // Toast helpers
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Checklist toggler
  const handleToggleTask = (store, taskId) => {
    setStoreChecklists(prev => {
      const storeList = { ...prev[store] };
      storeList[taskId] = !storeList[taskId];
      return { ...prev, [store]: storeList };
    });
    showToast(`Tarea actualizada para la Tienda ${store}`, 'success');
  };

  // Save to Google Sheets
  const handleSaveToSheets = (store, completed, total) => {
    showToast(`Sincronizando con Google Sheets (Tienda ${store})...`, 'info');
    setTimeout(() => {
      showToast(`¡Conexión exitosa! Registro guardado en BD_OPERACIONES para ${store} (${Math.round((completed / total) * 100)}% cumplimiento)`, 'success');
    }, 1200);
  };


  // Filter deals based on active store, selected months, and time range selection
  const filteredDeals = useMemo(() => {
    let result = deals;

    if (userRole === 'store') {
      result = result.filter(d => d.store_code === activeStore);
    } else if (userRole === 'admin') {
      if (selectedStores && selectedStores.length > 0) {
        result = result.filter(d => selectedStores.includes(d.store_code));
      }
    }

    if (selectedMonths && selectedMonths.length > 0) {
      result = result.filter(d => {
        const monthIdx  = new Date(d.created_at).getMonth(); // 0-11
        const monthName = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][monthIdx];
        return selectedMonths.includes(monthName);
      });
    }

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
  }, [deals, activeStore, userRole, selectedStores, selectedMonths, timeRange]);


  const openCount = useMemo(() => {
    return filteredDeals.filter(d => d.status === 'open').length;
  }, [filteredDeals]);

  // View titles
  const viewTitles = {
    dashboard: 'Dashboard',
    tareas: 'Checklist y Bloques Horarios',
    calendario: 'Calendario de Operaciones',
    'rendimiento-programado': 'Análisis de Cumplimiento',
    prospecciones: 'Prospecciones Comerciales',
    '80-20': 'Análisis de Red 80/20',
    proyecto: 'Proyectos Corporativos',
    carreras: 'Venta por Kioscos/Carreras'
  };

  // CRUD handlers
  const handleEditDeal = (id) => {
    setEditingDealId(id);
    setIsModalOpen(true);
  };

  const handleDeleteDeal = (id) => {
    if (window.confirm('¿Eliminar esta oportunidad? Esta acción no se puede deshacer.')) {
      setDeals(prev => prev.filter(d => d.id !== id));
      showToast('Oportunidad eliminada', 'error');
    }
  };

  const handleSaveDeal = (dealData) => {
    const { id, title, customer_id, owner_id, stage_id, status, amount } = dealData;
    
    if (id) {
      setDeals(prev => prev.map(d => {
        if (d.id === id) {
          const isWonNow = status === 'won';
          const wasWon = d.status === 'won';
          return {
            ...d,
            title,
            customer_id,
            owner_id,
            stage_id,
            status,
            amount,
            closed_at: isWonNow ? (wasWon ? d.closed_at : new Date().toISOString()) : undefined,
            expected_close_date: status !== 'won' ? (d.expected_close_date || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)) : undefined
          };
        }
        return d;
      }));
      showToast('Oportunidad actualizada con éxito', 'success');
    } else {
      const newDeal = {
        id: 'd' + Date.now(),
        title,
        customer_id,
        owner_id,
        stage_id,
        amount,
        currency: 'GTQ', // Quetzales
        status,
        store_code: userRole === 'store' ? activeStore : (activeStore === 'Todos' ? 'CB' : activeStore),
        created_at: new Date().toISOString(),
        closed_at: status === 'won' ? new Date().toISOString() : undefined,
        expected_close_date: status !== 'won' ? new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) : undefined
      };
      
      setDeals(prev => [newDeal, ...prev]);
      showToast('Oportunidad creada exitosamente', 'success');
    }
    
    setIsModalOpen(false);
    setEditingDealId(null);
  };

  // Store data saver
  const handleSaveStoreData = (monthIdx, updatedStoreItems) => {
    setSalesTargetData(prev => prev.map((monthData, idx) => {
      if (idx === monthIdx) {
        return monthData.map(existingItem => {
          const updatedItem = updatedStoreItems.find(item => item.store === existingItem.store);
          return updatedItem ? updatedItem : existingItem;
        });
      }
      return monthData;
    }));
    setIsStoreModalOpen(false);
    showToast('Ventas y metas actualizadas', 'success');
  };

  // Export PDF handler
  const handleExportPDF = () => {
    window.print();
  };

  if (!isLoggedIn) {
    return (
      <>
        <LockScreen onLogin={handleLogin} />
        {/* Toast notifications */}
        <div className="toast-container">
          {toasts.map(t => (
            <Toast
              key={t.id}
              message={t.message}
              type={t.type}
              onClose={() => removeToast(t.id)}
            />
          ))}
        </div>
      </>
    );
  }

  return (
    <div className="app-shell">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        setView={setView}
        openCount={openCount}
        onLogout={handleLogout}
        userRole={userRole}
        activeStore={activeStore}
      />

      {/* Main Wrapper */}
      <div className="main-wrapper">
        <Topbar
          title={viewTitles[currentView] || 'Trofex CRM'}
          onExportPDF={handleExportPDF}
          userRole={userRole}
          activeStore={activeStore}
          onStoreChange={(store) => {
            setActiveStore(store);
            setSelectedStores([store]);
          }}
          selectedStores={selectedStores}
          setSelectedStores={setSelectedStores}
          selectedMonths={selectedMonths}
          setSelectedMonths={setSelectedMonths}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />

        <main className="page-content">
          {currentView === 'dashboard' && (
            <DashboardView
              deals={filteredDeals}
              salesTargetData={salesTargetData}
              onOpenStoreEditor={() => setIsStoreModalOpen(true)}
              activeStore={activeStore}
              userRole={userRole}
              selectedStores={selectedStores}
              selectedMonths={selectedMonths}
              prospecciones={prospecciones}
              timeRange={timeRange}
            />
          )}

          {currentView === 'tareas' && (
            <TareasView
              activeStore={activeStore}
              userRole={userRole}
              storeChecklists={storeChecklists}
              onToggleTask={handleToggleTask}
              onSaveToSheets={handleSaveToSheets}
              checkedTasks={checkedTasks}
              setCheckedTasks={setCheckedTasks}
              savedDays={savedDays}
              setSavedDays={setSavedDays}
              weeklyTasks={weeklyTasks}
              setWeeklyTasks={setWeeklyTasks}
              timeRange={timeRange}
            />
          )}

          {currentView === 'calendario' && (
            <CalendarioView
              activeStore={activeStore}
              userRole={userRole}
              checkedTasks={checkedTasks}
              setCheckedTasks={setCheckedTasks}
              savedDays={savedDays}
              setSavedDays={setSavedDays}
              weeklyTasks={weeklyTasks}
              setWeeklyTasks={setWeeklyTasks}
            />
          )}

          {currentView === 'rendimiento-programado' && (
            <RendimientoProgramadoView
              activeStore={activeStore}
              userRole={userRole}
              checkedTasks={checkedTasks}
              weeklyTasks={weeklyTasks}
              timeRange={timeRange}
            />
          )}

          {currentView === 'prospecciones' && (
            <ProspeccionesView 
              showToast={showToast} 
              userRole={userRole}
              activeStore={activeStore}
              prospecciones={prospecciones}
              setProspecciones={setProspecciones}
            />
          )}

          {['80-20', 'proyecto', 'carreras'].includes(currentView) && (
            <VentasView
              subView={currentView}
              deals={filteredDeals}
              stages={mockData.stages}
              users={mockData.users}
              customers={mockData.customers}
              onEditDeal={handleEditDeal}
              onDeleteDeal={handleDeleteDeal}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Deal Add/Edit Modal */}
      <DealModal
        isOpen={isModalOpen}
        dealId={editingDealId}
        deals={deals}
        stages={mockData.stages}
        users={mockData.users}
        customers={mockData.customers}
        onClose={() => {
          setIsModalOpen(false);
          setEditingDealId(null);
        }}
        onSave={handleSaveDeal}
      />

      {/* Store Target/Sales Editor Modal */}
      <StoreEditorModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
        data={salesTargetData}
        onSave={handleSaveStoreData}
        userRole={userRole}
        activeStore={activeStore}
      />

      {/* Toast notifications */}
      <div className="toast-container">
        {toasts.map(t => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            onClose={() => removeToast(t.id)}
          />
        ))}
      </div>
    </div>
  );
}
