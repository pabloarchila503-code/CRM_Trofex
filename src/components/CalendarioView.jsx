import { useState, useMemo, useRef, useEffect, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyrI5mKnFOMo8zf8cixTy_5c8XJbgFNPxOvUbDzngEeFBdSpS6It_U-B0IOCLiefex7/exec';

const STORES = ['CB', 'CHM', 'CHQ', 'ESC', 'HH', 'JT', 'MZ', 'PT', 'PTB', 'SJ', 'SMA', 'VN', 'XL', 'Z3'];
const TRANSPORT_OPTIONS = ['Camión', 'Transporte', 'Mensajero'];
const ORDER_STATUS = ['Pendiente', 'Recibido', 'Empacado', 'Cancelado'];

const INITIAL_EVENTS = [
  { id: 'ev1', fecha: '2026-06-02', titulo: 'Entrega Medallas Ciclismo',      horaInicio: '10:00', horaFin: '11:30', prioridad: 'Alta',  descripcion: 'Despacho de medallas personalizadas para competencia en Quetzaltenango.', tienda: 'CB',   creadoPor: 'admin@tuempresa.com', replicarGlobal: false },
  { id: 'ev2', fecha: '2026-06-05', titulo: 'Corte Contable Quincenal',        horaInicio: '17:00', horaFin: '18:00', prioridad: 'Media', descripcion: 'Revisión y cierre de contabilidad del período.',                               tienda: 'Todos',creadoPor: 'admin@tuempresa.com', replicarGlobal: true  },
  { id: 'ev3', fecha: '2026-06-08', titulo: 'Despacho Trofeos Copa Oro',       horaInicio: '11:30', horaFin: '13:00', prioridad: 'Alta',  descripcion: 'Despacho de copas premium grabadas para la final de fútbol.',                 tienda: 'JT',   creadoPor: 'admin@tuempresa.com', replicarGlobal: false },
  { id: 'ev4', fecha: '2026-06-10', titulo: 'Revisión Catálogos Nuevos',       horaInicio: '09:00', horaFin: '10:30', prioridad: 'Baja',  descripcion: 'Revisión física de los nuevos marcos y muestras de acrílico.',              tienda: 'Z3',   creadoPor: 'admin@tuempresa.com', replicarGlobal: false },
  { id: 'ev5', fecha: '2026-06-15', titulo: 'Depósito Mensual Cierre',         horaInicio: '16:00', horaFin: '17:00', prioridad: 'Alta',  descripcion: 'Corte y depósito final del mes.',                                           tienda: 'Todos',creadoPor: 'admin@tuempresa.com', replicarGlobal: true  },
  { id: 'ev6', fecha: '2026-07-05', titulo: 'Llamadas de Prospección Directa', horaInicio: '10:00', horaFin: '12:00', prioridad: 'Alta',  descripcion: 'Barrido telefónico de nuevos desarrollos en Carretera al Salvador.',      tienda: 'CB',   creadoPor: 'admin@tuempresa.com', replicarGlobal: false },
  { id: 'ev7', fecha: '2026-07-05', titulo: 'Contacto Directo Clientes Corp',  horaInicio: '11:00', horaFin: '13:00', prioridad: 'Media', descripcion: 'Visita programada a instalaciones de socios estratégicos en Zacapa.',      tienda: 'Z3',   creadoPor: 'admin@tuempresa.com', replicarGlobal: false },
  { id: 'ev8', fecha: '2026-07-10', titulo: 'Entrega Trofeos Club Deportivo',  horaInicio: '09:30', horaFin: '11:00', prioridad: 'Alta',  descripcion: 'Despacho de trofeos y medallas para torneo regional.',                    tienda: 'XL',   creadoPor: 'admin@tuempresa.com', replicarGlobal: false },
  { id: 'ev9', fecha: '2026-07-12', titulo: 'Reunión Proveedor Metales',       horaInicio: '15:00', horaFin: '16:30', prioridad: 'Media', descripcion: 'Revisión de catálogo y precios de nuevas piezas.',                         tienda: 'VN',   creadoPor: 'admin@tuempresa.com', replicarGlobal: false },
  { id: 'ev10',fecha: '2026-07-15', titulo: 'Corte Quincenal de Inventario',   horaInicio: '17:00', horaFin: '18:30', prioridad: 'Alta',  descripcion: 'Conteo y ajuste de stock en todas las categorías.',                       tienda: 'Todos',creadoPor: 'admin@tuempresa.com', replicarGlobal: true  },
  { id: 'ev11',fecha: '2026-07-20', titulo: 'Campaña Grabado Especial',         horaInicio: '10:00', horaFin: '12:00', prioridad: 'Baja',  descripcion: 'Inicio de campaña de grabado personalizado para fin de año escolar.',    tienda: 'MZ',   creadoPor: 'admin@tuempresa.com', replicarGlobal: false },
  { id: 'ev12',fecha: '2026-07-28', titulo: 'Cierre Mensual Julio',            horaInicio: '16:30', horaFin: '18:00', prioridad: 'Alta',  descripcion: 'Cierre de mes, depósito y reporte a administración central.',            tienda: 'Todos',creadoPor: 'admin@tuempresa.com', replicarGlobal: true  },
];

const INITIAL_WORK_ORDERS = [
  { id: 'wo1', numero: 'DTGT/OUT/00001', tiendas: ['CB'], fechaSalidaProduccion: '2026-07-01', fechaEntregaCliente: '2026-07-05', transporte: 'Mensajero', estado: 'Empacado', notas: 'Trofeos copa regional.', archivoOrdenUrl: '', archivoValeUrl: '', creadoEn: '2026-07-01T08:00:00' },
  { id: 'wo2', numero: 'DTGT/OUT/00002', tiendas: ['JT'], fechaSalidaProduccion: '2026-07-08', fechaEntregaCliente: '2026-07-12', transporte: 'Camión',    estado: 'Recibido', notas: 'Medallas graduación.', archivoOrdenUrl: '', archivoValeUrl: '', creadoEn: '2026-07-08T09:30:00' },
];

const DAY_NAMES_SHORT  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const DAY_NAMES_FULL   = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const MONTH_NAMES_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// ─────────────────────────────────────────────────────────────────────────────
// Helper: fileToBase64
// ─────────────────────────────────────────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS PILL
// ─────────────────────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const cfg = {
    'Pendiente':   { bg: '#fef3c7', color: '#d97706', icon: 'fa-hourglass-half' },
    'Recibido':    { bg: '#e0f2fe', color: '#0284c7', icon: 'fa-box-open' },
    'Empacado':    { bg: '#d1fae5', color: '#059669', icon: 'fa-check-circle' },
    'En tránsito': { bg: '#dbeafe', color: '#2563eb', icon: 'fa-truck' },
    'Entregado':   { bg: '#d1fae5', color: '#059669', icon: 'fa-check-circle' },
    'Cancelado':   { bg: '#fee2e2', color: '#dc2626', icon: 'fa-times-circle' },
  }[status] || { bg: '#f1f5f9', color: '#64748b', icon: 'fa-circle' };
  return (
    <span style={{ fontSize: '11px', fontWeight: '700', color: cfg.color, background: cfg.bg, padding: '4px 10px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
      <i className={`fas ${cfg.icon}`} style={{ fontSize: '10px' }} /> {status}
    </span>
  );
}

function InteractiveStatusDropdown({ order, onUpdate, userRole }) {
  const cfg = {
    'Pendiente':   { bg: '#fef3c7', color: '#d97706', icon: 'fa-hourglass-half' },
    'Recibido':    { bg: '#e0f2fe', color: '#0284c7', icon: 'fa-box-open' },
    'Empacado':    { bg: '#d1fae5', color: '#059669', icon: 'fa-check-circle' },
    'En tránsito': { bg: '#dbeafe', color: '#2563eb', icon: 'fa-truck' },
    'Entregado':   { bg: '#d1fae5', color: '#059669', icon: 'fa-check-circle' },
    'Cancelado':   { bg: '#fee2e2', color: '#dc2626', icon: 'fa-times-circle' },
  }[order.estado] || { bg: '#f1f5f9', color: '#64748b', icon: 'fa-circle' };

  if (userRole !== 'admin' && userRole !== 'exportador') {
    return <StatusPill status={order.estado} />;
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} onClick={e => e.stopPropagation()}>
      <select
        value={order.estado}
        onChange={e => onUpdate(order, e.target.value)}
        style={{
          appearance: 'none',
          fontSize: '11px',
          fontWeight: '700',
          color: cfg.color,
          background: cfg.bg,
          padding: '4px 24px 4px 10px',
          borderRadius: '20px',
          border: `1px solid ${cfg.color}33`,
          cursor: 'pointer',
          outline: 'none',
          fontFamily: 'inherit',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}
      >
        {ORDER_STATUS.map(st => (
          <option key={st} value={st} style={{ background: '#fff', color: '#1e293b', fontWeight: '600' }}>{st}</option>
        ))}
      </select>
      <i className="fas fa-chevron-down" style={{ position: 'absolute', right: '9px', top: '50%', transform: 'translateY(-50%)', fontSize: '9px', color: cfg.color, pointerEvents: 'none' }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MULTI-SELECT STORE PILL (for modals)
// ─────────────────────────────────────────────────────────────────────────────
function StoreMultiSelect({ value = [], onChange, stores = STORES, disabled = false, singleValue = null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  if (disabled && singleValue) {
    return (
      <div style={{ padding: '10px 12px', background: '#f1f5f9', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <i className="fas fa-lock" style={{ fontSize: '11px', color: '#94a3b8' }} />
        {singleValue}
        <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600', marginLeft: 'auto' }}>Tu tienda asignada</span>
      </div>
    );
  }

  const label = value.length === 0 ? 'Seleccionar tienda(s)...'
    : value.length === stores.length ? 'Todas las tiendas'
    : value.join(', ');

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ width: '100%', padding: '10px 12px', background: '#fff', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: '600', color: value.length === 0 ? '#94a3b8' : '#1e293b', textAlign: 'left' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%' }}>{label}</span>
        <i className={`fas fa-chevron-${open ? 'up' : 'down'}`} style={{ fontSize: '10px', color: '#94a3b8', flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.12)', zIndex: 9999, padding: '8px', maxHeight: '220px', overflowY: 'auto' }}>
          {/* Todas */}
          <button type="button" onClick={() => onChange(value.length === stores.length ? [] : [...stores])}
            style={{ width: '100%', padding: '7px 10px', marginBottom: '6px', background: value.length === stores.length ? '#4f46e5' : '#f8fafc', color: value.length === stores.length ? '#fff' : '#64748b', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '11px', textAlign: 'left' }}>
            {value.length === stores.length ? '✓ Todas las tiendas' : 'Seleccionar todas'}
          </button>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
            {stores.map(s => {
              const sel = value.includes(s);
              return (
                <button type="button" key={s} onClick={() => onChange(sel ? value.filter(x => x !== s) : [...value, s])}
                  style={{ padding: '6px 4px', background: sel ? '#4f46e5' : '#f8fafc', color: sel ? '#fff' : '#475569', border: '1px solid ' + (sel ? '#4f46e5' : '#e2e8f0'), borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '11px', transition: 'all 0.15s' }}>
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function CalendarioView({ selectedStores = [], userRole = 'admin', addNotification }) {

  const notify = useCallback((type, msg) => {
    if (addNotification) addNotification(type, msg);
  }, [addNotification]);

  // ── Active tab ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('calendario');

  // ── Calendar date states ───────────────────────────────────────────────────
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayFilter, setSelectedDayFilter] = useState(null);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [backendConnected, setBackendConnected] = useState(false);
  const [calendarStoreFilter, setCalendarStoreFilter] = useState(STORES);
  const [storeDropOpen, setStoreDropOpen] = useState(false);
  const storeRef = useRef(null);

  const defaultStoreForUser = userRole === 'admin'
    ? (selectedStores.length > 0 && selectedStores.length < 14 ? selectedStores[0] : 'CB')
    : (selectedStores[0] || 'CB');

  // ── Work Orders State & Functions (Defined early to prevent Temporal Dead Zone ReferenceError) ──
  const [workOrders, setWorkOrders] = useState(INITIAL_WORK_ORDERS);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [orderFilter, setOrderFilter] = useState('Todas');
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileOrdenRef = useRef(null);
  const fileValeRef = useRef(null);

  const [orderForm, setOrderForm] = useState({
    numero: '', tiendas: [defaultStoreForUser],
    fechaSalidaProduccion: '', fechaEntregaCliente: '',
    transporte: TRANSPORT_OPTIONS[0], estado: 'Pendiente', notas: '',
    fileOrden: null, fileVale: null,
    archivoOrdenUrl: '', archivoValeUrl: ''
  });

  const openNewOrderModal = () => {
    setEditingOrderId(null);
    setOrderForm({
      numero: '', tiendas: [defaultStoreForUser],
      fechaSalidaProduccion: new Date().toISOString().slice(0, 10), fechaEntregaCliente: '',
      transporte: TRANSPORT_OPTIONS[0], estado: 'Pendiente', notas: '',
      fileOrden: null, fileVale: null,
      archivoOrdenUrl: '', archivoValeUrl: ''
    });
    setIsOrderModalOpen(true);
  };

  const openEditOrderModal = (order) => {
    setEditingOrderId(order.id);
    setOrderForm({
      numero: order.numero || '',
      tiendas: Array.isArray(order.tiendas) ? order.tiendas : [order.tienda || defaultStoreForUser],
      fechaSalidaProduccion: order.fechaSalidaProduccion || order.fechaSalida || '',
      fechaEntregaCliente: order.fechaEntregaCliente || order.fechaEntrega || '',
      transporte: order.transporte || TRANSPORT_OPTIONS[0],
      estado: order.estado || 'Pendiente',
      notas: order.notas || '',
      fileOrden: null, fileVale: null,
      archivoOrdenUrl: order.archivoOrdenUrl || '',
      archivoValeUrl: order.archivoValeUrl || ''
    });
    setIsOrderModalOpen(true);
  };

  const saveOrdenToSheets = async (orderData) => {
    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'saveOrden', datos: orderData }),
      });
    } catch { /* silent */ }
  };

  const handleUpdateEstado = async (order, newEstado) => {
    setWorkOrders(prev => prev.map(o => (o.id === order.id || o.numero === order.numero) ? { ...o, estado: newEstado } : o));
    notify('order', `📦 Estado actualizado: ${order.numero} → ${newEstado}`);
    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'updateOrdenEstado', datos: { id: order.id, numero: order.numero, estado: newEstado } }),
      });
    } catch { /* silent */ }
  };

  const handleDeleteOrder = async (order, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!window.confirm(`¿Estás seguro de eliminar la orden ${order.numero}?`)) return;
    setWorkOrders(prev => prev.filter(o => o.id !== order.id && o.numero !== order.numero));
    notify('order', `🗑️ Orden eliminada: ${order.numero}`);
    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'eliminarOrden', datos: { id: order.id, numero: order.numero } }),
      });
    } catch { /* silent */ }
  };

  const handleSaveOrder = async (e) => {
    e.preventDefault();
    if (!orderForm.numero.trim()) { alert('Por favor ingresa el número de orden.'); return; }
    if (!orderForm.fechaSalidaProduccion) { alert('Ingresa la Fecha de Salida de Producción.'); return; }

    let newOrdenUrl = orderForm.archivoOrdenUrl;
    let newValeUrl = orderForm.archivoValeUrl;

    if (orderForm.fileOrden || orderForm.fileVale) {
      setUploadingFiles(true);
      try {
        if (orderForm.fileOrden) {
          setUploadProgress(`Subiendo archivo de Orden: ${orderForm.fileOrden.name}…`);
          const base64 = await fileToBase64(orderForm.fileOrden);
          const res = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              action: 'subirArchivoOrden',
              datos: {
                noOrden: orderForm.numero,
                tipoArchivo: 'orden',
                base64,
                mimeType: orderForm.fileOrden.type || 'application/pdf',
                fileName: orderForm.fileOrden.name,
              },
            }),
          }).then(r => r.json());
          if (res.status === 'success' && res.url) newOrdenUrl = res.url;
        }

        if (orderForm.fileVale) {
          setUploadProgress(`Subiendo archivo de Vale: ${orderForm.fileVale.name}…`);
          const base64 = await fileToBase64(orderForm.fileVale);
          const res = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              action: 'subirArchivoOrden',
              datos: {
                noOrden: orderForm.numero,
                tipoArchivo: 'vale',
                base64,
                mimeType: orderForm.fileVale.type || 'application/pdf',
                fileName: orderForm.fileVale.name,
              },
            }),
          }).then(r => r.json());
          if (res.status === 'success' && res.url) newValeUrl = res.url;
        }
      } catch (err) {
        console.error('Error al subir archivos:', err);
      } finally {
        setUploadingFiles(false);
        setUploadProgress('');
      }
    }

    const orderObj = {
      id: editingOrderId || ('wo' + Date.now()),
      numero: orderForm.numero,
      tiendas: orderForm.tiendas,
      fechaSalidaProduccion: orderForm.fechaSalidaProduccion,
      fechaEntregaCliente: orderForm.fechaEntregaCliente,
      transporte: orderForm.transporte,
      estado: orderForm.estado,
      notas: orderForm.notas,
      archivoOrdenUrl: newOrdenUrl,
      archivoValeUrl: newValeUrl,
      creadoEn: new Date().toISOString(),
    };

    if (editingOrderId) {
      setWorkOrders(prev => prev.map(o => (o.id === editingOrderId || o.numero === orderForm.numero) ? orderObj : o));
      notify('order', `📦 Orden actualizada: ${orderForm.numero} · ${orderForm.estado}`);
    } else {
      setWorkOrders(prev => [...prev, orderObj]);
      notify('order', `📦 Nueva Orden: ${orderForm.numero} · ${orderForm.tiendas.join(', ')}`);
    }
    await saveOrdenToSheets(orderObj);
    setIsOrderModalOpen(false);
    setEditingOrderId(null);
  };

  const visibleOrders = useMemo(() => {
    let list = (userRole === 'admin' || userRole === 'exportador')
      ? workOrders
      : workOrders.filter(o => (Array.isArray(o.tiendas) ? o.tiendas : [o.tienda]).some(t => selectedStores.includes(t)));
    if (orderFilter !== 'Todas') list = list.filter(o => o.estado === orderFilter);
    return list.sort((a, b) => new Date(b.creadoEn || 0) - new Date(a.creadoEn || 0));
  }, [workOrders, userRole, selectedStores, orderFilter]);

  // Load events and orders from Sheets on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${SCRIPT_URL}?action=getCalendarEvents`).then(r => r.json());
        if (res.status === 'success' && res.eventos && res.eventos.length > 0) {
          setEvents(res.eventos);
          setBackendConnected(true);
        }
      } catch { /* use initial data */ }

      try {
        const resOrd = await fetch(`${SCRIPT_URL}?action=getOrdenes`).then(r => r.json());
        if (resOrd.status === 'success' && resOrd.ordenes && resOrd.ordenes.length > 0) {
          setWorkOrders(resOrd.ordenes);
        }
      } catch { /* use initial data */ }
    };
    load();
  }, []);

  useEffect(() => {
    function h(e) { if (storeRef.current && !storeRef.current.contains(e.target)) setStoreDropOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const toggleAllStores = () => {
    if (calendarStoreFilter.length === STORES.length) setCalendarStoreFilter([]);
    else setCalendarStoreFilter(STORES);
  };
  const toggleStoreFilter = (s) => {
    setCalendarStoreFilter(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  // ── Event modal states ─────────────────────────────────────────────────────
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedDayForEvent, setSelectedDayForEvent] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);
  const [savingEvent, setSavingEvent] = useState(false);

  const [eventForm, setEventForm] = useState({
    titulo: '', horaInicio: '09:00', horaFin: '10:00',
    prioridad: 'Media', descripcion: '',
    tiendas: [defaultStoreForUser], replicarGlobal: false,
  });

  // ── Calendar grid ──────────────────────────────────────────────────────────
  const currentMonth = currentDate.getMonth();
  const currentYear  = currentDate.getFullYear();
  const daysInMonth  = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startDayOffset = new Date(currentYear, currentMonth, 1).getDay();
  const gridDays = [...Array.from({ length: startDayOffset }, () => null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const todayISO = new Date().toISOString().slice(0, 10);

  const handlePrevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const handleGoToday   = () => { setCurrentDate(new Date()); setSelectedDayFilter(todayISO); };

  const handleDayClick = (day) => {
    if (!day) return;
    const dateKey = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    setSelectedDayFilter(prev => prev === dateKey ? null : dateKey);
  };

  const handleOpenCreateModal = () => {
    setSelectedDayForEvent(selectedDayFilter ? new Date(selectedDayFilter + 'T12:00:00') : new Date());
    setEditingEventId(null);
    setEventForm({ titulo: '', horaInicio: '09:00', horaFin: '10:00', prioridad: 'Media', descripcion: '', tiendas: [defaultStoreForUser], replicarGlobal: false });
    setIsEventModalOpen(true);
  };

  const handleEventClick = (e, evt) => {
    e.stopPropagation();
    if (evt.isOrderEvent) {
      const order = workOrders.find(o => String(o.id) === String(evt.orderId) || String(o.numero) === String(evt.orderNumero));
      if (order && typeof openEditOrderModal === 'function') {
        setActiveTab('ordenes');
        openEditOrderModal(order);
      }
      return;
    }
    setSelectedDayForEvent(new Date(evt.fecha + 'T12:00:00'));
    setEditingEventId(evt.id);
    const tiendas = evt.replicarGlobal || evt.tienda === 'Todos' ? STORES : (Array.isArray(evt.tiendas) ? evt.tiendas : [evt.tienda || defaultStoreForUser]);
    setEventForm({
      titulo: evt.titulo, horaInicio: evt.horaInicio || '09:00', horaFin: evt.horaFin || '',
      prioridad: evt.prioridad, descripcion: evt.descripcion || '',
      tiendas, replicarGlobal: evt.replicarGlobal || false,
    });
    setIsEventModalOpen(true);
  };

  const saveEventToSheets = async (eventData) => {
    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'saveCalendarEvent', datos: { ...eventData, creadoEn: new Date().toISOString() } }),
      });
    } catch { /* falla silenciosa */ }
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!eventForm.titulo.trim()) { alert('Por favor, ingresa el título del evento.'); return; }
    setSavingEvent(true);

    const isoDateStr = selectedDayForEvent.toISOString().slice(0, 10);
    const isGlobal = (eventForm.replicarGlobal && userRole === 'admin') || eventForm.tiendas.length === STORES.length;
    const finalTienda = isGlobal ? 'Todos' : eventForm.tiendas.join(', ');
    const finalTiendas = isGlobal ? STORES : eventForm.tiendas;

    if (editingEventId !== null) {
      const updated = events.map(evt => evt.id === editingEventId
        ? { ...evt, titulo: eventForm.titulo, horaInicio: eventForm.horaInicio, horaFin: eventForm.horaFin, prioridad: eventForm.prioridad, descripcion: eventForm.descripcion, tienda: finalTienda, tiendas: finalTiendas, replicarGlobal: isGlobal }
        : evt
      );
      setEvents(updated);
      await saveEventToSheets(updated.find(e => e.id === editingEventId));
      notify('event', `📝 Evento actualizado: "${eventForm.titulo}" · ${finalTienda}`);
    } else {
      const newEvent = {
        id: 'ev' + Date.now(), fecha: isoDateStr,
        titulo: eventForm.titulo, horaInicio: eventForm.horaInicio, horaFin: eventForm.horaFin,
        prioridad: eventForm.prioridad, descripcion: eventForm.descripcion,
        tienda: finalTienda, tiendas: finalTiendas,
        creadoPor: userRole === 'admin' ? 'admin@tuempresa.com' : `${(selectedStores[0] || 'cb').toLowerCase()}@tuempresa.com`,
        replicarGlobal: isGlobal,
      };
      setEvents(prev => [...prev, newEvent]);
      await saveEventToSheets(newEvent);
      notify('event', `📅 Nuevo evento: "${eventForm.titulo}" · ${isoDateStr} · ${finalTienda}`);
    }
    setSavingEvent(false);
    setIsEventModalOpen(false);
    setEditingEventId(null);
  };

  // ── Combined events (Calendar Events + Work Order Dates) ───────────────────
  const allCombinedEvents = useMemo(() => {
    const orderEvts = [];
    workOrders.forEach(o => {
      if (o.estado === 'Cancelado') return; // no mostrar cancelados en calendario
      const fSalida = o.fechaSalidaProduccion || o.fechaSalida;
      const fEntrega = o.fechaEntregaCliente || o.fechaEntrega;
      const tdas = Array.isArray(o.tiendas) ? o.tiendas : [o.tienda || 'CB'];
      const tdaSingle = tdas[0] || 'CB';

      if (fSalida) {
        orderEvts.push({
          id: `ord_sal_${o.id || o.numero}`,
          fecha: fSalida,
          titulo: `🏭 [Salida] ${o.numero}`,
          horaInicio: '08:00',
          horaFin: '10:00',
          prioridad: 'Alta',
          descripcion: `Salida de producción para orden ${o.numero}.\nTransporte: ${o.transporte || 'No asignado'}\nEstado: ${o.estado}\nNotas: ${o.notas || ''}`,
          tienda: tdaSingle,
          tiendas: tdas,
          isOrderEvent: true,
          orderId: o.id || o.numero,
          orderNumero: o.numero,
          orderType: 'salida',
          estado: o.estado
        });
      }
      if (fEntrega && fEntrega !== fSalida) {
        orderEvts.push({
          id: `ord_ent_${o.id || o.numero}`,
          fecha: fEntrega,
          titulo: `🚚 [Entrega] ${o.numero}`,
          horaInicio: '14:00',
          horaFin: '16:00',
          prioridad: 'Alta',
          descripcion: `Entrega programada al cliente para orden ${o.numero}.\nTransporte: ${o.transporte || 'No asignado'}\nEstado: ${o.estado}\nNotas: ${o.notas || ''}`,
          tienda: tdaSingle,
          tiendas: tdas,
          isOrderEvent: true,
          orderId: o.id || o.numero,
          orderNumero: o.numero,
          orderType: 'entrega',
          estado: o.estado
        });
      }
    });
    return [...events, ...orderEvts];
  }, [events, workOrders]);

  // ── Filtered events ────────────────────────────────────────────────────────
  const filteredEvents = useMemo(() => allCombinedEvents.filter(evt => {
    const storesToCheck = Array.isArray(evt.tiendas) ? evt.tiendas : [evt.tienda];
    if (evt.replicarGlobal || evt.tienda === 'Todos') return true;
    return selectedStores.length === 14 || storesToCheck.some(s => selectedStores.includes(s));
  }), [allCombinedEvents, selectedStores]);

  // ── Chronogram groups ──────────────────────────────────────────────────────
  const chronogramGroups = useMemo(() => {
    const monthStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}`;
    let evts = filteredEvents.filter(e => e.fecha && e.fecha.startsWith(monthStr));
    if (selectedDayFilter) evts = evts.filter(e => e.fecha === selectedDayFilter);
    evts = [...evts].sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.horaInicio || '').localeCompare(b.horaInicio || ''));
    const grouped = {};
    evts.forEach(evt => { if (!grouped[evt.fecha]) grouped[evt.fecha] = []; grouped[evt.fecha].push(evt); });
    return Object.entries(grouped);
  }, [filteredEvents, currentMonth, currentYear, selectedDayFilter]);

  const formatTime = (horaInicio, horaFin) => (!horaFin ? `${horaInicio} hrs` : `${horaInicio} – ${horaFin} hrs`);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="view-section active">

      {/* ── PAGE HEADER ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <p className="section-label" style={{ margin: 0 }}>Operaciones Administrativas</p>
          <h2 style={{ margin: '2px 0 0', fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>
            Calendario y Órdenes de Trabajo
            {backendConnected && <span style={{ fontSize: '10px', fontWeight: '600', color: '#059669', background: '#d1fae5', padding: '3px 8px', borderRadius: '6px', marginLeft: '10px', verticalAlign: 'middle' }}>✓ Sincronizado con Sheets</span>}
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {activeTab === 'calendario' && (
            <button className="topbar-btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '700', borderRadius: '10px' }} onClick={handleOpenCreateModal}>
              <i className="fas fa-plus" /> Añadir Actividad
            </button>
          )}
          {activeTab === 'ordenes' && (
            <button className="topbar-btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '700', borderRadius: '10px' }} onClick={openNewOrderModal}>
              <i className="fas fa-plus" /> Nueva Orden
            </button>
          )}
        </div>
      </div>

      {/* ── TABS ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '5px', borderRadius: '14px', marginBottom: '20px', width: 'fit-content' }}>
        {[
          { id: 'calendario', icon: 'fa-calendar-alt', label: 'Calendario' },
          { id: 'ordenes',    icon: 'fa-box',          label: 'Seguimiento a Órdenes' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ padding: '9px 20px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', background: activeTab === tab.id ? '#fff' : 'transparent', color: activeTab === tab.id ? '#4f46e5' : '#64748b', boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.2s' }}>
            <i className={`fas ${tab.icon}`} style={{ fontSize: '12px' }} />
            {tab.label}
            {tab.id === 'ordenes' && workOrders.filter(o => o.estado !== 'Entregado' && o.estado !== 'Cancelado').length > 0 && (
              <span style={{ background: '#ef4444', color: '#fff', fontSize: '9px', fontWeight: '800', padding: '1px 6px', borderRadius: '10px' }}>
                {workOrders.filter(o => o.estado !== 'Entregado' && o.estado !== 'Cancelado').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ═══════════════ TAB: CALENDARIO ═══════════════════════════════════ */}
      {activeTab === 'calendario' && (
        <>
          <div className="card" style={{ marginBottom: '20px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 className="card-title" style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-calendar-alt" style={{ color: 'var(--accent-coral)' }} />
                  {MONTH_NAMES_FULL[currentMonth]} {currentYear}
                </h3>
                <p className="card-subtitle">Haz clic en un día para filtrar el cronograma</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Store filter — admin only */}
                {userRole === 'admin' && (
                  <div ref={storeRef} style={{ position: 'relative' }}>
                    <button onClick={() => setStoreDropOpen(o => !o)} className="store-pill-btn"
                      style={{ padding: '7px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fas fa-store" style={{ color: 'var(--accent-coral)', fontSize: '13px' }} />
                      <span style={{ fontSize: '12px', fontWeight: '700' }}>
                        Tienda: {calendarStoreFilter.length === STORES.length ? 'Todas' : (calendarStoreFilter.length > 0 ? calendarStoreFilter.join(', ') : 'Ninguna')}
                      </span>
                      <i className={`fas fa-chevron-${storeDropOpen ? 'up' : 'down'}`} style={{ fontSize: '9px', opacity: 0.6 }} />
                    </button>
                    {storeDropOpen && (
                      <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: '#fff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', padding: '8px', zIndex: 200, width: '220px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button onClick={toggleAllStores} style={{ padding: '6px', fontSize: '11px', fontWeight: '700', background: calendarStoreFilter.length === STORES.length ? 'var(--accent-coral)' : '#F8F6F2', color: calendarStoreFilter.length === STORES.length ? '#fff' : 'var(--text-secondary)', border: '1px solid ' + (calendarStoreFilter.length === STORES.length ? 'var(--accent-coral)' : 'var(--border-light)'), borderRadius: '6px', cursor: 'pointer', width: '100%' }}>
                          Todas las tiendas
                        </button>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                          {STORES.map(s => {
                            const isSel = calendarStoreFilter.includes(s);
                            return <button key={s} onClick={() => toggleStoreFilter(s)} style={{ padding: '5px', fontSize: '11px', fontWeight: '700', background: isSel ? 'var(--accent-coral)' : '#F8F6F2', color: isSel ? '#fff' : 'var(--text-secondary)', border: '1px solid ' + (isSel ? 'var(--accent-coral)' : 'var(--border-light)'), borderRadius: '6px', cursor: 'pointer' }}>{s}</button>;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <button className="topbar-btn btn-outline" style={{ padding: '6px 10px' }} onClick={handlePrevMonth}><i className="fas fa-chevron-left" /></button>
                <button className="topbar-btn btn-outline" style={{ padding: '6px 14px', fontSize: '12px', fontWeight: '700' }} onClick={handleGoToday}>Hoy</button>
                <button className="topbar-btn btn-outline" style={{ padding: '6px 10px' }} onClick={handleNextMonth}><i className="fas fa-chevron-right" /></button>
              </div>
            </div>

            {/* Calendar grid */}
            <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--bg-body)', borderBottom: '1px solid var(--border-light)', textAlign: 'center', padding: '8px 0' }}>
                {['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'].map(d => (
                  <span key={d} style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{d}</span>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '90px', background: '#FFFFFF' }}>
                {gridDays.map((day, idx) => {
                  const dateKey   = day ? `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}` : '';
                  const isToday   = dateKey === todayISO;
                  const isSelected = dateKey === selectedDayFilter;
                  const dayEvents = day ? filteredEvents.filter(e => e.fecha === dateKey) : [];
                  return (
                    <div key={idx} onClick={() => handleDayClick(day)}
                      style={{ borderRight: '1px solid var(--border-card)', borderBottom: '1px solid var(--border-card)', padding: '8px', background: isSelected ? 'rgba(79,70,229,0.06)' : isToday ? 'rgba(255,109,77,0.02)' : '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '3px', cursor: day ? 'pointer' : 'default', transition: 'background 0.15s', outline: isSelected ? '2px solid #4f46e5' : 'none', outlineOffset: '-2px', borderRadius: isSelected ? '4px' : '0' }}>
                      {day && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '800', color: isToday ? 'var(--accent-coral)' : isSelected ? '#4f46e5' : 'var(--text-primary)', background: isToday ? 'rgba(255,109,77,0.12)' : isSelected ? 'rgba(79,70,229,0.12)' : 'transparent', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{day}</span>
                          {dayEvents.length > 0 && <span style={{ fontSize: '9px', fontWeight: '800', color: isSelected ? '#4f46e5' : '#94a3b8', background: isSelected ? 'rgba(79,70,229,0.12)' : '#f1f5f9', padding: '1px 5px', borderRadius: '10px' }}>{dayEvents.length}</span>}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
                        {dayEvents.map((evt, eIdx) => {
                          const pColor = evt.prioridad === 'Alta' ? '#EF4444' : evt.prioridad === 'Media' ? '#D97706' : '#2563EB';
                          const pBg    = evt.prioridad === 'Alta' ? 'rgba(239,68,68,0.08)' : evt.prioridad === 'Media' ? 'rgba(245,158,11,0.08)' : 'rgba(59,130,246,0.08)';
                          const isGlobal = evt.replicarGlobal || evt.tienda === 'Todos';
                          const label = evt.isOrderEvent ? evt.titulo : (isGlobal ? `[GLOBAL] ${evt.titulo}` : `[${evt.tienda}] ${evt.titulo}`);
                          return (
                            <div key={eIdx} onClick={ev => handleEventClick(ev, evt)} title={`${label} (${formatTime(evt.horaInicio, evt.horaFin)})`}
                              style={{ fontSize: '8.5px', fontWeight: '800', background: pBg, color: pColor, padding: '2px 5px', borderRadius: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', borderLeft: `2.5px solid ${pColor}` }}>
                              {label}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Chronogram */}
          <div>
            {selectedDayFilter && (
              <div style={{ background: 'linear-gradient(135deg,#eef2ff,#f0f4ff)', border: '1px solid #c7d2fe', borderRadius: '12px', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '28px', height: '28px', background: '#4f46e5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-filter" style={{ color: '#fff', fontSize: '11px' }} />
                  </div>
                  <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>
                    Mostrando solo: <strong style={{ color: '#1e293b' }}>{new Date(selectedDayFilter + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
                  </span>
                </div>
                <button onClick={() => setSelectedDayFilter(null)} style={{ fontSize: '12px', fontWeight: '700', color: '#4f46e5', background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.2)', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Ver todo el mes <i className="fas fa-times" style={{ fontSize: '10px' }} />
                </button>
              </div>
            )}

            <div style={{ background: '#fff', borderRadius: '14px', padding: '18px 24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg,#dcfce7,#bbf7d0)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-stream" style={{ color: '#16a34a', fontSize: '17px' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '15px', color: '#1e293b' }}>Cronograma de Actividades</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '1px' }}>Guardado automáticamente en Google Sheets</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {[['#94a3b8','Pasado'],['#4f46e5','Hoy'],['#f59e0b','Futuro']].map(([color, label]) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {chronogramGroups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '56px 24px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <i className="fas fa-calendar-times" style={{ fontSize: '44px', display: 'block', marginBottom: '14px', opacity: 0.25, color: '#64748b' }} />
                <p style={{ fontWeight: '800', color: '#64748b', margin: '0 0 6px', fontSize: '15px' }}>Sin actividades para este período</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <div style={{ position: 'absolute', left: '103px', top: 0, bottom: 0, width: '2px', background: '#e2e8f0', zIndex: 0 }} />
                {chronogramGroups.map(([dateKey, dayEvts], groupIdx) => {
                  const date    = new Date(dateKey + 'T12:00:00');
                  const isToday = dateKey === todayISO;
                  const isPast  = dateKey < todayISO;
                  const dotColor = isToday ? '#4f46e5' : isPast ? '#94a3b8' : '#f59e0b';
                  const dayName  = DAY_NAMES_SHORT[date.getDay()];
                  const dayNum   = date.getDate();
                  const fullLabel = `${DAY_NAMES_FULL[date.getDay()]}, ${dayNum} de ${MONTH_NAMES_FULL[date.getMonth()]}`;
                  return (
                    <div key={dateKey} style={{ display: 'flex', gap: '0', marginBottom: groupIdx < chronogramGroups.length - 1 ? '32px' : '0', position: 'relative', zIndex: 1 }}>
                      <div style={{ width: '80px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '14px', gap: '2px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: isToday ? '#4f46e5' : '#94a3b8', textTransform: 'uppercase' }}>{dayName}</span>
                        <span style={{ fontSize: '34px', fontWeight: '900', color: isToday ? '#4f46e5' : '#1e293b', lineHeight: 1 }}>{dayNum}</span>
                      </div>
                      <div style={{ width: '48px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '18px' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: dotColor, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 0 4px ${dotColor}20`, zIndex: 2 }}>
                          <i className="fas fa-play" style={{ color: '#fff', fontSize: '10px', marginLeft: '2px' }} />
                        </div>
                      </div>
                      <div style={{ flex: 1, paddingTop: '10px', paddingLeft: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '16px', fontWeight: '800', color: isToday ? '#4f46e5' : '#1e293b' }}>{fullLabel}</span>
                          {isToday  && <span style={{ fontSize: '10px', fontWeight: '800', color: '#4f46e5', background: '#ede9fe', padding: '3px 8px', borderRadius: '6px' }}>DÍA DE HOY</span>}
                          {isPast   && <span style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px' }}>PASADO</span>}
                          {!isToday && !isPast && <span style={{ fontSize: '10px', fontWeight: '700', color: '#d97706', background: '#fef3c7', padding: '3px 8px', borderRadius: '6px' }}>PRÓXIMO</span>}
                        </div>
                        {dayEvts.map(evt => {
                          const pColor = evt.prioridad === 'Alta' ? '#EF4444' : evt.prioridad === 'Media' ? '#D97706' : '#2563EB';
                          const pBg    = evt.prioridad === 'Alta' ? '#fee2e2' : evt.prioridad === 'Media' ? '#fef3c7' : '#dbeafe';
                          const isGlobal = evt.replicarGlobal || evt.tienda === 'Todos';
                          const tiendaLabel = isGlobal ? 'GLOBAL' : (evt.tienda || '');
                          return (
                            <div key={evt.id}
                              style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px 22px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', transition: 'box-shadow 0.2s,transform 0.2s' }}
                              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#fff', background: isGlobal ? '#4f46e5' : '#1e293b', padding: '4px 9px', borderRadius: '6px' }}>TIENDA: {tiendaLabel}</span>
                                  <span style={{ fontSize: '11px', fontWeight: '700', color: pColor, background: pBg, padding: '4px 9px', borderRadius: '6px' }}>{evt.prioridad}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4f46e5', background: 'rgba(79,70,229,0.07)', padding: '5px 12px', borderRadius: '8px' }}>
                                  <i className="fas fa-clock" style={{ fontSize: '12px' }} />
                                  <span style={{ fontSize: '13px', fontWeight: '700' }}>{formatTime(evt.horaInicio, evt.horaFin)}</span>
                                </div>
                              </div>
                              <div style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b', marginBottom: evt.descripcion ? '8px' : '12px', lineHeight: 1.3 }}>{evt.titulo}</div>
                              {evt.descripcion && <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, marginBottom: '14px' }}>{evt.descripcion}</div>}
                              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button onClick={ev => handleEventClick(ev, evt)}
                                  style={{ fontSize: '12px', fontWeight: '700', color: '#4f46e5', background: 'rgba(79,70,229,0.07)', border: '1px solid rgba(79,70,229,0.15)', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,70,229,0.14)'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(79,70,229,0.07)'}
                                >
                                  <i className={`fas ${evt.isOrderEvent ? 'fa-external-link-alt' : 'fa-edit'}`} style={{ fontSize: '11px' }} /> {evt.isOrderEvent ? 'Ver / Actualizar Orden' : 'Editar'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══════════════ TAB: ÓRDENES DE TRABAJO ═══════════════════════════ */}
      {activeTab === 'ordenes' && (
        <>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            {[
              { label: 'Total Órdenes', value: workOrders.length, icon: 'fa-box', color: '#4f46e5', bg: '#ede9fe' },
              { label: 'Pendientes',    value: workOrders.filter(o => o.estado === 'Pendiente').length, icon: 'fa-hourglass-half', color: '#d97706', bg: '#fef3c7' },
              { label: 'En Tránsito',  value: workOrders.filter(o => o.estado === 'En tránsito').length, icon: 'fa-truck', color: '#2563eb', bg: '#dbeafe' },
              { label: 'Entregadas',   value: workOrders.filter(o => o.estado === 'Entregado').length, icon: 'fa-check-circle', color: '#059669', bg: '#d1fae5' },
            ].map(kpi => (
              <div key={kpi.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ width: '44px', height: '44px', background: kpi.bg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`fas ${kpi.icon}`} style={{ fontSize: '18px', color: kpi.color }} />
                </div>
                <div>
                  <div style={{ fontSize: '26px', fontWeight: '900', color: '#1e293b', lineHeight: 1 }}>{kpi.value}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', marginTop: '3px' }}>{kpi.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filter bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Filtrar:</span>
            {['Todas', ...ORDER_STATUS].map(s => (
              <button key={s} onClick={() => setOrderFilter(s)}
                style={{ padding: '6px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', border: '1px solid', borderColor: orderFilter === s ? '#4f46e5' : '#e2e8f0', background: orderFilter === s ? '#4f46e5' : '#fff', color: orderFilter === s ? '#fff' : '#64748b', cursor: 'pointer', transition: 'all 0.15s' }}>
                {s}
              </button>
            ))}
          </div>

          {/* Orders Table */}
          {visibleOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 24px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <i className="fas fa-box-open" style={{ fontSize: '44px', display: 'block', marginBottom: '14px', opacity: 0.25, color: '#64748b' }} />
              <p style={{ fontWeight: '800', color: '#64748b', margin: '0 0 6px', fontSize: '15px' }}>Sin órdenes de trabajo</p>
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.9fr 1fr 1fr 1fr 1fr 0.8fr', gap: '0', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '12px 20px' }}>
                {['N° Orden','Tienda(s)','F. Salida','F. Entrega','Transporte','Estado','Archivos'].map(h => (
                  <span key={h} style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</span>
                ))}
              </div>
              {visibleOrders.map((order, idx) => {
                const tiendas = Array.isArray(order.tiendas) ? order.tiendas : [order.tienda];
                return (
                  <div key={order.id}
                    style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.9fr 1fr 1fr 1fr 1fr 0.8fr', gap: '0', padding: '14px 20px', borderBottom: idx < visibleOrders.length - 1 ? '1px solid #f1f5f9' : 'none', alignItems: 'center', transition: 'background 0.15s', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '13px', color: '#1e293b' }}>{order.numero}</div>
                      {order.notas && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{order.notas}</div>}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                      {tiendas.map(t => (
                        <span key={t} style={{ fontSize: '10px', fontWeight: '700', color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: '5px' }}>{t}</span>
                      ))}
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569', fontWeight: '600' }}>{(order.fechaSalidaProduccion || order.fechaSalida) ? new Date((order.fechaSalidaProduccion || order.fechaSalida) + 'T12:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</div>
                    <div style={{ fontSize: '12px', color: '#475569', fontWeight: '600' }}>{(order.fechaEntregaCliente || order.fechaEntrega) ? new Date((order.fechaEntregaCliente || order.fechaEntrega) + 'T12:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</div>
                    <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <i className="fas fa-truck" style={{ fontSize: '10px', color: '#94a3b8' }} /> {order.transporte}
                    </div>
                    <div><InteractiveStatusDropdown order={order} onUpdate={handleUpdateEstado} userRole={userRole} /></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
                      {/* Archivo Orden */}
                      {(order.archivoOrdenUrl || (order.archivos && order.archivos.find(a => a.url && (a.nombre?.toLowerCase().includes('orden') || a.tipo === 'orden')))) && (
                        <a href={order.archivoOrdenUrl || order.archivos.find(a => a.url && (a.nombre?.toLowerCase().includes('orden') || a.tipo === 'orden')).url} target="_blank" rel="noreferrer"
                          style={{ fontSize: '10px', fontWeight: '700', color: '#4f46e5', background: '#ede9fe', padding: '3px 8px', borderRadius: '6px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                          <i className="fas fa-file-invoice" /> Orden
                        </a>
                      )}
                      {/* Archivo Vale */}
                      {(order.archivoValeUrl || (order.archivos && order.archivos.find(a => a.url && (a.nombre?.toLowerCase().includes('vale') || a.tipo === 'vale')))) && (
                        <a href={order.archivoValeUrl || order.archivos.find(a => a.url && (a.nombre?.toLowerCase().includes('vale') || a.tipo === 'vale')).url} target="_blank" rel="noreferrer"
                          style={{ fontSize: '10px', fontWeight: '700', color: '#059669', background: '#d1fae5', padding: '3px 8px', borderRadius: '6px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                          <i className="fas fa-receipt" /> Vale
                        </a>
                      )}
                      {/* Fallback para antiguos archivos que no tengan URL identificada as Orden/Vale */}
                      {!order.archivoOrdenUrl && !order.archivoValeUrl && order.archivos && order.archivos.length > 0 && order.archivos.slice(0, 2).map((a, i) => (
                        a.url && (
                          <a key={i} href={a.url} target="_blank" rel="noreferrer"
                            style={{ fontSize: '10px', fontWeight: '700', color: '#2563eb', background: '#dbeafe', padding: '3px 8px', borderRadius: '6px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <i className="fas fa-file" /> {a.nombre ? a.nombre.slice(0, 6) + '…' : 'Archivo'}
                          </a>
                        )
                      ))}
                      <button title="Editar Orden" onClick={(e) => { e.stopPropagation(); openEditOrderModal(order); }}
                        style={{ background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.2)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', color: '#4f46e5' }}>
                        <i className="fas fa-edit" />
                      </button>
                      {userRole === 'admin' && (
                        <button title="Eliminar Orden" onClick={(e) => handleDeleteOrder(order, e)}
                          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', color: '#ef4444' }}>
                          <i className="fas fa-trash-alt" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL: Crear/Editar Evento                                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {isEventModalOpen && (
        <div className="modal-overlay active" style={{ zIndex: 10000 }}>
          <div className="modal-box" style={{ maxWidth: '520px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className={`fas ${editingEventId !== null ? 'fa-edit' : 'fa-calendar-plus'}`} style={{ color: '#4f46e5' }} />
                {editingEventId !== null ? 'Editar Evento' : `Registrar Evento · ${selectedDayForEvent?.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}`}
              </h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '16px' }} onClick={() => setIsEventModalOpen(false)}>
                <i className="fas fa-times" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ textAlign: 'left' }}>
                <label className="form-label" style={{ fontSize: '10.5px' }}>Título del Evento</label>
                <input type="text" className="form-control" placeholder="Ej: Entrega de Trofeos..." value={eventForm.titulo} onChange={e => setEventForm(p => ({ ...p, titulo: e.target.value }))} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ textAlign: 'left' }}>
                  <label className="form-label" style={{ fontSize: '10.5px' }}>⏰ Hora Inicio</label>
                  <input type="time" className="form-control" value={eventForm.horaInicio} onChange={e => setEventForm(p => ({ ...p, horaInicio: e.target.value }))} required />
                </div>
                <div className="form-group" style={{ textAlign: 'left' }}>
                  <label className="form-label" style={{ fontSize: '10.5px' }}>⏱ Hora Final</label>
                  <input type="time" className="form-control" value={eventForm.horaFin} onChange={e => setEventForm(p => ({ ...p, horaFin: e.target.value }))} />
                </div>
                <div className="form-group" style={{ textAlign: 'left' }}>
                  <label className="form-label" style={{ fontSize: '10.5px' }}>Prioridad</label>
                  <select className="select-filter" value={eventForm.prioridad} onChange={e => setEventForm(p => ({ ...p, prioridad: e.target.value }))} style={{ width: '100%', padding: '10px' }}>
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>
              </div>

              {/* Tienda — multiselect for admin, locked for store */}
              <div className="form-group" style={{ textAlign: 'left' }}>
                <label className="form-label" style={{ fontSize: '10.5px' }}>
                  🏪 Tienda(s) — Puedes seleccionar varias
                </label>
                <StoreMultiSelect
                  value={eventForm.replicarGlobal ? STORES : eventForm.tiendas}
                  onChange={v => setEventForm(p => ({ ...p, tiendas: v }))}
                  disabled={userRole !== 'admin'}
                  singleValue={selectedStores[0] || 'CB'}
                />
              </div>

              <div className="form-group" style={{ textAlign: 'left' }}>
                <label className="form-label" style={{ fontSize: '10.5px' }}>Descripción</label>
                <textarea className="form-control" placeholder="Detalles sobre el evento..." rows="3" value={eventForm.descripcion} onChange={e => setEventForm(p => ({ ...p, descripcion: e.target.value }))} />
              </div>

              {userRole === 'admin' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(79,70,229,0.05)', padding: '10px 14px', borderRadius: '8px', border: '1px dashed rgba(79,70,229,0.2)' }}>
                  <input type="checkbox" id="chk-replicar" checked={eventForm.replicarGlobal} onChange={e => setEventForm(p => ({ ...p, replicarGlobal: e.target.checked, tiendas: e.target.checked ? STORES : p.tiendas }))} style={{ cursor: 'pointer' }} />
                  <label htmlFor="chk-replicar" style={{ fontSize: '11.5px', fontWeight: '700', color: '#4f46e5', cursor: 'pointer' }}>
                    📢 Replicar en todas las tiendas (14 sucursales)
                  </label>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" className="topbar-btn btn-outline" onClick={() => setIsEventModalOpen(false)}>Cancelar</button>
                <button type="submit" className="topbar-btn btn-primary" disabled={savingEvent} style={{ opacity: savingEvent ? 0.7 : 1 }}>
                  {savingEvent ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: '6px' }} />Guardando…</> : (editingEventId !== null ? 'Guardar Cambios' : 'Registrar Evento')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODAL: Nueva / Editar Orden de Trabajo                              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {isOrderModalOpen && (
        <div className="modal-overlay active" style={{ zIndex: 10000 }}>
          <div className="modal-box" style={{ maxWidth: '580px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className={`fas ${editingOrderId ? 'fa-edit' : 'fa-box'}`} style={{ color: '#2563eb' }} />
                {editingOrderId ? 'Editar Orden de Trabajo' : 'Nueva Orden de Trabajo'}
              </h3>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '16px' }} onClick={() => setIsOrderModalOpen(false)}>
                <i className="fas fa-times" />
              </button>
            </div>

            <form onSubmit={handleSaveOrder} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ textAlign: 'left' }}>
                <label className="form-label" style={{ fontSize: '10.5px' }}>N° Orden de Trabajo</label>
                <input type="text" className="form-control" placeholder="Ej: DTGT/OUT/00001" value={orderForm.numero}
                  onChange={e => setOrderForm(p => ({ ...p, numero: e.target.value }))} required
                  style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '14px', letterSpacing: '0.05em' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ textAlign: 'left' }}>
                  <label className="form-label" style={{ fontSize: '10.5px' }}>📤 Fecha de Salida Producción</label>
                  <input type="date" className="form-control" value={orderForm.fechaSalidaProduccion} onChange={e => setOrderForm(p => ({ ...p, fechaSalidaProduccion: e.target.value }))} required />
                </div>
                <div className="form-group" style={{ textAlign: 'left' }}>
                  <label className="form-label" style={{ fontSize: '10.5px' }}>📥 Fecha de Entrega al Cliente</label>
                  <input type="date" className="form-control" value={orderForm.fechaEntregaCliente} onChange={e => setOrderForm(p => ({ ...p, fechaEntregaCliente: e.target.value }))} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ textAlign: 'left' }}>
                  <label className="form-label" style={{ fontSize: '10.5px' }}>🚚 Medio de Transporte</label>
                  <select className="select-filter" value={orderForm.transporte} onChange={e => setOrderForm(p => ({ ...p, transporte: e.target.value }))} style={{ width: '100%', padding: '10px' }}>
                    {TRANSPORT_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ textAlign: 'left' }}>
                  <label className="form-label" style={{ fontSize: '10.5px' }}>🏪 Tienda(s)</label>
                  <StoreMultiSelect
                    value={orderForm.tiendas}
                    onChange={v => setOrderForm(p => ({ ...p, tiendas: v }))}
                    disabled={userRole !== 'admin'}
                    singleValue={selectedStores[0] || 'CB'}
                  />
                </div>
              </div>

              <div className="form-group" style={{ textAlign: 'left' }}>
                <label className="form-label" style={{ fontSize: '10.5px' }}>Estado de la Orden</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {ORDER_STATUS.map(s => (
                    <button type="button" key={s} onClick={() => setOrderForm(p => ({ ...p, estado: s }))}
                      style={{ padding: '7px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '12px', border: '1px solid', borderColor: orderForm.estado === s ? '#4f46e5' : '#e2e8f0', background: orderForm.estado === s ? '#4f46e5' : '#fff', color: orderForm.estado === s ? '#fff' : '#64748b', cursor: 'pointer', transition: 'all 0.15s' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ textAlign: 'left' }}>
                <label className="form-label" style={{ fontSize: '10.5px' }}>Notas (opcional)</label>
                <textarea className="form-control" placeholder="Descripción del contenido, instrucciones especiales..." rows="2" value={orderForm.notas} onChange={e => setOrderForm(p => ({ ...p, notas: e.target.value }))} />
              </div>

              {/* Documentos: 1. Orden | 2. Vale */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* 1. Archivo de Orden */}
                <div className="form-group" style={{ textAlign: 'left' }}>
                  <label className="form-label" style={{ fontSize: '10.5px' }}>📋 1. Archivo de Orden</label>
                  <input ref={fileOrdenRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
                    onChange={e => setOrderForm(p => ({ ...p, fileOrden: e.target.files[0] || null }))}
                    style={{ display: 'none' }} />
                  <div
                    onClick={() => fileOrdenRef.current?.click()}
                    style={{ border: '2px dashed #c7d2fe', borderRadius: '10px', padding: '14px', textAlign: 'center', cursor: 'pointer', background: (orderForm.fileOrden || orderForm.archivoOrdenUrl) ? '#f0f4ff' : '#fafafa', transition: 'all 0.2s' }}
                  >
                    {orderForm.fileOrden ? (
                      <div>
                        <i className="fas fa-file-invoice" style={{ fontSize: '20px', color: '#4f46e5', marginBottom: '4px', display: 'block' }} />
                        <div style={{ fontWeight: '700', fontSize: '12px', color: '#4f46e5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{orderForm.fileOrden.name}</div>
                        <button type="button" onClick={e => { e.stopPropagation(); setOrderForm(p => ({ ...p, fileOrden: null })); if (fileOrdenRef.current) fileOrdenRef.current.value = ''; }}
                          style={{ marginTop: '6px', fontSize: '10px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700' }}>
                          Quitar
                        </button>
                      </div>
                    ) : orderForm.archivoOrdenUrl ? (
                      <div>
                        <i className="fas fa-check-circle" style={{ fontSize: '20px', color: '#4f46e5', marginBottom: '4px', display: 'block' }} />
                        <a href={orderForm.archivoOrdenUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: '12px', fontWeight: '700', color: '#4f46e5' }}>Ver Orden subida</a>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>Haz clic para reemplazar</div>
                      </div>
                    ) : (
                      <div>
                        <i className="fas fa-cloud-upload-alt" style={{ fontSize: '20px', color: '#c7d2fe', marginBottom: '4px', display: 'block' }} />
                        <div style={{ fontWeight: '700', fontSize: '12px', color: '#64748b' }}>Subir Orden</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>PDF, Imagen, Word…</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Archivo de Vale */}
                <div className="form-group" style={{ textAlign: 'left' }}>
                  <label className="form-label" style={{ fontSize: '10.5px' }}>🧾 2. Archivo de Vale</label>
                  <input ref={fileValeRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
                    onChange={e => setOrderForm(p => ({ ...p, fileVale: e.target.files[0] || null }))}
                    style={{ display: 'none' }} />
                  <div
                    onClick={() => fileValeRef.current?.click()}
                    style={{ border: '2px dashed #a7f3d0', borderRadius: '10px', padding: '14px', textAlign: 'center', cursor: 'pointer', background: (orderForm.fileVale || orderForm.archivoValeUrl) ? '#ecfdf5' : '#fafafa', transition: 'all 0.2s' }}
                  >
                    {orderForm.fileVale ? (
                      <div>
                        <i className="fas fa-receipt" style={{ fontSize: '20px', color: '#059669', marginBottom: '4px', display: 'block' }} />
                        <div style={{ fontWeight: '700', fontSize: '12px', color: '#059669', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{orderForm.fileVale.name}</div>
                        <button type="button" onClick={e => { e.stopPropagation(); setOrderForm(p => ({ ...p, fileVale: null })); if (fileValeRef.current) fileValeRef.current.value = ''; }}
                          style={{ marginTop: '6px', fontSize: '10px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700' }}>
                          Quitar
                        </button>
                      </div>
                    ) : orderForm.archivoValeUrl ? (
                      <div>
                        <i className="fas fa-check-circle" style={{ fontSize: '20px', color: '#059669', marginBottom: '4px', display: 'block' }} />
                        <a href={orderForm.archivoValeUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: '12px', fontWeight: '700', color: '#059669' }}>Ver Vale subido</a>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>Haz clic para reemplazar</div>
                      </div>
                    ) : (
                      <div>
                        <i className="fas fa-cloud-upload-alt" style={{ fontSize: '20px', color: '#a7f3d0', marginBottom: '4px', display: 'block' }} />
                        <div style={{ fontWeight: '700', fontSize: '12px', color: '#64748b' }}>Subir Vale</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>PDF, Imagen, Word…</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {uploadingFiles && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', color: '#4f46e5', fontSize: '12px', fontWeight: '700' }}>
                  <i className="fas fa-spinner fa-spin" /> {uploadProgress || 'Subiendo archivos a Google Drive…'}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" className="topbar-btn btn-outline" onClick={() => setIsOrderModalOpen(false)}>Cancelar</button>
                <button type="submit" className="topbar-btn btn-primary" disabled={uploadingFiles} style={{ opacity: uploadingFiles ? 0.7 : 1 }}>
                  {uploadingFiles ? <><i className="fas fa-spinner fa-spin" style={{ marginRight: '6px' }} />{uploadProgress || 'Subiendo…'}</> : (editingOrderId ? 'Guardar Cambios' : 'Registrar Orden')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
