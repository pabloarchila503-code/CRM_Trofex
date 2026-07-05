import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';

const EMPTY_OBJECT = {};

const STORES = ['CB', 'CHM', 'CHQ', 'ESC', 'HH', 'JT', 'MZ', 'PT', 'PTB', 'SJ', 'SMA', 'VN', 'XL', 'Z3'];

// Time routines blocks
const TIME_BLOCKS = [
  { id: 1, range: '08:30 - 09:15', name: 'Apertura, Limpieza y Logística', desc: 'Puesta a punto física de la sala y chequeo de rutas.' },
  { id: 2, range: '09:15 - 13:00', name: 'Enfoque Técnico y Diseño', desc: 'Diseño de productos personalizados and atención reactiva.', badge: 'ARTES', badgeColor: 'rgba(59, 130, 246, 0.14)', badgeTextColor: '#3B82F6' },
  { id: 3, range: '13:00 - 14:00', name: 'Tiempo de Almuerzo y Descanso', desc: 'Tiempo para comer y descansar.', icon: '🍴' },
  { id: 4, range: '14:00 - 16:30', name: 'Prospección and Enfoque Comercial', desc: 'Llamadas telefónicas de prospección y chats proactivos.', badge: '80/20 & PROY.', badgeColor: 'rgba(16, 185, 129, 0.14)', badgeTextColor: '#10B981' },
  { id: 5, range: '16:30 - 17:30', name: 'Cierre Administrativo y CRM', desc: 'Reporte de depósitos, actualización de CRM y planificación.' }
];



