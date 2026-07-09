import { useState, useMemo, useRef, useEffect, useCallback } from 'react';

const STORES = ['CB', 'CHM', 'CHQ', 'ESC', 'HH', 'JT', 'MZ', 'PT', 'PTB', 'SJ', 'SMA', 'VN', 'XL', 'Z3'];

const TRANSPORT_OPTIONS = ['Camión', 'Moto', 'Mensajería / Courier', 'Pick-up propio', 'Otro'];
const ORDER_STATUS = ['Pendiente', 'En tránsito', 'Entregado', 'Cancelado'];

const INITIAL_EVENTS = [
  { id: 'ev1', fecha: '2026-06-02', titulo: 'Entrega Medallas Ciclismo', horaInicio: '10:00', horaFin: '11:30', prioridad: 'Alta', descripcion: 'Despacho de medallas personalizadas para competencia en Quetzaltenango.', tienda: 'CB', creadoPor: 'margarita.cb@tuempresa.com', replicarGlobal: false },
  { id: 'ev2', fecha: '2026-06-05', titulo: 'Corte Contable Quincenal', horaInicio: '17:00', horaFin: '18:00', prioridad: 'Media', descripcion: 'Revisión y cierre de contabilidad del período.', tienda: 'Todos', creadoPor: 'admin@tuempresa.com', replicarGlobal: true },
  { id: 'ev3', fecha: '2026-06-08', titulo: 'Despacho Trofeos Copa Oro', horaInicio: '11:30', horaFin: '13:00', prioridad: 'Alta', descripcion: 'Despacho de copas premium grabadas para la final de fútbol.', tienda: 'JT', creadoPor: 'jose.jt@tuempresa.com', replicarGlobal: false },
  { id: 'ev4', fecha: '2026-06-10', titulo: 'Revisión Catálogos Nuevos', horaInicio: '09:00', horaFin: '10:30', prioridad: 'Baja', descripcion: 'Revisión física de los nuevos marcos y muestras de acrílico.', tienda: 'Z3', creadoPor: 'zoila.z3@tuempresa.com', replicarGlobal: false },
  { id: 'ev5', fecha: '2026-06-15', titulo: 'Depósito Mensual Cierre', horaInicio: '16:00', horaFin: '17:00', prioridad: 'Alta', descripcion: 'Corte y depósito final del mes.', tienda: 'Todos', creadoPor: 'admin@tuempresa.com', replicarGlobal: true },
  { id: 'ev6', fecha: '2026-07-05', titulo: 'Llamadas de Prospección Directa', horaInicio: '10:00', horaFin: '12:00', prioridad: 'Alta', descripcion: 'Barrido telefónico de nuevos desarrollos en Carretera al Salvador.', tienda: 'CB', creadoPor: 'admin@tuempresa.com', replicarGlobal: false },
  { id: 'ev7', fecha: '2026-07-05', titulo: 'Contacto Directo Clientes Corp', horaInicio: '11:00', horaFin: '13:00', prioridad: 'Media', descripcion: 'Visita programada a instalaciones de socios estratégicos en Zacapa.', tienda: 'Z3', creadoPor: 'admin@tuempresa.com', replicarGlobal: false },
  { id: 'ev8', fecha: '2026-07-10', titulo: 'Entrega Trofeos Club Deportivo', horaInicio: '09:30', horaFin: '11:00', prioridad: 'Alta', descripcion: 'Despacho de trofeos y medallas para torneo regional.', tienda: 'XL', creadoPor: 'admin@tuempresa.com', replicarGlobal: false },
  { id: 'ev9', fecha: '2026-07-12', titulo: 'Reunión Proveedor Metales', horaInicio: '15:00', horaFin: '16:30', prioridad: 'Media', descripcion: 'Revisión de catálogo y precios de nuevas piezas.', tienda: 'VN', creadoPor: 'admin@tuempresa.com', replicarGlobal: false },
  { id: 'ev10', fecha: '2026-07-15', titulo: 'Corte Quincenal de Inventario', horaInicio: '17:00', horaFin: '18:30', prioridad: 'Alta', descripcion: 'Conteo y ajuste de stock en todas las categorías.', tienda: 'Todos', creadoPor: 'admin@tuempresa.com', replicarGlobal: true },
  { id: 'ev11', fecha: '2026-07-20', titulo: 'Campaña Grabado Especial', horaInicio: '10:00', horaFin: '12:00', prioridad: 'Baja', descripcion: 'Inicio de campaña de grabado personalizado para fin de año escolar.', tienda: 'MZ', creadoPor: 'admin@tuempresa.com', replicarGlobal: false },
  { id: 'ev12', fecha: '2026-07-28', titulo: 'Cierre Mensual Julio', horaInicio: '16:30', horaFin: '18:00', prioridad: 'Alta', descripcion: 'Cierre de mes, depósito y reporte a administración central.', tienda: 'Todos', creadoPor: 'admin@tuempresa.com', replicarGlobal: true },
];

const INITIAL_WORK_ORDERS = [
  { id: 'wo1', numero: 'DTGT/OUT/00001', tienda: 'CB', fechaSalida: '2026-07-01', fechaEntrega: '2026-07-05', transporte: 'Mensajería / Courier', estado: 'Entregado', notas: 'Trofeos copa regional.', archivos: [], creadoEn: '2026-07-01T08:00:00' },
  { id: 'wo2', numero: 'DTGT/OUT/00002', tienda: 'JT', fechaSalida: '2026-07-08', fechaEntrega: '2026-07-12', transporte: 'Camión', estado: 'En tránsito', notas: 'Medallas graduación.', archivos: [], creadoEn: '2026-07-08T09:30:00' },
];

