import { useState, useEffect, useCallback, useMemo } from 'react';

// =====================================================================
// CONFIGURACIÓN DEL BACKEND (Google Apps Script Web App)
// =====================================================================
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyrI5mKnFOMo8zf8cixTy_5c8XJbgFNPxOvUbDzngEeFBdSpS6It_U-B0IOCLiefex7/exec';

const PRODUCTOS = ['Medalla Fundida', 'Pin Fundido', 'Plasma Metal', 'Vidrio', 'Fotograbado', 'Producto especial', 'Protextil'];
// Los procesos son automáticos; solo 'Autorizado' es manual (botón del asesor)
// 'Otro Vale' reemplaza 'Congelado'
const STORES = ['CB', 'CHM', 'CHQ', 'ESC', 'HH', 'JT', 'MZ', 'PT', 'PTB', 'SJ', 'SMA', 'VN', 'XL', 'Z3'];

const CARPETA_CARGA_URL = 'https://drive.google.com/drive/folders/1biBNC5T018q_2AYMFixiiAdxsYK_g72Z';
const CARPETA_DESCARGA_URL = 'https://drive.google.com/drive/folders/1AEgVPJKB2vvU-XGtsb768BfnvOr5g7nh';

function mockValesIniciales() {
  return [
    { 
      No: 1, Tienda: 'CB', NoVale: 'VAL-001', Producto: 'Medalla Fundida', 
      FechaIngreso: '2026-07-08', FechaSalida: '2026-07-12', Proceso: 'Entregado', 
      ArchivoCargaUrl: 'https://example.com/carga1.pdf', ArchivoDescargaUrl: 'https://example.com/descarga1.pdf', 
      ArchivoCarga2Url: '', ArchivoDescarga2Url: '', ArchivoOrdenTrabajoUrl: '' 
    },
    { 
      No: 2, Tienda: 'JT', NoVale: 'VAL-002', Producto: 'Vidrio', 
      FechaIngreso: '2026-07-11', FechaSalida: '2026-07-15', Proceso: 'en tiempo', 
      ArchivoCargaUrl: '', ArchivoDescargaUrl: '' 
    },
    { 
      No: 3, Tienda: 'Z3', NoVale: 'VAL-003', Producto: 'Pin Fundido', 
      FechaIngreso: '2026-07-06', FechaSalida: '2026-07-10', Proceso: 'Modificación 1', 
      ArchivoCargaUrl: 'https://example.com/carga1.pdf', ArchivoDescargaUrl: 'https://example.com/descarga1.pdf', 
      ArchivoCarga2Url: '', ArchivoDescarga2Url: '' 
    },
  ];
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function calcularFechaLimiteHabiles(fechaIngresoStr, diasHabiles = 3) {
  if (!fechaIngresoStr) return null;
  const parts = String(fechaIngresoStr).split('-');
  if (parts.length < 3) return null;
  let d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  let count = 0;
  while (count < diasHabiles) {
    d.setDate(d.getDate() + 1);
    const dayOfWeek = d.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
  }
  return d;
}

// Verifica si el vale pasó a "Otro Vale" (ex-Congelado):
// sucede cuando el Proceso es 'Modificación 3', el diseñador ya subió el 3er arte,
// y han pasado +24h sin que el asesor lo autorice.
function esValeOtroVale(v) {
  if (!v) return false;
  if (v.Proceso === 'Otro Vale') return true;
  // Si el diseñador ya subió la Descarga 3 y no está Autorizado después de 1 día
  if (v.ArchivoDescarga3Url && v.Proceso !== 'Autorizado') {
    if (v.FechaDescarga3) {
      const fechaMod = new Date(v.FechaDescarga3).getTime();
      const diffHoras = (Date.now() - fechaMod) / (1000 * 60 * 60);
      if (diffHoras >= 24) return true;
    }
    // Fallback: usar FechaUltimaModificacion
    if (v.FechaUltimaModificacion) {
      const fechaMod = new Date(v.FechaUltimaModificacion).getTime();
      const diffHoras = (Date.now() - fechaMod) / (1000 * 60 * 60);
      if (diffHoras >= 24) return true;
    }
  }
  return false;
}

// Calcula el estado del vale de forma completamente automática.
// El único estado manual es 'Autorizado' (el asesor lo presiona explícitamente).
function obtenerEstadoAutomatico(v) {
  if (!v) return 'En Tiempo';
  // Autorizado es permanente (lo aprueba el asesor)
  if (v.Proceso === 'Autorizado') return 'Autorizado';
  // Otro Vale (ex-Congelado)
  if (esValeOtroVale(v)) return 'Otro Vale';
  // Modificaciones solicitadas por el asesor
  if (['Modificación 1', 'Modificación 2', 'Modificación 3'].includes(v.Proceso)) return v.Proceso;
  // Diseñador subió el arte → Entregado
  if (v.ArchivoDescargaUrl || v.ArchivoDescarga2Url || v.ArchivoDescarga3Url) return 'Entregado';
  // SLA: 3 días hábiles
  const fechaLimite = calcularFechaLimiteHabiles(v.FechaIngreso, 3);
  if (!fechaLimite) return 'En Tiempo';
  const actual = new Date();
  fechaLimite.setHours(23, 59, 59, 999);
  return actual > fechaLimite ? 'Tarde' : 'En Tiempo';
}

function getUrlPropByTipo(tipo) {
  if (tipo === 'descarga') return 'ArchivoDescargaUrl';
  if (tipo === 'carga2') return 'ArchivoCarga2Url';
  if (tipo === 'descarga2') return 'ArchivoDescarga2Url';
  if (tipo === 'carga3') return 'ArchivoCarga3Url';
  if (tipo === 'descarga3') return 'ArchivoDescarga3Url';
  if (tipo === 'orden_trabajo') return 'ArchivoOrdenTrabajoUrl';
  return 'ArchivoCargaUrl';
}

export default function ValesView({ userRole, activeStore, selectedStores, showToast, userName, selectedMonths }) {
  const store = activeStore || (selectedStores && selectedStores[0]) || 'CB';
  const isAdminOrDesign = userRole === 'admin' || userRole === 'diseno';
  const [vales, setVales] = useState(mockValesIniciales());
  const [isLoading, setIsLoading] = useState(Boolean(SCRIPT_URL));
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [uploadingKey, setUploadingKey] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVale, setEditingVale] = useState(null);
  const [nuevoVale, setNuevoVale] = useState({ tienda: store || 'CB', noVale: '', producto: PRODUCTOS[0], fechaSalida: '' });

  const [filesToUpload, setFilesToUpload] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState('listado');

  useEffect(() => {
    setNuevoVale(prev => ({ ...prev, tienda: store }));
  }, [store]);

  const notify = useCallback((msg, type = 'success') => {
    if (showToast) showToast(msg, type);
    else alert(msg);
  }, [showToast]);

  const cargarVales = useCallback(async () => {
    if (!SCRIPT_URL) return;
    const rol = userRole === 'admin' ? 'admin' : userRole === 'diseno' ? 'diseno' : 'store';
    const url = `${SCRIPT_URL}?action=vales&rol=${encodeURIComponent(rol)}&tienda=${encodeURIComponent(store || '')}`;
    try {
      const res = await fetch(url).then(r => r.json());
      if (res.status === 'success') {
        setVales(res.datos || []);
        setIsBackendConnected(true);
      }
    } catch {
      notify('No se pudo conectar con el servidor Drive.', 'error');
    }
  }, [userRole, store, notify]);

  useEffect(() => {
    let active = true;
    cargarVales().finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [cargarVales]);

  const valesVisibles = useMemo(() => {
    let filtered = isAdminOrDesign
      ? vales
      : vales.filter(v => String(v.Tienda).toUpperCase() === String(store).toUpperCase());

    if (selectedMonths && selectedMonths.length > 0) {
      const monthsList = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      filtered = filtered.filter(v => {
        if (!v.FechaIngreso) return false;
        const parts = v.FechaIngreso.split('-');
        if (parts.length < 2) return false;
        const monthIndex = parseInt(parts[1], 10) - 1;
        if (isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) return false;
        return selectedMonths.includes(monthsList[monthIndex]);
      });
    }
    return filtered;
  }, [vales, isAdminOrDesign, store, selectedMonths]);

  const stats = useMemo(() => {
    const total = valesVisibles.length;
    let enTiempo = 0, tarde = 0, autorizados = 0, enModificacion = 0;
    valesVisibles.forEach(v => {
      const estado = obtenerEstadoAutomatico(v);
      if (estado === 'En Tiempo' || estado === 'Entregado') enTiempo++;
      else if (estado === 'Tarde' || estado === 'Otro Vale') tarde++;
      else if (estado === 'Autorizado') autorizados++;
      else if (String(estado).startsWith('Modificación')) enModificacion++;
    });
    return { total, enTiempo, tarde, autorizados, enModificacion };
  }, [valesVisibles]);

  const handleSolicitarVale = async (e) => {
    e.preventDefault();
    if (!nuevoVale.tienda || !nuevoVale.producto) {
      notify('Por favor completa los campos obligatorios.', 'error');
      return;
    }

    setIsCreating(true);
    const num = vales.length + 1;
    const noValeGenerado = (nuevoVale.noVale && nuevoVale.noVale.trim()) ? nuevoVale.noVale.trim() : `VAL-${String(num).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];
    const newValeObj = {
      No: num,
      Tienda: nuevoVale.tienda,
      NoVale: noValeGenerado,
      Producto: nuevoVale.producto,
      FechaIngreso: today,
      FechaSalida: nuevoVale.fechaSalida || '',
      Proceso: 'en tiempo',
      ArchivoCargaUrl: '',
      ArchivoDescargaUrl: '',
      ArchivoCarga2Url: '',
      ArchivoDescarga2Url: '',
      ArchivoCarga3Url: '',
      ArchivoDescarga3Url: '',
      ArchivoOrdenTrabajoUrl: '',
      FechaUltimaModificacion: ''
    };

    setVales(prev => [...prev, newValeObj]);

    if (filesToUpload.length > 0) {
      try {
        const file = filesToUpload[0];
        const base64 = await fileToBase64(file);
        if (SCRIPT_URL) {
          const res = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'subirArchivoVale', datos: { noVale: noValeGenerado, tipo: 'carga', base64, mimeType: file.type, fileName: file.name } }),
          }).then(r => r.json());
          if (res.status === 'success') setVales(prev => prev.map(v => v.NoVale === noValeGenerado ? { ...v, ArchivoCargaUrl: res.url } : v));
        } else {
          setVales(prev => prev.map(v => v.NoVale === noValeGenerado ? { ...v, ArchivoCargaUrl: URL.createObjectURL(file) } : v));
        }
      } catch {
        notify('El vale se creó, pero hubo un problema al subir el archivo adjunto.', 'error');
      }
    }

    if (SCRIPT_URL) {
      try {
        await fetch(SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'crearVale', datos: { tienda: nuevoVale.tienda, noVale: noValeGenerado, producto: nuevoVale.producto, fechaSalida: nuevoVale.fechaSalida || '' } }),
        });
      } catch {
        notify('El vale se creó localmente pero hubo un fallo con el servidor Drive.', 'error');
      }
    }

    notify(`Vale ${noValeGenerado} creado exitosamente.`);
    setIsCreating(false);
    setIsModalOpen(false);
    setFilesToUpload([]);
    setNuevoVale({ tienda: store || 'CB', noVale: '', producto: PRODUCTOS[0], fechaSalida: '' });
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    if (!editingVale) return;

    if (editingVale.Proceso === 'Autorizado') {
      const hasAnyDescarga = Boolean(editingVale.ArchivoDescargaUrl || editingVale.ArchivoDescarga2Url || editingVale.ArchivoDescarga3Url);
      if (!hasAnyDescarga) {
        notify('⚠️ No puedes autorizar este vale porque el diseñador no ha subido ninguna propuesta de arte.', 'error');
        return;
      }
    }

    const updates = { ...editingVale };
    if (editingVale.Proceso === 'Modificación 3' && !editingVale.FechaUltimaModificacion) {
      updates.FechaUltimaModificacion = new Date().toISOString();
    }

    setVales(prev => prev.map(v => v.NoVale === updates.NoVale ? updates : v));
    notify(`Vale ${updates.NoVale} actualizado exitosamente.`);
    setEditingVale(null);

    if (!SCRIPT_URL) return;
    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'editarVale', noVale: updates.NoVale, proceso: updates.Proceso, fechaSalida: updates.FechaSalida || '' }),
      });
    } catch {
      notify('No se pudieron sincronizar los cambios de edición con el servidor.', 'error');
    }
  };

  const handleEliminarVale = async (e) => {
    e.stopPropagation();
    if (!editingVale) return;
    const { NoVale } = editingVale;
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el vale "${NoVale}"?`)) return;

    setVales(prev => prev.filter(v => v.NoVale !== NoVale));
    setEditingVale(null);
    notify(`Vale ${NoVale} eliminado correctamente.`);

    if (!SCRIPT_URL) return;
    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'eliminarVale', noVale: NoVale })
      });
    } catch {
      notify('No se pudo eliminar el vale en el servidor.', 'error');
    }
  };

  const handleSolicitarModificacion = async (noVale) => {
    const valeObj = vales.find(v => v.NoVale === noVale);
    if (!valeObj) return;

    if (esValeOtroVale(valeObj)) {
      notify('⚠️ No se pueden solicitar más modificaciones: el vale está en estado Otro Vale tras superar el límite de modificaciones y plazo.', 'error');
      return;
    }

    const currentProceso = valeObj.Proceso || 'en tiempo';
    let nextProceso = 'Modificación 1';
    if (currentProceso === 'Modificación 1') nextProceso = 'Modificación 2';
    else if (currentProceso === 'Modificación 2') nextProceso = 'Modificación 3';
    else if (currentProceso === 'Modificación 3') {
      notify('⚠️ Ya te encuentras en la Modificación 3 (Límite máximo permitido). Si no es autorizado en 1 día, se generará un Otro Vale.', 'warning');
      nextProceso = 'Modificación 3';
    }

    if (!window.confirm(`¿Estás seguro de que deseas solicitar "${nextProceso}" para el vale "${noVale}"? Esto habilitará la sección de carga para esta modificación sin perder el historial anterior.`)) {
      return;
    }

    const updates = { Proceso: nextProceso };
    if (nextProceso === 'Modificación 3' && !valeObj.FechaUltimaModificacion) {
      updates.FechaUltimaModificacion = new Date().toISOString();
    }

    setVales(prev => prev.map(v => v.NoVale === noVale ? { ...v, ...updates } : v));
    if (editingVale && editingVale.NoVale === noVale) setEditingVale(prev => ({ ...prev, ...updates }));
    notify(`✅ Vale ${noVale} pasa a "${nextProceso}". El diseñador puede subir la nueva propuesta.`);

    if (!SCRIPT_URL) return;
    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'actualizarProcesoVale', noVale, proceso: nextProceso }),
      });
    } catch {
      notify('No se pudo comunicar con el servidor para guardar la modificación.', 'error');
    }
  };

  // ASESOR: Autorizar vale (único estado manual)
  const handleAutorizar = async (noVale) => {
    const valeObj = vales.find(v => v.NoVale === noVale);
    if (!valeObj) return;
    const hasAnyDescarga = Boolean(valeObj.ArchivoDescargaUrl || valeObj.ArchivoDescarga2Url || valeObj.ArchivoDescarga3Url);
    if (!hasAnyDescarga) {
      notify('⚠️ No puedes autorizar hasta que el diseñador suba al menos una propuesta de arte.', 'error');
      return;
    }
    if (!window.confirm(`¿Confirmar autorización del vale "${noVale}"?\n\nEsto cierra el ciclo de diseño y habilita la carga de la Orden de Trabajo.`)) return;

    const updates = { Proceso: 'Autorizado' };
    setVales(prev => prev.map(v => v.NoVale === noVale ? { ...v, ...updates } : v));
    if (editingVale && editingVale.NoVale === noVale) setEditingVale(prev => ({ ...prev, ...updates }));
    notify(`✅ Vale ${noVale} AUTORIZADO. Puedes subir la Orden de Trabajo.`);

    if (!SCRIPT_URL) return;
    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'actualizarProcesoVale', noVale, proceso: 'Autorizado' }),
      });
    } catch {
      notify('No se pudo guardar la autorización en el servidor.', 'error');
    }
  };

  // DISEÑADOR: Subir arte/propuesta. Cuando sube, actualiza el proceso a 'Entregado' (o mantiene Modificación X si viene de ahí)
  const handleUploadDescargar = (noVale, tipo) => {
    const valeObj = vales.find(v => v.NoVale === noVale);
    if (valeObj && esValeOtroVale(valeObj)) {
      notify('⚠️ No se pueden subir archivos a un vale en estado "Otro Vale".', 'error');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*/*';
    input.onchange = async (ev) => {
      const file = ev.target.files[0];
      if (!file) return;

      const key = `${noVale}-${tipo}`;
      setUploadingKey(key);

      if (!SCRIPT_URL) {
        setTimeout(() => {
          setUploadingKey(null);
          const propName = getUrlPropByTipo(tipo);
          const updates = { [propName]: URL.createObjectURL(file) };
          // Al subir arte, si venía de Modificación X se queda en ese estado
          // Si era inicial (descarga 1) el estado pasa a "Entregado" automáticamente via obtenerEstadoAutomatico
          if (tipo === 'descarga3') {
            updates.FechaUltimaModificacion = new Date().toISOString();
          }
          setVales(prev => prev.map(v => v.NoVale === noVale ? { ...v, ...updates } : v));
          if (editingVale && editingVale.NoVale === noVale) setEditingVale(prev => ({ ...prev, ...updates }));
          notify(`Arte "${file.name}" subido. Estado actualizado automáticamente.`);
        }, 600);
        return;
      }

      try {
        const base64 = await fileToBase64(file);
        const res = await fetch(SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'subirArchivoVale', datos: { noVale, tipo, base64, mimeType: file.type, fileName: file.name } }),
        }).then(r => r.json());

        if (res.status === 'success') {
          notify(res.message);
          const propName = getUrlPropByTipo(tipo);
          const updates = { [propName]: res.url };
          if (tipo === 'descarga3') {
            updates.FechaUltimaModificacion = new Date().toISOString();
          }
          setVales(prev => prev.map(v => v.NoVale === noVale ? { ...v, ...updates } : v));
          if (editingVale && editingVale.NoVale === noVale) setEditingVale(prev => ({ ...prev, ...updates }));
        } else {
          notify('Error al subir el archivo: ' + res.message, 'error');
        }
      } catch {
        notify('No se pudo subir el archivo. Revisa tu conexión con el backend.', 'error');
      } finally {
        setUploadingKey(null);
      }
    };
    input.click();
  };

  // handleProcesoChange solo queda para el modal de edición (campo FechaSalida, etc.)
  // Ya no cambia el proceso manualmente desde la tabla
  const handleProcesoChange = (noVale, proceso) => {
    // Solo permitido internamente (modal de edición)
    const updates = { Proceso: proceso };
    setVales(prev => prev.map(v => v.NoVale === noVale ? { ...v, ...updates } : v));
    if (editingVale && editingVale.NoVale === noVale) setEditingVale(prev => ({ ...prev, ...updates }));
    if (!SCRIPT_URL) return;
    fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'actualizarProcesoVale', noVale, proceso }),
    }).catch(() => notify('No se pudo guardar el cambio de proceso en el servidor.', 'error'));
  };

  const handleUpload = (noVale, tipo) => {
    const valeObj = vales.find(v => v.NoVale === noVale);
    if (valeObj && esValeOtroVale(valeObj)) {
      notify('⚠️ No se pueden subir archivos a un vale en estado "Otro Vale".', 'error');
      return;
    }


    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*/*';
    input.onchange = async (ev) => {
      const file = ev.target.files[0];
      if (!file) return;

      const key = `${noVale}-${tipo}`;
      setUploadingKey(key);

      if (!SCRIPT_URL) {
        setTimeout(() => {
          setUploadingKey(null);
          const propName = getUrlPropByTipo(tipo);
          const updates = { [propName]: URL.createObjectURL(file) };
          if (tipo === 'descarga3' || tipo === 'carga3') {
            updates.Proceso = 'Modificación 3';
            updates.FechaUltimaModificacion = new Date().toISOString();
          }
          setVales(prev => prev.map(v => v.NoVale === noVale ? { ...v, ...updates } : v));
          if (editingVale && editingVale.NoVale === noVale) setEditingVale(prev => ({ ...prev, ...updates }));
          notify(`Archivo "${file.name}" cargado localmente (Modo Demo).`);
        }, 600);
        return;
      }

      try {
        const base64 = await fileToBase64(file);
        const res = await fetch(SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'subirArchivoVale', datos: { noVale, tipo, base64, mimeType: file.type, fileName: file.name } }),
        }).then(r => r.json());

        if (res.status === 'success') {
          notify(res.message);
          const propName = getUrlPropByTipo(tipo);
          const updates = { [propName]: res.url };
          if (tipo === 'descarga3' || tipo === 'carga3') {
            updates.Proceso = 'Modificación 3';
            updates.FechaUltimaModificacion = new Date().toISOString();
          }
          setVales(prev => prev.map(v => v.NoVale === noVale ? { ...v, ...updates } : v));
          if (editingVale && editingVale.NoVale === noVale) setEditingVale(prev => ({ ...prev, ...updates }));
        } else {
          notify('Error al subir el archivo: ' + res.message, 'error');
        }
      } catch {
        notify('No se pudo subir el archivo. Revisa tu conexión con el backend.', 'error');
      } finally {
        setUploadingKey(null);
      }
    };
    input.click();
  };

  const procesoColor = (proceso, v) => {
    const estadoReal = v ? obtenerEstadoAutomatico(v) : proceso;
    if (estadoReal === 'Autorizado') return { color: '#059669', bg: 'rgba(5,150,105,0.15)', border: '1px solid #059669' };
    if (estadoReal === 'Otro Vale') return { color: '#1d4ed8', bg: 'rgba(29,78,216,0.12)', border: '1px solid #1d4ed8' };
    if (estadoReal === 'Entregado') return { color: '#16a34a', bg: 'rgba(22,163,74,0.12)', border: '1px solid #16a34a' };
    if (estadoReal === 'Tarde') return { color: '#dc2626', bg: 'rgba(220,38,38,0.12)', border: '1px solid #dc2626' };
    if (String(estadoReal || '').startsWith('Modificación')) return { color: '#7c3aed', bg: 'rgba(124,58,237,0.12)', border: '1px solid #7c3aed' };
    return { color: '#d97706', bg: 'rgba(217,119,6,0.12)', border: '1px solid #d97706' };
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {!SCRIPT_URL && (
        <div style={{ background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="fas fa-exclamation-triangle" style={{ color: '#d97706' }}></i>
          <span style={{ fontSize: '12px', color: '#92400e' }}>
            <strong>Modo demostración local:</strong> Los archivos y cambios se gestionan con URLs simuladas. Configura <code>SCRIPT_URL</code> para sincronizar con Google Drive real.
          </span>
        </div>
      )}

      {/* ENCABEZADO Y TABS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
            {isAdminOrDesign ? 'Módulo de Vales de Arte (Diseño)' : `Solicitudes de Vales: Tienda ${store}`}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            {isAdminOrDesign
              ? 'Control general de arte, 3 modificaciones permitidas (3 días hábiles) y carga de órdenes autorizadas.'
              : 'Solicita vales, revisa propuestas del diseñador, solicita hasta 3 modificaciones y autoriza.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ background: 'var(--bg-body)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-light)', display: 'flex' }}>
            <button
              onClick={() => setActiveTab('listado')}
              style={{
                padding: '6px 14px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                background: activeTab === 'listado' ? '#4f46e5' : 'transparent',
                color: activeTab === 'listado' ? '#fff' : 'var(--text-muted)',
              }}
            >
              <i className="fas fa-list" style={{ marginRight: '6px' }}></i> Listado General
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              style={{
                padding: '6px 14px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                background: activeTab === 'dashboard' ? '#4f46e5' : 'transparent',
                color: activeTab === 'dashboard' ? '#fff' : 'var(--text-muted)',
              }}
            >
              <i className="fas fa-chart-pie" style={{ marginRight: '6px' }}></i> Indicadores
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="topbar-btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
          >
            <i className="fas fa-plus"></i> Solicitar Nuevo Vale
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div className="card" style={{ padding: '20px', borderLeft: '4px solid #4f46e5' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Total Solicitados</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>{stats.total}</div>
            </div>
            <div className="card" style={{ padding: '20px', borderLeft: '4px solid #d97706' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>En Tiempo (≤ 3 días)</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>{stats.enTiempo}</div>
            </div>
            <div className="card" style={{ padding: '20px', borderLeft: '4px solid #7c3aed' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>En Modificación (1 a 3)</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#7c3aed', marginTop: '4px' }}>{stats.enModificacion}</div>
            </div>
            <div className="card" style={{ padding: '20px', borderLeft: '4px solid #059669' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Autorizados (Producción)</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#059669', marginTop: '4px' }}>{stats.autorizados}</div>
            </div>
            <div className="card" style={{ padding: '20px', borderLeft: '4px solid #dc2626' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Tarde o Congelados</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>{stats.tarde}</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'listado' && (
      <>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: '1 1 320px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <i className="fab fa-google-drive" style={{ fontSize: '22px', color: '#3b82f6' }}></i>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '13px' }}>Vales de Carga (Tiendas)</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Carpeta en Drive donde las tiendas suben solicitudes de vales de arte.</div>
          </div>
          {isAdminOrDesign && (
            <a href={CARPETA_CARGA_URL} target="_blank" rel="noreferrer" className="topbar-btn btn-outline" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>
              Abrir Carpeta
            </a>
          )}
        </div>
        <div className="card" style={{ flex: '1 1 320px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <i className="fab fa-google-drive" style={{ fontSize: '22px', color: '#16a34a' }}></i>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '13px' }}>Vales de Descarga (Diseño)</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Carpeta en Drive donde el diseñador sube las propuestas terminadas.</div>
          </div>
          {isAdminOrDesign && (
            <a href={CARPETA_DESCARGA_URL} target="_blank" rel="noreferrer" className="topbar-btn btn-outline" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>
              Abrir Carpeta
            </a>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)' }}>
          <div>
            <h3 className="card-title" style={{ fontSize: '14px', margin: 0 }}>Listado General de Vales de Arte</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Regla: 3 días hábiles para elaboración. Máximo 3 modificaciones.</span>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#4f46e5', background: 'rgba(79,70,229,0.1)', padding: '4px 10px', borderRadius: '20px' }}>
            {isLoading ? 'Cargando...' : `${valesVisibles.length} vales`}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-body)', textAlign: 'left' }}>
                {['No.', 'Tienda', 'No. Vale', 'Producto', 'Fecha Ingreso', 'Fecha Salida', 'Proceso / Estado', 'Subir Carga (Tiendas)', 'Subir Descarga (Diseñador)', 'Orden de Trabajo (Autorizado)', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', fontSize: '10px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {valesVisibles.map((v, idx) => {
                const estadoActual = obtenerEstadoAutomatico(v);
                const pc = procesoColor(estadoActual, v);
                const esOtroVale = esValeOtroVale(v);
                const hasAnyDescarga = Boolean(v.ArchivoDescargaUrl || v.ArchivoDescarga2Url || v.ArchivoDescarga3Url);
                const isStore = !isAdminOrDesign; // tienda / asesor

                // Slot activo de descarga para el diseñador
                let activeDescargaSlot = 'descarga';
                if (v.Proceso === 'Modificación 1') activeDescargaSlot = 'descarga2';
                else if (v.Proceso === 'Modificación 2' || v.Proceso === 'Modificación 3') activeDescargaSlot = 'descarga3';

                const cargandoCarga = uploadingKey === `${v.NoVale}-carga`;
                const cargandoDescarga = uploadingKey === `${v.NoVale}-${activeDescargaSlot}`;
                const cargandoOrden = uploadingKey === `${v.NoVale}-orden_trabajo`;

                // ¿Cuándo puede el asesor solicitar una modificación?
                // Solo si el diseñador acaba de subir un arte (estado=Entregado) o ya está en Mod pero el diseñador subió la siguiente propuesta
                const puedeSolicitarMod1 = estadoActual === 'Entregado' && !['Modificación 1','Modificación 2','Modificación 3'].includes(v.Proceso);
                const puedeSolicitarMod2 = v.Proceso === 'Modificación 1' && Boolean(v.ArchivoDescarga2Url);
                const puedeSolicitarMod3 = v.Proceso === 'Modificación 2' && Boolean(v.ArchivoDescarga3Url);
                const puedeSolicitar = isStore && !esOtroVale && estadoActual !== 'Autorizado' && (puedeSolicitarMod1 || puedeSolicitarMod2 || puedeSolicitarMod3);
                const numModLabel = puedeSolicitarMod3 ? '3/3' : puedeSolicitarMod2 ? '2/3' : '1/3';

                // ¿El diseñador puede subir descarga ahora?
                // Puede subir Prop1 siempre (si no está OtroVale/Autorizado)
                // Puede subir Prop2 solo cuando Proceso=Modificación 1 y aún no hay descarga2
                // Puede subir Prop3 solo cuando Proceso=Modificación 2 o 3 y aún no hay descarga3
                const diseñadorPuedeSubir = isAdminOrDesign && !esOtroVale && estadoActual !== 'Autorizado' &&
                  ((!v.ArchivoDescargaUrl && activeDescargaSlot === 'descarga') ||
                   (v.Proceso === 'Modificación 1' && !v.ArchivoDescarga2Url && activeDescargaSlot === 'descarga2') ||
                   ((v.Proceso === 'Modificación 2' || v.Proceso === 'Modificación 3') && !v.ArchivoDescarga3Url && activeDescargaSlot === 'descarga3'));

                const rowBg = esOtroVale ? '#eff6ff' : estadoActual === 'Autorizado' ? '#ecfdf5' : 'transparent';

                return (
                  <tr key={v.NoVale} style={{ borderTop: '1px solid var(--border-light)', background: rowBg }}>
                    <td style={{ padding: '12px 14px', fontSize: '12px' }}>{idx + 1}</td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', fontWeight: 700, color: '#4f46e5' }}>{v.Tienda}</td>
                    <td style={{ padding: '12px 14px', fontSize: '12px', fontWeight: 700 }}>{v.NoVale}</td>
                    <td style={{ padding: '12px 14px', fontSize: '12px' }}>{v.Producto}</td>
                    <td style={{ padding: '12px 14px', fontSize: '12px' }}>{v.FechaIngreso}</td>
                    <td style={{ padding: '12px 14px', fontSize: '12px' }}>{v.FechaSalida || '—'}</td>

                    {/* ESTADO: siempre automático, solo muestra la etiqueta */}
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, padding: '5px 10px', borderRadius: '6px', color: pc.color, background: pc.bg, border: pc.border, textTransform: 'uppercase', display: 'inline-block', whiteSpace: 'nowrap' }}>
                        {esOtroVale ? '📋 OTRO VALE' : estadoActual}
                      </span>
                    </td>

                    {/* CARGA: solo 1 archivo, botón Reemplazar solo para tienda/asesor */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {v.ArchivoCargaUrl && (
                          <a href={v.ArchivoCargaUrl} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#3b82f6', fontWeight: 700, textDecoration: 'none' }}>
                            <i className="fas fa-file"></i> Carga del Vale
                          </a>
                        )}
                        {/* Subir/Reemplazar: disponible para tienda siempre que no sea OtroVale/Autorizado */}
                        {isStore && !esOtroVale && estadoActual !== 'Autorizado' && (
                          <button
                            onClick={() => handleUpload(v.NoVale, 'carga')}
                            disabled={cargandoCarga}
                            className="topbar-btn btn-outline"
                            style={{ fontSize: '10px', padding: '3px 8px', color: '#3b82f6', borderColor: '#3b82f6', alignSelf: 'flex-start', marginTop: '2px' }}
                          >
                            {cargandoCarga ? 'Subiendo...' : (v.ArchivoCargaUrl ? '+ Reemplazar' : '+ Subir Carga')}
                          </button>
                        )}
                        {/* Admin/Diseño solo puede ver, no reemplazar */}
                        {isAdminOrDesign && !v.ArchivoCargaUrl && (
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Sin archivo</span>
                        )}
                      </div>
                    </td>

                    {/* DESCARGAS: 3 propuestas del diseñador */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {v.ArchivoDescargaUrl && (
                          <a href={v.ArchivoDescargaUrl} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700, textDecoration: 'none' }}>
                            <i className="fas fa-check-circle"></i> Arte 1
                          </a>
                        )}
                        {v.ArchivoDescarga2Url && (
                          <a href={v.ArchivoDescarga2Url} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#7c3aed', fontWeight: 700, textDecoration: 'none' }}>
                            <i className="fas fa-check-circle"></i> Arte Mod. 1
                          </a>
                        )}
                        {v.ArchivoDescarga3Url && (
                          <a href={v.ArchivoDescarga3Url} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#d97706', fontWeight: 700, textDecoration: 'none' }}>
                            <i className="fas fa-check-circle"></i> Arte Mod. 2
                          </a>
                        )}
                        {/* Botón de subida para diseñador según el slot activo */}
                        {diseñadorPuedeSubir && (
                          <button
                            onClick={() => handleUploadDescargar(v.NoVale, activeDescargaSlot)}
                            disabled={cargandoDescarga}
                            className="topbar-btn btn-outline"
                            style={{ fontSize: '10px', padding: '3px 8px', color: '#16a34a', borderColor: '#16a34a', alignSelf: 'flex-start', marginTop: '2px' }}
                          >
                            {cargandoDescarga ? 'Subiendo...' : `+ Subir Arte ${activeDescargaSlot === 'descarga3' ? '3' : activeDescargaSlot === 'descarga2' ? '2' : '1'}`}
                          </button>
                        )}
                        {!hasAnyDescarga && isStore && (
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>En diseño...</span>
                        )}
                      </div>
                    </td>

                    {/* ORDEN DE TRABAJO: solo si Autorizado */}
                    <td style={{ padding: '12px 14px' }}>
                      {estadoActual === 'Autorizado' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {v.ArchivoOrdenTrabajoUrl ? (
                            <a href={v.ArchivoOrdenTrabajoUrl} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#059669', fontWeight: 800, textDecoration: 'none' }}>
                              <i className="fas fa-file-contract"></i> Ver Orden Trabajo
                            </a>
                          ) : (
                            <span style={{ fontSize: '10px', color: '#d97706', fontWeight: 700 }}>Falta subir OT</span>
                          )}
                          <button
                            onClick={() => handleUpload(v.NoVale, 'orden_trabajo')}
                            disabled={cargandoOrden}
                            className="topbar-btn btn-primary"
                            style={{ fontSize: '10px', padding: '4px 8px', background: '#059669', alignSelf: 'flex-start' }}
                          >
                            {cargandoOrden ? 'Subiendo OT...' : v.ArchivoOrdenTrabajoUrl ? 'Reemplazar OT' : '📄 Subir Orden Trabajo'}
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#cbd5e1' }}>Requiere Autorización</span>
                      )}
                    </td>

                    {/* ACCIONES */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setEditingVale({ ...v })}
                          className="topbar-btn btn-outline"
                          style={{ fontSize: '11px', padding: '4px 10px', color: '#4f46e5', borderColor: '#4f46e5', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <i className="fas fa-folder-open"></i> Detalle
                        </button>

                        {/* Botón Autorizar: solo asesor/tienda, cuando Entregado o en Modificación con arte disponible */}
                        {isStore && !esOtroVale && hasAnyDescarga && estadoActual !== 'Autorizado' && (
                          <button
                            onClick={() => handleAutorizar(v.NoVale)}
                            className="topbar-btn btn-outline"
                            style={{ fontSize: '11px', padding: '4px 10px', color: '#059669', borderColor: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <i className="fas fa-check"></i> Autorizar
                          </button>
                        )}

                        {/* Botón Solicitar Modificación: solo asesor/tienda cuando corresponde */}
                        {puedeSolicitar && (
                          <button
                            onClick={() => handleSolicitarModificacion(v.NoVale)}
                            className="topbar-btn btn-outline"
                            style={{ fontSize: '11px', padding: '4px 10px', color: '#d97706', borderColor: '#d97706', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <i className="fas fa-edit"></i> Mod. {numModLabel}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {valesVisibles.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                    No hay vales de arte registrados todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* MODAL SOLICITAR VALE */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(30,41,59,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ width: '480px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
              <div>
                <h3 className="card-title" style={{ fontSize: '16px', margin: 0 }}>Solicitud de Nuevo Vale de Arte</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sube tu archivo de referencia y selecciona el producto</span>
              </div>
              <button onClick={() => { setIsModalOpen(false); setFilesToUpload([]); }} style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
            </div>

            <form onSubmit={handleSolicitarVale} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Tienda Solicitante
                </label>
                {isAdminOrDesign ? (
                  <select
                    value={nuevoVale.tienda}
                    onChange={(e) => setNuevoVale({ ...nuevoVale, tienda: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-body)', fontSize: '13px' }}
                  >
                    {STORES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <input
                    type="text"
                    disabled
                    value={store}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: '#f8fafc', color: '#64748b', fontWeight: 700, fontSize: '13px' }}
                  />
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  No. de Vale (Opcional - Se genera auto)
                </label>
                <input
                  type="text"
                  placeholder={`Ej: VAL-${String(vales.length + 1).padStart(3, '0')}`}
                  value={nuevoVale.noVale}
                  onChange={(e) => setNuevoVale({ ...nuevoVale, noVale: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-body)', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Tipo de Producto *
                </label>
                <select
                  value={nuevoVale.producto}
                  onChange={(e) => setNuevoVale({ ...nuevoVale, producto: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-body)', fontSize: '13px' }}
                >
                  {PRODUCTOS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Fecha de Salida Estimada (Opcional)
                </label>
                <input
                  type="date"
                  value={nuevoVale.fechaSalida}
                  onChange={(e) => setNuevoVale({ ...nuevoVale, fechaSalida: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-body)', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Archivo de Referencia (Carga Inicial)
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const files = Array.from(e.dataTransfer.files);
                    if (files.length > 0) setFilesToUpload(prev => [...prev, ...files]);
                  }}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '*/*';
                    input.multiple = true;
                    input.onchange = (ev) => {
                      const files = Array.from(ev.target.files);
                      if (files.length > 0) setFilesToUpload(prev => [...prev, ...files]);
                    };
                    input.click();
                  }}
                  style={{
                    border: isDragOver ? '2px dashed #4f46e5' : '2px dashed var(--border-light)',
                    background: isDragOver ? '#f3f2ff' : 'var(--bg-body)',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <i className="fas fa-cloud-upload-alt" style={{ fontSize: '24px', color: filesToUpload.length > 0 ? '#4f46e5' : 'var(--text-muted)', marginBottom: '8px' }}></i>
                  <p style={{ margin: 0, fontSize: '12px', fontWeight: filesToUpload.length > 0 ? '700' : '500', color: filesToUpload.length > 0 ? '#4f46e5' : 'var(--text-muted)' }}>
                    {filesToUpload.length > 0 ? `Seleccionados ${filesToUpload.length} archivo(s)` : 'Arrastra tus archivos aquí o haz clic para seleccionarlos'}
                  </p>
                  {filesToUpload.length > 0 && (
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }} onClick={(e) => e.stopPropagation()}>
                      {filesToUpload.map((f, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-light)' }}>
                          <span style={{ fontSize: '11px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '240px' }}>📄 {f.name}</span>
                          <button type="button" onClick={() => setFilesToUpload(prev => prev.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '11px' }}>Quitar</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '14px' }}>
                <button type="button" className="topbar-btn btn-outline" disabled={isCreating} onClick={() => { setIsModalOpen(false); setFilesToUpload([]); }}>Cancelar</button>
                <button type="submit" className="topbar-btn btn-primary" disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                      Procesando...
                    </>
                  ) : 'Solicitar Vale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALLE Y GESTIÓN DE HISTORIAL / MODIFICACIONES */}
      {editingVale && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(30,41,59,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="card" style={{ width: '680px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
              <div>
                <h3 className="card-title" style={{ fontSize: '16px', margin: 0, color: '#4f46e5' }}>Gestión Integral del Vale: {editingVale.NoVale}</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tienda: <strong>{editingVale.Tienda}</strong> | Producto: <strong>{editingVale.Producto}</strong></span>
              </div>
              <button onClick={() => setEditingVale(null)} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
            </div>

            {esValeOtroVale(editingVale) && (
              <div style={{ background: '#eff6ff', border: '1px solid #3b82f6', borderRadius: '8px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fas fa-clipboard-list" style={{ color: '#3b82f6', fontSize: '20px' }}></i>
                <div style={{ fontSize: '12px', color: '#1e40af' }}>
                  <strong>OTRO VALE:</strong> Se alcanzó o superó la 3ra modificación y el plazo de 24 horas sin autorización. El vale está en estado Otro Vale.
                </div>
              </div>
            )}

            <form onSubmit={handleGuardarEdicion} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-light)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Estado / Proceso Actual
                  </label>
                  <select
                    value={editingVale.Proceso || 'en tiempo'}
                    disabled={esValeOtroVale(editingVale) && !isAdminOrDesign}
                    onChange={(e) => setEditingVale({ ...editingVale, Proceso: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: '#fff', fontSize: '13px', fontWeight: 700 }}
                  >
                    {PROCESOS.map(p => {
                      const hasAnyDescarga = Boolean(editingVale.ArchivoDescargaUrl || editingVale.ArchivoDescarga2Url || editingVale.ArchivoDescarga3Url);
                      return <option key={p} value={p} disabled={p === 'Autorizado' && !hasAnyDescarga}>{p}</option>;
                    })}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Fecha Salida Estimada
                  </label>
                  <input
                    type="date"
                    disabled={esValeOtroVale(editingVale) && !isAdminOrDesign}
                    value={editingVale.FechaSalida || ''}
                    onChange={(e) => setEditingVale({ ...editingVale, FechaSalida: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: '#fff', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 10px 0' }}>
                  📂 1. Archivo de Carga / Referencia de Tienda (Único)
                </h4>
                <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#3b82f6' }}>Carga Inicial del Vale</span>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Archivo u orden de trabajo enviado originalmente por la tienda</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {editingVale.ArchivoCargaUrl ? (
                      <a href={editingVale.ArchivoCargaUrl} target="_blank" rel="noreferrer" className="topbar-btn btn-outline" style={{ fontSize: '11px', color: '#3b82f6' }}>Ver Carga del Vale</a>
                    ) : null}
                    {!esValeOtroVale(editingVale) && (
                      <button type="button" onClick={() => handleUpload(editingVale.NoVale, 'carga')} className="topbar-btn btn-outline" style={{ fontSize: '11px' }}>
                        {editingVale.ArchivoCargaUrl ? '+ Reemplazar Carga' : '+ Subir Carga'}
                      </button>
                    )}
                  </div>
                </div>

                <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 10px 0', display: 'flex', justifyContent: 'space-between' }}>
                  <span>🎨 2. Historial de Propuestas del Diseñador (3 Descargas)</span>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Plazo de elaboración: 3 días hábiles</span>
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a' }}>1. Propuesta de Arte 1</span>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Primera propuesta entregada por el equipo de diseño</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {editingVale.ArchivoDescargaUrl ? (
                        <a href={editingVale.ArchivoDescargaUrl} target="_blank" rel="noreferrer" className="topbar-btn btn-outline" style={{ fontSize: '11px', color: '#16a34a' }}>Ver Arte 1</a>
                      ) : isAdminOrDesign ? (
                        <button type="button" onClick={() => handleUpload(editingVale.NoVale, 'descarga')} className="topbar-btn btn-outline" style={{ fontSize: '11px', color: '#16a34a', borderColor: '#16a34a' }}>+ Subir Arte 1</button>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#94a3b8', alignSelf: 'center' }}>En elaboración...</span>
                      )}
                    </div>
                  </div>

                  <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: editingVale.Proceso === 'Modificación 1' ? '#f3f2ff' : '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#7c3aed' }}>2. Propuesta de Arte Mod. 1 (Descarga 2)</span>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Segunda propuesta tras solicitar la primera modificación</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {editingVale.ArchivoDescarga2Url ? (
                        <a href={editingVale.ArchivoDescarga2Url} target="_blank" rel="noreferrer" className="topbar-btn btn-outline" style={{ fontSize: '11px', color: '#16a34a' }}>Ver Arte Mod 1</a>
                      ) : isAdminOrDesign && !esValeOtroVale(editingVale) ? (
                        <button type="button" onClick={() => handleUpload(editingVale.NoVale, 'descarga2')} className="topbar-btn btn-outline" style={{ fontSize: '11px', color: '#16a34a', borderColor: '#16a34a' }}>+ Subir Arte 2</button>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#94a3b8', alignSelf: 'center' }}>Pendiente</span>
                      )}
                    </div>
                  </div>

                  <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', background: (editingVale.Proceso === 'Modificación 2' || editingVale.Proceso === 'Modificación 3') ? '#fffbeb' : '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#d97706' }}>3. Propuesta de Arte Mod. 2 / 3 (Descarga 3 - Última)</span>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tercera propuesta (Límite antes del congelamiento)</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {editingVale.ArchivoDescarga3Url ? (
                        <a href={editingVale.ArchivoDescarga3Url} target="_blank" rel="noreferrer" className="topbar-btn btn-outline" style={{ fontSize: '11px', color: '#16a34a' }}>Ver Arte Final 3</a>
                      ) : isAdminOrDesign && !esValeOtroVale(editingVale) ? (
                        <button type="button" onClick={() => handleUpload(editingVale.NoVale, 'descarga3')} className="topbar-btn btn-outline" style={{ fontSize: '11px', color: '#16a34a', borderColor: '#16a34a' }}>+ Subir Arte 3</button>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#94a3b8', alignSelf: 'center' }}>Pendiente</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ background: editingVale.Proceso === 'Autorizado' ? '#ecfdf5' : '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid ' + (editingVale.Proceso === 'Autorizado' ? '#10b981' : 'var(--border-light)'), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: editingVale.Proceso === 'Autorizado' ? '#065f46' : 'var(--text-main)' }}>
                    📄 Orden de Trabajo para Solicitar Producción
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {editingVale.Proceso === 'Autorizado'
                      ? 'El vale ha sido aprobado por el cliente. Sube la Orden de Trabajo firmada o generada para enviar a planta.'
                      : 'Esta opción se habilita cuando el estado del vale cambia a "Autorizado".'}
                  </div>
                </div>

                <div>
                  {editingVale.Proceso === 'Autorizado' ? (
                    editingVale.ArchivoOrdenTrabajoUrl ? (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <a href={editingVale.ArchivoOrdenTrabajoUrl} target="_blank" rel="noreferrer" className="topbar-btn btn-primary" style={{ background: '#059669', fontSize: '12px' }}>
                          <i className="fas fa-download"></i> Ver Orden de Trabajo
                        </a>
                        <button type="button" onClick={() => handleUpload(editingVale.NoVale, 'orden_trabajo')} className="topbar-btn btn-outline" style={{ fontSize: '11px' }}>
                          Reemplazar
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => handleUpload(editingVale.NoVale, 'orden_trabajo')} className="topbar-btn btn-primary" style={{ background: '#059669', fontSize: '12px' }}>
                        <i className="fas fa-upload"></i> Subir Orden de Trabajo
                      </button>
                    )
                  ) : (
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', background: '#e2e8f0', padding: '6px 12px', borderRadius: '6px' }}>
                      Requiere Estado: Autorizado
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', borderTop: '1px solid var(--border-light)', paddingTop: '14px' }}>
                <button type="button" onClick={handleEliminarVale} className="topbar-btn btn-outline" style={{ padding: '8px 16px', color: '#ef4444', borderColor: '#ef4444' }}>
                  <i className="fas fa-trash-alt"></i> Eliminar Vale
                </button>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={() => setEditingVale(null)} className="topbar-btn btn-outline" style={{ padding: '8px 16px' }}>
                    Cerrar
                  </button>
                  <button type="submit" className="topbar-btn btn-primary" style={{ padding: '8px 20px', background: '#4f46e5', color: '#fff' }}>
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {isBackendConnected && (
        <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '10px' }}>
          <i className="fas fa-check-circle" style={{ color: '#16a34a' }}></i> Conectado al backend de Google Drive.
        </p>
      )}
    </div>
  );
}