export default function TareasView({ 
  selectedStores, 
  userRole, 
  userName,
  storeChecklists, 
  setStoreChecklists,
  weeklyTasks, 
  setWeeklyTasks, 
  checkedTasks, 
  setCheckedTasks,
  savedDays,
  setSavedDays,
  checklistTasks,
  setChecklistTasks,
  onSpeechAction
}) {
  const storeCode = selectedStores.length === 14 ? 'Todos' : selectedStores[0];
  const [systemTime, setSystemTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setSystemTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute active hour/minute based on system clock
  const { hour, minute } = useMemo(() => {
    return {
      hour: systemTime.getHours(),
      minute: systemTime.getMinutes()
    };
  }, [systemTime]);

  const getSystemDayTab = () => {
    const day = new Date().getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    if (day === 0) return 'Lun'; // Sunday defaults to Lun
    const dayMap = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    return dayMap[day];
  };

  const [activeTab, setActiveTab] = useState(getSystemDayTab());
  const [isUploading, setIsUploading] = useState(false);

  // States para Carga de Avances (80/20 y Proyecto)
  const [nombre8020, setNombre8020] = useState('');
  const [carrera8020, setCarrera8020] = useState('');
  const [telefono8020, setTelefono8020] = useState('');
  
  const [nombreProyecto, setNombreProyecto] = useState('');
  const [carreraProyecto, setCarreraProyecto] = useState('');
  const [telefonoProyecto, setTelefonoProyecto] = useState('');

  const [speech8020, setSpeech8020] = useState(() => {
    return localStorage.getItem('speech8020') || 'Hola {Nombre}, vimos que tienes interés en la carrera {Carrera}. ¡Déjanos saber cómo podemos ayudarte!';
  });
  const [speechProyecto, setSpeechProyecto] = useState(() => {
    return localStorage.getItem('speechProyecto') || 'Estimado(a) {Nombre}, sobre el proyecto de la carrera {Carrera}, nos gustaría agendar una llamada.';
  });
  
  const handleSaveSpeech8020 = () => {
    localStorage.setItem('speech8020', speech8020);
    alert('Speech de 80/20 guardado exitosamente.');
  };
  const handleSaveSpeechProyecto = () => {
    localStorage.setItem('speechProyecto', speechProyecto);
    alert('Speech de Proyecto guardado exitosamente.');
  };

  const currentDayOfWeek = new Date().getDay();
  const canUploadExcel = currentDayOfWeek === 5 || currentDayOfWeek === 6; // Viernes (5) o Sábado (6)

  const formatSpeech = (speech, nombre, carrera) => {
    let formatted = speech;
    if (nombre) formatted = formatted.replace(/{Nombre}/g, nombre);
    if (carrera) formatted = formatted.replace(/{Carrera}/g, carrera);
    return formatted;
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert('Texto copiado al portapapeles');
  };

  const handleWhatsApp = (phone, text) => {
    if (!phone) {
      alert('Por favor ingresa un número de teléfono válido (ej: 502XXXXXXXX).');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result.split(',')[1]; // Extract base64 part
        const today = new Date();
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const folderName = `${monthNames[today.getMonth()]} ${today.getFullYear()}`;
        const storeName = selectedStores.length === 1 ? selectedStores[0] : (userName || 'Red');
        const finalFileName = `${storeName}_${type}_${file.name}`;

        const payload = {
          action: 'uploadFile',
          fileName: finalFileName,
          mimeType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          folderName: folderName,
          fileData: base64Data
        };

        const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxf1aiVy7IBo7LCKbTcfLM9u3QWofCleGi57QqwdQQcd1humHOjFOaV8t0XCUtFU5sy/exec";

        try {
          const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'text/plain', // text/plain es el único Content-Type permitido en modo no-cors
            },
            body: JSON.stringify(payload)
          });
          
          // Because of no-cors, response is opaque, we just assume success if no error thrown
          alert(`Archivo "${file.name}" de ${type} subido exitosamente a Google Drive.`);
        } catch (fetchError) {
          console.error("Fetch error:", fetchError);
          alert('Hubo un error de conexión al subir el archivo.');
        } finally {
          setIsUploading(false);
          e.target.value = null; // reset input
        }
      };
      
      reader.onerror = () => {
        alert('Error al leer el archivo localmente.');
        setIsUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      alert('Error inesperado al preparar la subida.');
      setIsUploading(false);
    }
  };

  // Drag and drop states
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [draggedChecklistIndex, setDraggedChecklistIndex] = useState(null);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    setWeeklyTasks(prev => {
      const currentList = [...(prev[activeTab] || [])];
      const [draggedItem] = currentList.splice(draggedIndex, 1);
      currentList.splice(targetIndex, 0, draggedItem);
      return {
        ...prev,
        [activeTab]: currentList
      };
    });
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleChecklistDrop = (e, targetRenderedIndex) => {
    e.preventDefault();
    if (draggedChecklistIndex === null || draggedChecklistIndex === targetRenderedIndex) return;

    const draggedTask = visibleChecklistTasks[draggedChecklistIndex];
    const targetTask = visibleChecklistTasks[targetRenderedIndex];
    if (!draggedTask || !targetTask) return;

    setChecklistTasks(prev => {
      const newList = [...prev];
      const origDraggedIdx = newList.findIndex(t => t.id === draggedTask.id);
      const origTargetIdx = newList.findIndex(t => t.id === targetTask.id);

      if (origDraggedIdx !== -1 && origTargetIdx !== -1) {
        const [movedItem] = newList.splice(origDraggedIdx, 1);
        newList.splice(origTargetIdx, 0, movedItem);
      }
      return newList;
    });

    setDraggedChecklistIndex(null);
  };

  // Checklist Administration states
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [checklistFormName, setChecklistFormName] = useState('');
  const [checklistFormDesc, setChecklistFormDesc] = useState('');
  const [checklistFormInicio, setChecklistFormInicio] = useState('08:30');
  const [checklistFormFin, setChecklistFormFin] = useState('17:30');
  const [checklistFormStores, setChecklistFormStores] = useState(['All']);
  const [editingChecklistTaskId, setEditingChecklistTaskId] = useState(null);

  const getBlockFromTime = (timeStrVal) => {
    if (!timeStrVal) return 1;
    const [h, m] = timeStrVal.split(':').map(Number);
    const minutes = h * 60 + m;
    if (minutes < 555) return 1;   // before 09:15
    if (minutes < 780) return 2;   // before 13:00
    if (minutes < 840) return 3;   // before 14:00
    if (minutes < 990) return 4;   // before 16:30
    return 5;                     // 16:30 onwards
  };

  const handleOpenAddChecklistModal = () => {
    setEditingChecklistTaskId(null);
    setChecklistFormName('');
    setChecklistFormDesc('');
    setChecklistFormInicio('08:30');
    setChecklistFormFin('17:30');
    setChecklistFormStores(['All']);
    setIsChecklistModalOpen(true);
  };

  const handleOpenEditChecklistModal = (task) => {
    setEditingChecklistTaskId(task.id);
    setChecklistFormName(task.name);
    setChecklistFormDesc(task.desc || '');
    setChecklistFormInicio(task.horaInicio || '08:30');
    setChecklistFormFin(task.horaFin || '17:30');
    setChecklistFormStores(task.stores || ['All']);
    setIsChecklistModalOpen(true);
  };

  const handleSaveChecklistTask = (e) => {
    e.preventDefault();
    if (!checklistFormName) return;
    if (!checklistFormStores || checklistFormStores.length === 0) {
      alert('Por favor selecciona al menos una tienda antes de guardar.');
      return;
    }

    const block = getBlockFromTime(checklistFormInicio);
    
    if (editingChecklistTaskId !== null) {
      setChecklistTasks(prev => prev.map(t => 
        t.id === editingChecklistTaskId 
          ? { ...t, name: checklistFormName, desc: checklistFormDesc, horaInicio: checklistFormInicio, horaFin: checklistFormFin, block, stores: checklistFormStores }
          : t
      ));
    } else {
      const newId = Date.now();
      const newTask = {
        id: newId,
        name: checklistFormName,
        desc: checklistFormDesc,
        horaInicio: checklistFormInicio,
        horaFin: checklistFormFin,
        block,
        icon: '📋',
        stores: checklistFormStores
      };
      setChecklistTasks(prev => [...prev, newTask]);
    }
    setIsChecklistModalOpen(false);
  };

  const handleDeleteChecklistTask = (taskId) => {
    if (window.confirm('¿Seguro que deseas eliminar esta tarea del checklist?')) {
      setChecklistTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };

  // Admin tasks management states
  const [adminActividad, setAdminActividad] = useState('');
  const [adminDescripcion, setAdminDescripcion] = useState('');
  const [adminHoraInicio, setAdminHoraInicio] = useState('08:30');
  const [adminHoraFin, setAdminHoraFin] = useState('17:30');
  const [adminTaskStores, setAdminTaskStores] = useState(["CB","CHM","CHQ","ESC","HH","JT","MZ","PT","PTB","SJ","SMA","VN","XL","Z3"]);
  const [adminStoresOpen, setAdminStoresOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [adminPromptTxt, setAdminPromptTxt] = useState('');
  const [isAdminTaskModalOpen, setIsAdminTaskModalOpen] = useState(false);

  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertDismissedToday, setAlertDismissedToday] = useState(false);





  // Checklist for selected store — MUST be before any useEffect that uses storeCode
  
  const currentChecklist = storeChecklists[storeCode] || EMPTY_OBJECT;

  // Alert Modal Check Effect
  useEffect(() => {
    const currentDay = new Date().getDay();
    const isWorkDay = currentDay >= 1 && currentDay <= 6;
    const todayTabLabel = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'][currentDay];
    const isDaySaved = savedDays[storeCode]?.[todayTabLabel] || false;
    const currentMinutesVal = hour * 60 + minute;

    if (isWorkDay && currentMinutesVal >= 990 && !isDaySaved && !alertDismissedToday && !isAlertModalOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAlertModalOpen(true);
    }
  }, [hour, minute, savedDays, storeCode, alertDismissedToday, isAlertModalOpen]);

  // Rule of freezing at 9:15 AM
  const aperturaFrozen = useMemo(() => {
    const currentMinutes = hour * 60 + minute;
    return currentMinutes >= 555; // 09:15 in minutes is 9 * 60 + 15 = 555
  }, [hour, minute]);

  // Calculate active block
  const activeBlockId = useMemo(() => {
    const minutes = hour * 60 + minute;
    if (minutes >= 510 && minutes < 555) return 1;   // 08:30 - 09:15
    if (minutes >= 555 && minutes < 780) return 2;   // 09:15 - 13:00
    if (minutes >= 780 && minutes < 840) return 3;   // 13:00 - 14:00
    if (minutes >= 840 && minutes < 990) return 4;   // 14:00 - 16:30
    if (minutes >= 990 && minutes < 1050) return 5;  // 16:30 - 17:30
    return null;
  }, [hour, minute]);

  // Filter checklist tasks by active store
  const visibleChecklistTasks = selectedStores.length === 14
    ? checklistTasks
    : checklistTasks.filter(t => !t.stores || t.stores.includes('All') || selectedStores.some(s => t.stores.includes(s)));

  const completedCount = visibleChecklistTasks.filter(t => !!currentChecklist[t.id]).length;

  const completionPercent = visibleChecklistTasks.length > 0 
    ? Math.round((completedCount / visibleChecklistTasks.length) * 100) 
    : 0;


  // Get ISO week number
  const getWeekNumber = (d) => {
    const target = new Date(d.valueOf());
    const dayNr = (d.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target) / 604800000);
  };

  // Calculate dynamic week dates starting on Monday of this week
  const getWeekDayDates = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const distance = currentDay === 0 ? -6 : 1 - currentDay; // distance to Monday
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + distance);
    
    const dayMap = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    const dayInitials = { Lun: 'L', Mar: 'M', Mie: 'M', Jue: 'J', Vie: 'V', Sab: 'S' };
    const weekNo = getWeekNumber(today);
    
    const daysData = {};
    dayMap.forEach((day, index) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + index);
      const dayNum = d.getDate().toString().padStart(2, '0');
      const initial = dayInitials[day];
      daysData[day] = {
        label: `S${weekNo}-${initial}${dayNum}`,
        date: d
      };
    });
    
    return daysData;
  }, []);

  const monthYearLabel = useMemo(() => {
    const today = new Date();
    const monthNamesUpper = [
      'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
      'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
    ];
    return `${monthNamesUpper[today.getMonth()]} ${today.getFullYear()}`;
  }, []);

  // Compute tasks for current selected tab
  const activeTasks = useMemo(() => {
    return weeklyTasks[activeTab] || [];
  }, [weeklyTasks, activeTab]);

  const todayTab = useMemo(() => {
    const day = systemTime.getDay();
    const dayMap = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    return dayMap[day];
  }, [systemTime]);

  const getTaskEndMinutes = (horaFin) => {
    if (!horaFin) return 9999;
    const [h, m] = horaFin.split(':').map(Number);
    return h * 60 + m;
  };

  const currentMinutes = hour * 60 + minute;

  const formatTime12h = (timeStr) => {
    if (!timeStr) return '';
    const [hStr, mStr] = timeStr.split(':');
    const h = parseInt(hStr, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH.toString().padStart(2, '0')}:${mStr} ${ampm}`;
  };

  // Toggle tasks checkbox handler
  const handleToggleCronogramaTask = (taskId) => {
    if (selectedStores.length === 14) return;
    const isDaySaved = savedDays[storeCode]?.[activeTab] || false;
    const task = (weeklyTasks[activeTab] || []).find(t => t.id === taskId);
    const isExpired = activeTab === todayTab && task?.horaFin && (currentMinutes > getTaskEndMinutes(task.horaFin));
    if (isDaySaved || isExpired) return;

    setCheckedTasks(prev => {
      const storeChecks = { ...prev[storeCode] };
      const dayTasks = { ...storeChecks[activeTab] };
      dayTasks[taskId] = !dayTasks[taskId];
      storeChecks[activeTab] = dayTasks;
      return { ...prev, [storeCode]: storeChecks };
    });
  };

  // Save Progress click handler
  const handleSaveProgress = () => {
    setSavedDays(prev => {
      const storeSaved = { ...prev[storeCode] };
      storeSaved[activeTab] = true;
      return { ...prev, [storeCode]: storeSaved };
    });
    alert(`Sincronización exitosa con BD_Historial_Cronograma. Las actividades para el día ${activeTab} se han congelado.`);
  };

  // Admin tasks management handlers
  const handleOpenAddAdminTaskModal = () => {
    setEditingTaskId(null);
    setAdminActividad('');
    setAdminDescripcion('');
    setAdminPromptTxt('');
    setAdminTaskStores(['All']);
    setAdminHoraInicio('08:30');
    setAdminHoraFin('17:30');
    setIsAdminTaskModalOpen(true);
  };

  const handleSaveAdminTask = (e) => {
    e.preventDefault();
    if (!adminActividad.trim()) return;
    if (!adminTaskStores || adminTaskStores.length === 0) {
      alert('Por favor selecciona al menos una tienda antes de guardar.');
      return;
    }

    setWeeklyTasks(prev => {
      const dayTasks = [...(prev[activeTab] || [])];
      if (editingTaskId !== null) {
        const updated = dayTasks.map(t => {
          if (t.id === editingTaskId) {
            return {
              ...t,
              name: adminActividad,
              desc: adminDescripcion,
              promptTxt: adminPromptTxt,
              stores: adminTaskStores,
              icon: t.icon || '📋',
              horaInicio: adminHoraInicio,
              horaFin: adminHoraFin
            };
          }
          return t;
        });
        return { ...prev, [activeTab]: updated };
      } else {
        const newId = dayTasks.length > 0 ? Math.max(...dayTasks.map(t => t.id)) + 1 : 1;
        const newTask = {
          id: newId,
          name: adminActividad,
          desc: adminDescripcion,
          promptTxt: adminPromptTxt,
          stores: adminTaskStores,
          icon: '📋',
          horaInicio: adminHoraInicio,
          horaFin: adminHoraFin
        };
        return { ...prev, [activeTab]: [...dayTasks, newTask] };
      }
    });

    setIsAdminTaskModalOpen(false);
  };

  const handleEditAdminTask = (task) => {
    setAdminActividad(task.name);
    setAdminDescripcion(task.desc || '');
    setAdminPromptTxt(task.promptTxt || '');
    setAdminTaskStores(task.stores || ['All']);
    setAdminHoraInicio(task.horaInicio || '08:30');
    setAdminHoraFin(task.horaFin || '17:30');
    setEditingTaskId(task.id);
    setIsAdminTaskModalOpen(true);
  };

  const handleDeleteAdminTask = (taskId) => {
    if (window.confirm('¿Seguro que deseas eliminar esta actividad?')) {
      setWeeklyTasks(prev => {
        const filtered = (prev[activeTab] || []).filter(t => t.id !== taskId);
        return { ...prev, [activeTab]: filtered };
      });
      if (editingTaskId === taskId) {
        setEditingTaskId(null);
        setAdminActividad('');
        setAdminDescripcion('');
        setAdminTaskStores(['All']);
        setAdminHoraInicio('08:30');
        setAdminHoraFin('17:30');
      }
    }
  };

  return (
    <div className="view-section active" style={{ display: 'flex', flexDirection: 'column' }}>
      

      {/* 1. Cronograma de Actividades Semanal (Trasladado) */}
      <div className="card" style={{ order: 2, marginBottom: '24px' }}>
        <div className="card-header" style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: 'var(--accent-coral)', display: 'inline-flex', padding: '5px', background: 'rgba(255, 109, 77, 0.1)', borderRadius: '6px' }}>
              <i className="fas fa-calendar-check" style={{ fontSize: '14px' }}></i>
            </span>
            <div>
              <h3 className="card-title" style={{ fontSize: '14.5px' }}>Cronograma de Actividades Obligatorias</h3>
              <p className="card-subtitle">Tareas operacionales asignadas de Lunes a Sábado</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {userRole === 'admin' && (
              <button 
                className="topbar-btn btn-primary" 
                onClick={handleOpenAddAdminTaskModal}
                style={{ height: '32px', fontSize: '12px', padding: '0 12px' }}
              >
                <i className="fas fa-plus"></i> Agregar Tarea
              </button>
            )}
            <span className="stage-badge" style={{ background: 'var(--accent-coral)', color: '#FFFFFF', fontSize: '10px', fontWeight: '800', padding: '3px 8px', textTransform: 'uppercase' }}>
              {monthYearLabel}
            </span>
            <span className="stage-badge" style={{ background: '#f8fafc', color: 'var(--text-secondary)', fontSize: '10px', border: '1.5px solid var(--border-light)', fontWeight: '700' }}>
              {userName ? userName : (selectedStores.length === 14 ? 'Red General' : `Tienda: ${selectedStores.join(', ')}`)}
            </span>
          </div>
        </div>

        <div style={{ padding: '20px' }}>
          <div className="cronograma-tabs" style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', marginBottom: '20px', gap: '4px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map(day => {
              const isActive = activeTab === day;
              const isSaved = savedDays[storeCode]?.[day] || false;
              const tabInfo = getWeekDayDates[day] || { label: day };
              
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setActiveTab(day)}
                  style={{
                    padding: '10px 20px',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    border: 'none',
                    background: 'transparent',
                    borderBottom: isActive ? '3.5px solid var(--accent-coral)' : '3.5px solid transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                    flexShrink: 0
                  }}
                >
                  {tabInfo.label}
                  {isSaved && <span style={{ fontSize: '10px' }}>🔒</span>}
                </button>
              );
            })}
          </div>



          {/* Activities list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {activeTab === 'Mie' && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1.5px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '20px' }}>⚠️</span>
                <div style={{ textAlign: 'left' }}>
                  <strong style={{ fontSize: '12.5px', color: '#B45309', display: 'block' }}>Advertencia Comercial Semanal</strong>
                  <span style={{ fontSize: '11px', color: '#92400E' }}>
                    Si tu avance comercial y tasa de conversión son menores al 80%, debes reportar de inmediato con tu supervisor de red.
                  </span>
                </div>
              </div>
            )}

            {activeTasks.map(task => {
              const isChecked = (checkedTasks[storeCode]?.[activeTab] || {})[task.id] || false;
              const isDaySaved = savedDays[storeCode]?.[activeTab] || false;
              const isExpired = activeTab === todayTab && task.horaFin && (currentMinutes > getTaskEndMinutes(task.horaFin));
              const isFrozen = isDaySaved || isExpired;
              const isDisabled = selectedStores.length === 14 || isFrozen;

              return (
                <div 
                  key={task.id}
                  onClick={() => !isDisabled && handleToggleCronogramaTask(task.id)}
                  className={isExpired ? "frozen-task" : ""}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: isChecked ? 'rgba(16, 185, 129, 0.04)' : '#FFFFFF',
                    border: isChecked ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid var(--border-light)',
                    borderRadius: '8px',
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    opacity: isFrozen ? 0.6 : 1,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '16px' }}>{task.icon || '📋'}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                      <span style={{ 
                        fontSize: '13px', 
                        fontWeight: '600', 
                        color: isChecked ? 'var(--text-primary)' : 'var(--text-secondary)',
                        textDecoration: isChecked ? 'line-through' : 'none',
                        opacity: isChecked ? 0.75 : 1
                      }}>
                        {task.name}
                      </span>
                      {task.desc && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{task.desc}</span>}
                      {task.horaInicio && task.horaFin && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <span className="task-time-label">🕒 {formatTime12h(task.horaInicio)} - {formatTime12h(task.horaFin)}</span>
                          {isExpired && <span style={{ color: '#EF4444' }}>🔒</span>}
                        </div>
                      )}

                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {userRole === 'admin' && (
                      <div style={{ display: 'flex', gap: '4px', marginRight: '8px' }}>
                        <button 
                          className="action-btn edit-btn" 
                          onClick={(e) => { e.stopPropagation(); handleEditAdminTask(task); }} 
                          title="Editar"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          className="action-btn delete-btn" 
                          onClick={(e) => { e.stopPropagation(); handleDeleteAdminTask(task.id); }} 
                          title="Eliminar"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    )}
                    {task.obligatoria !== false && (
                      <span className="stage-badge" style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#EF4444', fontSize: '9px', fontWeight: '800', border: '1px solid rgba(239,68,68,0.15)' }}>
                        Obligatorio
                      </span>
                    )}
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      disabled={isDisabled}
                      onChange={() => {}} // handled by outer container onClick
                      style={{ transform: 'scale(1.2)', cursor: isDisabled ? 'not-allowed' : 'pointer' }}
                    />
                  </div>
                </div>
              );
            })}

            {activeTasks.length === 0 && (
              <div className="empty-state">
                <i className="fas fa-clipboard-list"></i> No hay actividades registradas para este día.
              </div>
            )}
          </div>

          {selectedStores.length !== 14 && activeTasks.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                className="topbar-btn btn-primary"
                onClick={handleSaveProgress}
                disabled={savedDays[storeCode]?.[activeTab] || false}
                style={{
                  background: (savedDays[storeCode]?.[activeTab]) ? '#94A3B8' : 'linear-gradient(135deg, var(--accent-coral), #FF9070)',
                  boxShadow: (savedDays[storeCode]?.[activeTab]) ? 'none' : '0 4px 12px rgba(255,109,77,0.35)',
                  cursor: (savedDays[storeCode]?.[activeTab]) ? 'not-allowed' : 'pointer'
                }}
              >
                <i className={(savedDays[storeCode]?.[activeTab]) ? "fas fa-lock" : "fas fa-cloud-upload-alt"} style={{ marginRight: '8px' }}></i>
                {(savedDays[storeCode]?.[activeTab]) ? 'Progreso Guardado (Congelado)' : 'Guardar Progreso del Día'}
              </button>
            </div>
          )}
        </div>
      </div>





      {/* Main Checklist and blocks layout (2 columns) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '24px', alignItems: 'stretch', order: 1 }} className="grid-responsive-md">
        
        {/* Column Left: Checklist */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#10B981', display: 'inline-flex', padding: '5px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px' }}>
                <i className="fas fa-check-double" style={{ fontSize: '14px' }}></i>
              </span>
              <div>
                <h3 className="card-title" style={{ fontSize: '14px' }}>Checklist Operativo Diario</h3>
              </div>
            </div>
            {selectedStores.length === 14 ? (
              <span className="stage-badge" style={{ background: '#f1f5f9', color: '#64748B', fontSize: '10px' }}>Consolidado</span>
            ) : (
              <span className="stage-badge" style={{ 
                background: completionPercent === 100 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)', 
                color: completionPercent === 100 ? '#059669' : '#2563EB', 
                fontSize: '11px',
                fontWeight: '700'
              }}>
                {completionPercent}% Completado
              </span>
            )}
          </div>

          <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>

            
            {userRole === 'admin' && (
              <button
                className="topbar-btn btn-primary"
                onClick={handleOpenAddChecklistModal}
                style={{ 
                  width: '100%', 
                  marginBottom: '10px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '6px',
                  padding: '8px 16px',
                  fontSize: '12px'
                }}
              >
                <i className="fas fa-plus"></i> Agregar Tarea al Checklist
              </button>
            )}

            {visibleChecklistTasks.map((task, index) => {
              const isTaskBlock1 = task.block === 1;
              const isFrozen = isTaskBlock1 && aperturaFrozen;
              const isChecked = !!currentChecklist[task.id];
              const isDisabled = selectedStores.length === 14 || isFrozen;

              return (
                <div 
                  key={task.id}
                  draggable={userRole === 'admin'}
                  onDragStart={(e) => {
                    setDraggedChecklistIndex(index);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleChecklistDrop(e, index)}
                  onDragEnd={() => setDraggedChecklistIndex(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    padding: '12px 16px',
                    background: '#FFFFFF',
                    border: draggedChecklistIndex === index 
                      ? '2px dashed var(--accent-coral)' 
                      : (isFrozen ? '1px solid var(--border-light)' : (isChecked ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-card)')),
                    borderRadius: 'var(--radius-sm)',
                    opacity: isFrozen ? 0.55 : (draggedChecklistIndex === index ? 0.4 : 1),
                    transition: 'all 0.2s ease',
                    boxShadow: isChecked ? '0 1px 4px rgba(16,185,129,0.05)' : 'none',
                    cursor: userRole === 'admin' ? (draggedChecklistIndex === index ? 'grabbing' : 'grab') : 'default'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '2px' }}>
                    <input
                      type="checkbox"
                      id={`task-${task.id}`}
                      checked={isChecked}
                      disabled={isDisabled}
                      onChange={() => onToggleTask(storeCode, task.id)}
                      style={{
                        width: '16px',
                        height: '16px',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        accentColor: '#FF6D4D'
                      }}
                    />
                  </div>
                  <label 
                    htmlFor={`task-${task.id}`} 
                    style={{ 
                      flex: 1, 
                      cursor: isDisabled ? 'not-allowed' : 'pointer', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '2px' 
                    }}
                  >
                    <span style={{ 
                      fontSize: '12.5px', 
                      fontWeight: '700', 
                      color: isChecked ? 'var(--text-muted)' : 'var(--text-primary)',
                      textDecoration: isChecked ? 'line-through' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span>{task.icon || '📋'} {task.name}</span>
                      {isFrozen && (
                        <span style={{ 
                          fontSize: '9px', 
                          fontWeight: '800', 
                          color: '#EF4444', 
                          background: 'rgba(239, 68, 68, 0.1)', 
                          padding: '1px 5px', 
                          borderRadius: '4px',
                          textTransform: 'uppercase'
                        }}>
                          🔒 Congelado
                        </span>
                      )}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {task.desc}
                    </span>
                  </label>
                  {userRole === 'admin' && (
                    <div style={{ display: 'flex', gap: '6px', alignSelf: 'center', marginLeft: '12px' }}>
                      <button 
                        className="action-btn edit-btn" 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleOpenEditChecklistModal(task); }}
                        title="Editar tarea"
                        style={{ padding: '4px 8px', fontSize: '11px', background: 'var(--bg-cream)', border: '1px solid var(--border-light)', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        <i className="fas fa-edit" style={{ color: 'var(--text-secondary)' }}></i>
                      </button>
                      <button 
                        className="action-btn delete-btn" 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteChecklistTask(task.id); }}
                        title="Eliminar tarea"
                        style={{ padding: '4px 8px', fontSize: '11px', background: 'var(--bg-cream)', border: '1px solid var(--border-light)', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        <i className="fas fa-trash-alt" style={{ color: '#EF4444' }}></i>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Save to sheets trigger */}
          {selectedStores.length !== 14 && (
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
              <button 
                className="topbar-btn btn-primary"
                onClick={() => onSaveToSheets(storeCode, completedCount, visibleChecklistTasks.length, currentChecklist)}
                style={{ fontSize: '12px', padding: '8px 16px' }}
              >
                <i className="fas fa-cloud-upload-alt" style={{ marginRight: '6px' }}></i>
                Guardar en Sheets (BD)
              </button>
            </div>
          )}
        </div>

        {/* Column Right: Time Routine Monitoring */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--accent-coral)', display: 'inline-flex', padding: '5px', background: 'rgba(255, 109, 77, 0.1)', borderRadius: '6px' }}>
                <i className="far fa-clock" style={{ fontSize: '14px' }}></i>
              </span>
              <div>
                <h3 className="card-title" style={{ fontSize: '14px' }}>Monitoreo de Bloques de Tiempo</h3>
                <p className="card-subtitle">Rutina y enfoque operativo diario</p>
              </div>
            </div>
            <span className="stage-badge" style={{ background: '#f8fafc', color: 'var(--text-secondary)', fontSize: '10px', border: '1.5px solid var(--border-light)' }}>RUTINA DE TIENDA</span>
          </div>

          <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {TIME_BLOCKS.map(block => {
              const isActive = block.id === activeBlockId;
              
              return (
                <div 
                  key={block.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '14px 18px',
                    background: '#FFFFFF',
                    border: isActive ? '1.5px solid var(--accent-coral)' : '1px solid var(--border-card)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: isActive ? '0 4px 14px rgba(255, 109, 77, 0.08)' : 'none',
                    transition: 'all 0.25s ease'
                  }}
                >
                  <div style={{ 
                    padding: '8px 12px', 
                    background: isActive ? 'linear-gradient(135deg, var(--accent-coral), #FF9070)' : '#F8FAFC',
                    color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '800',
                    fontVariantNumeric: 'tabular-nums',
                    border: isActive ? 'none' : '1px solid var(--border-light)',
                    width: '100px',
                    textAlign: 'center',
                    flexShrink: 0
                  }}>
                    {block.range}
                  </div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                        {block.icon && <span style={{ marginRight: '6px' }}>{block.icon}</span>}
                        {block.name}
                      </span>
                      {block.badge && (
                        <span style={{ 
                          fontSize: '8px', 
                          fontWeight: '800', 
                          background: block.badgeColor, 
                          color: block.badgeTextColor,
                          padding: '1px 5px',
                          borderRadius: '4px'
                        }}>
                          {block.badge}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {block.desc}
                    </div>
                  </div>

                  <div style={{ flexShrink: 0 }}>
                    <span style={{ 
                      fontSize: '9.5px', 
                      fontWeight: '800', 
                      background: isActive ? 'rgba(255, 109, 77, 0.12)' : '#F1F5F9',
                      color: isActive ? 'var(--accent-coral)' : '#94A3B8',
                      padding: '3px 8px',
                      borderRadius: '20px',
                      textTransform: 'uppercase'
                    }}>
                      {isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tarjetas Dinámicas de Avances (80/20 y Proyectos) */}
      <div style={{ order: 3, marginTop: '20px', display: 'flex', gap: '20px', flexDirection: 'row', flexWrap: 'wrap' }}>
        
        {/* Avances 80/20 */}
        <div className="card" style={{ flex: '1 1 45%', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '6px', borderRadius: '6px' }}>
               <i className="fas fa-bullseye"></i>
            </span>
            <div>
              <h3 className="card-title" style={{ fontSize: '14px' }}>Avances 80/20</h3>
              <p className="card-subtitle">Gestión de contactos y prospección</p>
            </div>
          </div>
          
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input type="text" placeholder="Nombre del cliente" value={nombre8020} onChange={(e) => setNombre8020(e.target.value)} style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border-light)', borderRadius: '6px', fontSize: '12px', outline: 'none' }} />
              <input type="text" placeholder="Carrera de interés" value={carrera8020} onChange={(e) => setCarrera8020(e.target.value)} style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border-light)', borderRadius: '6px', fontSize: '12px', outline: 'none' }} />
            </div>
            
            <input type="text" placeholder="Teléfono de WhatsApp (Ej: 502XXXXXXXX)" value={telefono8020} onChange={(e) => setTelefono8020(e.target.value)} style={{ padding: '8px 12px', border: '1px solid var(--border-light)', borderRadius: '6px', fontSize: '12px', outline: 'none' }} />
            
            <div style={{ marginTop: '10px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Plantilla de Mensaje (Speech)</label>
              {userRole === 'admin' ? (
                <>
                  <textarea 
                    value={speech8020} 
                    onChange={(e) => setSpeech8020(e.target.value)}
                    style={{ width: '100%', height: '80px', padding: '10px', border: '1px solid var(--border-light)', borderRadius: '6px', fontSize: '12px', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
                    placeholder="Usa {Nombre} y {Carrera} para campos dinámicos..."
                  ></textarea>
                  <button onClick={handleSaveSpeech8020} className="topbar-btn btn-primary" style={{ marginTop: '8px', fontSize: '11px', padding: '6px 12px' }}>Guardar Plantilla</button>
                </>
              ) : (
                <div style={{ background: '#F8FAFC', border: '1px solid var(--border-light)', borderRadius: '6px', padding: '12px', fontSize: '12px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                  {formatSpeech(speech8020, nombre8020 || '[Nombre]', carrera8020 || '[Carrera]')}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={() => { handleCopy(formatSpeech(speech8020, nombre8020, carrera8020)); if (onSpeechAction) onSpeechAction(storeCode, 'copy'); }} className="topbar-btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>
                <i className="fas fa-copy" style={{ marginRight: '6px' }}></i> Copiar
              </button>
              <button onClick={() => { handleWhatsApp(telefono8020, formatSpeech(speech8020, nombre8020, carrera8020)); if (onSpeechAction) onSpeechAction(storeCode, 'whatsapp'); }} className="topbar-btn btn-primary" style={{ flex: 1, justifyContent: 'center', background: '#25D366', borderColor: '#25D366' }}>
                <i className="fab fa-whatsapp" style={{ marginRight: '6px' }}></i> WhatsApp
              </button>
            </div>
            
            {canUploadExcel && (
              <div style={{ marginTop: '20px', padding: '15px', background: '#F8FAFC', border: '1.5px dashed var(--border-light)', borderRadius: '8px', textAlign: 'center' }}>
                <h4 style={{ fontSize: '12px', fontWeight: '700', marginBottom: '10px', color: 'var(--text-primary)' }}>Avances 80/20 (Excel)</h4>
                {userRole === 'admin' ? (
                  <button onClick={() => window.open('https://drive.google.com/drive/folders/18_lVSz2vKLXr1p8FXAOW28N4y2ojxq98', '_blank')} className="topbar-btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    <i className="fas fa-folder-open" style={{ marginRight: '6px' }}></i> Abrir Carpeta en Drive
                  </button>
                ) : (
                  <input type="file" accept=".xlsx, .xls" onChange={(e) => handleFileUpload(e, '8020')} disabled={isUploading} style={{ fontSize: '11px', color: 'var(--text-secondary)' }} />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Avances Proyecto */}
        <div className="card" style={{ flex: '1 1 45%', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#8B5CF6', background: 'rgba(139, 92, 246, 0.1)', padding: '6px', borderRadius: '6px' }}>
               <i className="fas fa-rocket"></i>
            </span>
            <div>
              <h3 className="card-title" style={{ fontSize: '14px' }}>Avances Proyecto</h3>
              <p className="card-subtitle">Seguimiento de proyectos en curso</p>
            </div>
          </div>
          
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input type="text" placeholder="Nombre del cliente" value={nombreProyecto} onChange={(e) => setNombreProyecto(e.target.value)} style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border-light)', borderRadius: '6px', fontSize: '12px', outline: 'none' }} />
              <input type="text" placeholder="Carrera de interés" value={carreraProyecto} onChange={(e) => setCarreraProyecto(e.target.value)} style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--border-light)', borderRadius: '6px', fontSize: '12px', outline: 'none' }} />
            </div>
            
            <input type="text" placeholder="Teléfono de WhatsApp (Ej: 502XXXXXXXX)" value={telefonoProyecto} onChange={(e) => setTelefonoProyecto(e.target.value)} style={{ padding: '8px 12px', border: '1px solid var(--border-light)', borderRadius: '6px', fontSize: '12px', outline: 'none' }} />
            
            <div style={{ marginTop: '10px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Plantilla de Mensaje (Speech)</label>
              {userRole === 'admin' ? (
                <>
                  <textarea 
                    value={speechProyecto} 
                    onChange={(e) => setSpeechProyecto(e.target.value)}
                    style={{ width: '100%', height: '80px', padding: '10px', border: '1px solid var(--border-light)', borderRadius: '6px', fontSize: '12px', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
                    placeholder="Usa {Nombre} y {Carrera} para campos dinámicos..."
                  ></textarea>
                  <button onClick={handleSaveSpeechProyecto} className="topbar-btn btn-primary" style={{ marginTop: '8px', fontSize: '11px', padding: '6px 12px' }}>Guardar Plantilla</button>
                </>
              ) : (
                <div style={{ background: '#F8FAFC', border: '1px solid var(--border-light)', borderRadius: '6px', padding: '12px', fontSize: '12px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                  {formatSpeech(speechProyecto, nombreProyecto || '[Nombre]', carreraProyecto || '[Carrera]')}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={() => { handleCopy(formatSpeech(speechProyecto, nombreProyecto, carreraProyecto)); if (onSpeechAction) onSpeechAction(storeCode, 'copy'); }} className="topbar-btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>
                <i className="fas fa-copy" style={{ marginRight: '6px' }}></i> Copiar
              </button>
              <button onClick={() => { handleWhatsApp(telefonoProyecto, formatSpeech(speechProyecto, nombreProyecto, carreraProyecto)); if (onSpeechAction) onSpeechAction(storeCode, 'whatsapp'); }} className="topbar-btn btn-primary" style={{ flex: 1, justifyContent: 'center', background: '#25D366', borderColor: '#25D366' }}>
                <i className="fab fa-whatsapp" style={{ marginRight: '6px' }}></i> WhatsApp
              </button>
            </div>
            
            {canUploadExcel && (
              <div style={{ marginTop: '20px', padding: '15px', background: '#F8FAFC', border: '1.5px dashed var(--border-light)', borderRadius: '8px', textAlign: 'center' }}>
                <h4 style={{ fontSize: '12px', fontWeight: '700', marginBottom: '10px', color: 'var(--text-primary)' }}>Avances Proyecto (Excel)</h4>
                {userRole === 'admin' ? (
                  <button onClick={() => window.open('https://drive.google.com/drive/folders/18_lVSz2vKLXr1p8FXAOW28N4y2ojxq98', '_blank')} className="topbar-btn btn-primary" style={{ width: '100%', justifyContent: 'center', background: '#8B5CF6', borderColor: '#8B5CF6' }}>
                    <i className="fas fa-folder-open" style={{ marginRight: '6px' }}></i> Abrir Carpeta en Drive
                  </button>
                ) : (
                  <input type="file" accept=".xlsx, .xls" onChange={(e) => handleFileUpload(e, 'Proyecto')} disabled={isUploading} style={{ fontSize: '11px', color: 'var(--text-secondary)' }} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. MODAL: Critical 16:30 Warning Alert Modal */}
      {isAlertModalOpen && (
        <div className="modal-overlay active" style={{ zIndex: 11000, background: 'rgba(239, 68, 68, 0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-box" style={{ maxWidth: '420px', padding: '30px', border: '1.5px solid #EF4444', textAlign: 'center' }}>
            <div style={{ fontSize: '38px', color: '#EF4444', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>
              Advertencia de Cierre Administrativo
            </h3>
            <p style={{ fontSize: '12px', color: '#4B5563', lineHeight: '1.5', marginBottom: '24px' }}>
              Por favor, asegúrate de completar y registrar todas tus actividades obligatorias de la jornada antes del cierre administrativo.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                className="topbar-btn btn-primary" 
                style={{ background: '#EF4444', width: '100%', justifyContent: 'center', padding: '10px' }}
                onClick={() => {
                  setIsAlertModalOpen(false);
                  setAlertDismissedToday(true);
                }}
              >
                Comprendido, registraré ahora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal para Agregar/Editar Tarea de Checklist */}
      {isChecklistModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, transition: 'all 0.2s ease-in-out'
        }}>
          <div className="card" style={{
            width: '450px', background: '#FFFFFF', padding: '24px',
            borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
            display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
              <h3 className="card-title" style={{ fontSize: '15px' }}>
                {editingChecklistTaskId ? 'Editar Tarea del Checklist' : 'Agregar Nueva Tarea'}
              </h3>
              <button 
                onClick={() => setIsChecklistModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-muted)' }}
              >&times;</button>
            </div>
            
            <form onSubmit={handleSaveChecklistTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                <label className="form-label" style={{ fontSize: '11px', fontWeight: '700' }}>Actividad</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Nombre de la actividad" 
                  value={checklistFormName}
                  onChange={(e) => setChecklistFormName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                <label className="form-label" style={{ fontSize: '11px', fontWeight: '700' }}>Descripción</label>
                <textarea 
                  className="form-control" 
                  placeholder="Descripción detallada de la tarea" 
                  value={checklistFormDesc}
                  onChange={(e) => setChecklistFormDesc(e.target.value)}
                  rows="3"
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>
              
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                <label className="form-label" style={{ fontSize: '11px', fontWeight: '700' }}>Asignar a:</label>
                <div className="store-picker">
                  {/* All stores button */}
                  <button
                    type="button"
                    className={`store-picker-all-btn${checklistFormStores.includes('All') ? ' active' : ''}`}
                    onClick={() => {
                      if (checklistFormStores.includes('All')) {
                        setChecklistFormStores([]);
                      } else {
                        setChecklistFormStores(['All']);
                      }
                    }}
                  >
                    <i className="fas fa-store" style={{ marginRight: '6px' }}></i>
                    Todas las tiendas
                  </button>
                  {/* Individual store buttons grid */}
                  <div className="store-picker-grid">
                    {STORES.map(store => {
                      const isActive = !checklistFormStores.includes('All') && checklistFormStores.includes(store);
                      return (
                        <button
                          key={store}
                          type="button"
                          className={`store-picker-btn${isActive ? ' active' : ''}`}
                          onClick={() => {
                            if (checklistFormStores.includes('All')) {
                              // deselect All, select just this one
                              setChecklistFormStores([store]);
                            } else {
                              const next = checklistFormStores.includes(store)
                                ? checklistFormStores.filter(s => s !== store)
                                : [...checklistFormStores, store];
                              // if all 14 individually selected → collapse to 'All'
                              if (next.length === STORES.length) {
                                setChecklistFormStores(['All']);
                              } else {
                                setChecklistFormStores(next);
                              }
                            }
                          }}
                        >{store}</button>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: '700' }}>Hora de Inicio</label>
                  <input 
                    type="time" 
                    className="form-control" 
                    value={checklistFormInicio}
                    onChange={(e) => setChecklistFormInicio(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: '700' }}>Hora Final</label>
                  <input 
                    type="time" 
                    className="form-control" 
                    value={checklistFormFin}
                    onChange={(e) => setChecklistFormFin(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '14px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="topbar-btn btn-outline" 
                  onClick={() => setIsChecklistModalOpen(false)}
                  style={{ padding: '8px 16px', fontSize: '12px' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="topbar-btn btn-primary"
                  style={{ padding: '8px 20px', fontSize: '12px' }}
                >
                  {editingChecklistTaskId ? 'Actualizar Tarea' : 'Guardar Tarea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 7. Modal para Agregar/Editar Tarea del Cronograma (Administrador) */}
      {isAdminTaskModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, transition: 'all 0.2s ease-in-out'
        }}>
          <div className="card" style={{
            width: '480px', background: '#FFFFFF', padding: '24px',
            borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
            display: 'flex', flexDirection: 'column', gap: '16px',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
              <h3 className="card-title" style={{ fontSize: '15px' }}>
                {editingTaskId ? 'Editar Tarea del Cronograma' : 'Agregar Tarea al Cronograma'}
              </h3>
              <button 
                onClick={() => setIsAdminTaskModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-muted)' }}
              >&times;</button>
            </div>
            
            <form onSubmit={handleSaveAdminTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                <label className="form-label" style={{ fontSize: '11px', fontWeight: '700' }}>Actividad / Tema</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ej: Revisión de Prospectos" 
                  value={adminActividad}
                  onChange={(e) => setAdminActividad(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                <label className="form-label" style={{ fontSize: '11px', fontWeight: '700' }}>Descripción Corta</label>
                <textarea 
                  className="form-control" 
                  placeholder="Detalles sobre qué se debe revisar" 
                  value={adminDescripcion}
                  onChange={(e) => setAdminDescripcion(e.target.value)}
                  rows="2"
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>


              
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                <label className="form-label" style={{ fontSize: '11px', fontWeight: '700' }}>Asignar a:</label>
                <div className="store-picker">
                  {/* All stores button */}
                  <button
                    type="button"
                    className={`store-picker-all-btn${adminTaskStores.includes('All') ? ' active' : ''}`}
                    onClick={() => {
                      if (adminTaskStores.includes('All')) {
                        setAdminTaskStores([]);
                      } else {
                        setAdminTaskStores(['All']);
                      }
                    }}
                  >
                    <i className="fas fa-store" style={{ marginRight: '6px' }}></i>
                    Todas las tiendas
                  </button>
                  {/* Individual store buttons grid */}
                  <div className="store-picker-grid">
                    {STORES.map(store => {
                      const isActive = !adminTaskStores.includes('All') && adminTaskStores.includes(store);
                      return (
                        <button
                          key={store}
                          type="button"
                          className={`store-picker-btn${isActive ? ' active' : ''}`}
                          onClick={() => {
                            if (adminTaskStores.includes('All')) {
                              // deselect All, select just this one
                              setAdminTaskStores([store]);
                            } else {
                              const next = adminTaskStores.includes(store)
                                ? adminTaskStores.filter(s => s !== store)
                                : [...adminTaskStores, store];
                              // if all 14 individually selected → collapse to 'All'
                              if (next.length === STORES.length) {
                                setAdminTaskStores(['All']);
                              } else {
                                setAdminTaskStores(next);
                              }
                            }
                          }}
                        >{store}</button>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: '700' }}>Hora de Inicio</label>
                  <input 
                    type="time" 
                    className="form-control" 
                    value={adminHoraInicio}
                    onChange={(e) => setAdminHoraInicio(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                  <label className="form-label" style={{ fontSize: '11px', fontWeight: '700' }}>Hora Final</label>
                  <input 
                    type="time" 
                    className="form-control" 
                    value={adminHoraFin}
                    onChange={(e) => setAdminHoraFin(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '14px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="topbar-btn btn-outline" 
                  onClick={() => setIsAdminTaskModalOpen(false)}
                  style={{ padding: '8px 16px', fontSize: '12px' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="topbar-btn btn-primary"
                  style={{ padding: '8px 20px', fontSize: '12px' }}
                >
                  {editingTaskId ? 'Actualizar Tarea' : 'Guardar Tarea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