const DAY_NAMES_SHORT  = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAY_NAMES_FULL   = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const MONTH_NAMES_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzQPlY2vGQo2HEtlN0bHjLzJ9pXmSBhDQrfVRKEsLRVQtnI9YFAMoaQbCUzuDgNK7HHQQ/exec';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: upload a file to Google Drive via Apps Script
// ─────────────────────────────────────────────────────────────────────────────
async function uploadFileToDrive(file, folderName) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result.split(',')[1];
      const payload = {
        action: 'uploadFile',
        folderName: `OrdenesWork/${folderName}`,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        fileData: base64,
      };
      try {
        const url = `${APPS_SCRIPT_URL}?payload=${encodeURIComponent(JSON.stringify(payload))}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.status === 'success') resolve(data.fileUrl);
        else reject(new Error(data.message || 'Error al subir archivo'));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS PILL
// ─────────────────────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const cfg = {
    'Pendiente':   { bg: '#fef3c7', color: '#d97706', icon: 'fa-hourglass-half' },
    'En tránsito': { bg: '#dbeafe', color: '#2563eb', icon: 'fa-truck' },
    'Entregado':   { bg: '#d1fae5', color: '#059669', icon: 'fa-check-circle' },
    'Cancelado':   { bg: '#fee2e2', color: '#dc2626', icon: 'fa-times-circle' },
  }[status] || { bg: '#f1f5f9', color: '#64748b', icon: 'fa-circle' };

  return (
    <span style={{ fontSize: '11px', fontWeight: '700', color: cfg.color, background: cfg.bg, padding: '4px 10px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
      <i className={`fas ${cfg.icon}`} style={{ fontSize: '10px' }} />
      {status}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION BELL
// ─────────────────────────────────────────────────────────────────────────────
function NotificationBell({ notifications, onClear, onMarkAllRead }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const unread = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const iconForType = (type) => {
    if (type === 'event')  return { icon: 'fa-calendar-plus', color: '#4f46e5', bg: '#ede9fe' };
    if (type === 'task')   return { icon: 'fa-tasks',         color: '#059669', bg: '#d1fae5' };
    if (type === 'vale')   return { icon: 'fa-file-invoice',  color: '#d97706', bg: '#fef3c7' };
    if (type === 'order')  return { icon: 'fa-box',           color: '#2563eb', bg: '#dbeafe' };
    return { icon: 'fa-bell', color: '#64748b', bg: '#f1f5f9' };
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => { setOpen(o => !o); if (!open) onMarkAllRead(); }}
        style={{
          position: 'relative', background: open ? 'rgba(79,70,229,0.1)' : '#f8fafc',
          border: '1px solid', borderColor: open ? 'rgba(79,70,229,0.3)' : '#e2e8f0',
          borderRadius: '10px', width: '40px', height: '40px', display: 'flex',
          alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          transition: 'all 0.2s', color: open ? '#4f46e5' : '#475569',
        }}
      >
        <i className="fas fa-bell" style={{ fontSize: '15px' }} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: '-5px', right: '-5px',
            background: '#ef4444', color: '#fff', fontSize: '9px', fontWeight: '800',
            width: '18px', height: '18px', borderRadius: '50%', display: 'flex',
            alignItems: 'center', justifyContent: 'center', border: '2px solid #fff',
            animation: 'pulse 1.5s infinite',
          }}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.12)', zIndex: 300, width: '340px',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: '800', fontSize: '14px', color: '#1e293b' }}>Notificaciones</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{notifications.length} en total</div>
            </div>
            {notifications.length > 0 && (
              <button onClick={onClear} style={{ fontSize: '11px', fontWeight: '700', color: '#ef4444', background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}>
                Limpiar
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                <i className="fas fa-bell-slash" style={{ fontSize: '28px', display: 'block', marginBottom: '10px', opacity: 0.4 }} />
                <div style={{ fontSize: '13px', fontWeight: '600' }}>Sin notificaciones</div>
              </div>
            ) : (
              notifications.map(n => {
                const cfg = iconForType(n.type);
                return (
                  <div key={n.id} style={{
                    display: 'flex', gap: '12px', padding: '12px 20px',
                    borderBottom: '1px solid #f8fafc', background: n.read ? '#fff' : 'rgba(79,70,229,0.02)',
                    transition: 'background 0.2s',
                  }}>
                    <div style={{ width: '34px', height: '34px', background: cfg.bg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={`fas ${cfg.icon}`} style={{ fontSize: '13px', color: cfg.color }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b', lineHeight: 1.4 }}>{n.mensaje}</div>
                      <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px' }}>{n.hora}</div>
                    </div>
                    {!n.read && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4f46e5', flexShrink: 0, marginTop: '6px' }} />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function CalendarioView({ selectedStores = [], userRole = 'admin' }) {

  // ── Active tab ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('calendario'); // 'calendario' | 'ordenes'

  // ── Notifications ─────────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState([
    { id: 'n0', type: 'event', mensaje: '📅 Evento inicial cargado: Corte Quincenal de Inventario', hora: 'Hoy · 09:00', read: false },
    { id: 'n1', type: 'task',  mensaje: '✅ Nueva tarea registrada en Tareas de Tienda', hora: 'Ayer · 16:30', read: false },
  ]);

  const addNotification = useCallback((type, mensaje) => {
    const now = new Date();
    const hora = `${now.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} · ${now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    setNotifications(prev => [{ id: 'n' + Date.now(), type, mensaje, hora, read: false }, ...prev]);
  }, []);

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const clearAll    = () => setNotifications([]);

  // ── Calendar date states ──────────────────────────────────────────────────
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayFilter, setSelectedDayFilter] = useState(null);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [editingEventId, setEditingEventId] = useState(null);
  const [calendarStoreFilter, setCalendarStoreFilter] = useState(STORES);
  const [storeDropOpen, setStoreDropOpen] = useState(false);
  const storeRef = useRef(null);

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

  // ── Event modal states ────────────────────────────────────────────────────
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedDayForEvent, setSelectedDayForEvent] = useState(null);

  // Determine the default store for a form based on user role
  const defaultStoreForUser = userRole === 'admin'
    ? (selectedStores.length > 0 && selectedStores.length < 14 ? selectedStores[0] : 'CB')
    : (selectedStores[0] || 'CB');

  const [eventForm, setEventForm] = useState({
    titulo: '', horaInicio: '09:00', horaFin: '10:00',
    prioridad: 'Media', descripcion: '',
    tienda: defaultStoreForUser, replicarGlobal: false,
  });

  // ── Calendar grid logic ───────────────────────────────────────────────────
  const monthNames = MONTH_NAMES_FULL;
  const currentMonth = currentDate.getMonth();
  const currentYear  = currentDate.getFullYear();
  const daysInMonth  = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startDayOffset = new Date(currentYear, currentMonth, 1).getDay();
  const gridOffset = startDayOffset; // 0=Sun per JS convention; calendar starts on Sun
  const gridDays = [...Array.from({ length: gridOffset }, () => null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const todayISO = new Date().toISOString().slice(0, 10);

  const handlePrevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const handleGoToday   = () => { setCurrentDate(new Date()); setSelectedDayFilter(todayISO); };

  const handleDayClick = (day) => {
    if (!day) return;
    const dateKey = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    setSelectedDayFilter(prev => prev === dateKey ? null : dateKey);
  };

  // Open create modal
  const handleOpenCreateModal = () => {
    const targetDate = selectedDayFilter ? new Date(selectedDayFilter + 'T12:00:00') : new Date();
    setSelectedDayForEvent(targetDate);
    setEditingEventId(null);
    setEventForm({
      titulo: '', horaInicio: '09:00', horaFin: '10:00',
      prioridad: 'Media', descripcion: '',
      tienda: defaultStoreForUser, replicarGlobal: false,
    });
    setIsEventModalOpen(true);
  };

  // Click on existing event → Edit
  const handleEventClick = (e, evt) => {
    e.stopPropagation();
    setSelectedDayForEvent(new Date(evt.fecha + 'T12:00:00'));
    setEditingEventId(evt.id);
    setEventForm({
      titulo: evt.titulo, horaInicio: evt.horaInicio || evt.hora || '09:00',
      horaFin: evt.horaFin || '', prioridad: evt.prioridad,
      descripcion: evt.descripcion || '',
      tienda: evt.replicarGlobal ? defaultStoreForUser : evt.tienda,
      replicarGlobal: evt.replicarGlobal || false,
    });
    setIsEventModalOpen(true);
  };

  // Save / update event
  const handleSaveEvent = (e) => {
    e.preventDefault();
    if (!eventForm.titulo.trim()) { alert('Por favor, ingresa el título del evento.'); return; }

    const isoDateStr = selectedDayForEvent.toISOString().slice(0, 10);
    const finalTienda = eventForm.replicarGlobal && userRole === 'admin' ? 'Todos' : eventForm.tienda;

    if (editingEventId !== null) {
      setEvents(prev => prev.map(evt => evt.id === editingEventId
        ? { ...evt, titulo: eventForm.titulo, horaInicio: eventForm.horaInicio, horaFin: eventForm.horaFin, prioridad: eventForm.prioridad, descripcion: eventForm.descripcion, tienda: finalTienda, replicarGlobal: eventForm.replicarGlobal && userRole === 'admin' }
        : evt
      ));
      addNotification('event', `📝 Evento actualizado: "${eventForm.titulo}" · ${finalTienda}`);
    } else {
      const newEvent = {
        id: 'ev' + Date.now(), fecha: isoDateStr,
        titulo: eventForm.titulo, horaInicio: eventForm.horaInicio, horaFin: eventForm.horaFin,
        prioridad: eventForm.prioridad, descripcion: eventForm.descripcion,
        tienda: finalTienda,
        creadoPor: userRole === 'admin' ? 'admin@tuempresa.com' : `${(selectedStores[0] || 'cb').toLowerCase()}@tuempresa.com`,
        replicarGlobal: eventForm.replicarGlobal && userRole === 'admin',
      };
      setEvents(prev => [...prev, newEvent]);
      addNotification('event', `📅 Nuevo evento: "${eventForm.titulo}" · ${isoDateStr} · ${finalTienda}`);
    }
    setIsEventModalOpen(false);
    setEditingEventId(null);
  };

  // ── Filtered events ───────────────────────────────────────────────────────
  const filteredEvents = useMemo(() => events.filter(evt => {
    if (selectedStores.length === 14) return true;
    return evt.tienda === selectedStores[0] || evt.tienda === 'Todos' || evt.replicarGlobal;
  }), [events, selectedStores]);

  // ── Chronogram data ───────────────────────────────────────────────────────
  const chronogramGroups = useMemo(() => {
    const monthStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}`;
    let evts = filteredEvents.filter(e => e.fecha.startsWith(monthStr));
    if (selectedDayFilter) evts = evts.filter(e => e.fecha === selectedDayFilter);
    evts = [...evts].sort((a, b) => a.fecha.localeCompare(b.fecha) || (a.horaInicio || '').localeCompare(b.horaInicio || ''));
    const grouped = {};
    evts.forEach(evt => { if (!grouped[evt.fecha]) grouped[evt.fecha] = []; grouped[evt.fecha].push(evt); });
    return Object.entries(grouped);
  }, [filteredEvents, currentMonth, currentYear, selectedDayFilter]);

  // ── Work Orders ───────────────────────────────────────────────────────────
  const [workOrders, setWorkOrders] = useState(INITIAL_WORK_ORDERS);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [orderFilter, setOrderFilter] = useState('Todas');
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [orderForm, setOrderForm] = useState({
    numero: '', tienda: defaultStoreForUser,
    fechaSalida: '', fechaEntrega: '',
    transporte: TRANSPORT_OPTIONS[0], estado: 'Pendiente', notas: '',
    files: [],
  });
  const fileInputRef = useRef(null);

  const openNewOrderModal = () => {
    setEditingOrderId(null);
    setOrderForm({
      numero: '', tienda: defaultStoreForUser,
      fechaSalida: new Date().toISOString().slice(0, 10), fechaEntrega: '',
      transporte: TRANSPORT_OPTIONS[0], estado: 'Pendiente', notas: '',
      files: [],
    });
    setIsOrderModalOpen(true);
  };

  const openEditOrderModal = (order) => {
    setEditingOrderId(order.id);
    setOrderForm({
      numero: order.numero, tienda: order.tienda,
      fechaSalida: order.fechaSalida, fechaEntrega: order.fechaEntrega,
      transporte: order.transporte, estado: order.estado, notas: order.notas,
      files: [],
    });
    setIsOrderModalOpen(true);
  };

  const handleSaveOrder = async (e) => {
    e.preventDefault();
    if (!orderForm.numero.trim()) { alert('Por favor ingresa el número de orden.'); return; }
    if (!orderForm.fechaSalida)   { alert('Ingresa la Fecha de Salida.'); return; }

    let uploadedFiles = [];
    if (orderForm.files.length > 0) {
      setUploadingFiles(true);
      try {
        for (const file of orderForm.files) {
          try {
            const url = await uploadFileToDrive(file, orderForm.numero.replace(/\//g, '_'));
            uploadedFiles.push({ nombre: file.name, url });
          } catch {
            uploadedFiles.push({ nombre: file.name, url: null, error: true });
          }
        }
      } finally {
        setUploadingFiles(false);
      }
    }

    if (editingOrderId) {
      setWorkOrders(prev => prev.map(o => o.id === editingOrderId
        ? { ...o, ...orderForm, archivos: [...(o.archivos || []), ...uploadedFiles], files: undefined }
        : o
      ));
      addNotification('order', `📦 Orden actualizada: ${orderForm.numero} · ${orderForm.estado}`);
    } else {
      const newOrder = {
        id: 'wo' + Date.now(),
        numero: orderForm.numero, tienda: orderForm.tienda,
        fechaSalida: orderForm.fechaSalida, fechaEntrega: orderForm.fechaEntrega,
        transporte: orderForm.transporte, estado: orderForm.estado,
        notas: orderForm.notas, archivos: uploadedFiles,
        creadoEn: new Date().toISOString(),
      };
      setWorkOrders(prev => [...prev, newOrder]);
      addNotification('order', `📦 Nueva Orden de Trabajo: ${orderForm.numero} · ${orderForm.tienda}`);
    }
    setIsOrderModalOpen(false);
    setEditingOrderId(null);
  };

  // Filtered work orders by role
  const visibleOrders = useMemo(() => {
    let list = userRole === 'admin'
      ? workOrders
      : workOrders.filter(o => selectedStores.includes(o.tienda));
    if (orderFilter !== 'Todas') list = list.filter(o => o.estado === orderFilter);
    return list.sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn));
  }, [workOrders, userRole, selectedStores, orderFilter]);

  // ── Shared style helpers ──────────────────────────────────────────────────
  const formatTime = (horaInicio, horaFin) => {
    if (!horaFin) return `${horaInicio} hrs`;
    return `${horaInicio} – ${horaFin} hrs`;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="view-section active">

      {/* ── PAGE HEADER ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <p className="section-label" style={{ margin: 0 }}>Operaciones Administrativas</p>
          <h2 style={{ margin: '2px 0 0', fontSize: '20px', fontWeight: '800', color: '#1e293b' }}>Calendario y Órdenes de Trabajo</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <NotificationBell notifications={notifications} onClear={clearAll} onMarkAllRead={markAllRead} />
          {activeTab === 'calendario' && (
            <button
              className="topbar-btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '700', borderRadius: '10px' }}
              onClick={handleOpenCreateModal}
            >
              <i className="fas fa-plus" /> Añadir Actividad
            </button>
          )}
          {activeTab === 'ordenes' && (
            <button
              className="topbar-btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: '700', borderRadius: '10px' }}
              onClick={openNewOrderModal}
            >
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
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '9px 20px', borderRadius: '10px', fontWeight: '700', fontSize: '13px',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              background: activeTab === tab.id ? '#fff' : 'transparent',
              color: activeTab === tab.id ? '#4f46e5' : '#64748b',
              boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s',
            }}
          >
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

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB: CALENDARIO                                                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'calendario' && (
        <>
          {/* ── CALENDAR CARD ─────────────────────────────────────────────── */}
          <div className="card" style={{ marginBottom: '20px', padding: '24px' }}>
            {/* Calendar header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 className="card-title" style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="fas fa-calendar-alt" style={{ color: 'var(--accent-coral)' }} />
                  {monthNames[currentMonth]} {currentYear}
                </h3>
                <p className="card-subtitle">Haz clic en un día para filtrar el cronograma</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Store filter dropdown — admin only */}
                {userRole === 'admin' && (
                  <div ref={storeRef} style={{ position: 'relative' }}>
                    <button
                      onClick={() => setStoreDropOpen(o => !o)}
                      className="store-pill-btn"
                      style={{ padding: '7px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
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
                            return (
                              <button key={s} onClick={() => toggleStoreFilter(s)} style={{ padding: '5px', fontSize: '11px', fontWeight: '700', background: isSel ? 'var(--accent-coral)' : '#F8F6F2', color: isSel ? '#fff' : 'var(--text-secondary)', border: '1px solid ' + (isSel ? 'var(--accent-coral)' : 'var(--border-light)'), borderRadius: '6px', cursor: 'pointer' }}>
                                {s}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Nav buttons */}
                <button className="topbar-btn btn-outline" style={{ padding: '6px 10px' }} onClick={handlePrevMonth}><i className="fas fa-chevron-left" /></button>
                <button className="topbar-btn btn-outline" style={{ padding: '6px 14px', fontSize: '12px', fontWeight: '700' }} onClick={handleGoToday}>Hoy</button>
                <button className="topbar-btn btn-outline" style={{ padding: '6px 10px' }} onClick={handleNextMonth}><i className="fas fa-chevron-right" /></button>
              </div>
            </div>

            {/* Calendar grid */}
            <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              {/* Day headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--bg-body)', borderBottom: '1px solid var(--border-light)', textAlign: 'center', padding: '8px 0' }}>
                {['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'].map(d => (
                  <span key={d} style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{d}</span>
                ))}
              </div>
              <div className="calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '90px', background: '#FFFFFF' }}>
                {gridDays.map((day, idx) => {
                  const dateKey   = day ? `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}` : '';
                  const isToday   = dateKey === todayISO;
                  const isSelected = dateKey === selectedDayFilter;
                  const dayEvents = day ? filteredEvents.filter(e => e.fecha === dateKey) : [];
                  return (
                    <div key={idx} onClick={() => handleDayClick(day)}
                      style={{ borderRight: '1px solid var(--border-card)', borderBottom: '1px solid var(--border-card)', padding: '8px', background: isSelected ? 'rgba(79,70,229,0.06)' : isToday ? 'rgba(255,109,77,0.02)' : '#FFFFFF', position: 'relative', display: 'flex', flexDirection: 'column', gap: '3px', cursor: day ? 'pointer' : 'default', transition: 'background 0.15s', outline: isSelected ? '2px solid #4f46e5' : 'none', outlineOffset: '-2px', borderRadius: isSelected ? '4px' : '0' }}
                      className={day ? 'calendar-cell-hover' : ''}
                    >
                      {day && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '800', color: isToday ? 'var(--accent-coral)' : isSelected ? '#4f46e5' : 'var(--text-primary)', background: isToday ? 'rgba(255,109,77,0.12)' : isSelected ? 'rgba(79,70,229,0.12)' : 'transparent', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {day}
                          </span>
                          {dayEvents.length > 0 && (
                            <span style={{ fontSize: '9px', fontWeight: '800', color: isSelected ? '#4f46e5' : '#94a3b8', background: isSelected ? 'rgba(79,70,229,0.12)' : '#f1f5f9', padding: '1px 5px', borderRadius: '10px' }}>
                              {dayEvents.length}
                            </span>
                          )}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
                        {dayEvents.map((evt, eIdx) => {
                          const pColor = evt.prioridad === 'Alta' ? '#EF4444' : evt.prioridad === 'Media' ? '#D97706' : '#2563EB';
                          const pBg    = evt.prioridad === 'Alta' ? 'rgba(239,68,68,0.08)' : evt.prioridad === 'Media' ? 'rgba(245,158,11,0.08)' : 'rgba(59,130,246,0.08)';
                          const label  = evt.replicarGlobal || evt.tienda === 'Todos' ? `[GLOBAL] ${evt.titulo}` : `[${evt.tienda}] ${evt.titulo}`;
                          return (
                            <div key={eIdx} className="calendar-event-item"
                              onClick={(e) => handleEventClick(e, evt)}
                              title={`${label} (${formatTime(evt.horaInicio, evt.horaFin)}) — ${evt.descripcion}`}
                              style={{ fontSize: '8.5px', fontWeight: '800', background: pBg, color: pColor, padding: '2px 5px', borderRadius: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', borderLeft: `2.5px solid ${pColor}`, transition: 'opacity 0.2s' }}
                            >
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

          {/* ── CHRONOGRAM ────────────────────────────────────────────────── */}
          <div>
            {selectedDayFilter && (
              <div style={{ background: 'linear-gradient(135deg,#eef2ff,#f0f4ff)', border: '1px solid #c7d2fe', borderRadius: '12px', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '28px', height: '28px', background: '#4f46e5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-filter" style={{ color: '#fff', fontSize: '11px' }} />
                  </div>
                  <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>
                    Mostrando solo actividades para el día:{' '}
                    <strong style={{ color: '#1e293b', fontWeight: '800' }}>
                      {new Date(selectedDayFilter + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </strong>
                  </span>
                </div>
                <button onClick={() => setSelectedDayFilter(null)} style={{ fontSize: '12px', fontWeight: '700', color: '#4f46e5', background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.2)', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Ver todo el mes <i className="fas fa-times" style={{ fontSize: '10px' }} />
                </button>
              </div>
            )}

            {/* Chronogram header */}
            <div style={{ background: '#fff', borderRadius: '14px', padding: '18px 24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '42px', height: '42px', background: 'linear-gradient(135deg,#dcfce7,#bbf7d0)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="fas fa-stream" style={{ color: '#16a34a', fontSize: '17px' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '15px', color: '#1e293b' }}>Cronograma de Actividades</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '1px' }}>Listado lineal y temporal de compromisos</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {[['#94a3b8', 'Pasado'], ['#4f46e5', 'Hoy'], ['#f59e0b', 'Futuro']].map(([color, label]) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
                      <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Timeline */}
            {chronogramGroups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '56px 24px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <i className="fas fa-calendar-times" style={{ fontSize: '44px', display: 'block', marginBottom: '14px', opacity: 0.25, color: '#64748b' }} />
                <p style={{ fontWeight: '800', color: '#64748b', margin: '0 0 6px', fontSize: '15px' }}>Sin actividades para este período</p>
                <p style={{ fontSize: '12px', margin: 0, color: '#94a3b8' }}>
                  {selectedDayFilter ? 'No hay eventos para este día.' : `Haz clic en "+ Añadir Actividad" para registrar tu primer evento de ${monthNames[currentMonth]}.`}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <div style={{ position: 'absolute', left: '103px', top: 0, bottom: 0, width: '2px', background: '#e2e8f0', zIndex: 0 }} />
                {chronogramGroups.map(([dateKey, dayEvts], groupIdx) => {
                  const date     = new Date(dateKey + 'T12:00:00');
                  const isToday  = dateKey === todayISO;
                  const isPast   = dateKey < todayISO;
                  const dotColor = isToday ? '#4f46e5' : isPast ? '#94a3b8' : '#f59e0b';
                  const dayName  = DAY_NAMES_SHORT[date.getDay()];
                  const dayNum   = date.getDate();
                  const fullLabel = `${DAY_NAMES_FULL[date.getDay()]}, ${dayNum} de ${MONTH_NAMES_FULL[date.getMonth()]}`;
                  return (
                    <div key={dateKey} style={{ display: 'flex', gap: '0', marginBottom: groupIdx < chronogramGroups.length - 1 ? '32px' : '0', position: 'relative', zIndex: 1 }}>
                      <div style={{ width: '80px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '14px', gap: '2px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: isToday ? '#4f46e5' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{dayName}</span>
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
                          {isToday  && <span style={{ fontSize: '10px', fontWeight: '800', color: '#4f46e5', background: '#ede9fe', padding: '3px 8px', borderRadius: '6px', letterSpacing: '0.04em' }}>DÍA DE HOY</span>}
                          {isPast   && <span style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px' }}>PASADO</span>}
                          {!isToday && !isPast && <span style={{ fontSize: '10px', fontWeight: '700', color: '#d97706', background: '#fef3c7', padding: '3px 8px', borderRadius: '6px' }}>PRÓXIMO</span>}
                        </div>
                        {dayEvts.map(evt => {
                          const pColor = evt.prioridad === 'Alta' ? '#EF4444' : evt.prioridad === 'Media' ? '#D97706' : '#2563EB';
                          const pBg    = evt.prioridad === 'Alta' ? '#fee2e2' : evt.prioridad === 'Media' ? '#fef3c7' : '#dbeafe';
                          const isGlobal = evt.replicarGlobal || evt.tienda === 'Todos';
                          return (
                            <div key={evt.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px 22px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', transition: 'box-shadow 0.2s,transform 0.2s' }}
                              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#fff', background: isGlobal ? '#4f46e5' : '#1e293b', padding: '4px 9px', borderRadius: '6px', letterSpacing: '0.03em' }}>
                                    TIENDA: {isGlobal ? 'GLOBAL' : evt.tienda}
                                  </span>
                                  <span style={{ fontSize: '11px', fontWeight: '700', color: pColor, background: pBg, padding: '4px 9px', borderRadius: '6px' }}>{evt.prioridad}</span>
                                  {isToday && <span style={{ fontSize: '10px', fontWeight: '800', color: '#4f46e5', background: '#ede9fe', padding: '3px 8px', borderRadius: '6px' }}>HOY</span>}
                                </div>
                                {/* Time with clock icon */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4f46e5', background: 'rgba(79,70,229,0.07)', padding: '5px 12px', borderRadius: '8px', flexShrink: 0 }}>
                                  <i className="fas fa-clock" style={{ fontSize: '12px' }} />
                                  <span style={{ fontSize: '13px', fontWeight: '700' }}>{formatTime(evt.horaInicio, evt.horaFin)}</span>
                                </div>
                              </div>
                              <div style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b', marginBottom: evt.descripcion ? '8px' : '12px', lineHeight: 1.3 }}>{evt.titulo}</div>
                              {evt.descripcion && (
                                <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, marginBottom: '14px' }}>{evt.descripcion}</div>
                              )}
                              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button onClick={(e) => handleEventClick(e, evt)} style={{ fontSize: '12px', fontWeight: '700', color: '#4f46e5', background: 'rgba(79,70,229,0.07)', border: '1px solid rgba(79,70,229,0.15)', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(79,70,229,0.14)'; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(79,70,229,0.07)'; }}
                                >
                                  <i className="fas fa-edit" style={{ fontSize: '11px' }} /> Editar
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

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TAB: SEGUIMIENTO A ÓRDENES DE TRABAJO                              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'ordenes' && (
        <>
          {/* KPI strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '20px' }}>
            {[
              { label: 'Total Órdenes', value: workOrders.length, icon: 'fa-box', color: '#4f46e5', bg: '#ede9fe' },
              { label: 'Pendientes', value: workOrders.filter(o => o.estado === 'Pendiente').length, icon: 'fa-hourglass-half', color: '#d97706', bg: '#fef3c7' },
              { label: 'En Tránsito', value: workOrders.filter(o => o.estado === 'En tránsito').length, icon: 'fa-truck', color: '#2563eb', bg: '#dbeafe' },
              { label: 'Entregadas', value: workOrders.filter(o => o.estado === 'Entregado').length, icon: 'fa-check-circle', color: '#059669', bg: '#d1fae5' },
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
              <p style={{ fontSize: '12px', margin: 0, color: '#94a3b8' }}>Haz clic en "+ Nueva Orden" para comenzar el seguimiento.</p>
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.7fr 1fr 1fr 1fr 1fr 0.8fr', gap: '0', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '12px 20px' }}>
                {['N° Orden', 'Tienda', 'F. Salida', 'F. Entrega', 'Transporte', 'Estado', 'Archivos'].map(h => (
                  <span key={h} style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</span>
                ))}
              </div>
              {/* Rows */}
              {visibleOrders.map((order, idx) => (
                <div key={order.id}
                  style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.7fr 1fr 1fr 1fr 1fr 0.8fr', gap: '0', padding: '14px 20px', borderBottom: idx < visibleOrders.length - 1 ? '1px solid #f1f5f9' : 'none', alignItems: 'center', transition: 'background 0.15s', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '13px', color: '#1e293b' }}>{order.numero}</div>
                    {order.notas && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{order.notas}</div>}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', display: 'inline-block', width: 'fit-content' }}>{order.tienda}</div>
                  <div style={{ fontSize: '12px', color: '#475569', fontWeight: '600' }}>{order.fechaSalida ? new Date(order.fechaSalida + 'T12:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</div>
                  <div style={{ fontSize: '12px', color: '#475569', fontWeight: '600' }}>{order.fechaEntrega ? new Date(order.fechaEntrega + 'T12:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <i className="fas fa-truck" style={{ fontSize: '10px', color: '#94a3b8' }} /> {order.transporte}
                  </div>
                  <div><StatusPill status={order.estado} /></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {order.archivos && order.archivos.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {order.archivos.slice(0, 2).map((a, i) => (
                          a.url ? (
                            <a key={i} href={a.url} target="_blank" rel="noreferrer"
                              style={{ fontSize: '10px', fontWeight: '700', color: '#2563eb', background: '#dbeafe', padding: '2px 6px', borderRadius: '4px', textDecoration: 'none' }}>
                              <i className="fas fa-file" style={{ marginRight: '3px' }} />{a.nombre.slice(0, 8)}…
                            </a>
                          ) : (
                            <span key={i} style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                              {a.nombre.slice(0, 8)}…
                            </span>
                          )
                        ))}
                        {order.archivos.length > 2 && (
                          <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '700' }}>+{order.archivos.length - 2}</span>
                        )}
                      </div>
                    )}
                    <button onClick={() => openEditOrderModal(order)}
                      style={{ background: 'rgba(79,70,229,0.07)', border: '1px solid rgba(79,70,229,0.15)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', color: '#4f46e5' }}>
                      <i className="fas fa-edit" />
                    </button>
                  </div>
                </div>
              ))}
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
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '16px', lineHeight: 1 }} onClick={() => setIsEventModalOpen(false)}>
                <i className="fas fa-times" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Title */}
              <div className="form-group" style={{ textAlign: 'left' }}>
                <label className="form-label" style={{ fontSize: '10.5px' }}>Título del Evento</label>
                <input type="text" className="form-control" placeholder="Ej: Entrega de Trofeos..." value={eventForm.titulo} onChange={e => setEventForm(p => ({ ...p, titulo: e.target.value }))} required />
              </div>

              {/* Hora Inicio / Hora Fin / Prioridad */}
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

              {/* Tienda — admin: selector completo | store: campo bloqueado */}
              <div className="form-group" style={{ textAlign: 'left' }}>
                <label className="form-label" style={{ fontSize: '10.5px' }}>Tienda</label>
                {userRole === 'admin' ? (
                  <select className="select-filter" value={eventForm.tienda} onChange={e => setEventForm(p => ({ ...p, tienda: e.target.value }))} style={{ width: '100%', padding: '10px' }} disabled={eventForm.replicarGlobal}>
                    {STORES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <div style={{ padding: '10px 12px', background: '#f1f5f9', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fas fa-lock" style={{ fontSize: '11px', color: '#94a3b8' }} />
                    {selectedStores[0] || 'CB'}
                    <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600', marginLeft: 'auto' }}>Tu tienda asignada</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="form-group" style={{ textAlign: 'left' }}>
                <label className="form-label" style={{ fontSize: '10.5px' }}>Descripción</label>
                <textarea className="form-control" placeholder="Detalles sobre el evento..." rows="3" value={eventForm.descripcion} onChange={e => setEventForm(p => ({ ...p, descripcion: e.target.value }))} />
              </div>

              {/* Global replicate — admin only */}
              {userRole === 'admin' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(79,70,229,0.05)', padding: '10px 14px', borderRadius: '8px', border: '1px dashed rgba(79,70,229,0.2)' }}>
                  <input type="checkbox" id="chk-replicar" checked={eventForm.replicarGlobal} onChange={e => setEventForm(p => ({ ...p, replicarGlobal: e.target.checked }))} style={{ cursor: 'pointer' }} />
                  <label htmlFor="chk-replicar" style={{ fontSize: '11.5px', fontWeight: '700', color: '#4f46e5', cursor: 'pointer' }}>
                    📢 Replicar en todas las tiendas (14 sucursales)
                  </label>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" className="topbar-btn btn-outline" onClick={() => setIsEventModalOpen(false)}>Cancelar</button>
                <button type="submit" className="topbar-btn btn-primary">{editingEventId !== null ? 'Guardar Cambios' : 'Registrar Evento'}</button>
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
              {/* Order number */}
              <div className="form-group" style={{ textAlign: 'left' }}>
                <label className="form-label" style={{ fontSize: '10.5px' }}>N° Orden de Trabajo</label>
                <input type="text" className="form-control" placeholder="Ej: DTGT/OUT/00001" value={orderForm.numero}
                  onChange={e => setOrderForm(p => ({ ...p, numero: e.target.value }))} required
                  style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '14px', letterSpacing: '0.05em' }} />
              </div>

              {/* Dates row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ textAlign: 'left' }}>
                  <label className="form-label" style={{ fontSize: '10.5px' }}>📤 Fecha de Salida</label>
                  <input type="date" className="form-control" value={orderForm.fechaSalida} onChange={e => setOrderForm(p => ({ ...p, fechaSalida: e.target.value }))} required />
                </div>
                <div className="form-group" style={{ textAlign: 'left' }}>
                  <label className="form-label" style={{ fontSize: '10.5px' }}>📥 Fecha de Entrega</label>
                  <input type="date" className="form-control" value={orderForm.fechaEntrega} onChange={e => setOrderForm(p => ({ ...p, fechaEntrega: e.target.value }))} />
                </div>
              </div>

              {/* Transport + Store row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ textAlign: 'left' }}>
                  <label className="form-label" style={{ fontSize: '10.5px' }}>🚚 Medio de Transporte</label>
                  <select className="select-filter" value={orderForm.transporte} onChange={e => setOrderForm(p => ({ ...p, transporte: e.target.value }))} style={{ width: '100%', padding: '10px' }}>
                    {TRANSPORT_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ textAlign: 'left' }}>
                  <label className="form-label" style={{ fontSize: '10.5px' }}>🏪 Tienda</label>
                  {userRole === 'admin' ? (
                    <select className="select-filter" value={orderForm.tienda} onChange={e => setOrderForm(p => ({ ...p, tienda: e.target.value }))} style={{ width: '100%', padding: '10px' }}>
                      {STORES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <div style={{ padding: '10px 12px', background: '#f1f5f9', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', fontWeight: '700', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fas fa-lock" style={{ fontSize: '11px', color: '#94a3b8' }} />
                      {selectedStores[0] || 'CB'}
                    </div>
                  )}
                </div>
              </div>

              {/* Estado */}
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

              {/* Notes */}
              <div className="form-group" style={{ textAlign: 'left' }}>
                <label className="form-label" style={{ fontSize: '10.5px' }}>Notas (opcional)</label>
                <textarea className="form-control" placeholder="Descripción del contenido, instrucciones especiales..." rows="2" value={orderForm.notas} onChange={e => setOrderForm(p => ({ ...p, notas: e.target.value }))} />
              </div>

              {/* File upload */}
              <div className="form-group" style={{ textAlign: 'left' }}>
                <label className="form-label" style={{ fontSize: '10.5px' }}>📎 Adjuntar Archivos (PDF, imágenes, Word…)</label>
                <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
                  onChange={e => setOrderForm(p => ({ ...p, files: Array.from(e.target.files) }))}
                  style={{ display: 'none' }} />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{ border: '2px dashed #c7d2fe', borderRadius: '10px', padding: '20px', textAlign: 'center', cursor: 'pointer', background: orderForm.files.length > 0 ? '#f0f4ff' : '#fafafa', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#4f46e5'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#c7d2fe'}
                >
                  {orderForm.files.length > 0 ? (
                    <div>
                      <i className="fas fa-check-circle" style={{ fontSize: '22px', color: '#4f46e5', marginBottom: '6px', display: 'block' }} />
                      <div style={{ fontWeight: '700', fontSize: '13px', color: '#4f46e5' }}>{orderForm.files.length} archivo(s) seleccionado(s)</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                        {orderForm.files.map(f => f.name).join(', ')}
                      </div>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setOrderForm(p => ({ ...p, files: [] })); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                        style={{ marginTop: '8px', fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700' }}>
                        Quitar archivos
                      </button>
                    </div>
                  ) : (
                    <div>
                      <i className="fas fa-cloud-upload-alt" style={{ fontSize: '26px', color: '#c7d2fe', marginBottom: '8px', display: 'block' }} />
                      <div style={{ fontWeight: '700', fontSize: '13px', color: '#64748b' }}>Haz clic para seleccionar archivos</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>PDF, Word, Excel, imágenes — Máx. 10 MB c/u</div>
                    </div>
                  )}
                </div>
                {uploadingFiles && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', color: '#4f46e5', fontSize: '12px', fontWeight: '700' }}>
                    <i className="fas fa-spinner fa-spin" /> Subiendo archivos a Google Drive…
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" className="topbar-btn btn-outline" onClick={() => setIsOrderModalOpen(false)}>Cancelar</button>
                <button type="submit" className="topbar-btn btn-primary" disabled={uploadingFiles} style={{ opacity: uploadingFiles ? 0.7 : 1 }}>
                  {uploadingFiles ? 'Subiendo…' : (editingOrderId ? 'Guardar Cambios' : 'Registrar Orden')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pulse keyframe for notification badge */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}
